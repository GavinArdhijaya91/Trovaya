import { NextRequest, NextResponse } from "next/server";
import { trovayaIPNFTAbi, trovayaVaultAbi } from "@trovaya/protocol-sdk";
import { consumeChallenge, parseHexSignature, parseWallet, VaultError } from "@/lib/vault/server";
import { openContentKey, wrapForBuyer } from "@/lib/vault/crypto";
import type { JsonWebKey as NodeJsonWebKey } from "node:crypto";
import { isDeliveryEligible } from "@/lib/vault/delivery-policy";
import { isCanonicalIpfsCid, parseBuyerPublicKey, parseChallengeId, parseChallengeMessage } from "@/lib/vault/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const walletAddress = parseWallet(body?.walletAddress);
    const signature = parseHexSignature(body?.signature);
    const challengeId = parseChallengeId(body?.challengeId);
    const message = parseChallengeMessage(body?.message);
    const publicKey = parseBuyerPublicKey(body?.publicKey);
    if (!walletAddress || !signature || !challengeId || !message || !publicKey) {
      return NextResponse.json({ detail: "Payload delivery tidak valid." }, { status: 400 });
    }
    const services = await consumeChallenge({ challengeId, walletAddress, message, signature }, "deliver_key");
    const [licensed, authorized, metadata] = await Promise.all([
      services.chain.readContract({ address: services.config.ipNFTAddress, abi: trovayaIPNFTAbi, functionName: "hasCommercialLicense", args: [BigInt(services.tokenId), walletAddress] }),
      services.chain.readContract({ address: services.config.vaultAddress, abi: trovayaVaultAbi, functionName: "hasVaultAccess", args: [BigInt(services.tokenId), walletAddress] }),
      services.chain.readContract({ address: services.config.ipNFTAddress, abi: trovayaIPNFTAbi, functionName: "getIPMetadata", args: [BigInt(services.tokenId)] }),
    ]);
    if (!licensed || !authorized) {
      const { error: auditError } = await services.db.from("vault_delivery_audit").insert({ chain_id: services.chainId, token_id: services.tokenId, wallet_address: walletAddress.toLowerCase(), action: "delivery_denied", reason: "license_or_authorization_missing" });
      if (auditError) throw new VaultError(503, "Penolakan delivery belum dapat diaudit.");
      throw new VaultError(403, "Lisensi dan otorisasi vault aktif diperlukan.");
    }
    const { data: record, error: keyLookupError } = await services.db.from("vault_key_records").select("encrypted_key,encryption_iv,auth_tag,status").eq("chain_id", services.chainId).eq("token_id", services.tokenId).maybeSingle();
    if (keyLookupError) throw new VaultError(503, "Content key belum dapat diperiksa.");
    if (!record || !isDeliveryEligible({ licensed, authorized, keyActive: record.status === "active" })) throw new VaultError(404, "Content key aktif belum tersedia.");
    if (!isCanonicalIpfsCid(metadata.encryptedVaultCid)) throw new VaultError(409, "Encrypted original tidak memiliki referensi IPFS yang valid.");
    const key = openContentKey({ encryptedKey: record.encrypted_key, iv: record.encryption_iv, authTag: record.auth_tag }, services.config.masterKey, `${services.chainId}:${services.tokenId}`);
    let wrappedKey: string;
    try {
      wrappedKey = wrapForBuyer(key, publicKey as NodeJsonWebKey);
    } finally {
      key.fill(0);
    }
    const { error: auditError } = await services.db.from("vault_delivery_audit").insert({ chain_id: services.chainId, token_id: services.tokenId, wallet_address: walletAddress.toLowerCase(), action: "key_delivered" });
    if (auditError) throw new VaultError(503, "Delivery key belum dapat diaudit.");
    return NextResponse.json({ algorithm: "RSA-OAEP-256", wrappedKey, encryptedVaultCid: metadata.encryptedVaultCid, tokenId: services.tokenId });
  } catch (error) {
    const status = error instanceof VaultError ? error.status : 500;
    return NextResponse.json({ detail: error instanceof VaultError ? error.message : "Delivery key gagal." }, { status });
  }
}
