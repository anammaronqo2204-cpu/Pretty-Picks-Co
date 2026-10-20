export function zar(n: number | string | null | undefined) {
  const v = Number(n ?? 0);
  return "R" + v.toLocaleString("en-ZA", { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 }).replace(/\u00a0/g, " ");
}
export function deliveryText(min: number, max: number) {
  return min === max ? `${min} days` : `${min}–${max} days`;
}
export function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}
export function suggestedPrice(cost: number, sourcing: number, markup: number) {
  return Math.round((cost + sourcing) * (1 + markup / 100));
}
