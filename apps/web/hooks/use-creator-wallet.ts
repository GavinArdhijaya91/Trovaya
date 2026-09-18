"use client";

import { useAccount, useBalance } from "wagmi";

export function useCreatorWallet() {
  const account = useAccount();
  const balance = useBalance({ address: account.address });
  return {
    address: account.address,
    isConnected: account.isConnected,
    networkId: account.chainId,
    availableFunds: balance.data?.formatted,
    fundsSymbol: balance.data?.symbol,
  };
}

