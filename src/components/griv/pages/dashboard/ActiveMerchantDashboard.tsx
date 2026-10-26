import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ChevronRight, Clock3, PackageOpen, ReceiptText, RefreshCw, TrendingUp, Users, Wallet } from "lucide-react";
import { useLedger } from "@/lib/demo/ledger";
import { useAccounts } from "@/lib/demo/accounts";
import { payoutsStore } from "@/lib/demo/payouts";
import { useCatalog, stockStatus } from "@/lib/demo/catalog";
import { INVOICES, invoiceStatus, invoiceTotals } from "@/lib/demo/invoices";
import { formatCount, formatMoney, totalsByCurrency } from "@/lib/money";
import { DATE_RANGES, fmtDateTime, type DateRange } from "@/lib/dates";
import { MetricCard, MetricGrid, StatusBadge } from "@/components/griv/kit";
import { FilterSelect } from "@/components/griv/kit/filters";
import { moneySeries, growthPct, rowsInRange, rowsInPreviousWindow, sumMoney } from "@/lib/demo/dashboard";
import { LedgerDetails } from "@/components/griv/pages/transactions/LedgerDetails";
import { cn } from "@/lib/utils";

/**
 * Active merchant state: business performance first — KPIs with period comparison,
 * money-flow chart, insights, action-required items and the unified ledger.
 */
