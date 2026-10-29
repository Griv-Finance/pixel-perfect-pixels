// MAIN BALANCES PAGE — built in the MailerSend-inspired style shared with the
// Transactions page (Show for selector, one filter container with More/Less
// filters, count + Export toolbar, soft badges, its own pagination footer).
// Uses the same balances data as the original design, which now lives at
// /balances-old (sidebar → Trashed) so the two designs can still be compared.
import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ChevronDown, Download, Globe, Plus, Search, Trash2 } from "lucide-react";
import {
  DashboardPage,
  DetailList,
  EmptyState,
  Field,
  FormDialog,
  StatusBadge,
  TableSkeleton,
  useDemoLoading,
} from "@/components/griv/kit";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRangePicker } from "../transactions/DateRangePicker";
import { PayoutFlow } from "../payouts/PayoutFlow";
import { accountsStore, useAccounts } from "@/lib/demo/accounts";
import { balanceHistory, liensFor, type BalanceMove, type Lien } from "@/lib/demo/balance-history";
import { PAGE_SIZES, paginate } from "@/lib/demo/unified";
import { formatMoney, type Currency } from "@/lib/money";
import { fmtDateTime } from "@/lib/dates";
import { exportCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const INPUT = "field h-9 w-full text-sm";

type MoveType = "Deposits" | "Fees" | "Settlements" | "Refunds" | "Reversals" | "Payouts";
const MOVE_TYPES: MoveType[] = ["Deposits", "Fees", "Settlements", "Refunds", "Reversals", "Payouts"];

function moveType(m: BalanceMove): MoveType {
  if (m.details.startsWith("Refund of")) return "Refunds";
  if (m.details.startsWith("Payout to")) return "Payouts";
  switch (m.details) {
    case "Customer payment":
      return "Deposits";
    case "Griv processing fees":
      return "Fees";
    case "Settlement batch posted":
      return "Settlements";
    case "Reversal processed":
      return "Reversals";
    default:
      return "Deposits";
  }
}

type Filters = {
  ref: string;
  keyword: string;
  from: string;
  to: string;
  type: string;
  amountMin: string;
  amountMax: string;
};

const EMPTY_FILTERS: Filters = {
  ref: "",
  keyword: "",
  from: "",
  to: "",
  type: "All",
  amountMin: "",
  amountMax: "",
};

function applyFilters<T extends { date: string; amount: number }>(
  rows: T[],
  f: Filters,
  refOf: (r: T) => string,
  textOf: (r: T) => string,
  typeOf: (r: T) => string,
): T[] {
  const ref = f.ref.trim().toLowerCase();
  const kw = f.keyword.trim().toLowerCase();
  const min = Number(f.amountMin);
  const max = Number(f.amountMax);
  return rows.filter((r) => {
    if (ref && !refOf(r).toLowerCase().includes(ref)) return false;
    if (kw && !textOf(r).toLowerCase().includes(kw)) return false;
    const day = new Date(r.date).toISOString().slice(0, 10);
    if (f.from && day < f.from) return false;
    if (f.to && day > f.to) return false;
    if (f.type !== "All" && typeOf(r) !== f.type) return false;
    if (f.amountMin && !(Number(r.amount) >= min)) return false;
    if (f.amountMax && !(Number(r.amount) <= max)) return false;
    return true;
  });
}

export function BalancesPreviewPage() {
  const accounts = useAccounts();
  const loading = useDemoLoading();
  const currencies = [...new Set(accounts.map((a) => a.currency))];
  const [currency, setCurrency] = useState<Currency>(currencies[0] ?? "NGN");
  const [tab, setTab] = useState<"history" | "liens">("history");
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [advanced, setAdvanced] = useState(false);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[1]);
  const [page, setPage] = useState(1);
  const [exportOpen, setExportOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Bank transfer");

  const wallets = accounts.filter((a) => a.currency === currency);
  const available = wallets.reduce((s, a) => s + a.available, 0);
  const pending = wallets.reduce((s, a) => s + a.pending, 0);
  const history = useMemo(() => balanceHistory(currency), [currency]);
  const liens = useMemo(() => liensFor(currency), [currency]);

  const typeOf = (r: BalanceMove | Lien): string =>
    tab === "history" ? moveType(r as BalanceMove) : (r as Lien).status;
  const refOf = (r: BalanceMove | Lien) =>
    tab === "history" ? (r as BalanceMove).reference : (r as Lien).id;
  const textOf = (r: BalanceMove | Lien) =>
    tab === "history" ? (r as BalanceMove).details : (r as Lien).reason;
  const rows = useMemo(
    () => applyFilters(tab === "history" ? history : liens, applied, refOf, textOf, typeOf),
    [tab, history, liens, applied],
  );
  useEffect(() => setPage(1), [applied, tab, pageSize]);
  const view = useMemo(() => paginate(rows, page, pageSize), [rows, page, pageSize]);

  const set = (patch: Partial<Filters>) => setDraft((d) => ({ ...d, ...patch }));
  const search = () => setApplied({ ...draft });
  const clearAll = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
  };
  const doExport = (excel: boolean) => {
    setExportOpen(false);
    exportCsv(
      tab === "history" ? "balance-history" : "lien-history",
      tab === "history"
        ? rows.map((r) => {
            const m = r as BalanceMove;
            return {
              date: m.date,
              details: m.details,
              reference: m.reference,
              type: moveType(m),
              amount: m.amount,
              balanceAfter: m.balanceAfter,
              currency: m.currency,
            };
          })
        : rows.map((r) => {
            const l = r as Lien;
            return {
              date: l.date,
              reference: l.id,
              reason: l.reason,
              amount: l.amount,
              status: l.status,
              currency: l.currency,
            };
          }),
      { excel },
    );
  };

  const addFunds = () => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return;
    const target = wallets.find((a) => a.kind === "Main") ?? wallets[0];
    if (!target) return;
    accountsStore.set((list) =>
      list.map((a) => (a.id === target.id ? { ...a, pending: a.pending + n } : a)),
    );
    setAddOpen(false);
    setAmount("");
    toast("Funding request pending — awaiting confirmation. Demo: no money moved.");
  };

  return (
    <DashboardPage
      title="Balances"
      crumbs={[{ label: "Money" }]}
      description="Manage your balances across supported currencies. View available funds, pending settlements, and account activity."
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/balances-old"
            className="hidden text-sm font-medium text-muted-foreground hover:text-foreground sm:block"
          >
            Old style
          </Link>
          <button className="btn btn-primary h-9 text-sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Funds
          </button>
          <button className="btn btn-outline h-9 text-sm" onClick={() => setWithdrawOpen(true)}>
            <ArrowUpRight className="h-4 w-4" />
            Withdraw
          </button>
        </div>
      }
    >
      {/* Show for: NGN ▼ */}
      <div className="mb-6 flex items-center gap-1.5">
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              aria-haspopup="listbox"
            >
              <Globe className="h-4 w-4" />
              Show for:
              <span className="font-medium text-foreground">{currency}</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-32 p-1" role="listbox">
            {currencies.map((c) => (
              <button
                key={c}
                role="option"
                aria-selected={currency === c}
                onClick={() => setCurrency(c)}
                className={cn(
                  "block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted",
                  currency === c && "bg-muted font-medium",
                )}
              >
                {c}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      </div>

      {/* Pending / available balances */}
      <section className="mb-6 flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-wrap gap-x-14 gap-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Pending Balance ({currency})</p>
            <p className="mt-1.5 text-3xl font-semibold tracking-tight tnum">
              {formatMoney(pending, currency)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Funds received but not yet available</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Available Balance ({currency})</p>
            <p className="mt-1.5 text-3xl font-semibold tracking-tight tnum">
              {formatMoney(available, currency)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">For withdrawals and payouts</p>
          </div>
        </div>
      </section>

      <section className="panel overflow-hidden">
        {/* Tabs */}
        <div className="flex gap-1 border-b px-4 pt-3 sm:px-5" role="tablist">
          {(
            [
              ["history", "Balance History", history.length],
              ["liens", "Lien History", liens.length],
            ] as const
          ).map(([key, label, count]) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cn(
                "-mb-px rounded-t-md border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors",
                tab === key
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
              <span className="tnum ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs font-semibold text-muted-foreground">
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Filter container */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            search();
          }}
          className="px-5 py-5 sm:px-6"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Reference">
              <input
                className={INPUT}
                placeholder="E.g. GRV-802400…"
                value={draft.ref}
                onChange={(e) => set({ ref: e.target.value })}
              />
            </Field>
            <Field label="Date or period">
              <DateRangePicker from={draft.from} to={draft.to} onChange={(from, to) => set({ from, to })} />
            </Field>
            <Field label={tab === "history" ? "Movement type" : "Status"}>
              <select className={INPUT} value={draft.type} onChange={(e) => set({ type: e.target.value })}>
                {(tab === "history" ? ["All", ...MOVE_TYPES] : ["All", "Held", "Released"]).map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="Keyword" hint="Matches details or reason text.">
              <input
                className={INPUT}
                placeholder="E.g. settlement"
                value={draft.keyword}
                onChange={(e) => set({ keyword: e.target.value })}
              />
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
                <Field label="Amount">
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
          <TableSkeleton rows={8} cols={5} />
        ) : (
          <>
            {/* Toolbar: count + Export */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3">
              <p className="text-sm">
                <span className="tnum font-semibold">{view.total}</span>{" "}
                {tab === "history" ? "movements" : "liens"}
              </p>
              <Popover open={exportOpen} onOpenChange={setExportOpen}>
                <PopoverTrigger asChild>
                  <button className="btn btn-outline h-9 text-sm" disabled={!rows.length} aria-haspopup="menu">
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

            {view.total === 0 ? (
              <div className="border-t">
                <EmptyState
                  title={tab === "history" ? "No movements match your filters" : "No liens match your filters"}
                  description="Try different filters, another period, or clear everything and search again."
                  action={
                    <button className="btn btn-outline" onClick={clearAll}>
                      Clear filters
                    </button>
                  }
                />
              </div>
            ) : tab === "history" ? (
              <>
                <div className="overflow-x-auto border-t">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left">
                        <Th>Details</Th>
                        <Th className="hidden md:table-cell">Reference</Th>
                        <Th className="hidden lg:table-cell">Type</Th>
                        <Th className="text-right">Amount</Th>
                        <Th className="hidden text-right lg:table-cell">Balance After</Th>
                        <Th className="hidden md:table-cell">Date</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(view.rows as BalanceMove[]).map((r) => (
                        <tr key={r.id} className="transition-colors hover:bg-muted/40">
                          <td className="px-4 py-3 first:pl-5">{r.details}</td>
                          <td className="hidden px-4 py-3 md:table-cell">
                            <Link
                              to="/transactions"
                              search={{ q: r.reference }}
                              className="font-medium text-primary hover:underline"
                            >
                              {r.reference}
                            </Link>
                          </td>
                          <td className="hidden px-4 py-3 lg:table-cell">{moveType(r)}</td>
                          <td className="px-4 py-3 text-right tnum">
                            <span
                              className={cn(
                                "font-medium",
                                r.amount >= 0 ? "text-success-foreground" : "text-destructive",
                              )}
                            >
                              {formatMoney(r.amount, r.currency, { signed: true })}
                            </span>
                          </td>
                          <td className="hidden px-4 py-3 text-right tnum lg:table-cell">
                            {formatMoney(r.balanceAfter, r.currency)}
                          </td>
                          <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground md:table-cell">
                            {fmtDateTime(r.date)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <>
                <div className="overflow-x-auto border-t">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left">
                        <Th>Reference</Th>
                        <Th>Reason</Th>
                        <Th className="hidden lg:table-cell">Status</Th>
                        <Th className="text-right">Amount</Th>
                        <Th className="hidden md:table-cell">Date</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(view.rows as Lien[]).map((r) => (
                        <tr key={r.id} className="transition-colors hover:bg-muted/40">
                          <td className="px-4 py-3 font-medium first:pl-5">{r.id}</td>
                          <td className="px-4 py-3">{r.reason}</td>
                          <td className="hidden px-4 py-3 lg:table-cell">
                            <StatusBadge status={r.status} />
                          </td>
                          <td className="px-4 py-3 text-right tnum">{formatMoney(r.amount, r.currency)}</td>
                          <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground md:table-cell">
                            {fmtDateTime(r.date)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

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
      </section>

      {/* Add Funds dialog — same flow as the original Balances page */}
      <FormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add Funds"
        description={`Fund your ${currency} balance. The amount stays pending until the provider confirms it.`}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setAddOpen(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={!(Number(amount) > 0)} onClick={addFunds}>
              Request funding
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Amount" hint="Demo only — nothing is charged and no money moves.">
            <input
              type="number"
              min="0"
              className="field"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
          <Field label="Funding method">
            <select className="field" value={method} onChange={(e) => setMethod(e.target.value)}>
              {["Bank transfer", "Card", "USSD"].map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <DetailList
            items={[
              ["Currency", currency],
              ["Lands in", (wallets.find((a) => a.kind === "Main") ?? wallets[0])?.name ?? "—"],
              ["Status after request", "Pending until confirmed"],
            ]}
          />
        </div>
      </FormDialog>
      {withdrawOpen && <PayoutFlow onClose={() => setWithdrawOpen(false)} />}
    </DashboardPage>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string | undefined }) {
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
