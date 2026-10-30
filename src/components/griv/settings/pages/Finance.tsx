import { useState } from "react";
import { Landmark, Plus } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog, DataTable, DetailDrawer, DetailList, EmptyState, FormDialog, StatusBadge, type Column } from "@/components/griv/kit";
import { Switch } from "@/components/ui/switch";
import { CURRENCIES, formatMoney, type Currency } from "@/lib/money";
import { fmtDate, fmtDateTime } from "@/lib/dates";
import { logAudit } from "@/lib/demo/settings/activity";
import {
  ACCOUNT_LIMITS, BANKS, canSetDefault, limitReviewsStore, paymentMethodsStore, PRODUCT_LIMITS, requestsStore, rulesStore, SCHEDULES,
  setDefaultAccount, SETTLEMENT_FEES, settlementAccountsStore, settlementPrefsStore, TRANSACTION_FEES, usePaymentMethods,
  useSettlementAccounts, validateAccountNumber, type FeeRow, type LimitRow, type PaymentMethod, type SettlementAccount,
} from "@/lib/demo/settings/finance";
import { addTaxRate, taxLabel, useTaxRates } from "@/lib/demo/tax-rates";
import { viewerStore } from "@/lib/demo/settings/access";
import { createDemoStore } from "@/lib/demo-store";
import { businessStore } from "@/lib/demo/settings/business";
import { Callout, ChoiceList, Editable, INPUT, RowMenu, SaveBar, Section, SELECT, SettingsPage, SettingsTabs, TEXTAREA, ToggleRow, useCanEdit, useDraft, useTab } from "../ui";
import { cn } from "@/lib/utils";

