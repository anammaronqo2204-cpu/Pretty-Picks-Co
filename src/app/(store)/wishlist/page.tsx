"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { ProductCard } from "@/components/ProductCard";
import type { PublicProduct } from "@/lib/data";

export default function Wishlist() {
  const { wishlist, ready } = useCart();
  const [items, setItems] = useState<PublicProduct[] | null>(null);
  useEffect(() => {
    if (!ready) return;
    if (!wishlist.length) { setItems([]); return; }
    fetch(`/api/products?ids=${wishlist.join(",")}`).then((r) => r.json()).then(setItems).catch(() => setItems([]));
  }, [wishlist, ready]);
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="heading text-4xl mb-6">Your wishlist</h1>
      {items === null ? <p className="text-cream/60">Loading…</p> : items.length === 0 ? (
        <div className="card p-10 text-center"><p className="text-cream/80">No saved picks yet. Tap the ♡ on anything you love.</p><Link href="/shop" className="btn btn-primary mt-5">Browse the shop</Link></div>
      ) : <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">{items.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}</div>}
    </div>
  );
}
