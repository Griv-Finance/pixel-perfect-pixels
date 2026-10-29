/** Builds a real, downloadable invoice PDF with pdf-lib. Runs client-side only. */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import {
  invoiceFooter,
  invoiceMemo,
  invoicePaid,
  invoiceStatus,
  invoiceTotals,
  type Invoice,
} from "@/lib/demo/invoices";
import { customerByName } from "@/lib/demo/customers";
import { installmentAmounts } from "@/lib/demo/invoice-builder";
import { hostedUrl } from "@/lib/demo/invoice-details";
import { taxLabel } from "@/lib/demo/tax-rates";

const SIZES = { A4: [595.28, 841.89], Letter: [612, 792] } as const;
const M = 50;
const INK = rgb(0.16, 0.1, 0.06);
const GREY = rgb(0.45, 0.45, 0.45);

/** Amounts are written as "NGN 26,875.00" — the standard PDF fonts have no ₦ glyph. */
const pdfMoney = (n: number, currency: string) =>
  `${currency} ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
/** Standard fonts only cover WinAnsi; replace anything else so drawing never throws. */
const safe = (s: string) => s.replace(/[₦—–]/g, (c) => (c === "₦" ? "NGN " : "-")).replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");

export type MerchantInfo = { name: string; address: string; email?: string | undefined };
const DEFAULT_MERCHANT: MerchantInfo = { name: "Nova Retail Ltd.", address: "Lagos, Nigeria" };

export async function buildInvoicePdf(r: Invoice, merchant: MerchantInfo = DEFAULT_MERCHANT): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${r.id} — ${merchant.name}`);
  const [pw, ph] = SIZES[r.pageSize ?? "A4"];
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page: PDFPage = doc.addPage([pw, ph]);
  const width = pw;
  let y = ph - M;
  const ensure = (needed: number) => {
    if (y - needed < M + 30) {
      page = doc.addPage([pw, ph]);
      y = ph - M;
    }
  };
  const text = (s: string, size = 10, f: PDFFont = font, x = M, color = INK) => page.drawText(safe(s), { x, y, size, font: f, color });
  const right = (s: string, size = 10, f: PDFFont = font, x = width - M, color = INK) => {
    const str = safe(s);
    page.drawText(str, { x: x - f.widthOfTextAtSize(str, size), y, size, font: f, color });
  };
  const c = r.currency;
  const t = invoiceTotals(r);
  const paid = invoicePaid(r);
  const customer = customerByName(r.customer);

  // Header
  text("Invoice", 22, bold, M, rgb(0.85, 0.36, 0.02));
  right(merchant.name, 12, bold);
  y -= 22;
  const meta: [string, string][] = [
    ["Invoice number", r.id],
    ["Date of issue", r.issue],
    ["Date due", r.due],
    ...(r.customFields ?? []).filter((f) => f.label.trim()).map((f) => [f.label, f.value] as [string, string]),
  ];
  for (const [k, v] of meta) {
    text(k, 9, font, M, GREY);
    text(v, 9, bold, M + 90);
    y -= 13;
  }
  y -= 12;

  // From / Bill to
  const top = y;
  text(merchant.name, 10, bold);
  y -= 13;
  text(merchant.address, 9);
  if (merchant.email) { y -= 12; text(merchant.email, 9); }
  if (r.taxId) { y -= 12; text(`Tax ID: ${r.taxId}`, 9); }
  const leftEnd = y;
  y = top;
  const bx = width / 2;
  text("Bill to", 9, bold, bx, GREY);
  y -= 13;
  text(r.customer || "Customer", 10, bold, bx);
  for (const line of [customer?.address, customer ? `${customer.city}, ${customer.country}` : "", customer?.email, customer?.phone].filter(Boolean) as string[]) {
    y -= 12;
    text(line, 9, font, bx);
  }
  y = Math.min(y, leftEnd) - 26;

  text(`${pdfMoney(t.total - paid, c)} due ${r.due}`, 14, bold);
  y -= 16;
  if (r.includePaymentLink !== false && r.status !== "Draft" && r.status !== "Scheduled") {
    text(`Pay online: ${hostedUrl(r)}`, 9, font, M, rgb(0.85, 0.36, 0.02));
    y -= 14;
  }
  const memo = invoiceMemo(r);
  if (memo) {
    y -= 4;
    text(memo.slice(0, 110), 9.5);
    y -= 14;
  }
  y -= 14;

  // Line items
  const colX = { qty: width - 250, unit: width - 160, amount: width - M };
  text("Description", 9, bold, M, GREY);
  text("Qty", 9, bold, colX.qty, GREY);
  right("Unit price", 9, bold, colX.unit, GREY);
  right("Amount", 9, bold, colX.amount, GREY);
  y -= 6;
  page.drawLine({ start: { x: M, y }, end: { x: width - M, y }, thickness: 0.7, color: rgb(0.85, 0.82, 0.78) });
  y -= 16;
  r.items.forEach((item, i) => {
    ensure(40);
    text((item.name || "Item").slice(0, 60), 10);
    text(String(item.qty), 10, font, colX.qty);
    right(pdfMoney(item.price, c), 10, font, colX.unit);
    right(pdfMoney(t.lines[i]?.gross ?? 0, c), 10);
    if (item.description) { y -= 12; text(item.description.slice(0, 80), 8.5, font, M, GREY); }
    if (t.lines[i]?.itemDiscount) { y -= 12; text(`Discount -${pdfMoney(t.lines[i]!.itemDiscount, c)}`, 8.5, font, M, GREY); }
    y -= 16;
  });
  y -= 6;

  // Totals
  const rows: [string, string, boolean][] = [["Subtotal", pdfMoney(t.subtotal, c), false]];
  if (t.discount > 0)
    rows.push([r.discountType === "percent" ? `Discount (${r.discount}%)` : "Discount", `-${pdfMoney(t.discount, c)}`, false]);
  for (const tax of t.taxes) rows.push([taxLabel(tax), pdfMoney(tax.amount, c), false]);
  rows.push(["Total", pdfMoney(t.total, c), true]);
  if (paid > 0) rows.push(["Amount paid", pdfMoney(paid, c), false]);
  rows.push(["Amount due", pdfMoney(t.total - paid, c), true]);
  for (const [label, value, strong] of rows) {
    ensure(20);
    right(label, strong ? 10 : 9.5, strong ? bold : font, width - M - 150);
    right(value, strong ? 10 : 9.5, strong ? bold : font);
    y -= strong ? 17 : 14;
  }

  // Installment schedule
  if (r.collection === "installments" && r.installments?.length) {
    y -= 12;
    ensure(30);
    text("Payment schedule", 10, bold);
    y -= 15;
    const amounts = installmentAmounts(r);
    r.installments.forEach((ins, i) => {
      ensure(16);
      text(`${i + 1}. Due ${ins.due}${ins.description ? ` - ${ins.description}` : ""}`, 9);
      right(pdfMoney(amounts[i] ?? 0, c), 9);
      y -= 13;
    });
  }

  // Footer
  y -= 16;
  const footer = invoiceFooter(r);
  if (footer) {
    ensure(20);
    text(footer.slice(0, 120), 8.5, font, M, GREY);
    y -= 14;
  }
  page.drawText(safe(`${r.id} · ${pdfMoney(t.total - paid, c)} due ${r.due} · ${invoiceStatus(r)}`), { x: M, y: M - 10, size: 8, font, color: GREY });
  page.drawText("Sample invoice generated by the Griv demo — no real money moved.".replace("—", "-"), { x: M, y: M - 22, size: 7.5, font, color: rgb(0.55, 0.55, 0.55) });

  return doc.save();
}

/** Generates the PDF and triggers a browser download. */
export async function downloadInvoicePdf(r: Invoice, merchant?: MerchantInfo) {
  const bytes = await buildInvoicePdf(r, merchant);
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${r.id}-${invoiceStatus(r).toLowerCase().replace(/\s+/g, "-")}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
