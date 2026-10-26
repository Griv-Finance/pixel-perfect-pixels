import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, ChevronDown, ChevronUp, Circle } from "lucide-react";
import { CHECKLIST_TASKS, checklistProgress, type DashboardState } from "@/lib/demo/dashboard";
import type { PreviewInfo } from "./PreviewNoticeDialog";
import { cn } from "@/lib/utils";

/**
 * Shared setup checklist for the new and verified merchant states.
 * Done/remaining tasks come from the mock checklist, not from real account data.
 */
export function SetupChecklist({ state, onPreview }: { state: DashboardState; onPreview: (p: PreviewInfo) => void }) {
  const [expanded, setExpanded] = useState(false);
  const { done, total } = checklistProgress(state);
  const remaining = CHECKLIST_TASKS.filter((t) => !t.done[state]);
  const visible = expanded || state === "new" ? CHECKLIST_TASKS : [CHECKLIST_TASKS[2]!, ...remaining.slice(0, 4)];

  return (
    <section className="panel p-6" aria-label="Setup checklist">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Getting set up</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {done} of {total} steps complete
          </p>
        </div>
        <p className="label-caps mt-1 tnum">{Math.round((done / total) * 100)}%</p>
      </div>
      <div className="mt-4 h-1.5 rounded-full bg-muted" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total}>
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(done / total) * 100}%` }} />
      </div>

      <ul className="mt-4 divide-y">
        {visible.map((t) => (
          <li key={t.id} className="flex items-center gap-3 py-3">
            {t.done[state] ? (
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-success text-success-foreground">
                <Check className="h-3.5 w-3.5" />
              </span>
            ) : (
              <Circle className="h-6 w-6 shrink-0 text-input" />
            )}
            <span className="min-w-0 flex-1">
              <span className={cn("block text-sm font-medium", t.done[state] && "text-muted-foreground line-through")}>{t.label}</span>
              <span className="block text-xs text-muted-foreground">{t.description}</span>
            </span>
            {!t.done[state] &&
              (t.href ? (
                <Link to={t.href} className="btn btn-outline h-8 shrink-0 text-xs">
                  Open
                </Link>
              ) : t.preview ? (
                <button type="button" onClick={() => onPreview(t.preview!)} className="btn btn-outline h-8 shrink-0 text-xs">
                  Start
                </button>
              ) : null)}
          </li>
        ))}
      </ul>

      {remaining.length > 4 && state !== "new" && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          {expanded ? (
            <>
              Show fewer <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              Show all {total} steps <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      )}
    </section>
  );
}
