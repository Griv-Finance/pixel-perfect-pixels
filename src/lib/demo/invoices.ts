/** SAMPLE DATA — fictional Nova Retail invoices; amounts in major currency units. */
import { createDemoStore } from "@/lib/demo-store";
import { daysAgo, DEMO_TODAY } from "@/lib/dates";
import type { Currency } from "@/lib/money";
import { CUSTOMERS } from "./customers";
import { taxRatesStore, type TaxRate } from "./tax-rates";

export type Discount = { type: "fixed" | "percent"; value: number };

export type InvoiceItem = {
  name: string;
  qty: number;
  price: number;
  /** Optional longer description printed under the item name. */
  description?: string | undefined;
  /** Catalogue product this line came from, if any. */
  productId?: string | undefined;
  sku?: string | undefined;
  /** Tax rates for this line. Undefined = use the invoice's taxes; [] = no tax on this line. */
  taxRateIds?: string[] | undefined;
  /** Optional discount on this line only. */
  discount?: Discount | undefined;
};

export type InvoiceTerms = "receipt" | "7" | "14" | "30" | "60" | "custom";
export type CollectionMethod = "request" | "installments" | "autocharge";
export type Installment = { id: string; value: number; due: string; description: string };
export type DeliveryStatus = "Not sent" | "Sending" | "Sent" | "Failed";

export type Invoice = {
  id: string;
  customer: string;
  customerId?: string | undefined;
  currency: Currency;
  /** Recurring schedule for this customer; absent for one-off invoices. */
  frequency?: "Monthly" | "Weekly" | undefined;
  issue: string;
  due: string;
  items: InvoiceItem[];
  /** Invoice-level discount value; a fixed amount unless discountType is "percent". */
  discount: number;
  discountType?: "fixed" | "percent" | undefined;
  /** Tax rates applied to every line that doesn't set its own. */
  taxRateIds?: string[] | undefined;
  /** Legacy customer note and payment instructions (older sample invoices). */
  notes: string;
  instructions: string;
  /**
   * Lifecycle-ish status kept for the listing. Draft and Scheduled are editable; Finalized means
   * issued but not delivered by Griv; Sent means delivered; Cancelled means voided.
   */
  status: "Draft" | "Scheduled" | "Finalized" | "Sent" | "Partially paid" | "Paid" | "Cancelled";
  payments: { reference: string; amount: number; date: string }[];
  reminders: string[];
  /** How the customer is asked to pay. */
  billingMethod?: "Send invoice" | "Charge automatically" | undefined;
  /** Memo printed on the invoice. */
  memo?: string | undefined;
  /** Footer printed at the bottom of the invoice (payment instructions, business notes). */
  footer?: string | undefined;
  /** When the invoice was created (ISO datetime). */
  created?: string | undefined;

  /* ---- creation workspace settings ---- */
  terms?: InvoiceTerms | undefined;
  collection?: CollectionMethod | undefined;
  /** Payment methods offered on the hosted payment page. */
  paymentMethods?: string[] | undefined;
  installmentUnit?: "percent" | "amount" | undefined;
  installments?: Installment[] | undefined;
  customFields?: { label: string; value: string }[] | undefined;
  taxId?: string | undefined;
  template?: "classic" | "minimal" | undefined;
  pageSize?: "A4" | "Letter" | undefined;
  includePaymentLink?: boolean | undefined;
  /** Scheduled finalization moment (ISO datetime, local). */
  scheduledFor?: string | undefined;
  /** Send the invoice by email once it finalizes (scheduled invoices). */
  sendOnFinalize?: boolean | undefined;
  finalizedAt?: string | undefined;
  delivery?: DeliveryStatus | undefined;
};

const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : 0));

export type TaxLine = TaxRate & { amount: number };
export type InvoiceTotals = {
  lines: { gross: number; itemDiscount: number; net: number }[];
  /** Sum of line amounts after line discounts. */
  subtotal: number;
  itemDiscounts: number;
  /** Invoice-level discount amount. */
  discount: number;
  taxes: TaxLine[];
  /** Exclusive tax added on top of the subtotal (inclusive taxes are already in the prices). */
  tax: number;
  total: number;
};

/**
 * The one calculation model for every invoice view — editor, preview, review, PDF, email,
 * payment page and details. Line discount → invoice discount (spread across lines) → taxes.
 */
export function invoiceTotals(
  r: Pick<Invoice, "items" | "discount" | "discountType" | "taxRateIds">,
  rates: TaxRate[] = taxRatesStore.get(),
): InvoiceTotals {
  const lines = r.items.map((x) => {
    const gross = round((Number(x.qty) || 0) * (Number(x.price) || 0));
    const d = x.discount
      ? x.discount.type === "percent"
        ? (gross * clamp(x.discount.value, 0, 100)) / 100
        : clamp(x.discount.value, 0, gross)
      : 0;
    const itemDiscount = round(d);
    return { gross, itemDiscount, net: round(gross - itemDiscount), taxIds: x.taxRateIds ?? r.taxRateIds ?? [] };
  });
  const subtotal = round(lines.reduce((s, l) => s + l.net, 0));
  const discount = round(
    r.discountType === "percent" ? (subtotal * clamp(r.discount, 0, 100)) / 100 : clamp(r.discount, 0, subtotal),
  );
  const factor = subtotal > 0 ? (subtotal - discount) / subtotal : 0;
  const byId = new Map<string, number>();
  for (const l of lines) {
    const base = l.net * factor;
    for (const id of l.taxIds) {
      const t = rates.find((x) => x.id === id);
      if (!t) continue;
      const amt = t.inclusive ? base - base / (1 + t.rate / 100) : (base * t.rate) / 100;
      byId.set(id, (byId.get(id) ?? 0) + amt);
    }
  }
  const taxes: TaxLine[] = [...byId.entries()].map(([id, amount]) => ({ ...rates.find((x) => x.id === id)!, amount: round(amount) }));
  const tax = round(taxes.filter((t) => !t.inclusive).reduce((s, t) => s + t.amount, 0));
  return {
    lines: lines.map(({ gross, itemDiscount, net }) => ({ gross, itemDiscount, net })),
    subtotal,
    itemDiscounts: round(lines.reduce((s, l) => s + l.itemDiscount, 0)),
    discount,
    taxes,
    tax,
    total: round(subtotal - discount + tax),
  };
}

