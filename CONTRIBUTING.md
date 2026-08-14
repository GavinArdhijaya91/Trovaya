# Contributing to Trovaya

Trovaya uses pull requests, Conventional Commits, and automated repository gates. Keep changes
small enough that their product and security impact can be reviewed independently.

Frontend contributors should also follow the practical
[`Frontend Contribution Guide`](docs/guides/FRONTEND_CONTRIBUTION_GUIDE.md).

## Development workflow

1. Branch from the latest `main` using `feat/<topic>`, `fix/<topic>`, or `docs/<topic>`.
2. Keep implementation inside its workspace boundary.
3. Use a Conventional Commit title, for example `feat(web): add creator gallery filters`.
4. Run `pnpm lint`, `pnpm test`, and `pnpm build` from the repository root.
5. Open a pull request and complete the integration-impact checklist.
6. Prefer squash merge so the pull-request title becomes the canonical commit on `main`.

Do not edit `CHANGELOG.md` for ordinary changes. Release Please derives it from commits merged to
`main`.

## Ownership and approval

Implementation details may be changed by the owner of their area when the published integration
contract remains intact:

- `apps/web`: frontend owner;
- `services/**`: backend owner;
- `packages/contracts`: smart-contract owner; and
- `packages/protocol-sdk`: shared by frontend, backend, and smart-contract owners.

A change to an API, ABI, event, SDK type, operation state, environment-variable name, authentication
flow, database contract, or security assumption is a **shared-interface change**. It requires review
from every affected owner before merge. A breaking shared-interface change must also include:

- a migration or compatibility plan;
- updated types, ABI, OpenAPI/schema, and examples as applicable;
- tests covering both producer and consumer; and
- an explicit `BREAKING CHANGE:` footer or `!` in the squash-merge title.

The detailed agreement is maintained in
[`docs/architecture/FRONTEND_INTEGRATION_CONTRACT.md`](docs/architecture/FRONTEND_INTEGRATION_CONTRACT.md).
When the agreement itself changes, update that document in the same pull request. Documentation is
the source of review policy; deployed contract state and versioned schemas remain the source of
runtime truth.

## Secrets and generated files

Never commit secrets, local environment files, private keys, KYC documents, uploaded creator assets,
or generated build/cache output. Add new public configuration keys to the adjacent `.env.example`.
Only variables intentionally safe for browsers may use the `NEXT_PUBLIC_` prefix.
