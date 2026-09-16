"use client";

import { useQuery } from "@tanstack/react-query";
import { useGasPrice, usePublicClient } from "wagmi";
import { trovayaIPNFTAbi } from "@trovaya/protocol-sdk";
import { getClientContractAddresses } from "@/lib/contracts";

export interface PurchaseQuote {
  chainFeeWei: string | null;
  indexedFeeWei: string | null;
  matches: boolean | null;
  gasEstimate: string | null;
  gasCostWei: string | null;
  totalMaxWei: string | null;
  isLoading: boolean;
  error: string | null;
}

interface ChainMetadata {
  commercialLicenseFee: bigint;
}

/**
 * Quote end-to-end selaras kontrak: fee dibaca langsung dari
 * `getIPMetadata` on-chain (bukan hardcode / indexer saja), gas
 * diestimasi via `estimateContractGas` + gasPrice live.
 * Dipakai UI agar angka sebelum klik == angka di popup wallet (UAT).
 */
export function usePurchaseQuote(
  tokenId: string | undefined,
  indexedFeeWei: string | undefined,
  buyer: `0x${string}` | undefined,
  termsHash: `0x${string}` | undefined,
  termsVersion: number | undefined,
): PurchaseQuote {
  const publicClient = usePublicClient();
  const { data: gasPrice } = useGasPrice();
  const ipNFT = getClientContractAddresses()?.ipNFT;
  const gasPriceLabel = gasPrice?.toString();

  const metaQuery = useQuery({
    queryKey: ["purchase-quote-meta", ipNFT, tokenId],
    enabled: Boolean(publicClient && ipNFT && tokenId),
    staleTime: 10_000,
    retry: 1,
    queryFn: async (): Promise<string> => {
      const metadata = (await publicClient!.readContract({
        address: ipNFT!,
        abi: trovayaIPNFTAbi,
        functionName: "getIPMetadata",
        args: [BigInt(tokenId!)],
      })) as unknown as ChainMetadata;
      return metadata.commercialLicenseFee.toString();
    },
  });

  const chainFeeWei = metaQuery.data ?? null;
  const matches =
    chainFeeWei == null || indexedFeeWei == null
      ? null
      : BigInt(chainFeeWei) === BigInt(indexedFeeWei);

  const gasQuery = useQuery({
    queryKey: [
      "purchase-quote-gas",
      ipNFT,
      tokenId,
      buyer,
      termsHash,
      termsVersion,
      gasPriceLabel,
      chainFeeWei,
    ],
    enabled: Boolean(
      publicClient && ipNFT && tokenId && buyer && termsHash != null && termsVersion != null && gasPrice != null && chainFeeWei != null,
    ),
    staleTime: 10_000,
    retry: 1,
    queryFn: async (): Promise<string> => {
      const gas = await publicClient!.estimateContractGas({
        address: ipNFT!,
        abi: trovayaIPNFTAbi,
        functionName: "purchaseCommercialLicense",
        args: [BigInt(tokenId!), termsHash!, termsVersion!],
        account: buyer!,
        value: BigInt(chainFeeWei!),
      });
      // Buffer 20% agar angka "batas atas" di UI >= popup wallet.
      return ((gas * 120n) / 100n).toString();
    },
  });

  const gasEstimate = gasQuery.data ?? null;
  const gasCostWei = gasEstimate != null && gasPrice != null ? (BigInt(gasEstimate) * gasPrice).toString() : null;
  const totalMaxWei =
    chainFeeWei != null && gasCostWei != null ? (BigInt(chainFeeWei) + BigInt(gasCostWei)).toString() : null;

  return {
    chainFeeWei,
    indexedFeeWei: indexedFeeWei ?? null,
    matches,
    gasEstimate,
    gasCostWei,
    totalMaxWei,
    isLoading: metaQuery.isLoading || gasQuery.isLoading,
    error: metaQuery.isError ? "Harga on-chain belum dapat dibaca. Cek koneksi jaringan." : null,
  };
}
