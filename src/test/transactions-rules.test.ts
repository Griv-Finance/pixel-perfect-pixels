import { describe, expect, it } from "vitest";
import {
  applyTxnFilters,
  countActiveTxnFilters,
  DEFAULT_PAGE_SIZE,
  DEFAULT_TXN_FILTERS,
  matchesTxnType,
  mergeTxns,
  ORIGINS,
  PAGE_SIZES,
  paginate,
  SHOW_FOR_TYPES,
  TXN_STATUSES,
  type TxnFilters,
} from "@/lib/demo/unified";
import { balanceHistory, liensFor, LIENS } from "@/lib/demo/balance-history";
import { INITIAL_LEDGER } from "@/lib/demo/ledger";
import { transfersStore } from "@/lib/demo/transfers";
import { payoutsStore } from "@/lib/demo/payouts";
import { INITIAL_ACCOUNTS } from "@/lib/demo/accounts";

const rows = mergeTxns(
  INITIAL_LEDGER,
  transfersStore.get(),
  payoutsStore.get(),
  INITIAL_ACCOUNTS,
);

describe("unified transactions", () => {
  it("merges pay-ins, transfers and payouts into one dataset without duplicates", () => {
    expect(rows.some((r) => r.type === "Payment")).toBe(true);
    expect(rows.some((r) => r.type === "Transfer")).toBe(true);
    expect(rows.some((r) => r.type === "Payout")).toBe(true);
    // The ledger's placeholder Transfer/Payout rows are replaced by the dedicated stores.
    expect(rows.filter((r) => r.type === "Transfer").every((r) => r.id.startsWith("TRF-"))).toBe(true);
    expect(rows.filter((r) => r.type === "Payout").every((r) => r.id.startsWith("PAY-"))).toBe(true);
  });

  it("type tabs filter the same dataset", () => {
    expect(rows.filter((r) => matchesTxnType(r, "Pay-ins")).every((r) => r.type === "Payment")).toBe(true);
    expect(rows.filter((r) => matchesTxnType(r, "Transfers")).length).toBe(transfersStore.get().length);
    expect(rows.filter((r) => matchesTxnType(r, "Payouts")).length).toBe(payoutsStore.get().length);
    expect(rows.filter((r) => matchesTxnType(r, "Refunds")).every((r) => r.type === "Refund")).toBe(true);
    expect(rows.filter((r) => matchesTxnType(r, "Funding")).every((r) => r.payinType === "Funding")).toBe(true);
  });
});

describe("advanced filters", () => {
  const pay = rows.find((r) => r.type === "Payment")!;
  it("amount operators filter exactly, above, below and between", () => {
    const exact = applyTxnFilters(rows, { ...DEFAULT_TXN_FILTERS, amountOp: "Exactly", amount: String(pay.amount) });
    expect(exact.length).toBeGreaterThan(0);
    expect(exact.every((r) => r.amount === pay.amount)).toBe(true);
    expect(applyTxnFilters(rows, { ...DEFAULT_TXN_FILTERS, amountOp: "Greater than", amount: "1000000" }).every((r) => r.amount > 1000000)).toBe(true);
    expect(applyTxnFilters(rows, { ...DEFAULT_TXN_FILTERS, amountOp: "Less than", amount: "1000" }).every((r) => r.amount < 1000)).toBe(true);
    expect(
      applyTxnFilters(rows, { ...DEFAULT_TXN_FILTERS, amountOp: "Between", amountMin: "1000", amountMax: "5000" }).every(
        (r) => r.amount >= 1000 && r.amount <= 5000,
      ),
    ).toBe(true);
  });

  it("combines currency, reference and status filters instead of overwriting each other", () => {
    const target = rows[0]!;
    const f: TxnFilters = {
      ...DEFAULT_TXN_FILTERS,
      currency: target.currency,
      ref: target.id,
      status: target.status,
    };
    const out = applyTxnFilters(rows, f);
    expect(out).toContainEqual(target);
    expect(out.every((r) => r.currency === target.currency)).toBe(true);
    expect(out.every((r) => r.status === target.status)).toBe(true);
  });

  it("date bounds keep every row inside the range", () => {
    const day = rows[0]!.date.slice(0, 10);
    const out = applyTxnFilters(rows, { ...DEFAULT_TXN_FILTERS, from: day, to: day });
    expect(out.length).toBeGreaterThan(0);
    expect(out.every((r) => r.date.slice(0, 10) === day)).toBe(true);
  });

  it("counts how many filters are away from their defaults", () => {
    expect(countActiveTxnFilters(DEFAULT_TXN_FILTERS)).toBe(0);
    expect(countActiveTxnFilters({ ...DEFAULT_TXN_FILTERS, status: "Failed", keyword: "ada" })).toBe(2);
    expect(countActiveTxnFilters({ ...DEFAULT_TXN_FILTERS, provider: "Verve", txnId: "TXN-GRV802400" })).toBe(2);
  });
});

