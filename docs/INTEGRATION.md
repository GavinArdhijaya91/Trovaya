# End-to-End Integration Runbook

## Prerequisites

1. Deploy the contracts and copy the emitted addresses.
2. Apply all SQL files under `services/event-indexer/migrations/` in numeric order.
3. Configure each workspace from its adjacent `.env.example`.
4. Ensure the connected registration wallet has `MINTER_ROLE`. The initial deployer receives it
   automatically; production deployments should use an approved relayer.

## Runtime order

```bash
pnpm dev:poison
pnpm dev:indexer
pnpm dev:web
```

The creator flow performs these steps:

1. Sends the selected image to the poison engine.
2. Encrypts the clean original client-side using AES-256-GCM.
3. Pins the poisoned preview, encrypted original, and metadata through the server-only IPFS route.
4. Calls `mintIPFor` with the generated CIDs and licensing preferences.
5. Lets the indexer read authoritative metadata at the mint block and cache it in PostgreSQL.
6. Displays the indexed asset in the gallery.
7. Allows another wallet to purchase a commercial license and authorize vault access.

Without `PINATA_JWT`, the pin route returns deterministic `demo-*` identifiers and never claims
that content was persisted to IPFS. Without Supabase configuration, the gallery returns an empty
list. These fallbacks keep local UI development explicit but do not constitute a live E2E run.

## Key-delivery boundary

For the creator demo, the generated encryption key lives only in browser `sessionStorage`. Vault
authorization does not itself reveal this key. Delivering a key to an authorized buyer requires a
separate authenticated key-delivery service with wallet-signature verification; this is intentionally
not simulated as production security.
