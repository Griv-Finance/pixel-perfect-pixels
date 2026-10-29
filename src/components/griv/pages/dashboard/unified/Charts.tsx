import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Pt } from "@/lib/demo/dashboard";
import { formatMoney, type Currency } from "@/lib/money";

/**
 * Extremely minimal charts, MailerLite-style: one thin single-colour line, no area fill,
 * no gridlines, no legend. The full-width chart keeps understated date labels along the x-axis.
 */
export function BigLine({ data, currency }: { data: Pt[]; currency?: Currency | undefined }) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <XAxis
            dataKey="key"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            interval="preserveStartEnd"
            minTickGap={48}
          />
          <YAxis hide domain={["auto", "auto"]} />
          {currency ? (
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12, padding: "4px 10px" }}
              formatter={(v: number) => [formatMoney(v, currency), undefined as never]}
              labelStyle={{ color: "var(--muted-foreground)" }}
            />
          ) : null}
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--primary)"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Tiny trend for a metric column, with the period's first and last date underneath. */
export function MiniLine({ data }: { data: Pt[] }) {
  return (
    <div>
      <div className="h-12">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <YAxis hide domain={[0, (max: number) => max * 1.15]} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--primary)"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
        <span>{data[0]?.key}</span>
        <span>{data[data.length - 1]?.key}</span>
      </div>
    </div>
  );
}
