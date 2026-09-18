"use client";

import { useEffect } from "react";
import { deriveTransactionState, trovayaIPNFTAbi } from "@trovaya/protocol-sdk";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { getClientContractAddresses } from "@/lib/contracts";

export function useLicenseProceeds() {
  const account = useAccount();
  const addresses = getClientContractAddresses();
  const balance = useReadContract({
    address: addresses?.ipNFT,
    abi: trovayaIPNFTAbi,
    functionName: "pendingWithdrawals",
    args: account.address ? [account.address] : undefined,
    query: { enabled: Boolean(addresses && account.address) },
  });


  const writer = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: writer.data });
  const refetchBalance = balance.refetch;
  const state = deriveTransactionState({
    hash: writer.data,
    isWalletPending: writer.isPending,
    isConfirming: receipt.isLoading,
    isSuccess: receipt.isSuccess,
    error: writer.error ?? receipt.error,
  });

  useEffect(() => {
    if (receipt.isSuccess) void refetchBalance();
  }, [receipt.isSuccess, refetchBalance]);

  async function withdraw() {
    if (!addresses || !account.address) throw new Error("Hubungkan wallet creator dan konfigurasi protokol.");
    return writer.writeContractAsync({
      address: addresses.ipNFT,
      abi: trovayaIPNFTAbi,
      functionName: "withdrawProceeds",
      args: [account.address],
    });
  }

  return {
    amount: typeof balance.data === "bigint" ? balance.data : 0n,
    isLoading: balance.isLoading,
    isConfigured: Boolean(addresses),
    withdraw,
    state,
  };
}

