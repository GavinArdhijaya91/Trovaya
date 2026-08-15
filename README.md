# Trovaya Protocol

Trovaya is a consent-first IP protection and fair-trade protocol for digital creators and local
MSMEs. It combines protected public previews, encrypted originals, explicit AI-training consent,
on-chain provenance, and transparent commercial licensing.

The product is governed by [`docs/MASTER_SPEC.md`](docs/MASTER_SPEC.md) and
[`docs/PRD.md`](docs/PRD.md).

## Core journey

```text
Connect account
  -> upload work
  -> generate protected preview
  -> encrypt clean original
  -> record AI consent and provenance
  -> publish protected work
  -> purchase license
  -> authorize vault access
```

## Monorepo

| Location | Responsibility |
| --- | --- |
| `apps/web` | Next.js creator experience and wallet integration |
| `services/poison-engine` | FastAPI image protection and mock KYC watermarking |
| `services/event-indexer` | Blockchain event indexing and PostgreSQL migrations |
| `packages/contracts` | ERC-721, ERC-2981, licensing, and vault contracts |
| `packages/protocol-sdk` | Generated ABI and typed frontend integration state |
| `tests/integration` | Cross-workspace contract-boundary tests |

## Quick start

Requirements: Node.js 22, pnpm 9.15.4, Python 3.11 or newer, and Git.

Windows PowerShell:

```powershell
corepack enable
corepack install --global pnpm@9.15.4
pnpm.cmd install --frozen-lockfile
pnpm.cmd build
Copy-Item apps/web/.env.example apps/web/.env.local
pnpm.cmd dev:web
```

macOS or Linux:

```bash
corepack enable
corepack install --global pnpm@9.15.4
pnpm install --frozen-lockfile
pnpm build
cp apps/web/.env.example apps/web/.env.local
pnpm dev:web
```

Open:

- Landing and Protection Studio: `http://localhost:3000`
- Creator workspace: `http://localhost:3000/dashboard`

The UI can run with explicit demo and empty states. Image protection, PostgreSQL indexing, testnet
contracts, Supabase, and IPFS persistence require their respective services and credentials.

For the complete setup, terminal layout, runtime modes, environment variables, and troubleshooting,
read the [`Local Development Guide`](docs/guides/LOCAL_DEVELOPMENT.md).

## Quality gates

Run from the repository root before opening or updating a pull request:

```powershell
pnpm.cmd lint
pnpm.cmd test
pnpm.cmd build
```

Use `pnpm` in place of `pnpm.cmd` on macOS or Linux. These gates match
`.github/workflows/ci.yml`.

## Contribution rule

Do not commit or push directly to `main`.

```text
latest main
  -> focused branch
  -> implementation
  -> lint, test, and build
  -> pull request
  -> CI and review
  -> squash merge
```

Use Conventional Commits, stage only intended files, and do not edit `CHANGELOG.md` manually.
Release Please generates release history after eligible changes reach `main`.

Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before making changes.

## Documentation

- [`MASTER_SPEC.md`](docs/MASTER_SPEC.md): technical product authority
- [`PRD.md`](docs/PRD.md): priorities, personas, and user journeys
- [`DESIGN.md`](docs/DESIGN.md): brand identity and visual system
- [`ARCHITECTURE.md`](docs/ARCHITECTURE.md): system boundaries
- [`CONTRACT_ARCHITECTURE.md`](docs/CONTRACT_ARCHITECTURE.md): smart-contract design
- [`INTEGRATION.md`](docs/INTEGRATION.md): end-to-end integration runbook
- [`OPERATIONS.md`](docs/OPERATIONS.md): secrets, migrations, and controls
- [`TRUST_AND_IDENTITY.md`](docs/TRUST_AND_IDENTITY.md): OTP, KYC, profile, and trust boundaries
- [`Frontend Contribution Guide`](docs/guides/FRONTEND_CONTRIBUTION_GUIDE.md)
- [`Frontend Integration Contract`](docs/architecture/FRONTEND_INTEGRATION_CONTRACT.md)
- [`CHANGELOG.md`](CHANGELOG.md): automated release history

## Current boundaries

- Mock KYC must display a visible `SAMPLE` watermark.
- Demo identifiers do not prove public IPFS persistence.
- Vault authorization does not yet provide production key delivery.
- AI audit output is educational and non-advisory.
- Production deployment requires real credentials, deployed addresses, monitoring, and approved
  security controls.