/* ---------- Payment methods ---------- */
export function PaymentMethodsPage() {
  const methods = usePaymentMethods();
  const canEdit = useCanEdit();
  const cats: PaymentMethod["category"][] = ["Bank transfer", "Cards", "Mobile money", "Other"];
  const toggle = (m: PaymentMethod, on: boolean) => {
    if (on === false && methods.filter((x) => x.enabled).length === 1) { toast.error("Keep at least one payment method on so customers can pay."); return; }
    paymentMethodsStore.set((all) => all.map((x) => (x.id === m.id ? { ...x, enabled: on } : x)));
    logAudit("Payment configuration changed", "Payment methods", m.name, { before: { Status: on ? "Disabled" : "Enabled" }, after: { Status: on ? "Enabled" : "Disabled" } });
    toast.success(`${m.name} ${on ? "enabled" : "disabled"}`);
  };
  const setOpt = (m: PaymentMethod, key: string, v: boolean) => {
    paymentMethodsStore.set((all) => all.map((x) => (x.id === m.id ? { ...x, options: x.options?.map((o) => (o.key === key ? { ...o, value: v } : o)) } : x)));
    logAudit("Payment configuration changed", "Payment methods", `${m.name} option`, { after: { [m.options?.find((o) => o.key === key)?.label ?? key]: v ? "On" : "Off" } });
  };
  return (
    <SettingsPage slug="payment-methods">
      <p className="mb-6 text-sm text-muted-foreground">Turned-on methods appear on checkout, payment links, invoices and your online store. Changes apply to new payments straight away.</p>
      {cats.map((c) => (
        <Section key={c} title={c}>
          <div className="rounded-lg border">
            {methods.filter((m) => m.category === c).map((m) => (
              <div key={m.id} className="border-b px-4 py-3.5 last:border-b-0">
                <div className="flex items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">{m.name}
                      <StatusBadge status={!m.available ? "Unavailable" : m.enabled ? "Enabled" : "Disabled"} tone={!m.available ? "neutral" : m.enabled ? "success" : "neutral"} /></p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{m.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Currencies: {m.currencies.join(", ")}{!m.available && m.unavailableReason ? ` · ${m.unavailableReason}` : ""}</p>
                  </div>
                  <Switch checked={m.available && m.enabled} disabled={!m.available || !canEdit} onCheckedChange={(v) => toggle(m, v)} aria-label={`${m.name}`} />
                </div>
                {m.available && m.enabled && m.options?.map((o) => (
                  <label key={o.key} className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-primary" disabled={!canEdit} checked={o.value} onChange={(e) => setOpt(m, o.key, e.target.checked)} />{o.label}</label>
                ))}
              </div>
            ))}
          </div>
        </Section>
      ))}
    </SettingsPage>
  );
}

/* ---------- Settlement accounts ---------- */
export function SettlementAccountsPage() {
  const accounts = useSettlementAccounts();
  const canEdit = useCanEdit();
  const [add, setAdd] = useState<null | { bank: string; number: string; currency: Currency; tried: boolean }>(null);
  const [view, setView] = useState<SettlementAccount | null>(null);
  const [remove, setRemove] = useState<SettlementAccount | null>(null);
  const label = (a: SettlementAccount) => `${a.bank} •••• ${a.last4}`;
  const needsApproval = rulesStore.get().some((r) => r.action === "Settlement account changes" && r.status === "Active");

  const submitAdd = () => {
    if (!add) return;
    const err = validateAccountNumber(add.number);
    if (err) return setAdd({ ...add, tried: true });
    const acc: SettlementAccount = { id: `sa_${Date.now().toString(36)}`, bank: add.bank, accountName: businessStore.get().legalName.toUpperCase(), last4: add.number.slice(-4), currency: add.currency, country: "Nigeria", status: "Pending verification", isDefault: false, addedAt: new Date().toISOString() };
    settlementAccountsStore.set((all) => [...all, acc]);
    if (needsApproval) requestsStore.set((all) => [{ id: `APR-${String(52 + all.length).padStart(4, "0")}`, title: `Add settlement account ${label(acc)}`, ruleId: rulesStore.get().find((r) => r.action === "Settlement account changes")!.id, requestedBy: viewerStore.get(), amount: null, currency: acc.currency, createdAt: acc.addedAt, status: "Pending", reference: acc.id, decisions: [] }, ...all]);
    logAudit("Settlement account added", "Settlement accounts", label(acc), { result: needsApproval ? "Pending approval" : "Pending review", after: { Currency: acc.currency, Status: "Pending verification" } });
    toast.success("Account added — waiting for verification", { description: needsApproval ? "It also needs approval under your Approvals rules before it can receive settlements." : "It can't receive settlements until the bank confirms the account name." });
    setAdd(null);
  };

  const cols: Column<SettlementAccount>[] = [
    { key: "bank", header: "Bank or provider", cell: (a) => <span className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-md bg-muted"><Landmark className="h-4 w-4" /></span><span className="font-medium">{a.bank}</span></span> },
    { key: "name", header: "Account name", cell: (a) => a.accountName, hideBelow: "lg" },
    { key: "num", header: "Account number", cell: (a) => <span className="font-mono text-xs">•••• {a.last4}</span> },
    { key: "cur", header: "Currency", cell: (a) => a.currency },
    { key: "country", header: "Country", cell: (a) => a.country, hideBelow: "lg" },
    { key: "status", header: "Verification", cell: (a) => <StatusBadge status={a.status} tone={a.status === "Verified" ? "success" : a.status === "Rejected" ? "danger" : "pending"} /> },
    { key: "def", header: "Default", cell: (a) => (a.isDefault ? <StatusBadge status={`Default ${a.currency}`} tone="info" /> : <span className="text-muted-foreground">—</span>), hideBelow: "md" },
  ];
  return (
    <SettingsPage slug="settlement-accounts" wide actions={<button className="btn btn-primary h-9 text-sm" onClick={() => setAdd({ bank: BANKS[0]!, number: "", currency: "NGN", tried: false })}><Plus className="h-4 w-4" />Add account</button>}>
      <div className="mb-4"><Callout>New accounts must be in your registered business name and are verified with the bank before they can receive money.{needsApproval ? " An approval rule also requires an Owner to approve new accounts." : ""} Each currency has one default account.</Callout></div>
      <div className="panel overflow-hidden">
        <DataTable columns={cols} rows={accounts} rowKey={(a) => a.id} onRowClick={setView} headerTone="plain"
          rowActions={(a) => <RowMenu items={[
            { label: "View details", onSelect: () => setView(a) },
            { label: "Set as default", disabled: !canEdit ? true : canSetDefault(a) ?? false, onSelect: () => { const r = setDefaultAccount(a.id); if (r.error) toast.error(r.error); else { logAudit("Default settlement account changed", "Settlement accounts", label(a), { after: { Currency: a.currency } }); toast.success(`${label(a)} is now the default ${a.currency} account`); } } },
            { label: "Remove account", danger: true, separatorBefore: true, disabled: !canEdit ? true : a.isDefault ? "Set another default first" : false, onSelect: () => setRemove(a) },
          ]} />}
          empty={<EmptyState icon={Landmark} title="Add an account to receive settlements." description="Configure an eligible settlement destination for your business." action={canEdit ? <button className="btn btn-primary h-9 text-sm" onClick={() => setAdd({ bank: BANKS[0]!, number: "", currency: "NGN", tried: false })}>Add settlement account</button> : undefined} />} />
      </div>
      <FormDialog open={!!add} onOpenChange={(o) => !o && setAdd(null)} title="Add settlement account" description="We check the account name with the bank. Only accounts in your business's name are accepted."
        footer={<><button className="btn btn-outline h-9 text-sm" onClick={() => setAdd(null)}>Cancel</button><button className="btn btn-primary h-9 text-sm" onClick={submitAdd}>Add account</button></>}>
        {add && <div className="space-y-4">
          <label className="block text-sm font-medium">Bank<select className={`${SELECT} mt-1.5`} value={add.bank} onChange={(e) => setAdd({ ...add, bank: e.target.value })}>{BANKS.map((b) => <option key={b}>{b}</option>)}</select></label>
          <label className="block text-sm font-medium">Account number<input inputMode="numeric" maxLength={10} className={cn(INPUT, "mt-1.5 font-mono", add.tried && validateAccountNumber(add.number) && "border-destructive")} value={add.number} onChange={(e) => setAdd({ ...add, number: e.target.value.replace(/\s/g, "") })} placeholder="0123456789" />
            {add.tried && validateAccountNumber(add.number) && <span className="mt-1 block text-xs text-destructive">{validateAccountNumber(add.number)}</span>}</label>
          <label className="block text-sm font-medium">Currency<select className={`${SELECT} mt-1.5`} value={add.currency} onChange={(e) => setAdd({ ...add, currency: e.target.value as Currency })}>{(["NGN", "USD"] as Currency[]).map((c) => <option key={c}>{c}</option>)}</select></label>
          <p className="text-xs text-muted-foreground">Account name lookup needs the bank's verification service, which isn't connected in this demo — the account stays “Pending verification”.</p>
        </div>}
      </FormDialog>
      <DetailDrawer open={!!view} onOpenChange={(o) => !o && setView(null)} title={view ? label(view) : ""} subtitle={view?.accountName}
        badge={view && <StatusBadge status={view.status} tone={view.status === "Verified" ? "success" : "pending"} />}>
        {view && <DetailList items={[["Bank", view.bank], ["Account name", view.accountName], ["Account number", `•••• ${view.last4}`], ["Currency", view.currency], ["Country", view.country], ["Default", view.isDefault ? "Yes" : "No"], ["Added", fmtDate(view.addedAt)]]} />}
      </DetailDrawer>
      <ConfirmDialog open={!!remove} onOpenChange={(o) => !o && setRemove(null)} danger confirmLabel="Remove account" title={`Remove ${remove ? label(remove) : ""}?`}
        description="Settlements already on the way still arrive. Future settlements go to your default account."
        onConfirm={() => { if (!remove) return; settlementAccountsStore.set((all) => all.filter((a) => a.id !== remove.id)); logAudit("Settlement account removed", "Settlement accounts", label(remove)); toast.success("Account removed"); setRemove(null); }} />
    </SettingsPage>
  );
}

/* ---------- Settlement preferences ---------- */
export function SettlementPreferencesPage() {
  const saved = settlementPrefsStore.use();
  const accounts = useSettlementAccounts();
  const { draft, set, dirty, reset } = useDraft(saved);
  const eligible = accounts.filter((a) => a.status === "Verified" && a.currency === draft.currency);
  const destOk = eligible.some((a) => a.id === draft.destinationId);
  return (
    <SettingsPage slug="settlement-preferences">
      <Editable>
        <Section title="Settlement currency" description="Which balance settles to your bank. Other currencies stay in their own balance — Griv never converts them automatically.">
          <select className={`${SELECT} max-w-xs`} value={draft.currency} onChange={(e) => { const c = e.target.value as Currency; set({ currency: c, destinationId: accounts.find((a) => a.currency === c && a.status === "Verified" && a.isDefault)?.id ?? "" }); }} aria-label="Settlement currency">
            {(["NGN", "USD"] as Currency[]).map((c) => <option key={c}>{c}</option>)}
          </select>
        </Section>
        <Section title="Schedule" description="Settlement times depend on bank processing. Griv doesn't offer instant settlement.">
          <ChoiceList name="Schedule" value={draft.schedule} onChange={(v) => set({ schedule: v })} options={SCHEDULES.map((s) => ({ id: s.id, label: s.label, description: s.description, disabled: s.eligible ? undefined : s.reason }))} />
        </Section>
        <Section title="Destination" description="Only verified accounts in the settlement currency can receive money.">
          {eligible.length ? (
            <select className={`${SELECT} max-w-md`} value={destOk ? draft.destinationId : ""} onChange={(e) => set({ destinationId: e.target.value })} aria-label="Destination account">
              {!destOk && <option value="">Choose an account</option>}
              {eligible.map((a) => <option key={a.id} value={a.id}>{a.bank} •••• {a.last4}{a.isDefault ? " (default)" : ""}</option>)}
            </select>
          ) : <Callout tone="warning">You have no verified {draft.currency} account yet. Add one in Settlement accounts — {draft.currency} funds stay in your Griv balance until then.</Callout>}
          <label className="mt-4 block max-w-xs text-sm font-medium">Minimum amount to settle
            <input type="number" min={0} className={`${INPUT} mt-1.5`} value={draft.minimumAmount} onChange={(e) => set({ minimumAmount: Math.max(0, Number(e.target.value)) })} />
            <span className="mt-1 block text-xs font-normal text-muted-foreground">Smaller balances roll over to the next settlement. Now {formatMoney(draft.minimumAmount, draft.currency)}.</span>
          </label>
        </Section>
        <Section title="Automatic settlement and notifications">
          <ToggleRow label="Retry failed settlements automatically" description="If the bank rejects a settlement, Griv retries once the next business day before returning it to your balance." checked={draft.autoRetry} onChange={(v) => set({ autoRetry: v })} />
          <ToggleRow label="Email me when a settlement is sent" checked={draft.notifyOnSettle} onChange={(v) => set({ notifyOnSettle: v })} />
          <ToggleRow label="Email me when a settlement fails" checked={draft.notifyOnFail} onChange={(v) => set({ notifyOnFail: v })} />
        </Section>
      </Editable>
      <SaveBar dirty={dirty} disabled={!!eligible.length && !destOk} onCancel={reset} onSave={() => {
        settlementPrefsStore.set(draft);
        logAudit("Settlement preferences changed", "Settlement preferences", "Settlement schedule", { before: { Schedule: SCHEDULES.find((s) => s.id === saved.schedule)!.label, Currency: saved.currency }, after: { Schedule: SCHEDULES.find((s) => s.id === draft.schedule)!.label, Currency: draft.currency } });
        toast.success("Settlement preferences saved", { description: "They apply from the next settlement cycle." });
      }} />
    </SettingsPage>
  );
}

/* ---------- Fees & limits ---------- */
const FEE_TABS = ["transaction", "settlement", "product", "account"] as const;
function FeeTable({ rows }: { rows: FeeRow[] }) {
  const cols: Column<FeeRow>[] = [
    { key: "product", header: "Product", cell: (r) => <span className="font-medium">{r.product}</span> },
    { key: "type", header: "Transaction type", cell: (r) => r.type },
    { key: "cur", header: "Currency", cell: (r) => r.currency, hideBelow: "md" },
    { key: "fee", header: "Fee", cell: (r) => r.structure },
    { key: "min", header: "Minimum fee", cell: (r) => r.min, hideBelow: "lg" },
    { key: "max", header: "Maximum fee", cell: (r) => r.max, hideBelow: "lg" },
    { key: "limit", header: "Applicable limit", cell: (r) => <span className="text-muted-foreground">{r.limit}</span>, hideBelow: "md" },
  ];
  return <div className="panel overflow-hidden"><DataTable columns={cols} rows={rows} rowKey={(r) => r.product + r.type} headerTone="plain" pageSize={20} /></div>;
}
function LimitTable({ rows, onReview }: { rows: LimitRow[]; onReview: (r: LimitRow) => void }) {
  const canEdit = useCanEdit();
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead><tr className="border-b bg-muted/40 text-left text-xs font-semibold tracking-[0.08em] text-muted-foreground"><th className="px-4 py-2.5">Limit</th><th className="px-4 py-2.5">Scope</th><th className="px-4 py-2.5">Allowed</th><th className="hidden px-4 py-2.5 md:table-cell">Used</th><th /></tr></thead>
        <tbody className="divide-y">{rows.map((r) => {
          const pct = r.cap ? Math.round((r.used / r.cap) * 100) : null;
          return (
            <tr key={r.name}><td className="px-4 py-3 font-medium">{r.name}</td><td className="px-4 py-3 text-muted-foreground">{r.scope}</td><td className="px-4 py-3">{r.limit}</td>
              <td className="hidden px-4 py-3 md:table-cell">{pct != null ? <span className="flex items-center gap-2"><span className="h-1.5 w-24 overflow-hidden rounded-full bg-muted"><span className={cn("block h-full rounded-full", pct > 80 ? "bg-destructive" : "bg-primary")} style={{ width: `${pct}%` }} /></span><span className="text-xs text-muted-foreground tnum">{pct}%</span></span> : <span className="text-muted-foreground">—</span>}</td>
              <td className="px-4 py-3 text-right">{canEdit && <button className="text-sm font-semibold text-primary hover:underline" onClick={() => onReview(r)}>Request review</button>}</td></tr>
          );
        })}</tbody>
      </table>
    </div>
  );
}
export function FeesLimitsPage() {
  const [tab, setTab] = useTab(FEE_TABS, "transaction");
  const reviews = limitReviewsStore.use();
  const [review, setReview] = useState<null | { row: LimitRow; amount: string; reason: string; tried: boolean }>(null);
  return (
    <SettingsPage slug="fees-limits" wide>
      <div className="mb-4"><Callout>Sample pricing for this demo — your contract with Griv sets the real fees and limits. Fees are charged in the currency of the transaction.</Callout></div>
      <SettingsTabs value={tab} onChange={setTab} tabs={[{ id: "transaction", label: "Transaction fees" }, { id: "settlement", label: "Settlement fees" }, { id: "product", label: "Product limits" }, { id: "account", label: "Account limits" }]} />
      {tab === "transaction" && <FeeTable rows={TRANSACTION_FEES} />}
      {tab === "settlement" && <FeeTable rows={SETTLEMENT_FEES} />}
      {(tab === "product" || tab === "account") && <LimitTable rows={tab === "product" ? PRODUCT_LIMITS : ACCOUNT_LIMITS} onReview={(row) => setReview({ row, amount: "", reason: "", tried: false })} />}
      {reviews.length > 0 && (tab === "product" || tab === "account") && (
        <Section title="Limit review requests" className="mt-8">
          <div className="space-y-2">{reviews.map((r) => <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-3 text-sm"><span><span className="font-medium">{r.limit}</span> → {r.requested}<span className="block text-xs text-muted-foreground">{r.reason} · {fmtDateTime(r.at)}</span></span><StatusBadge status={r.status} tone="pending" /></div>)}</div>
        </Section>
      )}
      <FormDialog open={!!review} onOpenChange={(o) => !o && setReview(null)} title={`Request a review: ${review?.row.name}`} description={`Currently ${review?.row.limit}. Griv's risk team reviews requests within 3 business days.`}
        footer={<><button className="btn btn-outline h-9 text-sm" onClick={() => setReview(null)}>Cancel</button><button className="btn btn-primary h-9 text-sm" onClick={() => {
          if (!review) return;
          if (!review.amount.trim() || review.reason.trim().length < 15) return setReview({ ...review, tried: true });
          limitReviewsStore.set((all) => [{ id: `lr_${Date.now()}`, limit: review.row.name, requested: review.amount.trim(), reason: review.reason.trim(), at: new Date().toISOString(), status: "Pending" }, ...all]);
          logAudit("Limit review requested", "Fees & limits", review.row.name, { result: "Pending review", after: { Requested: review.amount.trim() } });
          toast.success("Request sent", { description: "Your current limit stays in place until Griv approves a change." }); setReview(null);
        }}>Send request</button></>}>
        {review && <div className="space-y-4">
          <label className="block text-sm font-medium">New limit you need<input className={cn(INPUT, "mt-1.5", review.tried && !review.amount.trim() && "border-destructive")} value={review.amount} onChange={(e) => setReview({ ...review, amount: e.target.value })} placeholder={`e.g. ${review.row.currency === "USD" ? "$100,000.00" : "₦50,000,000.00"}`} /></label>
          <label className="block text-sm font-medium">Why do you need it?<textarea className={cn(TEXTAREA, "mt-1.5", review.tried && review.reason.trim().length < 15 && "border-destructive")} value={review.reason} onChange={(e) => setReview({ ...review, reason: e.target.value })} />
            <span className="mt-1 block text-xs font-normal text-muted-foreground">At least 15 characters — mention expected volumes.</span></label>
        </div>}
      </FormDialog>
    </SettingsPage>
  );
}

/* ---------- Tax ---------- */
type TaxSettings = { registered: boolean; tin: string; vatNumber: string; behavior: "exclusive" | "inclusive"; defaultRateId: string | null; showOnInvoices: boolean; exemptCategories: string[]; exemptNote: string };
const taxSettingsStore = createDemoStore<TaxSettings>({ registered: true, tin: "23849102-0001", vatNumber: "VAT-0193842", behavior: "exclusive", defaultRateId: "txr_vat", showOnInvoices: true, exemptCategories: ["Basic food items"], exemptNote: "" });
const EXEMPT = ["Basic food items", "Medical and pharmaceutical products", "Educational materials", "Exported services"];

export function TaxPage() {
  const saved = taxSettingsStore.use();
  const rates = useTaxRates();
  const canEdit = useCanEdit();
  const { draft, set, dirty, reset } = useDraft(saved);
  const [add, setAdd] = useState<null | { name: string; rate: string; inclusive: boolean }>(null);
  const tinBad = draft.registered && !/^\d{8}-\d{4}$/.test(draft.tin);
  return (
    <SettingsPage slug="tax">
      <Editable>
        <Section title="Business tax information">
          <ToggleRow label="Registered for VAT" description="Turn off if your business is below the VAT registration threshold." checked={draft.registered} onChange={(v) => set({ registered: v })} />
          {draft.registered && <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">Tax identification number (TIN)<input className={cn(INPUT, "mt-1.5", tinBad && "border-destructive")} value={draft.tin} onChange={(e) => set({ tin: e.target.value })} />{tinBad && <span className="mt-1 block text-xs text-destructive">Use the format 12345678-0001.</span>}</label>
            <label className="text-sm font-medium">VAT number<input className={`${INPUT} mt-1.5`} value={draft.vatNumber} onChange={(e) => set({ vatNumber: e.target.value })} /></label>
          </div>}
        </Section>
        <Section title="Default tax behaviour" description="How prices you type are treated. You can still change it on each invoice or product.">
          <ChoiceList name="Tax behaviour" value={draft.behavior} onChange={(v) => set({ behavior: v })} options={[
            { id: "exclusive", label: "Prices exclude tax", description: "Tax is added on top. A ₦10,000.00 price with 7.5% VAT charges ₦10,750.00." },
            { id: "inclusive", label: "Prices include tax", description: "Tax is part of the price. A ₦10,000.00 price includes ₦697.67 VAT." },
          ]} />
          <ToggleRow label="Show tax breakdown on invoices and receipts" checked={draft.showOnInvoices} onChange={(v) => set({ showOnInvoices: v })} />
        </Section>
      </Editable>
      <Section title="Tax rates" description="Rates you can apply to invoices and products. Nothing is hardcoded — add the rates that apply to your business."
        action={canEdit ? <button className="btn btn-outline h-8 px-3 text-xs" onClick={() => setAdd({ name: "", rate: "", inclusive: false })}><Plus className="h-3.5 w-3.5" />Add rate</button> : undefined}>
        <div className="rounded-lg border">{rates.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-3 border-b px-4 py-3 text-sm last:border-b-0">
            <span><span className="font-medium">{taxLabel(r)}</span><span className="block text-xs text-muted-foreground">{r.inclusive ? "Included in price" : "Added on top"}</span></span>
            {draft.defaultRateId === r.id ? <StatusBadge status="Default" tone="info" /> : canEdit && <button className="text-sm font-semibold text-primary hover:underline" onClick={() => set({ defaultRateId: r.id })}>Make default</button>}
          </div>
        ))}</div>
      </Section>
      <Editable>
        <Section title="Exemptions" description="Categories you sell that are exempt from VAT. Exempt products are never taxed by default.">
          <div className="flex flex-wrap gap-2">{EXEMPT.map((c) => (
            <label key={c} className={cn("flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-sm", draft.exemptCategories.includes(c) && "border-primary bg-primary/5 text-primary")}>
              <input type="checkbox" className="sr-only" checked={draft.exemptCategories.includes(c)} onChange={() => set({ exemptCategories: draft.exemptCategories.includes(c) ? draft.exemptCategories.filter((x) => x !== c) : [...draft.exemptCategories, c] })} />{c}
            </label>
          ))}</div>
          <label className="mt-4 block text-sm font-medium">Exemption certificate or note <span className="font-normal text-muted-foreground">(optional)</span><textarea className={`${TEXTAREA} mt-1.5 h-20`} value={draft.exemptNote} onChange={(e) => set({ exemptNote: e.target.value })} /></label>
        </Section>
      </Editable>
      <SaveBar dirty={dirty} disabled={tinBad} onCancel={reset} onSave={() => { taxSettingsStore.set(draft); logAudit("Tax settings updated", "Tax settings", "Tax behaviour and exemptions", { before: { Behaviour: saved.behavior, "Default rate": rates.find((r) => r.id === saved.defaultRateId)?.name ?? "—" }, after: { Behaviour: draft.behavior, "Default rate": rates.find((r) => r.id === draft.defaultRateId) ? taxLabel(rates.find((r) => r.id === draft.defaultRateId)!) : "—" } }); toast.success("Tax settings saved"); }} />
      <FormDialog open={!!add} onOpenChange={(o) => !o && setAdd(null)} title="Add tax rate"
        footer={<><button className="btn btn-outline h-9 text-sm" onClick={() => setAdd(null)}>Cancel</button><button className="btn btn-primary h-9 text-sm" onClick={() => {
          if (!add) return;
          const n = Number(add.rate);
          if (!add.name.trim() || !(n > 0) || n > 100) { toast.error("Enter a name and a rate between 0 and 100%."); return; }
          const r = addTaxRate({ name: add.name.trim(), rate: n, inclusive: add.inclusive });
          logAudit("Tax rate added", "Tax settings", taxLabel(r)); toast.success(`${taxLabel(r)} added`); setAdd(null);
        }}>Add rate</button></>}>
        {add && <div className="space-y-4">
          <label className="block text-sm font-medium">Name<input autoFocus className={`${INPUT} mt-1.5`} value={add.name} onChange={(e) => setAdd({ ...add, name: e.target.value })} placeholder="e.g. Lagos consumption tax" /></label>
          <label className="block text-sm font-medium">Rate (%)<input type="number" step="0.01" className={`${INPUT} mt-1.5`} value={add.rate} onChange={(e) => setAdd({ ...add, rate: e.target.value })} /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-primary" checked={add.inclusive} onChange={(e) => setAdd({ ...add, inclusive: e.target.checked })} />Included in prices</label>
        </div>}
      </FormDialog>
    </SettingsPage>
  );
}
