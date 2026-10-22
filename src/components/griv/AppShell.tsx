import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard, Wallet, ArrowLeftRight, Send, Banknote, Link2, Receipt, Landmark, CreditCard,
  Store, ShoppingBag, Package, Boxes, Monitor, Users, Truck, CalendarClock, Repeat, Scale, HandCoins,
  LineChart, Sparkles, Bot, Settings, UserCog, Code2, ScrollText, ChevronDown, Search, Bell, HelpCircle,
  PanelLeftClose, PanelLeftOpen, LayoutTemplate,
} from "lucide-react";
import { Logo, LogoMark } from "./Logo";

type Item = { label: string; icon: typeof Wallet; to?: "/dashboard" | "/previews" };
const NAV: { group: string; items: Item[] }[] = [
  { group: "Home", items: [{ label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" }] },
  { group: "Money", items: [{ label: "Balances", icon: Wallet }, { label: "Transactions", icon: ArrowLeftRight }, { label: "Transfers", icon: Send }, { label: "Payouts", icon: Banknote }] },
  { group: "Get paid", items: [{ label: "Payment Links", icon: Link2 }, { label: "Invoices", icon: Receipt }, { label: "Virtual Accounts", icon: Landmark }, { label: "Payments", icon: CreditCard }] },
  { group: "Sell", items: [{ label: "Online Store", icon: Store }, { label: "Orders", icon: ShoppingBag }, { label: "Products", icon: Package }, { label: "Inventory", icon: Boxes }, { label: "POS", icon: Monitor }] },
  { group: "Manage", items: [{ label: "Customers", icon: Users }, { label: "Suppliers", icon: Truck }, { label: "Scheduled Payments", icon: CalendarClock }, { label: "Recurring Payments", icon: Repeat }] },
  { group: "Finance", items: [{ label: "Cards", icon: CreditCard }, { label: "Reconciliation", icon: Scale }, { label: "Settlements", icon: HandCoins }] },
  { group: "Grow", items: [{ label: "Insights", icon: LineChart }, { label: "Credit", icon: Sparkles }, { label: "AI", icon: Bot }] },
  { group: "Settings", items: [{ label: "Settings", icon: Settings }, { label: "Team", icon: UserCog }, { label: "Developers", icon: Code2 }, { label: "Audit Logs", icon: ScrollText }] },
  { group: "Previews", items: [{ label: "Merchant Group Previews", icon: LayoutTemplate, to: "/previews" }] },
];

export function AppShell({ business, initials, live, onLiveChange, children }: {
  business: string; initials: string; live: boolean; onLiveChange: (v: boolean) => void; children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex min-h-screen bg-background">
      <aside className={`sticky top-0 hidden h-screen shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex ${collapsed ? "w-[72px]" : "w-64"}`}>
        <div className="flex h-16 items-center justify-between px-4">
          {collapsed ? <LogoMark className="mx-auto h-7 w-7" /> : <Logo variant="light" className="h-6" />}
        </div>
        {!collapsed && (
          <button className="mx-3 mb-3 flex items-center gap-2.5 rounded-lg border border-sidebar-border px-3 py-2 text-left hover:bg-sidebar-accent">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">{business.slice(0, 1)}</span>
            <span className="flex-1 truncate text-sm font-semibold text-sidebar-accent-foreground">{business}</span>
            <ChevronDown className="h-4 w-4 opacity-60" />
          </button>
        )}
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {NAV.map((s) => (
            <div key={s.group} className="mt-4 first:mt-1">
              {!collapsed && <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45">{s.group}</p>}
              {s.items.map(({ label, icon: Icon, to }) => {
                const cls = `flex w-full items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${collapsed ? "justify-center" : ""}`;
                return to ? (
                  <Link key={label} to={to} title={label} className={cls} activeProps={{ className: "bg-sidebar-accent !text-sidebar-accent-foreground font-semibold [&>svg]:text-sidebar-primary" }}>
                    <Icon className="h-4 w-4 shrink-0" />{!collapsed && label}
                  </Link>
                ) : (
                  <button key={label} title={`${label} — coming soon in this demo`} className={cls}>
                    <Icon className="h-4 w-4 shrink-0" />{!collapsed && label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <button onClick={() => setCollapsed(!collapsed)} className="flex items-center gap-2 border-t border-sidebar-border px-5 py-3 text-xs text-sidebar-foreground/60 hover:text-sidebar-accent-foreground">
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <><PanelLeftClose className="h-4 w-4" />Collapse</>}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {!live && <div className="bg-highlight py-1 text-center text-xs font-semibold uppercase tracking-[0.14em] text-highlight-foreground">Test mode — no real money moves</div>}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-background/90 px-6 backdrop-blur">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input className="field h-10 pl-9 text-sm" placeholder="Search payments, customers, products…" />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border px-1.5 text-[10px] text-muted-foreground">⌘K</kbd>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex rounded-lg border p-0.5 text-xs font-semibold">
              {(["Test", "Live"] as const).map((m) => (
                <button key={m} onClick={() => onLiveChange(m === "Live")} className={`rounded-md px-3 py-1.5 ${(m === "Live") === live ? (live ? "bg-blackwood text-blackwood-foreground" : "bg-highlight text-highlight-foreground") : "text-muted-foreground"}`}>{m}</button>
              ))}
            </div>
            <button className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Help"><HelpCircle className="h-4.5 w-4.5" /></button>
            <button className="relative grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Notifications">
              <Bell className="h-4.5 w-4.5" /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
            </button>
            <span className="ml-1 grid h-9 w-9 place-items-center rounded-full bg-blackwood text-xs font-semibold text-blackwood-foreground">{initials}</span>
          </div>
        </header>
        <main className="flex-1 px-6 py-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
