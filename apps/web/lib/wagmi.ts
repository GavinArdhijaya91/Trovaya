import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { createConfig, http } from "wagmi";
import { bscTestnet, polygonAmoy } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { isValidWalletConnectProjectId } from "@/lib/walletconnect-config";

const chains = [bscTestnet, polygonAmoy] as const;
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const validProjectId = isValidWalletConnectProjectId(projectId) ? projectId : undefined;
const bscTestnetRpcUrl = process.env.NEXT_PUBLIC_BSC_RPC_URL ?? "https://data-seed-prebsc-2-s1.bnbchain.org:8545";

export const walletConnectEnabled = Boolean(validProjectId);

export const wagmiConfig = validProjectId
  ? getDefaultConfig({
      appName: "Trovaya",
      projectId: validProjectId,
      chains,
      transports: {
        [bscTestnet.id]: http(bscTestnetRpcUrl),
        [polygonAmoy.id]: http(),
      },
      ssr: true,
    })
  : createConfig({
      chains,
      connectors: [injected()],
      transports: {
        [bscTestnet.id]: http(bscTestnetRpcUrl),
        [polygonAmoy.id]: http(),
      },
      ssr: true,
    });