export const invoicePaid = (r: Invoice) => r.payments.reduce((s, p) => s + p.amount, 0);
const todayIso = () => DEMO_TODAY.toISOString().slice(0, 10);
const isIssued = (r: Invoice) => r.status !== "Draft" && r.status !== "Scheduled" && r.status !== "Cancelled";

/** Combined status shown in the listing: lifecycle, with Overdue derived from the due date and balance. */
export const invoiceStatus = (r: Invoice) =>
  isIssued(r) && invoicePaid(r) < invoiceTotals(r).total && r.due < todayIso() ? "Overdue" : r.status;

/* ---------- three separate statuses: lifecycle, payment, delivery ---------- */

export type LifecycleStatus = "Draft" | "Scheduled" | "Finalized" | "Voided";
export const lifecycleStatus = (r: Invoice): LifecycleStatus =>
  r.status === "Draft" ? "Draft" : r.status === "Scheduled" ? "Scheduled" : r.status === "Cancelled" ? "Voided" : "Finalized";

export type PaymentStatus = "Unpaid" | "Partially paid" | "Paid" | "Overdue";
/** Payment status for issued invoices; null for drafts, scheduled and voided invoices. */
export function paymentStatus(r: Invoice): PaymentStatus | null {
  if (lifecycleStatus(r) !== "Finalized") return null;
  const total = invoiceTotals(r).total;
  const paid = invoicePaid(r);
  if (total > 0 && paid >= total) return "Paid";
  if (r.due < todayIso()) return "Overdue";
  return paid > 0 ? "Partially paid" : "Unpaid";
}

/** Delivery status; older sample invoices that were sent count as delivered. */
export const deliveryStatus = (r: Invoice): DeliveryStatus =>
  r.delivery ?? (r.status === "Sent" || r.status === "Partially paid" || r.status === "Paid" ? "Sent" : "Not sent");

/** Memo / footer, falling back to the legacy note and payment-instruction fields. */
export const invoiceMemo = (r: Invoice) => r.memo ?? (r.notes || undefined);
export const invoiceFooter = (r: Invoice) => r.footer ?? (r.instructions || undefined);

export const PAYMENT_INSTRUCTIONS =
  "Demo bank details only — Wema Bank · Nova Retail Ltd. · 0123456789. Quote your invoice number as reference.";
export const INVOICES: Invoice[] = Array.from({ length: 9 }, (_, i) => {
  const r: Invoice = {
    id: `GRV-INV-${String(1041 + i).padStart(4, "0")}`,
    customer: CUSTOMERS[i % CUSTOMERS.length]!.name,
    customerId: CUSTOMERS[i % CUSTOMERS.length]!.id,
    currency: i === 7 ? "USD" : "NGN",
    issue: daysAgo(24 - i * 2).slice(0, 10),
    due: daysAgo(i < 3 ? 8 - i : -7 - i).slice(0, 10),
    items: [{ name: "Retail essentials bundle", qty: i + 1, price: i === 7 ? 120 : 25000 }],
    discount: 0,
    taxRateIds: ["txr_vat"],
    notes: "Thank you for choosing Nova Retail.",
    instructions: PAYMENT_INSTRUCTIONS,
    status: (
      [
        "Sent",
        "Partially paid",
        "Paid",
        "Draft",
        "Sent",
        "Paid",
        "Cancelled",
        "Sent",
        "Draft",
      ] as const
    )[i]!,
    ...((i === 0 || i === 7) ? { frequency: "Monthly" as const } : i === 4 ? { frequency: "Weekly" as const } : {}),
    payments: [],
    reminders: [],
    billingMethod: "Send invoice",
    ...(i === 0 ? { memo: "October bulk order for the Lagos store." } : {}),
    created: daysAgo(24 - i * 2, 9, i * 3),
  };
  if (r.status === "Paid" || r.status === "Partially paid")
    r.payments = [
      {
        reference: `PAY-INV-${1041 + i}`,
        amount: r.status === "Paid" ? invoiceTotals(r).total : 20000,
        date: daysAgo(3 + i),
      },
    ];
  return r;
});

/** Shared invoice store so the listing, editor and details page stay in sync. */
export const invoicesStore = createDemoStore<Invoice[]>(INVOICES);
export const useInvoices = () => invoicesStore.use();
export const getInvoice = (id: string) => invoicesStore.get().find((r) => r.id === id);
/** Next number in the GRV-INV- sequence; numbers are never reused. */
export const nextInvoiceId = (rows: Invoice[]) =>
  `GRV-INV-${String(Math.max(1040, ...rows.map((r) => Number(r.id.slice(8)) || 0)) + 1).padStart(4, "0")}`;
/** Insert or replace an invoice record. */
export const upsertInvoice = (r: Invoice) =>
  invoicesStore.set((all) => (all.some((x) => x.id === r.id) ? all.map((x) => (x.id === r.id ? r : x)) : [r, ...all]));
/** Editable invoices: drafts and scheduled invoices that haven't finalized yet. */
export const isEditable = (r: Invoice) => r.status === "Draft" || r.status === "Scheduled";
