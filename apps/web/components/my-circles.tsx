"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatEther, isAddress } from "viem";

interface CircleRow {
  id: string;
  chain_id: number;
  token_id: string;
  leader_wallet: string;
  target_fee_wei: string;
  max_members: number;
  status: "OPEN" | "LOCKED" | "PURCHASED" | "CANCELLED";
  onchain_tx_hash: string | null;
  my_share_wei: string | null;
}

const STATUS_LABEL: Record<CircleRow["status"], string> = {
  OPEN: "Buka - cari teman",
  LOCKED: "Terkunci - siap bayar",
  PURCHASED: "Lunas on-chain",
  CANCELLED: "Batal",
};

function shareLabel(shareWei: string | null): string {
  if (!shareWei) return "…";
  try {
    return `${formatEther(BigInt(shareWei))} BNB`;
  } catch {
    return "…";
  }
}

/**
 * Daftar grup patungan milik satu wallet (ketua maupun anggota).
 * Read-only publik via GET /api/co-purchase/mine; gagal-bawah-tutup:
 * bila backend belum dikonfigurasi, seksi menyembunyikan diri.
 */
export function MyCircles({ wallet }: { wallet: string }) {
  const [circles, setCircles] = useState<CircleRow[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isAddress(wallet)) return;
    let active = true;
    fetch(`/api/co-purchase/mine?wallet=${wallet}`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as { circles: CircleRow[] };
      })
      .then(
        (data) => {
          if (active) setCircles(data.circles);
        },
        () => {
          if (active) setFailed(true);
        },
      );
    return () => {
      active = false;
    };
  }, [wallet]);

  if (!isAddress(wallet) || failed || circles?.length === 0) return null;
  if (circles === null) {
    return (
      <section aria-label="Grup patungan" className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="h-24 animate-pulse rounded-3xl bg-stone-200" />
      </section>
    );
  }

  return (
    <section aria-label="Grup patungan" className="mx-auto max-w-7xl px-5 pb-4 md:px-8">
      <h2 className="text-2xl font-semibold tracking-tight">Grup Patungan Alamat Ini</h2>
      <p className="mt-1 text-xs text-stone-500">
        Urunan lisensi ala Steam Family (3-5 orang). Ketua membayar 1x on-chain, anggota mengganti off-chain.
      </p>
      <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {circles.map((circle) => (
          <li
            key={circle.id}
            className="rounded-3xl border border-teal-200 bg-teal-50/60 p-5 text-sm text-teal-950"
          >
            <div className="flex items-center justify-between gap-3">
              <Link
                href={`/artwork/${circle.chain_id}/${circle.token_id}`}
                className="font-semibold hover:underline"
              >
                Karya #{circle.token_id}
              </Link>
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-teal-900">
                {STATUS_LABEL[circle.status]}
              </span>
            </div>
            <p className="mt-2 text-xs">
              Iuran saya: <strong>{shareLabel(circle.my_share_wei)}</strong>
              {circle.leader_wallet.toLowerCase() === wallet.toLowerCase() && " (saya ketua)"}
            </p>
            {circle.onchain_tx_hash && (
              <a
                href={`https://testnet.bscscan.com/tx/${circle.onchain_tx_hash}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-xs font-semibold text-leaf hover:underline"
              >
                Bukti bayar di BSCScan ↗
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
