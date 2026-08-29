begin;

alter table ip_assets add column if not exists license_terms_uri text;
alter table ip_assets add column if not exists license_terms_hash varchar(66);
alter table ip_assets add column if not exists license_terms_version integer;
alter table ip_assets add column if not exists license_duration_seconds bigint;
alter table licenses add column if not exists accepted_terms_uri text;
alter table licenses add column if not exists accepted_terms_hash varchar(66);
alter table licenses add column if not exists accepted_terms_version integer;

drop view if exists public_gallery_assets;

do $grants$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select (license_terms_uri, license_terms_hash, license_terms_version, license_duration_seconds) on ip_assets to anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select (license_terms_uri, license_terms_hash, license_terms_version, license_duration_seconds) on ip_assets to authenticated;
  end if;
end
$grants$;

create view public_gallery_assets
with (security_invoker = true, security_barrier = true)
as
select
  id, chain_id, token_id::text as token_id, creator_wallet, allow_ai_training,
  public_poisoned_cid, commercial_license_fee_wei::text as commercial_license_fee_wei,
  token_uri, license_terms_uri, license_terms_hash, license_terms_version,
  license_duration_seconds::text as license_duration_seconds,
  status, created_at
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
  'Allowlisted public projection including immutable public license terms; never expose vault, identity, session, or key material.';

commit;
