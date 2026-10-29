import { describe, expect, it } from "vitest";
import {
  LINK_ACTIONS,
  LINK_MODELS,
  LINK_STATUSES,
  PAYMENT_LINKS,
} from "@/lib/demo/payment-links";


describe("payment links redesign", () => {
  it("offers the new subscription price options", () => {
    expect(LINK_MODELS).toContain("Monthly subscription");
    expect(LINK_MODELS).toContain("14 day trial then Monthly subscription");
  });

  it("keeps the row menu to Copy url, Preview payment link, Change name, Edit, Copy to live mode, then a divided Deactivate", () => {
    expect(LINK_ACTIONS.map((a) => ("label" in a ? a.label : "divider"))).toEqual([
      "Copy url",
      "Preview payment link",
      "Change name",
      "Edit",
      "Copy to live mode",
      "divider",
      "Deactivate",
    ]);
    expect(LINK_ACTIONS[LINK_ACTIONS.length - 1]).toEqual({ key: "deactivate", label: "Deactivate" });
  });

  it("shows subscription prices per month, with the trial length spelled out", () => {
    const monthly = PAYMENT_LINKS.find((l) => l.model === "Monthly subscription")!;
    expect(monthly.currency).toBe("NGN");
    expect(priceLabel(monthly)).toBe(`${formatMoney(monthly.amount, monthly.currency)} /month`);
    const trial = PAYMENT_LINKS.find((l) => l.model === "14 day trial then Monthly subscription")!;
    expect(trial.trialDays).toBe(14);
    expect(priceLabel(trial)).toBe(`${formatMoney(trial.amount, trial.currency)} /month · 14-day trial`);
  });

  it("keeps sample subscription links alongside the fixed and customer-entered pricing", () => {
    expect(PAYMENT_LINKS.filter((l) => l.model === "Fixed amount" || l.model === "Customer enters amount").length)
      .toBeGreaterThanOrEqual(7);
    expect(PAYMENT_LINKS.filter((l) => l.model === "Monthly subscription").length).toBe(1);
    expect(PAYMENT_LINKS.filter((l) => l.model === "14 day trial then Monthly subscription").length).toBe(1);
    for (const link of PAYMENT_LINKS) {
      expect(LINK_STATUSES).toContain(link.status);
    }
  });
});
