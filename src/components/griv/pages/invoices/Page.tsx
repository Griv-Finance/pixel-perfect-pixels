import { useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  MoreHorizontal,
  Plus,
  Send,
  SlidersHorizontal,
  User,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  DashboardPage,
  MetricGrid,
  MetricCard,
  Toolbar,
  SearchInput,
  FilterSelect,
  ExportButton,
  DataTable,
  EmptyState,
  DetailDrawer,
  FormDialog,
  ConfirmDialog,
  Timeline,
  useDemoLoading,
  type Column,
} from "@/components/griv/kit";
import {
  INVOICES,
  invoiceTotals,
  invoicePaid,
  invoiceStatus,
  type Invoice,
} from "@/lib/demo/invoices";
import { customerByName } from "@/lib/demo/customers";
import { CURRENCIES, formatMoney, type Currency } from "@/lib/money";
import { fmtDate, DEMO_TODAY } from "@/lib/dates";
import { statusTone, TONE_CLASS } from "@/lib/status";
import { cn } from "@/lib/utils";
import { exportCsv } from "@/lib/csv";
import { InvoiceEditor, InvoicePreview } from "./InvoiceEditor";

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

/** Avatar-style icon distinguishing people from organisations. */
function CustomerAvatar({ name }: { name: string }) {
  const isOrg = customerByName(name)?.kind === "org";
  return (
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-primary">
      {isOrg ? <Building2 className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
    </span>
  );
}

export function InvoicesPage() {
  const [rows, setRows] = useState(INVOICES);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [moreOpen, setMoreOpen] = useState(false);
  const [currency, setCurrency] = useState("All");
  const [issueFrom, setIssueFrom] = useState("");
  const [issueTo, setIssueTo] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [create, setCreate] = useState(false);
  const [cancel, setCancel] = useState(false);
  const loading = useDemoLoading();
  const detail = rows.find((r) => r.id === selected);
  const nextId = `GRV-INV-${String(Math.max(...rows.map((r) => Number(r.id.slice(8)))) + 1).padStart(4, "0")}`;
  const moreCount = [currency !== "All", issueFrom !== "", issueTo !== ""].filter(Boolean).length;
  // Metrics never sum across currencies; when no currency filter is set they read NGN only.
  const metricCurrency: Currency = currency === "All" ? "NGN" : (currency as Currency);
  const scoped = rows.filter((r) => r.currency === metricCurrency);
  const outstanding = (r: Invoice) =>
    r.status === "Draft" || r.status === "Cancelled"
      ? 0
      : Math.max(0, invoiceTotals(r).total - invoicePaid(r));
  const filtered = rows.filter(
    (r) =>
      `${r.id} ${r.customer}`.toLowerCase().includes(search.toLowerCase()) &&
      (status === "All" || invoiceStatus(r) === status) &&
      (currency === "All" || r.currency === currency) &&
      (!issueFrom || r.issue >= issueFrom) &&
      (!issueTo || r.issue <= issueTo),
  );
  const clearMore = () => {
    setCurrency("All");
    setIssueFrom("");
    setIssueTo("");
  };
  const money = (n: number) => formatMoney(n, metricCurrency);
  const duplicate = (r: Invoice) => {
    setRows((v) => [
      {
        ...r,
        id: nextId,
        issue: "2026-10-22",
        due: "2026-11-05",
        status: "Draft",
        payments: [],
        reminders: [],
      },
      ...v,
    ]);
    toast.success("Invoice duplicated as draft");
  };
  const columns: Column<Invoice>[] = [
    {
      key: "id",
      header: "Invoice",
      sort: (r) => r.id,
      cell: (r) => (
        <button className="font-semibold" onClick={() => setSelected(r.id)}>
          {r.id}
        </button>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      cell: (r) => (
        <span className="flex items-center gap-2">
          <CustomerAvatar name={r.customer} />
          <span className="truncate">{r.customer}</span>
        </span>
      ),
    },
    {
      key: "issue",
      header: "Issue Date",
      hideBelow: "lg",
      sort: (r) => r.issue,
      cell: (r) => fmtDate(r.issue),
    },
    { key: "due", header: "Due Date", hideBelow: "md", sort: (r) => r.due, cell: (r) => fmtDate(r.due) },
    {
      key: "total",
      header: "Amount",
      sort: (r) => invoiceTotals(r).total,
      cell: (r) => formatMoney(invoiceTotals(r).total, r.currency),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => <InvoiceStatus status={invoiceStatus(r)} />,
    },
    {
      key: "action",
      header: "Action",
      cell: (r) => (
        <button
          aria-label={`View ${r.id}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-input text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            setSelected(r.id);
          }}
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      ),
    },
  ];
  return (
    <DashboardPage
      title="Invoices"
      crumbs={[{ label: "Get paid" }, { label: "Invoices" }]}
      description="Formal customer billing, from first draft to final payment."
      actions={
        <button className="btn btn-primary" onClick={() => setCreate(true)}>
          <Plus className="h-4 w-4" />
          Create invoice
        </button>
      }
    >
      <p className="mb-5 text-sm text-muted-foreground">
        Invoices bill a specific customer with line items and payment terms. Payment links are
        reusable, shareable collection links.
      </p>
      <MetricGrid>
        <MetricCard label="Outstanding" value={money(scoped.reduce((s, r) => s + outstanding(r), 0))} dark sub="Excludes drafts and cancellations" />
        <MetricCard
          label="Overdue"
          value={money(
            scoped
              .filter((r) => invoiceStatus(r) === "Overdue")
              .reduce((s, r) => s + outstanding(r), 0),
          )}
          sub="As of 22 Oct 2026 · demo today"
        />
        <MetricCard
          label="Paid this month"
          value={money(
            scoped
              .flatMap((r) => r.payments)
              .filter((p) => p.date.startsWith("2026-10"))
              .reduce((s, p) => s + p.amount, 0),
          )}
          sub="Confirmed sample receipts"
        />
        <MetricCard
          label="Drafts"
          value={scoped.filter((r) => r.status === "Draft").length}
          sub="Not yet sent"
        />
      </MetricGrid>
      <section className="panel overflow-hidden">
        <Toolbar
          right={
            <ExportButton
              disabled={!filtered.length}
              onClick={() =>
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
                    outstanding: outstanding(r),
                    status: invoiceStatus(r),
                  })),
                )
              }
            />
          }
        >
          <SearchInput
            placeholder="Search invoice or customer…"
            value={search}
            onChange={setSearch}
          />
          <FilterSelect
            label="Status"
            value={status}
            onChange={setStatus}
            options={["All", "Draft", "Sent", "Partially paid", "Paid", "Overdue", "Cancelled"]}
          />
          <button className="btn btn-outline h-9 text-sm" onClick={() => setMoreOpen(true)}>
            <SlidersHorizontal className="h-4 w-4" />
            More Filters
            {moreCount > 0 && (
              <span className="rounded-full bg-primary/10 px-1.5 text-xs font-semibold text-primary tnum">
                {moreCount}
              </span>
            )}
          </button>
        </Toolbar>
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(r) => r.id}
          loading={loading}
          onRowClick={(r) => setSelected(r.id)}
          empty={
            <EmptyState
              title="No invoices found"
              action={
                <button className="btn btn-outline" onClick={clearMore}>
                  Clear filters
                </button>
              }
            />
          }
        />
      </section>
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
      {moreOpen && (
        <FormDialog
          open
          onOpenChange={setMoreOpen}
          title="More filters"
          description="Narrow the invoice list further."
          footer={
            <>
              <button className="btn btn-outline" onClick={clearMore}>
                Clear
              </button>
              <button className="btn btn-primary" onClick={() => setMoreOpen(false)}>
                Apply
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <FilterSelect
              label="Currency"
              value={currency}
              onChange={setCurrency}
              options={["All", ...CURRENCIES]}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Issued from</span>
                <input type="date" className="field" value={issueFrom} onChange={(e) => setIssueFrom(e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Issued to</span>
                <input type="date" className="field" value={issueTo} onChange={(e) => setIssueTo(e.target.value)} />
              </label>
            </div>
          </div>
        </FormDialog>
      )}
      {detail && (
        <DetailDrawer
          open
          wide
          onOpenChange={(o) => !o && setSelected(null)}
          title={detail.id}
          subtitle={detail.customer}
          badge={<InvoiceStatus status={invoiceStatus(detail)} />}
          footer={
            <>
              <button
                className="btn btn-outline"
                onClick={() => {
                  const html = document.getElementById("invoice-print")?.innerHTML;
                  const w = window.open("", "_blank");
                  if (w && html) {
                    w.document.write(
                      `<html><head><title>${detail.id}</title></head><body>${html}</body></html>`,
                    );
                    w.document.close();
                    w.focus();
                    w.print();
                  } else toast.error("Allow pop-ups to print this invoice");
                }}
              >
                Print invoice
              </button>
              <button className="btn btn-outline" onClick={() => duplicate(detail)}>
                Duplicate
              </button>
              {!["Cancelled", "Paid", "Draft"].includes(detail.status) && (
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setRows((v) =>
                      v.map((r) =>
                        r.id === detail.id
                          ? { ...r, reminders: [...r.reminders, DEMO_TODAY.toISOString()] }
                          : r,
                      ),
                    );
                    toast.info("Reminder logged in demo — no email delivered");
                  }}
                >
                  Send reminder
                </button>
              )}
              {!["Cancelled", "Paid"].includes(detail.status) && (
                <button
                  className="btn btn-outline text-destructive"
                  onClick={() => setCancel(true)}
                >
                  Cancel invoice
                </button>
              )}
            </>
          }
        >
          <div id="invoice-print">
            <InvoicePreview invoice={detail} />
          </div>
          <h2 className="font-semibold">Payment history</h2>
          {detail.payments.length ? (
            detail.payments.map((p) => (
              <div key={p.reference} className="flex justify-between border-b pb-3 text-sm">
                <div>
                  {p.reference}
                  <p className="text-xs text-muted-foreground">{fmtDate(p.date)}</p>
                </div>
                {formatMoney(p.amount, detail.currency)}
              </div>
            ))
          ) : (
            <EmptyState
              title="No payments recorded"
              description="Payments appear after provider confirmation."
            />
          )}
          <h2 className="font-semibold">Reminder activity</h2>
          {detail.reminders.length ? (
            <Timeline
              events={detail.reminders.map((d) => ({
                label: "Reminder logged",
                time: fmtDate(d),
                note: "Demo only — no email delivered.",
              }))}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No reminders yet.</p>
          )}
        </DetailDrawer>
      )}
      <ConfirmDialog
        open={cancel}
        onOpenChange={setCancel}
        title="Cancel this invoice?"
        description="The sample invoice will be marked Cancelled. Existing payment history is retained."
        danger
        onConfirm={() => {
          setRows((v) => v.map((r) => (r.id === selected ? { ...r, status: "Cancelled" } : r)));
          setCancel(false);
        }}
      />
    </DashboardPage>
  );
}
