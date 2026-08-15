# Frontend Integration Contract

**Status:** Accepted  
**Applies to:** frontend, backend services, protocol SDK, indexer, and smart contracts  
**Authority:** `docs/MASTER_SPEC.md` and `docs/PRD.md` remain the product sources of truth

## Purpose

This agreement keeps frontend and protocol development independent without allowing either side to
silently break the other. It governs integration boundaries, not internal implementation choices.

## Stable boundaries

The following interfaces must not change without approval from every affected owner:

| Boundary | Canonical artifact | Consumer |
| --- | --- | --- |
| On-chain functions and events | `packages/contracts/contracts/interfaces` and generated ABI | SDK, web, indexer |
| Chain addresses and supported networks | `packages/protocol-sdk/src/addresses.ts` and `chains.ts` | web, indexer |
| Transaction lifecycle and errors | `packages/protocol-sdk/src/integration.ts` | web hooks and components |
| Web-to-service payloads | typed clients in `apps/web/lib` and service schemas | web and services |
| Indexed asset records | ordered migrations in `services/event-indexer/migrations` | indexer and gallery API |
| Runtime configuration | workspace `.env.example` files | deployment and local development |
| Identity and recovery behavior | `docs/TRUST_AND_IDENTITY.md` | web and authentication backend |

The operation lifecycle is:

```text
idle -> preparing -> awaiting_wallet -> submitted -> confirming -> indexing -> completed
                                                                       \-> failed
```

Components consume stable operation state and error codes. They must not interpret raw provider
errors or call contract ABIs directly. New protocol actions follow this path:

```text
contract/API schema -> protocol SDK type -> focused web adapter hook -> reusable state -> UI
```

## Compatibility rules

- Additive optional fields are allowed when older consumers remain valid.
- Removing or renaming a field, event, function, state, or error code is breaking.
- Database migrations are append-only after they have been shared or deployed.
- Contract addresses are network-specific configuration, never UI constants.
- Human-facing UI may simplify Web3 terminology but must preserve the underlying consent, fee,
  ownership, and transaction meaning.
- Wallet identity and passwordless account recovery remain separate security boundaries.
- Sensitive values and clean creator assets must never cross a browser-public environment boundary.

## Frontend design ownership

The frontend owner has authority to explore and improve layout, visual hierarchy, typography,
spacing, responsive behavior, accessibility, interaction feedback, component composition, and
micro-interactions. This ownership includes modifying an existing design when doing so produces a
clearer Trovaya experience; visual references are inputs for judgment, not templates that must be
reproduced.

Design work remains governed by the following authority order:

```text
MASTER_SPEC.md and PRD.md -> DESIGN.md -> this integration contract -> visual references
```

A reference application, including `web3-investment-platform`, is non-canonical and must not become
a runtime dependency or a second application root. Patterns such as an application shell, cards,
navigation rhythm, and responsive composition may be adapted inside `apps/web`. Its product domain,
hardcoded data, package configuration, lockfile, trading language, and speculative interactions must
not be copied into Trovaya.

Frontend design changes do not require joint approval when they preserve product behavior and stable
boundaries. Joint approval is required when a design change alters consent, ownership, licensing,
payment, authentication, verification, security meaning, or the order and outcome of a core product
journey. Visual status labels such as "verified," "secure," "live," or "protected" must be backed by
a real typed state or be explicitly marked as a demo.

## Change protocol

For a shared-interface change, the pull request author must:

1. describe the reason, affected consumers, security impact, and rollback path;
2. update canonical artifacts and generated consumers together;
3. provide a compatibility or migration plan;
4. add producer/consumer or integration-boundary tests; and
5. obtain explicit approval from all affected owners.

Emergency security fixes may conceal exploit details until remediation, but they still require the
repository owner and relevant technical owner. The contract and migration notes must be completed
before the fix is considered closed.

## Decision record

Material decisions should be recorded in the pull-request description. If a decision changes the
long-term boundary, update this document or add a focused architecture decision record under this
directory. Ordinary UI styling and private implementation refactors do not require joint approval
when stable boundaries and behavior remain unchanged.
