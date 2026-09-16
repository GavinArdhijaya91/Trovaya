import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";

function restHeaders(key: string) {
  return { apikey: key, Authorization: `Bearer ${key}` };
}

/**
 * Grup patungan milik satu wallet (ketua maupun anggota).
 * Query: ?wallet=0x… — baca via ANON sesuai RLS read-only publik.
 */
export async function GET(request: NextRequest) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ detail: "Patungan belum dikonfigurasi." }, { status: 503 });

  const wallet = new URL(request.url).searchParams.get("wallet") ?? "";
  if (!isAddress(wallet)) return NextResponse.json({ detail: "Parameter wallet tidak valid." }, { status: 400 });
  const me = wallet.toLowerCase();

  const memberRes = await fetch(
    `${url}/rest/v1/co_purchase_members?member_wallet=eq.${me}&select=circle_id,share_wei,status`,
    { headers: restHeaders(key), cache: "no-store" },
  );
  if (!memberRes.ok) return NextResponse.json({ detail: "Grup saya belum dapat dimuat." }, { status: 502 });
  const memberships = (await memberRes.json()) as { circle_id: string; share_wei: string; status: string }[];
  if (memberships.length === 0) return NextResponse.json({ circles: [] });

  const ids = [...new Set(memberships.map((m) => m.circle_id))];
  const circleRes = await fetch(
    `${url}/rest/v1/co_purchase_circles?id=in.(${ids.join(",")})&select=id,chain_id,token_id,leader_wallet,target_fee_wei,max_members,status,onchain_tx_hash,created_at&order=created_at.desc`,
    { headers: restHeaders(key), cache: "no-store" },
  );
  if (!circleRes.ok) return NextResponse.json({ detail: "Grup saya belum dapat dimuat." }, { status: 502 });
  const circles = (await circleRes.json()) as Record<string, unknown>[];
  const shareByCircle = new Map(memberships.map((m) => [m.circle_id, m.share_wei]));
  return NextResponse.json({
    circles: circles.map((c) => ({ ...c, my_share_wei: shareByCircle.get(c["id"] as string) ?? null })),
  });
}
