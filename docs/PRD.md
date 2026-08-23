# 📄 Product Requirement Document (PRD) - Trovaya Protocol

## 1. Executive Summary & Vision

**Trovaya Protocol** is a Web3 decentralized Intellectual Property (IP) registry and safe-haven marketplace designed to protect digital creators and Micro, Small, and Medium Enterprises (MSMEs / UMKMs) from unauthorized AI data scraping[cite: 1].

By combining **on-chain provenance and consent records**, an **experimental
protected-preview pipeline**, a **client-encrypted high-resolution vault**, an
**ERC-721 + ERC-2981 royalty signal**, explicit license receipts, and a
**non-advisory AI asset reviewer**, Trovaya aims to deliver a fair-trade IP
ecosystem for the artificial-intelligence era. These mechanisms create evidence
and controlled access; they do not guarantee copyright validity, royalty
enforcement, or prevention of scraping.

---

## 2. Problem Statement & Market Context (2026 Landscape)

### 2.1 Problem Statements
1. **Uncompensated AI Harvesting:** AI generative models aggressively scrape artworks and cultural product designs across public Web2 and Web3 storage platforms without consent, attribution, or financial compensation.
2. **The Public IPFS Transparency Paradox:** Data stored on decentralized networks (IPFS/Arweave) is immutable and publicly visible by design, making it an easy target for automated AI training scrapers.
3. **Web3 Friction for MSMEs:** Local creators and traditional MSME owners struggle with Web3 complexities, such as gas fees, wallet management, and smart contract executions[cite: 1].
4. **Identity & Privacy Risks:** Traditional KYC procedures expose sensitive business documents and personal identification data to public risks[cite: 1].

### 2.2 Market Context & Regulation (2026 Landscape)
- **Asset Custody & Transparency:** Regulatory frameworks in 2026 place strict emphasis on on-chain asset representation and publicly verifiable proof-of-ownership[cite: 1].
- **Real-World Asset (RWA) & IP Tokenization:** Tokenizing intellectual property rights, physical product designs, and digital creations is rapidly becoming a dominant Web3 growth sector[cite: 1].
- **Non-Advisory AI Compliance:** User-facing AI companions must remain purely educational and focused on auditing and behavioral insights, avoiding speculative financial advice or trading signals[cite: 1].

---

## 3. Target Audience & User Personas

### Persona 1: Pak Budi (Traditional Batik MSME Owner)
- **Background:** Owns hundreds of authentic batik motif designs. Non-technical and unfamiliar with Web3, but worried about AI models copying and automating his heritage designs.
- **Needs:** An easy way to register IP rights, prevent AI bots from replicating his motifs, and earn automated licensing royalties without dealing with complex gas fees[cite: 1].

### Persona 2: Sarah (Digital Freelance Illustrator)
- **Background:** Posts artwork online for client discovery, but frequently falls victim to Stable Diffusion / Midjourney dataset scraping.
- **Needs:** A platform that automatically poisons scraped dataset pipelines while still allowing legitimate buyers to purchase clean, high-resolution original files.

### Persona 3: Alex (Ethical AI Developer / Corporate Licensee)
- **Background:** Seeks to source clean, legally compliant datasets for commercial model training without running into copyright lawsuits.
- **Needs:** Verifiable proof of creator consent, clear licensing terms, and
  separately explained creator-identity and asset-provenance signals.

---

## 4. The 3-Pillar Solution Framework

### Pillar 1: ACCESS (Frictionless Onboarding)
- **One-Door Entry:** Seamless authentication via Web3 Wallets (wagmi/viem) or Social/Email login fallbacks[cite: 1].
- **Mock Identity UX:** Demo-only business-document submission that embeds a
  visible `SAMPLE/CONTOH` watermark. It neither verifies identity nor implements
  a zero-knowledge protocol.
