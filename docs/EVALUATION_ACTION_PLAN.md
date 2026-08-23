# Trovaya V1 Evaluation Action Plan

Status: verified against the repository on 2026-08-23. `MASTER_SPEC.md` remains
the product and technical source of truth; this document is the execution
breakdown derived from `Evaluasi Proyek Trovaya V1.md`.

## 1. Decision summary

The evaluation's central conclusion is accepted: Trovaya must prove one honest,
reliable protected-asset lifecycle before expanding into badges, social
distribution, analytics, or funding. The canonical sequence is:

```text
upload -> generate labelled protected preview -> encrypt clean source
       -> persist both assets -> register provenance and consent
       -> purchase a defined license -> authorize and deliver clean-source access
```

Web3 is justified only where it creates independently verifiable provenance,
consent history, ownership, and license-payment receipts. Image processing,
private identity records, encryption, and key delivery remain off-chain. No UI
or pitch may imply that an on-chain consent flag alone prevents scraping,
establishes copyright, or makes a license legally enforceable.

## 2. Verification of evaluation findings

| Evaluation finding | Verified status | Decision |
| --- | --- | --- |
| User mint can revert because the UI calls a role-gated function | Resolved on 2026-08-23. `mintIP` is permissionless and always attributes the asset to `msg.sender`; the UI uses it. `mintIPFor` remains role-gated. | Regression tests must continue proving that a non-admin can self-mint but cannot register for another creator. |
| Protection is equivalent to Glaze/Nightshade | Confirmed as an overclaim. The service explicitly implements deterministic bounded RGB noise and labels itself simulation-only. | Retain it as a demo protected-preview transform; do not claim adversarial effectiveness until benchmarked. |
| ZK and KYC are production verification | Confirmed as an overclaim if stated without `mock`. `MockZKHumanVerifier` and the `SAMPLE` document flow are demo adapters. | Require visible `Demo/Mock` labels in docs and UI. Define production providers later. |
| IPFS CIDs are always fake | Resolved in code on 2026-08-23. The poison endpoint no longer returns a CID-shaped placeholder. Only the web pin adapter creates canonical references: Pinata returns an IPFS CID and unconfigured mode returns an explicit `demo-*` identifier. | Target-environment acceptance still requires a real Pinata upload; the gallery does not claim to have independently verified historical IPFS references. |
| `threading.Lock` blocks the async service | Resolved on 2026-08-23. The process-local limiter now serializes its small state transition with `asyncio.Lock`, and concurrent acceptance/rejection behavior is tested. | Keep the demo at one worker; use a shared external limiter before horizontal scaling. |
| Pure-Python pixel loops are too slow for large images | Resolved for the demo envelope on 2026-08-23. NumPy vectorizes the deterministic transform, dimensions are capped at 4096 x 4096, and a 1024 x 1024 latency regression test has a five-second ceiling. | Record target-host latency and peak memory during the golden-path run; the transform remains experimental rather than adversarial protection. |
| `httpx2` is valid | Confirmed on 2026-08-23. `httpx2` is the maintained HTTPX successor and Starlette 1.2+ supports it in `TestClient`; replacing it with legacy `httpx` makes the warning-as-error test suite fail on the current dependency range. | Keep `httpx2>=2,<3` and verify it from a clean environment instead of relying on stale package assumptions. |
| `dotenv ^17.4.2` is necessarily invalid | Not reproduced. It is present in the lockfile/install and the workspace currently builds. | Do not change solely from the review; keep dependency validation in clean-install CI. |
| Next.js 16 and `eslint-config-next` 15 break the build | Version mismatch confirmed, failure not reproduced. The current lint and production build pass. | P1 dependency hygiene: align supported versions and retest; not a proven P0 blocker. |
| Public assets API exposes the Supabase service role | Resolved in code on 2026-08-23. The route uses the anon key, queries an RLS-restricted allowlisted view, validates the response shape, and has no privileged fallback. | Apply migration `003_public_gallery_boundary.sql` in each environment and retain negative regression tests. |
| Indexer lacks chunking, backoff, reorg handling, and shutdown | Confirmed. | P1 hardening after the demo lifecycle works. |
| Python lint/tests are absent from CI | Outdated. Workspace `lint` and `test` invoke Ruff and Pytest for the poison-engine package. | Keep the gate; make the Python steps explicit in CI reporting if clearer visibility is desired. |
| Turbo lint rebuilds its own package and caches Python bytecode | Resolved on 2026-08-23. Lint now depends only on upstream builds required for workspace types, `__pycache__` is no longer a declared build output, and the Python package overrides `build.outputs` to an explicit empty set. | Keep Python bytecode ignored and outside Turbo artifacts. |
| License payout can fail for rejecting contract wallets | Confirmed behavior, but a revert prevents silent fund loss. | P1: use pull payments/withdrawal credits for receiver compatibility and operational recovery. |
| Vault access has no expiry/revocation or real key delivery | Confirmed. | Authorization records are not key delivery. Treat production delivery, expiry, and revocation as a release gate. |

