import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearch } from "@tanstack/react-router";
import { ChevronDown, Download, Globe, Info, Plus, Search, Trash2 } from "lucide-react";
import {
  DashboardPage,
  EmptyState,
  Field,
  StatusBadge,
  TableSkeleton,
  useDemoLoading,
} from "@/components/griv/kit";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TxnDetails } from "./TxnDetails";
import { DateRangePicker } from "./DateRangePicker";
import { TransferFlow } from "../transfers/TransferFlow";
import { PayoutFlow } from "../payouts/PayoutFlow";
import { BulkPayoutFlow } from "../payouts/BulkPayoutFlow";
import { CHANNELS, useLedger } from "@/lib/demo/ledger";
import { transfersStore } from "@/lib/demo/transfers";
import { payoutsStore } from "@/lib/demo/payouts";
import { useAccounts } from "@/lib/demo/accounts";
import {
  applyTxnFilters,
  DEFAULT_PAGE_SIZE,
  DEFAULT_TXN_FILTERS,
  mergeTxns,
  matchesTxnType,
  ORIGINS,
  PAGE_SIZES,
  paginate,
  PROVIDER_OPTIONS,
  SHOW_FOR_TYPES,
  TXN_STATUSES,
  type TxnFilters,
  type UnifiedTxn,
} from "@/lib/demo/unified";
import { CURRENCIES, formatMoney } from "@/lib/money";
import { fmtDateTime } from "@/lib/dates";
import { exportCsv } from "@/lib/csv";
import { txnStatusClass } from "@/lib/status";
import { cn } from "@/lib/utils";

const METHODS = ["All", ...new Set([...CHANNELS, "Mobile money"])];
const TYPE_LABEL: Record<string, string> = {
  Payment: "Deposit",
  Payout: "Withdrawal",
  Transfer: "Transfer",
  Refund: "Refund",
  Fee: "Fee",
  Settlement: "Settlement",
  Reversal: "Reversal",
};

const INPUT = "field h-9 w-full text-sm";

/** Status cell: soft badge, plus an info icon with the provider's failure reason for failed rows. */
function StatusCell({ txn }: { txn: UnifiedTxn }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          "inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold",
          txnStatusClass(txn.status),
        )}
      >
        {txn.status}
      </span>
      {txn.status === "Failed" && txn.reason && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button aria-label="Failure reason" className="text-warning hover:text-foreground">
              <Info className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-56 border-0 bg-blackwood text-xs text-blackwood-foreground">{txn.reason}</TooltipContent>
        </Tooltip>
      )}
    </span>
  );
}

