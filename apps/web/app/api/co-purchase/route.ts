import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import {
  CO_PURCHASE_MAX,
  CO_PURCHASE_MIN,
  isTokenId,
  lockGroup,
} from "@/lib/co-purchase";

function restHeaders(key: string) {
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

function isTxHash(value: unknown): value is `0x${string}` {
  return typeof value === "string" && /^0x[0-9a-fA-F]{64}$/.test(value);
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  );
}

/** Daftar grup patungan untuk satu karya. Query: ?chain_id=97&token_id=1 */
export async function GET(request: NextRequest) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ detail: "Patungan belum dikonfigurasi." }, { status: 503 });

  const { searchParams } = new URL(request.url);
  const chainId = searchParams.get("chain_id");
  const tokenId = searchParams.get("token_id");
  if (!chainId || !isTokenId(tokenId)) {
    return NextResponse.json({ detail: "Parameter chain_id dan token_id tidak valid." }, { status: 400 });
  }

  const query = new URLSearchParams({
    select: "id,chain_id,token_id,leader_wallet,target_fee_wei,max_members,status,created_at",
    chain_id: `eq.${chainId}`,
    token_id: `eq.${tokenId}`,
    status: "eq.OPEN",
    order: "created_at.desc",
    limit: "20",
  });
  const res = await fetch(`${url}/rest/v1/co_purchase_circles?${query}`, {
    headers: restHeaders(key),
    cache: "no-store",
  });
  if (!res.ok) return NextResponse.json({ detail: "Grup patungan belum dapat dimuat." }, { status: 502 });
  return NextResponse.json({ circles: await res.json() });
}

interface CreateBody {
  chain_id?: unknown;
  token_id?: unknown;
  leader_wallet?: unknown;
  target_fee_wei?: unknown;
  max_members?: unknown;
  member_wallets?: unknown;
}

/** Buat grup patungan. Validasi 3-5 + checksum dikeraskan di server. */
export async function POST(request: NextRequest) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ detail: "Patungan belum dikonfigurasi." }, { status: 503 });

  const body = (await request.json().catch(() => null)) as CreateBody | null;
  const chainId = Number(body?.chain_id);
  const tokenId = body?.token_id;
  const leader = typeof body?.leader_wallet === "string" ? body.leader_wallet : "";
  const feeWei = typeof body?.target_fee_wei === "string" ? body.target_fee_wei : "";
  const maxMembers = Number(body?.max_members ?? 0);
  const extras = Array.isArray(body?.member_wallets) ? (body.member_wallets as unknown[]) : [];

  if (!Number.isInteger(chainId) || !isTokenId(tokenId) || !isAddress(leader)) {
    return NextResponse.json({ detail: "chain_id, token_id, leader_wallet tidak valid." }, { status: 400 });
  }
  let fee: bigint;
  try {
    fee = BigInt(feeWei);
  } catch {
    return NextResponse.json({ detail: "target_fee_wei tidak valid." }, { status: 400 });
  }
  if (fee <= 0n) return NextResponse.json({ detail: "Harga lisensi harus lebih dari 0." }, { status: 400 });
  if (!Number.isInteger(maxMembers) || maxMembers < CO_PURCHASE_MIN || maxMembers > CO_PURCHASE_MAX) {
    return NextResponse.json({ detail: `max_members harus ${CO_PURCHASE_MIN}-${CO_PURCHASE_MAX}.` }, { status: 400 });
  }
  const extraWallets = extras.filter((w): w is string => typeof w === "string" && isAddress(w));
  if (extraWallets.length !== extras.length) {
    return NextResponse.json({ detail: "Ada alamat anggota yang tidak valid." }, { status: 400 });
  }
  const wallets = [leader, ...extraWallets];
  let locked;
  try {
    locked = lockGroup(fee.toString(), maxMembers, wallets);
  } catch (caught) {
    return NextResponse.json({ detail: caught instanceof Error ? caught.message : "Grup tidak valid." }, { status: 400 });
  }
  const { size: finalSize, shares } = locked;
  const circleRes = await fetch(`${url}/rest/v1/co_purchase_circles`, {
    method: "POST",
    headers: { ...restHeaders(key), Prefer: "return=representation" },
    body: JSON.stringify({
      chain_id: chainId,
      token_id: tokenId,
      leader_wallet: leader.toLowerCase(),
      target_fee_wei: fee.toString(),
      max_members: finalSize,
      status: "OPEN",
    }),
  });
  if (!circleRes.ok) return NextResponse.json({ detail: "Grup belum dapat dibuat." }, { status: 500 });
  const [circle] = (await circleRes.json()) as { id: string }[];
  if (!circle) return NextResponse.json({ detail: "Grup belum dapat dibuat." }, { status: 500 });

  const rows = wallets.map((w, i) => ({
    circle_id: circle.id,
    member_wallet: w.toLowerCase(),
    share_wei: shares[i]!,
    status: "JOINED",
  }));
  const membersRes = await fetch(`${url}/rest/v1/co_purchase_members`, {
    method: "POST",
    headers: restHeaders(key),
    body: JSON.stringify(rows),
  });
  if (!membersRes.ok) {
    await fetch(`${url}/rest/v1/co_purchase_circles?id=eq.${circle.id}`, { method: "DELETE", headers: restHeaders(key) });
    return NextResponse.json({ detail: "Anggota grup belum dapat disimpan." }, { status: 500 });
  }
  return NextResponse.json({ circleId: circle.id, shareWei: shares }, { status: 201 });
}

