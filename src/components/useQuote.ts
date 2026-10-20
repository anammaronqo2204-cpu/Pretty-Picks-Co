"use client";
import { useEffect, useState } from "react";
import type { CartItem } from "./CartProvider";

export type Quote = {
  subtotal: number; discount: number; shipping: number; total: number; appliedCode: string | null; codeMessage: string;
  errors: string[]; multiSupplier: boolean; mixedDelivery: boolean;
  items: { productId: number; size: string | null; colour: string | null; unitPrice: number; quantity: number }[];
  options: Record<string, { sizes: string[]; colours: string[]; available: boolean }>;
};

export function useQuote(items: CartItem[], code: string | null, ready: boolean) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const sig = JSON.stringify(items.map((i) => [i.productId, i.quantity, i.size, i.colour])) + code;
  useEffect(() => {
    if (!ready) return;
    const ctl = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch("/api/quote", { method: "POST", headers: { "Content-Type": "application/json" }, signal: ctl.signal, body: JSON.stringify({ lines: items.map((i) => ({ productId: i.productId, quantity: i.quantity, size: i.size, colour: i.colour })), code }) })
      .then((r) => r.json()).then((q) => { setQuote(q); setLoading(false); }).catch(() => {});
    return () => ctl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, ready]);
  return { quote, loading };
}
