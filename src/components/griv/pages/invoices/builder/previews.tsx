import type { ReactNode } from "react";
import { CreditCard, Download, Landmark, Lock, Maximize2, Smartphone, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/money";
import { fmtDate } from "@/lib/dates";
import { customerByName } from "@/lib/demo/customers";
import { invoiceFooter, invoiceMemo, invoicePaid, invoiceTotals, type Invoice } from "@/lib/demo/invoices";
import { installmentAmounts, invoiceMethods } from "@/lib/demo/invoice-builder";
import { hostedUrl } from "@/lib/demo/invoice-details";
import { taxLabel } from "@/lib/demo/tax-rates";
import type { MerchantInfo } from "@/lib/demo/merchant";

export type PreviewTab = "pdf" | "email" | "page";
export const PREVIEW_TABS: { value: PreviewTab; label: string }[] = [
  { value: "pdf", label: "PDF" },
  { value: "email", label: "Email" },
  { value: "page", label: "Payment page" },
];

const Placeholder = ({ children }: { children: ReactNode }) => <span className="italic text-muted-foreground/70">{children}</span>;
const date = (iso: string) => (iso ? fmtDate(iso) : "—");

/** Brand initial tile standing in for a merchant logo until branding is configured. */
function BrandTile({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn("grid shrink-0 place-items-center rounded-md bg-primary font-bold text-primary-foreground", className ?? "h-7 w-7 text-xs")}>
      {name.slice(0, 1)}
    </span>
  );
}

/* ---------- PDF document ---------- */

