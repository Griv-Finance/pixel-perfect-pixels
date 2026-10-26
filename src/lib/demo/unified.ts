// SAMPLE DATA — one merged feed of every financial movement across the ledger, transfers and payouts.
import type { LedgerEntry } from "./ledger";
import type { Transfer } from "./transfers";
import type { Payout } from "./payouts";
import type { BalanceAccount } from "./accounts";
import type { Currency } from "@/lib/money";

export type TxnType =
  | "Payment"
  | "Transfer"
  | "Payout"
  | "Refund"
  | "Fee"
  | "Settlement"
  | "Reversal";
export type SourceChannel = "Dashboard" | "Checkout" | "API";

export type UnifiedTxn = {
  id: string;
  date: string;
  type: TxnType;
  status: string;
  currency: Currency;
  amount: number;
  fee: number;
  /** Customer for pay-ins/refunds, destination for transfers, recipient for payouts. */
  party: string;
  email?: string;
  /** Payment method: Card, Bank transfer, Mobile money… */
  method: string;
  /** Where it was initiated: Dashboard, Checkout or API. */
  sourceChannel: SourceChannel;
  payinType?: "Pay-in" | "Funding";
  note: string;
  parentId?: string;
  /** Transfers only: account names. */
  source?: string;
  destination?: string;
};

export const TYPE_TABS = ["All", "Pay-ins", "Transfers", "Payouts", "Refunds"] as const;
export const ADVANCED_TYPES = [
  "All",
  "Pay-in",
  "Transfer",
  "Payout",
  "Refund",
  "Funding",
  "Fee",
  "Settlement",
  "Reversal",
];
export const TXN_STATUSES = [
  "Successful",
  "Pending",
  "Failed",
  "Scheduled",
  "Refund pending",
  "Refunded",
];
export const SOURCE_CHANNELS: SourceChannel[] = ["Dashboard", "Checkout", "API"];
export const AMOUNT_OPS = ["Exactly", "Greater than", "Less than", "Between"] as const;
export type AmountOp = (typeof AMOUNT_OPS)[number];

export type TxnFilters = {
  type: string;
  status: string;
  method: string;
  sourceChannel: string;
  payinType: string;
  currency: string;
  recipient: string;
  account: string;
  originalRef: string;
  amountOp: AmountOp;
  amount: string;
  amountMin: string;
  amountMax: string;
  from: string;
  to: string;
  ref: string;
  keyword: string;
};

export const DEFAULT_TXN_FILTERS: TxnFilters = {
  type: "All",
  status: "All",
  method: "All",
  sourceChannel: "All",
  payinType: "All",
  currency: "All",
  recipient: "",
  account: "All",
  originalRef: "",
  amountOp: "Exactly",
  amount: "",
  amountMin: "",
  amountMax: "",
  from: "",
  to: "",
  ref: "",
  keyword: "",
};

/** Tab labels and the advanced Transaction Type values resolve against the same dataset. */
export function matchesTxnType(r: UnifiedTxn, type: string): boolean {
  switch (type) {
    case "All":
      return true;
    case "Pay-ins":
      return r.type === "Payment";
    case "Pay-in":
      return r.type === "Payment" && r.payinType !== "Funding";
    case "Funding":
      return r.type === "Payment" && r.payinType === "Funding";
    case "Transfers":
    case "Transfer":
      return r.type === "Transfer";
    case "Payouts":
    case "Payout":
      return r.type === "Payout";
    case "Refunds":
    case "Refund":
      return r.type === "Refund";
    default:
      return r.type === type;
  }
}

