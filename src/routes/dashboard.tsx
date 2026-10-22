import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ArrowDownLeft, ArrowUpRight, Check, ChevronRight, Circle, Link2, Package, Plus, UserPlus, X,
  AlertTriangle, FileWarning, Scale, Clock, Wallet,
} from "lucide-react";
import { AppShell } from "@/components/griv/AppShell";
import { useGriv } from "@/lib/griv-store";
import { setLiveMode, useLiveMode } from "@/lib/live-mode";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Griv Finance" },
      { name: "description", content: "See how your business is doing, what's happening with your money and what needs your attention." },
      { property: "og:title", content: "Dashboard — Griv Finance" },
      { property: "og:description", content: "Your business at a glance on Griv." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const g = useGriv();
  const [view, setView] = useState<"new" | "active">("new");
  const live = useLiveMode();
  useEffect(() => { if (g.businessName === "Nova Retail") setView("active"); }, [g.businessName]);
  const business = view === "active" ? "Nova Retail Ltd." : g.businessName || "Your business";
  const initials = ((g.firstName[0] ?? "A") + (g.lastName[0] ?? "O")).toUpperCase();

  return (
    <AppShell business={business} initials={initials} live={live} onLiveChange={setLiveMode}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex justify-end">
          <div className="flex items-center gap-2 rounded-lg border bg-card p-0.5 text-xs font-semibold">
            <span className="px-2 text-muted-foreground">Demo view</span>
            {(["new", "active"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={`rounded-md px-3 py-1.5 ${view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {v === "new" ? "New business" : "Active business"}
              </button>
            ))}
          </div>
        </div>
        {view === "new" ? <NewDashboard name={g.firstName} business={g.businessName} /> : <ActiveDashboard />}
      </div>
    </AppShell>
  );
}

/* ---------- New business ---------- */
function NewDashboard({ name, business }: { name: string; business: string }) {
  const [hidden, setHidden] = useState(false);
  const steps = [
    { l: "Business profile", d: true },
    { l: "Verification", d: true },
    { l: "Business account", d: true },
    { l: "Get paid", d: false },
    { l: "Add your products", d: false },
    { l: "Invite your team", d: false },
  ];
  const done = steps.filter((s) => s.d).length;
  return (
    <>
      <h1 className="text-4xl font-semibold tracking-tight">Welcome to Griv{name ? `, ${name}` : ""}.</h1>
      <p className="mt-2 text-lg text-muted-foreground">Let's get {business || "your business"} ready.</p>

      {!hidden && (
        <section className="panel relative mt-8 grid overflow-hidden md:grid-cols-[1fr_1.3fr]">
          <button onClick={() => setHidden(true)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground" aria-label="Dismiss"><X className="h-4 w-4" /></button>
          <div className="bg-blackwood p-8 text-blackwood-foreground">
            <p className="label-caps text-primary">Set up your Griv account</p>
            <p className="mt-4 text-5xl font-semibold tnum">{done}<span className="text-blackwood-foreground/40"> / {steps.length}</span></p>
            <p className="mt-1 text-sm text-blackwood-foreground/70">steps complete</p>
            <div className="mt-6 h-1.5 rounded-full bg-blackwood-foreground/15"><div className="h-full rounded-full bg-primary" style={{ width: `${(done / steps.length) * 100}%` }} /></div>
            <Link to="/onboarding" className="btn btn-primary mt-8">Continue setup</Link>
          </div>
          <ul className="divide-y p-2">
            {steps.map((s) => (
              <li key={s.l} className="flex items-center gap-3 px-4 py-3">
                {s.d ? <span className="grid h-5 w-5 place-items-center rounded-full bg-success text-success-foreground"><Check className="h-3 w-3" /></span> : <Circle className="h-5 w-5 text-input" />}
                <span className={`text-sm ${s.d ? "text-muted-foreground line-through" : "font-medium"}`}>{s.l}</span>
                {!s.d && <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          { k: "Get paid", t: "Create your first payment link.", c: "Create payment link", icon: Link2 },
          { k: "Sell", t: "Add your first product.", c: "Add product", icon: Package },
          { k: "Run your business", t: "Invite your team.", c: "Invite team", icon: UserPlus },
        ].map(({ k, t, c, icon: Icon }) => (
          <div key={k} className="panel flex flex-col p-6">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-primary"><Icon className="h-5 w-5" /></span>
            <p className="label-caps mt-5">{k}</p>
            <p className="mt-1 font-semibold">{t}</p>
            <button className="btn btn-outline mt-6 h-10 self-start text-sm"><Plus className="h-4 w-4" />{c}</button>
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------- Active business ---------- */
const chartData = Array.from({ length: 30 }, (_, i) => {
  const inc = 1.1 + Math.sin(i / 3) * 0.35 + (i / 30) * 0.8 + ((i * 7) % 5) * 0.06;
  const out = 0.55 + Math.cos(i / 4) * 0.2 + ((i * 3) % 4) * 0.05;
  return { d: `Sep ${i + 9 > 30 ? i - 21 : i + 9}`, Incoming: +inc.toFixed(2), Outgoing: +out.toFixed(2) };
});
const attention = [
  { icon: Clock, t: "3 payouts awaiting approval", s: "₦2,340,000 total", tone: "primary" },
  { icon: AlertTriangle, t: "2 failed payments", s: "Card declined · retry available", tone: "destructive" },
  { icon: Scale, t: "1 reconciliation exception", s: "Settlement mismatch on Oct 6", tone: "warning" },
  { icon: FileWarning, t: "Verification document required", s: "Upload proof of address", tone: "warning" },
  { icon: Wallet, t: "Low balance for scheduled payment", s: "Salaries on Oct 25 need ₦6.2M", tone: "primary" },
];
const activity = [
  { t: "Payment received", c: "Chioma Eze", a: 185000, s: "Successful", d: "Today, 10:42" },
  { t: "Payout to supplier", c: "Lagos Textiles Co.", a: -1240000, s: "Pending", d: "Today, 09:15" },
  { t: "Invoice paid · INV-0482", c: "Bluefin Hotels", a: 920000, s: "Successful", d: "Yesterday" },
  { t: "Card payment", c: "Tunde Bakare", a: 45500, s: "Failed", d: "Yesterday" },
  { t: "Transfer received", c: "Amaka Stores", a: 310000, s: "Successful", d: "Oct 6" },
  { t: "Bulk payout · Staff", c: "14 recipients", a: -3860000, s: "Successful", d: "Oct 5" },
];
const naira = (n: number) => `${n < 0 ? "−" : ""}₦${Math.abs(n).toLocaleString("en-NG")}`;

function ActiveDashboard() {
  const [range, setRange] = useState("30 days");
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">{greet}, Nova Retail.</h1>
          <p className="mt-2 text-muted-foreground">Here's what's happening with your business.</p>
        </div>
        <div className="flex rounded-lg border bg-card p-0.5 text-sm font-medium">
          {["Today", "7 days", "30 days", "Custom"].map((r) => (
            <button key={r} onClick={() => setRange(r)} className={`rounded-md px-3 py-1.5 ${range === r ? "bg-blackwood text-blackwood-foreground" : "text-muted-foreground hover:text-foreground"}`}>{r}</button>
          ))}
        </div>
      </div>

      <section className="mt-8 grid gap-4 lg:grid-cols-[1.25fr_1fr_1fr_1fr]">
        <div className="flex flex-col justify-between rounded-xl bg-blackwood p-6 text-blackwood-foreground">
          <div>
            <p className="label-caps text-blackwood-foreground/60">Available balance</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight tnum">₦24,850,000<span className="text-blackwood-foreground/45">.00</span></p>
          </div>
          <div className="mt-6 flex gap-2">
            <button className="btn btn-primary h-9 flex-1 text-sm"><ArrowDownLeft className="h-4 w-4" />Add money</button>
            <button className="btn h-9 flex-1 border border-blackwood-foreground/25 text-sm hover:bg-blackwood-foreground/10"><ArrowUpRight className="h-4 w-4" />Send money</button>
          </div>
        </div>
        {[
          { k: "Total sales", v: "₦48.2M", c: "+18.4%" },
          { k: "Payments", v: "1,842", c: "+12.1%" },
          { k: "Payouts", v: "₦14.8M", c: "+8.7%" },
        ].map((m) => (
          <div key={m.k} className="panel p-6">
            <p className="label-caps">{m.k}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight tnum">{m.v}</p>
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded bg-success px-1.5 py-0.5 font-semibold text-success-foreground">{m.c}</span>vs previous period
            </p>
          </div>
        ))}
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="panel p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Money movement</h2>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-chart-1" />Incoming ₦41.6M</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-chart-2" />Outgoing ₦18.9M</span>
              <span className="font-semibold text-foreground">Net +₦22.7M</span>
            </div>
          </div>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: -16, right: 4 }}>
                <defs>
                  <linearGradient id="inc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.25} /><stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="d" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} interval={6} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickFormatter={(v) => `₦${v}M`} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }} formatter={(v: number) => `₦${v}M`} />
                <Area type="monotone" dataKey="Incoming" stroke="var(--chart-1)" strokeWidth={2} fill="url(#inc)" />
                <Area type="monotone" dataKey="Outgoing" stroke="var(--chart-2)" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Needs your attention</h2>
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">{attention.length}</span>
          </div>
          <ul className="mt-4 divide-y">
            {attention.map(({ icon: Icon, t, s, tone }) => (
              <li key={t}>
                <button className="flex w-full items-center gap-3 py-3 text-left">
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${tone === "destructive" ? "bg-destructive/10 text-destructive" : tone === "warning" ? "bg-highlight text-highlight-foreground" : "bg-accent text-primary"}`}><Icon className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{t}</span><span className="block truncate text-xs text-muted-foreground">{s}</span></span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="panel mt-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="text-lg font-semibold">Recent activity</h2>
          <button className="text-sm font-semibold text-primary hover:underline">View all transactions</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y bg-muted/60 text-left">
                {["Transaction", "Customer", "Amount", "Status", "Date"].map((h) => <th key={h} className="label-caps px-6 py-2.5 font-semibold">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y">
              {activity.map((r) => (
                <tr key={r.t + r.d} className="hover:bg-muted/40">
                  <td className="px-6 py-3.5 font-medium">{r.t}</td>
                  <td className="px-6 py-3.5 text-muted-foreground">{r.c}</td>
                  <td className={`px-6 py-3.5 font-semibold tnum ${r.a < 0 ? "" : "text-foreground"}`}>{naira(r.a)}</td>
                  <td className="px-6 py-3.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.s === "Successful" ? "bg-success text-success-foreground" : r.s === "Pending" ? "bg-highlight text-highlight-foreground" : "bg-destructive/10 text-destructive"}`}>{r.s}</span>
                  </td>
                  <td className="px-6 py-3.5 text-muted-foreground">{r.d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
