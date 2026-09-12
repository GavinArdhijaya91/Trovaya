import { NextResponse } from "next/server";

export async function GET() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  const contractAddress = process.env.NEXT_PUBLIC_TROVAYA_IP_NFT_ADDRESS;
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID ?? "97";

  let indexer: Record<string, unknown> = { status: "unconfigured" };

  if (supabaseUrl && supabaseKey && contractAddress) {
    try {
      const query = new URLSearchParams({
        select: "last_block,last_block_hash,updated_at",
        chain_id: `eq.${chainId}`,
        contract_address: `ilike.${contractAddress}`,
        limit: "1",
      });
      const res = await fetch(`${supabaseUrl}/rest/v1/indexer_cursors?${query}`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        cache: "no-store",
      });
      if (res.ok) {
        const rows = await res.json() as Array<{ last_block: string; last_block_hash: string | null; updated_at: string }>;
        const cursor = rows[0];
        indexer = cursor
          ? { status: "live", lastIndexedBlock: cursor.last_block, lastBlockHash: cursor.last_block_hash, lastSyncAt: cursor.updated_at }
          : { status: "awaiting_first_sync" };
      } else {
        indexer = { status: "query_failed", httpStatus: res.status };
      }
    } catch {
      indexer = { status: "unreachable" };
    }
  }

  return NextResponse.json({
    status: "ok",
    service: "trovaya-web",
    chainId,
    contractAddress: contractAddress ?? null,
    indexer,
    timestamp: new Date().toISOString(),
  });
}

