/**
 * Resolves vault entitlement for one wallet and one asset.
 *
 * The blockchain is the source of truth for ownership and vault access. A
 * confirmed wallet session is only an accelerator: it must never be the sole
 * reason the UI believes a buyer holds a license, and losing it (page reload,
 * new browser, new device) must never hide access the chain already granted.
 *
 * Union semantics are intentional. `true` from any source means "do not ask the
 * user to buy again"; a `false` or failed chain read never revokes access that
 * the current session already proved.
 */
export interface EntitlementSignals {
  sessionLicenseConfirmed: boolean;
  sessionUnlockConfirmed: boolean;
  chainLicense: boolean | undefined;
  chainVaultAccess: boolean | undefined;
}

export interface Entitlement {
  /** Wallet holds a commercial license (on-chain or confirmed in this session). */
  licensed: boolean;
  /** Wallet holds an active vault grant for this asset. */
  authorized: boolean;
  /** True only when the license read straight from the chain succeeded. */
  chainVerified: boolean;
}

export function resolveEntitlement(signals: EntitlementSignals): Entitlement {
  return {
    licensed: signals.chainLicense === true || signals.sessionLicenseConfirmed,
    authorized: signals.chainVaultAccess === true || signals.sessionUnlockConfirmed,
    chainVerified: signals.chainLicense === true,
  };
}
