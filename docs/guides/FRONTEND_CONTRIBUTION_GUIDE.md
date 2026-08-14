# Frontend Contribution Guide

This guide describes the contribution flow from a frontend developer's point of view. Read
[`CONTRIBUTING.md`](../../CONTRIBUTING.md) first for repository-wide rules and the
[`Frontend Integration Contract`](../architecture/FRONTEND_INTEGRATION_CONTRACT.md) before changing
an API, SDK type, wallet flow, or other shared boundary.

## 1. Prepare the workspace

Use Node.js 22 and pnpm 9.15.4 to match CI. From the repository root:

```bash
git switch main
git pull --ff-only origin main
pnpm install --frozen-lockfile
```

Create the web environment file without committing it:

```powershell
Copy-Item apps/web/.env.example apps/web/.env.local
```

On macOS or Linux, use:

```bash
cp apps/web/.env.example apps/web/.env.local
```

At minimum, provide a WalletConnect project ID and the intended chain configuration when testing
wallet-backed flows. Values without `NEXT_PUBLIC_` are server-only and must never be read by client
components.

Start the web app:

```bash
pnpm dev:web
```

The default local address is `http://localhost:3000`. Run the poison engine separately with
`pnpm dev:poison` when working on asset protection. Gallery persistence and live IPFS pinning need
the server-side Supabase and Pinata values documented in the environment example.

## 2. Create a focused branch

Branch from the latest `main`:

```bash
git switch -c feat/web-creator-gallery
```

Use `feat/`, `fix/`, `refactor/`, or `docs/` followed by a short topic. Keep unrelated formatting,
dependency, protocol, and UI changes in separate branches or commits.

## 3. Work inside the frontend boundary

| Location | Responsibility |
| --- | --- |
| `apps/web/app` | routes, layouts, server routes, and page composition |
| `apps/web/components` | reusable presentation and product components |
| `apps/web/hooks` | wallet and protocol adapter hooks |
| `apps/web/lib` | typed service clients, configuration, terminology, and utilities |
| `packages/protocol-sdk` | shared ABI, chain configuration, operation state, and integration errors |

UI components must not call contract ABIs or interpret raw wallet/provider errors. Use an existing
hook such as `useRegisterIP` or `useLicenseActions`. For a new protocol action, coordinate with the
backend or smart-contract owner and implement this sequence:

```text
contract or API schema
  -> protocol SDK type
  -> focused hook in apps/web/hooks
  -> OperationState
  -> reusable UI component
```

The stable phases are `idle`, `preparing`, `awaiting_wallet`, `submitted`, `confirming`, `indexing`,
`completed`, and `failed`. Render these through the shared operation UI instead of inventing a
component-local transaction lifecycle.

## 4. Preserve Trovaya's UX language

The interface should explain outcomes in familiar language while retaining accurate consent,
ownership, licensing, and payment meaning. Reuse `apps/web/lib/terminology.ts`; for example:

- use **Biaya Pemrosesan Jaringan**, not “gas fee” as the primary label;
- use **Tanda Tangan Digital**, not “wallet signature” as the primary instruction;
- use **Pendaftaran Hak Cipta Digital**, not “mint NFT” as the primary action; and
- show technical identifiers as optional proof details, not as the main task.

Never hide a cost, irreversible action, AI-training consent choice, or transaction failure. AI
insights must keep the explicit non-advisory disclaimer required by the product specification.

## 5. Develop with explicit service states

Local fallbacks are for UI development and must not claim that a production action occurred:

- without Pinata credentials, pinning returns deterministic demo identifiers;
- without Supabase configuration, the gallery may be empty; and
- vault authorization does not deliver a clean-asset decryption key to a buyer.

Design and test loading, empty, disconnected, rejected, retryable error, success, and configuration-
missing states. Do not replace missing services with silent fake success.

## 6. Validate before handoff

Run the same gates as CI from the repository root:

```bash
pnpm lint
pnpm test
pnpm build
```

Also smoke-test the user path affected by the change. For wallet work, cover disconnected wallet,
wrong or unavailable network, rejected signature, pending transaction, confirmed transaction, and
readable failure copy. Confirm that no `.env.local`, build output, uploaded asset, or personal data
appears in `git status`.

## 7. Commit and open a pull request

Use a Conventional Commit message with the `web` scope:

```bash
git add -- apps/web
git commit -m "feat(web): add creator gallery filters"
git push -u origin feat/web-creator-gallery
```

The pull-request title must also follow Conventional Commits because squash merge makes it the
canonical commit on `main`. Complete the repository pull-request template and describe screenshots
or manual test evidence when the visible experience changes.

Do not edit `CHANGELOG.md`. Release Please generates it after eligible commits reach `main`.

## 8. Know when joint approval is required

Request review from every affected owner before changing:

- a contract function, event, ABI, address, or supported chain;
- an API request, response, status code, or stable error code;
- a protocol SDK type or operation phase;
- an environment-variable name or public/server boundary;
- a database schema used by the web application;
- authentication, OTP, wallet linking, KYC, or account recovery behavior; or
- a security, consent, ownership, licensing, or payment assumption.

Visual styling, accessibility improvements, component internals, and frontend-only refactors do not
need joint approval when their observable behavior and all shared boundaries remain compatible.

## Quick handoff checklist

- [ ] Branch started from the latest `main`.
- [ ] UI uses hooks and SDK types instead of raw ABI calls.
- [ ] Loading, empty, wallet, error, and success states are covered.
- [ ] Trovaya terminology and required disclaimers remain intact.
- [ ] No secret, personal data, generated output, or creator source asset is tracked.
- [ ] Lint, tests, build, and the affected user flow pass.
- [ ] Shared-interface changes have affected-owner approval and a migration plan.
- [ ] Commit and pull-request titles follow Conventional Commits.

