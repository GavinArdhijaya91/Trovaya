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
| IPFS CIDs are always fake | Partially outdated. The web pin route uses Pinata when configured and returns a labelled `demo-*` identifier otherwise; the poison endpoint still returns a mock `Qm...` value. | P0: make persistence mode visible and never present a demo identifier as proof of IPFS persistence. Use the pin-route result as the canonical CID. |
| `threading.Lock` blocks the async service | Confirmed. The critical section is small but it synchronously locks the event-loop thread. | P0 reliability fix; use an async-safe limiter and document single-instance limits. |
| Pure-Python pixel loops are too slow for large images | Confirmed by implementation; the quoted 15-30 seconds was not benchmarked in this audit. | P0 performance fix with vectorized processing plus latency and memory tests at supported dimensions. |
| `httpx2` is valid | Confirmed typo in the Python dev dependency. | P0 install reproducibility fix: replace with `httpx` and verify a clean install. |
| `dotenv ^17.4.2` is necessarily invalid | Not reproduced. It is present in the lockfile/install and the workspace currently builds. | Do not change solely from the review; keep dependency validation in clean-install CI. |
| Next.js 16 and `eslint-config-next` 15 break the build | Version mismatch confirmed, failure not reproduced. The current lint and production build pass. | P1 dependency hygiene: align supported versions and retest; not a proven P0 blocker. |
| Public assets API exposes the Supabase service role | Resolved in code on 2026-08-23. The route uses the anon key, queries an RLS-restricted allowlisted view, validates the response shape, and has no privileged fallback. | Apply migration `003_public_gallery_boundary.sql` in each environment and retain negative regression tests. |
| Indexer lacks chunking, backoff, reorg handling, and shutdown | Confirmed. | P1 hardening after the demo lifecycle works. |
| Python lint/tests are absent from CI | Outdated. Workspace `lint` and `test` invoke Ruff and Pytest for the poison-engine package. | Keep the gate; make the Python steps explicit in CI reporting if clearer visibility is desired. |
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
3. **Fix clean-install reproducibility.** Replace `httpx2` with `httpx`, install
   JavaScript and Python dependencies from clean environments, and preserve the
   lockfile. Acceptance: CI installs, lints, tests, and builds without warm caches.
4. **Make simulation state unmistakable.** Use `protected preview
   (experimental)` in product copy and `Mock/Demo` for ZK and KYC. Show whether
   persistence is `pinata` or `demo`; never render a demo digest as a real CID.
   Acceptance: every demo fallback is visible at the action result and asset view.
5. **Remove event-loop blocking and bound image latency.** Use an async-safe
   limiter, vectorize perturbation, and benchmark supported sizes. Acceptance:
   concurrent requests do not serialize on a thread lock; documented latency and
   memory thresholds pass for the maximum supported image dimensions.
6. **Prove the golden path on one testnet.** Freeze a primary demo chain and test
   upload, transform, client encryption, real pinning, mint, indexing, license
   purchase, vault authorization, and clean-file delivery. Acceptance: one
   repeatable scripted/manual run records transaction hashes, real CIDs, and
   expected UI states; unavailable optional services fail safely.

### P0-B - Licensing and vault semantics

These items are required before describing the vault as a complete access system.

7. **Define a versioned license artifact.** Store an immutable URI/hash for terms
   covering license type, duration, territory, media/use, exclusivity,
   sublicensing, AI-training permission, and terms version. A boolean consent flag
   is insufficient. Acceptance: a buyer sees and accepts the exact hashed terms
   before payment, and the receipt references that version.
8. **Implement real key delivery.** Keep keys out of contracts, logs, public IPFS,
   and the operational database in plaintext. Bind delivery to the authorized
   wallet/session and record auditable delivery status. Acceptance: an authorized
   buyer can decrypt; an unauthorized or expired account cannot obtain the key.
9. **Specify access lifecycle.** Define expiry and revocation semantics without
   pretending that already-downloaded plaintext can be revoked. Acceptance:
   contracts/services enforce future delivery eligibility and the UI explains the
   limit of revocation.

### P1 - Reliability and security hardening

10. Chunk RPC log ranges; serialize sync runs; add retry with bounded exponential
    backoff, confirmation depth, reorg rollback/replay, graceful shutdown, and
    metrics to the event indexer.
11. Replace push payout with a withdrawal-credit pattern, define fee-update rules,
    and decide whether historical listing terms remain immutable. Add contract
    invariants and adversarial receiver tests.
12. Align Next.js and `eslint-config-next`, raise the TypeScript target based on the
    supported runtime matrix, review niche dependencies, and add component/E2E
    tests for wallet rejection, chain mismatch, service failure, and retries.
13. Add automated Solidity security gates (at minimum Slither plus invariant or
    fuzz tests), dependency scanning, secret scanning, and deployment-role checks.

### P2 - Production capability upgrades

14. Evaluate a genuine adversarial-protection method only with a lawful license,
    operationally acceptable compute cost, quality thresholds, and reproducible
    effectiveness benchmarks against named models and transformations. Until then,
    the feature remains an experimental preview transform.
15. Replace mock identity adapters with a privacy and regulatory design that
    specifies issuer, proof signals, nullifiers, expiry, revocation, retention,
    appeal, and failure handling.
16. Consider managed indexing only after measuring the hardened internal indexer;
    provider replacement is not a goal by itself.

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
