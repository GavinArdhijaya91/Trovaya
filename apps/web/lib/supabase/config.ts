export interface PublicSupabaseConfig {
  url: string;
  key: string;
}

export function getPublicSupabaseConfig(): PublicSupabaseConfig | undefined {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key || !isHttpUrl(url)) return undefined;
  return { url, key };
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}
