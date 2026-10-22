import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeft, Info } from "lucide-react";
import {
  FEATURE_ICONS, MERCHANT_GROUPS, chartSeries, featurePlacement, naira,
  type Feature, type MerchantGroup,
} from "@/lib/merchant-groups";

const GOOD = ["Successful", "Paid", "Fulfilled", "Completed", "Active"];
const WAIT = ["Pending", "Processing", "Due", "Scheduled"];
const statusCls = (s: string) =>
  GOOD.includes(s) ? "bg-success text-success-foreground" : WAIT.includes(s) ? "bg-highlight text-highlight-foreground" : "bg-destructive/10 text-destructive";

export function PreviewDashboard({ group }: { group: MerchantGroup }) {
  const [range, setRange] = useState("30 days");
  const seed = MERCHANT_GROUPS.indexOf(group) * 5;
  const data = useMemo(() => chartSeries(seed, group.chart.baseA, group.chart.baseB), [seed, group]);
  const sumA = data.reduce((t, p) => t + p.a, 0).toFixed(1);
  const sumB = data.reduce((t, p) => t + p.b, 0).toFixed(1);
  const gid = `pv-${group.slug}`;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps">Dashboard</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Good afternoon, Nova Retail.</h2>
        </div>
        <div className="flex rounded-lg border bg-card p-0.5 text-sm font-medium">
          {["Today", "7 days", "30 days"].map((r) => (
            <button key={r} onClick={() => setRange(r)} className={`rounded-md px-3 py-1.5 ${range === r ? "bg-blackwood text-blackwood-foreground" : "text-muted-foreground hover:text-foreground"}`}>{r}</button>
          ))}
        </div>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div className="flex flex-col justify-between rounded-xl bg-blackwood p-5 text-blackwood-foreground sm:col-span-2 xl:col-span-1">
          <p className="label-caps text-blackwood-foreground/60">{group.hero.label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight tnum">{group.hero.value}</p>
          <p className="mt-2 text-xs text-blackwood-foreground/60">{group.hero.sub}</p>
        </div>
        {group.metrics.map((m) => (
          <div key={m.k} className="panel p-5">
            <p className="label-caps">{m.k}</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight tnum">{m.v}</p>
            <p className="mt-3 text-xs">
              <span className={`rounded px-1.5 py-0.5 font-semibold ${m.tone === "up" ? "bg-success text-success-foreground" : m.tone === "down" ? "bg-destructive/10 text-destructive" : "bg-highlight text-highlight-foreground"}`}>{m.c}</span>
            </p>
          </div>
        ))}
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold">{group.chart.title}</h3>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-chart-1" />{group.chart.a} ₦{sumA}M</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-chart-2" />{group.chart.b} ₦{sumB}M</span>
            </div>
          </div>
          <div className="mt-5 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ left: -16, right: 4 }}>
                <defs>
                  <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.25} /><stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="d" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} interval={6} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickFormatter={(v) => `₦${v}M`} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }} formatter={(v: number) => `₦${v}M`} />
                <Area type="monotone" dataKey="a" name={group.chart.a} stroke="var(--chart-1)" strokeWidth={2} fill={`url(#${gid})`} />
                <Area type="monotone" dataKey="b" name={group.chart.b} stroke="var(--chart-2)" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel p-5">
          <h3 className="text-base font-semibold">{group.side.title}</h3>
          <ul className="mt-3 divide-y">
            {group.side.rows.map((r) => (
              <li key={r.t} className="flex items-center gap-3 py-3">
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{r.t}</span><span className="block truncate text-xs text-muted-foreground">{r.s}</span></span>
                <span className="text-sm font-semibold tnum">{r.v}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="panel mt-4 overflow-hidden">
        <h3 className="px-5 py-4 text-base font-semibold">{group.activityTitle}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y bg-muted/60 text-left">
                {["Activity", "Who", "Amount", "Status", "Date"].map((h) => <th key={h} className="label-caps whitespace-nowrap px-5 py-2.5 font-semibold">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y">
              {group.activity.map((r) => (
                <tr key={r.t + r.d}>
                  <td className="whitespace-nowrap px-5 py-3 font-medium">{r.t}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">{r.c}</td>
                  <td className="whitespace-nowrap px-5 py-3 font-semibold tnum">{naira(r.a)}</td>
                  <td className="px-5 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusCls(r.s)}`}>{r.s}</span></td>
                  <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">{r.d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/** Shown when a non-dashboard item is picked in the preview menu. */
export function PreviewSectionNote({ group, feature, onBack }: { group: MerchantGroup; feature: Feature; onBack: () => void }) {
  const Icon = FEATURE_ICONS[feature];
  const place = featurePlacement(group, feature);
  return (
    <div className="panel flex flex-col items-start p-8">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-primary"><Icon className="h-6 w-6" /></span>
      <p className="label-caps mt-6">{place === "Add-on" ? "Optional add-on" : place}</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">{feature}</h2>
      <p className="mt-3 max-w-lg text-muted-foreground">
        {place === "Add-on"
          ? `${feature} isn't part of the core ${group.name} menu, but it can be switched on for businesses that need it.`
          : `In this layout, ${feature} sits under “${place}” so ${group.name} businesses can find it quickly.`}
      </p>
      <p className="mt-4 flex max-w-lg items-start gap-2 rounded-lg bg-muted px-3 py-2.5 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />This is a menu preview. Only the dashboard is shown here — the {feature} page itself isn't part of this demo yet.
      </p>
      <button onClick={onBack} className="btn btn-outline mt-6 h-10 text-sm"><ArrowLeft className="h-4 w-4" />Back to dashboard</button>
    </div>
  );
}