/** A realistic invoice document built only from the form state. `final` shows what finalization will generate. */
export function InvoiceDocument({ invoice: r, merchant, final }: { invoice: Invoice; merchant: MerchantInfo; final?: boolean | undefined }) {
  const t = invoiceTotals(r);
  const c = r.currency;
  const paid = invoicePaid(r);
  const customer = customerByName(r.customer);
  const memo = invoiceMemo(r);
  const footer = invoiceFooter(r);
  const classic = (r.template ?? "classic") === "classic";
  const showLink = final && r.includePaymentLink !== false;
  return (
    <article
      aria-label="Invoice PDF preview"
      className={cn(
        "relative flex w-full flex-col overflow-hidden rounded-md bg-card p-6 text-[10.5px] leading-relaxed text-card-foreground shadow-sm ring-1 ring-border sm:p-7",
        (r.pageSize ?? "A4") === "A4" ? "aspect-[210/297]" : "aspect-[216/279]",
      )}
    >
      {classic && <span aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-primary" />}
      <header className="flex items-start justify-between gap-4">
        <h3 className={cn("text-lg font-semibold", classic && "text-primary")}>Invoice</h3>
        <div className="flex items-center gap-2 text-right">
          <span className="font-semibold">{merchant.name}</span>
          {classic && <BrandTile name={merchant.name} className="h-6 w-6 text-[10px]" />}
        </div>
      </header>

      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5">
        <dt className="text-muted-foreground">Invoice number</dt>
        <dd className="font-medium">{r.id}</dd>
        <dt className="text-muted-foreground">Date of issue</dt>
        <dd>{date(r.issue)}</dd>
        <dt className="text-muted-foreground">Date due</dt>
        <dd>{date(r.due)}</dd>
        {(r.customFields ?? []).filter((f) => f.label.trim()).map((f, i) => (
          <div key={i} className="contents">
            <dt className="text-muted-foreground">{f.label}</dt>
            <dd>{f.value || <Placeholder>—</Placeholder>}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 grid grid-cols-2 gap-6">
        <div>
          <p className="font-semibold">{merchant.name}</p>
          <p className="text-muted-foreground">{merchant.address}</p>
          {merchant.email && <p className="text-muted-foreground">{merchant.email}</p>}
          {r.taxId && <p className="text-muted-foreground">Tax ID {r.taxId}</p>}
        </div>
        <div>
          <p className="font-semibold">Bill to</p>
          {r.customer ? (
            <>
              <p>{r.customer}</p>
              {customer?.address && <p className="text-muted-foreground">{customer.address}</p>}
              {customer && <p className="text-muted-foreground">{customer.city ? `${customer.city}, ` : ""}{customer.country}</p>}
              {customer?.email && <p className="text-muted-foreground">{customer.email}</p>}
              {customer?.phone && <p className="text-muted-foreground">{customer.phone}</p>}
            </>
          ) : (
            <Placeholder>Customer name</Placeholder>
          )}
        </div>
      </div>

      <p className="mt-5 text-sm font-semibold tnum">
        {formatMoney(t.total - paid, c)} due {date(r.due)}
      </p>
      {showLink && <p className="font-medium text-primary underline-offset-2">Pay online</p>}
      {memo && <p className="mt-2 whitespace-pre-line">{memo}</p>}

      <table className="mt-4 w-full">
        <thead>
          <tr className="border-b border-foreground/70 text-left text-muted-foreground">
            <th className="py-1 pr-2 font-medium">Description</th>
            <th className="py-1 pr-2 text-right font-medium">Qty</th>
            <th className="py-1 pr-2 text-right font-medium">Unit price</th>
            <th className="py-1 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {r.items.length === 0 && (
            <tr>
              <td colSpan={4} className="py-2">
                <Placeholder>Items you add appear here</Placeholder>
              </td>
            </tr>
          )}
          {r.items.map((x, i) => (
            <tr key={i} className="border-b border-border/70 align-top">
              <td className="py-1.5 pr-2">
                {x.name || <Placeholder>Item</Placeholder>}
                {x.description && <span className="block text-muted-foreground">{x.description}</span>}
                {t.lines[i]?.itemDiscount ? (
                  <span className="block text-muted-foreground">Discount −{formatMoney(t.lines[i]!.itemDiscount, c)}</span>
                ) : null}
              </td>
              <td className="py-1.5 pr-2 text-right tnum">{x.qty}</td>
              <td className="py-1.5 pr-2 text-right tnum">{formatMoney(x.price, c)}</td>
              <td className="py-1.5 text-right tnum">{formatMoney(t.lines[i]?.net ?? 0, c)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="ml-auto mt-2 w-full max-w-[60%] space-y-0.5">
        <TotalRow label="Subtotal" value={formatMoney(t.subtotal, c)} />
        {t.discount > 0 && (
          <TotalRow label={r.discountType === "percent" ? `Discount (${r.discount}%)` : "Discount"} value={`−${formatMoney(t.discount, c)}`} />
        )}
        {t.taxes.map((tax) => (
          <TotalRow key={tax.id} label={taxLabel(tax)} value={formatMoney(tax.amount, c)} />
        ))}
        <TotalRow label="Total" value={formatMoney(t.total, c)} border />
        {paid > 0 && <TotalRow label="Amount paid" value={formatMoney(paid, c)} />}
        <TotalRow label="Amount due" value={formatMoney(t.total - paid, c)} strong />
      </dl>

      {r.collection === "installments" && (r.installments?.length ?? 0) > 0 && (
        <div className="mt-4">
          <p className="mb-1 font-semibold">Payment schedule</p>
          <InstallmentList invoice={r} />
        </div>
      )}

      <div className="mt-auto pt-6">
        {footer && <p className="mb-2 whitespace-pre-line text-muted-foreground">{footer}</p>}
        <p className="border-t pt-2 text-[9.5px] text-muted-foreground tnum">
          {r.id} · {formatMoney(t.total - paid, c)} due {date(r.due)}
          <span className="float-right">Page 1 of 1</span>
        </p>
      </div>
    </article>
  );
}

function TotalRow({ label, value, strong, border }: { label: string; value: string; strong?: boolean; border?: boolean }) {
  return (
    <div className={cn("flex justify-between gap-4", border && "border-t pt-0.5", strong && "font-semibold")}>
      <dt className={strong ? undefined : "text-muted-foreground"}>{label}</dt>
      <dd className="tnum">{value}</dd>
    </div>
  );
}

function InstallmentList({ invoice: r }: { invoice: Invoice }) {
  const amounts = installmentAmounts(r);
  return (
    <ol className="space-y-0.5">
      {(r.installments ?? []).map((ins, i) => (
        <li key={ins.id} className="flex justify-between gap-4">
          <span>
            {i + 1}. Due {date(ins.due)}
            {ins.description && <span className="text-muted-foreground"> · {ins.description}</span>}
          </span>
          <span className="tnum">{formatMoney(amounts[i] ?? 0, r.currency)}</span>
        </li>
      ))}
    </ol>
  );
}

/* ---------- Email ---------- */

export function EmailPreview({ invoice: r, merchant, willSend = true }: { invoice: Invoice; merchant: MerchantInfo; willSend?: boolean | undefined }) {
  const t = invoiceTotals(r);
  const c = r.currency;
  const paid = invoicePaid(r);
  const email = customerByName(r.customer)?.email;
  return (
    <div className="overflow-hidden rounded-md bg-card text-xs shadow-sm ring-1 ring-border">
      {!willSend && (
        <p className="border-b bg-highlight px-4 py-2 text-[11px] font-medium text-highlight-foreground">
          Finalize only — this email won't be sent. You can send it later from the invoice page.
        </p>
      )}
      <div className="border-b px-4 py-3">
        <p className="font-semibold">New invoice from {merchant.name}</p>
        <p className="text-muted-foreground">
          From: {merchant.name} via Griv · To: {email ?? <Placeholder>customer email</Placeholder>}
        </p>
      </div>
      <div className="space-y-3 bg-muted/50 px-4 py-5">
        <div className="flex items-center gap-2">
          <BrandTile name={merchant.name} />
          <span className="font-semibold">{merchant.name}</span>
        </div>
        <div className="rounded-lg bg-card p-4 ring-1 ring-border">
          <p className="text-muted-foreground">Invoice from {merchant.name}</p>
          <p className="mt-1 text-xl font-semibold tnum">{formatMoney(t.total - paid, c)}</p>
          <p className="text-muted-foreground">Due {date(r.due)}</p>
          <p className="mt-2 inline-flex items-center gap-1 font-medium text-primary">
            <Download className="h-3 w-3" /> Download invoice
          </p>
          <dl className="mt-3 grid grid-cols-[3rem_1fr] gap-y-0.5 border-t pt-3">
            <dt className="text-muted-foreground">To</dt>
            <dd>{r.customer || <Placeholder>Customer name</Placeholder>}</dd>
            <dt className="text-muted-foreground">From</dt>
            <dd>{merchant.name}</dd>
            <dt className="text-muted-foreground">Invoice</dt>
            <dd>#{r.id}</dd>
          </dl>
          <span className="mt-4 block rounded-md bg-primary py-2 text-center font-semibold text-primary-foreground">Pay this invoice</span>
        </div>
        <div className="rounded-lg bg-card p-4 ring-1 ring-border">
          <p className="mb-2 font-semibold">Invoice #{r.id}</p>
          <ul className="space-y-1">
            {r.items.map((x, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span className="min-w-0 truncate">{x.name || "Item"} × {x.qty}</span>
                <span className="tnum">{formatMoney(t.lines[i]?.net ?? 0, c)}</span>
              </li>
            ))}
            {r.items.length === 0 && <Placeholder>No items yet</Placeholder>}
          </ul>
          <dl className="mt-2 space-y-0.5 border-t pt-2">
            <TotalRow label="Total due" value={formatMoney(t.total, c)} strong />
            <TotalRow label="Amount paid" value={formatMoney(paid, c)} />
            <TotalRow label="Amount remaining" value={formatMoney(t.total - paid, c)} />
          </dl>
        </div>
        <p className="text-center text-[11px] text-muted-foreground">
          Questions? Contact {merchant.name}
          {merchant.email ? ` at ${merchant.email}` : ""}.
        </p>
      </div>
    </div>
  );
}

/* ---------- Hosted payment page (customer-facing design) ---------- */

const METHOD_ICON: Record<string, typeof CreditCard> = { Card: CreditCard, "Bank transfer": Landmark, USSD: Hash, "Mobile money": Smartphone };

/**
 * Customer-facing hosted invoice page. Deliberately not dashboard UI: one focused column, large
 * amount, calm cream backdrop and a single pay action.
 */
export function PaymentPagePreview({ invoice: r, merchant, live }: { invoice: Invoice; merchant: MerchantInfo; live: boolean }) {
  const t = invoiceTotals(r);
  const c = r.currency;
  const due = t.total - invoicePaid(r);
  const methods = invoiceMethods(r);
  const first = r.collection === "installments" ? installmentAmounts(r)[0] : undefined;
  return (
    <div className="overflow-hidden rounded-md shadow-sm ring-1 ring-border">
      <div className="flex items-center gap-2 border-b bg-card px-3 py-1.5">
        <Lock className="h-3 w-3 text-muted-foreground" />
        <span className="truncate font-mono text-[10px] text-muted-foreground">{hostedUrl(r).replace("https://", "")}</span>
      </div>
      <div className="bg-cream px-4 py-6 text-xs">
        <div className="mx-auto max-w-xs">
          <div className="mb-4 flex items-center justify-center gap-2">
            <BrandTile name={merchant.name} />
            <span className="text-sm font-semibold">{merchant.name}</span>
            {!live && <span className="rounded bg-blackwood px-1.5 py-0.5 text-[9px] font-bold uppercase text-blackwood-foreground">Test</span>}
          </div>
          <div className="rounded-2xl bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-2xl font-semibold tracking-tight tnum">{formatMoney(due, c)}</p>
                <p className="text-muted-foreground">Due {date(r.due)}</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium">
                <Download className="h-3 w-3" /> Invoice PDF
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-[3.5rem_1fr] gap-y-1 border-t pt-3">
              <dt className="text-muted-foreground">To</dt>
              <dd className="truncate">{r.customer || <Placeholder>Customer name</Placeholder>}</dd>
              <dt className="text-muted-foreground">From</dt>
              <dd className="truncate">{merchant.name}</dd>
              <dt className="text-muted-foreground">Invoice</dt>
              <dd>#{r.id}</dd>
            </dl>
            <details className="mt-3 border-t pt-3">
              <summary className="cursor-pointer font-medium">View invoice details</summary>
              <ul className="mt-2 space-y-1">
                {r.items.map((x, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span className="min-w-0 truncate">{x.name || "Item"} × {x.qty}</span>
                    <span className="tnum">{formatMoney(t.lines[i]?.net ?? 0, c)}</span>
                  </li>
                ))}
                {t.taxes.map((tax) => (
                  <li key={tax.id} className="flex justify-between gap-3 text-muted-foreground">
                    <span>{taxLabel(tax)}</span>
                    <span className="tnum">{formatMoney(tax.amount, c)}</span>
                  </li>
                ))}
              </ul>
            </details>
          </div>
          <div className="mt-3 rounded-2xl bg-card p-5 shadow-sm">
            <p className="mb-2 font-semibold">Choose how you'd like to pay</p>
            {methods.length ? (
              <ul className="space-y-1.5">
                {methods.map((m, i) => {
                  const Icon = METHOD_ICON[m] ?? CreditCard;
                  return (
                    <li key={m} className={cn("flex items-center gap-2 rounded-lg border px-3 py-2", i === 0 && "border-primary ring-1 ring-primary")}>
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      {m}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-muted-foreground">No payment methods are turned on for this invoice.</p>
            )}
            {r.collection === "installments" && first !== undefined && (
              <p className="mt-2 text-muted-foreground">Installment 1 of {r.installments?.length ?? 0} — the rest follow the schedule.</p>
            )}
            <span className="mt-3 block rounded-xl bg-primary py-2.5 text-center text-sm font-semibold text-primary-foreground">
              Pay {formatMoney(first ?? due, c)}
            </span>
          </div>
          <p className="mt-4 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
            <Lock className="h-3 w-3" /> Secured by Griv · Terms · Privacy
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Tabs wrapper used in the editor and the review modal ---------- */

export function PreviewTabs({ tab, onTab, right }: { tab: PreviewTab; onTab: (t: PreviewTab) => void; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3 border-b">
      <div role="tablist" aria-label="Preview" className="flex gap-4 text-sm">
        {PREVIEW_TABS.map(({ value, label }) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            onClick={() => onTab(value)}
            onKeyDown={(e) => {
              const i = PREVIEW_TABS.findIndex((x) => x.value === tab);
              if (e.key === "ArrowRight") onTab(PREVIEW_TABS[(i + 1) % 3]!.value);
              if (e.key === "ArrowLeft") onTab(PREVIEW_TABS[(i + 2) % 3]!.value);
            }}
            className={cn(
              "-mb-px border-b-2 pb-2 font-medium transition-colors",
              tab === value ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {right}
    </div>
  );
}

export function PreviewBody({ tab, invoice, merchant, live, final, willSend, onEnlarge }: {
  tab: PreviewTab; invoice: Invoice; merchant: MerchantInfo; live: boolean; final?: boolean; willSend?: boolean; onEnlarge?: () => void;
}) {
  if (tab === "email") return <EmailPreview invoice={invoice} merchant={merchant} willSend={willSend} />;
  if (tab === "page") return <PaymentPagePreview invoice={invoice} merchant={merchant} live={live} />;
  return (
    <div>
      {onEnlarge && (
        <div className="mb-2 flex justify-end">
          <button onClick={onEnlarge} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
            <Maximize2 className="h-3.5 w-3.5" /> Enlarge
          </button>
        </div>
      )}
      <InvoiceDocument invoice={invoice} merchant={merchant} final={final} />
    </div>
  );
}
