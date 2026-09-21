"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { deriveTransactionState, trovayaIPNFTAbi } from "@trovaya/protocol-sdk";
import { parseEther, parseEventLogs } from "viem";
import { useAccount, usePublicClient, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { getClientContractAddresses } from "@/lib/contracts";
import { createIndexProbe, waitForIndexedToken } from "@/lib/index-wait";

export interface RegistrationInput {
  tokenUri: string; allowAITraining: boolean; licenseFee: string;
  publicPoisonedCid: string; encryptedVaultCid: string; royaltyBps: number;
  licenseTermsUri: string; licenseTermsHash: `0x${string}`; licenseTermsVersion: number;
  licenseDurationSeconds: number;
}

export function useRegisterIP() {
  const account = useAccount();
  const writer = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: writer.data });
  const addresses = getClientContractAddresses();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();
  // Fase "indexing": transaksi sudah final di rantai, tetapi record belum
  // terbaca dari layer index. Ini yang mencegah UI menyatakan selesai terlalu dini.
  const [isIndexing, setIsIndexing] = useState(false);
  const state = deriveTransactionState({
    hash: writer.data,
    isWalletPending: writer.isPending,
    isConfirming: receipt.isLoading,
    isSuccess: receipt.isSuccess,
    isIndexing,
    error: writer.error ?? receipt.error,
  });
  async function register(input: RegistrationInput) {
    if (!addresses || !account.address || !publicClient) throw new Error("Hubungkan akun dan konfigurasi alamat protokol.");
    const hash = await writer.writeContractAsync({
      address: addresses.ipNFT, abi: trovayaIPNFTAbi, functionName: "mintIP",
      args: [input.tokenUri, input.allowAITraining, parseEther(input.licenseFee), input.publicPoisonedCid, input.encryptedVaultCid, BigInt(input.royaltyBps), input.licenseTermsUri, input.licenseTermsHash, input.licenseTermsVersion, BigInt(input.licenseDurationSeconds)],
    });
    const mined = await publicClient.waitForTransactionReceipt({ hash });
    const [minted] = parseEventLogs({ abi: trovayaIPNFTAbi, logs: mined.logs, eventName: "IPMinted", strict: true });
    if (!minted) throw new Error("Transaksi berhasil tetapi event IPMinted tidak ditemukan.");
    const tokenId = minted.args.tokenId.toString();
    setIsIndexing(true);
    let indexed = false;
    try {
      indexed = await waitForIndexedToken({ tokenId, probe: createIndexProbe(tokenId) });
    } finally {
      setIsIndexing(false);
      await queryClient.invalidateQueries({ queryKey: ["assets"] });
    }
    return { hash, tokenId, indexed };
  }
  return {
    register,
    state,
    isPending: state.phase === "awaiting_wallet" || state.phase === "submitted" || state.phase === "confirming" || state.phase === "indexing",
    isIndexing: state.phase === "indexing",
    isConfirmed: state.phase === "completed",
  };
}
