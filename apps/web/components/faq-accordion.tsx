"use client";
import { useState } from "react";

type Faq = { q: string; a: string };

export function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="divide-y divide-nusa-100 rounded-2xl border border-nusa-200 overflow-hidden bg-white">
      {faqs.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q} className={`bg-white transition-colors duration-200 ${isOpen ? "bg-nusa-50/50" : ""}`}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between p-5 text-left text-sm font-bold text-nusa-900"
            >
              <span className="pr-4">{f.q}</span>
              <span
                className="ml-4 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-nusa-200 bg-white text-nusa-600 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                aria-hidden="true"
              >
                ⌄
              </span>
            </button>
            <div
              className="grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr", opacity: isOpen ? 1 : 0 }}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-sm leading-relaxed text-nusa-600">{f.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
