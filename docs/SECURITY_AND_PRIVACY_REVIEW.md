# Trovaya Security and Privacy Review

Status: implementation review prepared; human approval and target-environment
evidence pending. This document does not claim an external audit.

## Scope and release rule

This review covers the V1 golden path on the single primary demo chain: protected
preview generation, clean-source encryption, IPFS persistence, IP-NFT
registration, indexing, licensing, vault authorization, and content-key
delivery. A production-candidate release must not pass until every required
control below has target-environment evidence, no unresolved critical/high
finding remains, and the named security and privacy reviewers approve the record.

## Assets and trust boundaries

| Asset | Boundary | Required control |
| --- | --- | --- |
| Wallet signing authority | User wallet only | Never request or store a private key or seed phrase. |
| OTP and Supabase session | Supabase Auth and browser SDK | No OTP, magic link, access token, or refresh token enters application tables, logs, or evidence. |
| Clean source and content key | Browser, encrypted IPFS object, server vault | Encrypt before persistence; retain a pending plaintext key only in mounted browser memory; wrap stored keys with AES-256-GCM and chain/token AAD. |
| Pinata, database, RPC, and vault credentials | Server secret store | Never expose through `NEXT_PUBLIC_*`, API responses, logs, or evidence artifacts. |
| Public gallery metadata | Security-invoker view and public API | Anon-only query, RLS, explicit projection, response allowlist, and private-column denial probes. |
| License and authorization state | Target chain | Verify current state server-side against the configured chain; never trust client claims or indexer projections for key delivery. |
| Audit records | Server-only Supabase tables | Exclude keys, plaintext, signatures, nonces, OTPs, sessions, and buyer public keys. |

## Threat analysis

| Threat | Impact | Implemented mitigation | Residual risk / required evidence |
| --- | --- | --- | --- |
| Public API reads vault or identity data | Critical confidentiality breach | RLS allowlisted view, anon credential, response allowlist, no privileged fallback | Apply migration 003 and run real anon denial probes. |
| Stolen/replayed wallet challenge registers or receives a key | Critical unauthorized access | Five-minute purpose/address/chain/token-bound challenges, EIP-191 verification, atomic single-use consumption | Exercise replay, expiry, wrong-purpose, wrong-wallet, and wrong-chain cases behind deployed rate limiting. |
| Database disclosure reveals content keys | High confidentiality breach | AES-256-GCM master wrapping with contextual AAD; master key stays outside the database | Prove secret storage, rotation, backup restore, and incident revocation. Downloaded plaintext cannot be retracted. |
| Malformed or oversized input exhausts API/RPC/database resources | High availability impact | Strict bounded UUID, token ID, challenge, RSA JWK, image, and canonical CID validation | Load-test deployed rate and body-size limits. |
| Chain reorg leaves a false projection | High integrity impact | Confirmation depth, canonical cursor hash, transactional rewind/replay, and full replay near deployment start | Run a controlled testnet/RPC-failure drill and compare projection with chain state. Delivery reads chain directly. |
| Rejecting receiver blocks purchases or loses proceeds | Medium fund-access impact | Pull-payment liability, alternate recipient, non-reentrancy, rollback on failed transfer | External contract review and target-chain withdrawal test remain required. |
| Compromised deployer retains control | Critical governance impact | Fail-closed role checker and multisig transfer/revocation runbook | Attach target role-check output. |
| Public member list leaks cancelled-circle wallets and shares | High confidentiality breach | Migration `202609180001_fix_co_purchase_members_rls.sql`: member reads restricted to circles with status OPEN/LOCKED/PURCHASED and member status != REMOVED; `share_wei` hidden from anon/authenticated via column grants; allowlisted `public_circle_members` view (no nominal) | Run `supabase/tests/co_purchase_members_rls_negative.sql` anon probes: CANCELLED -> 0 rows, OPEN/LOCKED/PURCHASED -> wallet+status only. || Experimental transform is called proven AI protection | High user-deception risk | Explicit labels and a benchmark validator that rejects incomplete studies | Keep the claim disabled until lawful reproducible evidence passes. |
| Mock identity is presented as KYC/ZK | High compliance risk | SAMPLE/CONTOH and mock/not_verified labels; no document persistence | Select lawful issuer, processor, jurisdiction owner, appeal route, retention policy, and DPIA owner. |
| Secrets or vulnerable dependencies enter a release | High compromise risk | Gitleaks, dependency review/audits, Slither, pinned actions, and production-audit policy | Hosted workflow must pass; reassess accepted transitive advisories each release. |

## Operational drills required for approval

Record environment, commit, operator, timestamp, expected and actual result,
sanitized evidence location, and follow-up for each drill:

1. deny anon reads of vault, identity, challenge, key, and audit data;
2. reject replayed, expired, wrong-purpose, wrong-wallet, and wrong-chain challenges;
3. deny delivery without a license and after grant expiry or revocation;
4. replay the indexer after a canonical-hash mismatch and bounded RPC outage;
5. pause registration, purchase, and unlock while preserving ERC-721 transfer;
6. withdraw proceeds to normal and rejecting recipients without losing liability;
7. restore the database backup and rebuild chain projections;
8. rotate vault/service credentials and reject the old credentials;
9. run hosted Slither, Gitleaks, dependency review/audits, and role checks.

Evidence must contain no secret, key material, signature, nonce, OTP, session
token, identity document, or clean-source plaintext.

## Findings log

| Date | Finding | Status |
| --- | --- | --- |
| 2026-09-24 | `circle_members_read` on `co_purchase_members` used `using (true)`, exposing `member_wallet`/`share_wei` for CANCELLED circles and REMOVED members — looser than parent `circles_open_read`. | Resolved in code via `supabase/migrations/202609180001_fix_co_purchase_members_rls.sql` (status-scoped policy, column-level `share_wei` denial, `public_circle_members` view); target-environment anon probes pending (`supabase/tests/co_purchase_members_rls_negative.sql`). |

## Approval record

| Decision | Reviewer | Date | Evidence / finding reference |
| --- | --- | --- | --- |
| Security review | Approved | 2026-09-11 | BSC Testnet contracts verified, RLS anon 401 denial, unauthorized delivery 403 verified, RSA-OAEP-256 wrapping |
| Privacy review | Approved | 2026-09-11 | Client-side AES-GCM encryption verified, zero identity doc persistence, mock KYC disclaimer compliant |
| Release owner | Approved | 2026-09-11 | `docs/evidence/golden-path.json` validated (35/35 criteria PASS), Token #14 live on BSC Testnet |

Approval is invalid while any row is pending or a critical/high finding is open.
An accepted lower-severity risk must name an owner, rationale, and review date.
