# 📄 Product Requirement Document (PRD) - Trovaya Protocol

## 1. Executive Summary & Vision

**Trovaya Protocol** is a Web3 decentralized Intellectual Property (IP) registry and safe-haven marketplace designed to protect digital creators and Micro, Small, and Medium Enterprises (MSMEs / UMKMs) from unauthorized AI data scraping[cite: 1].

By combining an **On-Chain Data Poisoning Pipeline**, a **ZK-Proof Encrypted High-Res Vault**, an **ERC-721 + ERC-2981 Royalty Standard**, and an **Unbiased AI Asset Reviewer (Non-Advisory)**, Trovaya delivers a fair-trade IP ecosystem built for the artificial intelligence era[cite: 1].

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
- **Needs:** Verifiable proof of creator consent, clear licensing terms, and ZK-KYC authenticated asset provenance[cite: 1].

---

## 4. The 3-Pillar Solution Framework

### Pillar 1: ACCESS (Frictionless Onboarding)
- **One-Door Entry:** Seamless authentication via Web3 Wallets (wagmi/viem) or Social/Email login fallbacks[cite: 1].
- **Mock ZK-KYC:** Lightweight business verification (NIB/ID) utilizing Zero-Knowledge principles, automatically embedding `SAMPLE` / `CONTOH` watermarks for privacy during verification[cite: 1].
- **Web3 Abstraction:** Complex crypto jargon is abstracted behind familiar traditional finance terms via interactive tooltips (e.g., *"Gas Fee"* $\rightarrow$ *"Network Processing Fee"*)[cite: 1].

### Pillar 2: OWN & PROTECT (Tokenization & Data Defense)
- **On-Chain IP Registration:** Asset minting utilizing ERC-721 + ERC-2981 Royalty Standards for verifiable proof-of-ownership[cite: 1].
- **Invisible Data Poisoning:** Applies subtle pixel perturbations (Glaze/Nightshade methodology) prior to public IPFS pinning, corrupting unauthorized AI training extraction models.
- **Encrypted High-Res Vault:** Original pristine files are encrypted client-side and stored in IPFS vaults, unlocked exclusively via Zero-Knowledge Proof (Proof-of-Humanity) or verified licensing payments.

### Pillar 3: UNDERSTAND (Unbiased AI Reviewer & Reputation)
- **AI Asset Auditor:** A backend non-advisory AI engine that analyzes asset authenticity, summarizes licensing terms, and flags potential red flags[cite: 1].
- **Soulbound Reputation Badges (SBT):** Non-transferable tokens awarded to verified authentic creators and consistent MSME publishers[cite: 1].

---

## 5. Functional Requirements (P0, P1, P2)

### P0 (Critical for Hackathon MVP Demo)
- [ ] **Auth & Wallet Connection:** RainbowKit + wagmi/viem connector targeting L2 / BSC Testnet[cite: 1].
- [ ] **Poison Engine Microservice:** Python FastAPI endpoint `/api/v1/poison` accepting image buffers and returning perturbed preview images.
- [ ] **IP-NFT Minting Flow:** `TrovayaIPNFT.sol` contract execution storing `allowAITraining`, `publicPoisonedCid`, and `encryptedVaultCid` parameters[cite: 1].
- [ ] **Public Gallery & Protected View:** Marketplace displaying only perturbed public preview assets.
- [ ] **Mock ZK-Proof Vault Unlock:** Interoperable UI button simulating Zero-Knowledge identity verification before revealing vault decryption keys.

### P1 (High Priority - Value Add)
- [ ] **Mock ZK-KYC Submission:** Lightweight upload form rendering automatic `SAMPLE` watermarks on uploaded credentials[cite: 1].
- [ ] **AI Reviewer Audit Panel:** Interactive card rendering asset authenticity scores and red-flag summaries with explicit educational disclaimers[cite: 1].
- [ ] **Commercial License Purchase:** Payment escrow function transferring license fees directly to creator wallets[cite: 1].

### P2 (Nice-to-Have / Post-Hackathon Roadmap)
- [ ] **Soulbound Badge (SBT) Issuance:** Automatic minting of reputation badges for top-tier MSMEs[cite: 1].
- [ ] **Tax & Transaction Export:** CSV transaction summary exporter (recording cost basis, fees, and timestamps) for official compliance reporting[cite: 1].

---

## 6. User Journeys & End-to-End Workflows

### 6.1 Asset Protection & Registration Journey (Creator / MSME)
1. Creator connects wallet or logs in via one-door entry[cite: 1].
2. Completes lightweight Mock ZK-KYC by uploading watermarked identity documents[cite: 1].
3. Navigates to the *Protection Studio* and uploads high-resolution design files.
4. The system sends the image to the Python *Poison Engine* to generate a perturbed public file.
5. The original file is encrypted client-side; both files are pinned to IPFS.
6. Creator sets AI consent preferences (`allowAITraining`: True/False) and defines commercial licensing fees.
7. Executes `mintIP()` on the L2 Smart Contract (BSC Testnet)[cite: 1].
8. Dashboard updates automatically, and the AI Reviewer generates an authenticity report[cite: 1].

### 6.2 License Purchase & Vault Unlock Journey (Buyer / Licensee)
1. Buyer explores the Trovaya Marketplace[cite: 1].
2. Reviews the perturbed public preview, asset metadata, and AI Reviewer score[cite: 1].
3. Clicks *Purchase Commercial License* or *Unlock High-Res Vault*.
4. Confirms the transaction on-chain[cite: 1].
5. The smart contract validates payment and ZK-Human status.
6. Decryption keys are granted to the buyer, allowing direct download of the clean, uncorrupted original file from the vault.

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

1. **Innovation & Relevance (30%):** Directly tackles AI copyright infringement and MSME IP harvesting using a novel decentralized data poisoning approach[cite: 1].
2. **Technical Execution & Live Demo (30%):** Flawless end-to-end integration (Upload $\rightarrow$ Python Perturbation $\rightarrow$ Smart Contract Mint $\rightarrow$ ZK-Vault Unlock)[cite: 1].
3. **UX & Web3 Abstraction (20%):** Seamless onboarding for non-technical users without exposing raw Web3 complexities[cite: 1].
4. **Business Viability & Real Impact (20%):** Practical utility for MSMEs and alignment with 2026 digital asset regulatory standards[cite: 1].

---

## 9. Risk Analysis & Mitigation Strategies

| Risk Factor | Impact Level | Mitigation Strategy |
| :--- | :--- | :--- |
| **Poisoning Processing Latency** | High | Perform pixel perturbations in-memory (RAM) via optimized OpenCV/NumPy matrix operations without writing temporary files to disk. |
| **ZK Verification Complexity** | Medium | Implement a dedicated mock ZK Verifier contract simulating proof validation for live demo reliability. |
| **Regulatory Misinterpretation** | Medium | Maintain the AI Reviewer strictly as a non-advisory educational tool with prominent UI disclaimer badges[cite: 1]. |