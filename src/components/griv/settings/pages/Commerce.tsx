import { useState } from "react";
import { ChevronDown, Monitor, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog, DataTable, EmptyState, FormDialog, StatusBadge, type Column } from "@/components/griv/kit";
import { CURRENCIES, formatMoney, type Currency } from "@/lib/money";
import { fmtDateTime } from "@/lib/dates";
import { useRoles, useMembers } from "@/lib/demo/settings/access";
import { diffFields, logAudit } from "@/lib/demo/settings/activity";
import { brandingStore } from "@/lib/demo/settings/business";
import {
  customerSettingsStore, ID_FIELDS, inventorySettingsStore, invoiceNumberPreview, invoiceSettingsStore, linkSettingsStore, PAYMENT_TERMS,
  posDevicesStore, posLocationsStore, posSettingsStore, storeSettingsStore, type PosDevice, type PosLocation,
} from "@/lib/demo/settings/commerce";
import { Callout, ChoiceList, Editable, INPUT, RowMenu, SaveBar, Section, SELECT, SettingsPage, SettingsTabs, TEXTAREA, ToggleRow, useCanEdit, useDraft, useTab } from "../ui";
import { cn } from "@/lib/utils";

const label = (t: string, children: React.ReactNode, hint?: string) => (
  <label className="block text-sm font-medium">{t}<span className="mt-1.5 block">{children}</span>{hint && <span className="mt-1 block text-xs font-normal text-muted-foreground">{hint}</span>}</label>
);
const audit = <T extends Record<string, unknown>>(area: string, before: T, after: T) => {
  const d = diffFields(before, after);
  logAudit(`${area} updated`, area, d.changed.slice(0, 4).join(", ") + (d.changed.length > 4 ? "…" : ""), { before: d.before, after: d.after });
};

function RolePicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const roles = useRoles();
  return (
    <div className="flex flex-wrap gap-2">{roles.map((r) => (
      <label key={r.id} className={cn("flex cursor-pointer items-center rounded-full border px-3 py-1 text-xs", value.includes(r.id) && "border-primary bg-primary/5 text-primary", r.id === "owner" && "cursor-not-allowed opacity-70")}>
        <input type="checkbox" className="sr-only" disabled={r.id === "owner"} checked={value.includes(r.id)} onChange={() => onChange(value.includes(r.id) ? value.filter((x) => x !== r.id) : [...value, r.id])} />{r.name}
      </label>
    ))}</div>
  );
}