Verification command run during this audit: `pnpm.cmd lint` (12/12 tasks
successful, including Ruff and the Next.js production build prerequisite).

## 3. Ordered implementation backlog

### P0-A - Truthful, demo-safe core

These items block any claim that the end-to-end MVP works.

1. **Resolved - permissionless self-mint.** `mintIP` always attributes the asset
   to `msg.sender`, while `mintIPFor` remains restricted to `MINTER_ROLE`. A
   signature-authorized public relayer is not part of the current MVP. Acceptance:
   contract tests prove a fresh non-admin wallet can self-register and cannot
   register an asset for another creator. A live testnet wallet run remains part
   of the golden-path evidence in item 6.
2. **Resolved in code - protect the public data boundary.** The public route uses
   `SUPABASE_ANON_KEY`, an RLS-restricted `public_gallery_assets` view, an explicit
   query projection, and a runtime response allowlist. It fails closed without a
   privileged fallback. Regression tests prove injected vault, key, KYC, and
   session fields are discarded. Deployment acceptance still requires applying
   migration `003_public_gallery_boundary.sql` and verifying anon-denial queries
   against the target Supabase project.
3. **Resolved - clean-install reproducibility.** Retain `httpx2>=2,<3`, which is
   required by the current Starlette `TestClient`; the older `httpx` fallback is
   deprecated and fails this repository's warning-as-error policy. A fresh,
   isolated Python environment successfully installs the package with its `dev`
   extra, passes dependency-graph validation, Ruff and Pytest, compiles the
   service, and imports all runtime and test dependencies. JavaScript remains
   reproducible through the committed pnpm lockfile and CI frozen-lockfile
   install. CI repeats `pip check` after every Python dependency installation.
4. **Resolved in code - make simulation state unmistakable.** Product and result
   copy labels the pixel transform as an experimental preview, mock KYC responses
   state `mock/not_verified`, and vault actions state that authorization does not
   deliver a key. The poison endpoint returns no CID-shaped placeholder; only the
   pin adapter creates canonical references. Action results distinguish Pinata
   persistence from `demo-*` identifiers, demo references never use an `ipfs://`
   URI, and gallery cards visibly identify demo or unverified IPFS references.
   Deployment acceptance still requires exercising both configured and fallback
   modes in the target browser environment.
5. **Resolved in code - remove event-loop blocking and bound image latency.**
   The process-local limiter uses `asyncio.Lock`; NumPy vectorizes the transform;
   supported dimensions are capped at 4096 x 4096; deterministic, boundary,
   concurrency, and 1024 x 1024 latency tests pass. The demo is explicitly
   single-worker because limiter state is not shared. Deployment acceptance still
   requires recording latency and peak memory on the target demo host at the
   maximum supported dimensions.
6. **Prove the golden path on one testnet.** Freeze a primary demo chain and test
   upload, transform, client encryption, real pinning, mint, indexing, license
   purchase, vault authorization, and clean-file delivery. Acceptance: one
   repeatable scripted/manual run records transaction hashes, real CIDs, and
   expected UI states; unavailable optional services fail safely.
   The evidence validator also requires a real license-terms CID, successful key
   registration and RSA-OAEP-256 delivery, decrypted-file integrity,
   unauthorized denial, expired/revoked denial, and confirmation that no key,
   signature, nonce, or plaintext entered the evidence artifact.
   The deployment script now emits machine-readable addresses, transaction
   hashes, and deployment blocks (including an explicit mock-verifier capability
   label); a local Hardhat dry run proves that evidence output path without
   spending testnet funds.

### P0-B - Licensing and vault semantics

These items are required before describing the vault as a complete access system.

