# Local Development Guide

This guide takes a developer from a fresh clone to the available Trovaya runtime modes. Run commands
from the repository root unless a section explicitly changes directory.

## Requirements

- Node.js 22
- pnpm 9.15.4
- Python 3.11 or newer
- Git
- A modern browser

PostgreSQL, wallet credentials, testnet funds, Supabase, and IPFS credentials are optional until a
developer needs the integration that uses them.

## 1. Clone and install

```powershell
git clone <repository-url>
cd Trovaya
corepack enable
corepack install --global pnpm@9.15.4
pnpm.cmd install --frozen-lockfile
pnpm.cmd build
```

On macOS or Linux, use `pnpm` instead of `pnpm.cmd`.

The initial build compiles contracts and generates the protocol SDK ABI output. Generated output is
not committed, so this step is required on a fresh clone.

## 2. Preview the web application

Windows PowerShell:

```powershell
Copy-Item apps/web/.env.example apps/web/.env.local
pnpm.cmd dev:web
```

macOS or Linux:

```bash
cp apps/web/.env.example apps/web/.env.local
pnpm dev:web
```

Keep the terminal open and visit:

| Experience | URL |
| --- | --- |
| Landing and Protection Studio | `http://localhost:3000` |
| Creator workspace | `http://localhost:3000/dashboard` |

The provenance intro appears once per browser session. Replay it from the browser console with:

```javascript
sessionStorage.removeItem("trovaya:intro-seen");
location.reload();
```

## 3. Run the poison engine

The poison engine generates the protected public preview. Install its Python environment once.

Windows PowerShell:

```powershell
cd services/poison-engine
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
cd ../..
pnpm.cmd dev:poison
```

macOS or Linux:

```bash
cd services/poison-engine
python3 -m venv .venv
./.venv/bin/python -m pip install -e ".[dev]"
cd ../..
pnpm dev:poison
```

Expected service and endpoint:

```text
http://localhost:8000
POST http://localhost:8000/api/v1/poison
```

## 4. Configure PostgreSQL and the event indexer

Use this mode only when a PostgreSQL or Supabase database and deployed testnet contract are
available.

Windows PowerShell:

```powershell
Copy-Item services/event-indexer/.env.example services/event-indexer/.env
```

macOS or Linux:

```bash
cp services/event-indexer/.env.example services/event-indexer/.env
```

Configure:

```text
INDEXER_RPC_URL
TROVAYA_IP_NFT_ADDRESS
INDEXER_START_BLOCK
DATABASE_URL
```

Apply files from `services/event-indexer/migrations` in numeric order. Then start the worker:

```powershell
pnpm.cmd dev:indexer
```

Use `pnpm dev:indexer` on macOS or Linux. See [`../OPERATIONS.md`](../OPERATIONS.md) for cursor
behavior and production controls.

## 5. Full terminal layout

Keep each long-running process in a separate terminal.

Terminal 1:

```powershell
pnpm.cmd dev:poison
```

Terminal 2, when the database is configured:

```powershell
pnpm.cmd dev:indexer
```

Terminal 3:

```powershell
pnpm.cmd dev:web
```

## Runtime modes

| Mode | Available behavior | Requirement |
| --- | --- | --- |
| UI preview | Landing, intro, dashboard, and explicit empty states | Web environment example |
| Protection demo | Image perturbation and protected preview | Poison engine |
| Indexed integration | Gallery and creator records | PostgreSQL migrations and indexer |
| Testnet integration | Wallet provenance and commercial licensing | RPC, addresses, and testnet funds |
| External persistence | RLS-restricted Supabase gallery reads and Pinata IPFS pinning | Supabase anon key and server-only Pinata credential |

Missing credentials must produce an explicit demo, empty, or unavailable state. The application
must never silently represent a fallback as a successful production operation.

## Environment and secrets

Each runtime has an adjacent `.env.example`. Copy the example and edit only the ignored local file.

- Only browser-safe values may use the `NEXT_PUBLIC_` prefix.
- The server-rendered public gallery uses `SUPABASE_ANON_KEY` with RLS; it must
  never use or fall back to the service-role key.
- Never commit private keys, service-role keys, KYC documents, clean creator assets, or seed phrases.
- OTP recovery cannot recover a wallet, replace its signer, or transfer on-chain assets.
- Contract addresses are network configuration and must not be hardcoded into UI components.

## Quality gates

```powershell
pnpm.cmd lint
pnpm.cmd test
pnpm.cmd build
```

Use `pnpm` on macOS or Linux. All tasks must succeed before pull-request handoff.

## Start a contribution

```powershell
git switch main
git pull --ff-only origin main
git switch -c feat/web-example
```

Stage only intended files:

```powershell
git status
git diff
git add path/to/changed-file
git diff --cached --check
git diff --cached --stat
```

Avoid `git add .` because local references or unrelated files may be present.

Commit and push:

```powershell
git commit -m "feat(web): describe the change"
git push -u origin feat/web-example
```

The pull-request title must also follow Conventional Commits.

## Troubleshooting

### PowerShell blocks pnpm.ps1

Use the Windows executable without changing the machine execution policy:

```powershell
pnpm.cmd dev:web
```

### The web app cannot import the protocol SDK

Generated ABI output may be missing. Run:

```powershell
pnpm.cmd build
```

### The gallery is empty

An empty gallery is expected without Supabase configuration or indexed contract events. Check the
database migrations, indexer environment, RPC, deployment address, and start block.

### WalletConnect repeatedly fails to subscribe or restore

`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` must either be empty or contain a valid
32-character hexadecimal WalletConnect Cloud project ID. Placeholder values such
as `replace-with-project-id` intentionally disable WalletConnect; injected browser
wallets such as MetaMask remain available.

After changing the value, stop and restart `pnpm.cmd dev:web`. If a previously
configured WalletConnect connector still attempts to restore an obsolete session,
clear site data for `localhost:3000` in the browser and reload. Do not clear wallet
extension data or seed phrases.

### The poison endpoint is unavailable

Confirm the service is running at `http://localhost:8000` and that
`NEXT_PUBLIC_POISON_ENGINE_URL` points to it.
