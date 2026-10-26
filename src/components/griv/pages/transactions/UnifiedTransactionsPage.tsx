import { useMemo, useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { ChevronDown, Plus, SlidersHorizontal, X } from "lucide-react";
import {
  DashboardPage,
  MetricGrid,
  MetricCard,
  Toolbar,
  SearchInput,
  DateRangeSelect,
  FilterSelect,
  ExportButton,
  StatusTabs,
  DataTable,
  EmptyState,
  StatusBadge,
  useDemoLoading,
  type Column,
} from "@/components/griv/kit";
import { AdvancedFilters } from "./AdvancedFilters";
import { TxnDetails } from "./TxnDetails";
import { TransferFlow } from "../transfers/TransferFlow";
import { PayoutFlow } from "../payouts/PayoutFlow";
import { BulkPayoutFlow } from "../payouts/BulkPayoutFlow";
import { CHANNELS, useLedger } from "@/lib/demo/ledger";
import { transfersStore } from "@/lib/demo/transfers";
import { payoutsStore } from "@/lib/demo/payouts";
import { useAccounts } from "@/lib/demo/accounts";
import {
  applyTxnFilters,
  countActiveTxnFilters,
  DEFAULT_TXN_FILTERS,
  mergeTxns,
  SOURCE_CHANNELS,
  TXN_STATUSES,
  TYPE_TABS,
  type TxnFilters,
  type UnifiedTxn,
} from "@/lib/demo/unified";
import { CURRENCIES, formatMoney, totalsByCurrency } from "@/lib/money";
import { fmtDateTime, inRange, type DateRange } from "@/lib/dates";
import { exportCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";

const METHODS = ["All", ...new Set([...CHANNELS, "Mobile money"])];

export function UnifiedTransactionsPage() {
  const ledger = useLedger();
  const transfers = transfersStore.use();
  const payouts = payoutsStore.use();
  const accounts = useAccounts();
  const loading = useDemoLoading();
  const { q } = useSearch({ strict: false }) as { q?: string };
  const [filters, setFilters] = useState<TxnFilters>(() => ({ ...DEFAULT_TXN_FILTERS, ref: q ?? "" }));
  const [date, setDate] = useState<DateRange>("Last 30 days");
  const [advanced, setAdvanced] = useState(false);
  const [menu, setMenu] = useState(false);
  const [flow, setFlow] = useState<"transfer" | "payout" | "bulk" | null>(null);
  const [selected, setSelected] = useState<UnifiedTxn>();

  const all = useMemo(
    () => mergeTxns(ledger, transfers, payouts, accounts),
    [ledger, transfers, payouts, accounts],
  );
  const dateScoped = useMemo(() => all.filter((r) => inRange(r.date, date)), [all, date]);
  const scoped = useMemo(
    () =>
      dateScoped.filter(
        (r) =>
          (filters.currency === "All" || r.currency === filters.currency) &&
          ((filters.type !== "Pay-ins" && filters.type !== "Pay-in" && filters.type !== "Funding") ||
            r.type === "Payment") &&
          (filters.type !== "Transfers" || r.type === "Transfer") &&
          (filters.type !== "Payouts" || r.type === "Payout") &&
          (filters.type !== "Refunds" || r.type === "Refund"),
      ),
    [dateScoped, filters.currency, filters.type],
  );
  const rows = useMemo(() => applyTxnFilters(scoped, filters), [scoped, filters]);
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tab of TYPE_TABS)
      counts[tab] = scoped.filter((r) =>
        tab === "All"
          ? true
          : tab === "Pay-ins"
            ? r.type === "Payment"
            : tab === "Transfers"
              ? r.type === "Transfer"
              : tab === "Payouts"
                ? r.type === "Payout"
                : r.type === "Refund",
      ).length;
    return counts;
  }, [scoped]);

  const activeCount = countActiveTxnFilters(filters);
  const chipFilters: [string, string, (f: TxnFilters) => boolean, (f: TxnFilters) => Partial<TxnFilters>][] = [
    ["status", "Status", (f) => f.status !== "All", () => ({ status: "All" })],
    ["method", "Method", (f) => f.method !== "All", () => ({ method: "All" })],
    ["sourceChannel", "Channel", (f) => f.sourceChannel !== "All", () => ({ sourceChannel: "All" })],
    ["payinType", "Pay-in type", (f) => f.payinType !== "All", () => ({ payinType: "All" })],
    ["amount", "Amount", (f) => !!(f.amount || f.amountMin || f.amountMax), () => ({ amount: "", amountMin: "", amountMax: "" })],
    ["from", "Date range", (f) => !!(f.from || f.to), () => ({ from: "", to: "" })],
    ["ref", "Reference", (f) => !!f.ref.trim(), () => ({ ref: "" })],
    ["recipient", "Recipient", (f) => !!f.recipient.trim(), () => ({ recipient: "" })],
    ["account", "Account", (f) => f.account !== "All", () => ({ account: "All" })],
    ["originalRef", "Original transaction", (f) => !!f.originalRef.trim(), () => ({ originalRef: "" })],
    ["keyword", "Keyword", (f) => !!f.keyword.trim(), () => ({ keyword: "" })],
  ];
  const activeChips = chipFilters.filter(([, , isActive]) => isActive(filters));
  const moneyTotals = totalsByCurrency(scoped, (r) => r.amount, (r) => r.currency);
  const totals = Object.entries(moneyTotals).map(([c, n]) => (
    <span key={c} className="block text-lg">
      {formatMoney(n, c as (typeof CURRENCIES)[number])}
    </span>
  ));
  const successful = scoped.filter((r) => r.status === "Successful").length;

  const setPresetDate = (v: DateRange) => {
    setDate(v);
    setFilters((f) => ({ ...f, from: "", to: "" }));
  };
  const clearAll = () => {
    setFilters({ ...DEFAULT_TXN_FILTERS });
    setDate("All time");
  };
  const columns: Column<UnifiedTxn>[] = [
    {
      key: "reference",
      header: "Reference / party",
      cell: (r) => (
        <button className="text-left" onClick={() => setSelected(r)}>
          <span className="block font-medium">{r.id}</span>
          <span className="block max-w-48 truncate text-xs text-muted-foreground">
            {r.note || r.party}
          </span>
        </button>
      ),
      sort: (r) => r.id,
    },
    { key: "type", header: "Type", cell: (r) => r.type, sort: (r) => r.type, hideBelow: "md" },
    {
      key: "party",
      header: "Customer / recipient",
      cell: (r) => (
        <div className="max-w-44 truncate">
          {r.party}
          {r.email && <span className="block text-xs font-normal text-muted-foreground">{r.email}</span>}
        </div>
      ),
      sort: (r) => r.party,
      hideBelow: "sm",
    },
    {
      key: "amount",
      header: "Amount",
      cell: (r) => formatMoney(r.amount, r.currency),
      sort: (r) => r.amount,
      align: "right",
    },
    { key: "currency", header: "Currency", cell: (r) => r.currency, hideBelow: "lg" },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} />, sort: (r) => r.status },
    { key: "method", header: "Method", cell: (r) => r.method, sort: (r) => r.method, hideBelow: "lg" },
    {
      key: "date",
      header: "Date",
      cell: (r) => fmtDateTime(r.date),
      sort: (r) => r.date,
      hideBelow: "lg",
    },
  ];

  return (
    <DashboardPage
      title="Transactions"
      crumbs={[{ label: "Money" }]}
      description="View, track, and manage all your financial transactions in one place."
      actions={
        <>
          <div className="relative">
            <button className="btn btn-primary" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-haspopup="menu">
              <Plus className="h-4 w-4" />
              New
              <ChevronDown className="h-4 w-4 opacity-70" />
            </button>
            {menu && (
              <div className="absolute right-0 z-30 mt-1 w-48 rounded-lg border bg-popover p-1 shadow-lg" role="menu">
                {(
                  [
                    ["New transfer", "transfer"],
                    ["Create payout", "payout"],
                    ["Bulk payout", "bulk"],
                  ] as const
                ).map(([label, key]) => (
                  <button
                    key={key}
                    role="menuitem"
                    className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => {
                      setMenu(false);
                      setFlow(key);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <ExportButton
            disabled={!rows.length}
            onClick={() => exportCsv("transactions", rows.map((r) => ({ ...r, net: r.amount - r.fee })))}
          />
        </>
      }
    >
      <MetricGrid cols={4}>
        <MetricCard
          dark
          label="Gross transaction volume"
          value={totals.length ? totals : "—"}
          sub="Separate totals per currency · selected period"
        />
        <MetricCard label="Transactions" value={scoped.length} sub="Sample records" />
        <MetricCard
          label="Successful"
          value={successful}
          sub={scoped.length ? `${((successful / scoped.length) * 100).toFixed(1)}% success rate` : "No records yet"}
        />
        <MetricCard
          label="Pending"
          value={scoped.filter((r) => r.status === "Pending" || r.status.includes("pending")).length}
          sub="Awaiting confirmation"
        />
      </MetricGrid>
      <section className="panel overflow-hidden">
        <StatusTabs
          value={filters.type}
          onChange={(type) => setFilters((f) => ({ ...f, type }))}
          tabs={TYPE_TABS.map((tab) => ({
            value: tab,
            label: tab === "All" ? "All Transactions" : tab,
            count: tabCounts[tab],
          }))}
        />
        <Toolbar>
          <SearchInput
            value={filters.keyword}
            onChange={(keyword) => setFilters((f) => ({ ...f, keyword }))}
            placeholder="Search reference or customer…"
          />
          <DateRangeSelect value={date} onChange={setPresetDate} />
          <FilterSelect
            label="Status"
            value={filters.status}
            onChange={(status) => setFilters((f) => ({ ...f, status }))}
            options={["All", ...TXN_STATUSES]}
          />
          <button
            onClick={() => setAdvanced((a) => !a)}
            aria-expanded={advanced}
            className={cn(
              "btn btn-outline h-9 text-sm",
              activeCount > 0 && "border-primary text-primary",
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Advanced Filters
            {activeCount > 0 && (
              <span className="rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground tnum">
                {activeCount}
              </span>
            )}
          </button>
          {(activeCount > 0 || date !== "All time") && (
            <button onClick={clearAll} className="text-sm font-semibold text-primary hover:underline">
              Clear all
            </button>
          )}
        </Toolbar>
        <AdvancedFilters
          open={advanced}
          onToggle={() => setAdvanced((a) => !a)}
          active={filters}
          onApply={(f) => {
            setFilters(f);
            if (f.from || f.to) setDate("All time");
          }}
          accounts={accounts.map((a) => ({ value: a.id, label: a.name }))}
        />
        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b px-5 py-3">
            {activeChips.map(([key, label, , clear]) => (
              <button
                key={key}
                onClick={() => setFilters((f) => ({ ...f, ...clear(f) }))}
                className="flex items-center gap-1.5 rounded-full border bg-muted/50 py-1 pl-3 pr-2 text-xs font-medium hover:border-destructive hover:text-destructive"
              >
                {label}: {key === "amount"
                  ? filters.amount
                    ? `${filters.amountOp} ${filters.amount}`
                    : `${filters.amountMin || "0"}–${filters.amountMax || "∞"}`
                  : key === "from"
                    ? `${filters.from || "…"} → ${filters.to || "…"}`
                    : filters[key as keyof TxnFilters] as string}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.id}
          onRowClick={setSelected}
          loading={loading}
          initialSort={{ key: "date", dir: "desc" }}
          empty={
            <EmptyState
              title="No matching transactions"
              description="Try another date range or clear your filters."
              action={
                <button className="btn btn-outline" onClick={clearAll}>
                  Clear filters
                </button>
              }
            />
          }
        />
      </section>
      <TxnDetails txn={selected} onClose={() => setSelected(undefined)} />
      {flow === "transfer" && <TransferFlow onClose={() => setFlow(null)} />}
      {flow === "payout" && <PayoutFlow onClose={() => setFlow(null)} />}
      {flow === "bulk" && <BulkPayoutFlow onClose={() => setFlow(null)} />}
    </DashboardPage>
  );
}