describe("transactions page redesign (MailerSend-style)", () => {
  it("offers exactly the statuses from the brief", () => {
    expect(TXN_STATUSES).toEqual(["Successful", "Pending", "Processing", "Failed", "Cancelled", "Reversed"]);
  });

  it("the Show for selector maps deposits, withdrawals and transfers correctly", () => {
    expect(SHOW_FOR_TYPES).toEqual(["All transactions", "Deposits", "Withdrawals", "Transfers"]);
    expect(rows.filter((r) => matchesTxnType(r, "Deposits")).every((r) => r.type === "Payment")).toBe(true);
    expect(rows.filter((r) => matchesTxnType(r, "Withdrawals")).every((r) => r.type === "Payout")).toBe(true);
    expect(rows.filter((r) => matchesTxnType(r, "Transfers")).every((r) => r.type === "Transfer")).toBe(true);
    expect(matchesTxnType(rows[0]!, "All transactions")).toBe(true);
  });

  it("every row carries a unique internal transaction ID, a provider and a product channel", () => {
    expect(rows.every((r) => /^TXN-/.test(r.txnId))).toBe(true);
    expect(new Set(rows.map((r) => r.txnId)).size).toBe(rows.length);
    expect(rows.every((r) => r.provider.length > 0)).toBe(true);
    expect(rows.every((r) => (ORIGINS as readonly string[]).includes(r.origin))).toBe(true);
  });

  it("failed rows always carry a provider failure reason for the tooltip", () => {
    const failed = rows.filter((r) => r.status === "Failed");
    expect(failed.length).toBeGreaterThan(0);
    expect(failed.every((r) => !!r.reason)).toBe(true);
  });

  it("filters by provider, transaction ID, customer and accounts", () => {
    const card = rows.find((r) => r.provider === "Verve")!;
    expect(applyTxnFilters(rows, { ...DEFAULT_TXN_FILTERS, provider: "Verve" }).every((r) => r.provider === "Verve")).toBe(true);
    const byId = applyTxnFilters(rows, { ...DEFAULT_TXN_FILTERS, txnId: card.txnId });
    expect(byId).toContainEqual(card);
    expect(byId.every((r) => r.txnId === card.txnId)).toBe(true);
    const byEmail = applyTxnFilters(rows, { ...DEFAULT_TXN_FILTERS, recipient: rows[0]!.email! });
    expect(byEmail.length).toBeGreaterThan(0);
    expect(byEmail.every((r) => `${r.party} ${r.email ?? ""}`.toLowerCase().includes(rows[0]!.email!))).toBe(true);
    const tr = rows.find((r) => r.type === "Transfer")!;
    const bySource = applyTxnFilters(rows, { ...DEFAULT_TXN_FILTERS, sourceAccount: tr.source! });
    expect(bySource.length).toBeGreaterThan(0);
    expect(bySource.every((r) => r.source === tr.source)).toBe(true);
    const byDest = applyTxnFilters(rows, { ...DEFAULT_TXN_FILTERS, destinationAccount: tr.destination! });
    expect(byDest.every((r) => r.destination === tr.destination)).toBe(true);
  });

  it("paginates 25 per page by default and clamps out-of-range pages", () => {
    expect(PAGE_SIZES).toEqual([10, 25, 50, 100]);
    expect(DEFAULT_PAGE_SIZE).toBe(25);
    const first = paginate(rows, 1, 25);
    expect(first.from).toBe(1);
    expect(first.to).toBe(Math.min(25, rows.length));
    expect(first.rows.length).toBe(first.to - first.from + 1);
    expect(first.pages).toBe(Math.ceil(rows.length / 25));
    const last = paginate(rows, 999, 25);
    expect(last.page).toBe(last.pages);
    expect(last.to).toBe(rows.length);
    expect(paginate(rows, 2, 25).from).toBe(26);
  });
});

describe("balance history", () => {
  it("keeps running balances consistent and closes on today's available balance", () => {
    for (const currency of ["NGN", "USD", "GHS", "KES"] as const) {
      const moves = balanceHistory(currency);
      expect(moves.length).toBeGreaterThan(0);
      const closing = INITIAL_ACCOUNTS.filter((a) => a.currency === currency).reduce((s, a) => s + a.available, 0);
      expect(moves[0]!.balanceAfter).toBe(closing);
      for (let i = 0; i + 1 < moves.length; i++)
        expect(moves[i]!.balanceAfter - moves[i + 1]!.balanceAfter).toBeCloseTo(moves[i]!.amount, 2);
      expect(moves.every((m) => m.currency === currency)).toBe(true);
    }
  });

  it("keeps prototype liens separate per currency", () => {
    for (const l of LIENS) expect(liensFor(l.currency)).toContainEqual(l);
    expect(liensFor("NGN").every((l) => l.currency === "NGN")).toBe(true);
  });
});
