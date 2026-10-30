import { useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "@tanstack/react-router";
import { ArrowRight, Search, X } from "lucide-react";
import { DashboardPage } from "@/components/griv/kit";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CATEGORIES, categoryLabel, searchSettings, SETTINGS, type SettingEntry } from "@/lib/settings/registry";
import { useMembers, useRoles, useViewerId, viewerStore } from "@/lib/demo/settings/access";
import { Hint } from "./ui";
import { cn } from "@/lib/utils";

function Entry({ s, showCategory }: { s: SettingEntry; showCategory?: boolean }) {
  return (
    <Link to="/settings/$slug" params={{ slug: s.slug }}
      className="group -mx-3 flex gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-accent text-primary"><s.icon className="h-4 w-4" /></span>
      <span className="min-w-0">
        <span className="flex items-center gap-1 text-sm font-semibold group-hover:text-primary">
          {s.name}<ArrowRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
        </span>
        <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">{s.description}</span>
        {showCategory && <span className="mt-1 block text-xs text-muted-foreground/80">{categoryLabel(s.category)}</span>}
      </span>
    </Link>
  );
}

export function SettingsHome() {
  const search = useSearch({ strict: false }) as { category?: string };
  const [q, setQ] = useState("");
  const results = useMemo(() => (q.trim() ? searchSettings(q) : []), [q]);
  const members = useMembers();
  const roles = useRoles();
  const viewer = useViewerId();

  useEffect(() => {
    if (search.category) document.getElementById(`cat-${search.category}`)?.scrollIntoView({ block: "start" });
  }, [search.category]);

  return (
    <DashboardPage crumbs={[{ label: "Settings" }]} title="Settings" description="Manage your business, payments, team, and account preferences.">
      <TooltipProvider delayDuration={150}>
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search settings..." aria-label="Search settings"
              className="field h-10 pl-9 pr-9 text-sm" />
            {q && <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Clear search"><X className="h-4 w-4" /></button>}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Preview permissions as</span>
            <select className="field h-9 w-auto text-sm" value={viewer} onChange={(e) => viewerStore.set(e.target.value)} aria-label="Preview permissions as">
              {members.filter((m) => m.status === "Active").map((m) => (
                <option key={m.id} value={m.id}>{m.name} — {roles.find((r) => r.id === m.roleId)?.name}{m.id === "mem_owner" ? " (you)" : ""}</option>
              ))}
            </select>
            <Hint>Switch to another team member to see which settings their role can change. In a live product the server enforces these permissions too.</Hint>
          </label>
        </div>

        {q.trim() ? (
          <section aria-live="polite">
            <p className="mb-3 text-sm text-muted-foreground"><span className="font-semibold text-foreground tnum">{results.length}</span> {results.length === 1 ? "setting" : "settings"} for “{q.trim()}”</p>
            {results.length ? (
              <div className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">{results.map((s) => <Entry key={s.slug} s={s} showCategory />)}</div>
            ) : (
              <div className="rounded-xl border border-dashed px-6 py-12 text-center">
                <p className="font-semibold">No settings match “{q.trim()}”</p>
                <p className="mt-1 text-sm text-muted-foreground">Try a broader word like “bank”, “team”, “API” or “invoice”.</p>
              </div>
            )}
          </section>
        ) : (
          <div className="space-y-10">
            {CATEGORIES.map((c) => (
              <section key={c.id} id={`cat-${c.id}`} className={cn("scroll-mt-24", search.category === c.id && "rounded-xl")}>
                <h2 className="text-base font-semibold">{c.label}</h2>
                <p className="mb-2 text-sm text-muted-foreground">{c.description}</p>
                <div className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
                  {SETTINGS.filter((s) => s.category === c.id).map((s) => <Entry key={s.slug} s={s} />)}
                </div>
              </section>
            ))}
          </div>
        )}
      </TooltipProvider>
    </DashboardPage>
  );
}
