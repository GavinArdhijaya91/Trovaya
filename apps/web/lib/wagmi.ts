import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { bscTestnet, polygonAmoy } from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "Trovaya",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "development-project-id",
  chains: [bscTestnet, polygonAmoy],
  ssr: true,
});
