export function HelpTip({ children }: { children: string }) {
  return <span className="group relative ml-1 inline-flex cursor-help" tabIndex={0}>
    <span aria-label="Apa artinya?" className="grid size-5 place-items-center rounded-full bg-slate-200 text-xs">?</span>
    <span role="tooltip" className="pointer-events-none absolute bottom-7 left-1/2 z-20 hidden w-56 -translate-x-1/2 rounded-xl bg-ink p-3 text-xs font-normal text-white shadow-soft group-hover:block group-focus:block">{children}</span>
  </span>;
}
