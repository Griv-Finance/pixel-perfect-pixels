import { describe, expect, it } from "vitest";
import { deliveryStatus, invoiceTotals, lifecycleStatus, paymentStatus, type Invoice } from "@/lib/demo/invoices";
import {
  blankInvoice,
  cancelSchedule,
  catalogOptions,
  changeCurrency,
  dueFromTerms,
  finalizeInvoice,
  hasItemAmounts,
  installmentAmounts,
  installmentError,
  itemErrors,
  newInstallment,
  reviewErrors,
  validateInvoice,
} from "@/lib/demo/invoice-builder";
import type { TaxRate } from "@/lib/demo/tax-rates";

const VAT: TaxRate = { id: "t_ex", name: "VAT", rate: 7.5, inclusive: false };
const VAT_IN: TaxRate = { id: "t_in", name: "VAT", rate: 7.5, inclusive: true };

/** A valid invoice for Chioma Eze (has an email) with one ₦10,000 item. */
const ready = (patch: Partial<Invoice> = {}): Invoice => ({
  ...blankInvoice("GRV-INV-9001"),
  customer: "Chioma Eze",
  items: [{ name: "Consulting", qty: 1, price: 10_000 }],
  ...patch,
});

describe("invoice totals", () => {
  it("applies a percentage discount before exclusive tax", () => {
    const t = invoiceTotals({ items: [{ name: "A", qty: 2, price: 10_000 }], discount: 10, discountType: "percent", taxRateIds: ["t_ex"] }, [VAT]);
    expect(t.subtotal).toBe(20_000);
    expect(t.discount).toBe(2_000);
    expect(t.tax).toBe(1_350);
    expect(t.total).toBe(19_350);
  });

  it("caps a fixed discount at the subtotal", () => {
    const t = invoiceTotals({ items: [{ name: "A", qty: 1, price: 5_000 }], discount: 9_000, discountType: "fixed", taxRateIds: [] }, []);
    expect(t.discount).toBe(5_000);
    expect(t.total).toBe(0);
  });

  it("shows inclusive tax without adding it to the total", () => {
    const t = invoiceTotals({ items: [{ name: "A", qty: 1, price: 10_750 }], discount: 0, taxRateIds: ["t_in"] }, [VAT_IN]);
    expect(t.taxes[0]!.amount).toBe(750);
    expect(t.total).toBe(10_750);
  });

  it("lets an item opt out of the invoice tax and carry its own discount", () => {
    const t = invoiceTotals(
      {
        items: [
          { name: "Taxed", qty: 1, price: 10_000 },
          { name: "Exempt", qty: 1, price: 10_000, taxRateIds: [], discount: { type: "percent", value: 50 } },
        ],
        discount: 0,
        taxRateIds: ["t_ex"],
      },
      [VAT],
    );
    expect(t.subtotal).toBe(15_000);
    expect(t.itemDiscounts).toBe(5_000);
    expect(t.tax).toBe(750);
    expect(t.total).toBe(15_750);
  });
});

describe("invoice due dates", () => {
  it("counts terms from the finalization date", () => {
    expect(dueFromTerms("receipt", "2026-10-22")).toBe("2026-10-22");
    expect(dueFromTerms("30", "2026-10-22")).toBe("2026-11-21");
    expect(dueFromTerms("60", "2026-10-22")).toBe("2026-12-21");
    expect(dueFromTerms("custom", "2026-10-22", "2026-12-01")).toBe("2026-12-01");
  });

  it("defaults new invoices to 30-day terms", () => {
    const r = blankInvoice("GRV-INV-9002");
    expect(r.terms).toBe("30");
    expect(r.due).toBe("2026-11-21");
  });

  it("rejects a custom due date before the issue date", () => {
    expect(validateInvoice(ready({ terms: "custom", due: "2026-10-01" })).due).toBeDefined();
  });
});

describe("new invoices start empty", () => {
  it("has no sample customer, items or bank details", () => {
    const r = blankInvoice("GRV-INV-9003");
    expect(r.customer).toBe("");
    expect(r.items).toHaveLength(0);
    expect(r.instructions).toBe("");
    expect(r.taxRateIds).toEqual([]);
  });
});

