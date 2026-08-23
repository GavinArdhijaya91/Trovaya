# Trovaya Operations

## Secret boundaries

Only variables prefixed with `NEXT_PUBLIC_` may enter the browser bundle. Database credentials,
Supabase service roles, IPFS pinning credentials, AI provider keys, explorer keys, and deployment
keys are server-side values supplied by the deployment platform.

The public gallery route is the exception only in credential privilege, not in
runtime location: it remains server-side but uses `SUPABASE_ANON_KEY`. It must
never fall back to `SUPABASE_SERVICE_ROLE_KEY`. The service role is reserved for
trusted internal workers and administrative operations.

## Database and event indexer

1. Apply SQL files in `services/event-indexer/migrations/` in numeric order.
2. Set `INDEXER_RPC_URL`, `INDEXER_EXPECTED_CHAIN_ID=97`,
   `TROVAYA_IP_NFT_ADDRESS`, `DATABASE_URL`, and the IP NFT deployment block.
3. Run `pnpm dev:indexer` locally or deploy the built service as a long-running worker.

The worker processes confirmed blocks sequentially in bounded chunks. Configure
chunk size, confirmation depth, reorg rewind depth, polling, and bounded RPC
retry through the `INDEXER_*` values documented in the service `.env.example`.
The worker refuses to sync when the RPC-reported chain differs from
`INDEXER_EXPECTED_CHAIN_ID`.
It emits structured JSON events (`chunk_synced`, `rpc_retry`, `reorg_rollback`,
and lifecycle events) for log-based metrics and finishes the active chunk before
closing its database pool on `SIGINT` or `SIGTERM`.

Migration `005_reorg_safe_indexing.sql` adds block coordinates and a canonical
cursor hash. When upgrading an indexer that already contains rows, stop every
worker instance, apply the migration, clear the derived `licenses`, `ip_assets`,
and `indexer_cursors` rows for the target chain, then replay from the audited
`INDEXER_START_BLOCK`. Do not run old and new worker versions concurrently. Take
a database backup first; these tables are rebuildable projections, but their
source chain and deployment start block must be available.

Migration `003_public_gallery_boundary.sql` enables RLS, revokes public access
to sensitive tables, grants only allowlisted columns on `ip_assets`, and exposes
the `public_gallery_assets` security-invoker view. The web API queries this view
with the anon role and applies a second application-level allowlist. Do not add
encrypted vault references, identity data, sessions, or key-delivery material to
the view. Database owners and service roles bypass ordinary RLS and therefore
must remain limited to trusted server processes.

## Supabase account foundation

Operational/indexer migrations and Supabase Auth migrations have different
portability boundaries:

- apply `services/event-indexer/migrations/` to operational PostgreSQL in numeric
  order;
- apply `supabase/migrations/` only to Supabase because these migrations use
  `auth.users`, `auth.uid()`, `anon`, and `authenticated`;
- run the read-only inspection queries under `supabase/tests/` afterward.

For secure key delivery, run
`supabase/tests/vault_key_delivery_verification.sql` and confirm all three vault
tables have RLS, no `PUBLIC`/`anon`/`authenticated` grants exist, and the atomic
key-registration audit trigger exists. Repeat denial probes with an actual anon
client because catalog inspection alone does not exercise PostgREST behavior.

Email OTP configuration remains provider-managed. Enable email OTP, configure
development and production redirect URLs, set expiry/resend/rate limits, and
review templates so responses do not disclose whether an account exists.
Supabase owns OTP and session storage; never duplicate raw OTPs, magic links,
access tokens, or refresh tokens in the public schema or application logs.

The Magic Link/OTP email template must contain `{{ .Token }}` for the six-digit
code-entry UI. Supabase's default test email service is not a production delivery
channel; configure approved SMTP before inviting real users. Restart the Next.js
runtime after changing `NEXT_PUBLIC_SUPABASE_URL` or
`NEXT_PUBLIC_SUPABASE_ANON_KEY` because they are compiled into the browser bundle.

