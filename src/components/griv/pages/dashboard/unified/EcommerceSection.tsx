import { ShoppingCart } from "lucide-react";
import { DashboardSection, Metric } from "./Section";
import { BigLine } from "./Charts";
import { ecommerceStats } from "@/lib/demo/dashboard";
import { formatMoneyCompact } from "@/lib/money";
import type { DateRange } from "@/lib/dates";
import type { Order } from "@/lib/demo/orders";
import { cn } from "@/lib/utils";

function Band({ label, value, period, cells, series, chartCurrency }: {
  label: string;
  value: string;
  period: string;
  cells: { label: string; value: string; sub: string }[];
  series: { key: string; value: number }[];
  chartCurrency: Parameters<typeof formatMoneyCompact>[1];
}) {
  return (
    <div className="grid lg:grid-cols-3">
      <div className="p-6 lg:border-r">
        <Metric label={label} value={value} big sub={period} />
      </div>
      <div className="lg:col-span-2">
        <div className={cn("grid sm:grid-cols-2 sm:divide-x border-b")}>
          {cells.map((c) => (
            <div key={c.label} className="p-6">
              <Metric label={c.label} value={c.value} sub={c.sub} />
            </div>
          ))}
        </div>
        <div className="px-6 py-5">
          <BigLine data={series} currency={chartCurrency} />
        </div>
      </div>
    </div>
  );
}

/** MailerLite's E-commerce layout: two bands (revenue, orders), one-third/two-thirds, no category selector. */
export function EcommerceSection({ orders, range, className }: {
  orders: Order[];
  range: DateRange;
  className?: string | undefined;
}) {
  const s = ecommerceStats(orders, range);
  return (
    <DashboardSection icon={ShoppingCart} title="E-commerce" className={className}>
      <Band
        label="Total revenue"
        value={formatMoneyCompact(s.revenue, "NGN")}
        period={range}
        chartCurrency="NGN"
        series={s.revenueSeries}
        cells={[
          { label: "Paid revenue", value: formatMoneyCompact(s.paidRevenue, "NGN"), sub: range },
          { label: "Pending revenue", value: formatMoneyCompact(s.pendingRevenue, "NGN"), sub: range },
        ]}
      />
      <div className="border-t">
        <Band
          label="Total orders"
          value={s.totalOrders.toLocaleString("en-NG")}
          period={range}
          chartCurrency="NGN"
          series={s.orderSeries}
          cells={[
            { label: "Completed orders", value: s.completedOrders.toLocaleString("en-NG"), sub: range },
            { label: "Pending orders", value: s.pendingOrders.toLocaleString("en-NG"), sub: range },
          ]}
        />
      </div>
    </DashboardSection>
  );
}
