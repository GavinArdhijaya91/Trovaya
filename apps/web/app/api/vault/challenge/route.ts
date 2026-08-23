import { NextRequest, NextResponse } from "next/server";
import { buildChallenge, getVaultServices, parseWallet, type ChallengePurpose } from "@/lib/vault/server";
import { parseTokenId } from "@/lib/vault/validation";

export async function POST(request: NextRequest) {
  const services = getVaultServices();
  if (!services) return NextResponse.json({ detail: "Secure vault belum dikonfigurasi." }, { status: 503 });
  const body = await request.json().catch(() => null) as { walletAddress?: unknown; tokenId?: unknown; purpose?: unknown } | null;
  const wallet = parseWallet(body?.walletAddress);
  const tokenId = parseTokenId(body?.tokenId);
  const purpose = body?.purpose === "register_key" || body?.purpose === "deliver_key" ? body.purpose as ChallengePurpose : null;
  if (!wallet || !tokenId || !purpose) return NextResponse.json({ detail: "Permintaan challenge tidak valid." }, { status: 400 });
  const { error: invalidationError } = await services.db.from("vault_delivery_challenges").update({ consumed_at: new Date().toISOString() }).eq("wallet_address", wallet.toLowerCase()).eq("token_id", tokenId).eq("purpose", purpose).is("consumed_at", null);
  if (invalidationError) return NextResponse.json({ detail: "Challenge sebelumnya belum dapat ditutup." }, { status: 503 });
  const challenge = buildChallenge(wallet, services.config.chainId, tokenId, purpose);
  const { data, error } = await services.db.from("vault_delivery_challenges").insert({ chain_id: services.config.chainId, token_id: tokenId, wallet_address: wallet.toLowerCase(), purpose, message_hash: challenge.messageHash, expires_at: challenge.expiresAt }).select("id").single();
  if (error) return NextResponse.json({ detail: "Challenge belum dapat dibuat." }, { status: 500 });
  return NextResponse.json({ challengeId: data.id, message: challenge.message, expiresAt: challenge.expiresAt });
}
