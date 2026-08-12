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

## 3. Monorepo Architecture Layout

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