import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { DashboardSection, InlineSelect, Metric } from "./Section";
import { BigLine } from "./Charts";
import {
  PAYMENT_METRIC_OPTIONS,
  paymentSeries,
  paymentStats,
  type PaymentMetric,
} from "@/lib/demo/dashboard";
import { formatMoney, formatMoneyCompact, type Currency } from "@/lib/money";
import type { DateRange } from "@/lib/dates";
import type { LedgerEntry } from "@/lib/demo/ledger";
import { cn } from "@/lib/utils";

/** The most important section: one primary metric, four supporting metrics, one minimal graph. */
export function PaymentsSection({ ledger, currency, range }: {
  ledger: LedgerEntry[];
  currency: Currency;
  range: DateRange;
}) {
  const [metric, setMetric] = useState<PaymentMetric>("payments");
  const stats = paymentStats(ledger, { metric, currency, range });
  const series = paymentSeries(ledger, { metric, currency, range });
  const cells = [
    { label: "Successful", value: stats.successful.toLocaleString("en-NG"), cls: "border-b" },
    { label: "Failed", value: stats.failed.toLocaleString("en-NG"), cls: "border-b sm:border-l" },
    { label: "Pending", value: stats.pending.toLocaleString("en-NG"), cls: "sm:border-l" },
    {
      label: "Average processing time",
      value: stats.avgSeconds == null ? "—" : `${stats.avgSeconds.toFixed(1)}s`,
      cls: "",
    },
  ];

  return (
    <DashboardSection icon={ArrowLeftRight} title="Payments" className="border-b">
      <div className="grid lg:grid-cols-3">
        <div className="p-6 lg:border-r">
          <InlineSelect value={metric} onChange={setMetric} options={PAYMENT_METRIC_OPTIONS} className="text-base" />
          <p className="tnum mt-2 text-4xl font-semibold tracking-tight">
            {formatMoneyCompact(stats.total, currency)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {range} · {currency} · gross payment activity
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:col-span-2">
          {cells.map((c) => (
            <div key={c.label} className={cn("p-6", c.cls)}>
              <Metric label={c.label} value={c.value} sub={range} />
            </div>
          ))}
        </div>
      </div>
      <div className="border-t px-6 py-5">
        <BigLine data={series} currency={currency} />
      </div>
    </DashboardSection>
  );
}
