# Trovaya Protocol

Initial monorepo scaffold for the consent-first creator IP protocol described in
[`docs/MASTER_SPEC.md`](docs/MASTER_SPEC.md).

## Workspaces

- `apps/web` — creator-facing Next.js dApp
- `services/poison-engine` — FastAPI image perturbation service
- `services/event-indexer` — idempotent on-chain event listener and PostgreSQL migrations
- `packages/contracts` — ERC-721 / ERC-2981 Solidity contracts
- `packages/protocol-sdk` — generated ABI, shared chain configuration, and integration types
- `tests/integration` — cross-workspace contract-boundary checks

## Repository gates

Run these commands from the repository root before integration or pull-request handoff:

```bash
pnpm lint
pnpm test
pnpm build
```

They are non-interactive and match `.github/workflows/ci.yml`. Contract compilation runs before
the protocol SDK generates ABI exports, preventing silent contract-interface drift.

## Local development

Requirements: Node.js 20+, pnpm 9+, Python 3.11+.

```bash
pnpm install
pnpm --filter @trovaya/contracts test

cd services/poison-engine
python -m venv .venv
# Activate the environment, then:
pip install -e ".[dev]"
uvicorn app.main:app --reload

# In another terminal, from the repository root:
cp apps/web/.env.example apps/web/.env.local
pnpm dev:web
```

Each runtime has its own `.env.example`. Keep server credentials out of variables prefixed with
`NEXT_PUBLIC_`; see `docs/OPERATIONS.md` for secret boundaries and database migrations.

The poison engine returns a deterministic mock CID. Production IPFS pinning,
source-file encryption, ZK-human verification, social login, and Supabase
persistence are deliberately left behind typed integration boundaries because
the master specification does not define providers or credentials.
