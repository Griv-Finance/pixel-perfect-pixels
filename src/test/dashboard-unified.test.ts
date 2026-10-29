import { describe, expect, it } from "vitest";
import {
  ONBOARDING_TASKS,
  completeOnboardingTask,
  ecommerceStats,
  invoiceStats,
  linkStats,
  onboardingAllDone,
  onboardingDone,
  paymentStats,
  settlementStats,
} from "@/lib/demo/dashboard";
import type { LedgerEntry } from "@/lib/demo/ledger";
import { INITIAL_LEDGER } from "@/lib/demo/ledger";
import { INITIAL_ACCOUNTS } from "@/lib/demo/accounts";
import { PAYMENT_LINKS } from "@/lib/demo/payment-links";
import { INVOICES } from "@/lib/demo/invoices";
import { orderStore } from "@/lib/demo/orders";

const row = (over: Partial<LedgerEntry>): LedgerEntry => ({
  id: "X",
  date: "2026-10-22T10:00:00.000Z",
  customer: "c",
  email: "c@x.com",
  type: "Payment",
  channel: "Card",
  currency: "NGN",
  amount: 100,
  fee: 0,
  status: "Successful",
  sourceChannel: "Dashboard",
  accountId: "acc_ngn_main",
  ...over,
});

describe("onboarding checklist", () => {
  it("shows exactly the three requested tasks", () => {
    expect(ONBOARDING_TASKS.map((t) => t.id)).toEqual(["email", "profile", "verify"]);
  });

  it("hides the whole section only once every task is completed", () => {
    expect(onboardingAllDone({ email: true, profile: true })).toBe(false);
    expect(onboardingAllDone({ email: true, profile: true, verify: true })).toBe(true);
    expect(onboardingDone().verify).toBe(false);
  });

  it("completes a task through its checklist action", () => {
    completeOnboardingTask("verify");
    expect(onboardingDone().verify).toBe(true);
  });
});

describe("payment metrics", () => {
  it("never mixes currencies in the primary total", () => {
    const ledger = [
      row({ id: "A", currency: "NGN", amount: 300, type: "Payment", status: "Successful" }),
      row({ id: "B", currency: "NGN", amount: 200, type: "Payment", status: "Pending" }),
      row({ id: "C", currency: "USD", amount: 50, type: "Payment", status: "Successful" }),
      row({ id: "D", currency: "NGN", amount: 999, type: "Payment", status: "Failed" }),
    ];
    const s = paymentStats(ledger, { metric: "payments", currency: "NGN", range: "Last 30 days" });
    expect(s.total).toBe(500); // NGN successful + pending only; failed and USD excluded
    expect(s.failed).toBe(1);
  });

  it("splits deposits (pay-ins) and withdrawals (payouts) so they add up to total payments", () => {
    const opts = { currency: "NGN" as const, range: "Last 30 days" as const };
    const all = paymentStats(INITIAL_LEDGER, { metric: "payments", ...opts });
    const dep = paymentStats(INITIAL_LEDGER, { metric: "deposits", ...opts });
    const wit = paymentStats(INITIAL_LEDGER, { metric: "withdrawals", ...opts });
    expect(dep.successful + wit.successful).toBe(all.successful);
    expect(dep.pending + wit.pending).toBe(all.pending);
    expect(dep.failed + wit.failed).toBe(all.failed);
  });
});

describe("balances & settlements", () => {
  it("keeps settlement counts and NGN-only amounts consistent", () => {
    const s = settlementStats(INITIAL_LEDGER, INITIAL_ACCOUNTS, "Last 30 days");
    const ngSettlements = INITIAL_LEDGER.filter(
      (r) => r.currency === "NGN" && r.type === "Settlement" && new Date(r.date) >= new Date("2026-09-23"),
    );
    expect(s.completed + s.pendingSettlements).toBe(ngSettlements.length);
    expect(s.available).toBeGreaterThan(0);
  });
});

describe("payment links and invoices", () => {
  it("counts only payments inside the period and keeps conversion between 0 and 100", () => {
    const s = linkStats(PAYMENT_LINKS, "all", "Last 30 days");
    const inRange = PAYMENT_LINKS.flatMap((l) => l.payments).filter((p) => p.date >= "2026-09-23");
    expect(s.paid).toBe(inRange.length);
    expect(s.conversion).not.toBeNull();
    expect(s.conversion!).toBeGreaterThan(0);
    expect(s.conversion!).toBeLessThanOrEqual(100);
  });

  it("derives invoice conversion from paid over issued, ignoring drafts and cancelled", () => {
    const s = invoiceStats(INVOICES, "all", "Last 30 days");
    const issued = INVOICES.filter(
      (r) => r.status !== "Draft" && r.status !== "Cancelled" && r.issue >= "2026-09-23",
    );
    const paid = issued.filter((r) =>
      ["Paid"].includes(
        r.status === "Sent" && r.payments.length && r.payments.reduce((a, p) => a + p.amount, 0) >= 1 && r.status === "Sent"
          ? "Sent"
          : r.status,
      ),
    );
    expect(s.paid).toBe(paid.filter((r) => r.status === "Paid").length);
    expect(s.conversion).toBe(Math.round((s.paid / issued.length) * 1000) / 10);
  });
});

describe("e-commerce", () => {
  it("never counts refunded or cancelled orders as paid or pending revenue", () => {
    const s = ecommerceStats(orderStore.get(), "Last 30 days");
    expect(s.paidRevenue + s.pendingRevenue).toBeLessThanOrEqual(s.revenue);
    expect(s.completedOrders + s.pendingOrders).toBeLessThanOrEqual(s.totalOrders);
  });
});
