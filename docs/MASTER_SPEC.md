# 🛡️ Trovaya Protocol - Master Technical Specification

Status: canonical product and technical specification. Implementation maturity
and release sequencing are normative; aspirational capabilities must not be
presented as shipped functionality.

## 1. Executive Overview
Trovaya is a consent-first creator platform and decentralized Intellectual
Property (IP) registry for digital creators and local UMKMs. It combines
verifiable provenance and consent records, experimental protected public
previews, encrypted clean-source storage, explicit commercial-license receipts,
and non-advisory educational insights. On-chain records provide evidence and
auditability; they do not by themselves establish copyright, enforce legal
terms, or prevent unauthorized scraping.

---

## 2. Core Architecture Framework (3 Pillars)

### Pillar 1: Access (Frictionless Onboarding)
- **One-Door Entry:** Wallet connector (wagmi/viem) + Social Login fallback.
- **Mock Identity UX:** A demo-only document-submission flow for UMKMs with
  explicit `SAMPLE/CONTOH` watermarks. It does not verify identity or implement a
  zero-knowledge protocol.
- **UX Abstraction:** Technical Web3 terms (gas fees, smart contracts) are abstracted behind familiar traditional finance tooltips[cite: 1].

### Pillar 2: Own & Protect (Tokenization & Data Defense)
- **On-Chain Registration:** ERC-721 + ERC-2981 Royalty Standard for asset proof-of-ownership[cite: 1].
- **Experimental Protected Preview:** The MVP applies a deterministic, bounded
  image transformation before public distribution. It is a demonstration
  pipeline, not Glaze, Nightshade, or a proven defense, until effectiveness is
  established through reproducible model-specific benchmarks.
- **Encrypted Vault:** Clean high-resolution source files are encrypted
  client-side and stored off-chain. On-chain authorization is only an access
  signal; production readiness additionally requires secure off-chain key
  delivery, expiry/revocation policy, and an audited identity or license adapter.

### Pillar 3: Understand (Unbiased AI Reviewer & Reputation)
- **AI Asset Auditor:** Non-advisory backend service that summarizes license
  metadata, checks available provenance evidence, and flags explainable red
  flags. It must not claim to prove authenticity.
- **Soulbound Badges (SBT):** Non-transferable tokens awarded for verified authentic creators and consistent IP publishing[cite: 1].

---

## 3. Canonical Product and Data Boundaries

The protected-asset lifecycle remains Trovaya's dominant product value: protect
the public preview, encrypt the clean source, register provenance and consent
on-chain, and enable authorized licensing and vault access.

Supabase with PostgreSQL is the operational data foundation for passwordless
email OTP, sessions, profiles, linked wallets, KYC state, community data, and
indexed blockchain events. Smart contracts remain authoritative for on-chain
ownership, consent, and license transactions. Private account and KYC data must
never be published to public IPFS, analytics platforms, or social networks.

The trust expansion is specified in `TRUST_AND_IDENTITY.md`. The advanced
integrations in Section 4 extend the original MVP; they neither replace nor
outweigh its IP protection and fair-trade purpose.

### 3.1 Authority boundaries

- Smart contracts are authoritative for token ownership, recorded consent,
  license-payment receipts, and vault-authorization state.
- Versioned license terms are authoritative legal artifacts referenced by an
  immutable URI/hash; the `allowAITraining` boolean is an auditable preference,
  not a complete license or technical enforcement mechanism.
- The Insights Gateway and event indexer are derived views and may be rebuilt.
- Off-chain services are authoritative for encrypted-object persistence and key
  delivery, but must never expose clean files or plaintext keys publicly.
- KYC status, human-proof status, provenance signals, and community reputation
  remain separate claims with issuer, timestamp, expiry, and revocation state.

### 3.2 Implementation maturity and claims

Every capability must be labelled as `Demo/Mock`, `Experimental`, or
`Production` in documentation and user-facing flows where confusion is
material. Demo identifiers must never be presented as real IPFS CIDs. Mock KYC
must retain the visible `SAMPLE/CONTOH` watermark. The mock human verifier must
not be described as a real zero-knowledge proof. ERC-2981 communicates royalty
information but does not guarantee marketplace enforcement.

### 3.3 Core release gates

1. **Demo-ready:** a fresh non-admin wallet completes the protected-asset golden
   path on one primary testnet, and all simulations/fallbacks are visibly labelled.
2. **MVP-ready:** real persistence, versioned license acceptance, and secure
   clean-source key delivery work end-to-end with failure-path tests.
3. **Production-candidate:** threat modelling, privacy review, automated contract
   analysis, monitoring, recovery, access lifecycle, and no unresolved
   critical/high security findings.
4. **Expansion-ready:** optional analytics, social, badges, and funding may enter
   delivery only after the production-candidate core is stable and measured.

Detailed ordered work and acceptance evidence are defined in
`EVALUATION_ACTION_PLAN.md`.

---

## 4. Advanced Analytics and Social Integrations

### 4.1 Status

These are optional post-MVP capabilities. They must not block or become sources
of truth for protection, minting, licensing, ownership, or vault access.

### 4.2 Trovaya Insights Gateway

Trovaya may expose verifiable creator fundamentals through a provider-neutral
Insights Gateway. It reads normalized data from PostgreSQL and the event
indexer, then supplies explicitly approved public or aggregate fields to
versioned external connectors. External platforms never connect directly to
the operational database.

```text
Smart contracts -> Event indexer -> Supabase/PostgreSQL
                                      |
                                      v
                            Trovaya Insights Gateway
                               |               |
                               v               v
                     Public on-chain       Social/content
                     analytics             connectors
```

### 4.3 Dune analytics

Dune is an optional visualization layer for public blockchain data. It may
publish metrics such as registered IP count, license activity, royalty payments,
provenance activity, and AI-consent distribution. It does not replace the event
indexer, PostgreSQL, or smart contracts and must not receive email, KYC, private
vault, or session data.

### 4.4 Social distribution

X and Threads may distribute creator-approved achievements and links to
verifiable records. Farcaster may later provide Web3-native distribution or a
Mini App. They are delivery channels, not ownership authorities or mandatory
authentication providers.

Start with user-initiated share links. Automated publishing requires OAuth,
explicit per-post approval, revocable grants, minimum provider scopes, delivery
logs, retry limits, and idempotency keys. Connector failures must never block
core protocol operations.

### 4.5 External fundamental content

External articles may be ingested only from licensed APIs, permitted feeds, or
curated canonical links. Store attribution and the canonical URL; do not
republish full articles without permission. Insights remain educational and
non-advisory: no buy/sell signals, price predictions, guaranteed returns, or
speculative rankings.

### 4.6 Delivery order

1. Complete and harden the protection, versioned licensing, real persistence,
   and secure key-delivery MVP on one primary testnet.
2. Implement the Supabase/PostgreSQL trust and account layer.
3. Add internal creator fundamentals and user-initiated sharing.
4. Add an optional public Dune dashboard for on-chain transparency.
5. Evaluate OAuth publishing, Farcaster, and content connectors after privacy,
   moderation, consent, and operational controls are ready.

---

## 5. Monorepo Architecture Layout

```text
trovaya/
├── apps/
│   └── web/                # Next.js frontend (Tailwind CSS, wagmi/viem, RainbowKit)[cite: 1]
├── services/
│   └── poison-engine/      # Python FastAPI microservice (Image perturbation pipeline)
├── packages/
│   └── contracts/          # Solidity L2 / BSC Testnet Contracts (Hardhat/Foundry)[cite: 1]
└── docs/
    └── MASTER_SPEC.md      # Single source of truth specification
