"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "@/lib/supabase/config";

let browserClient: SupabaseClient | undefined;

export function getBrowserSupabaseClient(): SupabaseClient | undefined {
  const config = getPublicSupabaseConfig();
  if (!config) return undefined;
  browserClient ??= createBrowserClient(config.url, config.key);
  return browserClient;
}
