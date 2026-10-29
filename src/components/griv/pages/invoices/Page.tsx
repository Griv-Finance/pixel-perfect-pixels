import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  FileText,
  Info,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  SlidersHorizontal,
  Trash2,
  User,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  DashboardPage,
  EmptyState,
  Field,
  TableSkeleton,
  useDemoLoading,
} from "@/components/griv/kit";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InvoiceEditor, InvoicePreview } from "./InvoiceEditor";
import { DateRangePicker } from "../transactions/DateRangePicker";
import {
  INVOICES,
  invoiceTotals,
  invoicePaid,
  invoiceStatus,
  type Invoice,
} from "@/lib/demo/invoices";
import { customerByName } from "@/lib/demo/customers";
import { CURRENCIES, formatMoney } from "@/lib/money";
import { fmtDate, fmtDateTime, DEMO_TODAY } from "@/lib/dates";
import { statusTone, TONE_CLASS } from "@/lib/status";
import { cn } from "@/lib/utils";
import { exportCsv } from "@/lib/csv";
import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from "@/lib/demo/unified";

const INPUT = "field h-9 w-full text-sm";
const SHOW_FOR_TYPES = ["All invoices", "Draft", "Sent", "Partially paid", "Paid", "Overdue", "Cancelled"] as const;

const STATUS_ICONS: Record<string, LucideIcon> = {
  Draft: FileText,
  Sent: Send,
  "Partially paid": Clock3,
  Paid: CheckCircle2,
  Overdue: AlertTriangle,
  Cancelled: XCircle,
};

/** Status badge with a leading icon identifying the kind of status. */
function InvoiceStatus({ status }: { status: string }) {
  const Icon = STATUS_ICONS[status] ?? FileText;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold",
        TONE_CLASS[statusTone(status)],
      )}
    >
      <Icon className="h-3 w-3" />
      {status}
    </span>
  );
}

/** Status cell: soft badge, plus an info icon explaining partial payments and overdue invoices. */
function StatusCell({ invoice }: { invoice: Invoice }) {
  const status = invoiceStatus(invoice);
  const note =
    status === "Overdue"
      ? `Due ${fmtDate(invoice.due)} and still unpaid.`
      : status === "Partially paid"
        ? `${formatMoney(invoiceTotals(invoice).total - invoicePaid(invoice), invoice.currency)} still outstanding.`
        : null;
  return (
    <span className="inline-flex items-center gap-1.5">
      <InvoiceStatus status={status} />
      {note && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button aria-label="Status details" className="text-warning hover:text-foreground">
              <Info className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-56 border-0 bg-blackwood text-xs text-blackwood-foreground">{note}</TooltipContent>
        </Tooltip>
      )}
    </span>
  );
}

