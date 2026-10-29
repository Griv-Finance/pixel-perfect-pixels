/** Rules for the invoice creation workspace: defaults, due dates, validation, installments and finalization. */
import { addDays, format, parseISO } from "date-fns";
import { DEMO_TODAY } from "@/lib/dates";
import type { Currency } from "@/lib/money";
import { PAYMENT_METHODS_BY_CURRENCY } from "./link-details";
import { catalogStore } from "./catalog";
import { customerByName } from "./customers";
import { invoiceTotals, type Installment, type Invoice, type InvoiceItem, type InvoiceTerms } from "./invoices";

export const TERMS: { value: InvoiceTerms; label: string; days: number | null }[] = [
  { value: "receipt", label: "Due on receipt", days: 0 },
  { value: "7", label: "Due in 7 days", days: 7 },
  { value: "14", label: "Due in 14 days", days: 14 },
  { value: "30", label: "Due in 30 days", days: 30 },
  { value: "60", label: "Due in 60 days", days: 60 },
  { value: "custom", label: "Custom date", days: null },
];
/** Business default when no payment-terms setting exists. */
export const DEFAULT_TERMS: InvoiceTerms = "30";

export const todayIso = () => format(DEMO_TODAY, "yyyy-MM-dd");
export const plusDays = (iso: string, days: number) => format(addDays(parseISO(iso), days), "yyyy-MM-dd");

/** Due date for the given terms, counted from the finalization (issue) date. */
export function dueFromTerms(terms: InvoiceTerms, issue: string, customDue?: string) {
  const t = TERMS.find((x) => x.value === terms);
  if (!t || t.days === null) return customDue || issue;
  return plusDays(issue, t.days);
}

export const methodsForCurrency = (c: Currency) => PAYMENT_METHODS_BY_CURRENCY[c] ?? ["Card"];
export const invoiceMethods = (r: Pick<Invoice, "currency" | "paymentMethods">) => r.paymentMethods ?? methodsForCurrency(r.currency);

/** A brand-new, empty invoice. Nothing is pre-filled with sample customers, items or bank details. */
export function blankInvoice(id: string, currency: Currency = "NGN"): Invoice {
  const issue = todayIso();
  return {
    id,
    customer: "",
    currency,
    issue,
    due: dueFromTerms(DEFAULT_TERMS, issue),
    items: [],
    discount: 0,
    discountType: "fixed",
    taxRateIds: [],
    notes: "",
    instructions: "",
    status: "Draft",
    payments: [],
    reminders: [],
    billingMethod: "Send invoice",
    terms: DEFAULT_TERMS,
    collection: "request",
    paymentMethods: methodsForCurrency(currency),
    template: "classic",
    pageSize: "A4",
    includePaymentLink: true,
    created: DEMO_TODAY.toISOString(),
    delivery: "Not sent",
  };
}

/** True when changing currency would affect existing amounts, so the editor must confirm first. */
export const hasItemAmounts = (r: Pick<Invoice, "items">) => r.items.some((x) => x.price > 0);

/** Changing currency clears items, fixed discounts and installments — Griv never converts amounts. */
export function changeCurrency(r: Invoice, currency: Currency): Invoice {
  return {
    ...r,
    currency,
    items: [],
    discount: r.discountType === "percent" ? r.discount : 0,
    paymentMethods: methodsForCurrency(currency),
    installments: r.installmentUnit === "amount" ? [] : r.installments,
  };
}

/* ---------- catalogue ---------- */

export type CatalogOption = { key: string; productId: string; sku: string; name: string; description: string; price: number };

/** Catalogue prices are kept in NGN, so products are only offered on NGN invoices (no FX conversion). */
export function catalogOptions(currency: Currency): CatalogOption[] {
  if (currency !== "NGN") return [];
  return catalogStore
    .get()
    .filter((p) => p.status !== "Archived")
    .flatMap((p) =>
      p.variants.map((v) => ({
        key: v.sku,
        productId: p.id,
        sku: v.sku,
        name: v.label === "Default" ? p.name : `${p.name} — ${v.label}`,
        description: p.description,
        price: v.price,
      })),
    );
}

export const itemFromCatalog = (o: CatalogOption): InvoiceItem => ({
  name: o.name,
  description: o.description,
  qty: 1,
  price: o.price,
  productId: o.productId,
  sku: o.sku,
});

/* ---------- validation ---------- */

export type InvoiceErrors = Partial<Record<"customer" | "items" | "discount" | "due" | "methods" | "installments" | "total", string>>;

export function itemErrors(x: Pick<InvoiceItem, "name" | "qty" | "price" | "discount">) {
  const e: Partial<Record<"name" | "qty" | "price" | "discount", string>> = {};
  if (!x.name.trim()) e.name = "Enter a name for this item.";
  if (!(x.qty > 0)) e.qty = "Quantity must be more than zero.";
  else if (!Number.isInteger(x.qty)) e.qty = "Use a whole number.";
  if (!(x.price > 0)) e.price = "Price must be more than zero.";
  if (x.discount) {
    if (x.discount.value < 0) e.discount = "Discount can't be negative.";
    else if (x.discount.type === "percent" && x.discount.value > 100) e.discount = "Use a percentage between 0 and 100.";
    else if (x.discount.type === "fixed" && x.discount.value > x.qty * x.price) e.discount = "Discount can't exceed the line amount.";
  }
  return e;
}

