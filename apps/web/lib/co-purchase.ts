import { formatEther, isAddress } from "viem";

export const CO_PURCHASE_MIN = 3;
export const CO_PURCHASE_MAX = 5;

/** token_id on-chain selalu numerik; tolak injeksi/format aneh di API. */
export function isTokenId(value: unknown): value is string {
  return typeof value === "string" && /^\d{1,78}$/.test(value);
}

export function normalizeWallet(input: string): string | null {
  const trimmed = input.trim();
  if (!isAddress(trimmed)) return null;
  return trimmed.toLowerCase();
}

/**
 * Bagi rata fee ke n anggota. Sisa pembulatan (dust wei) dibebankan ke
 * ketua (index 0) agar total == fee persis — tidak ada wei hilang/lebih.
 */
export function splitShares(feeWei: string, size: number): string[] {
  const fee = BigInt(feeWei);
  if (size < CO_PURCHASE_MIN || size > CO_PURCHASE_MAX) {
    throw new Error(`Ukuran grup harus ${CO_PURCHASE_MIN}-${CO_PURCHASE_MAX} orang.`);
  }
  if (fee <= 0n) throw new Error("Harga lisensi harus lebih dari 0.");
  const base = fee / BigInt(size);
  const remainder = fee - base * BigInt(size);
  return Array.from({ length: size }, (_, i) =>
    (i === 0 ? base + remainder : base).toString(),
  );
}

export function formatShare(shareWei: string, currency = "BNB"): string {
  try {
    return `${formatEther(BigInt(shareWei))} ${currency}`;
  } catch {
    return `— ${currency}`;
  }
}

export interface GroupValidation {
  ok: boolean;
  reason: string | null;
}

export function validateGroup(wallets: string[], size: number): GroupValidation {
  const total = wallets.length;
  if (total < CO_PURCHASE_MIN) {
    return { ok: false, reason: `Minimal ${CO_PURCHASE_MIN} orang untuk kunci grup (sekarang ${total}).` };
  }
  if (total > size) {
    return { ok: false, reason: `Grup melebihi kapasitas ${size} orang.` };
  }
  if (size < CO_PURCHASE_MIN || size > CO_PURCHASE_MAX) {
    return { ok: false, reason: `Ukuran grup harus ${CO_PURCHASE_MIN}-${CO_PURCHASE_MAX} orang.` };
  }
  const normalized = wallets.map((w) => w.toLowerCase());
  if (new Set(normalized).size !== normalized.length) {
    return { ok: false, reason: "Ada alamat dompet ganda di grup." };
  }
  for (const w of wallets) {
    if (!isAddress(w)) return { ok: false, reason: `Alamat tidak valid: ${w}.` };
  }
  return { ok: true, reason: null };
}

export interface LockedGroup {
  /** Jumlah anggota final yang dikunci (selalu 3-5). */
  size: number;
  /** Iuran per anggota seurutan wallets; jumlahnya == fee persis. */
  shares: string[];
}

/**
 * Kunci grup: kapasitas slider runtuh menjadi jumlah anggota aktual.
 * Ini yang membuat 3-5 ketat dan lock-in — tidak ada grup "kapasitas 5
 * isi 3" yang iurannya tidak genap menutup harga.
 */
export function lockGroup(feeWei: string, capacity: number, wallets: string[]): LockedGroup {
  const validation = validateGroup(wallets, capacity);
  if (!validation.ok) throw new Error(validation.reason ?? "Grup tidak valid.");
  const size = wallets.length;
  return { size, shares: splitShares(feeWei, size) };
}

// ---- Client helpers (browser) -------------------------------------------

export function circleStorageKey(chainId: number, tokenId: string): string {
  return `trovaya:co-circle:${chainId}:${tokenId}`;
}

export function saveCircleIdLocal(chainId: number, tokenId: string, circleId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(circleStorageKey(chainId, tokenId), circleId);
  } catch {
    // storage penuh/diblokir — bukan fatal, grup tetap ada di server
  }
}

export function readCircleIdLocal(chainId: number, tokenId: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(circleStorageKey(chainId, tokenId));
}

export function clearCircleIdLocal(chainId: number, tokenId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(circleStorageKey(chainId, tokenId));
  } catch {
    // abaikan — bukan fatal
  }
}

/** Ketua mencatat bukti bayar setelah purchase on-chain sukses. */
export async function recordCirclePurchase(
  circleId: string,
  leaderWallet: string,
  txHash: string,
): Promise<{ status: string }> {
  const res = await fetch("/api/co-purchase", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ circle_id: circleId, leader_wallet: leaderWallet, onchain_tx_hash: txHash }),
  });
  const data = (await res.json().catch(() => null)) as { status?: string; detail?: string } | null;
  if (!res.ok) throw new Error(data?.detail ?? "Pembayaran grup belum dapat dicatat.");
  return { status: data?.status ?? "UNKNOWN" };
}
