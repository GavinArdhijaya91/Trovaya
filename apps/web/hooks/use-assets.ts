"use client";

import { useQuery } from "@tanstack/react-query";

export interface IndexedAsset { id: string; token_id: string; creator_wallet: string; public_poisoned_cid: string | null; allow_ai_training: boolean; }

export function useAssets() {
  return useQuery({ queryKey: ["assets"], queryFn: async (): Promise<IndexedAsset[]> => {
    const response = await fetch("/api/assets");
    if (!response.ok) throw new Error("Data karya belum dapat dimuat.");
    return ((await response.json()) as { assets: IndexedAsset[] }).assets;
  }, staleTime: 10_000 });
}
