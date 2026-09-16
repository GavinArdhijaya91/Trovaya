"use client";

import { useMemo, useState } from "react";
import { isAddress } from "viem";
import { useAccount } from "wagmi";
import { HelpTip } from "./help-tip";
import {
  CO_PURCHASE_MAX,
  CO_PURCHASE_MIN,
  clearCircleIdLocal,
  formatShare,
  normalizeWallet,
  saveCircleIdLocal,
  splitShares,
  validateGroup,
} from "@/lib/co-purchase";
import type { PurchaseQuote } from "@/hooks/use-purchase-quote";
import { PurchaseCostBreakdown } from "./purchase-cost-breakdown";

type SaveState = "idle" | "saving" | "saved" | "failed";

function shortWallet(address: string): string {
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * MVP patungan ala Steam Family (bertahap):
 * Tahap 1 — grup off-chain 3-5 orang, split rata (dust ke ketua),
 *   validasi client+server, tersimpan via /api/co-purchase.
 * Tahap 2 — ketua eksekusi 1x purchase on-chain, anggota urunan off-chain.
 */
export function CoPurchaseCard({
  chainId,
  tokenId,
  feeWei,
  currency = "BNB",
  quote,
  onLeaderPurchase,
}: {
  chainId: number;
  tokenId: string;
  feeWei?: string;
  currency?: string;
  quote?: PurchaseQuote;
  onLeaderPurchase?: () => void;
}) {
  const account = useAccount();
  const [size, setSize] = useState(4);
  const [members, setMembers] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [circleId, setCircleId] = useState<string | null>(null);
  const [lockedShareWei, setLockedShareWei] = useState<string | null>(null);

  const wallets = useMemo(() => {
    const leader = account.address ? [account.address] : [];
    return [...leader, ...members];
  }, [account.address, members]);

  const validation = useMemo(() => validateGroup(wallets, size), [wallets, size]);

  const shares = useMemo(() => {
    if (!feeWei) return [];
    try {
      return splitShares(feeWei, size);
    } catch {
      return [];
    }
  }, [feeWei, size]);

  const leaderShare = shares[0];

  function addMember() {
    setInputError(null);
    const normalized = normalizeWallet(input);
    if (!normalized) {
      setInputError("Alamat dompet tidak valid (format 0x…).");
      return;
    }
    if (wallets.map((w) => w.toLowerCase()).includes(normalized)) {
      setInputError("Alamat ini sudah ada di grup.");
      return;
    }
    if (account.address && normalized === account.address.toLowerCase()) {
      setInputError("Itu alamat kamu sendiri. Kamu sudah tercatat sebagai ketua.");
      return;
    }
    if (members.length >= size - 1) {
      setInputError(`Grup penuh (${size} orang). Geser slider untuk menambah kapasitas.`);
      return;
    }
    setMembers((prev) => [...prev, normalized]);
    setInput("");
    invalidateLock();
  }

  /** Setiap perubahan susunan membatalkan kunci lama agar ID grup basi tidak terpakai. */
  function invalidateLock() {
    setSaveState("idle");
    setCircleId(null);
    setLockedShareWei(null);
    clearCircleIdLocal(chainId, tokenId);
  }

  async function saveGroup() {
    if (!account.address || !feeWei || !validation.ok) return;
    setSaveState("saving");
    setSaveError(null);
    try {
      const res = await fetch("/api/co-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chain_id: chainId,
          token_id: tokenId,
          leader_wallet: account.address,
          target_fee_wei: feeWei,
          max_members: size,
          member_wallets: members,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        circleId?: string;
        shareWei?: string[];
        detail?: string;
      } | null;
      if (!res.ok) throw new Error(data?.detail ?? "Grup belum dapat disimpan.");
      setCircleId(data?.circleId ?? null);
      setLockedShareWei(data?.shareWei?.[0] ?? null);
      if (data?.circleId) saveCircleIdLocal(chainId, tokenId, data.circleId);
      setSaveState("saved");
    } catch (caught) {
      setSaveState("failed");
      setSaveError(caught instanceof Error ? caught.message : "Grup belum dapat disimpan.");
    }
  }

  if (!feeWei) return null;

  // Lock-in: tombol bayar aktif hanya setelah grup dikunci (tersimpan),
  // agar tidak ada pembelian yang iurannya belum genap menutup harga.
  const locked = saveState === "saved" && circleId !== null;
  const canPurchase =
    locked && validation.ok && Boolean(account.address) && isAddress(account.address ?? "");
  const perPersonWei = locked && lockedShareWei ? lockedShareWei : leaderShare;

  return (
    <section aria-label="Patungan keluarga" className="mt-4 rounded-[1.5rem] border border-teal-200 bg-teal-50/60 p-5">
      <p className="text-sm font-semibold text-teal-900">
        Patungan keluarga, {CO_PURCHASE_MIN} sampai {CO_PURCHASE_MAX} orang
      </p>
      <p className="mt-2 text-sm leading-6 text-teal-950">
        Ajak teman urunan beli lisensi karya ini, misalnya batik, untuk dinikmati bersama.
        Harga kreator tetap dan dibagi rata. Ketua membayar sekali{" "}
        <HelpTip>Pembayaran tunggal lewat blockchain oleh ketua. Nilai pastinya tampil di dompet sebelum kamu setujui.</HelpTip>{" "}
        lewat blockchain, anggota mengganti urunan di luar aplikasi.
      </p>

      {quote && (
        <div className="mt-4">
          <PurchaseCostBreakdown quote={quote} currency={currency} memberCount={wallets.length > 1 ? size : 1} />
        </div>
      )}

      <label className="mt-4 block text-xs font-semibold text-teal-900">
        Jumlah anggota (termasuk kamu): <strong>{size}</strong>
        <input
          className="mt-2 w-full accent-teal-700"
          type="range"
          min={CO_PURCHASE_MIN}
          max={CO_PURCHASE_MAX}
          value={size}
          onChange={(e) => {
            const next = Number(e.target.value);
            setSize(next);
            setMembers((prev) => prev.slice(0, Math.max(0, next - 1)));
            invalidateLock();
          }}
        />
      </label>

      {leaderShare && (
        <p className="mt-2 text-sm text-teal-950">
          Iuran per orang: <strong>{formatShare(leaderShare, currency)}</strong>
          <span className="text-xs text-teal-800"> (sisa pembulatan wei ikut ketua)</span>
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addMember();
          }}
          placeholder="0x alamat teman…"
          aria-label="Alamat dompet teman"
          className="min-w-0 flex-1 rounded-xl border border-teal-200 bg-white px-3 py-2 text-xs outline-none focus:border-teal-500"
        />
        <button
          type="button"
          onClick={addMember}
          disabled={members.length >= size - 1 || !input.trim()}
          className="rounded-xl bg-teal-800 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
        >
          Tambah
        </button>
      </div>
      {inputError && (
        <p role="alert" className="mt-2 text-xs font-medium text-red-700">
          {inputError}
        </p>
      )}

      <ul className="mt-3 space-y-1 text-xs text-teal-950">
        <li className="font-semibold">
          1.{" "}
          <span title={account.address ?? undefined} className="font-mono">
            {account.address ? shortWallet(account.address) : "Kamu (hubungkan wallet dulu)"}
          </span>{" "}
          (ketua)
          {leaderShare && account.address && `, ${formatShare(leaderShare, currency)}`}
        </li>
        {members.map((m, i) => (
          <li key={m}>
            {i + 2}.{" "}
            <span title={m} className="font-mono">
              {shortWallet(m)}
            </span>
            , {shares[i + 1] ? formatShare(shares[i + 1]!, currency) : "…"}
            <button
              type="button"
              className="ml-2 font-semibold text-red-700"
              onClick={() => {
                setMembers((prev) => prev.filter((x) => x !== m));
                invalidateLock();
              }}
            >
              hapus
            </button>
          </li>
        ))}
      </ul>

      {!validation.ok && (
        <p className="mt-3 text-xs text-amber-800">{validation.reason}</p>
      )}
      {!account.address && (
        <p className="mt-2 text-xs text-amber-800">Hubungkan wallet. Ketua harus terisi alamat yang valid.</p>
      )}

      <div className="mt-4 grid gap-2">
        <button
          type="button"
          onClick={saveGroup}
          disabled={!validation.ok || !account.address || saveState === "saving"}
          className="w-full rounded-xl border border-teal-700 px-5 py-3 text-sm font-semibold text-teal-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saveState === "saving" ? "Mengunci grup…" : circleId ? "Grup dikunci. Ubah susunan untuk mengunci ulang." : "Kunci grup patungan"}
        </button>
        {saveState === "failed" && saveError && (
          <p role="alert" className="text-xs font-medium text-red-700">
            {saveError}
          </p>
        )}
        {saveState === "saved" && circleId && (
          <p role="status" className="text-xs font-medium text-teal-800">
            Grup dikunci {wallets.length} orang (ID {circleId.slice(0, 8)}…).
            {lockedShareWei && <> Iuran final {formatShare(lockedShareWei, currency)} per orang.</>} Lanjut ke pembayaran oleh ketua.
          </p>
        )}
        <button
          type="button"
          disabled={!canPurchase}
          onClick={onLeaderPurchase}
          className="w-full rounded-xl bg-leaf px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Beli lisensi sebagai ketua ({perPersonWei ? formatShare(perPersonWei, currency).split(" ")[0] : ""} {currency} tambah gas)
        </button>
        {!locked && (
          <p className="text-[11px] leading-5 text-amber-800">
            Kunci grup dulu pakai tombol di atas. Pembayaran aktif setelah iuran genap.
          </p>
        )}
        <p className="text-[11px] leading-5 text-teal-800">
          Yang dibayar ketua lewat blockchain adalah harga penuh karya. Iuran teman ditagih di luar aplikasi setelah bukti transaksi keluar.
        </p>
      </div>
    </section>
  );
}
