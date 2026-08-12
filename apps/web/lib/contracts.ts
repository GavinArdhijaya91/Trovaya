import type { Address } from "viem";

export interface ClientContractAddresses { ipNFT: Address; vault: Address; }

export function getClientContractAddresses(): ClientContractAddresses | null {
  const ipNFT = process.env.NEXT_PUBLIC_TROVAYA_IP_NFT_ADDRESS;
  const vault = process.env.NEXT_PUBLIC_TROVAYA_VAULT_ADDRESS;
  if (!ipNFT?.startsWith("0x") || !vault?.startsWith("0x")) return null;
  return { ipNFT: ipNFT as Address, vault: vault as Address };
}
