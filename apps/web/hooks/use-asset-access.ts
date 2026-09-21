"use client";

import { useCallback } from "react";
import { trovayaIPNFTAbi, trovayaVaultAbi } from "@trovaya/protocol-sdk";
import { useAccount, useReadContract } from "wagmi";
import { getClientContractAddresses } from "@/lib/contracts";

function parseTokenId(tokenId: string | undefined): bigint | undefined {
  return tokenId && /^\d+$/.test(tokenId) ? BigInt(tokenId) : undefined;
}

/**
 * Reads vault entitlement directly from the chain for one asset and one wallet.
 *
 * Session state is only an accelerator: a wallet that paid for a license must
 * still be recognised after a reload, on another tab, or on another device.
 * Chain reads are the source of truth, and a failed read must never be treated
 * as "no access" by the caller.
 */
export function useAssetAccess(tokenId: string | undefined) {
  const account = useAccount();
  const addresses = getClientContractAddresses();
  const token = parseTokenId(tokenId);
  const buyer = account.address;
  const enabled = Boolean(addresses && token !== undefined && buyer);
  const args = enabled && token !== undefined && buyer ? ([token, buyer] as const) : undefined;

  const license = useReadContract({
    address: addresses?.ipNFT,
    abi: trovayaIPNFTAbi,
    functionName: "hasCommercialLicense",
    args,
    query: { enabled, staleTime: 5_000 },
  });

  const vaultAccess = useReadContract({
    address: addresses?.vault,
    abi: trovayaVaultAbi,
    functionName: "hasVaultAccess",
    args,
    query: { enabled, staleTime: 5_000 },
  });

  const licenseRefetch = license.refetch;
  const vaultRefetch = vaultAccess.refetch;
  const refetch = useCallback(async () => {
    await Promise.all([licenseRefetch(), vaultRefetch()]);
  }, [licenseRefetch, vaultRefetch]);

  return {
    chainLicense: license.data,
    chainVaultAccess: vaultAccess.data,
    refetch,
  };
}
