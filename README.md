# Trovaya Protocol

Trovaya is a consent-first creator IP protocol for protecting digital works and local MSME assets
from unauthorized AI scraping. It combines a protected public preview, client-side encryption,
explicit AI-training consent, on-chain provenance, and transparent commercial licensing.

The product is defined by [`docs/MASTER_SPEC.md`](docs/MASTER_SPEC.md) and
[`docs/PRD.md`](docs/PRD.md). Account, KYC, recovery, profile, and community requirements are defined
in [`docs/TRUST_AND_IDENTITY.md`](docs/TRUST_AND_IDENTITY.md). These trust capabilities support the
core IP-protection journey rather than replacing it.

## MVP journey

```text
Connect an account
  -> upload a work
  -> generate a protected preview
  -> encrypt the clean original
  -> choose AI-training consent
  -> register provenance on-chain
  -> publish the protected work
  -> purchase a commercial license
  -> authorize vault access
```

## Repository map

| Location | Responsibility |
| --- | --- |
| `apps/web` | Next.js creator experience, wallet adapters, and server routes |
| `services/poison-engine` | FastAPI image-protection and mock KYC watermark pipelines |
| `services/event-indexer` | Idempotent blockchain event listener and PostgreSQL migrations |
| `packages/contracts` | ERC-721, ERC-2981, licensing, and vault contracts |
| `packages/protocol-sdk` | Generated ABI, chain configuration, and typed integration state |
| `tests/integration` | Cross-workspace contract-boundary tests |
| `docs` | Product, architecture, security, operations, and contribution decisions |

## Requirements

- Node.js 22
- pnpm 9.15.4
- Python 3.11 or newer
- Git
- A modern browser

PostgreSQL, wallet credentials, IPFS credentials, and testnet funds are only required for the
integration mode that uses them.

## Quick start: UI preview

This path is enough to inspect the landing page, provenance intro, dashboard, responsive layout,
and explicit empty or demo states. It does not claim that blockchain, IPFS, or database operations
are live.

### 1. Clone and enter the repository

```powershell
git clone <repository-url>
cd Trovaya
```

Replace `<repository-url>` with the GitHub clone URL supplied by the repository owner.

### 2. Install the pinned package manager and dependencies

Windows PowerShell:

```powershell
corepack enable
corepack install --global pnpm@9.15.4
pnpm.cmd install --frozen-lockfile
pnpm.cmd build
```

macOS or Linux:

```bash
corepack enable
corepack install --global pnpm@9.15.4
pnpm install --frozen-lockfile
pnpm build
```

Expected result: all workspace dependencies are installed from the root `pnpm-lock.yaml`, contracts
are compiled, and the generated protocol SDK is ready for the web application. Building once is
required on a fresh clone because generated ABI output is not committed.

### 3. Create the local web configuration

Windows PowerShell:

```powershell
Copy-Item apps/web/.env.example apps/web/.env.local
```

macOS or Linux:

```bash
cp apps/web/.env.example apps/web/.env.local
```

The copied `.env.local` is ignored by Git. Never add credentials or private keys to a tracked file.

### 4. Start the web application

Windows PowerShell:

```powershell
pnpm.cmd dev:web
```

macOS or Linux:

```bash
pnpm dev:web
```

Keep this terminal open. Expected local routes:

| Experience | URL |
| --- | --- |
| Public landing and Protection Studio | `http://localhost:3000` |
| Creator workspace | `http://localhost:3000/dashboard` |

The provenance intro appears once per browser session. To replay it during visual review, run this
in the browser console and reload the page:

```javascript
sessionStorage.removeItem("trovaya:intro-seen");
location.reload();
```

## Local protection service

The web application calls the poison engine when a creator submits an image. Install its Python
environment once before starting the service.

### Windows PowerShell

```powershell
cd services/poison-engine
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
cd ../..
pnpm.cmd dev:poison
```

### macOS or Linux

```bash
cd services/poison-engine
python3 -m venv .venv
./.venv/bin/python -m pip install -e ".[dev]"
cd ../..
pnpm dev:poison
```

Keep this terminal open. Expected service address:

```text
http://localhost:8000
```

The endpoint used by the web application is:

```text
POST http://localhost:8000/api/v1/poison
```

## Optional database and event indexer

Use this mode when a PostgreSQL or Supabase database and deployed testnet contract are available.

### 1. Copy the indexer configuration

Windows PowerShell:

```powershell
Copy-Item services/event-indexer/.env.example services/event-indexer/.env
```

macOS or Linux:

```bash
cp services/event-indexer/.env.example services/event-indexer/.env
```

### 2. Configure the required values

```text
INDEXER_RPC_URL
TROVAYA_IP_NFT_ADDRESS
INDEXER_START_BLOCK
DATABASE_URL
```

Apply the SQL files from `services/event-indexer/migrations` in numeric order before starting the
worker. See [`docs/OPERATIONS.md`](docs/OPERATIONS.md) for cursor behavior, secret boundaries, and
production controls.

### 3. Start the indexer in a separate terminal

Windows PowerShell:

```powershell
pnpm.cmd dev:indexer
```

macOS or Linux:

```bash
pnpm dev:indexer
```

## Full local terminal layout

Once the required dependencies and configuration are ready, keep each process in its own terminal.

Terminal 1, image protection:

```powershell
pnpm.cmd dev:poison
```

Terminal 2, event indexing when configured:

```powershell
pnpm.cmd dev:indexer
```

Terminal 3, web application:

```powershell
pnpm.cmd dev:web
```

