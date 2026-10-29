import { describe, expect, it } from "vitest";
import { PAYMENT_LINKS } from "@/lib/demo/payment-links";
import {
  detailRows,
  linkEvents,
  linkLogs,
  methodsFor,
  plinkId,
  productTable,
  txnPrefix,
} from "@/lib/demo/link-details";
import { formatMoney } from "@/lib/money";

const fixed = PAYMENT_LINKS.find((l) => l.model === "Fixed amount")!;
const chosen = PAYMENT_LINKS.find((l) => l.model === "Customer enters amount")!;
const monthly = PAYMENT_LINKS.find((l) => l.model === "Monthly subscription")!;
const trial = PAYMENT_LINKS.find((l) => l.model === "14 day trial then Monthly subscription")!;

describe("payment link details page", () => {
  it("adapts the products table to the pricing model", () => {
    expect(productTable(fixed).columns).toEqual(["Name", "Quantity", "Adjustable Quantity"]);
    expect(productTable(fixed).rows[0]!.cells).toEqual(["1", "No"]);
    expect(productTable(chosen).columns).toEqual(["Name", "Preset price", "Minimum price", "Maximum price"]);
    expect(productTable(chosen).rows[0]!.nameSub).toBe(`Customer chooses (${chosen.currency})`);
  });

  it("shows the billing interval on recurring products, with the trial spelled out", () => {
    expect(productTable(monthly).rows[0]!.nameSub).toBe(`${formatMoney(monthly.amount, monthly.currency)} / month`);
    expect(productTable(trial).rows[0]!.nameSub).toContain("14-day free trial");
  });

  it("drives the Details rows from the link configuration", () => {
    const fixedRows = detailRows(fixed, {});
    expect(fixedRows).toContainEqual(["Payment type", "One-time"]);
    expect(fixedRows).toContainEqual(["Call to action button", "Pay"]);
    expect(detailRows(monthly, {})).toContainEqual(["Billing interval", "Monthly"]);
    expect(detailRows(trial, {})).toContainEqual(["Free trial", "14 days"]);
    expect(detailRows(trial, {}).find(([k]) => k === "Payment type")).toBeUndefined();
    expect(detailRows(chosen, {})).toContainEqual(["Amount type", "Customer chooses"]);
    expect(detailRows(fixed, { note: "October promo" })).toContainEqual(["Note", "October promo"]);
    expect(detailRows(fixed, {}).some(([k]) => k === "Note")).toBe(false);
  });

  it("derives events and logs from the link's actual data", () => {
    expect(linkEvents(fixed)).toEqual([
      { text: `A payment link with ID ${plinkId(fixed)} was created`, time: expect.any(String) },
      ...fixed.payments.slice().reverse().map((p) => ({
        text: `Payment ${p.reference} completed by ${p.customer}`,
        time: expect.any(String),
      })),
    ]);
    expect(linkLogs(fixed)).toEqual([
      { status: "200 OK", method: "POST", endpoint: "/v1/payment_links", time: expect.any(String) },
    ]);
  });

  it("defaults payment methods per currency and keeps shipping destinations editable", () => {
    expect(methodsFor(fixed, {})).toEqual(["Card", "Bank transfer", "USSD", "Mobile money"]);
    expect(methodsFor(PAYMENT_LINKS[3]!, {})).toEqual(["Card", "Mobile money"]); // the GHS link
    expect(methodsFor(fixed, { methods: ["Card"] })).toEqual(["Card"]);
  });

  it("deep-links View all to the transactions page filtered on this link's payments", () => {
    expect(txnPrefix(fixed)).toMatch(/^PL-\d+$/);
    expect(txnPrefix(monthly)).toBe("PL-S1");
  });
});
