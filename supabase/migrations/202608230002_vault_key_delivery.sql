begin;

create table if not exists public.vault_key_records (
  id uuid primary key default gen_random_uuid(),
  chain_id integer not null check (chain_id > 0),
  token_id numeric(78) not null check (token_id >= 0),
  creator_wallet varchar(42) not null check (creator_wallet = lower(creator_wallet) and creator_wallet ~ '^0x[0-9a-f]{40}$'),
  encrypted_key text not null,
  encryption_iv text not null,
  auth_tag text not null,
  key_version integer not null default 1 check (key_version > 0),
  status text not null default 'active' check (status in ('active', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (chain_id, token_id)
);

create table if not exists public.vault_delivery_challenges (
  id uuid primary key default gen_random_uuid(),
  chain_id integer not null check (chain_id > 0),
  token_id numeric(78) not null check (token_id >= 0),
  wallet_address varchar(42) not null check (wallet_address = lower(wallet_address) and wallet_address ~ '^0x[0-9a-f]{40}$'),
  purpose text not null check (purpose in ('register_key', 'deliver_key')),
  message_hash text not null unique check (message_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  failed_attempts smallint not null default 0 check (failed_attempts between 0 and 5),
  created_at timestamptz not null default now(),
  check (expires_at > created_at and expires_at <= created_at + interval '5 minutes'),
  check (consumed_at is null or consumed_at >= created_at)
);
create index if not exists idx_vault_challenge_lookup
  on public.vault_delivery_challenges(id, wallet_address, purpose) where consumed_at is null;

create table if not exists public.vault_delivery_audit (
  id bigint generated always as identity primary key,
  chain_id integer not null,
  token_id numeric(78) not null,
  wallet_address varchar(42) not null,
  action text not null check (action in ('key_registered', 'key_delivered', 'delivery_denied', 'key_revoked')),
  reason text,
  occurred_at timestamptz not null default now()
);

create or replace function public.audit_vault_key_registration()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.vault_delivery_audit(chain_id, token_id, wallet_address, action)
  values (new.chain_id, new.token_id, new.creator_wallet, 'key_registered');
  return new;
end;
$$;

drop trigger if exists vault_key_registration_audit on public.vault_key_records;
create trigger vault_key_registration_audit
after insert on public.vault_key_records
for each row execute function public.audit_vault_key_registration();

alter table public.vault_key_records enable row level security;
alter table public.vault_delivery_challenges enable row level security;
alter table public.vault_delivery_audit enable row level security;
revoke all on table public.vault_key_records from public, anon, authenticated;
revoke all on table public.vault_delivery_challenges from public, anon, authenticated;
revoke all on table public.vault_delivery_audit from public, anon, authenticated;
revoke all on sequence public.vault_delivery_audit_id_seq from public, anon, authenticated;
revoke all on function public.audit_vault_key_registration() from public, anon, authenticated;

comment on table public.vault_key_records is 'Server-only AES-GCM-wrapped content keys. Plaintext keys are forbidden.';
comment on table public.vault_delivery_challenges is 'Server-only single-use wallet signature challenges; only message hashes are stored.';
comment on table public.vault_delivery_audit is 'Append-only delivery outcomes without raw keys, signatures, nonces, or public keys.';

commit;