describe("currency changes", () => {
  it("needs confirmation once items have amounts, then clears items without converting", () => {
    const r = ready({ discount: 500, discountType: "fixed" });
    expect(hasItemAmounts(r)).toBe(true);
    const usd = changeCurrency(r, "USD");
    expect(usd.currency).toBe("USD");
    expect(usd.items).toHaveLength(0);
    expect(usd.discount).toBe(0);
    expect(usd.paymentMethods).toEqual(["Card"]);
  });

  it("only offers NGN-priced catalogue products on NGN invoices", () => {
    expect(catalogOptions("NGN").length).toBeGreaterThan(0);
    expect(catalogOptions("USD")).toHaveLength(0);
  });
});

describe("line item validation", () => {
  it("requires a name, a whole quantity above zero and a positive price", () => {
    expect(itemErrors({ name: "", qty: 0, price: 0 })).toMatchObject({ name: expect.any(String), qty: expect.any(String), price: expect.any(String) });
    expect(itemErrors({ name: "A", qty: 1.5, price: 10 }).qty).toBeDefined();
    expect(itemErrors({ name: "A", qty: 1, price: 10 })).toEqual({});
  });

  it("needs a customer and at least one item before review", () => {
    const e = validateInvoice(blankInvoice("GRV-INV-9004"));
    expect(e.customer).toBeDefined();
    expect(e.items).toBeDefined();
    expect(validateInvoice(ready())).toEqual({});
  });
});

describe("installments", () => {
  it("must add up to 100% when split by percentage", () => {
    const r = ready({ collection: "installments", installmentUnit: "percent", installments: [newInstallment("2026-10-22", 60), newInstallment("2026-11-22", 30)] });
    expect(installmentError(r)).toMatch(/100%/);
    const ok = ready({ collection: "installments", installmentUnit: "percent", installments: [newInstallment("2026-10-22", 60), newInstallment("2026-11-22", 40)] });
    expect(installmentError(ok)).toBeNull();
    expect(installmentAmounts(ok)).toEqual([6_000, 4_000]);
  });

  it("must add up to the invoice total when split by amount", () => {
    const r = ready({ collection: "installments", installmentUnit: "amount", installments: [newInstallment("2026-10-22", 5_000), newInstallment("2026-11-22", 4_000)] });
    expect(installmentError(r)).toMatch(/total/);
  });
});

describe("finalization", () => {
  it("never marks an invoice paid and keeps email delivery pending", () => {
    const sent = finalizeInvoice(ready(), { send: true, includePaymentLink: true });
    expect(lifecycleStatus(sent)).toBe("Finalized");
    expect(paymentStatus(sent)).toBe("Unpaid");
    expect(deliveryStatus(sent)).toBe("Sending");
    const only = finalizeInvoice(ready(), { send: false, includePaymentLink: false });
    expect(deliveryStatus(only)).toBe("Not sent");
    expect(only.includePaymentLink).toBe(false);
  });

  it("schedules finalization without finalizing, and dates the invoice from the schedule", () => {
    const s = finalizeInvoice(ready(), { send: true, includePaymentLink: true, scheduleAt: "2026-11-01T09:00" });
    expect(lifecycleStatus(s)).toBe("Scheduled");
    expect(paymentStatus(s)).toBeNull();
    expect(s.issue).toBe("2026-11-01");
    expect(s.due).toBe("2026-12-01");
    expect(lifecycleStatus(cancelSchedule(s))).toBe("Draft");
  });

  it("blocks sending to a customer without an email and past schedule dates", () => {
    expect(reviewErrors(ready(), { send: true, includePaymentLink: true })).toEqual([]);
    expect(reviewErrors(ready({ customer: "Nobody Known" }), { send: true, includePaymentLink: true }).some((e) => /email/.test(e))).toBe(true);
    expect(reviewErrors(ready(), { send: false, includePaymentLink: true, scheduleAt: "2026-10-01T09:00" }).some((e) => /future/.test(e))).toBe(true);
  });
});
