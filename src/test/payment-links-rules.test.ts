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

  it("keeps the listing on the original pricing options", () => {
    for (const link of PAYMENT_LINKS) {
      expect(["Fixed amount", "Customer enters amount"]).toContain(link.model);
      expect(LINK_STATUSES).toContain(link.status);
    }
  });
});
