/**
 * Parses supplier image filenames like "Pink Y2k bag - R250.jpg" into a title + price.
 * Shared by the admin bulk-upload UI (preview) and the server route (authoritative).
 */

const IMG_EXT = /\.(jpe?g|png|webp|gif)$/i;

export const isImageName = (n: string) => IMG_EXT.test(n);

/** "1 250,00" → 1250.00 ; "250.50" → 250.50 ; "R250" → 250 */
export function parseRand(raw: string): number | null {
  let t = raw.replace(/[Rr\s]/g, "");
  if (/,\d{2}$/.test(t)) t = t.replace(/\./g, "").replace(",", ".");
  else t = t.replace(/,/g, "");
  const n = Number(t);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}

const PRICE_PATTERNS: RegExp[] = [
  // "Pink bag - R250" / "(R250)" at the end
  /\s*[-\u2013\u2014|(]\s*R\s?([0-9][0-9\s.,]*[0-9]|[0-9])\s*\)?\s*$/i,
  // bare number at the end after a separator: "Pink bag - 250"
  /\s*[-\u2013\u2014|]\s*([0-9][0-9\s.,]*[0-9]|[0-9])\s*$/,
  // "R250 Pink bag"
  /(?:^|\s)R\s?([0-9][0-9\s.,]*[0-9]|[0-9])(?=\s|$|-|_)/i,
];

export type ParsedFilename = { title: string; price: number | null; warning?: string; slugBase: string };

export function parseProductFilename(filePath: string): ParsedFilename {
  const base = (filePath.split(/[\\/]/).pop() || filePath).replace(IMG_EXT, "");
  let name = base
    .replace(/_+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^\d{1,3}\s*[.)-]\s+/, "") // leading "01 - "
    .trim();

  let price: number | null = null;
  let title = name;

  for (const re of PRICE_PATTERNS) {
    const m = name.match(re);
    if (m) {
      const p = parseRand(m[1]);
      if (p !== null) {
        price = p;
        title = (name.slice(0, m.index) + " " + name.slice((m.index ?? 0) + m[0].length)).trim();
        break;
      }
    }
  }

  title = title
    .replace(/\s*[-\u2013\u2014]\s*(copy|kopie|final|edited|new)\b.*$/i, "") // " - copy", "_final"
    .replace(/\s*\(\d+\)\s*$/, "") // duplicate markers "(1)"
    .replace(/\s*[-\u2013\u2014]\s*(?=[-\u2013\u2014]|$)/g, " ") // dangling separators " - - "
    .replace(/[\s\-–—|:]+$/g, "")
    .replace(/^[\s\-–—|:]+/g, "")
    .replace(/\(\s*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!title) title = "Untitled product";
  if (title.length > 120) title = title.slice(0, 120).trim();

  const slugBase =
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "product";

  return {
    title,
    price,
    slugBase,
    warning: price === null ? "No price found in the filename – add one before importing." : undefined,
  };
}
