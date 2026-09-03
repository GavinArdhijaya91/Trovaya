"use client";

import { useQuery } from "@tanstack/react-query";
import { createPublicClient, http, parseAbiItem } from "viem";
import { bscTestnet } from "viem/chains";
import type { PublicAsset } from "@/lib/public-assets";
import { getClientContractAddresses } from "@/lib/contracts";
import { trovayaIPNFTAbi } from "@trovaya/protocol-sdk";

export type IndexedAsset = PublicAsset;

const mintEvent = parseAbiItem("event IPMinted(uint256 indexed tokenId,address indexed creator,bool allowAITraining)");

// Fallback langsung ke chain jika API/indexer lag — workspace tetap guna tiap action
async function fetchOnChainFallback(): Promise<IndexedAsset[]> {
  const addresses = getClientContractAddresses();
  if (!addresses) return [];
  const rpcUrl = process.env.NEXT_PUBLIC_BSC_RPC_URL ?? "https://data-seed-prebsc-1-s1.bnbchain.org:8545";
  const client = createPublicClient({ chain: bscTestnet, transport: http(rpcUrl) });
  // Ambil tip dulu biar range kecil dan tidak kena limit exceeded data-seed
  const latest = await client.getBlockNumber();
  const fromBlock = latest > 5000n ? latest - 5000n : 0n;
  let logs;
  try {
    logs = await client.getLogs({ address: addresses.ipNFT, event: mintEvent, fromBlock, toBlock: "latest" });
  } catch {
    const smallFrom = latest > 1000n ? latest - 1000n : 0n;
    logs = await client.getLogs({ address: addresses.ipNFT, event: mintEvent, fromBlock: smallFrom, toBlock: "latest" });
  }
  const assets: IndexedAsset[] = [];
  for (const log of logs.slice(-20).reverse()) {
    try {
      const tokenId = log.args.tokenId!.toString();
      const [meta, uri] = await Promise.all([
        client.readContract({ address: addresses.ipNFT, abi: trovayaIPNFTAbi, functionName: "getIPMetadata", args: [log.args.tokenId!] }),
        client.readContract({ address: addresses.ipNFT, abi: trovayaIPNFTAbi, functionName: "tokenURI", args: [log.args.tokenId!] }),
      ]);
      assets.push({
        id: `${97}:${tokenId}`,
        chain_id: 97,
        token_id: tokenId,
        creator_wallet: (log.args.creator as string).toLowerCase(),
        allow_ai_training: Boolean(log.args.allowAITraining),
        public_poisoned_cid: meta.publicPoisonedCid as string | null,
        commercial_license_fee_wei: (meta.commercialLicenseFee as bigint).toString(),
        token_uri: uri as string,
        license_terms_uri: meta.licenseTermsURI as string | null,
        license_terms_hash: meta.licenseTermsHash as string | null,
        license_terms_version: Number(meta.licenseTermsVersion),
        license_duration_seconds: (meta.licenseDurationSeconds as bigint).toString(),
        status: "MINTED",
        created_at: new Date().toISOString(),
      });
    } catch { /* skip log yang gagal dibaca */ }
  }
  return assets;
}

export function useAssets() {
  return useQuery({
    queryKey: ["assets"],
    queryFn: async (): Promise<IndexedAsset[]> => {
      try {
        const response = await fetch("/api/assets");
        if (response.ok) {
          const data = (await response.json()) as { assets: IndexedAsset[] };
          if (data.assets.length > 0) return data.assets;
        }
      } catch { /* fallback ke chain */ }
      return fetchOnChainFallback();
    },
    staleTime: 10_000,
    retry: 1,
  });
}
