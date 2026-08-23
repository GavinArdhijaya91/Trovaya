# End-to-End Integration Runbook

## Prerequisites

1. Deploy the contracts and copy the emitted addresses.
2. Apply all SQL files under `services/event-indexer/migrations/` in numeric order,
   including `004_versioned_license_terms.sql`.
3. Configure each workspace from its adjacent `.env.example`.
4. Fund a fresh creator wallet on the selected testnet. Permissionless `mintIP`
   self-registers for that wallet; only `mintIPFor` requires an approved relayer.

## Runtime order

```bash
pnpm dev:poison
pnpm dev:indexer
pnpm dev:web
```

Before starting, run `pnpm demo:check`. It reads ignored local environment files,
prints only PASS/FAIL states, and never prints credential values. All checks must
pass before recording a golden-path run.

The creator flow performs these steps:

1. Sends the selected image to the poison engine, which returns an explicitly
   experimental transform and no persistence reference.
2. Encrypts the clean original client-side using AES-256-GCM.
3. Pins the experimental preview, encrypted original, and metadata through the
   server-only IPFS route. This adapter is the only source of canonical content
   references.
4. Calls permissionless `mintIP` from the creator wallet with the generated CIDs,
   immutable license terms URI/hash/version, and licensing preferences.
   `mintIPFor` remains reserved for authorized relayers.
5. Lets the indexer read authoritative metadata at the mint block and cache it in PostgreSQL.
6. Displays the indexed asset in the gallery.
7. Requires another wallet to load and hash-verify the exact license artifact,
   accept its version in purchase calldata, and then authorize vault access.

Without `PINATA_JWT`, the pin route returns deterministic `demo-*` identifiers and never claims
that content was persisted to IPFS. Without Supabase configuration, the gallery returns an empty
list. These fallbacks keep local UI development explicit but do not constitute a live E2E run.

## Key-delivery boundary

For the creator flow, the generated content key is retained only in mounted
browser memory while registration is pending; it is never written to
`sessionStorage` or another persistent browser store. A failed registration can
be retried during that mounted session, and a successful registration clears the
pending key. Vault authorization alone does not reveal a key. The authenticated
delivery service wraps creator keys at rest with AES-256-GCM, verifies single-use
wallet challenges and current on-chain license/vault state, and re-wraps delivery
using buyer RSA-OAEP-256. It requires
`202608230002_vault_key_delivery.sql`, `SUPABASE_SERVICE_ROLE_KEY`,
`VAULT_RPC_URL`, and a 32-byte base64 `VAULT_MASTER_KEY`. Production deployment
also requires HTTPS, managed secret rotation, backups, and edge rate limiting.

## Golden-path evidence

Copy `docs/evidence/golden-path.example.json` to an ignored working file, replace
every placeholder with evidence from one BSC testnet run, then validate it:

```bash
pnpm demo:evidence path/to/golden-path.json
```

The evidence requires separate creator and buyer wallets, real non-demo CIDs for
the public preview, encrypted source, and versioned license terms;
the exact source commit, UTC run interval, deployment addresses and transactions;
mint/license/vault transaction hashes; maximum-dimension target-host latency and
peak memory; an indexed gallery record; successful
key registration and RSA-OAEP-256 delivery; decrypted-file integrity; denial for
unauthorized and expired/revoked buyers; and a negative public-data check. Never
put private keys, JWTs, OTPs, signatures, nonces, plaintext content keys, or
decrypted source files in the evidence artifact.

## Frontend integration contract

The normative ownership, compatibility, and approval rules are defined in
[`architecture/FRONTEND_INTEGRATION_CONTRACT.md`](architecture/FRONTEND_INTEGRATION_CONTRACT.md).
This section is the implementation runbook for that agreement.

Frontend components must not call contract ABIs or interpret provider errors
directly. Integration follows this boundary:

```text
protocol SDK types -> web adapter hook -> reusable operation state -> UI component
```

The shared lifecycle is `idle`, `preparing`, `awaiting_wallet`, `submitted`,
`confirming`, `indexing`, `completed`, or `failed`. UI copy uses familiar terms;
transaction hashes are presented as proof numbers. Provider errors are reduced
to stable, retry-aware error codes before reaching a component.

New contract actions should be added in this order:

1. expose the ABI and provider-neutral types from `@trovaya/protocol-sdk`;
2. implement a focused hook under `apps/web/hooks`;
3. return actions plus `OperationState`, never raw wagmi state;
4. render progress through the reusable `OperationStatus` component; and
5. add an integration-boundary test before wiring the product UI.

Finance-specific policy remains outside this template until approved by product
management. The integration layer accepts validated amounts and identifiers but
does not infer pricing, returns, recommendations, or ownership policy.
