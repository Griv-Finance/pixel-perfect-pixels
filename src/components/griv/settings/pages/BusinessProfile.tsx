import { useState } from "react";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import { CURRENCIES } from "@/lib/money";
import {
  businessStore, pendingProfileStore, PUBLIC_SURFACES, splitVerifiedChanges, type BusinessProfile,
} from "@/lib/demo/settings/business";
import { diffFields, logAudit } from "@/lib/demo/settings/activity";
import { fmtDateTime } from "@/lib/dates";
import { Callout, Editable, Hint, INPUT, SaveBar, SELECT, SettingsPage, SettingsTabs, TEXTAREA, useDraft, useTab } from "../ui";
import { cn } from "@/lib/utils";

const TABS = ["general", "address", "registration", "public", "contacts"] as const;
const LABELS: Partial<Record<keyof BusinessProfile, string>> = {
  legalName: "Legal business name", tradingName: "Trading name", businessType: "Business type", industry: "Industry", description: "Business description",
  website: "Website", supportEmail: "Support email", supportPhone: "Support phone", defaultCurrency: "Default currency", country: "Country", state: "State", city: "City",
  line1: "Address line 1", line2: "Address line 2", postalCode: "Postal code", regNumber: "Registration number", regAuthority: "Registration authority",
  regDate: "Registration date", tin: "Tax identification number", entityType: "Legal entity type", publicName: "Public business name",
  showAddressOn: "Address shown on", showPhoneOn: "Phone shown on", showEmailOn: "Email shown on", contacts: "Business contacts",
};
const BUSINESS_TYPES = ["Sole proprietorship", "Partnership", "Limited liability company", "Public limited company", "Non-profit / NGO"];
const INDUSTRIES = ["Retail & e-commerce", "Food & beverage", "Logistics", "Professional services", "Education", "Healthcare", "Hospitality", "Software & technology"];
const STATES = ["Abuja (FCT)", "Lagos", "Ogun", "Oyo", "Rivers", "Kano", "Enugu", "Kaduna", "Delta", "Anambra"];

function validate(p: BusinessProfile) {
  const e: Partial<Record<keyof BusinessProfile, string>> = {};
  if (!p.legalName.trim()) e.legalName = "Enter your registered business name.";
  if (p.website && !/^https?:\/\/[^\s.]+\.[^\s]+$/.test(p.website)) e.website = "Use a full address, like https://yourbusiness.com.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.supportEmail)) e.supportEmail = "Enter a valid email address.";
  if (!/^\+?[\d\s()-]{7,20}$/.test(p.supportPhone)) e.supportPhone = "Enter a phone number with country code.";
  if (!p.line1.trim()) e.line1 = "Enter the street address.";
  if (!p.city.trim()) e.city = "Enter the city.";
  if (!p.regNumber.trim()) e.regNumber = "Enter the registration number.";
  if (p.tin && !/^\d{8}-\d{4}$/.test(p.tin)) e.tin = "Nigerian TINs look like 12345678-0001.";
  if (!p.publicName.trim()) e.publicName = "Customers need a name to recognise you.";
  return e;
}

