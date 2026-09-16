"use client";

import { deriveTransactionState, trovayaIPNFTAbi, trovayaVaultAbi } from "@trovaya/protocol-sdk";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { getClientContractAddresses } from "@/lib/contracts";

/** Hides ABI calls and wallet lifecycle details from gallery components. */
export function useLicenseActions() {
  const purchase = useWriteContract();
  const purchaseReceipt = useWaitForTransactionReceipt({ hash: purchase.data });
  const unlock = useWriteContract();
  const unlockReceipt = useWaitForTransactionReceipt({ hash: unlock.data });
  const addresses = getClientContractAddresses();

  const purchaseState = deriveTransactionState({
    hash: purchase.data,
    isWalletPending: purchase.isPending,
    isConfirming: purchaseReceipt.isLoading,
    isSuccess: purchaseReceipt.isSuccess,
    error: purchase.error ?? purchaseReceipt.error,
  });
  const unlockState = deriveTransactionState({
    hash: unlock.data,
    isWalletPending: unlock.isPending,
    isConfirming: unlockReceipt.isLoading,
    isSuccess: unlockReceipt.isSuccess,
    error: unlock.error ?? unlockReceipt.error,
  });

  async function purchaseLicense(tokenId: string, feeWei: string, termsHash: `0x${string}`, termsVersion: number) {
    if (!addresses) throw new Error("Alamat protokol belum dikonfigurasi.");
    // Jangan set gas manual: biarkan viem/wallet mengestimasi aktual (~60-90k).
    // Gas statis 500_000n sebelumnya membuat popup wallet menampilkan max fee
    // (gasLimit x gasPrice) yang jauh lebih besar dari biaya sebenarnya.
    return purchase.writeContractAsync({
      address: addresses.ipNFT,
      abi: trovayaIPNFTAbi,
      functionName: "purchaseCommercialLicense",
      args: [BigInt(tokenId), termsHash, termsVersion],
      value: BigInt(feeWei),
    });
  }

  async function authorizeOriginal(tokenId: string) {
    if (!addresses) throw new Error("Alamat protokol belum dikonfigurasi.");
    // Sama: estimasi otomatis agar tidak kena cap 16_777_216 BSC.
    return unlock.writeContractAsync({
      address: addresses.vault,
      abi: trovayaVaultAbi,
      functionName: "unlockWithLicense",
      args: [BigInt(tokenId)],
    });
  }

  return { isConfigured: Boolean(addresses), purchaseLicense, authorizeOriginal, purchaseState, unlockState };
}
