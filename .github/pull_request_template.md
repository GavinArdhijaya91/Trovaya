## Summary

<!-- What changed, and why? -->

## Validation

- [ ] `pnpm lint`
- [ ] `pnpm test`
- [ ] `pnpm build`
- [ ] Relevant manual or end-to-end flow tested

## Integration contract

- [ ] This change does not alter a shared API, ABI, event, SDK type, operation state, environment
      variable, database schema, authentication flow, or security assumption.
- [ ] If it does, affected frontend/backend/contract owners approved the change.
- [ ] Canonical schema, generated types/ABI, documentation, and producer/consumer tests are updated.
- [ ] Breaking changes include a migration/compatibility plan and Conventional Commit breaking marker.

## Security and data

- [ ] No secrets, personal/KYC data, clean creator assets, or generated build files are committed.
- [ ] New configuration is documented in the appropriate `.env.example`.
- [ ] Consent, ownership, licensing, and payment behavior remains explicit to the user.

## Release note

<!-- Release Please generates CHANGELOG.md. Do not edit it manually for an ordinary PR. -->

