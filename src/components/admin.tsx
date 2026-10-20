export function Flash({ sp }: { sp: { ok?: string; error?: string } }) {
  return <>{sp.ok && <p role="status" className="card p-3 mb-4 text-gold border-gold/40">{sp.ok}</p>}{sp.error && <p role="alert" className="card p-3 mb-4 text-bright border-bright/50">{sp.error}</p>}</>;
}
export function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return <div className="card p-4"><p className="text-xs text-cream/60 uppercase tracking-wide">{label}</p><p className="text-2xl price mt-1">{value}</p>{hint && <p className="text-xs text-cream/50 mt-1">{hint}</p>}</div>;
}
export const th = "text-left text-xs uppercase tracking-wide text-cream/60 py-2 px-2 whitespace-nowrap";
export const td = "py-2 px-2 align-top border-t border-moon/10";
