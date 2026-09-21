"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { deriveTransactionState, trovayaIPNFTAbi, trovayaVaultAbi } from "@trovaya/protocol-sdk";
import { useAccount, usePublicClient, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { getClientContractAddresses } from "@/lib/contracts";

/** Hides ABI calls and wallet lifecycle details from gallery components. */
export function useLicenseActions() {
  const purchase = useWriteContract();
  const purchaseReceipt = useWaitForTransactionReceipt({ hash: purchase.data });
  const unlock = useWriteContract();
  const unlockReceipt = useWaitForTransactionReceipt({ hash: unlock.data });
  const addresses = getClientContractAddresses();
  const queryClient = useQueryClient();
  const account = useAccount();
  const publicClient = usePublicClient();
  // Fase "indexing" untuk buyer: receipt sudah mined, tapi chain-read
  // (hasCommercialLicense / hasVaultAccess) belum memantulkan state baru.
  // Tanpa ini UI berbohong "Proses berhasil" padahal tombol unduh gagal.
  const [purchaseIndexing, setPurchaseIndexing] = useState(false);
  const [unlockIndexing, setUnlockIndexing] = useState(false);

  const purchaseState = deriveTransactionState({
    hash: purchase.data,
    isWalletPending: purchase.isPending,
    isConfirming: purchaseReceipt.isLoading,
    isSuccess: purchaseReceipt.isSuccess,
    isIndexing: purchaseIndexing,
    error: purchase.error ?? purchaseReceipt.error,
  });
  const unlockState = deriveTransactionState({
    hash: unlock.data,
    isWalletPending: unlock.isPending,
    isConfirming: unlockReceipt.isLoading,
    isSuccess: unlockReceipt.isSuccess,
    isIndexing: unlockIndexing,
    error: unlock.error ?? unlockReceipt.error,
  });

  const purchaseConfirmed = purchaseReceipt.isSuccess;
  const unlockConfirmed = unlockReceipt.isSuccess;
  // Lisensi dan otorisasi membuka akses; daftar aset hanya boleh dianggap segar
  // setelah rantai mengonfirmasi, bukan setelah tombol diklik.
  useEffect(() => {
    if (purchaseConfirmed || unlockConfirmed) {
      void queryClient.invalidateQueries({ queryKey: ["assets"] });
    }
  }, [purchaseConfirmed, unlockConfirmed, queryClient]);

  // Polling rantai berbatas: receipt mined belum berarti read-after-write
  // konsisten di RPC publik. Tunggu hasCommercialLicense/hasVaultAccess true
  // (maks ~10 dtk), lalu turunkan fase indexing -> completed.
  async function pollChainRead(probe: () => Promise<boolean>): Promise<boolean> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        if (await probe()) return true;
      } catch { /* RPC lag — coba lagi */ }
      await new Promise<void>((resolve) => setTimeout(resolve, 2000));
    }
    return false;
  }

  async function purchaseLicense(tokenId: string, feeWei: string, termsHash: `0x${string}`, termsVersion: number) {
    if (!addresses) throw new Error("Alamat protokol belum dikonfigurasi.");
    // Jangan set gas manual: biarkan viem/wallet mengestimasi aktual (~60-90k).
    // Gas statis 500_000n sebelumnya membuat popup wallet menampilkan max fee
    // (gasLimit x gasPrice) yang jauh lebih besar dari biaya sebenarnya.
    const buyer = account.address;
    // RACE FIX: indexing dinyalakan SEBELUM write agar tidak ada jendela di mana
    // receipt sudah success tapi flag belum true (= UI sempat bohong "completed").
    // deriveTransactionState memprioritaskan isIndexing > isSuccess, jadi aman.
    const shouldPoll = Boolean(publicClient && buyer);
    if (shouldPoll) setPurchaseIndexing(true);
    try {
      const hash = await purchase.writeContractAsync({
        address: addresses.ipNFT,
        abi: trovayaIPNFTAbi,
        functionName: "purchaseCommercialLicense",
        args: [BigInt(tokenId), termsHash, termsVersion],
        value: BigInt(feeWei),
      });
      // Fase indexing berakhir saat chain-read true (maks ~10 dtk).
      // Timeout = tetap completed (dana sudah on-chain), tapi akses di-refetch.
      if (publicClient && buyer) {
        try {
          await publicClient.waitForTransactionReceipt({ hash });
          await pollChainRead(() => publicClient.readContract({
            address: addresses.ipNFT, abi: trovayaIPNFTAbi,
            functionName: "hasCommercialLicense", args: [BigInt(tokenId), buyer],
          }) as Promise<boolean>);
        } finally {
          setPurchaseIndexing(false);
          await queryClient.invalidateQueries({ queryKey: ["assets"] });
        }
      }
      return hash;
    } catch (caught) {
      // User reject / gagal kirim: jangan macet di fase indexing.
      if (shouldPoll) setPurchaseIndexing(false);
      throw caught;
    }
  }

  async function authorizeOriginal(tokenId: string) {
    if (!addresses) throw new Error("Alamat protokol belum dikonfigurasi.");
    // Sama: estimasi otomatis agar tidak kena cap 16_777_216 BSC.
    const caller = account.address;
    const shouldPoll = Boolean(publicClient && caller);
    if (shouldPoll) setUnlockIndexing(true);
    try {
      const hash = await unlock.writeContractAsync({
        address: addresses.vault,
        abi: trovayaVaultAbi,
        functionName: "unlockWithLicense",
        args: [BigInt(tokenId)],
      });
      if (publicClient && caller) {
        try {
          await publicClient.waitForTransactionReceipt({ hash });
          await pollChainRead(() => publicClient.readContract({
            address: addresses.vault, abi: trovayaVaultAbi,
            functionName: "hasVaultAccess", args: [BigInt(tokenId), caller],
          }) as Promise<boolean>);
        } finally {
          setUnlockIndexing(false);
          await queryClient.invalidateQueries({ queryKey: ["assets"] });
        }
      }
      return hash;
    } catch (caught) {
      if (shouldPoll) setUnlockIndexing(false);
      throw caught;
    }
  }

  return { isConfigured: Boolean(addresses), purchaseLicense, authorizeOriginal, purchaseState, unlockState };
}
