"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { pixel } from "@/lib/pixel";

export type CartItem = { key: string; productId: number; slug: string; title: string; image: string; price: number; size?: string | null; colour?: string | null; quantity: number; deliveryMin: number; deliveryMax: number };
type Ctx = {
  items: CartItem[]; count: number; wishlist: number[]; ready: boolean;
  add: (i: Omit<CartItem, "key" | "quantity">, qty?: number, origin?: { x: number; y: number }) => void;
  update: (key: string, patch: Partial<CartItem>) => void; remove: (key: string) => void; clear: () => void;
  toggleWish: (id: number) => void; toast: string | null;
};
const C = createContext<Ctx | null>(null);
export const useCart = () => { const c = useContext(C); if (!c) throw new Error("no cart"); return c; };
const mkKey = (i: { productId: number; size?: string | null; colour?: string | null }) => `${i.productId}|${i.size ?? ""}|${i.colour ?? ""}`;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [wishlist, setWish] = useState<number[]>([]);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems(JSON.parse(localStorage.getItem("ppc_cart") || "[]"));
      setWish(JSON.parse(localStorage.getItem("ppc_wish") || "[]"));
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem("ppc_cart", JSON.stringify(items)); }, [items, ready]);
  useEffect(() => { if (ready) localStorage.setItem("ppc_wish", JSON.stringify(wishlist)); }, [wishlist, ready]);
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2200); };

  const add: Ctx["add"] = useCallback((i, qty = 1) => {
    const key = mkKey(i);
    setItems((prev) => {
      const ex = prev.find((p) => p.key === key);
      if (ex) return prev.map((p) => (p.key === key ? { ...p, quantity: Math.min(10, p.quantity + qty) } : p));
      return [...prev, { ...i, key, quantity: qty }];
    });
    pixel.addToCart({ id: i.productId, title: i.title, price: i.price, quantity: qty });
    flash(`Added ${i.title} to your bag `);
  }, []);
  const update: Ctx["update"] = (key, patch) => setItems((prev) => {
    const next = prev.map((p) => { if (p.key !== key) return p; const n = { ...p, ...patch }; n.key = mkKey(n); return n; });
    // merge duplicates after variation change
    const merged: CartItem[] = [];
    next.forEach((n) => { const m = merged.find((x) => x.key === n.key); if (m) m.quantity = Math.min(10, m.quantity + n.quantity); else merged.push(n); });
    return merged;
  });
  const remove = (key: string) => setItems((p) => p.filter((x) => x.key !== key));
  const clear = () => setItems([]);
  const toggleWish = (id: number) => setWish((w) => { const has = w.includes(id); flash(has ? "Removed from wishlist" : "Saved to wishlist ♡"); return has ? w.filter((x) => x !== id) : [...w, id]; });
  return (
    <C.Provider value={{ items, count: items.reduce((s, i) => s + i.quantity, 0), wishlist, ready, add, update, remove, clear, toggleWish, toast }}>
      {children}
      {toast && <div role="status" aria-live="polite" className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[90] card px-5 py-3 text-sm shadow-lg fade-up">{toast}</div>}
    </C.Provider>
  );
}
