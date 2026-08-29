create table if not exists users (
  wallet_address varchar(42) primary key,
  username varchar(50), is_umkm_verified boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists ip_assets (
  id uuid primary key default gen_random_uuid(), chain_id integer not null, token_id numeric(78) not null,
  creator_wallet varchar(42) not null references users(wallet_address), allow_ai_training boolean not null,
  public_poisoned_cid text, encrypted_vault_cid text, tx_hash varchar(66) not null,
  log_index integer not null, status varchar(20) not null, created_at timestamptz not null default now(),
  unique(chain_id, tx_hash, log_index), unique(chain_id, token_id)
);
create table if not exists licenses (
  id uuid primary key default gen_random_uuid(), chain_id integer not null, token_id numeric(78) not null,
  buyer_wallet varchar(42) not null references users(wallet_address), tx_hash varchar(66) not null,
  log_index integer not null, price_paid_wei numeric(78) not null, crypto_symbol varchar(10) not null,
  fiat_rate_idr numeric(24,8), license_unit_count integer not null default 1,
  purchased_at timestamptz not null, unique(chain_id, tx_hash, log_index)
);
create table if not exists indexer_cursors (
  chain_id integer not null, contract_address varchar(42) not null, last_block numeric(78) not null,
  updated_at timestamptz not null default now(), primary key(chain_id, contract_address)
);
create index if not exists idx_ip_assets_creator on ip_assets(creator_wallet);
create index if not exists idx_licenses_buyer on licenses(buyer_wallet);
