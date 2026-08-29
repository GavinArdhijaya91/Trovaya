alter table ip_assets add column if not exists block_number numeric(78);
alter table ip_assets add column if not exists block_hash varchar(66);
alter table licenses add column if not exists block_number numeric(78);
alter table licenses add column if not exists block_hash varchar(66);
alter table indexer_cursors add column if not exists last_block_hash varchar(66);

create index if not exists idx_ip_assets_chain_block on ip_assets(chain_id, block_number);
create index if not exists idx_licenses_chain_block on licenses(chain_id, block_number);

comment on column indexer_cursors.last_block_hash is
  'Canonical hash used to detect reorgs. Deployments upgrading existing data must replay from INDEXER_START_BLOCK.';
