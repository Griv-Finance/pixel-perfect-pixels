import { useRef, useState } from "react";
import { ImagePlus, Lock, X } from "lucide-react";
import { toast } from "sonner";
import { brandingStore, HEX, readableOn, type Branding } from "@/lib/demo/settings/business";
import { diffFields, logAudit } from "@/lib/demo/settings/activity";
import { Editable, INPUT, SaveBar, SettingsPage, TEXTAREA, useDraft } from "../ui";
import { cn } from "@/lib/utils";

const PREVIEWS = ["Checkout", "Payment link", "Invoice", "Receipt"] as const;
type Preview = (typeof PREVIEWS)[number];
const LOGO_TYPES = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];

function LogoInput({ label, hint, value, onChange, square }: { label: string; hint: string; value: string | null; onChange: (v: string | null) => void; square?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const pick = (f: File | undefined) => {
    if (!f) return;
    if (!LOGO_TYPES.includes(f.type)) return setError("Use a PNG, JPG, SVG or WebP image.");
    if (f.size > 2 * 1024 * 1024) return setError("Images must be 2 MB or smaller.");
    setError(null);
    const r = new FileReader();
    r.onload = () => onChange(String(r.result));
    r.readAsDataURL(f);
  };
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <p className="mb-2 text-xs text-muted-foreground">{hint}</p>
      <div className="flex items-center gap-3">
        <div className={cn("grid place-items-center overflow-hidden rounded-lg border border-dashed bg-muted/40", square ? "h-14 w-14" : "h-14 w-36")}>
          {value ? <img src={value} alt={`${label} preview`} className="h-full w-full object-contain p-1" /> : <ImagePlus className="h-5 w-5 text-muted-foreground" />}
        </div>
        <button type="button" className="btn btn-outline h-8 px-3 text-xs" onClick={() => ref.current?.click()}>{value ? "Replace" : "Upload"}</button>
        {value && <button type="button" className="text-xs font-semibold text-muted-foreground hover:text-destructive" onClick={() => onChange(null)}>Remove</button>}
        <input ref={ref} type="file" accept={LOGO_TYPES.join(",")} className="hidden" aria-label={`Upload ${label}`} onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
      </div>
      {error && <p className="mt-1 text-xs font-medium text-destructive" role="alert">{error}</p>}
    </div>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const valid = HEX.test(value);
  return (
    <label className="block text-sm font-medium">{label}
      <span className="mt-1.5 flex items-center gap-2">
        <input type="color" value={valid ? value : "#000000"} onChange={(e) => onChange(e.target.value)} className="h-9 w-10 cursor-pointer rounded border bg-card p-0.5" aria-label={`${label} picker`} />
        <input className={cn(INPUT, "font-mono uppercase", !valid && "border-destructive")} value={value} onChange={(e) => onChange(e.target.value)} maxLength={7} />
      </span>
      {!valid && <span className="mt-1 block text-xs text-destructive">Use a hex colour like #F76905.</span>}
    </label>
  );
}

/** Customer-facing previews. Deliberately NOT the dashboard look: neutral page, merchant's own colours and logo. */
function CustomerPreview({ b, kind }: { b: Branding; kind: Preview }) {
  const brand = HEX.test(b.brandColor) ? b.brandColor : "#f76905";
  const on = readableOn(brand);
  const accent = HEX.test(b.accentColor) ? b.accentColor : "#291107";
  const logo = b.logo ? <img src={b.logo} alt="" className="h-7 max-w-32 object-contain" /> : <span className="text-base font-bold" style={{ color: accent }}>{b.displayName || "Your business"}</span>;
  const square = b.squareLogo ? <img src={b.squareLogo} alt="" className="h-10 w-10 rounded-md object-cover" /> : <span className="grid h-10 w-10 place-items-center rounded-md text-sm font-bold" style={{ background: brand, color: on }}>{(b.displayName || "Y")[0]}</span>;
  const shell = "rounded-xl bg-[#f5f5f4] p-4 font-[system-ui] text-[#1c1917]";
  if (kind === "Invoice") return (
    <div className={shell}><div className="rounded-lg bg-white p-5 text-xs shadow-sm">
      <div className="flex items-start justify-between">{logo}<div className="text-right"><p className="text-sm font-semibold">Invoice</p><p className="text-[#78716c]">GRV-INV-01043</p></div></div>
      <div className="mt-4 h-1 rounded" style={{ background: brand }} />
      <div className="mt-4 space-y-1.5"><div className="flex justify-between"><span>Groceries bundle × 2</span><span>₦24,000.00</span></div><div className="flex justify-between"><span>Delivery</span><span>₦1,500.00</span></div>
        <div className="flex justify-between border-t pt-1.5 font-semibold"><span>Amount due</span><span>₦25,500.00</span></div></div>
      <button className="mt-4 w-full rounded-md py-2 text-xs font-semibold" style={{ background: brand, color: on }}>Pay ₦25,500.00</button>
      <p className="mt-4 text-[10px] text-[#78716c]">{b.invoiceFooter}</p><p className="mt-1 text-[10px] text-[#78716c]">{b.supportContact}</p>
    </div></div>
  );
  if (kind === "Receipt") return (
    <div className={shell}><div className="mx-auto max-w-[260px] rounded-lg bg-white p-5 text-center text-xs shadow-sm">
      <div className="flex justify-center">{square}</div><p className="mt-2 text-sm font-semibold">{b.displayName || "Your business"}</p>
      <p className="mt-3 text-[#78716c]">Payment received</p><p className="text-xl font-bold" style={{ color: accent }}>₦12,500.00</p>
      <div className="mt-3 space-y-1 border-y border-dashed py-3 text-left"><div className="flex justify-between"><span>Ref</span><span>GRV-REF-3H7P</span></div><div className="flex justify-between"><span>Method</span><span>Bank transfer</span></div></div>
      <p className="mt-3 text-[10px] text-[#78716c]">{b.receiptFooter}</p>
    </div></div>
  );
  return (
    <div className={shell}><div className="rounded-lg bg-white p-5 text-xs shadow-sm">
      <div className="flex items-center gap-3">{kind === "Payment link" ? square : logo}{kind === "Payment link" && <div><p className="text-sm font-semibold">{b.displayName || "Your business"}</p><p className="text-[#78716c]">Weekly veg box</p></div>}</div>
      <p className="mt-3 text-[#78716c]">{b.customerDescription}</p>
      <p className="mt-4 text-2xl font-bold">₦8,000.00</p>
      <div className="mt-4 space-y-2">
        <div className="rounded-md border px-3 py-2 text-[#a8a29e]">Email address</div>
        <div className="flex gap-2">{["Card", "Transfer", "USSD"].map((m, i) => <span key={m} className="flex-1 rounded-md border px-2 py-1.5 text-center" style={i === 0 ? { borderColor: brand, color: accent } : undefined}>{m}</span>)}</div>
      </div>
      <button className="mt-4 w-full rounded-md py-2 text-xs font-semibold" style={{ background: brand, color: on }}>Pay ₦8,000.00</button>
      <p className="mt-3 flex items-center justify-center gap-1 text-[10px] text-[#a8a29e]"><Lock className="h-2.5 w-2.5" />Secured by Griv · {b.supportContact}</p>
    </div></div>
  );
}

export function BrandingPage() {
  const saved = brandingStore.use();
  const { draft, set, dirty, reset } = useDraft(saved);
  const [preview, setPreview] = useState<Preview>("Checkout");
  const invalid = !HEX.test(draft.brandColor) || !HEX.test(draft.accentColor) || !draft.displayName.trim();

  return (
    <SettingsPage slug="branding" wide>
      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <Editable className="space-y-7">
          <div className="grid gap-6 sm:grid-cols-2">
            <LogoInput label="Business logo" hint="Wide logo for invoices and checkout. PNG, JPG, SVG or WebP, up to 2 MB." value={draft.logo} onChange={(v) => set({ logo: v })} />
            <LogoInput label="Square logo" hint="Icon for payment links, receipts and the mobile checkout." value={draft.squareLogo} onChange={(v) => set({ squareLogo: v })} square />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <ColorInput label="Brand colour" value={draft.brandColor} onChange={(v) => set({ brandColor: v })} />
            <ColorInput label="Accent colour" value={draft.accentColor} onChange={(v) => set({ accentColor: v })} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium">Business display name<input className={cn(INPUT, "mt-1.5", !draft.displayName.trim() && "border-destructive")} value={draft.displayName} onChange={(e) => set({ displayName: e.target.value })} /></label>
            <label className="block text-sm font-medium">Support contact<input className={`${INPUT} mt-1.5`} value={draft.supportContact} onChange={(e) => set({ supportContact: e.target.value })} /></label>
          </div>
          <label className="block text-sm font-medium">Customer-facing description<textarea className={`${TEXTAREA} mt-1.5 h-20`} maxLength={160} value={draft.customerDescription} onChange={(e) => set({ customerDescription: e.target.value })} /><span className="mt-1 block text-right text-xs font-normal text-muted-foreground">{draft.customerDescription.length}/160</span></label>
          <label className="block text-sm font-medium">Receipt footer<textarea className={`${TEXTAREA} mt-1.5 h-20`} value={draft.receiptFooter} onChange={(e) => set({ receiptFooter: e.target.value })} /></label>
          <label className="block text-sm font-medium">Invoice footer<textarea className={`${TEXTAREA} mt-1.5 h-20`} value={draft.invoiceFooter} onChange={(e) => set({ invoiceFooter: e.target.value })} /></label>
        </Editable>
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">Preview</p>
            {dirty && <span className="text-xs text-muted-foreground">Unsaved — customers still see the saved version</span>}
          </div>
          <div role="tablist" className="mb-3 flex gap-1 rounded-lg bg-muted p-1">
            {PREVIEWS.map((p) => (
              <button key={p} role="tab" aria-selected={preview === p} onClick={() => setPreview(p)} className={cn("flex-1 rounded-md px-2 py-1.5 text-xs font-medium", preview === p ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground")}>{p}</button>
            ))}
          </div>
          <CustomerPreview b={draft} kind={preview} />
          {draft.logo === null && saved.logo === null && <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><X className="h-3 w-3" />No logo yet — your display name is shown instead.</p>}
        </div>
      </div>
      <SaveBar dirty={dirty} disabled={invalid} onCancel={reset} message="Branding changes are only a preview until you save"
        onSave={() => {
          const d = diffFields(saved, draft, { logo: "Logo", squareLogo: "Square logo", brandColor: "Brand colour", accentColor: "Accent colour", displayName: "Display name", supportContact: "Support contact", customerDescription: "Description", receiptFooter: "Receipt footer", invoiceFooter: "Invoice footer" });
          brandingStore.set(draft);
          logAudit("Branding updated", "Branding", d.changed.join(", "), { before: Object.fromEntries(Object.entries(d.before).map(([k, v]) => [k, v.startsWith("data:") ? "Image" : v])), after: Object.fromEntries(Object.entries(d.after).map(([k, v]) => [k, v.startsWith("data:") ? "New image" : v])) });
          toast.success("Branding published to your customer pages");
        }} />
    </SettingsPage>
  );
}