export function ActiveMerchantDashboard() {
  const ledger = useLedger();
  const accounts = useAccounts();
  const payouts = payoutsStore.use();
  const products = useCatalog();
  const [range, setRange] = useState<DateRange>("Last 7 days");
  const [type, setType] = useState("All");
  const [selected, setSelected] = useState<string | undefined>(undefined);

  const inRange = useMemo(() => rowsInRange(ledger, range), [ledger, range]);
  const series = useMemo(() => moneySeries(ledger, range), [ledger, range]);

  /* KPIs — NGN money only; counts may span currencies. */
  const collected = sumMoney(inRange, ["Payment"]);
  const collectedPrev = sumMoney(rowsInPreviousWindow(ledger, range), ["Payment"]);
  const payments = inRange.filter((r) => r.type === "Payment");
  const okPayments = payments.filter((r) => r.status === "Successful").length;
  const paymentsPrev = rowsInPreviousWindow(ledger, range).filter((r) => r.type === "Payment");
  const okPrev = paymentsPrev.filter((r) => r.status === "Successful").length;
  const payoutsSent = sumMoney(inRange, ["Payout"]);
  const payoutsPrev = sumMoney(rowsInPreviousWindow(ledger, range), ["Payout"]);
  const main = accounts.find((a) => a.id === "acc_ngn_main")!;

  /* Action-required items, straight from the shared demo stores. */
  const failed = ledger.filter((r) => r.type === "Payment" && r.status === "Failed");
  const overdue = INVOICES.filter((r) => invoiceStatus(r) === "Overdue");
  const pendingPayouts = payouts.filter((p) => p.status === "Pending" || p.status === "Failed");
  const lowStock = products.flatMap((p) => p.variants.map((v) => stockStatus(p, v))).filter((s) => s === "Low stock" || s === "Out of stock");
  const attention = [
    failed.length > 0 && {
      icon: RefreshCw,
      title: "Payments to retry",
      sub: `${failed.length} failed payment${failed.length === 1 ? "" : "s"} — original money was never taken`,
      href: "/transactions",
      tone: "danger" as const,
    },
    overdue.length > 0 && {
      icon: ReceiptText,
      title: "Overdue invoices",
      sub: `${overdue.length} invoice${overdue.length === 1 ? "" : "s"} past their due date`,
      href: "/invoices",
      tone: "warning" as const,
    },
    pendingPayouts.length > 0 && {
      icon: Clock3,
      title: "Payouts awaiting confirmation",
      sub: `${pendingPayouts.length} payout${pendingPayouts.length === 1 ? "" : "s"} pending with the provider`,
      href: "/payouts",
      tone: "pending" as const,
    },
    lowStock.length > 0 && {
      icon: PackageOpen,
      title: "Restock needed",
      sub: `${lowStock.length} variant${lowStock.length === 1 ? "" : "s"} low or out of stock`,
      href: "/inventory",
      tone: "warning" as const,
    },
  ].filter(Boolean) as { icon: typeof Clock3; title: string; sub: string; href: string; tone: "danger" | "warning" | "pending" }[];

  /* Insights */
  const successRate = payments.length ? Math.round((okPayments / payments.length) * 100) : undefined;
  const channelCount = new Map<string, number>();
  for (const r of payments) if (r.status === "Successful") channelCount.set(r.channel, (channelCount.get(r.channel) ?? 0) + 1);
  const topChannel = [...channelCount.entries()].sort((a, b) => b[1] - a[1])[0];
  const outstanding = totalsByCurrency(INVOICES.filter((r) => ["Sent", "Overdue", "Partially paid"].includes(invoiceStatus(r))), (r) => invoiceTotals(r).total, (r) => r.currency);
  const customers = new Set(payments.map((r) => r.email)).size;

  /* Transactions table */
  const types = ["All", ...new Set(ledger.map((r) => r.type))];
  const rows = [...ledger]
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter((r) => type === "All" || r.type === type)
    .slice(0, 8);
  const entry = ledger.find((r) => r.id === selected);

  return (
    <div className="space-y-4">
      <MetricGrid cols={4}>
        <MetricCard
          dark
          label="Payments collected"
          value={formatMoney(collected, "NGN")}
          sub={<Delta pct={growthPct(collected, collectedPrev)} />}
          icon={TrendingUp}
        />
        <MetricCard label="Successful payments" value={formatCount(okPayments)} sub={<Delta pct={growthPct(okPayments, okPrev)} />} icon={Users} />
        <MetricCard label="Payouts sent" value={formatMoney(payoutsSent, "NGN")} sub={<Delta pct={growthPct(payoutsSent, payoutsPrev)} />} icon={RefreshCw} />
        <MetricCard label="Available balance" value={formatMoney(main.available, "NGN")} sub="NGN main wallet" icon={Wallet} />
      </MetricGrid>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Money flow</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-chart-1" />
                Incoming {formatMoney(sumMoney(inRange, ["Payment", "Settlement"]), "NGN")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-chart-2" />
                Outgoing {formatMoney(sumMoney(inRange, ["Payout", "Transfer", "Refund", "Fee"]), "NGN")}
              </span>
            </div>
          </div>
          <div className="mt-4">
            <FilterSelect label="Period" value={range} onChange={(v) => setRange(v as DateRange)} options={DATE_RANGES.filter((r) => r !== "All time")} />
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ left: -16, right: 4 }}>
                <defs>
                  <linearGradient id="dash-inc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="key" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} interval="preserveStartEnd" />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickFormatter={(v) => `₦${v >= 1_000_000 ? `${(v / 1_000_000).toLocaleString("en-NG")}M` : v >= 1_000 ? `${(v / 1_000).toLocaleString("en-NG")}k` : v}`} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }}
                  formatter={(v: number) => formatMoney(v, "NGN")}
                />
                <Area type="monotone" dataKey="Incoming" stroke="var(--chart-1)" strokeWidth={2} fill="url(#dash-inc)" />
                <Area type="monotone" dataKey="Outgoing" stroke="var(--chart-2)" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">NGN wallets only — other currencies are listed per transaction below.</p>
        </div>

        <div className="panel p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Needs your attention</h2>
            {attention.length > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">{attention.length}</span>
            )}
          </div>
          {attention.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">Nothing needs you right now.</p>
          ) : (
            <ul className="mt-4 divide-y">
              {attention.map(({ icon: Icon, title, sub, href, tone }) => (
                <li key={title}>
                  <Link to={href} className="flex w-full items-center gap-3 py-3">
                    <span
                      className={cn(
                        "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                        tone === "danger" ? "bg-destructive/10 text-destructive" : tone === "warning" ? "bg-highlight text-highlight-foreground" : "bg-accent text-primary",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{sub}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <h3 className="label-caps mt-6">Insights</h3>
          <ul className="mt-2 space-y-3 text-sm">
            <li className="flex items-start gap-2.5">
              <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                {successRate == null ? "No payments in this period yet." : (
                  <>
                    <strong className="font-semibold">{successRate}%</strong> of payments succeeded — {formatCount(okPayments)} of {formatCount(payments.length)}.
                  </>
                )}
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                {topChannel ? (
                  <>
                    <strong className="font-semibold">{topChannel[0]}</strong> is your top channel — {formatCount(topChannel[1])} payment{topChannel[1] === 1 ? "" : "s"}.
                  </>
                ) : (
                  "No channel activity in this period yet."
                )}
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                {outstanding.NGN
                  ? <>
                      <strong className="font-semibold">{formatMoney(outstanding.NGN, "NGN")}</strong> outstanding on unpaid invoices
                      {outstanding.USD ? ` (plus one ${formatMoney(outstanding.USD, "USD")} invoice)` : ""}.
                    </>
                  : "No unpaid invoices right now."}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <section className="panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">Recent transactions</h2>
            <p className="text-xs text-muted-foreground">One unified ledger — payments, transfers, payouts, refunds and fees.</p>
          </div>
          <FilterSelect label="Type" value={type} onChange={setType} options={types} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y bg-muted/60 text-left">
                {["Transaction", "Customer", "Channel", "Amount", "Status", "Date"].map((h) => (
                  <th key={h} className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={r.id} onClick={() => setSelected(r.id)} className="cursor-pointer hover:bg-muted/40">
                  <td className="px-5 py-3.5">
                    <span className="font-medium">{r.type}</span>
                    <span className="block text-xs text-muted-foreground">{r.id}</span>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{r.customer}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{r.channel}</td>
                  <td className="px-5 py-3.5 font-semibold tnum">{formatMoney(r.amount, r.currency)}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{fmtDateTime(r.date)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No transactions match this filter yet. Try “All”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t px-5 py-3.5">
          <Link to="/transactions" className="text-sm font-semibold text-primary hover:underline">
            View all transactions
          </Link>
        </div>
      </section>

      <LedgerDetails entry={entry} rows={ledger} onClose={() => setSelected(undefined)} />
    </div>
  );
}


function Delta({ pct }: { pct?: number | undefined }) {
  if (pct == null) return <span className="text-muted-foreground">No previous data yet</span>;
  const up = pct >= 0;
  return (
    <span className="flex items-center gap-2">
      <span className={cn("rounded px-1.5 py-0.5 font-semibold", up ? "bg-success text-success-foreground" : "bg-destructive/10 text-destructive")}>
        {up ? "+" : "−"}
        {Math.abs(pct)}%
      </span>
      vs previous period
    </span>
  );
}

