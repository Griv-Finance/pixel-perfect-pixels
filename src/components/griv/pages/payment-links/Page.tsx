import { useState } from "react";
import { Plus, Link2 } from "lucide-react";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from "recharts";
import {
  DashboardPage,
  MetricGrid,
  MetricCard,
  Toolbar,
  SearchInput,
  FilterSelect,
  ExportButton,
  StatusTabs,
  DataTable,
  EmptyState,
  DetailDrawer,
  DetailList,
  CopyButton,
  StatusBadge,
  ConfirmDialog,
  useDemoLoading,
  DateRangeSelect,
  type Column,
} from "@/components/griv/kit";
import { PAYMENT_LINKS, linkUrl, type PaymentLink } from "@/lib/demo/payment-links";
import { formatMoney, type Currency, CURRENCIES } from "@/lib/money";
import { fmtDate, inRange, type DateRange } from "@/lib/dates";
import { exportCsv } from "@/lib/csv";
import { LinkForm } from "./LinkForm";
export function PaymentLinksPage() {
  const [rows, setRows] = useState(PAYMENT_LINKS);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [currency, setCurrency] = useState("NGN");
  const [range, setRange] = useState<DateRange>("All time");
  const [selected, setSelected] = useState<string | null>(null);
  const [create, setCreate] = useState(false);
  const [confirm, setConfirm] = useState<PaymentLink | null>(null);
  const loading = useDemoLoading();
  const detail = rows.find((r) => r.id === selected);
  const filtered = rows.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) &&
      (status === "All" || r.status === status) &&
      (currency === "All" || r.currency === currency) &&
      inRange(r.created, range),
  );
  const moneyRows = rows.filter((r) => r.currency === currency);
  const payments = moneyRows.flatMap((r) => r.payments);
  const clear = () => {
    setSearch("");
    setStatus("All");
    setCurrency("All");
    setRange("All time");
  };
  const duplicate = (r: PaymentLink) => {
    setRows((v) => [
      {
        ...r,
        id: crypto.randomUUID(),
        name: `${r.name} (copy)`,
        slug: `${r.slug}-${Date.now().toString(36)}`,
        status: "Inactive",
        payments: [],
      },
      ...v,
    ]);
    toast.success("Demo link duplicated as inactive");
  };
  const share = async (r: PaymentLink) => {
    try {
      if (navigator.share) await navigator.share({ title: r.name, url: linkUrl(r) });
      else {
        await navigator.clipboard.writeText(linkUrl(r));
        toast.success("Link copied — share it anywhere");
      }
    } catch {
      toast.info("Sharing cancelled or unavailable");
    }
  };
  const columns: Column<PaymentLink>[] = [
    {
      key: "name",
      header: "Link name",
      sort: (r) => r.name,
      cell: (r) => (
        <div>
          <button className="font-semibold text-left" onClick={() => setSelected(r.id)}>
            {r.name}
          </button>
          <div className="mt-1 max-w-52 truncate text-xs text-muted-foreground">
            {linkUrl(r).replace("https://", "")}
          </div>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      sort: (r) => r.amount,
      cell: (r) => (
        <div>
          {r.model === "Fixed amount" ? formatMoney(r.amount, r.currency) : "Customer chooses"}
          <p className="text-xs text-muted-foreground">
            {r.currency} ·{" "}
            {r.model === "Fixed amount"
              ? "Fixed amount"
              : `${formatMoney(r.min, r.currency)}–${formatMoney(r.max, r.currency)}`}
          </p>
        </div>
      ),
    },
    {
      key: "payments",
      header: "Payments",
      hideBelow: "md",
      sort: (r) => r.payments.length,
      cell: (r) => r.payments.length,
    },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    {
      key: "created",
      header: "Created",
      hideBelow: "lg",
      sort: (r) => r.created,
      cell: (r) => fmtDate(r.created),
    },
    {
      key: "expiry",
      header: "Expiry",
      hideBelow: "lg",
      cell: (r) => (r.expiry ? fmtDate(r.expiry) : "No expiry"),
    },
  ];
  return (
    <DashboardPage
      title="Payment Links"
      crumbs={[{ label: "Get paid" }, { label: "Payment Links" }]}
      description="A simple, shareable way to collect from anyone, anywhere."
      actions={
        <button className="btn btn-primary" onClick={() => setCreate(true)}>
          <Plus className="h-4 w-4" />
          Create payment link
        </button>
      }
    >
      <MetricGrid>
        <MetricCard label="Links created" value={rows.length} icon={Link2} />
        <MetricCard
          label="Active links"
          value={rows.filter((r) => r.status === "Active").length}
          sub="Ready to share · sample links"
        />
        <MetricCard
          label="Completed payments"
          value={currency === "All" ? rows.flatMap((r) => r.payments).length : payments.length}
          sub={currency === "All" ? "All currencies · sample data" : currency}
        />
        <MetricCard
          label="Total collected"
          dark
          value={
            currency === "All"
              ? "Select a currency"
              : formatMoney(
                  payments.reduce((s, p) => s + p.amount, 0),
                  currency as Currency,
                )
          }
          sub="Confirmed sample payments only"
        />
      </MetricGrid>
      <section className="panel overflow-hidden">
        <Toolbar
          right={
            <ExportButton
              disabled={!filtered.length}
              onClick={() =>
                exportCsv(
                  "payment-links",
                  filtered.map((r) => ({
                    name: r.name,
                    url: linkUrl(r),
                    model: r.model,
                    amount: r.amount,
                    currency: r.currency,
                    payments: r.payments.length,
                    status: r.status,
                    created: r.created,
                    expiry: r.expiry,
                  })),
                )
              }
            />
          }
        >
          <SearchInput placeholder="Search payment links…" value={search} onChange={setSearch} />
          <FilterSelect
            label="Currency"
            value={currency}
            onChange={setCurrency}
            options={["All", ...CURRENCIES]}
          />
          <DateRangeSelect value={range} onChange={setRange} />
          <button className="text-sm text-primary" onClick={clear}>
            Clear filters
          </button>
        </Toolbar>
        <StatusTabs
          value={status}
          onChange={setStatus}
          tabs={["All", "Active", "Inactive", "Expired"].map((s) => ({
            value: s,
            label: s,
            count: rows.filter((r) => s === "All" || r.status === s).length,
          }))}
        />
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(r) => r.id}
          loading={loading}
          onRowClick={(r) => setSelected(r.id)}
          empty={
            <EmptyState
              title="No payment links found"
              description="Try a different search or create your first link."
              action={
                <button className="btn btn-outline" onClick={clear}>
                  Clear filters
                </button>
              }
            />
          }
          rowActions={(r) => (
            <select
              aria-label={`Actions for ${r.name}`}
              className="field w-24 text-xs"
              value=""
              onChange={(e) => {
                const a = e.target.value;
                if (a === "copy") {
                  navigator.clipboard
                    .writeText(linkUrl(r))
                    .then(() => toast.success("Link copied"))
                    .catch(() => toast.error("Copy unavailable"));
                }
                if (a === "share") void share(r);
                if (a === "details") setSelected(r.id);
                if (a === "toggle") setConfirm(r);
                if (a === "duplicate") duplicate(r);
              }}
            >
              <option value="">Actions</option>
              <option value="details">View details</option>
              <option value="copy">Copy link</option>
              <option value="share">Share</option>
              {r.status !== "Expired" && (
                <option value="toggle">
                  {r.status === "Active" ? "Deactivate" : "Reactivate"}
                </option>
              )}
              <option value="duplicate">Duplicate</option>
            </select>
          )}
        />
      </section>
      {create && (
        <LinkForm
          onClose={() => setCreate(false)}
          onSave={(r) => {
            setRows((v) => [r, ...v]);
            setCreate(false);
            toast.success("Demo payment link created — no live checkout");
          }}
        />
      )}
      {detail && (
        <DetailDrawer
          open
          onOpenChange={(o) => !o && setSelected(null)}
          title={detail.name}
          subtitle="Collection performance · sample data"
          badge={<StatusBadge status={detail.status} />}
          footer={
            <>
              <CopyButton value={linkUrl(detail)} label="Copy link" />
              <button className="btn btn-outline" onClick={() => share(detail)}>
                Share
              </button>
              <button className="btn btn-outline" onClick={() => duplicate(detail)}>
                Duplicate
              </button>
              {detail.status !== "Expired" && (
                <button className="btn btn-outline" onClick={() => setConfirm(detail)}>
                  {detail.status === "Active" ? "Deactivate" : "Reactivate"}
                </button>
              )}
            </>
          }
        >
          <p className="break-all text-sm text-primary">{linkUrl(detail)}</p>
          <DetailList
            items={[
              ["Pricing", detail.model],
              ["Currency", detail.currency],
              ["Description", detail.description || "—"],
              [
                "Phone / address",
                `${detail.phone ? "Required" : "Not required"} / ${detail.address ? "Required" : "Not required"}`,
              ],
              ["Expiry", detail.expiry ? fmtDate(detail.expiry) : "No expiry"],
              ["Redirect", detail.redirect || "None"],
              [
                "Collected",
                formatMoney(
                  detail.payments.reduce((s, p) => s + p.amount, 0),
                  detail.currency,
                ),
              ],
            ]}
          />
          <h2 className="font-semibold">Collection history</h2>
          {detail.payments.length ? (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={detail.payments.map((p) => ({ date: fmtDate(p.date), amount: p.amount }))}
                >
                  <XAxis dataKey="date" fontSize={10} />
                  <Tooltip formatter={(v) => formatMoney(Number(v), detail.currency)} />
                  <Bar dataKey="amount" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState title="No collections yet" />
          )}
          <h2 className="font-semibold">Associated payments</h2>
          {detail.payments.map((p) => (
            <div key={p.reference} className="flex justify-between gap-3 border-b pb-3 text-sm">
              <div>
                {p.customer}
                <p className="text-xs text-muted-foreground">
                  {p.reference} · {fmtDate(p.date)}
                </p>
              </div>
              <div className="text-right">
                {formatMoney(p.amount, detail.currency)}
                <p>
                  <StatusBadge status="Successful" />
                </p>
              </div>
            </div>
          ))}
        </DetailDrawer>
      )}
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={`${confirm?.status === "Active" ? "Deactivate" : "Reactivate"} payment link?`}
        description="This changes the local sample link only. No live checkout is affected."
        onConfirm={() => {
          if (confirm)
            setRows((v) =>
              v.map((r) =>
                r.id === confirm.id
                  ? { ...r, status: r.status === "Active" ? "Inactive" : "Active" }
                  : r,
              ),
            );
          setConfirm(null);
        }}
      />
    </DashboardPage>
  );
}
