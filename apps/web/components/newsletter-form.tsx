"use client";

export function NewsletterForm() {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xl mx-auto"
    >
      <input
        type="text"
        placeholder="Nama Anda"
        className="w-full sm:w-1/3 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-teal-200/60 focus:border-bnb focus:outline-none focus:bg-white/15 transition-all"
      />
      <input
        type="email"
        placeholder="Alamat email aktif"
        className="w-full sm:w-1/2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-teal-200/60 focus:border-bnb focus:outline-none focus:bg-white/15 transition-all"
      />
      <button
        type="submit"
        className="interactive-btn w-full sm:w-auto shrink-0 rounded-xl bg-nusa-900 hover:bg-black px-6 py-3 text-sm font-bold text-white shadow-lg transition-all"
      >
        Langganan
      </button>
    </form>
  );
}
