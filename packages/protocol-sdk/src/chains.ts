export const trovayaChains = {
  bscTestnet: { id: 97, name: "BSC Testnet", nativeCurrency: "BNB" },
  baseSepolia: { id: 84_532, name: "Base Sepolia", nativeCurrency: "ETH" },
  arbitrumSepolia: { id: 421_614, name: "Arbitrum Sepolia", nativeCurrency: "ETH" },
} as const;

export type TrovayaChainId = (typeof trovayaChains)[keyof typeof trovayaChains]["id"];

export function nativeCurrencyFor(chainId: number): "BNB" | "ETH" {
  return chainId === trovayaChains.bscTestnet.id ? "BNB" : "ETH";
}
