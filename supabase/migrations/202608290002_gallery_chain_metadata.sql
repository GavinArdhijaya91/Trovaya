alter table ip_assets add column if not exists token_uri text;
alter table ip_assets add column if not exists commercial_license_fee_wei numeric(78);
alter table ip_assets add column if not exists encrypted_vault_cid text;
