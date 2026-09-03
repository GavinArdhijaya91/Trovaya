"use client";
import { useState, useRef, useCallback } from "react";
import Image from "next/image";

export function HeroPoisonDemo() {
  const [pos, setPos] = useState(50); // 0 = full blur, 100 = full clear
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePos = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.min(100, Math.max(0, (x / rect.width) * 100));
    setPos(pct);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updatePos(e.clientX);
  }, [updatePos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    updatePos(e.clientX);
  }, [dragging, updatePos]);

  const onPointerUp = useCallback(() => setDragging(false), []);

  return (
    <div className="rounded-2xl border border-nusa-200 bg-white p-4 shadow-soft-md">
      <div className="flex items-center justify-between border-b border-nusa-100 pb-3 mb-3">
        <span className="text-xs font-bold tracking-wider text-nusa-500 uppercase">Demo Preview Terproteksi</span>
        <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">Experimental protection</span>
      </div>

      {/* Container — drag to reveal */}
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        className="relative aspect-[4/3] overflow-hidden rounded-xl bg-nusa-900 select-none touch-none cursor-ew-resize"
      >
        {/* Base: BLURRED poison layer (full) */}
        <div className="absolute inset-0">
          <Image
            src="/assets/flower-photo.jpg"
            alt="Foto bunga terpoison"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-teal-900 via-coral to-amber-200 -z-[1]" />
          {/* Blur + violet tint + noise */}
          <div className="absolute inset-0 backdrop-blur-[10px] bg-violet-900/25" />
          <div className="absolute inset-0 opacity-[0.18] pw-grid-dark" aria-hidden="true" />
          <div className="absolute inset-0 bg-violet-600/10" />
        </div>

        {/* Top: CLEAR layer clipped by pos */}
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
          <div className="absolute inset-0" style={{ width: containerRef.current ? `${containerRef.current.clientWidth}px` : "100%" }}>
            <Image
              src="/assets/flower-photo.jpg"
              alt=""
              fill
              className="object-cover"
              sizes="50vw"
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-teal-900 via-coral to-amber-200 -z-[1]" />
          </div>
        </div>

        {/* Divider line */}
        <div className="absolute inset-y-0 w-0.5 bg-white shadow-soft-md pointer-events-none" style={{ left: `${pos}%` }} />

        {/* Circular handle — arrow HD enhance style */}
        <button
          type="button"
          aria-label="Geser untuk bandingkan"
          onPointerDown={onPointerDown}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 grid h-10 w-10 place-items-center rounded-full border-2 border-white bg-white text-nusa-900 shadow-soft-md transition-transform duration-150 hover:scale-105 active:scale-95"
          style={{ left: `${pos}%` }}
        >
          <span className="flex items-center gap-0.5 text-[11px] font-bold leading-none">
            <span aria-hidden="true">◀</span>
            <span className="h-3 w-px bg-nusa-200" />
            <span aria-hidden="true">▶</span>
          </span>
        </button>

        {/* Labels */}
        <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-black/55 backdrop-blur px-2.5 py-1 text-[10px] font-bold text-white border border-white/20">
          POISON — blur
        </span>
        <span className="pointer-events-none absolute top-3 right-3 rounded-full bg-teal-900 px-2.5 py-1 text-[10px] font-bold text-white shadow-soft-md">
          CLEAR — Vault
        </span>
        <span className="pointer-events-none absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 text-[10px] font-bold text-white">🔒 Vault terenkripsi</span>
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center gap-3">
        <div className="flex flex-1 gap-2">
          <button
            type="button"
            onClick={() => setPos(0)}
            className="interactive-btn flex-1 rounded-xl border border-nusa-200 bg-white px-3 py-2 text-xs font-bold text-nusa-700 hover:bg-nusa-50"
          >
            Full Blur
          </button>
          <button
            type="button"
            onClick={() => setPos(100)}
            className="interactive-btn flex-1 rounded-xl bg-teal-900 px-3 py-2 text-xs font-bold text-white shadow-soft-md hover:bg-teal-800"
          >
            Full Clear
          </button>
        </div>
        <button
          type="button"
          onClick={() => setPos(50)}
          className="interactive-btn rounded-xl border border-nusa-200 bg-nusa-50 px-4 py-2 text-xs font-semibold text-nusa-700 hover:bg-white"
        >
          50:50
        </button>
      </div>
      <p className="mt-2 text-center text-[11px] text-nusa-500">Geser handle bulat atau klik Full Blur/Clear — 0% = semua buram, 100% = semua jernih</p>
      <p className="mt-3 text-[11px] leading-relaxed text-nusa-500 bg-nusa-50 border border-nusa-100 rounded-xl p-2.5">
        On-chain record = bukti provenance dan konsen, <strong>bukan pernyataan hak cipta atau penegakan hukum otomatis.</strong> File asli tidak otomatis terkirim setelah beli, butuh otorisasi vault terpisah.
      </p>
    </div>
  );
}
