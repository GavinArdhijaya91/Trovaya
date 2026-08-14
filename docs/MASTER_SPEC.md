# 🛡️ Trovaya Protocol - Master Technical Specification

## 1. Executive Overview
Trovaya is a Web3 creator platform and decentralized Intellectual Property (IP) vault designed to protect digital creators and local UMKMs from unauthorized AI scraping. By combining on-chain data poisoning, encrypted high-res storage unlocked via ZK-Proofs, and non-advisory AI asset auditing, Trovaya establishes a transparent, consent-first creator economy.

---

## 2. Core Architecture Framework (3 Pillars)

### Pillar 1: Access (Frictionless Onboarding)
- **One-Door Entry:** Wallet connector (wagmi/viem) + Social Login fallback.
- **Mock ZK-KYC:** Lightweight document verification for UMKM identity with explicit `SAMPLE` watermarks for privacy.
- **UX Abstraction:** Technical Web3 terms (gas fees, smart contracts) are abstracted behind familiar traditional finance tooltips[cite: 1].

### Pillar 2: Own & Protect (Tokenization & Data Defense)
- **On-Chain Registration:** ERC-721 + ERC-2981 Royalty Standard for asset proof-of-ownership[cite: 1].
- **Invisible Data Poisoning:** Images undergo pixel perturbation (Glaze/Nightshade concept) before public IPFS pinning to disrupt unauthorized AI dataset training models.
- **Encrypted Vault:** Clean high-resolution source files are encrypted off-chain and gated behind ZK-Proof human verification (e.g., World ID / Semaphore).

### Pillar 3: Understand (Unbiased AI Reviewer & Reputation)
- **AI Asset Auditor:** Non-advisory backend AI service that analyzes license metadata, verifies IP authenticity, and flags red flags[cite: 1].
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

1. Complete and harden the protection and licensing MVP.
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
