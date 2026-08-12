# Trovaya Operations

## Secret boundaries

Only variables prefixed with `NEXT_PUBLIC_` may enter the browser bundle. Database credentials,
Supabase service roles, IPFS pinning credentials, AI provider keys, explorer keys, and deployment
keys are server-side values supplied by the deployment platform.

## Database and event indexer

1. Apply SQL files in `services/event-indexer/migrations/` in numeric order.
2. Set `INDEXER_RPC_URL`, `TROVAYA_IP_NFT_ADDRESS`, `DATABASE_URL`, and the deployment block.
3. Run `pnpm dev:indexer` locally or deploy the built service as a long-running worker.

The listener resumes from `indexer_cursors` and deduplicates every event by chain, transaction
hash, and log index. It stores timestamps and native-crypto amounts exactly. A production fiat
rate adapter must populate `fiat_rate_idr` at execution time; missing rates remain null rather
than being silently replaced with a current or fabricated price.

## Contract emergency controls

The deployer initially receives admin, minter, and pauser roles. Before production:

- transfer `DEFAULT_ADMIN_ROLE` to a multisig;
- grant `MINTER_ROLE` only to the approved registration relayer;
- grant `PAUSER_ROLE` to the incident-response multisig;
- revoke deployer roles after verifying the grants;
- verify all deployed source code through the configured explorer API.

Pausing stops registration, license purchases, and vault unlocks. It does not block ERC-721
transfers, preserving user custody during a protocol incident.

## Tax exports

The browser CSV exporter consumes indexed transaction timestamps, native-crypto amounts,
historical IDR rates, and calculated net royalties. CSV is the machine-readable MVP format.
PDF output should be generated from the same normalized dataset in the post-hackathon reporting
service, avoiding divergent accounting calculations in two clients.
