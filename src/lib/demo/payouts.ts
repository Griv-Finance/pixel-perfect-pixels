// SAMPLE DATA — external payouts and fictional recipients for Nova Retail Ltd., Lagos.
import { createDemoStore } from "@/lib/demo-store";
import { daysAgo } from "@/lib/dates";
import type { Currency } from "@/lib/money";
export type Recipient = {
  id: string;
  name: string;
  bank: string;
  account: string;
  currency: Currency;
  channel: "Bank transfer" | "Mobile money";
};
export const BANKS = ["Access Bank", "GTBank", "Zenith Bank", "First Bank", "UBA", "Moniepoint"];
export const recipientStore = createDemoStore<Recipient[]>([
  {
    id: "rec_1",
    name: "ADEBAYO LOGISTICS LTD",
    bank: "GTBank",
    account: "0123456789",
    currency: "NGN",
    channel: "Bank transfer",
  },
  {
    id: "rec_2",
    name: "CHIAMAKA OKAFOR",
    bank: "Access Bank",
    account: "0234567890",
    currency: "NGN",
    channel: "Bank transfer",
  },
  {
    id: "rec_3",
    name: "EKO PACKAGING LTD",
    bank: "Zenith Bank",
    account: "0345678901",
    currency: "NGN",
    channel: "Bank transfer",
  },
  {
    id: "rec_4",
    name: "AMA MENSAH",
    bank: "MTN MoMo",
    account: "0244567890",
    currency: "GHS",
    channel: "Mobile money",
  },
  {
    id: "rec_5",
    name: "KIPTOO DELIVERY",
    bank: "M-Pesa",
    account: "0712345678",
    currency: "KES",
    channel: "Mobile money",
  },
]);
export const payoutFee = (amount: number, currency: Currency = "NGN") =>
  currency === "NGN"
    ? amount <= 5000
      ? 10.75
      : amount <= 50000
        ? 26.88
        : 53.75
    : currency === "GHS"
      ? 2
      : 30;
export type Payout = {
  id: string;
  recipient: Recipient;
  source: string;
  amount: number;
  fee: number;
  currency: Currency;
  status: "Successful" | "Pending" | "Failed" | "Scheduled";
  date: string;
  narration: string;
  schedule?: string;
  reason?: string;
  retryOf?: string;
};
const recipients = recipientStore.get();
export const payoutsStore = createDemoStore<Payout[]>(
  Array.from({ length: 22 }, (_, i) => {
    const recipient = recipients[i % recipients.length]!;
    const amount =
      recipient.currency === "NGN"
        ? [245000, 4500, 32500, 780000][i % 4]!
        : recipient.currency === "GHS"
          ? 1250
          : 18500;
    return {
      id: `PAY-NR-${3068 - i}`,
      recipient,
      source:
        recipient.currency === "NGN"
          ? "acc_ngn_main"
          : recipient.currency === "GHS"
            ? "acc_ghs"
            : "acc_kes",
      amount,
      fee: payoutFee(amount, recipient.currency),
      currency: recipient.currency,
      status:
        i === 2 || i === 7
          ? "Failed"
          : i === 0 || i === 4
            ? "Pending"
            : i === 5
              ? "Scheduled"
              : "Successful",
      date: daysAgo(i, 11, 24),
      narration: [
        "Delivery partner settlement",
        "Store team reimbursement",
        "Packaging supplies",
        "Branch delivery services",
      ][i % 4]!,
      ...(i === 2 || i === 7
        ? {
            reason:
              "The destination bank could not accept this payout. The original attempt was not debited. Verify the recipient details before retrying.",
          }
        : {}),
      ...(i === 5 ? { schedule: "2026-10-25" } : {}),
    };
  }),
);
export type BulkRow = {
  line: number;
  name: string;
  bank: string;
  account: string;
  amount: number;
  narration: string;
  error: string;
};
/** RFC-4180 style quoted fields; all uploaded rows are explicitly NGN bank payouts. */
export function parsePayoutCsv(text: string): BulkRow[] {
  const records: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const input = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < input.length; i++) {
    const c = input[i]!;
    if (c === '"') {
      if (quoted && input[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && input[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((v) => v.trim())) records.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (quoted) throw new Error("Unclosed quoted field. Check the CSV formatting.");
  row.push(cell);
  if (row.some((v) => v.trim())) records.push(row);
  const header = records.shift()?.map((s) => s.trim().toLowerCase());
  const expected = ["name", "bank", "account", "amount", "narration"];
  if (!header || expected.some((h, i) => header[i] !== h) || header.length !== 5)
    throw new Error("Use the template columns: name,bank,account,amount,narration.");
  if (records.length > 500) throw new Error("Upload at most 500 payouts per batch.");
  return records.map((r, i) => {
    const [name = "", bank = "", account = "", raw = "", narration = ""] = r.map((v) => v.trim());
    const amount = Number(raw);
    const errors = [
      r.length !== 5 ? "Expected five columns" : "",
      !name ? "Recipient name required" : "",
      !BANKS.includes(bank) ? "Unsupported bank" : "",
      !/^\d{10}$/.test(account) ? "Account must be a 10-digit NUBAN" : "",
      !Number.isFinite(amount) || amount <= 0 || !/^\d+(\.\d{1,2})?$/.test(raw)
        ? "Amount must be positive with up to two decimals"
        : "",
      !narration ? "Narration required" : "",
    ].filter(Boolean);
    return { line: i + 2, name, bank, account, amount, narration, error: errors.join("; ") };
  });
}