/** Everything needed before an invoice can be reviewed and finalized. */
export function validateInvoice(r: Invoice): InvoiceErrors {
  const e: InvoiceErrors = {};
  const t = invoiceTotals(r);
  if (!r.customer.trim()) e.customer = "Choose or add a customer.";
  if (r.items.length === 0) e.items = "Add at least one item.";
  else if (r.items.some((x) => Object.keys(itemErrors(x)).length > 0)) e.items = "Fix the highlighted items.";
  if (r.discount < 0) e.discount = "Discount can't be negative.";
  else if (r.discountType === "percent" && r.discount > 100) e.discount = "Use a percentage between 0 and 100.";
  else if (r.discountType !== "percent" && r.discount > t.subtotal) e.discount = "Discount can't be more than the subtotal.";
  if (!e.items && !e.discount && r.items.length && !(t.total > 0)) e.total = "The amount due must be more than zero.";
  if (r.terms === "custom") {
    if (!r.due) e.due = "Pick a due date.";
    else if (r.due < r.issue) e.due = "The due date can't be before the invoice is finalized.";
  }
  if ((r.collection ?? "request") !== "autocharge" && invoiceMethods(r).length === 0)
    e.methods = "Turn on at least one payment method so your customer can pay.";
  if (r.collection === "installments") {
    const msg = installmentError(r);
    if (msg) e.installments = msg;
  }
  if (r.collection === "autocharge") e.methods = "Automatic charging needs a saved, authorised payment method — none is on file.";
  return e;
}

/* ---------- installments ---------- */

/** Installment amounts in money, with rounding absorbed by the last installment. */
export function installmentAmounts(r: Pick<Invoice, "installments" | "installmentUnit" | "items" | "discount" | "discountType" | "taxRateIds">) {
  const list = r.installments ?? [];
  const total = invoiceTotals(r).total;
  if (r.installmentUnit !== "percent") return list.map((i) => Math.round(i.value * 100) / 100);
  const amounts = list.map((i) => Math.round(total * i.value) / 100);
  const pctSum = list.reduce((s, i) => s + i.value, 0);
  if (amounts.length && Math.abs(pctSum - 100) < 1e-9) {
    const rest = amounts.slice(0, -1).reduce((s, a) => s + a, 0);
    amounts[amounts.length - 1] = Math.round((total - rest) * 100) / 100;
  }
  return amounts;
}

export function installmentError(r: Invoice): string | null {
  const list = r.installments ?? [];
  if (list.length < 2) return "Add at least two installments.";
  if (list.some((i) => !(i.value > 0))) return "Every installment needs an amount above zero.";
  if (list.some((i) => !i.due)) return "Every installment needs a due date.";
  if (list.some((i) => i.due < r.issue)) return "Installments can't be due before the invoice is finalized.";
  for (let k = 1; k < list.length; k++) if (list[k]!.due < list[k - 1]!.due) return "Order installments by due date.";
  const total = invoiceTotals(r).total;
  if (r.installmentUnit === "percent") {
    const sum = Math.round(list.reduce((s, i) => s + i.value, 0) * 100) / 100;
    if (sum !== 100) return `Installments add up to ${sum}% — they must add up to 100%.`;
  } else {
    const sum = Math.round(list.reduce((s, i) => s + i.value, 0) * 100) / 100;
    if (sum !== total) return "Installments must add up to the invoice total.";
  }
  return null;
}

let seq = 0;
export const newInstallment = (due: string, value: number): Installment => ({ id: `ins_${Date.now().toString(36)}_${seq++}`, value, due, description: "" });

export const defaultInstallments = (issue: string) => [newInstallment(issue, 50), newInstallment(plusDays(issue, 30), 50)];

/* ---------- review & finalization ---------- */

export type FinalizeOptions = { send: boolean; includePaymentLink: boolean; scheduleAt?: string | undefined };

/** Problems that block the chosen finalization option (shown in the review modal). */
export function reviewErrors(r: Invoice, o: FinalizeOptions): string[] {
  const out = Object.values(validateInvoice(r)).filter(Boolean) as string[];
  if (o.send && !customerByName(r.customer)?.email) out.push("This customer has no email address — add one, or choose Finalize only.");
  if (o.scheduleAt !== undefined) {
    if (!o.scheduleAt) out.push("Pick a date and time for finalization.");
    else if (new Date(o.scheduleAt).getTime() <= DEMO_TODAY.getTime()) out.push("The finalization date must be in the future.");
  }
  return out;
}

/**
 * The invoice record after finalization (or scheduling). Finalizing never marks it paid; emailing
 * stays "Sending" until a real email service confirms delivery, which this demo doesn't have.
 */
export function finalizeInvoice(r: Invoice, o: FinalizeOptions): Invoice {
  const scheduled = !!o.scheduleAt;
  const issue = scheduled ? o.scheduleAt!.slice(0, 10) : todayIso();
  const terms = r.terms ?? DEFAULT_TERMS;
  const base: Invoice = {
    ...r,
    issue,
    due: dueFromTerms(terms, issue, r.due),
    includePaymentLink: o.includePaymentLink,
    sendOnFinalize: o.send,
  };
  if (scheduled) {
    return { ...base, status: "Scheduled", scheduledFor: o.scheduleAt, delivery: "Not sent" };
  }
  const { scheduledFor: _drop, ...rest } = base;
  return { ...rest, status: "Finalized", finalizedAt: DEMO_TODAY.toISOString(), delivery: o.send ? "Sending" : "Not sent" };
}

/** Back to an editable draft (cancel a scheduled finalization). */
export function cancelSchedule(r: Invoice): Invoice {
  const { scheduledFor: _drop, ...rest } = r;
  return { ...rest, status: "Draft" };
}
