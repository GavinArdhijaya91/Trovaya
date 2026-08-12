# 🛠️ Team & Agent Capabilities Matrix

## 1. Tech Stack Proficiency Map

| Domain | Primary Technology | Secondary Tooling |
| :--- | :--- | :--- |
| **Smart Contracts** | Solidity (`0.8.20`), Hardhat/Foundry[cite: 1] | OpenZeppelin, BscScan API[cite: 1] |
| **Frontend** | Next.js (App Router), TypeScript | Tailwind CSS, Framer Motion, RainbowKit[cite: 1] |
| **Blockchain Client** | `wagmi` (v2), `viem` | TanStack Query[cite: 1] |
| **Backend & Pipeline** | Python 3.11, FastAPI | OpenCV, NumPy, Pillow, PyTorch |
| **Database & Auth** | Supabase (PostgreSQL)[cite: 1] | RainbowKit / Wallet Connect[cite: 1] |

---

## 2. Agent Prompting Rules per Directory

When executing coding tasks via AI Agents (Claude Code / Cursor / Codex), inject these domain skills:

### When working in `packages/contracts/`:
> *"Act as an EVM Smart Contract Auditor. Prioritize gas efficiency, checks-effects-interactions pattern, OpenZeppelin standards, and comprehensive Hardhat unit test coverage."*[cite: 1]

### When working in `services/poison-engine/`:
> *"Act as a Computer Vision & Machine Learning Engineer. Write clean Python FastAPI code focused on fast in-memory image matrix manipulations and graceful error handling."*

### When working in `apps/web/`:
> *"Act as a Lead Web3 Frontend Engineer. Focus on clean UI/UX, responsive Tailwind layouts, typed wagmi hooks, and hiding Web3 complexity from mainstream users."*[cite: 1]