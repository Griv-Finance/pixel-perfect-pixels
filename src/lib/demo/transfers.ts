// SAMPLE DATA — internal account movements for Nova Retail Ltd., Lagos.
import { createDemoStore } from "@/lib/demo-store";
import { daysAgo } from "@/lib/dates";
import type { Currency } from "@/lib/money";
export type Transfer = {
  id: string;
  source: string;
  destination: string;
  amount: number;
  currency: Currency;
  reference: string;
  status: "Successful" | "Pending" | "Failed";
  date: string;
  completed?: string;
  reason?: string;
};
export const transfersStore = createDemoStore<Transfer[]>(
  Array.from({ length: 16 }, (_, i) => ({
    id: `TRF-NR-${2048 - i}`,
    source: i % 3 === 0 ? "acc_ngn_payroll" : "acc_ngn_main",
    destination: i % 3 === 0 ? "acc_ngn_reserve" : "acc_ngn_payroll",
    amount: [1250000, 450000, 2800000, 750000, 320000, 1500000][i % 6]!,
    currency: "NGN",
    reference: [
      "October payroll funding",
      "Weekly tax provision",
      "Store operations float",
      "Team expense allocation",
    ][i % 4]!,
    status: i === 0 || i === 4 ? "Pending" : i === 3 ? "Failed" : "Successful",
    date: daysAgo(i * 2, 9 + (i % 6), 12),
    ...(i !== 0 && i !== 4 && i !== 3 ? { completed: daysAgo(i * 2, 9 + (i % 6), 14) } : {}),
    ...(i === 3
      ? { reason: "The source account was temporarily unavailable. No funds were moved." }
      : {}),
  })),
);
