import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";
import {
  CHECKLIST_TASKS,
  DASHBOARD_STATES,
  FEATURE_CARDS,
  NEW_MERCHANT_FEATURES,
  QUICK_ACTIONS,
  RESOURCES,
  checklistProgress,
  moneySeries,
  rowsInPreviousWindow,
  getDashboardState,
  setDashboardState,
  sumMoney,
} from "@/lib/demo/dashboard";
import type { LedgerEntry } from "@/lib/demo/ledger";

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

describe("dashboard preview states", () => {
  it("offers exactly the three requested preview states", () => {
    expect([...DASHBOARD_STATES]).toEqual(["new", "verified", "active"]);
  });

  it("switches the preview state without touching real merchant data", () => {
    setDashboardState("verified");
    expect(getDashboardState()).toBe("verified");
    setDashboardState("new");
    expect(getDashboardState()).toBe("new");
  });

  it("grows checklist progress from new to verified to active", () => {
    const p = checklistProgress("new");
    const v = checklistProgress("verified");
    const a = checklistProgress("active");
    expect(p.done).toBeLessThan(v.done);
    expect(v.done).toBeLessThan(a.done);
    expect(a.done).toBe(a.total);
    // New merchant: verification (compliance) not yet done.
    expect(CHECKLIST_TASKS.find((t) => t.id === "verify")!.done.new).toBe(false);
    // Verified merchant: compliance done, setup incomplete.
    expect(CHECKLIST_TASKS.find((t) => t.id === "verify")!.done.verified).toBe(true);
    expect(CHECKLIST_TASKS.find((t) => t.id === "methods")!.done.verified).toBe(false);
  });

  it("sends every checklist, quick-action and feature-card link to a real page", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    const hrefs = [
      ...CHECKLIST_TASKS.flatMap((t) => (t.href ? [t.href] : [])),
      ...QUICK_ACTIONS.map((q) => q.href),
      ...FEATURE_CARDS.flatMap((f) => (f.href ? [f.href] : [])),
    ];
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(router.matchRoutes(href).at(-1)?.routeId).toBe(href);
    }
  });

  it("always keeps honest previews or real pages for incomplete tasks", () => {
    for (const t of CHECKLIST_TASKS) {
      if (!Object.values(t.done).every(Boolean)) expect(t.href || t.preview).toBeTruthy();
    }
    for (const r of RESOURCES) expect(r.preview).toBeTruthy();
    expect(FEATURE_CARDS.find((f) => f.id === "dev")!.href).toBeUndefined();
  });

  it("sends the three new-merchant feature cards to real pages", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    expect(NEW_MERCHANT_FEATURES).toHaveLength(3);
    for (const f of NEW_MERCHANT_FEATURES) {
      expect(router.matchRoutes(f.href).at(-1)?.routeId).toBe(f.href);
    }
  });
});

describe("active-dashboard money rules", () => {
  it("never sums amounts across currencies", () => {
    const rows = [row({}), row({ id: "B", currency: "USD", amount: 50 })];
    expect(sumMoney(rows, ["Payment"])).toBe(100);
  });

  it("only counts successful rows as money movement", () => {
    const rows = [row({}), row({ id: "B", status: "Pending", amount: 400 })];
    expect(sumMoney(rows, ["Payment"])).toBe(100);
  });

  it("builds the previous window without overlapping the current one", () => {
    const cur = row({});
    const currentWindow = row({ id: "B", date: "2026-10-21T10:00:00.000Z" }); // 1 day ago
    const previousWindow = row({ id: "D", date: "2026-10-14T10:00:00.000Z" }); // 8 days ago
    const outside = row({ id: "C", date: "2026-10-05T10:00:00.000Z" }); // 17 days ago
    expect(rowsInPreviousWindow([cur, currentWindow, outside], "Last 7 days")).toEqual([]);
    expect(rowsInPreviousWindow([previousWindow], "Last 7 days")).toEqual([previousWindow]);
  });

  it("charts Today as hourly buckets and other ranges as days", () => {
    expect(moneySeries([row({})], "Today")[0]!.key).toBe("8:00");
    expect(moneySeries([row({})], "Today")).toHaveLength(8);
    const week = moneySeries([row({ date: "2026-10-21T10:00:00.000Z" })], "Last 7 days");
    expect(week).toHaveLength(7);
    expect(week.at(-1)!.key).toBe("22 Oct");
    expect(week.at(-2)!.key).toBe("21 Oct");
  });
});
