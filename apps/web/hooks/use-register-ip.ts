"use client";

import { trovayaIPNFTAbi } from "@trovaya/protocol-sdk";
import { parseEther } from "viem";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { getClientContractAddresses } from "@/lib/contracts";

export interface RegistrationInput {
  tokenUri: string; allowAITraining: boolean; licenseFee: string;
  publicPoisonedCid: string; encryptedVaultCid: string; royaltyBps: number;
}

export function useRegisterIP() {
  const account = useAccount();
  const writer = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: writer.data });
  const addresses = getClientContractAddresses();
  async function register(input: RegistrationInput) {
    if (!addresses || !account.address) throw new Error("Hubungkan akun dan konfigurasi alamat protokol.");
    return writer.writeContractAsync({
      address: addresses.ipNFT, abi: trovayaIPNFTAbi, functionName: "mintIPFor",
      args: [account.address, input.tokenUri, input.allowAITraining, parseEther(input.licenseFee), input.publicPoisonedCid, input.encryptedVaultCid, BigInt(input.royaltyBps)],
    });
  }
  return { register, hash: writer.data, isPending: writer.isPending || receipt.isLoading, isConfirmed: receipt.isSuccess, error: writer.error };
}
