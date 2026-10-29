import { Link } from "@tanstack/react-router";
import { BarChart3, Eye } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { EmptyState, MetricCard, MetricGrid, StatusBadge } from "@/components/griv/kit";
import { setLiveMode, useLiveMode } from "@/lib/live-mode";
import { fmtDate } from "@/lib/dates";
import { formatMoney, type Currency } from "@/lib/money";
import type { PaymentLink } from "@/lib/demo/payment-links";
import { txnPrefix } from "@/lib/demo/link-details";

const TH = "py-2 pr-4 font-medium last:pr-0";

/** Second tab: Performance (live data only) and Recent payments. */
export function AnalyticsTab({ link }: { link: PaymentLink }) {
  const live = useLiveMode();
  const collected = link.payments.reduce((s, p) => s + p.amount, 0);
  const c = link.currency as Currency;

  return (
    <div>
      <section className="border-b py-6 first:pt-0">
        <h2 className="mb-4 text-sm font-semibold">Performance</h2>
        {!live ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-primary">
              <BarChart3 className="h-5 w-5" />
            </span>
            <p className="mt-4 font-semibold">Analytics are only available for live data</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Switch to live mode to view analytics for your live payment links.
            </p>
            <button className="btn btn-primary mt-5 h-8 px-3 text-sm" onClick={() => setLiveMode(true)}>
              Switch to live mode →
            </button>
          </div>
        ) : (
          <>
            <MetricGrid cols={3}>
              <MetricCard label="Total payment volume" value={formatMoney(collected, c)} />
              <MetricCard label="Successful payments" value={link.payments.length} />
              <MetricCard label="Failed payments" value={0} />
            </MetricGrid>
            {link.payments.length > 0 ? (
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={link.payments.map((p) => ({ date: fmtDate(p.date), amount: p.amount }))}>
                    <XAxis dataKey="date" fontSize={10} />
                    <YAxis fontSize={10} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
                    <Tooltip formatter={(v) => formatMoney(Number(v), c)} />
                    <Bar dataKey="amount" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No payments to chart yet.</p>
            )}
          </>
        )}
      </section>

      <section className="py-6 last:pb-0">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Recent payments</h2>
          <Link
            to="/transactions"
            search={{ q: txnPrefix(link) }}
            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-input bg-card px-2.5 text-xs font-medium hover:bg-muted"
          >
            <Eye className="h-3.5 w-3.5" />
            View all
          </Link>
        </div>
        {link.payments.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className={TH}>Status</th>
                  <th className={TH}>Customer</th>
                  <th className={TH}>Amount</th>
                  <th className={TH}>Payment Method</th>
                  <th className={TH}>Date</th>
                </tr>
              </thead>
              <tbody>
                {link.payments.map((p) => (
                  <tr key={p.reference} className="border-b last:border-b-0">
                    <td className="py-2.5 pr-4"><StatusBadge status="Successful" /></td>
                    <td className="py-2.5 pr-4">
                      <Link to="/transactions" search={{ q: p.reference }} className="hover:underline">
                        {p.customer}
                      </Link>
                    </td>
                    <td className="tnum py-2.5 pr-4">{formatMoney(p.amount, c)}</td>
                    <td className="py-2.5 pr-4">{p.method ?? "Card"}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground last:pr-0">{fmtDate(p.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No payments" />
        )}
      </section>
    </div>
  );
}