export function UnifiedTransactionsPage() {
  const ledger = useLedger();
  const transfers = transfersStore.use();
  const payouts = payoutsStore.use();
  const accounts = useAccounts();
  const loading = useDemoLoading();
  const { q } = useSearch({ strict: false }) as { q?: string };
  const initial = useMemo<TxnFilters>(() => ({ ...DEFAULT_TXN_FILTERS, ref: q ?? "" }), [q]);
  const [showFor, setShowFor] = useState<(typeof SHOW_FOR_TYPES)[number]>("All transactions");
  const [draft, setDraft] = useState<TxnFilters>(initial);
  const [applied, setApplied] = useState<TxnFilters>(initial);
  const [advanced, setAdvanced] = useState(false);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [page, setPage] = useState(1);
  const [menu, setMenu] = useState(false);
  const [flow, setFlow] = useState<"transfer" | "payout" | "bulk" | null>(null);
  const [selected, setSelected] = useState<UnifiedTxn>();
  const [exportOpen, setExportOpen] = useState(false);

  const all = useMemo(
    () => mergeTxns(ledger, transfers, payouts, accounts),
    [ledger, transfers, payouts, accounts],
  );
  const typed = useMemo(() => all.filter((r) => matchesTxnType(r, showFor)), [all, showFor]);
  const filtered = useMemo(() => applyTxnFilters(typed, applied), [typed, applied]);
  useEffect(() => setPage(1), [applied, showFor, pageSize]);
  const view = useMemo(() => paginate(filtered, page, pageSize), [filtered, page, pageSize]);

  const set = (patch: Partial<TxnFilters>) => setDraft((d) => ({ ...d, ...patch }));
  const search = () => setApplied({ ...draft });
  const clearAll = () => {
    const empty = { ...DEFAULT_TXN_FILTERS };
    setDraft(empty);
    setApplied(empty);
  };
  const doExport = (excel: boolean) => {
    setExportOpen(false);
    exportCsv(
      "transactions",
      filtered.map((r) => ({
        reference: r.id,
        transactionId: r.txnId,
        status: r.status,
        type: r.type,
        customer: r.party,
        email: r.email ?? "",
        amount: r.amount,
        fee: r.fee,
        net: r.amount - r.fee,
        currency: r.currency,
        method: r.method,
        channel: r.origin,
        provider: r.provider,
        source: r.source ?? "",
        destination: r.destination ?? "",
        date: r.date,
        note: r.note,
      })),
      { excel },
    );
  };

  return (
    <DashboardPage
      title="Transactions"
      description="View, monitor, and manage all your business transactions."
      actions={
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
      }
    >
      <TooltipProvider delayDuration={100}>
        {/* Show for: All transactions ▼ */}
        <div className="mb-3 flex items-center gap-1.5">
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                aria-haspopup="listbox"
              >
                <Globe className="h-4 w-4" />
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
              <Field label="Transaction reference">
                <input
                  className={INPUT}
                  placeholder="E.g. GRV-802400…"
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
              <Field label="Transaction status">
                <select className={INPUT} value={draft.status} onChange={(e) => set({ status: e.target.value })}>
                  {["All", ...TXN_STATUSES].map((o) => (
                    <option key={o}>{o}</option>
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
                      placeholder="Name, email or customer ID"
                      value={draft.recipient}
                      onChange={(e) => set({ recipient: e.target.value })}
                    />
                  </Field>
                  <Field label="Transaction amount">
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
                  <Field label="Payment method">
                    <select className={INPUT} value={draft.method} onChange={(e) => set({ method: e.target.value })}>
                      {METHODS.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Channel">
                    <select className={INPUT} value={draft.channel} onChange={(e) => set({ channel: e.target.value })}>
                      {["All", ...ORIGINS].map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Provider">
                    <select className={INPUT} value={draft.provider} onChange={(e) => set({ provider: e.target.value })}>
                      {["All", ...PROVIDER_OPTIONS].map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Source account">
                    <select
                      className={INPUT}
                      value={draft.sourceAccount}
                      onChange={(e) => set({ sourceAccount: e.target.value })}
                    >
                      {[{ value: "All", label: "All" }, ...accounts.map((a) => ({ value: a.name, label: a.name }))].map(
                        (o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ),
                      )}
                    </select>
                  </Field>
                  <Field label="Destination account">
                    <select
                      className={INPUT}
                      value={draft.destinationAccount}
                      onChange={(e) => set({ destinationAccount: e.target.value })}
                    >
                      {[{ value: "All", label: "All" }, ...accounts.map((a) => ({ value: a.name, label: a.name }))].map(
                        (o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ),
                      )}
                    </select>
                  </Field>
                  <Field label="Transaction ID">
                    <input
                      className={INPUT}
                      placeholder="TXN-…"
                      value={draft.txnId}
                      onChange={(e) => set({ txnId: e.target.value })}
                    />
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
                  {view.total === 1 ? "transaction" : "transactions"}
                </p>
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
              </div>

              {/* Transactions table */}
              {view.total === 0 ? (
                <div className="border-t">
                  <EmptyState
                    title="No transactions match your filters"
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
                          <Th>Status</Th>
                          <Th>Reference</Th>
                          <Th>Customer</Th>
                          <Th>Type</Th>
                          <Th className="text-right">Amount</Th>
                          <Th className="hidden text-right lg:table-cell">Fee</Th>
                          <Th className="hidden lg:table-cell">Channel</Th>
                          <Th className="hidden md:table-cell">Date</Th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {view.rows.map((r) => (
                          <tr
                            key={r.id}
                            onClick={() => setSelected(r)}
                            className="cursor-pointer transition-colors hover:bg-muted/40"
                          >
                            <td className="px-4 py-3 first:pl-5">
                              <StatusCell txn={r} />
                            </td>
                            <td className="px-4 py-3">
                              <button
                                className="font-medium text-primary hover:underline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelected(r);
                                }}
                              >
                                {r.id}
                              </button>
                            </td>
                            <td className="max-w-44 truncate px-4 py-3">
                              {r.party}
                              {r.email && (
                                <span className="block max-w-44 truncate text-xs font-normal text-muted-foreground">
                                  {r.email}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">{TYPE_LABEL[r.type] ?? r.type}</td>
                            <td className="px-4 py-3 text-right tnum">{formatMoney(r.amount, r.currency)}</td>
                            <td className="hidden px-4 py-3 text-right tnum lg:table-cell">
                              {r.fee ? formatMoney(r.fee, r.currency) : "—"}
                            </td>
                            <td className="hidden px-4 py-3 lg:table-cell">{r.origin}</td>
                            <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground md:table-cell">
                              {fmtDateTime(r.date)}
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

        <TxnDetails txn={selected} onClose={() => setSelected(undefined)} />
      </TooltipProvider>

      {flow === "transfer" && <TransferFlow onClose={() => setFlow(null)} />}
      {flow === "payout" && <PayoutFlow onClose={() => setFlow(null)} />}
      {flow === "bulk" && <BulkPayoutFlow onClose={() => setFlow(null)} />}
    </DashboardPage>
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
