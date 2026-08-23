begin;

alter table users enable row level security;
alter table ip_assets enable row level security;
alter table licenses enable row level security;
alter table indexer_cursors enable row level security;

revoke all on table users from public;
revoke all on table ip_assets from public;
revoke all on table licenses from public;
revoke all on table indexer_cursors from public;

drop policy if exists public_gallery_read on ip_assets;
create policy public_gallery_read
  on ip_assets
  for select
  to public
  using (status = 'MINTED');

do $policy_grants$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on table users, ip_assets, licenses, indexer_cursors from anon;
    grant select (
      id, chain_id, token_id, creator_wallet, allow_ai_training,
      public_poisoned_cid, commercial_license_fee_wei, token_uri, status, created_at
    ) on table ip_assets to anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on table users, ip_assets, licenses, indexer_cursors from authenticated;
    grant select (
      id, chain_id, token_id, creator_wallet, allow_ai_training,
      public_poisoned_cid, commercial_license_fee_wei, token_uri, status, created_at
    ) on table ip_assets to authenticated;
  end if;
end
$policy_grants$;

drop view if exists public_gallery_assets;
create view public_gallery_assets
with (security_invoker = true, security_barrier = true)
as
select
  id,
  chain_id,
  token_id::text as token_id,
  creator_wallet,
  allow_ai_training,
  public_poisoned_cid,
  commercial_license_fee_wei::text as commercial_license_fee_wei,
  token_uri,
  status,
  created_at
from ip_assets
where status = 'MINTED';

revoke all on table public_gallery_assets from public;

do $view_grants$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on table public_gallery_assets to anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on table public_gallery_assets to authenticated;
  end if;
end
$view_grants$;

comment on view public_gallery_assets is
  'Allowlisted public projection. Never add encrypted vault, identity, session, or key-delivery fields.';

commit;
