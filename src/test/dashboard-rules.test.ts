import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { beforeEach, describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { formatMoney, totalsByCurrency } from "@/lib/money";
import { statusTone } from "@/lib/status";
import { inRange, daysAgo } from "@/lib/dates";
import { INITIAL_PRODUCTS, adjustStock, catalogStore, stockStatus } from "@/lib/demo/catalog";
import { INVOICES } from "@/lib/demo/invoices";

describe("money formatting", () => {
  it("formats naira with the ₦ sign and two decimals", () => {
    expect(formatMoney(24850000, "NGN")).toBe("₦24,850,000.00");
  });
  it("shows negative amounts with a minus sign", () => {
    expect(formatMoney(-1500, "NGN")).toBe("−₦1,500.00");
  });
  it("keeps totals separate per currency instead of adding them together", () => {
    const totals = totalsByCurrency(
      [{ a: 100, c: "NGN" as const }, { a: 50, c: "USD" as const }, { a: 25, c: "NGN" as const }],
      (r) => r.a, (r) => r.c,
    );
    expect(totals).toEqual({ NGN: 125, USD: 50 });
  });
});

describe("status colours", () => {
  it("never shows pending money movements as successful", () => {
    for (const s of ["Pending", "Processing", "Awaiting confirmation", "Refund pending"]) expect(statusTone(s)).toBe("pending");
  });
  it("marks failed as failed and overdue as a warning, so they never share a colour", () => {
    expect(statusTone("Failed")).toBe("danger");
    expect(statusTone("Cancelled")).toBe("danger");
    expect(statusTone("Overdue")).toBe("warning");
  });
});

describe("invoice numbers", () => {
  it("every sample invoice carries the GRV-INV- prefix", () => {
    for (const r of INVOICES) expect(r.id.startsWith("GRV-INV-")).toBe(true);
  });
});

describe("date filters", () => {
  it("includes something from 5 days ago in the last 7 days but not today", () => {
    expect(inRange(daysAgo(5), "Last 7 days")).toBe(true);
    expect(inRange(daysAgo(5), "Today")).toBe(false);
  });
});

describe("stock", () => {
  beforeEach(() => catalogStore.set(INITIAL_PRODUCTS));
  it("is low stock at or below the reorder level and out of stock at zero", () => {
    const p = INITIAL_PRODUCTS[0]!;
    const v = p.variants[0]!;
    expect(stockStatus(p, { ...v, available: v.reorderAt })).toBe("Low stock");
    expect(stockStatus(p, { ...v, available: 0 })).toBe("Out of stock");
    expect(stockStatus(p, { ...v, available: v.reorderAt + 1 })).toBe("In stock");
  });
  it("never lets stock go below zero", () => {
    adjustStock("SHEA-250", -999);
    const v = catalogStore.get().find((p) => p.id === "prd_02")!.variants[0]!;
    expect(v.available).toBe(0);
  });
});

describe("dashboard pages", () => {
  it("has a page for every menu item in the brief", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    for (const slug of ["balances", "transactions", "transfers", "payouts", "payment-links", "invoices", "virtual-accounts", "payments", "online-store", "orders", "products", "inventory", "pos"]) {
      // Payment Links moved its list into an index child; either the page itself or its index counts.
      expect([`/${slug}`, `/${slug}/`]).toContain(router.matchRoutes(`/${slug}`).at(-1)?.routeId);
    }
  });
});
