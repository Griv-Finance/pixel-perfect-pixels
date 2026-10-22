import { useState } from "react";
import { ChevronDown, Eye, Menu } from "lucide-react";
import { LogoMark } from "@/components/griv/Logo";
import { FEATURE_ICONS, type Feature, type MerchantGroup } from "@/lib/merchant-groups";

/** Illustrative menu for one merchant group. Lives only inside the preview area. */
export function PreviewSidebar({ group, active, onSelect }: {
  group: MerchantGroup; active: Feature; onSelect: (f: Feature) => void;
}) {
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggle = (c: string) => setClosed((s) => ({ ...s, [c]: !s[c] }));

  const item = (f: Feature, optional = false) => {
    const Icon = FEATURE_ICONS[f];
    const on = active === f;
    return (
      <button
        key={f}
        onClick={() => { onSelect(f); setMobileOpen(false); }}
        aria-current={on ? "page" : undefined}
        className={`flex w-full items-center gap-3 rounded-md px-3 py-1.5 text-left text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${on ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground [&>svg]:text-sidebar-primary" : ""} ${optional ? "opacity-70" : ""}`}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">{f}</span>
        {optional && <span className="rounded border border-sidebar-border px-1.5 text-[10px] uppercase tracking-wider">Optional</span>}
      </button>
    );
  };

  const section = (category: string, items: Feature[], optional = false) => {
    const isClosed = closed[category];
    return (
      <div key={category} className="mt-3">
        <button
          onClick={() => toggle(category)}
          aria-expanded={!isClosed}
          className="flex w-full items-center justify-between px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/50 hover:text-sidebar-accent-foreground"
        >
          {category}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isClosed ? "-rotate-90" : ""}`} />
        </button>
        {!isClosed && <div className="mt-0.5 space-y-0.5">{items.map((f) => item(f, optional))}</div>}
      </div>
    );
  };

  return (
    <div className="lg:sticky lg:top-24">
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="btn btn-outline mb-3 h-10 w-full text-sm lg:hidden"
        aria-expanded={mobileOpen}
      >
        <Menu className="h-4 w-4" />{mobileOpen ? "Hide preview menu" : "Show preview menu"}
      </button>
      <aside className={`${mobileOpen ? "block" : "hidden"} overflow-hidden rounded-xl bg-sidebar text-sidebar-foreground ring-2 ring-dashed ring-primary/40 lg:block`}>
        <div className="flex items-center gap-2 bg-highlight px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-highlight-foreground">
          <Eye className="h-3.5 w-3.5" />Proposed menu · preview only
        </div>
        <div className="flex items-center gap-2.5 px-4 pb-2 pt-4">
          <LogoMark className="h-6 w-6" />
          <span className="truncate text-sm font-semibold text-sidebar-accent-foreground">{group.name}</span>
        </div>
        <nav className="max-h-[calc(100vh-14rem)] overflow-y-auto px-2 pb-4" aria-label={`${group.name} preview menu`}>
          <div className="mt-2">{item("Dashboard")}</div>
          {group.sidebar.map((s) => section(s.category, s.items))}
          {group.addOns.length > 0 && section("Optional add-ons", group.addOns, true)}
        </nav>
      </aside>
    </div>
  );
}
