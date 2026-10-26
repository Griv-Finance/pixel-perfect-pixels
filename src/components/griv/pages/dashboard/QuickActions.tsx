import { Link } from "@tanstack/react-router";
import { ArrowRight, FileText, Link2, Package, Store } from "lucide-react";
import { QUICK_ACTIONS, RESOURCES, type Resource } from "@/lib/demo/dashboard";
import type { PreviewInfo } from "./PreviewNoticeDialog";

/* ---------- Quick actions (shared by new + verified states) ---------- */
const ICONS: Record<string, typeof Link2> = { link: Link2, invoice: FileText, product: Package, pos: Store };

export function QuickActions() {
  return (
    <section aria-label="Quick actions">
      <h2 className="mb-3 text-base font-semibold">Quick actions</h2>
      <div className="grid grid-cols-2 gap-3">
        {QUICK_ACTIONS.map(({ id, label, description, href }) => {
          const Icon = ICONS[id] ?? Link2;
          return (
            <Link key={id} to={href} className="panel group flex flex-col p-5 transition-colors hover:border-primary">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <p className="mt-4 font-semibold">{label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{description}</p>
              <ArrowRight className="mt-3 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- Resources and help ---------- */
export function ResourcesHelp({ onPreview }: { onPreview: (p: PreviewInfo) => void }) {
  const open = (r: Resource) => onPreview(r.preview);
  return (
    <section className="panel p-6" aria-label="Resources and help">
      <h2 className="text-base font-semibold">Resources & help</h2>
      <ul className="mt-3 divide-y">
        {RESOURCES.map((r) => (
          <li key={r.id}>
            <button type="button" onClick={() => open(r)} className="flex w-full items-center gap-3 py-3 text-left">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{r.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{r.description}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">Resource pages aren't part of this demo — each opens an honest preview.</p>
    </section>
  );
}
