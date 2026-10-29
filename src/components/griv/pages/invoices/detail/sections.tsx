import { useState, type ReactNode } from "react";
import { Copy, ExternalLink, Info, Pencil, Plus, RefreshCw } from "lucide-react";
import { EmptyState } from "@/components/griv/kit";
import { toast } from "sonner";
import {
  creditNoteRemaining,
  invoiceActivity,
  invoiceEvents,
  invoiceLogs,
  invId,
  paymentRows,
  summaryRows,
  type InvoiceExtras,
} from "@/lib/demo/invoice-details";
import { PAYMENT_METHODS_BY_CURRENCY } from "@/lib/demo/link-details";
import { invoicePaid, invoiceTotals, type Invoice } from "@/lib/demo/invoices";
import { formatMoney } from "@/lib/money";
import { fmtDate, fmtDateTime } from "@/lib/dates";
import { customerByName } from "@/lib/demo/customers";
import { Link } from "@tanstack/react-router";
import { txnPrefix } from "@/lib/demo/invoice-details";

const MANAGE_BTN = "inline-flex h-7 items-center gap-1 rounded-md border border-input bg-card px-2.5 text-xs font-medium hover:bg-muted";

/** Stripe-style section: small semibold heading, thin divider, no card wrapper. */
export function Section({ title, info, action, children }: {
  title: string; info?: boolean; action?: ReactNode; children: ReactNode;
}) {
  return (
    <section className="border-b py-6 first:pt-0 last:border-b-0 last:pb-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold">
          {title}
          {info && <Info className="h-3.5 w-3.5 text-muted-foreground" />}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-1.5">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-right font-medium">{children}</dd>
    </div>
  );
}