macOS and Linux users can use the same commands with `pnpm` in place of `pnpm.cmd`.

## Runtime modes

| Mode | Available behavior | Required configuration |
| --- | --- | --- |
| UI preview | Landing, intro, dashboard, empty states, wallet shell | Web environment copied from example |
| Protection demo | Image perturbation and protected preview | Running poison engine |
| Indexed local integration | Gallery and creator records from PostgreSQL | Database migrations and event indexer |
| Testnet integration | Wallet transactions, provenance, and licensing | RPC, deployed addresses, testnet funds |
| External persistence | Supabase-backed reads and Pinata IPFS pinning | Server-only Supabase and Pinata credentials |

Missing credentials must produce an explicit empty, unavailable, or demo state. They must never be
silently represented as a successful production operation.

## Environment and secret rules

Each runtime has an adjacent `.env.example`. Copy the relevant example and edit only the ignored
local file.

- Only values intentionally safe for browsers may use the `NEXT_PUBLIC_` prefix.
- Never commit private keys, service-role keys, KYC documents, clean creator assets, or wallet seed
  phrases.
- Email OTP recovery cannot recover a wallet, replace its signer, or transfer on-chain assets.
- Contract addresses are network-specific configuration and must not be hardcoded into components.

Read [`docs/OPERATIONS.md`](docs/OPERATIONS.md) before configuring deployments or shared credentials.

## Repository quality gates

Run all gates from the repository root before handing work to another developer or opening a pull
request.

Windows PowerShell:

```powershell
pnpm.cmd lint
pnpm.cmd test
pnpm.cmd build
```

macOS or Linux:

```bash
pnpm lint
pnpm test
pnpm build
```

Expected result: every Turborepo task succeeds. These commands match `.github/workflows/ci.yml`.
Contract compilation runs before SDK generation so ABI drift cannot silently reach the frontend.

## Contribution workflow

Do not commit or push directly to `main`. Every change must use a focused branch and pull request.

### 1. Start from the latest main branch

```powershell
git switch main
git pull --ff-only origin main
git switch -c feat/web-example
```

Use a branch name that represents one bounded task, such as `feat/web-creator-gallery`,
`fix/indexer-retry`, or `docs/api-examples`.

### 2. Inspect and stage only intended files

```powershell
git status
git diff
git add path/to/changed-file
git diff --cached --check
git diff --cached --stat
```

Avoid `git add .`. Local references, generated output, or unrelated changes may exist in the shared
workspace.

### 3. Commit using Conventional Commits

```powershell
git commit -m "feat(web): describe the user-facing change"
```

### 4. Run the quality gates and push the branch

```powershell
pnpm.cmd lint
pnpm.cmd test
pnpm.cmd build
git push -u origin feat/web-example
```

Open a pull request to `main`, complete the PR template, wait for CI, and request the required
reviews. Prefer squash merge so the PR title becomes the canonical commit on `main`.

Do not edit `CHANGELOG.md` for ordinary work. Release Please generates release entries from eligible
Conventional Commits merged to `main`.

## Developer onboarding by role

| Role | Start here |
| --- | --- |
| All contributors | [`CONTRIBUTING.md`](CONTRIBUTING.md) |
| Frontend developer | [`Frontend Contribution Guide`](docs/guides/FRONTEND_CONTRIBUTION_GUIDE.md) |
| Frontend and protocol owners | [`Frontend Integration Contract`](docs/architecture/FRONTEND_INTEGRATION_CONTRACT.md) |
| Backend and integration developer | [`Integration Runbook`](docs/INTEGRATION.md) |
| Smart-contract developer | [`Contract Architecture`](docs/CONTRACT_ARCHITECTURE.md) |
| Deployment and operations owner | [`Operations Guide`](docs/OPERATIONS.md) |
| Product or UI reviewer | [`PRD`](docs/PRD.md) and [`Design Specification`](docs/DESIGN.md) |

## Current demo boundaries

- Mock KYC output must carry a visible `SAMPLE` watermark.
- Demo IPFS identifiers do not mean content was persisted to a public network.
- Vault authorization does not yet deliver a production decryption key to a licensed buyer.
- Passwordless email OTP, social login, and community features remain expansion boundaries.
- AI audit output is educational and non-advisory.
- Production deployment requires real service credentials, deployed addresses, monitoring, and an
  approved key-delivery design.

## Documentation index

- [`docs/MASTER_SPEC.md`](docs/MASTER_SPEC.md): technical product authority
- [`docs/PRD.md`](docs/PRD.md): requirements, priorities, personas, and journeys
- [`docs/DESIGN.md`](docs/DESIGN.md): brand identity and visual system
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): system architecture
- [`docs/CONTRACT_ARCHITECTURE.md`](docs/CONTRACT_ARCHITECTURE.md): smart-contract design
- [`docs/INTEGRATION.md`](docs/INTEGRATION.md): end-to-end integration runbook
- [`docs/OPERATIONS.md`](docs/OPERATIONS.md): secrets, migrations, and operating controls
- [`docs/TRUST_AND_IDENTITY.md`](docs/TRUST_AND_IDENTITY.md): accounts, OTP, KYC, and trust boundaries
- [`CONTRIBUTING.md`](CONTRIBUTING.md): repository-wide contribution policy
- [`CHANGELOG.md`](CHANGELOG.md): automated release history

Optional post-MVP analytics and social connectors are scoped in Section 4 of
[`docs/MASTER_SPEC.md`](docs/MASTER_SPEC.md). They are not sources of truth for ownership,
protection, licensing, or vault access.
