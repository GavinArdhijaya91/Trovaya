import { NextRequest, NextResponse } from "next/server";
import { trovayaIPNFTAbi } from "@trovaya/protocol-sdk";
import { consumeChallenge, parseHexSignature, parseWallet, VaultError } from "@/lib/vault/server";
import { sealContentKey } from "@/lib/vault/crypto";
import { isCanonicalIpfsCid, parseChallengeId, parseChallengeMessage } from "@/lib/vault/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const walletAddress = parseWallet(body?.walletAddress);
    const signature = parseHexSignature(body?.signature);
    const challengeId = parseChallengeId(body?.challengeId);
    const message = parseChallengeMessage(body?.message);
    if (!walletAddress || !signature || !challengeId || !message || typeof body?.contentKey !== "string") {
      return NextResponse.json({ detail: "Payload registrasi key tidak valid." }, { status: 400 });
    }
    const rawKey = /^[A-Za-z0-9+/]{43}=$/.test(body.contentKey) ? Buffer.from(body.contentKey, "base64") : Buffer.alloc(0);
    if (rawKey.length !== 32) return NextResponse.json({ detail: "Content key harus 32 byte." }, { status: 400 });
    try {
      const services = await consumeChallenge({ challengeId, walletAddress, message, signature }, "register_key");
      const metadata = await services.chain.readContract({ address: services.config.ipNFTAddress, abi: trovayaIPNFTAbi, functionName: "getIPMetadata", args: [BigInt(services.tokenId)] });
      if (metadata.creator.toLowerCase() !== walletAddress.toLowerCase()) throw new VaultError(403, "Hanya creator asli yang dapat mendaftarkan content key.");
      if (!isCanonicalIpfsCid(metadata.encryptedVaultCid)) throw new VaultError(409, "Encrypted original belum dipersist ke IPFS.");
      const context = `${services.chainId}:${services.tokenId}`;
      const sealed = sealContentKey(rawKey, services.config.masterKey, context);
      const { error } = await services.db.from("vault_key_records").insert({ chain_id: services.chainId, token_id: services.tokenId, creator_wallet: walletAddress.toLowerCase(), encrypted_key: sealed.encryptedKey, encryption_iv: sealed.iv, auth_tag: sealed.authTag, status: "active" });
      if (error?.code === "23505") throw new VaultError(409, "Content key token ini sudah terdaftar dan tidak dapat ditimpa.");
      if (error) throw new VaultError(500, "Content key belum dapat disimpan.");
      return NextResponse.json({ status: "registered", tokenId: services.tokenId });
    } finally {
      rawKey.fill(0);
    }
  } catch (error) {
    const status = error instanceof VaultError ? error.status : 500;
    return NextResponse.json({ detail: error instanceof VaultError ? error.message : "Registrasi key gagal." }, { status });
  }
}
