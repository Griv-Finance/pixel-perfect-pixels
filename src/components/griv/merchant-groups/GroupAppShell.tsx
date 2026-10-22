import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  ArrowLeft, ChevronDown, Columns3, Eye, Menu, PanelLeftClose, PanelLeftOpen, Search, X,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/griv/Logo";
import { FEATURE_ICONS, MERCHANT_GROUPS, type Feature, type MerchantGroup } from "@/lib/merchant-groups";

/**
 * A full-page Griv app layout whose menu is the proposed menu for one merchant group.
 * Used only by the merchant group pages; the real app layout (AppShell) is untouched.
 */
export function GroupAppShell({ group, active, onSelect, children }: {
  group: MerchantGroup; active: Feature; onSelect: (f: Feature) => void; children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [live, setLive] = useState(true);
  const navigate = useNavigate();
  const go = (slug: string) => navigate({ to: "/merchant-groups/$group", params: { group: slug } });

  return (
    <div className="flex min-h-screen bg-background">
      <aside className={`sticky top-0 hidden h-screen shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex ${collapsed ? "w-[72px]" : "w-64"}`}>
        <SidebarBody group={group} active={active} onSelect={onSelect} collapsed={collapsed} />
        <button onClick={() => setCollapsed(!collapsed)} className="flex items-center gap-2 border-t border-sidebar-border px-5 py-3 text-xs text-sidebar-foreground/60 hover:text-sidebar-accent-foreground">
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <><PanelLeftClose className="h-4 w-4" />Collapse</>}
        </button>
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button className="absolute inset-0 bg-blackwood/50" aria-label="Close menu" onClick={() => setDrawer(false)} />
          <aside className="relative flex h-full w-72 flex-col bg-sidebar text-sidebar-foreground">
            <button onClick={() => setDrawer(false)} className="absolute right-3 top-4 text-sidebar-foreground/70 hover:text-sidebar-accent-foreground" aria-label="Close menu"><X className="h-5 w-5" /></button>
            <SidebarBody group={group} active={active} onSelect={(f) => { onSelect(f); setDrawer(false); }} collapsed={false} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-highlight px-4 py-2 text-sm text-highlight-foreground sm:px-6">
          <Link to="/merchant-groups" className="inline-flex items-center gap-1.5 font-semibold hover:underline">
            <ArrowLeft className="h-4 w-4" />Merchant groups
          </Link>
          <span className="hidden items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] sm:inline-flex">
            <Eye className="h-3.5 w-3.5" />Menu preview
          </span>
          <div className="ml-auto flex items-center gap-2">
            <label>
              <span className="sr-only">Switch merchant group</span>
              <select value={group.slug} onChange={(e) => go(e.target.value)} className="h-8 max-w-[11rem] cursor-pointer rounded-md border border-highlight-foreground/25 bg-card px-2 text-sm font-medium text-foreground sm:max-w-none">
                {MERCHANT_GROUPS.map((g) => <option key={g.slug} value={g.slug}>{g.letter}. {g.name}</option>)}
              </select>
            </label>
            <Link to="/merchant-groups/compare" className="inline-flex h-8 items-center gap-1.5 rounded-md bg-blackwood px-3 text-sm font-semibold text-blackwood-foreground">
              <Columns3 className="h-4 w-4" /><span className="hidden sm:inline">Compare</span>
            </Link>
          </div>
        </div>

        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur sm:px-6">
          <button onClick={() => setDrawer(true)} className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground md:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="relative hidden max-w-md flex-1 sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input className="field h-10 pl-9 text-sm" placeholder="Search payments, customers, products…" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex rounded-lg border p-0.5 text-xs font-semibold">
              {(["Test", "Live"] as const).map((m) => (
                <button key={m} onClick={() => setLive(m === "Live")} className={`rounded-md px-3 py-1.5 ${(m === "Live") === live ? (live ? "bg-blackwood text-blackwood-foreground" : "bg-highlight text-highlight-foreground") : "text-muted-foreground"}`}>{m}</button>
              ))}
            </div>
            <span className="ml-1 grid h-9 w-9 place-items-center rounded-full bg-blackwood text-xs font-semibold text-blackwood-foreground">NR</span>
          </div>
        </header>
        {!live && <div className="bg-highlight/60 py-1 text-center text-xs font-semibold uppercase tracking-[0.14em] text-highlight-foreground">Test mode — no real money moves</div>}
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10"><div className="mx-auto max-w-6xl">{children}</div></main>
      </div>
    </div>
  );
}

function SidebarBody({ group, active, onSelect, collapsed }: {
  group: MerchantGroup; active: Feature; onSelect: (f: Feature) => void; collapsed: boolean;
}) {
  const [closed, setClosed] = useState<Record<string, boolean>>({});

  const item = (f: Feature, optional = false) => {
    const Icon = FEATURE_ICONS[f];
    const on = active === f;
    return (
      <button
        key={f}
        title={f}
        onClick={() => onSelect(f)}
        aria-current={on ? "page" : undefined}
        className={`flex w-full items-center gap-3 rounded-md px-3 py-1.5 text-left text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${collapsed ? "justify-center" : ""} ${on ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground [&>svg]:text-sidebar-primary" : ""} ${optional ? "opacity-70" : ""}`}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="flex-1 truncate">{f}</span>}
        {!collapsed && optional && <span className="rounded border border-sidebar-border px-1.5 text-[10px] uppercase tracking-wider">Optional</span>}
      </button>
    );
  };

  const section = (category: string, items: Feature[], optional = false) => {
    const isClosed = !collapsed && closed[category];
    return (
      <div key={category} className="mt-4">
        {!collapsed && (
          <button
            onClick={() => setClosed((s) => ({ ...s, [category]: !s[category] }))}
            aria-expanded={!isClosed}
            className="mb-1 flex w-full items-center justify-between px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45 hover:text-sidebar-accent-foreground"
          >
            {category}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isClosed ? "-rotate-90" : ""}`} />
          </button>
        )}
        {!isClosed && <div className="space-y-0.5">{items.map((f) => item(f, optional))}</div>}
      </div>
    );
  };

  return (
    <>
      <div className="flex h-16 shrink-0 items-center px-4">
        {collapsed ? <LogoMark className="mx-auto h-7 w-7" /> : <Logo variant="light" className="h-6" />}
      </div>
      {!collapsed && (
        <div className="mx-3 mb-2 flex items-center gap-2.5 rounded-lg border border-sidebar-border px-3 py-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">{group.letter}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-sidebar-accent-foreground">Nova Retail Ltd.</span>
            <span className="block truncate text-[11px] text-sidebar-foreground/60">{group.name}</span>
          </span>
        </div>
      )}
      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label={`${group.name} menu`}>
        <div className="mt-2">{item("Dashboard")}</div>
        {group.sidebar.map((s) => section(s.category, s.items))}
        {group.addOns.length > 0 && section("Optional add-ons", group.addOns, true)}
      </nav>
    </>
  );
}
