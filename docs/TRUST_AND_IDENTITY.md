# Trust, Identity, and Account Extension

## Status and scope

This document defines the official trust and account expansion for the existing
Trovaya MVP. It does **not** replace the consent-first IP protection flow
defined by `MASTER_SPEC.md` and `PRD.md` or become the product's dominant value.

The current product core remains:

1. protect a public image through the poison engine;
2. encrypt and retain the clean source in a controlled vault;
3. register consent and licensing metadata on-chain; and
4. purchase a license and unlock authorized access.

Identity, profile, KYC, account recovery, and community features extend that
flow with clearer trust signals. Fractional funding and investment contracts
remain a separate research track and are not part of the current MVP.

## Identity model

Trovaya has two independent authentication rails:

- **Wallet authentication:** the user proves control of an address by signing
  a short-lived nonce (SIWE-compatible). Trovaya never receives a private key
  or seed phrase.
- **Email authentication:** a passwordless, one-time code creates or resumes an
  off-chain account session. This is the official email authentication method;
  Trovaya does not issue or store an account password. Use provider-neutral
  wording such as `email`; the account must not depend on Gmail specifically.

An off-chain account may link one or more wallets after each wallet signs a
fresh challenge. Linking an email never transfers ownership of a wallet or its
assets. Email recovery can restore only the Trovaya off-chain account and
profile; it cannot recover a wallet, replace its signer, or move its tokens.

The recovery action sends a new OTP and restores an off-chain session; it is
not a password-reset flow. Wallet onboarding must separately tell users to
store their recovery phrase offline and never share it with Trovaya.

## Trust passport

The profile exposes distinct, auditable trust signals rather than one opaque
score:

- email verified;
- wallet ownership verified;
- identity or MSME documents reviewed;
- creator provenance activity recorded on-chain; and
- community standing based on published moderation rules.

Each signal records its issuer, status, and expiry or revocation state. KYC
means that submitted identity evidence passed the stated review process; it is
not proof that every uploaded work is authentic, that a business is risk-free,
or that an investment will succeed. AI review remains non-advisory.

## Personal profile and privacy

Profile settings may include display name, avatar, biography, creator or MSME
category, locale, notification preferences, and linked wallets. Public profile
fields must be separated from private account and KYC fields.

Raw identity documents and personally identifiable information must never be
written to a public blockchain or public IPFS. Store them in access-controlled,
encrypted infrastructure with explicit retention and deletion policies. The
MVP mock-KYC preview retains the required `SAMPLE` watermark and must not imply
production-grade identity assurance.

## Production identity proof contract (not yet implemented)

The mock adapter may be replaced only after a named issuer and jurisdictional
owner approve this contract. A production claim exposes only the minimum signal:

| Field | Requirement |
| --- | --- |
| `issuer` | Stable provider identifier and public verification-key reference |
| `subject_commitment` | Provider-bound pseudonymous commitment; never plaintext identity data |
| `proof_type` / `proof_hash` | Named protocol/version and integrity hash; raw evidence stays with its custodian |
| `nullifier` | Issuer- and purpose-scoped replay prevention, unlinkable across unrelated products |
| `issued_at` / `expires_at` | Mandatory bounded validity window |
| `status` / `revoked_at` | Pending, verified, rejected, expired, or revoked, checked fresh at authorization |
| `assurance_level` | Explicit evidence and review class, not an opaque trust score |

Raw documents require a named controller/processor, encryption, access logging,
regional storage decision, purpose limitation, and approved deletion schedule.
The default target is deletion after the appeal window; longer legal retention
must name its basis and duration. Analytics, the indexer, contracts, public
profiles, and IPFS receive neither raw documents nor stable cross-service IDs.

Revocation must propagate within a documented maximum delay. Users need a reason
category, correction and appeal route, response deadline, and auditable outcome.
Provider timeout, invalid proof, stale issuer keys, status outage, and ambiguous
results fail closed as `unverified`; prior success cannot outlive its expiry.

Before implementation, record a data-protection review, threat model, issuer SLA,
key-rotation/compromise procedure, unlinkability and retention tests, revocation
drill, and appeal owner. Until then, runtime responses remain
`identity_mode: mock` and `verification_status: not_verified`.

## OTP and session controls

An implementation of email OTP must provide:

- short expiry, single use, and cryptographically random codes;
- hashed OTP storage, attempt limits, resend cooldowns, and rate limits per
  account, address, and device risk signal;
- generic responses that do not reveal whether an email is registered;
- secure, rotating sessions with revocation and recent-authentication checks
  before linking or unlinking a wallet; and
- an audit trail for login, recovery, KYC status, and wallet-link changes.

When Supabase Auth is the configured provider, Supabase owns OTP generation,
hashing, delivery, attempt controls, and session rotation. Trovaya must not create
a second OTP table or store raw OTP values. Provider settings must enforce the
requirements above, and application logs must never include OTPs, access tokens,
refresh tokens, magic links, or complete email addresses.

## Canonical account data model and RLS

Supabase `auth.users` is the account identity authority. The indexer's existing
`public.users` table is only a normalized on-chain wallet directory and must not
store email identity, OTP state, or Supabase session identifiers.

The account foundation is defined by
`supabase/migrations/202608230001_account_foundation.sql`:

| Relation | Purpose | Client access |
| --- | --- | --- |
| `auth.users` | Provider-owned email identity and session subject | Supabase Auth API only |
| `account_profiles` | Private locale and notification preferences | Owner read/update through RLS |
| `creator_profiles` | Explicit public creator fields | Public read only when `is_public`; owner update |
| `linked_wallets` | Verified account-to-wallet relationship | Owner read; server-only writes after signature verification |
| `wallet_link_challenges` | Hashed, expiring, single-use linking nonce | No PostgREST client access |
| `account_audit_events` | Append-only security events | No PostgREST client access |

RLS is necessary but not sufficient. Column grants restrict writable fields;
server endpoints must enforce recent authentication, verify the signed challenge,
consume it atomically, normalize the EVM address to lowercase, and append a
sanitized audit event. Service-role access must never be used as a generic client
fallback.

The browser auth client uses `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY`. The service-role key remains server-only. Email
OTP login does not require or justify exposing it.

The Next.js runtime uses `@supabase/ssr` cookie storage and a root `proxy.ts` to
refresh claims. Server authorization must use validated claims or a fresh user
lookup, never an unverified session payload. Numeric email login calls
`signInWithOtp` followed by `verifyOtp` with type `email`; the provider template
must include `{{ .Token }}`.

## Community scope

The forum can connect discussions to public profiles and creator assets, but
must not expose private KYC data. Before launch it requires reporting,
moderation roles, appeal and takedown paths, spam controls, and rules for how
community activity affects visible trust signals.

## Delivery order

1. Preserve and harden the existing IP protection and licensing MVP.
2. Add account/profile primitives and wallet-signature linking.
3. Add passwordless email OTP and session recovery with the controls above.
4. Add mock KYC status and separated trust badges.
5. Add the moderated community forum.
6. Evaluate fractional funding independently for custody, securities,
   consumer-protection, and jurisdictional requirements before implementation.
   If approved, its asset-holding contract is named `TrovayaFundingPool`; the
   name `TrovayaVault` remains reserved for protected IP access.
