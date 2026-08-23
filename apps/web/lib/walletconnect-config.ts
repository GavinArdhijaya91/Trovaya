const WALLETCONNECT_PROJECT_ID_PATTERN = /^[0-9a-f]{32}$/i;

export function isValidWalletConnectProjectId(value: string | undefined): value is string {
  return Boolean(value && WALLETCONNECT_PROJECT_ID_PATTERN.test(value.trim()));
}
