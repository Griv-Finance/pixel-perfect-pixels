/** SAMPLE DATA — fictional Nova Retail invoices; amounts in major currency units. */
import { daysAgo, DEMO_TODAY } from "@/lib/dates";
import type { Currency } from "@/lib/money";
import { CUSTOMERS } from "./customers";
export type InvoiceItem = { name: string; qty: number; price: number };
export type Invoice = {
  id: string;
  customer: string;
  currency: Currency;
  issue: string;
  due: string;
  items: InvoiceItem[];
  discount: number;
  vat: boolean;
  notes: string;
  instructions: string;
  status: "Draft" | "Sent" | "Partially paid" | "Paid" | "Cancelled";
  payments: { reference: string; amount: number; date: string }[];
  reminders: string[];
};
const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
export function invoiceTotals(r: Pick<Invoice, "items" | "discount" | "vat">) {
  const subtotal = round(r.items.reduce((s, x) => s + x.qty * x.price, 0));
  const discounted = round(Math.max(0, subtotal - r.discount));
  const tax = r.vat ? round(discounted * 0.075) : 0;
  return { subtotal, tax, total: round(discounted + tax) };
}
export const invoicePaid = (r: Invoice) => r.payments.reduce((s, p) => s + p.amount, 0);
export const invoiceStatus = (r: Invoice) =>
  r.status !== "Draft" &&
  r.status !== "Cancelled" &&
  invoicePaid(r) < invoiceTotals(r).total &&
  r.due < DEMO_TODAY.toISOString().slice(0, 10)
    ? "Overdue"
    : r.status;
export const PAYMENT_INSTRUCTIONS =
  "Demo bank details only — Wema Bank · Nova Retail Ltd. · 0123456789. Quote your invoice number as reference.";
export const INVOICES: Invoice[] = Array.from({ length: 9 }, (_, i) => {
  const r: Invoice = {
    id: `GRV-INV-${String(1041 + i).padStart(4, "0")}`,
    customer: CUSTOMERS[i % CUSTOMERS.length]!.name,
    currency: i === 7 ? "USD" : "NGN",
    issue: daysAgo(24 - i * 2).slice(0, 10),
    due: daysAgo(i < 3 ? 8 - i : -7 - i).slice(0, 10),
    items: [{ name: "Retail essentials bundle", qty: i + 1, price: i === 7 ? 120 : 25000 }],
    discount: 0,
    vat: true,
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
    payments: [],
    reminders: [],
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
