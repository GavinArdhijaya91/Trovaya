"use client";

import { useQuery } from "@tanstack/react-query";
import type { PublicAsset } from "@/lib/public-assets";

export type IndexedAsset = PublicAsset;

export function useAssets() {
  return useQuery({ queryKey: ["assets"], queryFn: async (): Promise<IndexedAsset[]> => {
    const response = await fetch("/api/assets");
    if (!response.ok) throw new Error("Data karya belum dapat dimuat.");
    return ((await response.json()) as { assets: IndexedAsset[] }).assets;
  }, staleTime: 10_000 });
}