/* ---------- Invoices ---------- */
export function InvoiceSettingsPage() {
  const saved = invoiceSettingsStore.use();
  const branding = brandingStore.use();
  const { draft, set, dirty, reset } = useDraft(saved);
  const prefixBad = !/^[A-Z0-9-]{1,12}$/.test(draft.prefix);
  return (
    <SettingsPage slug="invoices" wide>
      <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
        <Editable>
          <Section title="Invoice defaults" description="Used for every new invoice. You can still change them on each invoice.">
            <div className="grid gap-4 sm:grid-cols-3">
              {label("Number prefix", <input className={cn(INPUT, "font-mono uppercase", prefixBad && "border-destructive")} value={draft.prefix} onChange={(e) => set({ prefix: e.target.value.toUpperCase() })} />, prefixBad ? "Letters, numbers and dashes, up to 12." : undefined)}
              {label("Next number", <input type="number" min={1} className={INPUT} value={draft.nextNumber} onChange={(e) => set({ nextNumber: Math.max(1, Number(e.target.value)) })} />)}
              {label("Digits", <select className={SELECT} value={draft.padding} onChange={(e) => set({ padding: Number(e.target.value) })}>{[4, 5, 6].map((n) => <option key={n}>{n}</option>)}</select>)}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Next invoice: <span className="font-mono font-semibold text-foreground">{invoiceNumberPreview(draft)}</span></p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {label("Default currency", <select className={SELECT} value={draft.currency} onChange={(e) => set({ currency: e.target.value as Currency })}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>)}
              {label("Payment terms", <select className={SELECT} value={draft.terms} onChange={(e) => set({ terms: e.target.value })}>{PAYMENT_TERMS.map((t) => <option key={t}>{t}</option>)}</select>)}
              {label("Tax behaviour", <select className={SELECT} value={draft.taxBehavior} onChange={(e) => set({ taxBehavior: e.target.value as typeof draft.taxBehavior })}><option value="exclusive">Prices exclude tax</option><option value="inclusive">Prices include tax</option><option value="none">No tax by default</option></select>, "Rates come from Tax settings.")}
              {label("Due date", <select className={SELECT} value={draft.dueBehavior} onChange={(e) => set({ dueBehavior: e.target.value as typeof draft.dueBehavior })}><option value="terms">From payment terms</option><option value="on_receipt">Due on receipt</option><option value="fixed_day">Last day of the month</option></select>)}
            </div>
            <div className="mt-4 grid gap-4">
              {label("Default memo", <textarea className={`${TEXTAREA} h-20`} value={draft.memo} onChange={(e) => set({ memo: e.target.value })} />)}
              {label("Default footer", <textarea className={`${TEXTAREA} h-20`} value={draft.footer} onChange={(e) => set({ footer: e.target.value })} />)}
            </div>
          </Section>
          <Section title="Payment collection">
            <p className="mb-2 text-sm font-medium">Payment methods on invoices</p>
            <div className="mb-3 flex flex-wrap gap-2">{["Bank transfer", "Cards", "USSD", "Pay with bank app"].map((m) => (
              <label key={m} className={cn("flex cursor-pointer items-center rounded-full border px-3 py-1 text-xs", draft.methods.includes(m) && "border-primary bg-primary/5 text-primary")}><input type="checkbox" className="sr-only" checked={draft.methods.includes(m)} onChange={() => set({ methods: draft.methods.includes(m) ? draft.methods.filter((x) => x !== m) : [...draft.methods, m] })} />{m}</label>
            ))}</div>
            {draft.methods.length === 0 && <p className="mb-2 text-xs text-destructive">Pick at least one method.</p>}
            <ToggleRow label="Hosted payment page" description="Each invoice gets a link where customers can pay online." checked={draft.hostedPage} onChange={(v) => set({ hostedPage: v })} />
            <ToggleRow label="Allow partial payments" description="Customers can pay part of an invoice; it stays Partially paid until settled." checked={draft.partialPayments} onChange={(v) => set({ partialPayments: v })} />
            <ToggleRow label="Automatic collection" description="Charge a saved card on the due date." checked={false} onChange={() => undefined} unavailable="Needs saved cards, which aren't supported yet." />
            <p className="mb-1 mt-4 text-sm font-medium">Reminders</p>
            <ToggleRow label="3 days before the due date" checked={draft.reminders.before3} onChange={(v) => set({ reminders: { ...draft.reminders, before3: v } })} />
            <ToggleRow label="On the due date" checked={draft.reminders.onDue} onChange={(v) => set({ reminders: { ...draft.reminders, onDue: v } })} />
            <ToggleRow label="7 days after the due date" checked={draft.reminders.after7} onChange={(v) => set({ reminders: { ...draft.reminders, after7: v } })} />
          </Section>
          <Section title="Customer emails" description="Emails your customers receive about invoices.">
            {([["created", "Invoice created"], ["sent", "Invoice sent"], ["reminder", "Payment reminder"], ["received", "Payment received"], ["overdue", "Invoice overdue"]] as const).map(([k, l]) => (
              <ToggleRow key={k} label={l} checked={draft.emails[k]} onChange={(v) => set({ emails: { ...draft.emails, [k]: v } })} />
            ))}
          </Section>
          <Section title="Appearance">
            <ToggleRow label="Show logo" description={branding.logo ? "Uses the logo from Branding." : "No logo uploaded yet — your name is shown instead."} checked={draft.showLogo} onChange={(v) => set({ showLogo: v })} />
            <ToggleRow label="Show business address" checked={draft.showAddress} onChange={(v) => set({ showAddress: v })} />
            <ToggleRow label="Show tax number" checked={draft.showTin} onChange={(v) => set({ showTin: v })} />
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Custom fields</p>
              {draft.customFields.map((f, i) => (
                <div key={i} className="flex gap-2">
                  <input className={INPUT} placeholder="Label" value={f.label} onChange={(e) => set({ customFields: draft.customFields.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                  <input className={INPUT} placeholder="Value" value={f.value} onChange={(e) => set({ customFields: draft.customFields.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />
                  <button className="grid h-9 w-9 shrink-0 place-items-center text-muted-foreground hover:text-destructive" aria-label="Remove field" onClick={() => set({ customFields: draft.customFields.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              {draft.customFields.length < 4 && <button className="text-sm font-semibold text-primary hover:underline" onClick={() => set({ customFields: [...draft.customFields, { label: "", value: "" }] })}>+ Add custom field</button>}
            </div>
            <div className="mt-4 max-w-xs">{label("PDF page size", <select className={SELECT} value={draft.pageSize} onChange={(e) => set({ pageSize: e.target.value as "A4" | "Letter" })}><option>A4</option><option>Letter</option></select>)}</div>
          </Section>
        </Editable>
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-2 text-sm font-semibold">Preview</p>
          <div className={cn("rounded-lg border bg-card p-5 text-xs shadow-sm", draft.pageSize === "Letter" ? "aspect-[8.5/11]" : "aspect-[1/1.414]")}>
            <div className="flex items-start justify-between">
              {draft.showLogo && branding.logo ? <img src={branding.logo} alt="" className="h-6 max-w-28 object-contain" /> : <span className="text-sm font-bold">{branding.displayName}</span>}
              <div className="text-right"><p className="font-semibold">Invoice</p><p className="font-mono text-muted-foreground">{invoiceNumberPreview(draft)}</p></div>
            </div>
            {draft.showAddress && <p className="mt-2 text-muted-foreground">14 Admiralty Way, Lekki, Lagos</p>}
            {draft.showTin && <p className="text-muted-foreground">TIN 23849102-0001</p>}
            {draft.customFields.filter((f) => f.label).map((f) => <p key={f.label} className="text-muted-foreground">{f.label}: {f.value}</p>)}
            <p className="mt-3">Terms: {draft.terms}</p>
            <div className="mt-3 space-y-1 border-y py-2"><div className="flex justify-between"><span>Catering — 40 guests</span><span>{formatMoney(180000, draft.currency)}</span></div>
              {draft.taxBehavior !== "none" && <div className="flex justify-between text-muted-foreground"><span>VAT 7.5%{draft.taxBehavior === "inclusive" ? " (included)" : ""}</span><span>{formatMoney(draft.taxBehavior === "inclusive" ? 12558.14 : 13500, draft.currency)}</span></div>}</div>
            <div className="mt-2 flex justify-between font-semibold"><span>Amount due</span><span>{formatMoney(draft.taxBehavior === "exclusive" ? 193500 : 180000, draft.currency)}</span></div>
            {draft.memo && <p className="mt-3 text-muted-foreground">{draft.memo}</p>}
            {draft.hostedPage && <p className="mt-2 font-semibold text-primary">Pay online →</p>}
            <p className="mt-4 text-[10px] text-muted-foreground">{draft.footer}</p>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">New invoices start from these defaults. Existing invoices aren't changed.</p>
        </div>
      </div>
      <SaveBar dirty={dirty} disabled={prefixBad || draft.methods.length === 0} onCancel={reset} onSave={() => { audit("Invoice settings", saved, draft); invoiceSettingsStore.set(draft); toast.success("Invoice settings saved"); }} />
    </SettingsPage>
  );
}

/* ---------- Payment links ---------- */
export function LinkSettingsPage() {
  const saved = linkSettingsStore.use();
  const { draft, set, dirty, reset } = useDraft(saved);
  const [advanced, setAdvanced] = useState(false);
  const urlBad = draft.confirmation === "redirect" && !/^https:\/\/[^\s.]+\.[^\s]+$/.test(draft.redirectUrl);
  const termsBad = !!draft.termsUrl && !/^https?:\/\/[^\s.]+\.[^\s]+$/.test(draft.termsUrl);
  return (
    <SettingsPage slug="payment-links">
      <Editable>
        <Section title="Checkout basics" description="New payment links start with these. You can change any of them on a single link.">
          <div className="grid max-w-md gap-4">{label("Default currency", <select className={SELECT} value={draft.currency} onChange={(e) => set({ currency: e.target.value as Currency })}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>)}</div>
          <div className="mt-4"><ToggleRow label="Collect customer name" checked={draft.collectName} onChange={(v) => set({ collectName: v })} />
            <ToggleRow label="Email a receipt after payment" description="Sent to the email the customer enters at checkout." checked={draft.sendReceipt} onChange={(v) => set({ sendReceipt: v })} /></div>
        </Section>
        <Section title="After payment">
          <ChoiceList name="After payment" value={draft.confirmation} onChange={(v) => set({ confirmation: v })} options={[{ id: "message", label: "Show a confirmation message" }, { id: "redirect", label: "Send customers to your website" }]} />
          <div className="mt-3 max-w-xl">
            {draft.confirmation === "message"
              ? label("Message", <textarea className={`${TEXTAREA} h-20`} value={draft.message} onChange={(e) => set({ message: e.target.value })} />)
              : label("Redirect URL", <input className={cn(INPUT, urlBad && "border-destructive")} placeholder="https://yourbusiness.com/thanks" value={draft.redirectUrl} onChange={(e) => set({ redirectUrl: e.target.value })} />, urlBad ? "Use a full https:// address." : undefined)}
          </div>
        </Section>
        <section className="border-t py-5">
          <button className="flex w-full items-center justify-between text-left" onClick={() => setAdvanced((a) => !a)} aria-expanded={advanced}>
            <span><span className="text-base font-semibold">Advanced options</span><span className="block text-sm text-muted-foreground">Customer details, address, expiry, quantities and promotion codes.</span></span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", advanced && "rotate-180")} />
          </button>
          {advanced && (
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                {label("Email", <select className={SELECT} value={draft.collectEmail} onChange={(e) => set({ collectEmail: e.target.value as "required" | "optional" })}><option value="required">Required</option><option value="optional">Optional</option></select>)}
                {label("Phone number", <select className={SELECT} value={draft.collectPhone} onChange={(e) => set({ collectPhone: e.target.value as typeof draft.collectPhone })}><option value="off">Don't ask</option><option value="optional">Optional</option><option value="required">Required</option></select>)}
                {label("Billing address", <select className={SELECT} value={draft.billingAddress} onChange={(e) => set({ billingAddress: e.target.value as typeof draft.billingAddress })}><option value="off">Don't ask</option><option value="auto">Only when needed</option><option value="required">Always</option></select>)}
              </div>
              <div className="max-w-xs">{label("Links expire after", <select className={SELECT} value={draft.expiryDays ?? "never"} onChange={(e) => set({ expiryDays: e.target.value === "never" ? null : Number(e.target.value) })}><option value="never">Never</option>{[7, 14, 30, 90].map((d) => <option key={d} value={d}>{d} days</option>)}</select>)}</div>
              <ToggleRow label="Let customers change the quantity" checked={draft.allowQuantity} onChange={(v) => set({ allowQuantity: v })} />
              <ToggleRow label="Accept promotion codes" checked={draft.promoCodes} onChange={(v) => set({ promoCodes: v })} />
              <ToggleRow label="Use your branding on checkout" description="Logo and colours from Branding." checked={draft.useBranding} onChange={(v) => set({ useBranding: v })} />
              <div className="max-w-xl">{label("Terms of service URL", <input className={cn(INPUT, termsBad && "border-destructive")} placeholder="Optional" value={draft.termsUrl} onChange={(e) => set({ termsUrl: e.target.value })} />, termsBad ? "Use a full web address." : "Customers must accept these before paying.")}</div>
            </div>
          )}
        </section>
      </Editable>
      <SaveBar dirty={dirty} disabled={urlBad || termsBad} onCancel={reset} onSave={() => { audit("Payment link settings", saved, draft); linkSettingsStore.set(draft); toast.success("Payment link defaults saved", { description: "Existing links keep their own settings." }); }} />
    </SettingsPage>
  );
}

/* ---------- Online store ---------- */
const STORE_TABS = ["general", "orders", "shipping", "policies", "visibility"] as const;
export function StoreSettingsPage() {
  const saved = storeSettingsStore.use();
  const [tab, setTab] = useTab(STORE_TABS, "general");
  const { draft, set, dirty, reset } = useDraft(saved);
  const [zone, setZone] = useState("");
  const slugBad = !/^[a-z0-9-]{3,40}$/.test(draft.slug);
  const pwBad = draft.visibility === "Password protected" && draft.password.length < 6;
  return (
    <SettingsPage slug="online-store">
      <SettingsTabs value={tab} onChange={setTab} tabs={[{ id: "general", label: "Store details" }, { id: "orders", label: "Orders & checkout" }, { id: "shipping", label: "Shipping" }, { id: "policies", label: "Returns & refunds" }, { id: "visibility", label: "Visibility" }]} />
      <Editable className="max-w-3xl">
        {tab === "general" && <div className="grid gap-5 sm:grid-cols-2">
          {label("Store name", <input className={INPUT} value={draft.name} onChange={(e) => set({ name: e.target.value })} />)}
          {label("Store URL", <span className="flex items-center rounded-lg border border-input bg-card pl-3 text-sm"><span className="text-muted-foreground">griv.shop/</span><input className={cn("h-9 flex-1 bg-transparent px-1 outline-none", slugBad && "text-destructive")} value={draft.slug} onChange={(e) => set({ slug: e.target.value.toLowerCase() })} /></span>, slugBad ? "3–40 lowercase letters, numbers or dashes." : undefined)}
          <div className="sm:col-span-2">{label("Description", <textarea className={TEXTAREA} value={draft.description} onChange={(e) => set({ description: e.target.value })} />)}</div>
          {label("Contact email", <input type="email" className={INPUT} value={draft.email} onChange={(e) => set({ email: e.target.value })} />)}
          {label("Contact phone", <input className={INPUT} value={draft.phone} onChange={(e) => set({ phone: e.target.value })} />)}
          {label("Store currency", <select className={SELECT} value={draft.currency} onChange={(e) => set({ currency: e.target.value as Currency })}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>)}
          <p className="self-end text-xs text-muted-foreground sm:col-span-1">Your store logo comes from Branding.</p>
        </div>}
        {tab === "orders" && <div>
          <ToggleRow label="Email me about new orders" checked={draft.orderEmail} onChange={(v) => set({ orderEmail: v })} />
          <ToggleRow label="Text me about new orders" checked={draft.orderSms} onChange={(v) => set({ orderSms: v })} />
          <ToggleRow label="Allow guest checkout" description="Customers can order without creating an account." checked={draft.guestCheckout} onChange={(v) => set({ guestCheckout: v })} />
          <ToggleRow label="Let customers add order notes" checked={draft.notesAtCheckout} onChange={(v) => set({ notesAtCheckout: v })} />
          <div className="mt-4 max-w-xs">{label("Minimum order", <input type="number" min={0} className={INPUT} value={draft.minOrder} onChange={(e) => set({ minOrder: Math.max(0, Number(e.target.value)) })} />, formatMoney(draft.minOrder, draft.currency))}</div>
        </div>}
        {tab === "shipping" && <div>
          <ToggleRow label="In-store pickup" checked={draft.pickup} onChange={(v) => set({ pickup: v })} />
          <ToggleRow label="Local delivery" checked={draft.delivery} onChange={(v) => set({ delivery: v })} />
          {!draft.pickup && !draft.delivery && <p className="mt-2 text-xs text-destructive">Turn on at least one way for customers to get their order.</p>}
          {draft.delivery && <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {label("Flat delivery fee", <input type="number" min={0} className={INPUT} value={draft.flatRate} onChange={(e) => set({ flatRate: Math.max(0, Number(e.target.value)) })} />)}
              {label("Free delivery over", <input type="number" min={0} className={INPUT} placeholder="Never free" value={draft.freeOver ?? ""} onChange={(e) => set({ freeOver: e.target.value === "" ? null : Number(e.target.value) })} />)}
            </div>
            <div><p className="mb-2 text-sm font-medium">Delivery areas</p>
              <div className="flex flex-wrap gap-2">{draft.zones.map((z) => <span key={z} className="flex items-center gap-1 rounded-full border px-3 py-1 text-xs">{z}<button aria-label={`Remove ${z}`} onClick={() => set({ zones: draft.zones.filter((x) => x !== z) })} className="text-muted-foreground hover:text-destructive">×</button></span>)}</div>
              <form className="mt-2 flex max-w-sm gap-2" onSubmit={(e) => { e.preventDefault(); const z = zone.trim(); if (z && !draft.zones.includes(z)) set({ zones: [...draft.zones, z] }); setZone(""); }}><input className={INPUT} placeholder="Add an area" value={zone} onChange={(e) => setZone(e.target.value)} /><button className="btn btn-outline h-9 text-sm">Add</button></form></div>
          </div>}
        </div>}
        {tab === "policies" && <div className="space-y-4">
          <div className="max-w-xs">{label("Return window (days)", <input type="number" min={0} max={90} className={INPUT} value={draft.returnDays} onChange={(e) => set({ returnDays: Math.max(0, Number(e.target.value)) })} />, draft.returnDays === 0 ? "No returns" : undefined)}</div>
          {label("Return and refund policy", <textarea className={`${TEXTAREA} h-32`} value={draft.refundPolicy} onChange={(e) => set({ refundPolicy: e.target.value })} />, "Shown at checkout and on order confirmations.")}
        </div>}
        {tab === "visibility" && <div className="space-y-4">
          <ChoiceList name="Visibility" value={draft.visibility} onChange={(v) => set({ visibility: v })} options={[
            { id: "Live", label: "Live", description: "Anyone with the link can browse and order." },
            { id: "Password protected", label: "Password protected", description: "Only people with the password can see the store." },
            { id: "Offline", label: "Offline", description: "Visitors see a “we'll be back soon” page. Orders are paused." },
          ]} />
          {draft.visibility === "Password protected" && <div className="max-w-xs">{label("Store password", <input type="text" className={cn(INPUT, pwBad && "border-destructive")} value={draft.password} onChange={(e) => set({ password: e.target.value })} />, pwBad ? "At least 6 characters." : undefined)}</div>}
        </div>}
      </Editable>
      <SaveBar dirty={dirty} disabled={slugBad || pwBad || (!draft.pickup && !draft.delivery)} onCancel={reset} onSave={() => { audit("Online store settings", saved, draft); storeSettingsStore.set(draft); toast.success("Store settings saved"); }} />
    </SettingsPage>
  );
}

/* ---------- POS ---------- */
export function PosSettingsPage() {
  const locations = posLocationsStore.use();
  const devices = posDevicesStore.use();
  const members = useMembers();
  const saved = posSettingsStore.use();
  const canEdit = useCanEdit();
  const { draft, set, dirty, reset } = useDraft(saved);
  const [loc, setLoc] = useState<null | { id?: string; name: string; address: string }>(null);
  const [dev, setDev] = useState<null | { id?: string; name: string; serial: string; locationId: string; assignedTo: string }>(null);
  const [delLoc, setDelLoc] = useState<PosLocation | null>(null);
  const locName = (id: string) => locations.find((l) => l.id === id)?.name ?? "—";
  const devCols: Column<PosDevice>[] = [
    { key: "name", header: "Device", cell: (d) => <span className="font-medium">{d.name}<span className="block font-mono text-xs font-normal text-muted-foreground">{d.serial}</span></span> },
    { key: "loc", header: "Location", cell: (d) => locName(d.locationId) },
    { key: "who", header: "Assigned to", cell: (d) => d.assignedTo, hideBelow: "md" },
    { key: "status", header: "Status", cell: (d) => <StatusBadge status={d.status} tone={d.status === "Online" ? "success" : d.status === "Offline" ? "neutral" : "pending"} /> },
    { key: "seen", header: "Last seen", cell: (d) => <span className="text-muted-foreground">{d.lastSeen ? fmtDateTime(d.lastSeen) : "Never"}</span>, hideBelow: "lg" },
  ];
  return (
    <SettingsPage slug="pos" wide>
      <Section title="Locations" description="Where you sell in person. Devices and staff belong to a location."
        action={canEdit ? <button className="btn btn-outline h-8 px-3 text-xs" onClick={() => setLoc({ name: "", address: "" })}><Plus className="h-3.5 w-3.5" />Add location</button> : undefined}>
        <div className="overflow-x-auto rounded-lg border"><table className="w-full text-sm">
          <thead><tr className="border-b bg-muted/40 text-left text-xs font-semibold tracking-[0.08em] text-muted-foreground"><th className="px-4 py-2.5">Location</th><th className="hidden px-4 py-2.5 md:table-cell">Address</th><th className="px-4 py-2.5">Devices</th><th className="w-10" /></tr></thead>
          <tbody className="divide-y">{locations.map((l) => (
            <tr key={l.id}><td className="px-4 py-3 font-medium">{l.name}</td><td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{l.address}</td><td className="px-4 py-3 tnum">{devices.filter((d) => d.locationId === l.id).length}</td>
              <td className="px-2">{canEdit && <RowMenu items={[{ label: "Edit location", onSelect: () => setLoc({ id: l.id, name: l.name, address: l.address }) }, { label: "Remove location", danger: true, separatorBefore: true, disabled: devices.some((d) => d.locationId === l.id) ? "Move or remove its devices first" : false, onSelect: () => setDelLoc(l) }]} />}</td></tr>
          ))}</tbody></table></div>
      </Section>
      <Section title="Devices" description="Card terminals and tills that take payments."
        action={canEdit && locations.length ? <button className="btn btn-outline h-8 px-3 text-xs" onClick={() => setDev({ name: "", serial: "", locationId: locations[0]!.id, assignedTo: "Unassigned" })}><Plus className="h-3.5 w-3.5" />Register device</button> : undefined}>
        <div className="panel overflow-hidden">
          <DataTable columns={devCols} rows={devices} rowKey={(d) => d.id} headerTone="plain"
            rowActions={(d) => canEdit ? <RowMenu items={[
              { label: "Change assignment", onSelect: () => setDev({ id: d.id, name: d.name, serial: d.serial, locationId: d.locationId, assignedTo: d.assignedTo }) },
              { label: "Remove device", danger: true, separatorBefore: true, onSelect: () => { posDevicesStore.set((all) => all.filter((x) => x.id !== d.id)); logAudit("POS device removed", "POS settings", d.name); toast.success("Device removed"); } },
            ]} /> : null}
            empty={<EmptyState icon={Monitor} title="No POS devices yet" description="Register a Griv terminal to take card payments in person. You can still record cash sales on the POS page." action={canEdit && locations.length ? <button className="btn btn-primary h-9 text-sm" onClick={() => setDev({ name: "", serial: "", locationId: locations[0]!.id, assignedTo: "Unassigned" })}>Register device</button> : undefined} />} />
        </div>
      </Section>
      <Editable>
        <Section title="Receipts and transactions">
          <div className="grid max-w-xl gap-4 sm:grid-cols-2">
            {label("Default currency", <select className={SELECT} value={draft.currency} onChange={(e) => set({ currency: e.target.value as Currency })}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>)}
            {label("Print receipts", <select className={SELECT} value={draft.printReceipt} onChange={(e) => set({ printReceipt: e.target.value as typeof draft.printReceipt })}><option value="always">Always</option><option value="ask">Ask each time</option><option value="never">Never</option></select>)}
          </div>
          <div className="mt-4 max-w-xl">{label("Receipt message", <input className={INPUT} value={draft.receiptMessage} onChange={(e) => set({ receiptMessage: e.target.value })} />)}</div>
          <ToggleRow label="Offer email receipts" checked={draft.emailReceipt} onChange={(v) => set({ emailReceipt: v })} />
          <ToggleRow label="Notify me about every POS sale" checked={draft.notifyEach} onChange={(v) => set({ notifyEach: v })} />
          <ToggleRow label="Send a daily sales summary" checked={draft.dailySummary} onChange={(v) => set({ dailySummary: v })} />
        </Section>
        <Section title="Staff access">
          <ToggleRow label="Require a staff PIN to unlock the till" checked={draft.pinLock} onChange={(v) => set({ pinLock: v })} />
          <ToggleRow label="Staff can apply discounts" checked={draft.staffDiscounts} onChange={(v) => set({ staffDiscounts: v })} />
          <ToggleRow label="Staff can issue refunds" description="Refunds still go through the payment provider and stay pending until it confirms." checked={draft.staffRefunds} onChange={(v) => set({ staffRefunds: v })} />
        </Section>
      </Editable>
      <SaveBar dirty={dirty} onCancel={reset} onSave={() => { audit("POS settings", saved, draft); posSettingsStore.set(draft); toast.success("POS settings saved"); }} />
      <FormDialog open={!!loc} onOpenChange={(o) => !o && setLoc(null)} title={loc?.id ? "Edit location" : "Add location"}
        footer={<><button className="btn btn-outline h-9 text-sm" onClick={() => setLoc(null)}>Cancel</button><button className="btn btn-primary h-9 text-sm" onClick={() => {
          if (!loc) return;
          if (!loc.name.trim() || !loc.address.trim()) { toast.error("Enter a name and address."); return; }
          if (loc.id) posLocationsStore.set((all) => all.map((l) => (l.id === loc.id ? { ...l, name: loc.name.trim(), address: loc.address.trim() } : l)));
          else posLocationsStore.set((all) => [...all, { id: `loc_${Date.now().toString(36)}`, name: loc.name.trim(), address: loc.address.trim(), staff: 0 }]);
          logAudit(loc.id ? "POS location updated" : "POS location added", "POS settings", loc.name.trim()); toast.success("Location saved"); setLoc(null);
        }}>Save</button></>}>
        {loc && <div className="space-y-4">{label("Name", <input autoFocus className={INPUT} value={loc.name} onChange={(e) => setLoc({ ...loc, name: e.target.value })} />)}{label("Address", <input className={INPUT} value={loc.address} onChange={(e) => setLoc({ ...loc, address: e.target.value })} />)}</div>}
      </FormDialog>
      <FormDialog open={!!dev} onOpenChange={(o) => !o && setDev(null)} title={dev?.id ? "Change assignment" : "Register device"} description={dev?.id ? undefined : "Enter the serial number on the back of the terminal."}
        footer={<><button className="btn btn-outline h-9 text-sm" onClick={() => setDev(null)}>Cancel</button><button className="btn btn-primary h-9 text-sm" onClick={() => {
          if (!dev) return;
          if (dev.id) { posDevicesStore.set((all) => all.map((d) => (d.id === dev.id ? { ...d, locationId: dev.locationId, assignedTo: dev.assignedTo } : d))); logAudit("POS device reassigned", "POS settings", dev.name, { after: { Location: locName(dev.locationId), "Assigned to": dev.assignedTo } }); toast.success("Device updated"); }
          else {
            if (!dev.name.trim() || !/^GRV-[A-Z0-9]{2}-\d{5}$/.test(dev.serial.trim().toUpperCase())) { toast.error("Enter a name and a serial like GRV-P1-12345."); return; }
            posDevicesStore.set((all) => [...all, { id: `dev_${Date.now().toString(36)}`, name: dev.name.trim(), serial: dev.serial.trim().toUpperCase(), locationId: dev.locationId, assignedTo: dev.assignedTo, status: "Pending pairing", lastSeen: null }]);
            logAudit("POS device registered", "POS settings", dev.name.trim(), { result: "Pending review" });
            toast.success("Device added — waiting for pairing", { description: "It goes online once the terminal itself connects. No terminal is connected in this demo." });
          }
          setDev(null);
        }}>{dev?.id ? "Save" : "Register"}</button></>}>
        {dev && <div className="space-y-4">
          {!dev.id && label("Device name", <input autoFocus className={INPUT} value={dev.name} onChange={(e) => setDev({ ...dev, name: e.target.value })} placeholder="e.g. Back counter" />)}
          {!dev.id && label("Serial number", <input className={`${INPUT} font-mono uppercase`} value={dev.serial} onChange={(e) => setDev({ ...dev, serial: e.target.value })} placeholder="GRV-P1-12345" />)}
          {label("Location", <select className={SELECT} value={dev.locationId} onChange={(e) => setDev({ ...dev, locationId: e.target.value })}>{locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select>)}
          {label("Assigned to", <select className={SELECT} value={dev.assignedTo} onChange={(e) => setDev({ ...dev, assignedTo: e.target.value })}><option>Unassigned</option>{members.filter((m) => m.status === "Active").map((m) => <option key={m.id}>{m.name}</option>)}</select>)}
        </div>}
      </FormDialog>
      <ConfirmDialog open={!!delLoc} onOpenChange={(o) => !o && setDelLoc(null)} danger confirmLabel="Remove" title={`Remove ${delLoc?.name}?`} onConfirm={() => { if (!delLoc) return; posLocationsStore.set((all) => all.filter((l) => l.id !== delLoc.id)); logAudit("POS location removed", "POS settings", delLoc.name); toast.success("Location removed"); setDelLoc(null); }} />
    </SettingsPage>
  );
}

/* ---------- Inventory ---------- */
export function InventorySettingsPage() {
  const saved = inventorySettingsStore.use();
  const { draft, set, dirty, reset } = useDraft(saved);
  return (
    <SettingsPage slug="inventory">
      <Editable>
        <Section title="Tracking">
          <ToggleRow label="Track inventory" description="Stock goes down with every sale from POS, the online store and orders." checked={draft.tracking} onChange={(v) => set({ tracking: v })} />
          {!draft.tracking && <div className="mt-3"><Callout tone="warning">With tracking off, products never show as low or out of stock and can be oversold.</Callout></div>}
          <ToggleRow label="Keep a stock movement history" description="Every change records who made it, when and why." checked={draft.movementHistory} onChange={(v) => set({ movementHistory: v })} />
          <ToggleRow label="Track stock per location" checked={false} onChange={() => undefined} unavailable="Inventory is tracked for the whole business today. Per-location stock isn't available yet." />
        </Section>
        <Section title="Low stock">
          <div className="max-w-xs">{label("Default low-stock threshold", <input type="number" min={0} className={INPUT} value={draft.threshold} onChange={(e) => set({ threshold: Math.max(0, Number(e.target.value)) })} />, "Products can override this. Applies to products without their own threshold.")}</div>
          <ToggleRow label="Email me when stock is low" checked={draft.lowEmail} onChange={(v) => set({ lowEmail: v })} />
          <ToggleRow label="Show low-stock alerts in the dashboard" checked={draft.lowInApp} onChange={(v) => set({ lowInApp: v })} />
        </Section>
        <Section title="When a product runs out">
          <ChoiceList name="Out of stock" value={draft.outOfStock} onChange={(v) => set({ outOfStock: v })} options={[
            { id: "show_sold_out", label: "Show as sold out", description: "Visible on your store but can't be bought." },
            { id: "hide", label: "Hide from the store", description: "Comes back automatically when restocked." },
            { id: "allow_backorder", label: "Keep selling (backorder)", description: "Customers can still order; stock goes negative until restocked." },
          ]} />
        </Section>
        <Section title="Stock adjustments" description="Who can change stock counts by hand.">
          <RolePicker value={draft.adjustRoles} onChange={(v) => set({ adjustRoles: v })} />
          <ToggleRow label="Require a reason for every adjustment" checked={draft.requireReason} onChange={(v) => set({ requireReason: v })} />
        </Section>
      </Editable>
      <SaveBar dirty={dirty} onCancel={reset} onSave={() => { audit("Inventory settings", saved, draft); inventorySettingsStore.set(draft); toast.success("Inventory settings saved"); }} />
    </SettingsPage>
  );
}

/* ---------- Customers ---------- */
export function CustomerSettingsPage() {
  const saved = customerSettingsStore.use();
  const { draft, set, dirty, reset } = useDraft(saved);
  const emailBad = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.supportEmail);
  return (
    <SettingsPage slug="customers">
      <div className="mb-6"><Callout>These settings control what <strong>your customers</strong> receive and how their records are kept. Alerts you get yourself are in Communication preferences.</Callout></div>
      <Editable>
        <Section title="Customer records">
          <ToggleRow label="Require an email address" checked={draft.requireEmail} onChange={(v) => set({ requireEmail: v })} />
          <ToggleRow label="Require a phone number" checked={draft.requirePhone} onChange={(v) => set({ requirePhone: v })} />
          {!draft.requireEmail && !draft.requirePhone && <p className="mb-2 text-xs text-destructive">Require at least email or phone so you can reach customers.</p>}
          <ToggleRow label="Save delivery addresses" checked={draft.collectAddress} onChange={(v) => set({ collectAddress: v })} />
          <div className="mt-4 max-w-sm">{label("Match returning customers by", <select className={SELECT} value={draft.dedupeBy} onChange={(e) => set({ dedupeBy: e.target.value as typeof draft.dedupeBy })}><option value="email">Email</option><option value="phone">Phone number</option><option value="email_or_phone">Email or phone</option></select>)}</div>
          <p className="mb-2 mt-4 text-sm font-medium">Extra identification fields</p>
          <div className="flex flex-wrap gap-2">{ID_FIELDS.map((f) => (
            <label key={f} className={cn("flex cursor-pointer items-center rounded-full border px-3 py-1 text-xs", draft.idFields.includes(f) && "border-primary bg-primary/5 text-primary")}><input type="checkbox" className="sr-only" checked={draft.idFields.includes(f)} onChange={() => set({ idFields: draft.idFields.includes(f) ? draft.idFields.filter((x) => x !== f) : [...draft.idFields, f] })} />{f}</label>
          ))}</div>
        </Section>
        <Section title="Customer communication" description="Messages sent to customers automatically.">
          <ToggleRow label="Email receipts after payment" checked={draft.receiptEmail} onChange={(v) => set({ receiptEmail: v })} />
          <ToggleRow label="SMS receipts after payment" description="Charged per message at your SMS rate." checked={draft.receiptSms} onChange={(v) => set({ receiptSms: v })} />
          <ToggleRow label="Invoice reminders" description="Timing is set in Invoice settings." checked={draft.invoiceReminders} onChange={(v) => set({ invoiceReminders: v })} />
          <ToggleRow label="Refund updates" checked={draft.refundEmails} onChange={(v) => set({ refundEmails: v })} />
          <ToggleRow label="Ask for marketing consent at checkout" checked={draft.marketingConsent} onChange={(v) => set({ marketingConsent: v })} />
        </Section>
        <Section title="Customer data access" description="Owners always have access.">
          <p className="mb-2 text-sm font-medium">Can export customer lists</p><RolePicker value={draft.exportRoles} onChange={(v) => set({ exportRoles: v })} />
          <p className="mb-2 mt-4 text-sm font-medium">Can delete customer records</p><RolePicker value={draft.deleteRoles} onChange={(v) => set({ deleteRoles: v })} />
        </Section>
        <Section title="Support details shown to customers">
          <div className="grid gap-4 sm:grid-cols-3">
            {label("Support email", <input className={cn(INPUT, emailBad && "border-destructive")} value={draft.supportEmail} onChange={(e) => set({ supportEmail: e.target.value })} />)}
            {label("Support phone", <input className={INPUT} value={draft.supportPhone} onChange={(e) => set({ supportPhone: e.target.value })} />)}
            {label("Support hours", <input className={INPUT} value={draft.supportHours} onChange={(e) => set({ supportHours: e.target.value })} />)}
          </div>
        </Section>
      </Editable>
      <SaveBar dirty={dirty} disabled={emailBad || (!draft.requireEmail && !draft.requirePhone)} onCancel={reset} onSave={() => { audit("Customer settings", saved, draft); customerSettingsStore.set(draft); toast.success("Customer settings saved"); }} />
    </SettingsPage>
  );
}
