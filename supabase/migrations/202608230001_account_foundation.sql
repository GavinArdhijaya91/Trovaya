begin;

create table if not exists public.account_profiles (
  account_id uuid primary key references auth.users(id) on delete cascade,
  locale text not null default 'id-ID',
  notification_preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_profiles_locale_length check (char_length(locale) between 2 and 35),
  constraint account_profiles_notification_object check (jsonb_typeof(notification_preferences) = 'object')
);

create table if not exists public.creator_profiles (
  account_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  biography text,
  creator_category text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint creator_profiles_display_name_length check (display_name is null or char_length(display_name) between 1 and 80),
  constraint creator_profiles_biography_length check (biography is null or char_length(biography) <= 500)
);

create table if not exists public.linked_wallets (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references auth.users(id) on delete cascade,
  wallet_address varchar(42) not null,
  chain_namespace text not null default 'eip155',
  verified_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint linked_wallets_lowercase_address check (wallet_address = lower(wallet_address)),
  constraint linked_wallets_evm_address check (wallet_address ~ '^0x[0-9a-f]{40}$'),
  constraint linked_wallets_revocation_order check (revoked_at is null or revoked_at >= verified_at),
  unique (chain_namespace, wallet_address)
);

create index if not exists idx_linked_wallets_account
  on public.linked_wallets(account_id) where revoked_at is null;

create table if not exists public.wallet_link_challenges (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references auth.users(id) on delete cascade,
  wallet_address varchar(42) not null,
  nonce_hash text not null unique,
  statement text not null,
  chain_id integer not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  failed_attempts smallint not null default 0,
  created_at timestamptz not null default now(),
  constraint wallet_link_challenges_lowercase_address check (wallet_address = lower(wallet_address)),
  constraint wallet_link_challenges_evm_address check (wallet_address ~ '^0x[0-9a-f]{40}$'),
  constraint wallet_link_challenges_nonce_hash check (nonce_hash ~ '^[0-9a-f]{64}$'),
  constraint wallet_link_challenges_statement_length check (char_length(statement) between 1 and 500),
  constraint wallet_link_challenges_chain check (chain_id > 0),
  constraint wallet_link_challenges_expiry check (expires_at > created_at and expires_at <= created_at + interval '10 minutes'),
  constraint wallet_link_challenges_attempts check (failed_attempts between 0 and 5),
  constraint wallet_link_challenges_consumption_order check (consumed_at is null or consumed_at >= created_at)
);

create unique index if not exists idx_wallet_link_challenges_active
  on public.wallet_link_challenges(account_id, wallet_address) where consumed_at is null;
create index if not exists idx_wallet_link_challenges_expiry
  on public.wallet_link_challenges(expires_at) where consumed_at is null;

create table if not exists public.account_audit_events (
  id bigint generated always as identity primary key,
  account_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  actor_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  constraint account_audit_events_type_length check (char_length(event_type) between 3 and 80),
  constraint account_audit_events_actor check (actor_type in ('account', 'system', 'admin')),
  constraint account_audit_events_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index if not exists idx_account_audit_events_account_time
  on public.account_audit_events(account_id, occurred_at desc);

create or replace function public.set_account_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_account_profiles_updated_at on public.account_profiles;
create trigger set_account_profiles_updated_at before update on public.account_profiles
for each row execute function public.set_account_updated_at();
drop trigger if exists set_creator_profiles_updated_at on public.creator_profiles;
create trigger set_creator_profiles_updated_at before update on public.creator_profiles
for each row execute function public.set_account_updated_at();

create or replace function public.initialize_trovaya_account()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.account_profiles (account_id) values (new.id) on conflict (account_id) do nothing;
  insert into public.creator_profiles (account_id) values (new.id) on conflict (account_id) do nothing;
  return new;
end;
$$;

drop trigger if exists initialize_trovaya_account on auth.users;
create trigger initialize_trovaya_account after insert on auth.users
for each row execute function public.initialize_trovaya_account();

insert into public.account_profiles (account_id) select id from auth.users on conflict (account_id) do nothing;
insert into public.creator_profiles (account_id) select id from auth.users on conflict (account_id) do nothing;

alter table public.account_profiles enable row level security;
alter table public.creator_profiles enable row level security;
alter table public.linked_wallets enable row level security;
alter table public.wallet_link_challenges enable row level security;
alter table public.account_audit_events enable row level security;

revoke all on table public.account_profiles from public, anon, authenticated;
revoke all on table public.creator_profiles from public, anon, authenticated;
revoke all on table public.linked_wallets from public, anon, authenticated;
revoke all on table public.wallet_link_challenges from public, anon, authenticated;
revoke all on table public.account_audit_events from public, anon, authenticated;
revoke all on sequence public.account_audit_events_id_seq from public, anon, authenticated;
revoke execute on function public.set_account_updated_at() from public, anon, authenticated;
revoke execute on function public.initialize_trovaya_account() from public, anon, authenticated;

grant select, update (locale, notification_preferences) on table public.account_profiles to authenticated;
grant select on table public.creator_profiles to anon, authenticated;
grant update (display_name, avatar_url, biography, creator_category, is_public) on table public.creator_profiles to authenticated;
grant select on table public.linked_wallets to authenticated;

drop policy if exists account_profiles_owner_read on public.account_profiles;
create policy account_profiles_owner_read on public.account_profiles for select to authenticated
using (
  (select auth.uid()) = account_id
  and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) = false
);
drop policy if exists account_profiles_owner_update on public.account_profiles;
create policy account_profiles_owner_update on public.account_profiles for update to authenticated
using (
  (select auth.uid()) = account_id
  and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) = false
)
with check (
  (select auth.uid()) = account_id
  and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) = false
);

drop policy if exists creator_profiles_public_read on public.creator_profiles;
create policy creator_profiles_public_read on public.creator_profiles for select to anon, authenticated
using (
  is_public
  or (
    (select auth.uid()) = account_id
    and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) = false
  )
);
drop policy if exists creator_profiles_owner_update on public.creator_profiles;
create policy creator_profiles_owner_update on public.creator_profiles for update to authenticated
using (
  (select auth.uid()) = account_id
  and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) = false
)
with check (
  (select auth.uid()) = account_id
  and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) = false
);

drop policy if exists linked_wallets_owner_read on public.linked_wallets;
create policy linked_wallets_owner_read on public.linked_wallets for select to authenticated
using (
  (select auth.uid()) = account_id
  and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) = false
);

comment on table public.account_profiles is 'Private account preferences. Email and sessions remain owned by Supabase auth.';
comment on table public.creator_profiles is 'Explicitly public creator fields, readable only when is_public is true or by the owner.';
comment on table public.linked_wallets is 'Wallet ownership verified by a server-side short-lived signed challenge. Client writes are forbidden.';
comment on table public.wallet_link_challenges is 'Server-only hashed nonces for wallet linking. Never expose nonce hashes through PostgREST.';
comment on table public.account_audit_events is 'Server-only append-only security audit events. Never store raw OTPs, tokens, or identity documents.';

commit;
