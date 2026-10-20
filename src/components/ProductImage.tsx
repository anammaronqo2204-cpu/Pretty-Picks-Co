/* Renders either an uploaded/URL image or original SVG product artwork ("art:kind:#colour"). */
import React from "react";

function Art({ kind, c }: { kind: string; c: string }) {
  const gold = "#d4af37";
  const shapes: Record<string, React.ReactNode> = {
    bag: <><path d="M60 95 h80 l10 70 h-100z" fill={c} /><path d="M78 95 q22-40 44 0" stroke={gold} strokeWidth="5" fill="none" /><path d="M100 110 l-22-12 v24z M100 110 l22-12 v24z" fill="#fff4f8" /><circle cx="100" cy="110" r="5" fill="#fff4f8" /></>,
    cherrybag: <><rect x="55" y="90" width="90" height="70" rx="14" fill={c} /><path d="M65 90 q35-50 70 0" stroke="#3b1d2a" strokeWidth="4" fill="none" />{[[80, 120], [112, 135], [125, 110], [90, 145]].map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r="6" fill="#d6246e" /><circle cx={x + 9} cy={y + 2} r="6" fill="#d6246e" /><path d={`M${x} ${y - 5} q5-10 12-12 M${x + 9} ${y - 3} q0-8 3-14`} stroke="#4a7a3a" strokeWidth="1.5" fill="none" /></g>)}</>,
    minibag: <><rect x="62" y="100" width="76" height="55" rx="10" fill={c} /><path d="M62 112 h76" stroke="#fff4f8" strokeOpacity=".4" /><path d="M66 100 L100 50 L134 100" stroke={gold} strokeWidth="3" fill="none" /><rect x="94" y="108" width="12" height="9" rx="2" fill={gold} /></>,
    clutch: <><rect x="45" y="100" width="110" height="55" rx="8" fill={c} /><path d="M45 108 l55 25 l55-25" fill="none" stroke="#fff" strokeOpacity=".6" />{Array.from({ length: 22 }).map((_, i) => <circle key={i} cx={52 + ((i * 37) % 100)} cy={106 + ((i * 23) % 45)} r="1.6" fill="#fff" opacity=".8" />)}<path d="M50 100 q50-60 100 0" stroke={gold} strokeDasharray="4 3" strokeWidth="2" fill="none" /></>,
    jewel: <><path d="M60 60 q40 70 80 0" stroke={gold} strokeWidth="2.5" fill="none" /><circle cx="100" cy="95" r="9" fill={c} stroke={gold} strokeWidth="2" /><ellipse cx="100" cy="150" rx="34" ry="12" stroke={c} strokeWidth="5" fill="none" /><circle cx="60" cy="130" r="5" fill={c} /><circle cx="140" cy="130" r="5" fill={c} /></>,
    heart: <><path d="M60 55 q40 60 80 0" stroke={c} strokeWidth="2" fill="none" /><path d="M100 140 C60 112 70 85 90 92 Q100 96 100 105 Q100 96 110 92 C130 85 140 112 100 140z" fill={c} /><path d="M88 100 q4-4 8 0" stroke="#fff" strokeOpacity=".7" strokeWidth="2" fill="none" /></>,
    flats: <><path d="M40 140 q0-25 30-25 h30 q20 0 22 20 q0 12-20 12 h-50 q-12 0-12-7z" fill={c} /><path d="M90 150 q0-25 30-25 h30 q20 0 22 20 q0 12-20 12 h-50 q-12 0-12-7z" fill={c} opacity=".85" /><path d="M66 120 l-8-6 v12z M66 120 l8-6 v12z M118 130 l-8-6 v12z M118 130 l8-6 v12z" fill="#fff4f8" /></>,
    pouch: <><path d="M50 100 q50-20 100 0 l-6 55 q-44 15-88 0z" fill={c} /><path d="M52 102 q48-16 96 0" stroke={gold} strokeWidth="3" fill="none" /><circle cx="140" cy="100" r="4" fill={gold} /><path d="M70 120 q30 10 60 0" stroke="#fff" strokeOpacity=".35" strokeWidth="6" fill="none" /></>,
    cardigan: <><path d="M70 55 l-30 20 l10 30 l12-6 v70 h76 v-70 l12 6 l10-30 l-30-20 q-30 25-60 0z" fill={c} /><path d="M100 70 v100" stroke="#fff" strokeOpacity=".5" />{[90, 110, 130, 150].map((y) => <circle key={y} cx="104" cy={y} r="3.5" fill="#fff4f8" />)}</>,
    sparkle: <>{[[70, 90, 14], [125, 80, 10], [100, 130, 16], [140, 135, 8]].map(([x, y, r], i) => <path key={i} d={`M${x} ${y - r} L${x + r / 3} ${y - r / 3} L${x + r} ${y} L${x + r / 3} ${y + r / 3} L${x} ${y + r} L${x - r / 3} ${y + r / 3} L${x - r} ${y} L${x - r / 3} ${y - r / 3}z`} fill={i % 2 ? c : "#fff"} />)}<rect x="55" y="155" width="90" height="6" rx="3" fill="#c0c0c8" /></>,
    claw: <>{[[60, 1], [100, 1.2], [140, .9]].map(([x, s], i) => <g key={i} transform={`translate(${x} 110) scale(${s})`}><path d="M-15 -20 q15 -15 30 0 v30 q-15 15 -30 0z" fill={c} stroke={gold} strokeWidth="1.5" />{[-12, -2, 8].map((y) => <circle key={y} cx="0" cy={y} r="4" fill="#fff" />)}</g>)}</>,
    headband: <><path d="M45 140 q55-110 110 0" stroke={c} strokeWidth="16" fill="none" strokeLinecap="round" /><path d="M100 62 l-28-14 v28z M100 62 l28-14 v28z" fill={c} stroke="#fff" strokeOpacity=".3" /><circle cx="100" cy="62" r="7" fill={c} stroke="#fff" strokeOpacity=".5" /></>,
  };
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full" role="img" aria-hidden="true">
      <defs><radialGradient id={`g-${kind}`} cx="50%" cy="40%" r="70%"><stop offset="0%" stopColor="#3a1d3f" /><stop offset="100%" stopColor="#140a17" /></radialGradient></defs>
      <rect width="200" height="200" fill={`url(#g-${kind})`} />
      <circle cx="100" cy="110" r="70" fill={c} opacity=".08" />
      {shapes[kind] ?? <circle cx="100" cy="100" r="40" fill={c} />}
      <ellipse cx="100" cy="178" rx="60" ry="5" fill="#000" opacity=".3" />
    </svg>
  );
}

export function ProductImage({ src, alt, className = "", eager = false }: { src?: string; alt: string; className?: string; eager?: boolean }) {
  if (src?.startsWith("art:")) {
    const [, kind, c] = src.split(":");
    return <div className={`relative overflow-hidden ${className}`} role="img" aria-label={alt}><Art kind={kind} c={c || "#e8a0b8"} /></div>;
  }
  return (
    <div className={`relative overflow-hidden bg-plum ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" className="w-full h-full object-cover" />
      ) : <div className="w-full h-full grid place-items-center text-moon/50 text-sm">No image</div>}
    </div>
  );
}
