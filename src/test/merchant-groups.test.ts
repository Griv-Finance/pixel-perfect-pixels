import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { MERCHANT_GROUPS, featurePlacement, groupFeatures } from "@/lib/merchant-groups";

// Features in Griv's main menu today. Previews must never show anything else.
const EXISTING = [
  "Dashboard", "Balances", "Transactions", "Transfers", "Payouts", "Payment Links", "Invoices",
  "Virtual Accounts", "Payments", "Online Store", "Orders", "Products", "Inventory", "POS", "Customers",
  "Suppliers", "Scheduled Payments", "Recurring Payments", "Cards",
  "Insights", "Credit", "AI", "Settings", "Team", "Developers", "Audit Logs",
];

describe("Merchant group previews", () => {
  it("has exactly the ten requested groups", () => {
    expect(MERCHANT_GROUPS.map((g) => g.name)).toEqual([
      "Full Business", "Online Store", "In-Store Retail (POS)", "Online Store + POS", "Payments & Collections",
      "Service Business", "Wholesale & Distribution", "E-commerce & Marketplace", "Payouts & Transfers",
      "Subscriptions & Recurring Payments",
    ]);
  });

  it("only uses features that already exist in Griv", () => {
    for (const g of MERCHANT_GROUPS) {
      for (const f of [...groupFeatures(g), ...g.addOns]) expect(EXISTING).toContain(f);
    }
  });

  it("treats Payment Links and Invoices as shared features, not groups", () => {
    const names = MERCHANT_GROUPS.map((g) => g.name);
    expect(names).not.toContain("Payment Links");
    expect(names).not.toContain("Invoices");
    for (const f of ["Payment Links", "Invoices"] as const) {
      expect(MERCHANT_GROUPS.filter((g) => featurePlacement(g, f) !== null).length).toBeGreaterThan(1);
    }
  });

  it("does not list any feature twice in one group's menu", () => {
    for (const g of MERCHANT_GROUPS) {
      const all = [...groupFeatures(g), ...g.addOns];
      expect(new Set(all).size).toBe(all.length);
    }
  });

  it("opens a page for the landing, comparison and every group", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    expect(router.matchRoutes("/merchant-groups").at(-1)?.routeId).toBe("/merchant-groups/");
    expect(router.matchRoutes("/merchant-groups/compare").at(-1)?.routeId).toBe("/merchant-groups/compare");
    for (const g of MERCHANT_GROUPS) {
      expect(router.matchRoutes(`/merchant-groups/${g.slug}`).at(-1)?.routeId).toBe("/merchant-groups/$group");
    }
  });
});
