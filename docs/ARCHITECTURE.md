# 🏛️ System Architecture - Trovaya Protocol

## 1. High-Level Topology

```text
 [ Creator / UMKM Client ]
           │
           ├───────────────► [ Next.js App Router (apps/web) ]
           │                                 │
           │                                 ├─────────► [ FastAPI Poison Engine ]
           │                                 │           (services/poison-engine)
           │                                 │                      │
           │                                 │                      ▼
           │                                 ├─────────► [ Public IPFS (Perturbed) ]
           │                                 │
           │                                 ├─────────► [ Encrypted IPFS Vault ]
           │                                 │
           │                                 ▼
           └───────────────► [ L2 Smart Contracts (packages/contracts) ]
                                 │
                                 ├─────────► TrovayaIPNFT (ERC-721 + ERC-2981)
                                 └─────────► TrovayaVault (ZK-Access Gate)