- **Web3 Abstraction:** Complex crypto jargon is abstracted behind familiar terms
  via interactive tooltips (e.g., *"Gas Fee"* $\rightarrow$ *"Biaya
  Transaksi"*), as required by `RULES.md`.

### Pillar 2: OWN & PROTECT (Tokenization & Data Defense)
- **On-Chain IP Registration:** Asset minting utilizing ERC-721 + ERC-2981 Royalty Standards for verifiable proof-of-ownership[cite: 1].
- **Experimental Protected Preview:** Applies a deterministic bounded pixel
  transform before public distribution. The MVP implementation demonstrates the
  workflow and must not be marketed as Glaze/Nightshade-equivalent or effective
  adversarial protection without reproducible benchmarks.
- **Encrypted High-Res Vault:** Original files are encrypted client-side and
  stored off-chain. The MVP may demonstrate authorization with a mock human-proof
  adapter; production access additionally requires secure key delivery and
  explicit expiry/revocation semantics.

### Pillar 3: UNDERSTAND (Unbiased AI Reviewer & Reputation)
- **AI Asset Auditor:** A backend non-advisory engine that summarizes licensing
  terms, checks available provenance evidence, and flags explainable red flags.
  It must not claim to prove asset authenticity.
- **Soulbound Reputation Badges (SBT):** Non-transferable tokens awarded to verified authentic creators and consistent MSME publishers[cite: 1].

---

## 5. Functional Requirements (P0, P1, P2)

### P0 (Critical for a trustworthy MVP demo)
- [ ] **Auth & Wallet Connection:** RainbowKit + wagmi/viem connector targeting L2 / BSC Testnet[cite: 1].
- [ ] **Protected Preview Microservice:** Python FastAPI endpoint
  `/api/v1/poison` accepts validated image buffers and returns an explicitly
  experimental perturbed preview within documented latency/memory limits.
- [ ] **Non-Admin IP-NFT Registration:** a fresh creator wallet can mint directly
  or authorize a relayer through a replay-safe EIP-712 signature. The transaction
  stores consent, canonical persisted content references, and a versioned license
  terms URI/hash.
- [ ] **Public Gallery & Protected View:** Marketplace displaying only perturbed public preview assets.
- [ ] **Honest Demo Vault Authorization:** UI and contract visibly label the mock
  human verifier; authorization state must not be represented as delivery of a
  decryption key.
- [ ] **Persistence and Privacy Boundary:** real IPFS pinning is distinguished
  from labelled demo identifiers, and the public gallery returns only allowlisted
  fields without using an unrestricted public data path or returning private records.
- [ ] **Golden-Path Evidence:** one primary testnet demonstrates upload,
  transform, encryption, real persistence, mint, index, license purchase, and
  authorization with recorded transaction hashes and failure states.

### P1 (High Priority - Value Add)
- [ ] **Mock ZK-KYC Submission:** Lightweight upload form rendering automatic `SAMPLE` watermarks on uploaded credentials[cite: 1].
- [ ] **AI Reviewer Audit Panel:** Interactive card rendering asset authenticity scores and red-flag summaries with explicit educational disclaimers[cite: 1].
- [ ] **Commercial License Purchase:** Payment escrow function transferring license fees directly to creator wallets[cite: 1].
- [ ] **Versioned License Terms:** buyer sees and accepts the exact hashed terms,
  including duration, territory, permitted use/media, exclusivity,
  sublicensing, and AI-training consent, before payment.
- [ ] **Secure Clean-Source Delivery:** an authorized buyer can obtain and use a
  decryption key while unauthorized, expired, or revoked identities cannot begin
  a new delivery. The product states that downloaded plaintext cannot be revoked.

### P2 (Nice-to-Have / Post-Hackathon Roadmap)
- [ ] **Soulbound Badge (SBT) Issuance:** Automatic minting of reputation badges for top-tier MSMEs[cite: 1].
- [ ] **Tax & Transaction Export:** CSV transaction summary exporter (recording cost basis, fees, and timestamps) for official compliance reporting[cite: 1].

Soulbound badges, automated social distribution, public analytics, external
content ingestion, and fractional funding are deferred until all P0 acceptance
criteria pass and the core has no unresolved critical/high security finding.

---

## 6. User Journeys & End-to-End Workflows

### 6.1 Asset Protection & Registration Journey (Creator / MSME)
1. Creator connects wallet or logs in via one-door entry[cite: 1].
2. Optionally completes the visibly labelled Mock Identity UX by uploading a
   `SAMPLE/CONTOH`-watermarked document; this does not verify identity.
3. Navigates to the *Protection Studio* and uploads high-resolution design files.
4. The system sends the image to the Python *Poison Engine* to generate a perturbed public file.
5. The original file is encrypted client-side; configured production mode pins
   both files to IPFS, while demo mode returns visibly labelled non-CID identifiers.
6. Creator sets AI consent preferences (`allowAITraining`: True/False) and defines commercial licensing fees.
7. Registers through the selected direct-mint or signed-relayer contract flow on
   the primary testnet.
8. Dashboard updates automatically, and the AI Reviewer produces a non-advisory
   provenance-evidence and licensing summary with the required disclaimer.

### 6.2 License Purchase & Vault Unlock Journey (Buyer / Licensee)
1. Buyer explores the Trovaya Marketplace[cite: 1].
2. Reviews the perturbed public preview, asset metadata, and AI Reviewer score[cite: 1].
3. Clicks *Purchase Commercial License* or *Unlock High-Res Vault*.
4. Confirms the transaction on-chain[cite: 1].
5. The smart contract validates payment and records vault authorization; the
   mock human verifier, when used, is visibly labelled as a simulation.
6. A separate secure delivery service verifies authorization and releases or
   wraps the decryption key for the buyer. An on-chain authorization event alone
   never exposes or delivers the key.

---

## 7. System Architecture & Tech Stack Alignment

| Layer | Technology | Purpose & Implementation |
| :--- | :--- | :--- |
| **Monorepo Architecture** | `pnpm` Workspaces + Turborepo | Manages `apps/web`, `services/poison-engine`, and `packages/contracts`. |
| **Blockchain Network** | L2 (Base / Arbitrum) / BSC Testnet | Delivers low transaction fees (< $0.001) for MSME accessibility[cite: 1]. |
| **Smart Contracts** | Solidity (`^0.8.20`), OpenZeppelin | `ERC721Enumerable`, `ERC2981` (Royalty), `Ownable`, `ReentrancyGuard`[cite: 1]. |
| **Frontend DApp** | Next.js (App Router), Tailwind CSS | Mobile-first responsive UI with custom Web3 abstraction tooltips[cite: 1]. |
| **Web3 Connector** | `wagmi` (v2), `viem`, RainbowKit | Wallet lifecycle management[cite: 1]. |
| **Protection Backend** | Python 3.11, FastAPI, OpenCV, NumPy | Microservice performing in-memory image matrix perturbation. |
| **Off-Chain Database** | Supabase (PostgreSQL) | Caches event logs, user profiles, and mock KYC records[cite: 1]. |

---

## 8. Success Metrics & Hackathon Evaluation Criteria

1. **Innovation & Relevance (30%):** Addresses uncompensated AI harvesting with
   consent evidence, protected-preview experimentation, and transparent licensing.
2. **Technical Execution & Live Demo (30%):** Repeatable end-to-end integration
   (upload $\rightarrow$ protected preview and encryption $\rightarrow$ real
   persistence $\rightarrow$ non-admin registration $\rightarrow$ license
   purchase $\rightarrow$ vault authorization), with mocks clearly labelled.
3. **UX & Web3 Abstraction (20%):** Seamless onboarding for non-technical users without exposing raw Web3 complexities[cite: 1].
4. **Business Viability & Real Impact (20%):** Practical utility for MSMEs and alignment with 2026 digital asset regulatory standards[cite: 1].

---

## 9. Risk Analysis & Mitigation Strategies

| Risk Factor | Impact Level | Mitigation Strategy |
| :--- | :--- | :--- |
| **Poisoning Processing Latency** | High | Perform pixel perturbations in-memory (RAM) via optimized OpenCV/NumPy matrix operations without writing temporary files to disk. |
| **ZK Verification Complexity** | Medium | Implement a dedicated mock ZK Verifier contract simulating proof validation for live demo reliability. |
| **Claims exceed implementation maturity** | High | Label every capability as Demo/Mock, Experimental, or Production; prohibit unbenchmarked Glaze/Nightshade, legal-enforcement, and real-ZK claims. |
| **Mint authorization mismatch** | Critical | Prove non-admin registration through permissionless self-mint or a replay-safe signed relayer flow before demo. |
| **Private data exposed through public APIs** | Critical | Use allowlisted projections, RLS/session validation, and negative authorization tests; never return KYC, vault, session, or key material. |
| **Authorization mistaken for key delivery** | High | Keep keys off-chain, implement authenticated delivery, define expiry/revocation, and test unauthorized access. |
| **Regulatory Misinterpretation** | Medium | Maintain the AI Reviewer strictly as a non-advisory educational tool with prominent UI disclaimer badges[cite: 1]. |

### 9.1 Product release criteria

- **Demo-ready:** P0 golden path succeeds for a fresh non-admin wallet on one
  primary testnet and every mock/fallback is visible.
- **MVP-ready:** real persistence, versioned terms, secure key delivery, and
  failure-path tests are complete.
- **Production-candidate:** threat/privacy reviews, automated Solidity analysis,
  monitoring and recovery runbooks pass with no unresolved critical/high issue.

The ordered engineering breakdown and verified corrections to the external
evaluation are maintained in `EVALUATION_ACTION_PLAN.md`.

---

## 10. Official Product Expansion: Trust and Accounts

Trovaya formally expands toward an account and trust layer without replacing
or outweighing the original MVP. The protected-asset registration and licensing
journeys in Section 6 remain the primary product path and dominant value.

The trust layer adds passwordless email OTP, personal profiles,
cryptographically linked wallets, mock KYC status, and a moderated community.
These capabilities must preserve a strict boundary between an off-chain account
and self-custodied wallets: OTP session recovery cannot recover a seed phrase,
replace a wallet signer, or transfer on-chain assets. Trovaya does not issue or
store an account password.

Trust indicators must remain separate and explainable. Identity verification,
wallet ownership, creator provenance, and community standing must not be
collapsed into a claim that an asset, business, or investment is guaranteed.
Detailed requirements and security boundaries are defined in
`TRUST_AND_IDENTITY.md`.

Fractional funding and tokenized investment form a subordinate future track,
not the defining value of this pivot. They require a separate architecture and
regulatory decision before entering the implementation backlog. A future
asset-holding contract will use `TrovayaFundingPool`; `TrovayaVault` remains
reserved for encrypted IP access.

### 10.1 Advanced insight distribution

After the core MVP and trust layer are stable, Trovaya may add a provider-neutral
Insights Gateway. It can expose non-advisory creator fundamentals internally,
publish public on-chain aggregates through Dune, and let creators share approved
achievements through X, Threads, or Farcaster.

These integrations are optional channels and must not become sources of truth
for ownership. Initial social delivery is user-initiated; automated publishing
requires explicit consent and revocable OAuth authorization. External articles
must come from licensed APIs, permitted feeds, or canonical links and must not
be converted into trading signals, price predictions, or investment advice.
The technical boundary and delivery order are defined in Section 4 of
`MASTER_SPEC.md`.
