import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { createConfig, fallback, http } from "wagmi";
import { bscTestnet, polygonAmoy } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { isValidWalletConnectProjectId } from "@/lib/walletconnect-config";

// Override rpcUrls bawaan bscTestnet (data-seed) yang sering 429 —
// ini yang dipakai wallet saat addChain/switchChain, jadi harus reliable
const reliableBscRpcs = [
  "https://bsc-testnet.bnbchain.org",
  "https://bsc-testnet-dataseed.bnbchain.org",
  "https://bnb-testnet.api.onfinality.io/public",
] as const;
const customBscTestnet = {
  ...bscTestnet,
  rpcUrls: {
    ...bscTestnet.rpcUrls,
    default: { http: [...reliableBscRpcs] as readonly [string, ...string[]] },
    public: { http: [...reliableBscRpcs] as readonly [string, ...string[]] },
  },
} as unknown as typeof bscTestnet;

const chains = [customBscTestnet, polygonAmoy] as const;
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const validProjectId = isValidWalletConnectProjectId(projectId) ? projectId : undefined;
// data-seed-prebsc-* & publicnode sering 429 (Requested resource not available) — pakai fallback
// Uji 2026-09: paling stabil bsc-testnet.bnbchain.org + bsc-testnet-dataseed + onfinality
const bscRpcUrls = [
  process.env.NEXT_PUBLIC_BSC_RPC_URL,
  "https://bsc-testnet.bnbchain.org",
  "https://bsc-testnet-dataseed.bnbchain.org",
  "https://bnb-testnet.api.onfinality.io/public",
  "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
  "https://data-seed-prebsc-2-s1.bnbchain.org:8545",
].filter((u): u is string => Boolean(u));
// deduplicate agar env yang sama dengan hardcode tidak dobel
const uniqueBscRpcUrls = [...new Set(bscRpcUrls)];
// retryCount 0 di level http — biar fallback langsung pindah RPC berikutnya tanpa retry 3x di endpoint yang sama
const bscTransports = uniqueBscRpcUrls.map((url) => http(url, { timeout: 8_000 }));

export const walletConnectEnabled = Boolean(validProjectId);

const bscFallback = bscTransports.length > 1 ? fallback(bscTransports, { rank: false }) : bscTransports[0]!;

export const wagmiConfig = validProjectId
  ? getDefaultConfig({
      appName: "Trovaya",
      projectId: validProjectId,
      chains,
      transports: {
        [customBscTestnet.id]: bscFallback,
        [polygonAmoy.id]: http(undefined, { retryCount: 3, retryDelay: 500 }),
      },
      ssr: true,
    })
  : createConfig({
      chains,
      connectors: [injected()],
      transports: {
        [customBscTestnet.id]: bscFallback,
        [polygonAmoy.id]: http(undefined, { retryCount: 3, retryDelay: 500 }),
      },
      ssr: true,
    });
