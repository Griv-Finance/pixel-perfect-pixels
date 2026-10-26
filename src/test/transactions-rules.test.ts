import { describe, expect, it } from "vitest";
import {
  applyTxnFilters,
  countActiveTxnFilters,
  DEFAULT_TXN_FILTERS,
  matchesTxnType,
  mergeTxns,
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