export function BusinessProfilePage() {
  const saved = businessStore.use();
  const pending = pendingProfileStore.use();
  const [tab, setTab] = useTab(TABS, "general");
  const { draft, set, dirty, reset } = useDraft(saved);
  const errors = validate(draft);
  const [touched, setTouched] = useState(false);
  const err = (k: keyof BusinessProfile) => (touched ? errors[k] : undefined);

  const save = () => {
    setTouched(true);
    if (Object.keys(errors).length) return { error: "Fix the highlighted fields first." };
    const { direct, review } = splitVerifiedChanges(saved, draft);
    const d = diffFields(saved, { ...saved, ...direct }, LABELS);
    businessStore.set((p) => ({ ...p, ...direct }));
    if (d.changed.length) logAudit("Business information changed", "Business profile", d.changed.join(", "), { before: d.before, after: d.after });
    if (Object.keys(review).length) {
      const r = diffFields(saved, { ...saved, ...review }, LABELS);
      pendingProfileStore.set({ changes: { ...(pending?.changes ?? {}), ...review }, submittedAt: new Date().toISOString() });
      logAudit("Verified business details submitted for review", "Business profile", r.changed.join(", "), { before: r.before, after: r.after, result: "Pending review" });
      toast.message("Sent for review", { description: "Registered details change only after Griv's compliance team approves them." });
    } else toast.success("Business profile saved");
    setTouched(false);
    return {};
  };

  const field = (k: keyof BusinessProfile, label: string, opts: { type?: string; hint?: string; textarea?: boolean; verified?: boolean } = {}) => (
    <label className="block text-sm font-medium">
      <span className="flex items-center gap-1.5">{label}{opts.verified && <Hint>Checked during verification. Changes go to Griv's compliance team before they take effect.</Hint>}</span>
      {opts.textarea ? (
        <textarea className={cn(TEXTAREA, "mt-1.5", err(k) && "border-destructive")} value={String(draft[k] ?? "")} onChange={(e) => set({ [k]: e.target.value } as Partial<BusinessProfile>)} />
      ) : (
        <input type={opts.type ?? "text"} className={cn(INPUT, "mt-1.5", err(k) && "border-destructive")} value={String(draft[k] ?? "")} onChange={(e) => set({ [k]: e.target.value } as Partial<BusinessProfile>)} />
      )}
      {err(k) ? <span className="mt-1 block text-xs font-medium text-destructive">{err(k)}</span> : opts.hint ? <span className="mt-1 block text-xs font-normal text-muted-foreground">{opts.hint}</span> : null}
    </label>
  );
  const select = (k: keyof BusinessProfile, label: string, options: readonly string[], verified?: boolean) => (
    <label className="block text-sm font-medium">
      <span className="flex items-center gap-1.5">{label}{verified && <Hint>Checked during verification. Changes go to review first.</Hint>}</span>
      <select className={`${SELECT} mt-1.5`} value={String(draft[k])} onChange={(e) => set({ [k]: e.target.value } as Partial<BusinessProfile>)}>{options.map((o) => <option key={o}>{o}</option>)}</select>
    </label>
  );
  const toggleSurface = (k: "showAddressOn" | "showPhoneOn" | "showEmailOn", s: string) =>
    set({ [k]: draft[k].includes(s) ? draft[k].filter((x) => x !== s) : [...draft[k], s] } as Partial<BusinessProfile>);

  return (
    <SettingsPage slug="business-profile">
      {pending && (
        <div className="mb-6"><Callout tone="warning" action={<button className="text-sm font-semibold text-primary hover:underline" onClick={() => { pendingProfileStore.set(null); logAudit("Business detail review withdrawn", "Business profile", Object.keys(pending.changes).map((k) => LABELS[k as keyof BusinessProfile] ?? k).join(", ")); toast.success("Review request withdrawn"); }}>Withdraw</button>}>
          <p className="flex items-center gap-1.5 font-semibold"><Clock className="h-4 w-4" />Changes waiting for review</p>
          <p className="mt-0.5 text-muted-foreground">Submitted {fmtDateTime(pending.submittedAt)}: {Object.entries(pending.changes).map(([k, v]) => `${LABELS[k as keyof BusinessProfile] ?? k} → ${String(v)}`).join("; ")}. Your current details stay in use until approved.</p>
        </Callout></div>
      )}
      <SettingsTabs tabs={[{ id: "general", label: "General information" }, { id: "address", label: "Business address" }, { id: "registration", label: "Registration details" }, { id: "public", label: "Public information" }, { id: "contacts", label: "Business contacts" }]} value={tab} onChange={setTab} />
      <Editable className="max-w-3xl">
        {tab === "general" && (
          <div className="grid gap-5 sm:grid-cols-2">
            {field("legalName", "Legal business name", { verified: true })}
            {field("tradingName", "Trading name", { hint: "The name customers know you by, if different." })}
            {select("businessType", "Business type", BUSINESS_TYPES, true)}
            {select("industry", "Industry", INDUSTRIES)}
            <div className="sm:col-span-2">{field("description", "Business description", { textarea: true, hint: "What you sell and who you sell to. Helps reviewers and appears on your store." })}</div>
            {field("website", "Website", { type: "url" })}
            {select("defaultCurrency", "Default currency", CURRENCIES)}
            {field("supportEmail", "Support email", { type: "email" })}
            {field("supportPhone", "Support phone", { type: "tel" })}
          </div>
        )}
        {tab === "address" && (
          <div className="grid gap-5 sm:grid-cols-2">
            {select("country", "Country", ["Nigeria"])}
            {select("state", "State", STATES)}
            {field("city", "City")}
            {field("postalCode", "Postal code")}
            <div className="sm:col-span-2">{field("line1", "Address line 1")}</div>
            <div className="sm:col-span-2">{field("line2", "Address line 2")}</div>
            <p className="text-xs text-muted-foreground sm:col-span-2">This should match your proof-of-address document in Compliance.</p>
          </div>
        )}
        {tab === "registration" && (
          <div className="space-y-5">
            <Callout>These details were checked when your business was verified. Edits are sent to Griv's compliance team and apply only after approval.</Callout>
            <div className="grid gap-5 sm:grid-cols-2">
              {field("regNumber", "Registration number", { verified: true })}
              {field("regAuthority", "Registration authority", { verified: true })}
              {field("regDate", "Registration date", { type: "date", verified: true })}
              {field("tin", "Tax identification number", { verified: true, hint: "Format 12345678-0001" })}
              <div className="sm:col-span-2">{field("entityType", "Legal entity type", { verified: true })}</div>
            </div>
          </div>
        )}
        {tab === "public" && (
          <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
            <div className="space-y-5">
              {field("publicName", "Public business name", { hint: "Shown on invoices, checkout, receipts and your store." })}
              <div>
                <p className="mb-2 text-sm font-medium">Where your contact details appear</p>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-muted/40 text-xs font-semibold text-muted-foreground"><th className="px-3 py-2 text-left">Shown on</th><th className="px-3 py-2">Address</th><th className="px-3 py-2">Phone</th><th className="px-3 py-2">Email</th></tr></thead>
                    <tbody className="divide-y">{PUBLIC_SURFACES.map((s) => (
                      <tr key={s}><td className="px-3 py-2">{s}</td>
                        {(["showAddressOn", "showPhoneOn", "showEmailOn"] as const).map((k) => (
                          <td key={k} className="px-3 py-2 text-center"><input type="checkbox" className="h-4 w-4 accent-primary" aria-label={`${LABELS[k]} ${s}`} checked={draft[k].includes(s)} onChange={() => toggleSurface(k, s)} /></td>
                        ))}</tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Invoice header preview</p>
              <div className="rounded-lg border bg-card p-5 text-sm shadow-sm">
                <p className="text-base font-semibold">{draft.publicName || "Your business"}</p>
                {draft.showAddressOn.includes("Invoices") && <p className="mt-1 text-muted-foreground">{[draft.line1, draft.line2, draft.city, draft.state].filter(Boolean).join(", ")}</p>}
                {draft.showPhoneOn.includes("Invoices") && <p className="text-muted-foreground">{draft.supportPhone}</p>}
                {draft.showEmailOn.includes("Invoices") && <p className="text-muted-foreground">{draft.supportEmail}</p>}
                <div className="mt-4 border-t pt-3 text-xs text-muted-foreground">Invoice GRV-INV-01043 · Due 5 Nov 2026</div>
              </div>
            </div>
          </div>
        )}
        {tab === "contacts" && (
          <div className="space-y-4">
            {draft.contacts.map((c, i) => (
              <div key={c.role} className="rounded-lg border p-4">
                <p className="mb-3 text-sm font-semibold">{c.role}</p>
                <div className="grid gap-4 sm:grid-cols-3">
                  {(["name", "email", "phone"] as const).map((k) => (
                    <label key={k} className="text-sm font-medium capitalize">{k}
                      <input className={`${INPUT} mt-1.5`} value={c[k]} placeholder={k === "phone" ? "Optional" : ""}
                        onChange={(e) => set({ contacts: draft.contacts.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)) })} />
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">Griv contacts these people about account, finance and technical matters.</p>
          </div>
        )}
      </Editable>
      <SaveBar dirty={dirty} onCancel={() => { reset(); setTouched(false); }} onSave={save}
        message={Object.keys(splitVerifiedChanges(saved, draft).review).length ? "Some changes need review before they apply" : undefined} />
    </SettingsPage>
  );
}
