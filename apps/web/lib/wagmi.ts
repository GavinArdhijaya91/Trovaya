import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { createConfig, http } from "wagmi";
import { bscTestnet, polygonAmoy } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { isValidWalletConnectProjectId } from "@/lib/walletconnect-config";

const chains = [bscTestnet, polygonAmoy] as const;
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const validProjectId = isValidWalletConnectProjectId(projectId) ? projectId : undefined;

export const walletConnectEnabled = Boolean(validProjectId);

export const wagmiConfig = validProjectId
  ? getDefaultConfig({
      appName: "Trovaya",
      projectId: validProjectId,
      chains,
      ssr: true,
    })
  : createConfig({
      chains,
      connectors: [injected()],
      transports: {
        [bscTestnet.id]: http(),
        [polygonAmoy.id]: http(),
      },
      ssr: true,
    });