/** Avatar-style icon distinguishing people from organisations. */
function CustomerAvatar({ name }: { name: string }) {
  const isOrg = customerByName(name)?.kind === "org";
  return (
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-primary">
      {isOrg ? <Building2 className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
    </span>
  );
}

type Filters = { ref: string; customer: string; status: string; currency: string; amountMin: string; amountMax: string; from: string; to: string };
const DEFAULT_FILTERS: Filters = { ref: "", customer: "", status: "All", currency: "All", amountMin: "", amountMax: "", from: "", to: "" };

export function InvoicesPage() {
  const [rows, setRows] = useState(INVOICES);
  const [showFor, setShowFor] = useState<(typeof SHOW_FOR_TYPES)[number]>("All invoices");
  const [draft, setDraft] = useState<Filters>(DEFAULT_FILTERS);
  const [applied, setApplied] = useState<Filters>(DEFAULT_FILTERS);
  const [advanced, setAdvanced] = useState(false);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [page, setPage] = useState(1);
  const [exportOpen, setExportOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [create, setCreate] = useState(false);
  const [cancel, setCancel] = useState(false);
  const loading = useDemoLoading();
  const detail = rows.find((r) => r.id === selected);
  const nextId = `GRV-INV-${String(Math.max(...rows.map((r) => Number(r.id.slice(8)))) + 1).padStart(4, "0")}`;

  const typed = useMemo(
    () => rows.filter((r) => showFor === "All invoices" || invoiceStatus(r) === showFor),
    [rows, showFor],
  );
  const filtered = useMemo(
    () =>
      typed.filter((r) => {
        const f = applied;
        if (f.ref && !r.id.toLowerCase().includes(f.ref.toLowerCase())) return false;
        if (f.customer && !r.customer.toLowerCase().includes(f.customer.toLowerCase())) return false;
        if (f.status !== "All" && invoiceStatus(r) !== f.status) return false;
        if (f.currency !== "All" && r.currency !== f.currency) return false;
        const total = invoiceTotals(r).total;
        if (f.amountMin && total < Number(f.amountMin)) return false;
        if (f.amountMax && total > Number(f.amountMax)) return false;
        if (f.from && r.issue < f.from) return false;
        if (f.to && r.issue > f.to) return false;
        return true;
      }),
    [typed, applied],
  );
  useEffect(() => setPage(1), [applied, showFor, pageSize]);
  const from = (page - 1) * pageSize;
  const viewRows = filtered.slice(from, from + pageSize);
  const view = { total: filtered.length, from: from + 1, to: Math.min(from + pageSize, filtered.length), page, pages: Math.max(1, Math.ceil(filtered.length / pageSize)) };

  const set = (patch: Partial<Filters>) => setDraft((d) => ({ ...d, ...patch }));
  const search = () => setApplied({ ...draft });
  const clearAll = () => {
    setDraft(DEFAULT_FILTERS);
    setApplied(DEFAULT_FILTERS);
  };
  const doExport = (excel: boolean) => {
    setExportOpen(false);
    exportCsv(
      "invoices",
      filtered.map((r) => ({
        invoice: r.id,
        customer: r.customer,
        issue: r.issue,
        due: r.due,
        currency: r.currency,
        total: invoiceTotals(r).total,
        paid: invoicePaid(r),
        outstanding: Math.max(0, invoiceTotals(r).total - invoicePaid(r)),
        status: invoiceStatus(r),
      })),
      { excel },
    );
  };
  const duplicate = (r: Invoice) => {
    setRows((v) => [
      {
        ...r,
        id: nextId,
        issue: DEMO_TODAY.toISOString().slice(0, 10),
        due: DEMO_TODAY.toISOString().slice(0, 10),
        status: "Draft",
        payments: [],
        reminders: [],
      },
      ...v,
    ]);
    toast.success("Invoice duplicated as draft");
  };

  return (
    <DashboardPage
      title="Invoices"
      description="Bill a specific customer with line items and payment terms."
      actions={
        <div className="relative flex items-center gap-2">
          <Popover open={exportOpen} onOpenChange={setExportOpen}>
            <PopoverTrigger asChild>
              <button className="btn btn-outline h-9 text-sm" disabled={!filtered.length} aria-haspopup="menu">
                <Download className="h-4 w-4" />
                Export
                <ChevronDown className="h-4 w-4 opacity-70" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 p-1" role="menu">
              <button
                role="menuitem"
                className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => doExport(false)}
              >
                Export CSV
              </button>
              <button
                role="menuitem"
                className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => doExport(true)}
              >
                Export CSV for Excel
              </button>
            </PopoverContent>
          </Popover>
          <button className="btn btn-primary" onClick={() => setCreate(true)}>
            <Plus className="h-4 w-4" />
            Create invoice
          </button>
        </div>
      }
    >
      <TooltipProvider delayDuration={100}>
        {/* Show for: All invoices ▼ */}
        <div className="mb-3 flex items-center gap-1.5">
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                aria-haspopup="listbox"
              >
                <FileText className="h-4 w-4" />
                Show for:
                <span className="font-medium text-foreground">{showFor}</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-44 p-1" role="listbox">
              {SHOW_FOR_TYPES.map((t) => (
                <button
                  key={t}
                  role="option"
                  aria-selected={showFor === t}
                  onClick={() => setShowFor(t)}
                  className={cn(
                    "block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted",
                    showFor === t && "bg-muted font-medium",
                  )}
                >
                  {t}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>

        <section className="panel overflow-hidden">
          {/* Filter container */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              search();
            }}
            className="px-5 py-5 sm:px-6"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Invoice number">
                <input
                  className={INPUT}
                  placeholder="E.g. GRV-INV-1041"
                  value={draft.ref}
                  onChange={(e) => set({ ref: e.target.value })}
                />
              </Field>
              <Field label="Date or period">
                <DateRangePicker
                  from={draft.from}
                  to={draft.to}
                  onChange={(from, to) => set({ from, to })}
                />
              </Field>
              <Field label="Invoice status">
                <select className={INPUT} value={draft.status} onChange={(e) => set({ status: e.target.value })}>
                  {SHOW_FOR_TYPES.map((o) => (
                    <option key={o} value={o === "All invoices" ? "All" : o}>
                      {o === "All invoices" ? "All" : o}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Currency">
                <select className={INPUT} value={draft.currency} onChange={(e) => set({ currency: e.target.value })}>
                  {["All", ...CURRENCIES].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Advanced filters — smooth vertical expansion */}
            <div
              className={cn(
                "grid transition-all duration-300 ease-in-out",
                advanced ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <div className="grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Customer">
                    <input
                      className={INPUT}
                      placeholder="Customer name"
                      value={draft.customer}
                      onChange={(e) => set({ customer: e.target.value })}
                    />
                  </Field>
                  <Field label="Invoice amount">
                    <div className="flex items-center gap-2">
                      <input
                        aria-label="Minimum amount"
                        type="number"
                        min="0"
                        placeholder="Min"
                        className={INPUT}
                        value={draft.amountMin}
                        onChange={(e) => set({ amountMin: e.target.value })}
                      />
                      <span className="shrink-0 text-xs text-muted-foreground">to</span>
                      <input
                        aria-label="Maximum amount"
                        type="number"
                        min="0"
                        placeholder="Max"
                        className={INPUT}
                        value={draft.amountMax}
                        onChange={(e) => set({ amountMax: e.target.value })}
                      />
                    </div>
                  </Field>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={clearAll}
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="h-4 w-4" />
                Clear filters
              </button>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setAdvanced((a) => !a)}
                  aria-expanded={advanced}
                  className="flex items-center gap-1 text-sm font-medium hover:text-foreground"
                >
                  {advanced ? "Less filters" : "More filters"}
                  <ChevronDown className={cn("h-4 w-4 transition-transform", advanced && "rotate-180")} />
                </button>
                <button type="submit" className="btn btn-primary h-9 text-sm">
                  <Search className="h-4 w-4" />
                  Search
                </button>
              </div>
            </div>
          </form>

          {loading ? (
            <TableSkeleton rows={8} cols={6} />
          ) : (
            <>
              {/* Table toolbar: count + Export */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3">
                <p className="text-sm">
                  <span className="font-semibold tnum">{view.total}</span>{" "}
                  {view.total === 1 ? "invoice" : "invoices"}
                </p>
              </div>

              {/* Invoices table */}
              {view.total === 0 ? (
                <div className="border-t">
                  <EmptyState
                    title="No invoices match your filters"
                    description="Try different filters, another period, or clear everything and search again."
                    action={
                      <button className="btn btn-outline" onClick={clearAll}>
                        Clear filters
                      </button>
                    }
                  />
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto border-t">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/40 text-left">
                          <Th>Invoice</Th>
                          <Th>Customer</Th>
                          <Th className="hidden lg:table-cell">Issue Date</Th>
                          <Th className="hidden md:table-cell">Due Date</Th>
                          <Th className="text-right">Amount</Th>
                          <Th>Status</Th>
                          <Th>Action</Th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {viewRows.map((r) => (
                          <tr
                            key={r.id}
                            onClick={() => setSelected(r.id)}
                            className="cursor-pointer transition-colors hover:bg-muted/40"
                          >
                            <td className="px-4 py-3 first:pl-5">
                              <button
                                className="font-medium text-primary hover:underline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelected(r.id);
                                }}
                              >
                                {r.id}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <span className="flex items-center gap-2">
                                <CustomerAvatar name={r.customer} />
                                <span className="max-w-44 truncate">{r.customer}</span>
                              </span>
                            </td>
                            <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground lg:table-cell">
                              {fmtDate(r.issue)}
                            </td>
                            <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground md:table-cell">
                              {fmtDate(r.due)}
                            </td>
                            <td className="px-4 py-3 text-right tnum">{formatMoney(invoiceTotals(r).total, r.currency)}</td>
                            <td className="px-4 py-3">
                              <StatusCell invoice={r} />
                            </td>
                            <td className="px-4 py-3">
                              <button
                                aria-label={`More actions for ${r.id}`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-input text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelected(r.id);
                                }}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>View</span>
                      <select
                        aria-label="Rows per page"
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="h-8 rounded-md border bg-card px-2 text-sm"
                      >
                        {PAGE_SIZES.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="tnum">
                        {view.from}–{view.to} of {view.total.toLocaleString()}
                      </span>
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={view.page === 1}
                        className="grid h-8 w-8 place-items-center rounded-md border disabled:opacity-40"
                        aria-label="Previous page"
                      >
                        <ChevronLeftSmall />
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.min(view.pages, p + 1))}
                        disabled={view.page >= view.pages}
                        className="grid h-8 w-8 place-items-center rounded-md border disabled:opacity-40"
                        aria-label="Next page"
                      >
                        <ChevronRightSmall />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </section>

        {/* Detail drawer */}
        {detail && (
          <DetailDrawerImpl
            invoice={detail}
            onClose={() => setSelected(null)}
            onDuplicate={() => duplicate(detail)}
            onRemind={() => {
              setRows((v) =>
                v.map((r) =>
                  r.id === detail.id ? { ...r, reminders: [...r.reminders, DEMO_TODAY.toISOString()] } : r,
                ),
              );
              toast.info("Reminder logged in demo — no email delivered");
            }}
            onCancel={() => setCancel(true)}
            onResetSelected={() => setSelected(null)}
          />
        )}
      </TooltipProvider>

      {create && (
        <InvoiceEditor
          id={nextId}
          onClose={() => setCreate(false)}
          onSave={(r) => {
            setRows((v) => [r, ...v]);
            setCreate(false);
            toast.success(
              r.status === "Sent"
                ? "Invoice marked Sent in demo — no email delivered"
                : "Demo draft saved",
            );
          }}
        />
      )}
      <ConfirmDialogImpl
        open={cancel}
        onOpenChange={setCancel}
        onConfirm={() => {
          setRows((v) => v.map((r) => (r.id === selected ? { ...r, status: "Cancelled" } : r)));
          setCancel(false);
        }}
      />
    </DashboardPage>
  );
}

/** Detail drawer with print, duplicate, reminder and cancel actions. */
function DetailDrawerImpl({ invoice, onClose, onDuplicate, onRemind, onCancel, onResetSelected }: {
  invoice: Invoice;
  onClose: () => void;
  onDuplicate: () => void;
  onRemind: () => void;
  onCancel: () => void;
  onResetSelected: () => void;
}) {
  return (
    <DetailDrawer
      open
      wide
      onOpenChange={(o) => !o && onClose()}
      title={invoice.id}
      subtitle={invoice.customer}
      badge={<InvoiceStatus status={invoiceStatus(invoice)} />}
      footer={
        <>
          <button
            className="btn btn-outline"
            onClick={() => {
              const html = document.getElementById("invoice-print")?.innerHTML;
              const w = window.open("", "_blank");
              if (w && html) {
                w.document.write(
                  `<html><head><title>${invoice.id}</title></head><body>${html}</body></html>`,
                );
                w.document.close();
                w.focus();
                w.print();
              } else toast.error("Allow pop-ups to print this invoice");
            }}
          >
            Print invoice
          </button>
          <button className="btn btn-outline" onClick={onDuplicate}>
            Duplicate
          </button>
          {!["Cancelled", "Paid", "Draft"].includes(invoice.status) && (
            <button className="btn btn-outline" onClick={onRemind}>
              Send reminder
            </button>
          )}
          {!["Cancelled", "Paid"].includes(invoice.status) && (
            <button className="btn btn-outline text-destructive" onClick={onCancel}>
              Cancel invoice
            </button>
          )}
        </>
      }
    >
      <div id="invoice-print">
        <InvoicePreview invoice={invoice} />
      </div>
      <h2 className="font-semibold">Payment history</h2>
      {invoice.payments.length ? (
        invoice.payments.map((p) => (
          <div key={p.reference} className="flex justify-between border-b pb-3 text-sm">
            <div>
              {p.reference}
              <p className="text-xs text-muted-foreground">{fmtDate(p.date)}</p>
            </div>
            {formatMoney(p.amount, invoice.currency)}
          </div>
        ))
      ) : (
        <EmptyState
          title="No payments recorded"
          description="Payments appear after provider confirmation."
        />
      )}
      <h2 className="font-semibold">Reminder activity</h2>
      {invoice.reminders.length ? (
        <Timeline
          events={invoice.reminders.map((d) => ({
            label: "Reminder logged",
            time: fmtDate(d),
            note: "Demo only — no email delivered.",
          }))}
        />
      ) : (
        <p className="text-sm text-muted-foreground">No reminders yet.</p>
      )}
    </DetailDrawer>
  );
}

function ConfirmDialogImpl({ open, onOpenChange, onConfirm }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Cancel this invoice?"
      description="The sample invoice will be marked Cancelled. Existing payment history is retained."
      danger
      onConfirm={onConfirm}
    />
  );
}

function Th({ children, className }: { children: ReactNode; className?: string | undefined }) {
  return (
    <th
      scope="col"
      className={cn(
        "whitespace-nowrap px-4 py-2.5 text-xs font-semibold tracking-[0.08em] text-muted-foreground first:pl-5",
        className,
      )}
    >
      {children}
    </th>
  );
}

const ChevronLeftSmall = () => (
  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
    <path d="M12 5 7 10l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ChevronRightSmall = () => (
  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
    <path d="m8 5 5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Re-exported helpers used by other invoice surfaces.
export { SlidersHorizontal, fmtDateTime };
