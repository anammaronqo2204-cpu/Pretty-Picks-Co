import React from "react";

function inline(t: string, k: string): React.ReactNode[] {
  return t.split(/(\*\*[^*]+\*\*|_[^_]+_)/g).map((part, i) =>
    part.startsWith("**") ? <strong key={k + i}>{part.slice(2, -2)}</strong> : part.startsWith("_") && part.endsWith("_") && part.length > 2 ? <em key={k + i}>{part.slice(1, -1)}</em> : part);
}

/** Minimal, XSS-safe markdown: ## headings, - lists, 1. lists, **bold**, _italic_, paragraphs. */
export function Markdown({ text }: { text: string }) {
  const blocks = text.replace(/\r/g, "").split(/\n{2,}/);
  return (
    <div className="prose-pp">
      {blocks.map((b, i) => {
        const lines = b.split("\n");
        if (b.startsWith("## ")) return <React.Fragment key={i}><h2>{b.slice(3).split("\n")[0]}</h2>{lines.slice(1).length > 0 && <p>{inline(lines.slice(1).join(" "), `${i}p`)}</p>}</React.Fragment>;
        if (lines.every((l) => /^- /.test(l))) return <ul key={i}>{lines.map((l, j) => <li key={j}>{inline(l.slice(2), `${i}-${j}`)}</li>)}</ul>;
        if (lines.every((l) => /^\d+\. /.test(l))) return <ol key={i}>{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\d+\. /, ""), `${i}-${j}`)}</li>)}</ol>;
        return <p key={i}>{inline(lines.join(" "), String(i))}</p>;
      })}
    </div>
  );
}
