# Deployment topology

Trovaya deploys as three independently scalable runtimes plus managed infrastructure:

```text
Browser -> Next.js web/API -> Supabase REST/PostgreSQL
                    |                  ^
                    v                  |
              Poison Engine      Event Indexer <- RPC / TrovayaIPNFT
```

## Runtime contracts

| Runtime | Build | Start | Health | Required production configuration |
| --- | --- | --- | --- | --- |
| Web | `pnpm --filter @trovaya/web build` | `pnpm --filter @trovaya/web start` | `/api/health`, `/api/ready` | Public chain configuration; integration groups are all-or-none |
| Event indexer | `pnpm --filter @trovaya/event-indexer build` | `pnpm --filter @trovaya/event-indexer start` | Process health plus cursor freshness alert | RPC, expected chain, contract address, deployment block, PostgreSQL URL |
| Poison engine | `pnpm --filter @trovaya/poison-engine build` | `pnpm --filter @trovaya/poison-engine start` | `/health` | Allowed origins, bind host/port, worker count |

Run `pnpm env:check` in CI to validate the configuration contract. Before starting a deployed
runtime, inject its environment and run `node scripts/check-env.mjs --runtime --service=<web|indexer|poison|contracts>`.
Secrets remain in the deployment platform and must not be baked into container images.
The checked-in `.dockerignore` files exclude local environment files from Docker build contexts.

## Database ownership

`services/event-indexer/migrations` is the canonical operational/gallery schema. Supabase mirrors
those files with timestamped names because the Supabase CLI requires a single ordered migration
stream alongside Auth and vault migrations. Any operational migration change must update both
locations and pass `pnpm migrations:check`. Existing migrations are append-only after deployment.

## Containers

`deploy/compose.yml` provides local PostgreSQL, poison-engine, and indexer topology. Start the
standalone services with:

```bash
docker compose -f deploy/compose.yml up --build postgres poison-engine
```

The indexer also needs a running chain and a real `TROVAYA_IP_NFT_ADDRESS`. The compose defaults
are local-only and are not production credentials. Production should use managed PostgreSQL,
TLS endpoints, secret injection, restart policies, centralized logs, and cursor-lag alerts.

## End-to-end smoke test

With Docker running, execute `pnpm smoke:local`. It starts an ephemeral PostgreSQL container and
Hardhat chain, applies canonical migrations, deploys and mints a real `TrovayaIPNFT`, runs the real
event indexer, and asserts that token 1 appears in the `public_gallery_assets` projection. The
command removes its containers and volume afterward. It does not use testnet funds or local secrets.

## Release checks

1. Run `pnpm env:check`, `pnpm migrations:check`, `pnpm lint`, `pnpm test`, and `pnpm build`.
2. Run `pnpm smoke:local` on a Docker-capable integration runner.
3. Apply new migrations before deploying the indexer.
4. Verify contract bytecode, chain ID, deployment block, roles, and explorer source.
5. Verify web and poison health endpoints and alert on indexer cursor lag.
