"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { pixel } from "@/lib/pixel";

export function ProofUpload({ reference, token }: { reference: string; token: string }) {
  const [state, setState] = useState<"idle" | "busy" | "ok" | string>("idle");
  const router = useRouter();
  if (state === "ok") return <p className="text-gold" role="status">Thank you! Your proof was uploaded. We&apos;ll verify the payment once the funds reflect in our account and update your order.</p>;
  return (
    <form className="space-y-3" onSubmit={async (e) => {
      e.preventDefault(); if (state === "busy") return; setState("busy");
      const fd = new FormData(e.currentTarget); fd.set("token", token);
      const r = await fetch(`/api/orders/${reference}/proof`, { method: "POST", body: fd });
      const d = await r.json().catch(() => ({}));
      if (r.ok) { setState("ok"); router.refresh(); } else setState(d.error || "Upload failed");
    }}>
      <label className="label" htmlFor="proof">Upload proof of payment (PDF, JPG, PNG or WebP · max 5MB)</label>
      <input id="proof" name="file" type="file" required accept="application/pdf,image/jpeg,image/png,image/webp" className="input file:mr-3 file:rounded-full file:border-0 file:bg-moon file:px-3 file:text-night" />
      {state !== "idle" && state !== "busy" && <p role="alert" className="text-bright text-sm">{state}</p>}
      <button className="btn btn-primary w-full" disabled={state === "busy"}>{state === "busy" ? "Uploading…" : "Upload proof"}</button>
    </form>
  );
}

export function PurchasePixel({ reference, total }: { reference: string; total: number }) {
  useEffect(() => { pixel.purchase(reference, total); }, [reference, total]);
  return null;
}

export function CopyButton({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return <button type="button" className="text-xs underline text-moon ml-2" onClick={() => { navigator.clipboard?.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); }}>{ok ? "Copied" : "Copy"}</button>;
}
