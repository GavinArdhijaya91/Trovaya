begin;

-- Grup patungan ala Steam Family: 3-5 orang, harga tetap dari kreator,
-- eksekusi on-chain tetap 1x purchase oleh ketua, split dicatat off-chain.
create table if not exists co_purchase_circles (
  id uuid primary key default gen_random_uuid(),
  chain_id integer not null,
  token_id numeric(78) not null,
  leader_wallet varchar(42) not null references users(wallet_address),
  target_fee_wei numeric(78) not null check (target_fee_wei > 0),
  max_members integer not null default 5 check (max_members between 3 and 5),
  status varchar(20) not null default 'OPEN' check (status in ('OPEN', 'LOCKED', 'PURCHASED', 'CANCELLED')),
  onchain_tx_hash varchar(66),
  created_at timestamptz not null default now()
);

create table if not exists co_purchase_members (
  circle_id uuid not null references co_purchase_circles(id) on delete cascade,
  member_wallet varchar(42) not null references users(wallet_address),
  share_wei numeric(78) not null check (share_wei > 0),
  status varchar(20) not null default 'JOINED' check (status in ('JOINED', 'PAID_OFFCHAIN', 'REMOVED')),
  joined_at timestamptz not null default now(),
  primary key (circle_id, member_wallet)
);

create index if not exists idx_circles_asset on co_purchase_circles(chain_id, token_id, status);
create index if not exists idx_circle_members on co_purchase_members(circle_id);

alter table co_purchase_circles enable row level security;
alter table co_purchase_members enable row level security;

revoke all on table co_purchase_circles from public;
revoke all on table co_purchase_members from public;

-- Publik boleh lihat grup OPEN agar teman bisa gabung via link.
drop policy if exists circles_open_read on co_purchase_circles;
create policy circles_open_read
  on co_purchase_circles for select to public
  using (status in ('OPEN', 'LOCKED', 'PURCHASED'));

drop policy if exists circle_members_read on co_purchase_members;
create policy circle_members_read
  on co_purchase_members for select to public
  using (true);

-- Write tetap lewat service_role / backend; anon & authenticated read-only.
do $grants$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on table co_purchase_circles, co_purchase_members from anon;
    grant select on table co_purchase_circles, co_purchase_members to anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on table co_purchase_circles, co_purchase_members from authenticated;
    grant select on table co_purchase_circles, co_purchase_members to authenticated;
  end if;
end
$grants$;

comment on table co_purchase_circles is
  'Steam-Family-style co-buy: max 3-5 members, single on-chain purchase by leader, off-chain split.';
comment on column co_purchase_circles.target_fee_wei is
  'Snapshot commercial_license_fee_wei saat grup dibuat; harga kreator tidak berubah.';

commit;
