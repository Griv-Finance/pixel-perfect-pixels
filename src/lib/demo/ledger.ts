// SAMPLE DATA — Nova Retail Ltd., Lagos. Shared collection and treasury ledger.
import { createDemoStore, makeRef } from "@/lib/demo-store";
import { daysAgo } from "@/lib/dates";
import type { Currency } from "@/lib/money";
export type LedgerEntry = {
  id: string;
  date: string;
  customer: string;
  email: string;
  type: string;
  channel: string;
  currency: Currency;
  amount: number;
  fee: number;
  status: string;
  /** Why the provider declined it, for failed transactions. */
  reason?: string;
  /** Where the transaction was initiated from. */
  sourceChannel: "Dashboard" | "Checkout" | "API";
  /** Only for payments: a customer pay-in or the merchant funding their own balance. */
  payinType?: "Pay-in" | "Funding";
  accountId: string;
  parentId?: string;
};
export const CHANNELS = ["Card", "Bank transfer", "USSD", "Virtual account", "Payment link", "POS"];
const SOURCE_CHANNELS = ["Checkout", "API", "Dashboard"] as const;
const names = [
  "Ada Okafor",
  "Tunde Bakare",
  "Ama Mensah",
  "Wanjiku Mwangi",
  "Chidi Eze",
  "Fatima Bello",
  "Nova Retail Ltd.",
  "Lagos Logistics",
];
const types = [
  "Payment",
  "Payment",
  "Payment",
  "Payment",
  "Transfer",
  "Payout",
  "Refund",
  "Fee",
  "Settlement",
  "Reversal",
];
export const INITIAL_LEDGER: LedgerEntry[] = Array.from({ length: 60 }, (_, i) => {
  const type = types[i % types.length]!;
  const currency: Currency =
    i % 13 === 9 ? "USD" : i % 13 === 10 ? "GHS" : i % 13 === 11 ? "KES" : "NGN";
  const amount = currency === "NGN" ? 12500 + ((i * 17850) % 480000) : 45 + ((i * 137) % 2500);
  const status =
    i % 11 === 4
      ? "Failed"
      : i % 7 === 2
        ? "Pending"
        : i % 17 === 6
          ? "Processing"
          : type === "Refund"
            ? "Refunded"
            : type === "Reversal"
              ? "Reversed"
              : "Successful";
  return {
    id: `GRV-${String(802400 + i)}`,
    date: daysAgo(Math.floor(i / 3), 13 - (i % 4), i % 60),
    customer: names[i % names.length]!,
    email: `customer${i + 1}@example.com`,
    type,
    channel: type === "Payment" ? CHANNELS[i % 6]! : "Bank transfer",
    currency,
    amount,
    fee: type === "Payment" ? Math.round(amount * 0.015 * 100) / 100 : 0,
    status,
    sourceChannel: SOURCE_CHANNELS[i % 3]!,
    ...(type === "Payment"
      ? { payinType: (i % 9 === 3 ? "Funding" : "Pay-in") as "Funding" | "Pay-in" }
      : {}),
    accountId: currency === "NGN" ? "acc_ngn_main" : `acc_${currency.toLowerCase()}`,
  };
});
export const ledgerStore = createDemoStore(INITIAL_LEDGER);
export const useLedger = () => ledgerStore.use();
export const canRefund = (r: LedgerEntry, rows: LedgerEntry[]) =>
  r.type === "Payment" && r.status === "Successful" && !rows.some((x) => x.parentId === r.id);
export function requestRefund(id: string) {
  const rows = ledgerStore.get();
  const entry = rows.find((r) => r.id === id);
  if (!entry || !canRefund(entry, rows)) return;
  ledgerStore.set([
    {
      ...entry,
      id: makeRef("RFD"),
      date: daysAgo(0, 14),
      type: "Refund",
      status: "Refund pending",
      fee: 0,
      parentId: entry.id,
    },
    ...rows,
  ]);
}
export function retryPayment(id: string) {
  const entry = ledgerStore.get().find((r) => r.id === id);
  if (!entry || entry.status !== "Failed") return;
  ledgerStore.set((rows) => [
    { ...entry, id: makeRef("TRY"), date: daysAgo(0, 14), status: "Pending", parentId: entry.id },
    ...rows,
  ]);
}
