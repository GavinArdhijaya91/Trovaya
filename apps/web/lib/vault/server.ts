import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createPublicClient, http, type Address, type Hex } from "viem";
import { getVaultServerConfig, type VaultServerConfig } from "@/lib/vault/config";

export type ChallengePurpose = "register_key" | "deliver_key";

export function getVaultServices(): { config: VaultServerConfig; db: SupabaseClient; chain: ReturnType<typeof createPublicClient> } | null {
  const config = getVaultServerConfig();
  if (!config) return null;
  return {
    config,
    db: createClient(config.supabaseUrl, config.serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } }),
    chain: createPublicClient({ transport: http(config.rpcUrl) }),
  };
}

export function buildChallenge(wallet: Address, chainId: number, tokenId: string, purpose: ChallengePurpose) {
  const nonce = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 5 * 60_000).toISOString();
  const message = ["Trovaya secure vault", `Purpose: ${purpose}`, `Wallet: ${wallet.toLowerCase()}`, `Chain ID: ${chainId}`, `Token ID: ${tokenId}`, `Nonce: ${nonce}`, `Expires: ${expiresAt}`].join("\n");
  return { message, messageHash: createHash("sha256").update(message).digest("hex"), expiresAt };
}

export async function consumeChallenge(input: { challengeId: string; walletAddress: Address; message: string; signature: Hex }, purpose: ChallengePurpose) {
  const services = getVaultServices();
  if (!services) throw new VaultError(503, "Secure vault belum dikonfigurasi.");
  const { data: challenge, error: lookupError } = await services.db.from("vault_delivery_challenges").select("id,chain_id,token_id,wallet_address,purpose,message_hash,expires_at,consumed_at,failed_attempts").eq("id", input.challengeId).maybeSingle();
  if (lookupError) throw new VaultError(503, "Challenge belum dapat diverifikasi.");
  const messageHash = createHash("sha256").update(input.message).digest("hex");
  if (!challenge || challenge.purpose !== purpose || challenge.wallet_address !== input.walletAddress.toLowerCase()
      || challenge.message_hash !== messageHash || challenge.consumed_at
      || new Date(challenge.expires_at).getTime() <= Date.now() || challenge.failed_attempts >= 5) {
    throw new VaultError(401, "Challenge tidak valid, telah digunakan, atau kedaluwarsa.");
  }
  const valid = await services.chain.verifyMessage({ address: input.walletAddress, message: input.message, signature: input.signature });
  if (!valid) {
    const { error: attemptError } = await services.db.from("vault_delivery_challenges").update({ failed_attempts: challenge.failed_attempts + 1 }).eq("id", challenge.id).is("consumed_at", null);
    if (attemptError) throw new VaultError(503, "Percobaan signature belum dapat dicatat.");
    throw new VaultError(401, "Signature wallet tidak valid.");
  }
  const { data: consumed, error: consumeError } = await services.db.from("vault_delivery_challenges").update({ consumed_at: new Date().toISOString() }).eq("id", challenge.id).is("consumed_at", null).select("id").maybeSingle();
  if (consumeError) throw new VaultError(503, "Challenge belum dapat dikonsumsi.");
  if (!consumed) throw new VaultError(409, "Challenge sudah digunakan.");
  return { ...services, tokenId: String(challenge.token_id), chainId: Number(challenge.chain_id) };
}

export class VaultError extends Error {
  readonly status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

export function parseWallet(value: unknown): Address | null {
  return typeof value === "string" && /^0x[0-9a-fA-F]{40}$/.test(value) ? value as Address : null;
}

export function parseHexSignature(value: unknown): Hex | null {
  return typeof value === "string" && /^0x[0-9a-fA-F]{130}$/.test(value) ? value as Hex : null;
}
