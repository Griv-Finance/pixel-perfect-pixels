/** Helpers driving the Stripe-style invoice details page, derived from the actual invoice record. */
import { createDemoStore } from "@/lib/demo-store";
import { DEMO_TODAY, fmtDateTime } from "@/lib/dates";
import { formatMoney, type Currency } from "@/lib/money";
import { deliveryStatus, invoicePaid, invoiceStatus, invoiceTotals, lifecycleStatus, type Invoice } from "./invoices";
import { taxLabel } from "./tax-rates";

/* ---------- per-invoice extras (notes, metadata, credit notes, pending payments) ---------- */

export type CreditNote = { id: string; amount: number; reason: string; date: string };
export type PendingPayment = { reference: string; amount: number; date: string; method: string };
export type InvoiceExtras = {
  notes?: { text: string; time: string }[];
  metadata?: Record<string, string>;
  creditNotes?: CreditNote[];
  /** Externally recorded payments kept pending until a real provider confirms (demo rule). */
  pendingPayments?: PendingPayment[];
};

export const invoiceExtrasStore = createDemoStore<Record<string, InvoiceExtras>>({});
export const useInvoiceExtras = () => invoiceExtrasStore.use();
export const getInvoiceExtras = (id: string) => invoiceExtrasStore.get()[id] ?? {};
export const setInvoiceExtras = (id: string, patch: InvoiceExtras) =>
  invoiceExtrasStore.set((all) => ({ ...all, [id]: { ...all[id], ...patch } }));

/* ---------- identity ---------- */

/** Pseudo hosted-invoice id derived from the invoice number. */
export const invId = (r: Pick<Invoice, "id">) =>
  `in_${r.id.replace(/^GRV-INV-/, "").toLowerCase()}4EHykZ4sjbEKrvTtx`;
export const hostedUrl = (r: Pick<Invoice, "id">) => `https://invoice.griv.africa/i/${invId(r)}`;

/* ---------- status-aware actions ---------- */

export type InvoiceActionKey =
  | "edit"
  | "send"
  | "charge"
  | "download-pdf"
  | "duplicate"
  | "copy-link"
  | "mark-paid"
  | "record-payment"
  | "credit-note"
  | "void"
  | "delete-draft"
  | "cancel-schedule"
  | "view-page";

/** Actions permitted for the invoice's current status, in menu order. */
export function availableActions(r: Invoice): InvoiceActionKey[] {
  const status = invoiceStatus(r);
  switch (status) {
    case "Draft":
      return ["edit", "send", "download-pdf", "duplicate", "delete-draft"];
    case "Scheduled":
      return ["edit", "cancel-schedule", "download-pdf", "duplicate"];
    // Finalized invoices are issued financial documents: no editing of amounts — void or credit instead.
    case "Finalized":
    case "Sent":
    case "Overdue":
      return ["send", "charge", "download-pdf", "duplicate", "copy-link", "view-page", "mark-paid", "record-payment", "void"];
    case "Partially paid":
      return ["send", "charge", "download-pdf", "duplicate", "copy-link", "view-page", "record-payment", "void"];
    case "Paid":
      return ["download-pdf", "duplicate", "copy-link", "view-page", "credit-note"];
    case "Cancelled":
      return ["download-pdf", "duplicate"];
  }
  return [];
}

/* ---------- summary rows, driven by the record ---------- */

export function summaryRows(r: Invoice): [string, string][] {
  const rows: [string, string][] = [
    ["Invoice number", r.id],
    ["Currency", r.currency],
    ["Due date", r.due],
    ["Billing method", r.billingMethod ?? "Send invoice"],
  ];
  if (r.memo) rows.push(["Memo", r.memo]);
  const taxes = invoiceTotals(r).taxes;
  rows.push(["Tax calculation", taxes.length ? taxes.map(taxLabel).join(", ") : "No tax rate applied"]);
  return rows;
}

/* ---------- payments table ---------- */

export type PaymentRow = {
  reference: string;
  amount: number;
  status: "Succeeded" | "Pending";
  description: string;
  date: string;
  currency: Currency;
};

export function paymentRows(r: Invoice): PaymentRow[] {
  const rows: PaymentRow[] = r.payments.map((p) => ({
    reference: p.reference,
    amount: p.amount,
    status: "Succeeded",
    description: `Payment for ${r.id}`,
    date: p.date,
    currency: r.currency,
  }));
  for (const p of getInvoiceExtras(r.id).pendingPayments ?? []) {
    rows.push({
      reference: p.reference,
      amount: p.amount,
      status: "Pending",
      description: `External payment for ${r.id} — awaiting confirmation`,
      date: p.date,
      currency: r.currency,
    });
  }
  return rows.reverse();
}

export const outstanding = (r: Invoice) =>
  Math.max(0, invoiceTotals(r).total - invoicePaid(r));

/* ---------- credit notes ---------- */

/** Remaining balance that may still be credited on a paid invoice. */
export const creditNoteRemaining = (r: Invoice) => {
  const used = (getInvoiceExtras(r.id).creditNotes ?? []).reduce((s, c) => s + c.amount, 0);
  return Math.max(0, invoicePaid(r) - used);
};

export const nextCreditNoteId = (extras: InvoiceExtras, r: Pick<Invoice, "id">) =>
  `CN-${r.id.replace(/^GRV-INV-/, "")}-${String((extras.creditNotes?.length ?? 0) + 1).padStart(2, "0")}`;

/* ---------- activity, events and logs — derived from the record ---------- */

const plusMinutes = (iso: string, minutes: number) =>
  new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();

export type ActivityItem = { text: string; time: string };

