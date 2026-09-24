begin;

-- Fix: co_purchase_members boleh dibaca publik hanya untuk circle yang
-- terbuka/berjalan (OPEN, LOCKED, PURCHASED), selaras dengan policy
-- circles_open_read pada tabel induk. Sebelumnya using (true) membocorkan
-- member_wallet + share_wei untuk circle CANCELLED dan member REMOVED.
drop policy if exists circle_members_read on co_purchase_members;
create policy circle_members_read
  on co_purchase_members for select to public
  using (
    co_purchase_members.status <> 'REMOVED'
    and exists (
      select 1 from co_purchase_circles c
      where c.id = co_purchase_members.circle_id
        and c.status in ('OPEN', 'LOCKED', 'PURCHASED')
    )
  );

-- share_wei (nominal iuran tiap member) tidak dibutuhkan UI publik:
-- GET /api/co-purchase hanya select member_wallet (anon), dan
-- GET /api/co-purchase/mine memakai service_role. Batasi anon/authenticated
-- ke kolom non-nominal, mengikuti pola 003_public_gallery_boundary.sql.
do $member_grants$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on table co_purchase_members from anon;
    grant select (circle_id, member_wallet, status, joined_at)
      on table co_purchase_members to anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on table co_purchase_members from authenticated;
    grant select (circle_id, member_wallet, status, joined_at)
      on table co_purchase_members to authenticated;
  end if;
end
$member_grants$;

-- Proyeksi publik allowlisted tanpa share_wei untuk UI "siapa aja yg gabung".
drop view if exists public_circle_members;
create view public_circle_members
with (security_invoker = true, security_barrier = true)
as
select
  m.circle_id,
  m.member_wallet,
  m.status,
  m.joined_at
from co_purchase_members m
join co_purchase_circles c on c.id = m.circle_id
where c.status in ('OPEN', 'LOCKED', 'PURCHASED')
  and m.status <> 'REMOVED';

revoke all on table public_circle_members from public;

do $view_grants$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on table public_circle_members to anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on table public_circle_members to authenticated;
  end if;
end
$view_grants$;

comment on view public_circle_members is
  'Allowlisted public projection of co-purchase membership (no share_wei). Never add share_wei or identity fields.';

commit;
