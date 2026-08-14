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

## OTP and session controls

An implementation of email OTP must provide:

- short expiry, single use, and cryptographically random codes;
- hashed OTP storage, attempt limits, resend cooldowns, and rate limits per
  account, address, and device risk signal;
- generic responses that do not reveal whether an email is registered;
- secure, rotating sessions with revocation and recent-authentication checks
  before linking or unlinking a wallet; and
- an audit trail for login, recovery, KYC status, and wallet-link changes.

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