7. **Resolved in code - define a versioned license artifact.** Registration pins
   a deterministic v1 JSON artifact covering license type, duration, territory,
   permitted use/media, exclusivity, sublicensing, and AI-training permission.
   Its URI, Keccak-256 hash, and version are immutable token metadata. The buyer
   flow fetches the document, verifies its exact serialized hash, displays every
   term, and remains disabled for demo, legacy, missing, or mismatched artifacts.
   Purchase calldata includes the expected hash/version, the contract rejects
   stale or substituted terms, and its receipt records the accepted snapshot.
   Migration `004_versioned_license_terms.sql` persists public terms and receipt
   snapshots. Deployment acceptance requires migration, redeployment, and a real
   Pinata/testnet purchase in P0-A item 6.
8. **Resolved in code - implement secure key delivery.** Creator content keys are
   AES-256-GCM wrapped under a server-only master key with chain/token AAD before
   entering a server-only RLS table. Registration and delivery require separate,
   five-minute, single-use EIP-191 wallet challenges. The server verifies creator
   attribution or both commercial-license and vault-authorization state directly
   against the configured chain. Buyer keys are returned only as RSA-OAEP-256
   ciphertext for an ephemeral browser key pair, then used client-side to decrypt
   the IPFS ciphertext. Audit rows contain no keys, signatures, nonce, or buyer
   public keys. Negative policy and authenticated-encryption tests pass. Migration
   `202608230002_vault_key_delivery.sql`, server secrets, HTTPS, provider rate
   limiting, and a live authorized/unauthorized run remain deployment acceptance.
9. **Resolved in code - specify access lifecycle.** The enforceable license
   duration is recorded alongside the hashed terms. License-based vault grants
   expire at purchase time plus that duration; demo human grants expire after one
   day. The original creator or protocol admin may revoke a grant, and
   `hasVaultAccess` returns false after expiry or revocation so the delivery API
   denies future key requests. Contract tests cover both paths. UI copy explicitly
   states that revocation cannot retract plaintext already downloaded. Deployment
   acceptance requires testing expiry/revocation against the target chain and
   operating an appeal/audit process.

### P1 - Reliability and security hardening

10. Chunk RPC log ranges; serialize sync runs; add retry with bounded exponential
    backoff, confirmation depth, reorg rollback/replay, graceful shutdown, and
    metrics to the event indexer.
    **Implemented in code on 2026-08-23:** the worker now uses sequential bounded
    chunks, confirmation-aware heads, bounded exponential RPC retries, canonical
    block-hash cursors, transactional rewind/replay, structured operational
    metrics, and signal-driven shutdown. Unit tests cover range boundaries,
    confirmation underflow, rewind bounds, and retry exhaustion. Deployment
    acceptance still requires migration `005`, a full projection replay for an
    existing database, and a controlled testnet reorg/RPC-failure drill.
11. Replace push payout with a withdrawal-credit pattern, define fee-update rules,
    and decide whether historical listing terms remain immutable. Add contract
    invariants and adversarial receiver tests.
    **Implemented in code on 2026-08-23:** purchases now credit an accounting
    liability instead of calling the creator, and creators explicitly withdraw to
    a chosen recipient. Fee and hashed terms remain immutable for the lifetime of
    the minted token because no mutation method exists; a changed offer requires a
    new registration/version. Tests cover credit conservation, successful
    withdrawal, rejecting creator contracts, alternate recipients, and rollback
    of accounting when a recipient rejects Ether. The creator dashboard exposes
    the pending balance and an explicit withdrawal to the connected wallet, with
    shared transaction-state feedback. No universal numeric on-chain price cap is
    imposed because the protocol may target native currencies with different
    denominations; instead, the exact immutable fee and hash-verified terms must
    be shown and accepted before every buyer-initiated payment, and changing an
    offer requires a new registration. External audit and target-chain deployment
    remain pending.
12. Align Next.js and `eslint-config-next`, raise the TypeScript target based on the
    supported runtime matrix, review niche dependencies, and add component/E2E
    tests for wallet rejection, chain mismatch, service failure, and retries.
    **Implemented in code on 2026-08-23:** `eslint-config-next` now follows the
    Next 16 line using its native flat config, the documented Node floor is 20.9,
    and the web TypeScript target is ES2022. Unused direct `@x402/*` dependencies
    were removed (wallet connectors may still bring them transitively). Automated
    integration/unit coverage exercises wallet rejection, chain mismatch, safe
    service failures, bounded retry, and non-retryable validation errors. A jsdom
    component suite additionally proves that wallet/chain failures render as
    accessible, sanitized UI copy. Full golden-path browser E2E remains part of
    the deployment acceptance gate, not a substitute for the component coverage.