/** Recent activity with Add note. */
export function RecentActivity({ invoice, extras, onAddNote }: {
  invoice: Invoice; extras: InvoiceExtras; onAddNote: () => void;
}) {
  const items = invoiceActivity(invoice);
  return (
    <Section title="Recent activity" action={<button className={MANAGE_BTN} onClick={onAddNote}>Add note</button>}>
      {items.length ? (
        <ul className="space-y-2.5 text-sm">
          {items.map((a, i) => (
            <li key={i} className="flex items-start justify-between gap-6">
              <span className="min-w-0">{a.text}</span>
              <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">{a.time}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No activity yet.</p>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        {extras.notes?.length ?? 0} team {extras.notes?.length === 1 ? "note" : "notes"} on this invoice.
      </p>
    </Section>
  );
}

/** Two-column summary: billed to / billing details vs invoice key-values. */
export function SummarySection({ invoice }: { invoice: Invoice }) {
  const customer = customerByName(invoice.customer);
  return (
    <Section title="Summary">
      <div className="grid gap-8 text-sm sm:grid-cols-2">
        <dl className="space-y-4">
          <div>
            <dt className="mb-1 text-xs font-medium text-muted-foreground">Billed to</dt>
            <dd>
              <span className="font-medium">{invoice.customer}</span>
              {customer?.email && (
                <span className="block text-xs text-muted-foreground">{customer.email}</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="mb-1 text-xs font-medium text-muted-foreground">Billing details</dt>
            <dd className="text-muted-foreground">
              {customer?.city ? `${customer.city}, ${customer.country ?? "Nigeria"}` : "Not provided"}
            </dd>
          </div>
        </dl>
        <dl className="text-sm">
          {summaryRows(invoice).map(([k, v]) => (
            <Row key={k} label={k}>{v}</Row>
          ))}
        </dl>
      </div>
    </Section>
  );
}

/** Compact line items table with right-aligned totals. */
export function LineItemsSection({ invoice }: { invoice: Invoice }) {
  const t = invoiceTotals(invoice);
  const paid = invoicePaid(invoice);
  const c = invoice.currency;
  return (
    <Section title="Line items">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="py-2 pr-4 font-medium">Description</th>
            <th className="py-2 pr-4 text-right font-medium">Qty</th>
            <th className="hidden py-2 pr-4 text-right font-medium sm:table-cell">Unit price</th>
            <th className="py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((x, i) => (
            <tr key={i} className="border-b last:border-b-0">
              <td className="py-3 pr-4">{x.name || "Item"}</td>
              <td className="py-3 pr-4 text-right tnum">{x.qty}</td>
              <td className="hidden py-3 pr-4 text-right tnum sm:table-cell">{formatMoney(x.price, c)}</td>
              <td className="py-3 text-right tnum">{formatMoney(x.qty * x.price, c)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="mt-3 ml-auto max-w-64 space-y-1 text-sm">
        <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="tnum">{formatMoney(t.subtotal, c)}</dd></div>
        {invoice.discount > 0 && (
          <div className="flex justify-between"><dt className="text-muted-foreground">Discount</dt><dd className="tnum">-{formatMoney(invoice.discount, c)}</dd></div>
        )}
        {invoice.vat && (
          <div className="flex justify-between"><dt className="text-muted-foreground">VAT (7.5%)</dt><dd className="tnum">{formatMoney(t.tax, c)}</dd></div>
        )}
        <div className="flex justify-between border-t pt-1 font-semibold"><dt>Total</dt><dd className="tnum">{formatMoney(t.total, c)}</dd></div>
        <div className="flex justify-between"><dt className="text-muted-foreground">Amount paid</dt><dd className="tnum">{formatMoney(paid, c)}</dd></div>
        <div className="flex justify-between border-t pt-1 font-semibold"><dt>Amount remaining</dt><dd className="tnum">{formatMoney(t.total - paid, c)}</dd></div>
      </dl>
    </Section>
  );
}

/** Tax breakdown, or a restrained empty state when no tax applies. */
export function TaxSection({ invoice }: { invoice: Invoice }) {
  const t = invoiceTotals(invoice);
  return (
    <Section title="Tax calculation">
      {invoice.vat ? (
        <table className="w-full max-w-md text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-2 pr-4 font-medium">Tax rate</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-3 pr-4">VAT — 7.5% on discounted subtotal</td>
              <td className="py-3 text-right tnum">{formatMoney(t.tax, invoice.currency)}</td>
            </tr>
          </tbody>
        </table>
      ) : (
        <p className="rounded-md border border-dashed px-4 py-3 text-center text-sm text-muted-foreground">No tax rate applied.</p>
      )}
    </Section>
  );
}

/** Restrained unavailable state — no invented journal entries. */
export function AccountingSection() {
  return (
    <Section title="Accounting">
      <p className="rounded-md border border-dashed px-4 py-3 text-center text-sm text-muted-foreground">
        General ledger accounting isn't wired up in this demo yet.
      </p>
    </Section>
  );
}

/** Payments table: every recorded payment attempt, linked to Transactions. */
export function PaymentsSection({ invoice, onRecord }: { invoice: Invoice; onRecord?: (() => void) | undefined }) {
  const rows = paymentRows(invoice);
  return (
    <Section
      title="Payments"
      action={
        onRecord && (
          <button className={MANAGE_BTN} onClick={onRecord}>
            <Plus className="h-3.5 w-3.5" />
            Record payment
          </button>
        )
      }
    >
      {rows.length ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-2 pr-4 font-medium">Amount</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 pr-4 font-medium">Description</th>
              <th className="py-2 pr-4 font-medium">Date</th>
              <th className="py-2 text-right font-medium">Reference</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.reference} className="border-b last:border-b-0">
                <td className="py-3 pr-4 tnum">{formatMoney(p.amount, p.currency)}</td>
                <td className="py-3 pr-4">
                  <span
                    className={
                      p.status === "Pending"
                        ? "inline-flex whitespace-nowrap rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning-foreground"
                        : "inline-flex whitespace-nowrap rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success-foreground"
                    }
                  >
                    {p.status}
                  </span>
                </td>
                <td className="max-w-52 truncate py-3 pr-4">{p.description}</td>
                <td className="whitespace-nowrap py-3 pr-4 text-muted-foreground">{fmtDate(p.date)}</td>
                <td className="py-3 text-right">
                  <Link
                    to="/transactions"
                    search={{ q: txnPrefix(invoice) }}
                    className="text-primary hover:underline"
                  >
                    {p.reference}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="rounded-md border border-dashed px-4 py-3 text-center text-sm text-muted-foreground">No payments recorded yet.</p>
      )}
    </Section>
  );
}

/** Credit notes with remaining balance and an Add action for paid invoices. */
export function CreditNotesSection({ invoice, extras, onAdd }: {
  invoice: Invoice; extras: InvoiceExtras; onAdd?: (() => void) | undefined;
}) {
  const notes = extras.creditNotes ?? [];
  const remaining = creditNoteRemaining(invoice);
  return (
    <Section
      title="Credit notes"
      action={
        onAdd && (
          <button className={MANAGE_BTN} onClick={onAdd}>
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        )
      }
    >
      {notes.length ? (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Credit note</th>
                <th className="py-2 pr-4 text-right font-medium">Amount</th>
                <th className="py-2 pr-4 font-medium">Reason</th>
                <th className="py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((c) => (
                <tr key={c.id} className="border-b last:border-b-0">
                  <td className="py-3 pr-4 font-medium text-primary">{c.id}</td>
                  <td className="py-3 pr-4 text-right tnum">{formatMoney(c.amount, invoice.currency)}</td>
                  <td className="max-w-52 truncate py-3 pr-4">{c.reason}</td>
                  <td className="whitespace-nowrap py-3 text-muted-foreground">{fmtDate(c.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted-foreground">
            {formatMoney(remaining, invoice.currency)} still creditable on this invoice.
          </p>
        </>
      ) : (
        <p className="rounded-md border border-dashed px-4 py-3 text-center text-sm text-muted-foreground">No credit notes.</p>
      )}
    </Section>
  );
}

/** Logs | Events tabs with Refresh. Extension runs are omitted — Griv has no extension system. */
export function ActivityTabsSection({ invoice }: { invoice: Invoice }) {
  const [tab, setTab] = useState<"Logs" | "Events">("Logs");
  const [tick, setTick] = useState(0);
  const logs = invoiceLogs(invoice);
  const events = invoiceEvents(invoice);
  return (
    <Section
      title="Activity"
      action={
        <button className={MANAGE_BTN} onClick={() => { setTick((t) => t + 1); toast.success("Activity refreshed"); }}>
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      }
    >
      <div className="mb-2 flex gap-5 border-b text-sm">
        {(["Logs", "Events"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative pb-2 ${tab === t ? "font-medium text-foreground after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div key={tick}>
        {tab === "Logs" ? (
          <ul className="divide-y text-sm">
            {logs.map((l) => (
              <li key={l.endpoint + l.time} className="flex items-center justify-between gap-6 py-2 first:pt-0">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="shrink-0 rounded border border-border bg-success/15 px-1.5 py-0.5 text-xs font-medium text-success-foreground">{l.status}</span>
                  <span className="shrink-0 text-muted-foreground">{l.method}</span>
                  <code className="min-w-0 truncate">{l.endpoint}</code>
                </span>
                <span className="shrink-0 whitespace-nowrap text-muted-foreground">{l.time}</span>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="divide-y text-sm">
            {events.map((e, i) => (
              <li key={i} className="flex items-center justify-between gap-6 py-2 first:pt-0">
                <code className="min-w-0">{e.text}</code>
                <span className="shrink-0 whitespace-nowrap text-muted-foreground">{e.time}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
}

/* ---------- right column ---------- */

/** Details panel: ID with copy, created/finalized, payment page, enabled methods. */
export function DetailsPanel({ invoice, extras }: { invoice: Invoice; extras: InvoiceExtras }) {
  const methods = PAYMENT_METHODS_BY_CURRENCY[invoice.currency] ?? ["Card"];
  const finalized = invoice.status !== "Draft";
  return (
    <Section title="Details">
      <dl className="text-sm">
        <div className="flex items-start justify-between gap-3 py-1.5">
          <dt className="shrink-0 text-muted-foreground">ID</dt>
          <dd className="flex min-w-0 items-center gap-1.5 text-right">
            <code className="min-w-0 truncate font-medium">{invId(invoice)}</code>
            <button
              aria-label="Copy invoice ID"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => { navigator.clipboard?.writeText(invId(invoice)); toast.success("Invoice ID copied"); }}
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </dd>
        </div>
        <Row label="Created">{fmtDateTime(invoice.created ?? `${invoice.issue}T09:00:00`)}</Row>
        {finalized && <Row label="Finalized">{fmtDateTime(invoice.created ?? `${invoice.issue}T09:00:00`)}</Row>}
        {finalized && (
          <div className="flex items-start justify-between gap-3 py-1.5">
            <dt className="shrink-0 text-muted-foreground">Payment page</dt>
            <dd className="flex min-w-0 items-center gap-1.5 text-right">
              <a
                className="min-w-0 truncate text-primary hover:underline"
                href={`https://invoice.griv.africa/i/${invId(invoice)}`}
                target="_blank"
                rel="noreferrer"
              >
                invoice.griv.africa/i/{invId(invoice).slice(0, 14)}…
              </a>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </dd>
          </div>
        )}
      </dl>
      <p className="mb-2 mt-4 text-xs font-medium text-muted-foreground">Enabled payment methods</p>
      <ul className="flex flex-wrap gap-1.5">
        {methods.map((m) => (
          <li key={m} className="rounded-full border border-input bg-card px-2 py-0.5 text-xs">{m}</li>
        ))}
      </ul>
    </Section>
  );
}

/** Metadata panel with edit action. */
export function MetadataPanel({ extras, onEdit }: { extras: InvoiceExtras; onEdit: () => void }) {
  const entries = Object.entries(extras.metadata ?? {});
  return (
    <Section title="Metadata" action={<button className={MANAGE_BTN} aria-label="Edit metadata" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /></button>}>
      {entries.length ? (
        <dl className="text-sm">
          {entries.map(([k, v]) => (
            <div key={k} className="flex items-start justify-between gap-6 py-1.5">
              <dt className="shrink-0 font-medium">{k}</dt>
              <dd className="min-w-0 break-words text-right text-muted-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-muted-foreground">No metadata.</p>
      )}
    </Section>
  );
}

/** Compact not-found state for unknown invoice ids. */
export function InvoiceNotFound() {
  return (
    <EmptyState
      title="Invoice not found"
      description="This sample invoice may have been deleted or the demo data was reset."
    />
  );
}
