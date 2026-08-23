"use client";

import type { User } from "@supabase/supabase-js";
import { FormEvent, useEffect, useState } from "react";
import { isValidEmail, isValidOtp, maskEmail, normalizeEmail, normalizeOtp } from "@/lib/auth-validation";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

type AuthStep = "email" | "otp";

export function EmailAuth() {
  const supabase = getBrowserSupabaseClient();
  const [user, setUser] = useState<User>();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const [isPending, setIsPending] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => setUser(data.user ?? undefined));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user);
      if (session?.user) setIsOpen(false);
    });
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!cooldownUntil) return;
    const update = () => {
      const remaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setCooldownSeconds(remaining);
      if (remaining === 0) setCooldownUntil(0);
    };
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [cooldownUntil]);

  async function requestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = normalizeEmail(email);
    if (cooldownSeconds > 0) {
      setError(`Tunggu ${cooldownSeconds} detik sebelum meminta kode baru.`);
      return;
    }
    if (!supabase || !isValidEmail(normalizedEmail)) {
      setError("Masukkan alamat email yang valid.");
      return;
    }
    setIsPending(true);
    setError(undefined);
    setMessage(undefined);
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: { shouldCreateUser: true },
    });
    setIsPending(false);
    if (authError) {
      setError("Kode belum dapat dikirim. Tunggu sebentar lalu coba kembali.");
      return;
    }
    setEmail(normalizedEmail);
    setStep("otp");
    setCooldownUntil(Date.now() + 60_000);
    setMessage("Jika alamat dapat menerima email, kode 6 digit telah dikirim.");
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !isValidOtp(otp)) {
      setError("Masukkan kode OTP 6 digit.");
      return;
    }
    setIsPending(true);
    setError(undefined);
    const { data, error: authError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });
    setIsPending(false);
    if (authError || !data.user) {
      setError("Kode tidak valid atau sudah kedaluwarsa. Minta kode baru dan coba lagi.");
      return;
    }
    setUser(data.user);
    setOtp("");
    setMessage(undefined);
    setIsOpen(false);
  }

  async function signOut() {
    if (!supabase) return;
    setIsPending(true);
    await supabase.auth.signOut();
    setUser(undefined);
    setStep("email");
    setOtp("");
    setIsPending(false);
  }

  if (!supabase) {
    return <button disabled className="cursor-not-allowed rounded-xl border border-slate-300 px-2 py-2 text-xs font-medium opacity-60 sm:px-4 sm:text-sm" title="Isi konfigurasi Supabase Auth untuk mengaktifkan email OTP"><span className="sm:hidden">Email</span><span className="hidden sm:inline">Email OTP belum dikonfigurasi</span></button>;
  }

  if (user) {
    return <div className="relative">
      <button onClick={() => setIsOpen((value) => !value)} className="rounded-xl border border-emerald-200 bg-mint px-4 py-2 text-sm font-semibold text-leaf" aria-expanded={isOpen}>
        {maskEmail(user.email ?? "")}
      </button>
      {isOpen && <div className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <p className="text-xs font-semibold text-leaf">AKUN TROVAYA</p>
        <p className="mt-2 text-sm text-slate-600">Email terverifikasi. Wallet tetap diperlukan untuk transaksi.</p>
        <button onClick={signOut} disabled={isPending} className="mt-4 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-50">Keluar dari akun</button>
      </div>}
    </div>;
  }

  return <div className="relative">
    <button onClick={() => setIsOpen((value) => !value)} className="rounded-xl border border-slate-300 px-2 py-2 text-xs font-medium sm:px-4 sm:text-sm" aria-expanded={isOpen}>
      <span className="sm:hidden">Email</span><span className="hidden sm:inline">Lanjutkan dengan email</span>
    </button>
    {isOpen && <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-xs font-semibold text-leaf">EMAIL OTP</p><h2 className="mt-1 text-lg font-semibold">{step === "email" ? "Masuk tanpa password" : "Masukkan kode"}</h2></div>
        <button onClick={() => setIsOpen(false)} className="rounded-lg px-2 py-1 text-slate-500" aria-label="Tutup login email">×</button>
      </div>
      {step === "email" ? <form onSubmit={requestOtp} className="mt-4">
        <label className="text-sm font-medium">Alamat email
          <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="nama@example.com" required />
        </label>
        <button disabled={isPending || cooldownSeconds > 0} className="mt-4 w-full rounded-xl bg-ink px-4 py-2 font-semibold text-white disabled:opacity-50">{isPending ? "Mengirim…" : cooldownSeconds > 0 ? `Kirim ulang dalam ${cooldownSeconds} detik` : "Kirim kode OTP"}</button>
      </form> : <form onSubmit={verifyOtp} className="mt-4">
        <p className="text-sm text-slate-600">Kode dikirim ke {maskEmail(email)}.</p>
        <label className="mt-4 block text-sm font-medium">Kode 6 digit
          <input inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(event) => setOtp(normalizeOtp(event.target.value))} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-center text-xl tracking-[0.4em]" maxLength={6} required />
        </label>
        <button disabled={isPending || !isValidOtp(otp)} className="mt-4 w-full rounded-xl bg-ink px-4 py-2 font-semibold text-white disabled:opacity-50">{isPending ? "Memverifikasi…" : "Verifikasi dan masuk"}</button>
        <button type="button" onClick={() => { setStep("email"); setOtp(""); setError(undefined); setMessage(undefined); }} className="mt-2 w-full px-3 py-2 text-sm font-semibold text-leaf">Ganti email atau kirim ulang{cooldownSeconds > 0 ? ` (${cooldownSeconds}s)` : ""}</button>
      </form>}
      {message && <p className="mt-3 rounded-xl bg-mint p-3 text-xs text-leaf">{message}</p>}
      {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}
      <p className="mt-4 text-xs leading-5 text-slate-500">Login email memulihkan profil Trovaya, bukan wallet atau seed phrase.</p>
    </div>}
  </div>;
}