The listener resumes from a block-number/hash cursor, verifies that cursor against
the canonical chain, and rewinds/replays a configured range when they differ. It
performs a full chain-projection replay when the safe rewind would cross the
configured deployment start, ensuring the deployment block is not skipped. It
deduplicates every event by chain, transaction hash, and log index. It stores timestamps and native-crypto amounts exactly. A production fiat
rate adapter must populate `fiat_rate_idr` at execution time; missing rates remain null rather
than being silently replaced with a current or fabricated price.

## Contract emergency controls

The deployer initially receives admin, minter, and pauser roles. Before production:

Run `pnpm --filter @trovaya/contracts deploy:bsc-testnet` only from the contracts
package environment after checking the deployer balance and chain ID. Its final
JSON output records each address, deployment transaction, and deployment block;
retain that sanitized output for the golden-path record and use the IP NFT block
as `INDEXER_START_BLOCK`. The mock verifier entry is explicitly marked
`mock_not_zero_knowledge` and must remain labelled as such in UI and evidence.

- transfer `DEFAULT_ADMIN_ROLE` to a multisig;
- grant `MINTER_ROLE` only to the approved registration relayer;
- grant `PAUSER_ROLE` to the incident-response multisig;
- revoke deployer roles after verifying the grants;
- verify all deployed source code through the configured explorer API.

After each deployment or role transfer, populate the read-only role-check values
from `packages/contracts/.env.example` and run
`pnpm --filter @trovaya/contracts check:roles`. The check requires deployed
bytecode, verifies the expected admin/pauser/minter assignments on both contracts,
and fails when a separate deployer still holds either admin role. The same check
is available as the manually triggered `deployment-roles` security workflow.

Dependency policy blocks new high or critical production advisories. The
2026-08-23 local audit has no high/critical finding; two moderate transitive
`uuid` findings are temporarily accepted because Trovaya does not call the
affected buffer-output UUID API. Reassess them whenever RainbowKit/Wagmi updates,
and do not use a forced incompatible major override merely to reduce the count.

The 2026-08-24 clean Python environment resolves Pillow 12.3.0 and setuptools
83.0.0, passes `pip check`, Ruff, and all Poison Engine tests, and reports no
known third-party vulnerability through `pip-audit --skip-editable`. The local
`trovaya-poison-engine` distribution is intentionally skipped because editable
workspace packages do not exist on PyPI; every resolved external dependency is
still audited.

Native GitHub dependency review additionally requires Dependency Graph and, for
a private repository, GitHub Code Security or Advanced Security. Until that
repository capability is available, the workflow reports an explicit notice and
continues enforcing `pnpm audit` and `pip-audit`; it must not claim native review
ran. After enabling the capability, create the repository Actions variable
`DEPENDENCY_REVIEW_ENABLED=true`. The pinned v5 action then runs on pull requests
and fails for newly introduced high-severity dependencies.

Slither findings are triaged at the exact source line rather than disabling
detectors globally. The accepted informational cases are: `block.timestamp` as
the explicit access-expiry clock; the non-reentrant checks-effects-interactions
call used to withdraw pull-payment proceeds; the compiler-required
`_increaseBalance` inheritance override; and immutable `IP_NFT` naming required
by Solhint. Any new occurrence of those detectors remains a failing finding. The
workflow installs the root pnpm lockfile and precompiles Hardhat artifacts before
running Slither, so the analyzer never performs an unrelated unlocked `npm i` in
the contracts subdirectory.

Pausing stops registration, license purchases, and vault unlocks. It does not block ERC-721
transfers, preserving user custody during a protocol incident.

The complete threat register, required recovery/security drills, evidence
handling rules, and human approval record live in
`SECURITY_AND_PRIVACY_REVIEW.md`. A green local test suite does not satisfy that
approval record or replace target-environment evidence.

## Tax exports

The browser CSV exporter consumes indexed transaction timestamps, native-crypto amounts,
historical IDR rates, and calculated net royalties. CSV is the machine-readable MVP format.
PDF output should be generated from the same normalized dataset in the post-hackathon reporting
service, avoiding divergent accounting calculations in two clients.