export function invoiceActivity(r: Invoice): ActivityItem[] {
  const items: ActivityItem[] = [];
  const created = r.created ?? `${r.issue}T09:00:00`;
  items.push({ text: `Invoice ${r.id} created`, time: fmtDateTime(created) });
  const status = invoiceStatus(r);
  const finalizedAt = r.finalizedAt ?? plusMinutes(created, 10);
  if (r.status === "Scheduled" && r.scheduledFor) {
    items.push({ text: `Finalization scheduled for ${fmtDateTime(r.scheduledFor)}`, time: fmtDateTime(created) });
  }
  if (lifecycleStatus(r) === "Finalized" || (status === "Cancelled" && r.finalizedAt)) {
    items.push({ text: "Invoice finalized", time: fmtDateTime(finalizedAt) });
    items.push({ text: "Invoice payment page was created", time: fmtDateTime(plusMinutes(finalizedAt, 1)) });
    const d = deliveryStatus(r);
    if (d === "Sent") items.push({ text: "Invoice sent", time: fmtDateTime(plusMinutes(finalizedAt, 5)) });
    if (d === "Sending") items.push({ text: "Invoice email queued — not delivered (no email service in this demo)", time: fmtDateTime(plusMinutes(finalizedAt, 1)) });
    if (d === "Failed") items.push({ text: "Invoice email failed to deliver", time: fmtDateTime(plusMinutes(finalizedAt, 2)) });
  } else if (status === "Cancelled") {
    items.push({ text: "Invoice finalized", time: fmtDateTime(finalizedAt) });
    items.push({ text: "Invoice sent", time: fmtDateTime(plusMinutes(created, 15)) });
  }
  for (const p of [...(getInvoiceExtras(r.id).pendingPayments ?? [])].reverse()) {
    items.push({ text: `External payment ${p.reference} recorded — pending confirmation`, time: fmtDateTime(p.date) });
  }
  for (const p of [...r.payments].reverse()) {
    items.push({ text: `Payment ${p.reference} succeeded`, time: fmtDateTime(p.date) });
  }
  if (status === "Paid") items.push({ text: "Invoice paid", time: fmtDateTime(r.payments[0]?.date ?? created) });
  if (status === "Overdue") items.push({ text: "Invoice became overdue", time: fmtDateTime(`${r.due}T12:00:00`) });
  if (status === "Cancelled") items.push({ text: "Invoice was voided", time: fmtDateTime(DEMO_TODAY.toISOString()) });
  const extras = getInvoiceExtras(r.id);
  for (const note of [...(extras.notes ?? [])].reverse()) {
    items.push({ text: `Note added — ${note.text}`, time: fmtDateTime(note.time) });
  }
  for (const c of [...(extras.creditNotes ?? [])].reverse()) {
    items.push({ text: `Credit note ${c.id} issued for ${formatMoney(c.amount, r.currency)}`, time: fmtDateTime(c.date) });
  }
  return items.reverse();
}

export function invoiceEvents(r: Invoice): ActivityItem[] {
  const created = r.created ?? `${r.issue}T09:00:00`;
  const events: ActivityItem[] = [{ text: "invoice.created", time: fmtDateTime(created) }];
  const status = invoiceStatus(r);
  if (lifecycleStatus(r) === "Finalized" || status === "Cancelled") {
    const at = r.finalizedAt ?? plusMinutes(created, 10);
    events.push({ text: "invoice.finalized", time: fmtDateTime(at) });
    if (deliveryStatus(r) === "Sent" || status === "Cancelled") events.push({ text: "invoice.sent", time: fmtDateTime(plusMinutes(at, 5)) });
    events.push({ text: "invoice.payment_pending", time: fmtDateTime(plusMinutes(at, 10)) });
  }
  for (const p of [...(getInvoiceExtras(r.id).pendingPayments ?? [])].reverse()) {
    events.push({ text: "invoice.payment_pending", time: fmtDateTime(p.date) });
  }
  for (const p of [...r.payments].reverse()) {
    events.push({ text: "invoice.payment_succeeded", time: fmtDateTime(p.date) });
  }
  if (status === "Paid") events.push({ text: "invoice.paid", time: fmtDateTime(r.payments[0]?.date ?? created) });
  if (status === "Cancelled") events.push({ text: "invoice.voided", time: fmtDateTime(DEMO_TODAY.toISOString()) });
  return events.reverse();
}

export function invoiceLogs(r: Invoice): { status: string; method: string; endpoint: string; time: string }[] {
  const created = r.created ?? `${r.issue}T09:00:00`;
  const id = invId(r);
  const logs = [{ status: "200 OK", method: "POST", endpoint: "/v1/invoices", time: fmtDateTime(created) }];
  const status = invoiceStatus(r);
  if (lifecycleStatus(r) === "Finalized" || status === "Cancelled") {
    const at = r.finalizedAt ?? plusMinutes(created, 10);
    logs.push({ status: "200 OK", method: "POST", endpoint: `/v1/invoices/${id}/finalize`, time: fmtDateTime(at) });
    if (deliveryStatus(r) === "Sent" || status === "Cancelled")
      logs.push({ status: "200 OK", method: "POST", endpoint: `/v1/invoices/${id}/send`, time: fmtDateTime(plusMinutes(at, 5)) });
    logs.push({ status: "200 OK", method: "POST", endpoint: "/v1/payment_pages", time: fmtDateTime(plusMinutes(at, 10)) });
  }
  for (const p of [...r.payments].reverse()) {
    logs.push({ status: "200 OK", method: "POST", endpoint: "/v1/payments", time: fmtDateTime(p.date) });
  }
  return logs.reverse();
}

/** Reference prefix that finds this invoice's payments on the Transactions page. */
export function txnPrefix(r: Pick<Invoice, "id">) {
  return r.id.replace(/^GRV-INV-/, "INV-");
}
