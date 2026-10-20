"use client";
/** Central Meta Pixel helper. Disabled when NEXT_PUBLIC_META_PIXEL_ID is empty or consent not given. Never send PII. */
type Fbq = ((...args: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown };
declare global { interface Window { fbq?: Fbq; _fbq?: Fbq } }

export const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";
const CONSENT_KEY = "ppc_consent";

export const hasConsent = () => typeof window !== "undefined" && localStorage.getItem(CONSENT_KEY) === "yes";
export const consentDecided = () => typeof window !== "undefined" && !!localStorage.getItem(CONSENT_KEY);
export function setConsent(v: boolean) { localStorage.setItem(CONSENT_KEY, v ? "yes" : "no"); if (v) initPixel(); }

let initialised = false;
export function initPixel() {
  if (initialised || !PIXEL_ID || !hasConsent() || typeof window === "undefined") return;
  initialised = true;
  /* eslint-disable */
  (function (f: any, b: Document, e: string, v: string) {
    if (f.fbq) return; const n: any = (f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); });
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
    const t = b.createElement(e) as HTMLScriptElement; t.async = true; t.src = v; b.head.appendChild(t);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */
  window.fbq?.("init", PIXEL_ID);
}

function track(event: string, params?: Record<string, unknown>, eventID?: string) {
  if (!PIXEL_ID || !hasConsent()) return;
  initPixel();
  window.fbq?.("track", event, params ?? {}, eventID ? { eventID } : undefined);
}

let lastPage = "";
export const pixel = {
  pageView(url: string) { if (url === lastPage) return; lastPage = url; track("PageView"); },
  viewContent(p: { id: number; title: string; price: number }) { track("ViewContent", { content_ids: [String(p.id)], content_name: p.title, content_type: "product", value: p.price, currency: "ZAR" }); },
  addToCart(p: { id: number; title: string; price: number; quantity: number }) { track("AddToCart", { content_ids: [String(p.id)], content_name: p.title, content_type: "product", value: p.price * p.quantity, currency: "ZAR" }); },
  initiateCheckout(value: number, numItems: number) { track("InitiateCheckout", { value, currency: "ZAR", num_items: numItems }); },
  /** Fires once per order (deduped in localStorage + eventID) only after payment is verified. */
  purchase(reference: string, value: number) {
    const k = `ppc_purchase_${reference}`;
    if (typeof window === "undefined" || localStorage.getItem(k)) return;
    if (!PIXEL_ID || !hasConsent()) return;
    localStorage.setItem(k, "1");
    track("Purchase", { value, currency: "ZAR" }, `purchase-${reference}`);
  },
  contact() { track("Contact"); },
};