/** All advanced filters work together; nothing overwrites anything else. */
export function applyTxnFilters(rows: UnifiedTxn[], f: TxnFilters): UnifiedTxn[] {
  const kw = f.keyword.trim().toLowerCase();
  const amt = Number(f.amount);
  const min = Number(f.amountMin);
  const max = Number(f.amountMax);
  const recipient = f.recipient.trim().toLowerCase();
  const originalRef = f.originalRef.trim().toLowerCase();
  const ref = f.ref.trim().toLowerCase();
  return rows.filter((r) => {
    if (!matchesTxnType(r, f.type)) return false;
    if (f.status !== "All" && r.status !== f.status) return false;
    if (f.method !== "All" && r.method !== f.method) return false;
    if (f.sourceChannel !== "All" && r.sourceChannel !== f.sourceChannel) return false;
    if (f.payinType !== "All" && r.payinType !== f.payinType) return false;
    if (f.currency !== "All" && r.currency !== f.currency) return false;
    if (recipient && !r.party.toLowerCase().includes(recipient)) return false;
    if (
      f.account !== "All" &&
      r.type === "Transfer" &&
      r.source !== f.account &&
      r.destination !== f.account
    )
      return false;
    if (originalRef && !(r.parentId ?? "").toLowerCase().includes(originalRef)) return false;
    if (ref && !`${r.id} ${r.parentId ?? ""}`.toLowerCase().includes(ref)) return false;
    if (kw && !`${r.id} ${r.note} ${r.party} ${r.email ?? ""} ${r.parentId ?? ""}`.toLowerCase().includes(kw))
      return false;
    if (f.amount && f.amountOp !== "Between") {
      if (f.amountOp === "Exactly" && r.amount !== amt) return false;
      if (f.amountOp === "Greater than" && !(r.amount > amt)) return false;
      if (f.amountOp === "Less than" && !(r.amount < amt)) return false;
    }
    if (f.amountOp === "Between" && (f.amountMin || f.amountMax)) {
      if (f.amountMin && r.amount < min) return false;
      if (f.amountMax && r.amount > max) return false;
    }
    const day = new Date(r.date).toISOString().slice(0, 10);
    if (f.from && day < f.from) return false;
    if (f.to && day > f.to) return false;
    return true;
  });
}

/** How many advanced filters are away from their defaults (for the button badge and chips). */
export function countActiveTxnFilters(f: TxnFilters): number {
  let n = 0;
  for (const [k, v] of Object.entries(f)) {
    if (k === "amountOp") continue;
    if (["type", "status", "method", "sourceChannel", "payinType", "currency", "account"].includes(k)) {
      if (v !== "All") n++;
    } else if (typeof v === "string" && v.trim()) n++;
  }
  return n;
}

export function mergeTxns(
  ledger: LedgerEntry[],
  transfers: Transfer[],
  payouts: Payout[],
  accounts: BalanceAccount[],
): UnifiedTxn[] {
  const name = (id: string) => accounts.find((a) => a.id === id)?.name ?? id;
  const rows: UnifiedTxn[] = [];
  for (const r of ledger) {
    // Transfers and payouts have their own richer sample stores; the ledger's
    // placeholder rows of those types would only duplicate them.
    if (r.type === "Transfer" || r.type === "Payout") continue;
    rows.push({
      id: r.id,
      date: r.date,
      type: r.type as TxnType,
      status: r.status,
      currency: r.currency,
      amount: r.amount,
      fee: r.fee,
      party: r.customer,
      email: r.email,
      method: r.channel,
      sourceChannel: r.sourceChannel,
      ...(r.payinType ? { payinType: r.payinType } : {}),
      note:
        r.type === "Refund" && r.parentId
          ? `Refund of ${r.parentId}`
          : r.type === "Fee"
            ? "Griv processing fees"
            : r.type === "Settlement"
              ? "Settlement batch posted"
              : r.type === "Reversal"
                ? "Transaction reversal"
                : "",
      ...(r.parentId ? { parentId: r.parentId } : {}),
    });
  }
  for (const t of transfers)
    rows.push({
      id: t.id,
      date: t.date,
      type: "Transfer",
      status: t.status,
      currency: t.currency,
      amount: t.amount,
      fee: 0,
      party: name(t.destination),
      method: "Bank transfer",
      sourceChannel: "Dashboard",
      note: t.reference,
      source: name(t.source),
      destination: name(t.destination),
    });
  for (const p of payouts)
    rows.push({
      id: p.id,
      date: p.date,
      type: "Payout",
      status: p.status,
      currency: p.currency,
      amount: p.amount,
      fee: p.fee,
      party: p.recipient.name,
      method: p.recipient.channel,
      sourceChannel: "Dashboard",
      note: p.narration,
    });
  return rows.sort((a, b) => b.date.localeCompare(a.date));
}
