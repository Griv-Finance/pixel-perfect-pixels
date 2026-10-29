import { Check, Plus, Settings2, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { currencySymbol, formatMoney } from "@/lib/money";
import { fmtDate } from "@/lib/dates";
import { customerByName } from "@/lib/demo/customers";
import { invoiceTotals, type Invoice, type InvoiceTerms } from "@/lib/demo/invoices";
import {
  defaultInstallments,
  dueFromTerms,
  installmentAmounts,
  invoiceMethods,
  methodsForCurrency,
  newInstallment,
  plusDays,
  TERMS,
  todayIso,
} from "@/lib/demo/invoice-builder";
import { EditorSection, FieldError, INPUT, LINK_BTN } from "./ui";

type Update = (fn: (r: Invoice) => Invoice) => void;

/** Payment collection: request payment, installments, or (when possible) automatic charging. */
export function CollectionSection({ invoice: r, update, errors }: {
  invoice: Invoice; update: Update; errors: { methods?: string | undefined; installments?: string | undefined };
}) {
  const mode = r.collection ?? "request";
  const methods = invoiceMethods(r);
  const available = methodsForCurrency(r.currency);
  const toggleMethod = (m: string) =>
    update((v) => {
      const cur = invoiceMethods(v);
      return { ...v, paymentMethods: cur.includes(m) ? cur.filter((x) => x !== m) : available.filter((x) => x === m || cur.includes(x)) };
    });
  const customer = customerByName(r.customer);

  const MethodChips = (
    <div className="mt-3 space-y-2">
      {available.length === 0 ? (
        <p className="rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
          No payment methods are set up for {r.currency}. Configure an eligible method before requesting online payment.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {methods.map((m) => (
            <span key={m} className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-accent px-2.5 py-0.5 text-xs font-medium text-primary">
              <Check className="h-3 w-3" /> {m}
            </span>
          ))}
        </div>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <button className={LINK_BTN}>
            <Settings2 className="h-3.5 w-3.5" /> Manage payment methods
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-3">
          <p className="mb-2 text-sm font-semibold">Payment methods for {r.currency}</p>
          <ul className="space-y-1.5">
            {available.map((m) => (
              <li key={m}>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4 accent-primary" checked={methods.includes(m)} onChange={() => toggleMethod(m)} />
                  {m}
                </label>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">Only methods enabled on your Griv account for {r.currency} are listed.</p>
        </PopoverContent>
      </Popover>
      <FieldError>{errors.methods}</FieldError>
    </div>
  );

  return (
    <EditorSection id="field-collection" title="Payment collection">
      <div role="radiogroup" aria-label="Payment collection" className="divide-y rounded-lg border bg-card">
        <Option
          checked={mode === "request"}
          onSelect={() => update((v) => ({ ...v, collection: "request" }))}
          title="Request payment"
          description="Send an invoice your customer pays by the due date."
        >
          {MethodChips}
        </Option>
        <Option
          checked={mode === "installments"}
          onSelect={() =>
            update((v) => ({
              ...v,
              collection: "installments",
              installmentUnit: v.installmentUnit ?? "percent",
              installments: v.installments?.length ? v.installments : defaultInstallments(v.issue),
            }))
          }
          title="Request payment in installments"
          description="Split the total into a schedule your customer pays over time."
        >
          <InstallmentsEditor invoice={r} update={update} error={errors.installments} />
          {MethodChips}
        </Option>
        <Option
          checked={false}
          disabled
          onSelect={() => undefined}
          title="Automatically charge a customer"
          description={
            customer
              ? `Unavailable — ${customer.name} has no saved payment method they've authorised Griv to charge.`
              : "Unavailable — needs a saved payment method the customer has authorised Griv to charge."
          }
        />
      </div>
    </EditorSection>
  );
}

function Option({ checked, onSelect, title, description, disabled, children }: {
  checked: boolean; onSelect: () => void; title: string; description: string; disabled?: boolean; children?: React.ReactNode;
}) {
  return (
    <div className={cn("p-3", disabled && "opacity-60")}>
      <label className={cn("flex items-start gap-2.5", disabled ? "cursor-not-allowed" : "cursor-pointer")}>
        <input type="radio" className="mt-1 h-4 w-4 accent-primary" checked={checked} disabled={disabled} onChange={onSelect} />
        <span className="text-sm">
          <span className="font-medium">{title}</span>
          <span className="block text-xs text-muted-foreground">{description}</span>
        </span>
      </label>
      {checked && children && <div className="pl-6.5">{children}</div>}
    </div>
  );
}

function InstallmentsEditor({ invoice: r, update, error }: { invoice: Invoice; update: Update; error?: string | undefined }) {
  const list = r.installments ?? [];
  const unit = r.installmentUnit ?? "percent";
  const amounts = installmentAmounts(r);
  const total = invoiceTotals(r).total;
  const sum = list.reduce((s, i) => s + (i.value || 0), 0);
  const patch = (id: string, p: Partial<(typeof list)[number]>) =>
    update((v) => ({ ...v, installments: (v.installments ?? []).map((i) => (i.id === id ? { ...i, ...p } : i)) }));
  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">Split by</span>
        {(["percent", "amount"] as const).map((u) => (
          <button
            key={u}
            onClick={() => update((v) => ({ ...v, installmentUnit: u, installments: (v.installments ?? []).map((i) => ({ ...i, value: 0 })) }))}
            className={cn("rounded-md border px-2 py-0.5 font-medium", unit === u ? "border-primary bg-accent text-primary" : "text-muted-foreground")}
          >
            {u === "percent" ? "Percentage" : "Amount"}
          </button>
        ))}
      </div>
      <ol className="space-y-2">
        {list.map((ins, i) => (
          <li key={ins.id} className="grid grid-cols-[1.25rem_6rem_1fr] items-center gap-2 sm:grid-cols-[1.25rem_6rem_9rem_1fr_auto]">
            <span className="text-xs text-muted-foreground">{i + 1}.</span>
            <div className="relative">
              <input
                aria-label={`Installment ${i + 1} ${unit === "percent" ? "percentage" : "amount"}`}
                type="number"
                min="0"
                className={cn(INPUT, "h-8 pr-7")}
                value={ins.value || ""}
                placeholder="0"
                onChange={(e) => patch(ins.id, { value: Number(e.target.value) })}
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {unit === "percent" ? "%" : currencySymbol(r.currency)}
              </span>
            </div>
            <input aria-label={`Installment ${i + 1} due date`} type="date" min={r.issue} className={cn(INPUT, "h-8")} value={ins.due} onChange={(e) => patch(ins.id, { due: e.target.value })} />
            <input
              aria-label={`Installment ${i + 1} description`}
              className={cn(INPUT, "col-span-2 h-8 sm:col-span-1")}
              placeholder="Description (optional)"
              value={ins.description}
              onChange={(e) => patch(ins.id, { description: e.target.value })}
            />
            <div className="flex items-center justify-end gap-2">
              {unit === "percent" && <span className="text-xs text-muted-foreground tnum">{formatMoney(amounts[i] ?? 0, r.currency)}</span>}
              <button
                aria-label={`Remove installment ${i + 1}`}
                disabled={list.length <= 2}
                onClick={() => update((v) => ({ ...v, installments: (v.installments ?? []).filter((x) => x.id !== ins.id) }))}
                className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:text-destructive disabled:opacity-30"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          className={LINK_BTN}
          onClick={() =>
            update((v) => {
              const last = (v.installments ?? []).at(-1)?.due ?? v.issue;
              return { ...v, installments: [...(v.installments ?? []), newInstallment(plusDays(last, 30), 0)] };
            })
          }
        >
          <Plus className="h-4 w-4" /> Add installment
        </button>
        <span className={cn("text-xs tnum", error ? "text-destructive" : "text-muted-foreground")}>
          {unit === "percent" ? `${Math.round(sum * 100) / 100}% of 100%` : `${formatMoney(sum, r.currency)} of ${formatMoney(total, r.currency)}`}
        </span>
      </div>
      <FieldError>{error}</FieldError>
    </div>
  );
}

/** Invoice due: preset terms or a custom date, counted from finalization. */
export function DueSection({ invoice: r, update, error }: { invoice: Invoice; update: Update; error?: string | undefined }) {
  const terms = r.terms ?? "30";
  const preset = TERMS.find((t) => t.value === terms);
  const base = r.status === "Scheduled" && r.scheduledFor ? r.scheduledFor.slice(0, 10) : todayIso();
  return (
    <EditorSection id="field-due" title="Invoice due">
      <div className="flex flex-wrap items-start gap-3">
        <select
          aria-label="Payment terms"
          className={cn(INPUT, "w-48")}
          value={terms}
          onChange={(e) => {
            const t = e.target.value as InvoiceTerms;
            update((v) => ({ ...v, terms: t, due: t === "custom" ? v.due : dueFromTerms(t, v.issue) }));
          }}
        >
          {TERMS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        {terms === "custom" && (
          <input
            aria-label="Custom due date"
            type="date"
            min={r.issue}
            className={cn(INPUT, "w-44", error && "border-destructive")}
            value={r.due}
            onChange={(e) => update((v) => ({ ...v, due: e.target.value }))}
          />
        )}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {terms === "custom"
          ? `Due on ${r.due ? fmtDate(r.due) : "the date you pick"}.`
          : preset?.days === 0
            ? `Due as soon as it's finalized (${fmtDate(base)} if finalized ${base === todayIso() ? "today" : "on schedule"}).`
            : `Due ${preset?.days} days after the invoice is finalized (${fmtDate(dueFromTerms(terms, base))} if finalized ${base === todayIso() ? "today" : "on schedule"}).`}
      </p>
      <FieldError>{error}</FieldError>
    </EditorSection>
  );
}