13. Add automated Solidity security gates (at minimum Slither plus invariant or
    fuzz tests), dependency scanning, secret scanning, and deployment-role checks.
    **Implemented as repository gates on 2026-08-23; CI execution pending:** the
    pinned security workflow runs Slither, JavaScript/Python dependency audits,
    PR dependency review, and Gitleaks. Contract tests enforce the aggregate
    withdrawal-liability invariant and adversarial receiver behavior. A fail-closed
    read-only deployment checker validates bytecode and expected admin, pauser,
    and minter assignments, including deployer-admin revocation. This item remains
    open until the workflow has run successfully and the role check passes against
    the chosen testnet deployment.
    Local `pnpm audit --prod --audit-level high` passed on 2026-08-23 after
    centrally overriding patched `ws >=8.21.0` and `axios >=1.18.0`. Two moderate
    transitive `uuid` advisories remain monitored; the affected buffer-writing API
    is not called by Trovaya, and a forced major override was rejected because it
    could break wallet connectors. Hosted Slither/Gitleaks results are still
    required. `SECURITY_AND_PRIVACY_REVIEW.md` now provides the scoped threat
    register, residual-risk evidence requirements, operational drills, and an
    explicit human approval record; every approval remains honestly pending.

### P2 - Production capability upgrades

14. Evaluate a genuine adversarial-protection method only with a lawful license,
    operationally acceptable compute cost, quality thresholds, and reproducible
    effectiveness benchmarks against named models and transformations. Until then,
    the feature remains an experimental preview transform.
    **Evidence gate implemented on 2026-08-23; capability intentionally not
    claimed:** `pnpm protection:evidence <file>` rejects evaluation records without
    lawful approval, a genuine named method, reproducible commit/config, at least
    30 consented samples, two named model versions, three transformations, quality
    floors, measured improvement over baseline, and compute cost. The current
    example fails by design, so the product remains labelled experimental.
15. Replace mock identity adapters with a privacy and regulatory design that
    specifies issuer, proof signals, nullifiers, expiry, revocation, retention,
    appeal, and failure handling.
    **Normative design completed on 2026-08-23; provider implementation awaits
    governance inputs:** `TRUST_AND_IDENTITY.md` now defines issuer/proof,
    purpose-scoped nullifiers, bounded expiry, revocation freshness, minimal
    retention, correction/appeal, and fail-closed outages. No issuer,
    jurisdictional owner, or approved processor is selected, so no real KYC
    integration was fabricated and runtime remains explicitly mock.
16. Consider managed indexing only after measuring the hardened internal indexer;
    provider replacement is not a goal by itself.
    **Instrumentation implemented; evaluation pending live workload:** the worker
    emits chunk duration/event count/retry/reorg metrics. A provider decision needs
    testnet volume, p50/p95 catch-up latency, RPC error rate, reorg recovery time,
    operating cost, and a rebuild/exit test. Until measured, retain the internal
    indexer.

### Deferred until core release gates pass

Soulbound badges, automated social publishing, Dune dashboards, external content
connectors, and fractional funding remain out of the implementation critical path.
They may be revisited only after P0 acceptance criteria pass on the primary testnet
and no unresolved critical/high security finding affects the golden path.

## 4. Release gates

| Gate | Minimum evidence |
| --- | --- |
| Demo-ready | P0-A complete; fresh non-admin wallet succeeds on one testnet; every mock/fallback is visibly labelled. |
| MVP-ready | P0-A and P0-B complete; real persistence and key delivery work; license terms are versioned; failure-path tests pass. |
| Production-candidate | P1 complete; threat model and privacy review approved; no unresolved critical/high finding; recovery and monitoring runbooks tested. |
| Expansion-ready | Production-candidate core is stable and measured; optional feature has a privacy, moderation, consent, and operational owner. |

## 5. Explicit non-goals and claims policy

- Trovaya records evidence and consent; it does not adjudicate copyright.
- A protected preview reduces exposure according to measured capability; it does
  not guarantee prevention of scraping or model training.
- Mock KYC is a UX demonstration, not identity verification.
- Mock human proof is not a zero-knowledge proof.
- Vault authorization on-chain is not equivalent to secure decryption-key delivery.
- ERC-2981 signals royalty information; it does not force every marketplace to pay.
- Multi-chain deployment is not a release goal until one primary chain is reliable.
