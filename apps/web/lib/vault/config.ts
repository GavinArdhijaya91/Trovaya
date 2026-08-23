import "server-only";

export interface VaultServerConfig {
  supabaseUrl: string;
  serviceRoleKey: string;
  rpcUrl: string;
  chainId: number;
  ipNFTAddress: `0x${string}`;
  vaultAddress: `0x${string}`;
  masterKey: Buffer;
}

export function getVaultServerConfig(): VaultServerConfig | null {
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID);
  const ipNFTAddress = process.env.NEXT_PUBLIC_TROVAYA_IP_NFT_ADDRESS;
  const vaultAddress = process.env.NEXT_PUBLIC_TROVAYA_VAULT_ADDRESS;
  const masterKey = Buffer.from(process.env.VAULT_MASTER_KEY ?? "", "base64");
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY
      || !process.env.VAULT_RPC_URL || !Number.isSafeInteger(chainId) || chainId <= 0
      || !/^0x[0-9a-fA-F]{40}$/.test(ipNFTAddress ?? "")
      || !/^0x[0-9a-fA-F]{40}$/.test(vaultAddress ?? "") || masterKey.length !== 32) return null;
  return {
    supabaseUrl: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    rpcUrl: process.env.VAULT_RPC_URL,
    chainId,
    ipNFTAddress: ipNFTAddress as `0x${string}`,
    vaultAddress: vaultAddress as `0x${string}`,
    masterKey,
  };
}
