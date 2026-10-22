/**
 * Payment provider abstraction. EFT is implemented today. PayFast / Yoco can be
 * added by implementing PaymentProvider and confirming payments ONLY from a
 * verified server-side webhook (see README). Card details are never stored.
 */
export type PaymentInit = { kind: "manual"; instructions: string } | { kind: "redirect"; url: string };

export interface PaymentProvider {
  id: string;
  label: string;
  enabled(): boolean;
  /** Called after the order is created server-side */
  initiate(order: { reference: string; total: number }): Promise<PaymentInit>;
  /** Verify a webhook (signature + amount + server-to-server validation). Return order reference if paid. */
  verifyWebhook?(req: Request): Promise<{ reference: string; amount: number } | null>;
}

export const eftProvider: PaymentProvider = {
  id: "eft",
  label: "EFT / Bank Transfer",
  enabled: () => true,
  async initiate(order) {
    return { kind: "manual", instructions: `Use ${order.reference} as your payment reference.` };
  },
};

// Placeholder: requires PAYFAST_MERCHANT_ID / PAYFAST_MERCHANT_KEY / PAYFAST_PASSPHRASE
export const payfastProvider: PaymentProvider = {
  id: "payfast",
  label: "PayFast (requires configuration)",
  enabled: () => !!process.env.PAYFAST_MERCHANT_ID && process.env.PAYFAST_ENABLED === "1",
  async initiate() {
    throw new Error("PayFast not yet integrated. See README");
  },
};

export const providers = [eftProvider, payfastProvider];
export const getProvider = (id: string) => providers.find((p) => p.id === id && p.enabled());
