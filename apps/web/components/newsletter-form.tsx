"use client";

export function NewsletterForm() {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="mt-4 flex flex-col sm:flex-row items-stretch justify-center gap-3"
    >
      <input
        type="text"
        placeholder="Nama Anda"
        aria-label="Nama Anda"
        className="w-full sm:flex-1 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder-teal-200/60 focus:border-white/30 focus:outline-none focus:bg-white/[0.14] transition-all"
      />
      <input
        type="email"
        placeholder="Alamat email aktif"
        aria-label="Alamat email aktif"
        className="w-full sm:flex-[1.4] rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white placeholder-teal-200/60 focus:border-white/30 focus:outline-none focus:bg-white/[0.14] transition-all"
      />
      <button
        type="submit"
        className="interactive-btn w-full sm:w-auto shrink-0 rounded-xl bg-white px-6 py-3 text-sm font-bold text-teal-900 shadow-soft hover:bg-nusa-50 transition-all"
      >
        Langganan
      </button>
    </form>
  );
}
