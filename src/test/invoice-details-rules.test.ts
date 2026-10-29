import { describe, expect, it } from "vitest";
import { INVOICES, invoicePaid, invoiceStatus, invoiceTotals, type Invoice } from "@/lib/demo/invoices";
import {
  availableActions,
  creditNoteRemaining,
  invoiceActivity,
  invoiceEvents,
  invoiceLogs,
  nextCreditNoteId,
  outstanding,
  paymentRows,
  setInvoiceExtras,
} from "@/lib/demo/invoice-details";

const paidInvoice = INVOICES.find((r) => invoiceStatus(r) === "Paid")!;
const unpaidInvoice = INVOICES.find((r) => invoiceStatus(r) === "Overdue")!;

describe("invoice details rules", () => {
  it("keeps amount paid plus amount remaining equal to the invoice total", () => {
    for (const r of INVOICES) {
      const paid = invoicePaid(r);
      const remaining = invoiceTotals(r).total - paid;
      expect(remaining).toBeGreaterThanOrEqual(0);
      expect(paid + remaining).toBe(invoiceTotals(r).total);
      expect(outstanding(r)).toBe(remaining > 0 ? remaining : 0);
    }
  });

  it("caps credit notes at the amount already paid, minus existing credits", () => {
    const paid = invoicePaid(paidInvoice);
    expect(creditNoteRemaining(paidInvoice)).toBe(paid);
    // Credit everything that was paid; nothing may remain creditable.
    setInvoiceExtras(paidInvoice.id, {
      creditNotes: [{ id: "CN-TEST-01", amount: paid, reason: "Full credit", date: "2026-10-22" }],
    });
    expect(creditNoteRemaining(paidInvoice)).toBe(0);
    setInvoiceExtras(paidInvoice.id, { creditNotes: [] });
    expect(creditNoteRemaining(paidInvoice)).toBe(paid);
  });

  it("keeps externally recorded payments pending in the payments table", () => {
    setInvoiceExtras(unpaidInvoice.id, {
      pendingPayments: [{ reference: "PAY-TEST1", amount: 5000, date: "2026-10-22T10:00:00Z", method: "Bank transfer" }],
    });
    const pending = paymentRows(unpaidInvoice).find((p) => p.reference === "PAY-TEST1");
    expect(pending?.status).toBe("Pending");
    // A pending external payment never settles the invoice on its own.
    expect(outstanding(unpaidInvoice)).toBe(
      invoiceTotals(unpaidInvoice).total - invoicePaid(unpaidInvoice),
    );
    setInvoiceExtras(unpaidInvoice.id, { pendingPayments: [] });
  });

  it("offers status-aware actions", () => {
    // A draft can be sent and deleted, but never voided or credited.
    const draftActions = availableActions(INVOICES.find((r) => r.status === "Draft")!);
    expect(draftActions).toContain("send");
    expect(draftActions).toContain("delete-draft");
    expect(draftActions).not.toContain("void");
    expect(draftActions).not.toContain("credit-note");
    // An overdue invoice can still be paid externally or voided, never credited.
    const overdueActions = availableActions(unpaidInvoice);
    expect(overdueActions).toContain("record-payment");
    expect(overdueActions).toContain("void");
    expect(overdueActions).not.toContain("credit-note");
    // A paid invoice can be credited but not paid again.
    const paidActions = availableActions(paidInvoice);
    expect(paidActions).toContain("credit-note");
    expect(paidActions).not.toContain("record-payment");
    expect(paidActions).not.toContain("void");
  });

  it("derives consistent activity, events and logs from the invoice record", () => {
    expect(invoiceActivity(unpaidInvoice).some((a) => a.text.includes("created"))).toBe(true);
    expect(invoiceEvents(unpaidInvoice).some((e) => e.text === "invoice.created")).toBe(true);
    expect(invoiceLogs(unpaidInvoice).some((l) => l.endpoint === "/v1/invoices")).toBe(true);
    // A draft invoice has no finalized/sent history.
    const draft = INVOICES.find((r) => r.status === "Draft")!;
    expect(invoiceEvents(draft).some((e) => e.text === "invoice.finalized")).toBe(false);
    expect(invoiceLogs(draft).some((l) => l.endpoint.includes("/finalize"))).toBe(false);
  });

  it("numbers sequential credit notes per invoice", () => {
    expect(nextCreditNoteId({}, { id: "GRV-INV-1043" })).toBe("CN-1043-01");
    expect(
      nextCreditNoteId(
        { creditNotes: [{ id: "CN-1043-01", amount: 1, reason: "x", date: "2026-10-22" }] },
        { id: "GRV-INV-1043" },
      ),
    ).toBe("CN-1043-02");
  });
});