interface RecordBody {
  circle_id?: unknown;
  leader_wallet?: unknown;
  onchain_tx_hash?: unknown;
}

/**
 * Ketua mencatat bukti bayar on-chain setelah 1x purchase berhasil.
 * Alur: purchaseCompleted (wagmi) -> PATCH ini -> status PURCHASED.
 * Hanya leader, hanya dari OPEN/LOCKED, tx hash 0x 64-hex.
 */
export async function PATCH(request: NextRequest) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ detail: "Patungan belum dikonfigurasi." }, { status: 503 });

  const body = (await request.json().catch(() => null)) as RecordBody | null;
  const leaderRaw = body?.leader_wallet;
  if (!isUuid(body?.circle_id) || typeof leaderRaw !== "string" || !isAddress(leaderRaw) || !isTxHash(body?.onchain_tx_hash)) {
    return NextResponse.json({ detail: "circle_id, leader_wallet, atau onchain_tx_hash tidak valid." }, { status: 400 });
  }
  const circleId = body.circle_id;
  const leader = (body.leader_wallet as string).toLowerCase();
  const txHash = body.onchain_tx_hash;

  const currentRes = await fetch(
    `${url}/rest/v1/co_purchase_circles?id=eq.${circleId}&select=id,leader_wallet,status,onchain_tx_hash`,
    { headers: restHeaders(key), cache: "no-store" },
  );
  if (!currentRes.ok) return NextResponse.json({ detail: "Grup belum dapat dibaca." }, { status: 502 });
  const [circle] = (await currentRes.json()) as {
    id: string;
    leader_wallet: string;
    status: string;
    onchain_tx_hash: string | null;
  }[];
  if (!circle) return NextResponse.json({ detail: "Grup tidak ditemukan." }, { status: 404 });
  if (circle.leader_wallet.toLowerCase() !== leader) {
    return NextResponse.json({ detail: "Hanya ketua grup yang boleh mencatat pembayaran." }, { status: 403 });
  }
  if (circle.status === "PURCHASED") {
    return NextResponse.json({ circleId, status: "PURCHASED", onchain_tx_hash: circle.onchain_tx_hash });
  }
  if (circle.status !== "OPEN" && circle.status !== "LOCKED") {
    return NextResponse.json({ detail: `Grup berstatus ${circle.status}, tidak bisa dibayar.` }, { status: 409 });
  }

  // Cakram pengaman: grup yang dikunci harus tetap berisi 3-5 anggota,
  // walau baris anggota ditulis di luar alur normal.
  const countRes = await fetch(
    `${url}/rest/v1/co_purchase_members?circle_id=eq.${circleId}&select=member_wallet`,
    { headers: restHeaders(key), cache: "no-store" },
  );
  if (!countRes.ok) return NextResponse.json({ detail: "Anggota grup belum dapat dibaca." }, { status: 502 });
  const memberRows = (await countRes.json()) as unknown[];
  if (memberRows.length < CO_PURCHASE_MIN || memberRows.length > CO_PURCHASE_MAX) {
    return NextResponse.json(
      { detail: `Grup harus berisi ${CO_PURCHASE_MIN}-${CO_PURCHASE_MAX} orang (sekarang ${memberRows.length}).` },
      { status: 409 },
    );
  }

  const updateRes = await fetch(`${url}/rest/v1/co_purchase_circles?id=eq.${circleId}`, {
    method: "PATCH",
    headers: restHeaders(key),
    body: JSON.stringify({ status: "PURCHASED", onchain_tx_hash: txHash }),
  });
  if (!updateRes.ok) return NextResponse.json({ detail: "Pembayaran belum dapat dicatat." }, { status: 500 });
  return NextResponse.json({ circleId, status: "PURCHASED", onchain_tx_hash: txHash });
}
