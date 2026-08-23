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

WalletConnect is optional during local development. Leave
`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` empty to use an injected browser wallet
such as MetaMask. Mobile/QR wallet connections require a valid 32-character
project ID from WalletConnect Cloud. Placeholder values are rejected so they do
not start a broken relay subscription.

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

## Verify the Supabase public-gallery boundary

The public gallery uses `SUPABASE_ANON_KEY`, PostgreSQL row-level security
(RLS), an allowlisted view, and a second response allowlist in the web API. It
must never use or fall back to `SUPABASE_SERVICE_ROLE_KEY`.

### 1. Apply the database migration

Apply migrations in numeric order. For an existing database that already has
`001` and `002`, apply:

```powershell
$env:TROVAYA_DATABASE_URL = Read-Host "Supabase database connection string"
psql $env:TROVAYA_DATABASE_URL -v ON_ERROR_STOP=1 -f "services/event-indexer/migrations/003_public_gallery_boundary.sql"
Remove-Item Env:TROVAYA_DATABASE_URL
```

Obtain the connection string from Supabase **Project Settings -> Database ->
Connection string**. If `psql` is unavailable, open the Supabase SQL Editor and
run the contents of
[`003_public_gallery_boundary.sql`](services/event-indexer/migrations/003_public_gallery_boundary.sql).

The migration:

- enables RLS on indexed operational tables;
- removes broad `anon` and `authenticated` table access;
- grants only approved gallery columns;
- creates the `public_gallery_assets` security-invoker view;
- excludes encrypted-vault, identity, session, and key-delivery data.

### 2. Configure and run the web application

Set these values in the ignored `apps/web/.env.local` file:

```dotenv
SUPABASE_URL=https://PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=YOUR_PROJECT_ANON_KEY
```

Do not add `SUPABASE_SERVICE_ROLE_KEY` to the public gallery configuration.
Restart the web process after changing environment values:

```powershell
pnpm.cmd dev:web
```

In another PowerShell terminal, verify the application boundary:

```powershell
Invoke-RestMethod http://localhost:3000/api/assets | ConvertTo-Json -Depth 5
```

A configured endpoint returns `assets` containing only:

```text
id
chain_id
token_id
creator_wallet
allow_ai_training
public_poisoned_cid
commercial_license_fee_wei
token_uri
status
created_at
```

It must not return `encrypted_vault_cid`, encryption or wrapped keys, identity
documents, email/session data, or delivery tokens. An unconfigured endpoint
fails closed with HTTP `503`; an invalid upstream response returns HTTP `502`.

### 3. Run positive and negative anon-access tests

Load the project URL and anon key into the current terminal session:

```powershell
$env:TROVAYA_SUPABASE_URL = Read-Host "Supabase URL"
$env:TROVAYA_SUPABASE_ANON_KEY = Read-Host "Supabase anon key"
$headers = @{
  apikey = $env:TROVAYA_SUPABASE_ANON_KEY
  Authorization = "Bearer $env:TROVAYA_SUPABASE_ANON_KEY"
}
```

The allowlisted public view must return HTTP `200`:

```powershell
Invoke-WebRequest `
  -Uri "$env:TROVAYA_SUPABASE_URL/rest/v1/public_gallery_assets?select=*&limit=1" `
  -Headers $headers |
Select-Object StatusCode, Content
```

A direct request for the encrypted vault reference must be denied:

```powershell
Invoke-WebRequest `
  -Uri "$env:TROVAYA_SUPABASE_URL/rest/v1/ip_assets?select=encrypted_vault_cid&limit=1" `
  -Headers $headers `
  -SkipHttpErrorCheck |
Select-Object StatusCode, Content
```

The operational tables must also be denied:

```powershell
"users", "licenses", "indexer_cursors" | ForEach-Object {
  $response = Invoke-WebRequest `
    -Uri "$env:TROVAYA_SUPABASE_URL/rest/v1/$($_)?select=*&limit=1" `
    -Headers $headers `
    -SkipHttpErrorCheck

  [PSCustomObject]@{
    Table = $_
    StatusCode = $response.StatusCode
    Content = $response.Content
  }
}
```

Expected results:

| Request | Expected result |
| --- | --- |
| `public_gallery_assets` | HTTP `200` |
| `ip_assets.encrypted_vault_cid` | HTTP `401`, `403`, or a PostgREST permission error |
| `users` | denied |
| `licenses` | denied |
| `indexer_cursors` | denied |

Clean the terminal variables afterward:

```powershell
Remove-Item Env:TROVAYA_SUPABASE_URL
Remove-Item Env:TROVAYA_SUPABASE_ANON_KEY
Remove-Variable headers
```

Never paste database connection strings, service-role keys, or test output that
contains credentials into issues, commits, screenshots, or group chats. The anon
key is intended for public clients, but its effective permissions must still be
limited by RLS and explicit grants.

## Supabase email-OTP account foundation

Passwordless email login is implemented with Supabase's numeric email OTP flow
and cookie-based SSR sessions. Its database foundation lives separately from
event-indexer data:

```text
Supabase auth.users
  -> account_profiles       private owner preferences
  -> creator_profiles       explicitly public creator fields
  -> linked_wallets         signature-verified wallet relationships
  -> wallet_link_challenges server-only hashed, expiring nonces
  -> account_audit_events   server-only security audit trail
```

Apply [`202608230001_account_foundation.sql`](supabase/migrations/202608230001_account_foundation.sql)
only to a Supabase project, then run the read-only checks in
[`account_foundation_verification.sql`](supabase/tests/account_foundation_verification.sql).
The indexer's `public.users` table remains a blockchain wallet directory and is
not an email-account table.

Browser auth will use:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PROJECT_ANON_KEY
```

These values are browser-public and constrained by RLS. Never expose
`SUPABASE_SERVICE_ROLE_KEY`.

Before testing the runtime:

1. Apply the account-foundation migration.
2. In Supabase Auth, enable Email and configure the email template to contain
   `{{ .Token }}` so Supabase sends a six-digit OTP rather than only a magic link.
3. Configure Site URL and allowed redirect URLs for `http://localhost:3000` and
   the production domain.
4. Add the two `NEXT_PUBLIC_` values to `apps/web/.env.local` and restart the web
   server.

The UI supports OTP request, generic delivery feedback, six-digit verification,
60-second resend cooldown, cookie session restoration, verified-email display,
and logout. Wallet linking remains a separate server-side challenge and
signature-verification flow; email login never grants signing authority.

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
