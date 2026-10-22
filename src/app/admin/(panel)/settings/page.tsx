import { db } from "@/db";
import { discountCodes, admins } from "@/db/schema";
import { getSettings } from "@/lib/data";
import { Flash } from "@/components/admin";
import { saveSettingsAction, saveDiscountAction, addAdminAction } from "../../actions";

export default async function Settings({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const sp = await searchParams;
  const [s, codes, adminList] = await Promise.all([getSettings(), db.select().from(discountCodes), db.select({ email: admins.email, name: admins.name }).from(admins)]);
  const I = ({ n, l, v, type = "text" }: { n: string; l: string; v: string | number; type?: string }) => <div><label className="label" htmlFor={n}>{l}</label><input id={n} name={n} type={type} step={type === "number" ? "0.01" : undefined} defaultValue={v} className="input" /></div>;
  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="heading text-3xl">Settings</h1>
      <Flash sp={sp} />
      <form action={saveSettingsAction} className="space-y-4">
        <section className="card p-5 grid sm:grid-cols-2 gap-4"><h2 className="heading text-xl sm:col-span-2">Contact & social</h2>
          <I n="businessEmail" l="Business email" v={s.businessEmail} /><I n="whatsapp" l="WhatsApp number (international, e.g. 27821234567)" v={s.whatsapp} />
          <I n="instagram" l="Instagram URL" v={s.instagram} /><I n="tiktok" l="TikTok URL" v={s.tiktok} />
        </section>
        <section className="card p-5 grid sm:grid-cols-3 gap-4"><h2 className="heading text-xl sm:col-span-3">Delivery & fees</h2>
          <I n="shippingFee" l="Flat delivery fee (R)" v={s.shippingFee} type="number" /><I n="freeShippingOver" l="Free delivery over (R)" v={s.freeShippingOver} type="number" />
          <I n="eftFeePerOrder" l="Bank/transaction cost per order (R). For profit" v={s.eftFeePerOrder} type="number" />
        </section>
        <section className="card p-5 grid sm:grid-cols-2 gap-4 border-gold/40"><h2 className="heading text-xl sm:col-span-2">EFT banking details</h2>
          <p className="text-xs text-cream/60 sm:col-span-2">Shown to customers only on their private order page, and only once you tick &quot;verified&quot;. Double-check these against your bank statement.</p>
          <I n="bankName" l="Bank" v={s.bank.bankName} /><I n="accountName" l="Account holder" v={s.bank.accountName} />
          <I n="accountNumber" l="Account number" v={s.bank.accountNumber} /><I n="branchCode" l="Branch code" v={s.bank.branchCode} />
          <I n="accountType" l="Account type" v={s.bank.accountType} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="bankVerified" defaultChecked={s.bank.verified} className="w-5 h-5" /> I have verified these banking details</label>
        </section>
        <button className="btn btn-primary">Save settings</button>
      </form>

      <section className="card p-5 space-y-3"><h2 className="heading text-xl">Discount codes</h2>
        {[...codes, null].map((c, i) => (
          <form key={c?.id ?? `new${i}`} action={saveDiscountAction} className="grid grid-cols-2 sm:grid-cols-[1fr_120px_100px_120px_auto_auto] gap-2 items-center">
            {c && <input type="hidden" name="id" value={c.id} />}
            <input name="code" defaultValue={c?.code} placeholder="NEWCODE" aria-label="Code" className="input uppercase" required />
            <select name="type" defaultValue={c?.type ?? "percent"} aria-label="Type" className="input"><option value="percent">% off</option><option value="fixed">R off</option></select>
            <input name="value" type="number" step="0.01" defaultValue={c?.value ?? ""} placeholder="Value" aria-label="Value" className="input" required />
            <input name="minSubtotal" type="number" step="0.01" defaultValue={c?.minSubtotal ?? "0"} aria-label="Minimum spend" title="Minimum spend" className="input" />
            <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="active" defaultChecked={c?.active ?? true} /> Active</label>
            <div className="flex gap-1"><button className="btn btn-primary !min-h-10 !py-1 text-sm">{c ? "Save" : "Add"}</button>{c && <button name="delete" value="1" className="btn btn-ghost !min-h-10 !py-1 text-sm">✕</button>}</div>
          </form>
        ))}
      </section>

      <section className="card p-5 space-y-3"><h2 className="heading text-xl">Administrators</h2>
        <ul className="text-sm">{adminList.map((a) => <li key={a.email}>{a.name}, {a.email}</li>)}</ul>
        <form action={addAdminAction} className="grid sm:grid-cols-4 gap-2">
          <input name="name" placeholder="Name" aria-label="Name" className="input" /><input name="email" type="email" placeholder="Email" aria-label="Email" required className="input" />
          <input name="password" type="password" minLength={10} placeholder="Password (10+)" aria-label="Password" required className="input" /><button className="btn btn-ghost">Add admin</button>
        </form>
      </section>
    </div>
  );
}
