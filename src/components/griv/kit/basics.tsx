import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, Check, ChevronRight, Copy, FlaskConical, Inbox, RefreshCw, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { statusTone, TONE_CLASS, type StatusTone } from "@/lib/status";
import { cn } from "@/lib/utils";

/* ---------- Page header ---------- */
export type Crumb = { label: string; to?: "/dashboard" | undefined };

export function PageHeader({ crumbs, title, description, actions }: {
  crumbs?: Crumb[] | undefined; title: string; description?: string | undefined; actions?: ReactNode | undefined;
}) {
  return (
    <div className="mb-6">
      {crumbs && crumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          {crumbs.map((c, i) => (
            <span key={c.label} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3" />}
              {c.to ? <Link to={c.to} className="hover:text-foreground hover:underline">{c.label}</Link> : <span>{c.label}</span>}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="mt-1.5 text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/* ---------- Sample-data notice ---------- */
export function DemoNotice({ children }: { children: ReactNode }) {
  return (
    <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-dashed border-input bg-card px-4 py-2.5 text-sm text-muted-foreground">
      <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <p>{children}</p>
    </div>
  );
}

/* ---------- Metric cards ---------- */
export function MetricCard({ label, value, sub, tone, dark, icon: Icon }: {
  label: string; value: ReactNode; sub?: ReactNode | undefined; tone?: StatusTone | undefined; dark?: boolean | undefined; icon?: LucideIcon | undefined;
}) {
  return (
    <div className={cn("flex flex-col justify-between rounded-xl p-5", dark ? "bg-blackwood text-blackwood-foreground" : "panel")}>
      <div className="flex items-start justify-between gap-2">
        <p className={cn("label-caps", dark && "text-blackwood-foreground/60")}>{label}</p>
        {Icon && <Icon className={cn("h-4 w-4", dark ? "text-primary" : "text-muted-foreground")} />}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight tnum">{value}</p>
      {sub && (
        <p className={cn("mt-2 text-xs", dark ? "text-blackwood-foreground/60" : "text-muted-foreground")}>
          {tone ? <span className={cn("rounded px-1.5 py-0.5 font-semibold", TONE_CLASS[tone])}>{sub}</span> : sub}
        </p>
      )}
    </div>
  );
}

export function MetricGrid({ children, cols = 4 }: { children: ReactNode; cols?: 2 | 3 | 4 | 5 | undefined }) {
  const c = { 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4", 5: "lg:grid-cols-5" }[cols];
  return <section className={cn("mb-6 grid gap-4 sm:grid-cols-2", c)}>{children}</section>;
}

/* ---------- Status badge ---------- */
export function StatusBadge({ status, tone, className }: { status: string; tone?: StatusTone | undefined; className?: string | undefined }) {
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold", TONE_CLASS[tone ?? statusTone(status)], className)}>
      {status}
    </span>
  );
}

/* ---------- Copy ---------- */
export function CopyButton({ value, label = "Copy", className, iconOnly }: { value: string; label?: string | undefined; className?: string | undefined; iconOnly?: boolean | undefined }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setDone(false), 1500);
    } catch {
      toast.error("Couldn't copy. Select the text and copy it manually.");
    }
  };
  return (
    <button type="button" onClick={copy} aria-label={iconOnly ? `${label}: ${value}` : undefined}
      className={cn("inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-primary hover:underline", className)}>
      {done ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{!iconOnly && label}
    </button>
  );
}

/* ---------- States ---------- */
export function EmptyState({ icon: Icon = Inbox, title, description, action }: {
  icon?: LucideIcon | undefined; title: string; description?: string | undefined; action?: ReactNode | undefined;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-primary"><Icon className="h-6 w-6" /></span>
      <p className="mt-4 font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", description = "We couldn't load this. Check your connection and try again.", onRetry }: {
  title?: string | undefined; description?: string | undefined; onRetry?: (() => void) | undefined;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-destructive/10 text-destructive"><AlertTriangle className="h-6 w-6" /></span>
      <p className="mt-4 font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {onRetry && <button onClick={onRetry} className="btn btn-outline mt-5 h-9 text-sm"><RefreshCw className="h-4 w-4" />Try again</button>}
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number | undefined; cols?: number | undefined }) {
  return (
    <div className="divide-y" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-6 px-5 py-4">
          {Array.from({ length: cols }).map((_, c) => <Skeleton key={c} className={cn("h-4", c === 0 ? "w-40" : "flex-1")} />)}
        </div>
      ))}
    </div>
  );
}

export function CardsSkeleton({ count = 4 }: { count?: number | undefined }) {
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="panel space-y-3 p-5"><Skeleton className="h-3 w-24" /><Skeleton className="h-7 w-32" /><Skeleton className="h-3 w-20" /></div>
      ))}
    </div>
  );
}

/** Shows a short loading state when a page first opens, like a real network request would. */
export function useDemoLoading(ms = 450) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return loading;
}

/* ---------- Form field ---------- */
export function Field({ label, hint, error, children, htmlFor, optional }: {
  label: string; hint?: string | undefined; error?: string | undefined; children: ReactNode; htmlFor?: string | undefined; optional?: boolean | undefined;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 flex items-center justify-between text-sm font-medium">
        {label}{optional && <span className="text-xs font-normal text-muted-foreground">Optional</span>}
      </label>
      {children}
      {error ? <p className="mt-1.5 text-xs font-medium text-destructive" role="alert">{error}</p>
        : hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/* ---------- Detail list & timeline ---------- */
export function DetailList({ items, className }: { items: [string, ReactNode][]; className?: string | undefined }) {
  return (
    <dl className={cn("divide-y rounded-lg border", className)}>
      {items.map(([k, v]) => (
        <div key={k} className="flex items-start justify-between gap-4 px-4 py-2.5 text-sm">
          <dt className="shrink-0 text-muted-foreground">{k}</dt>
          <dd className="min-w-0 text-right font-medium">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export type TimelineEvent = { label: string; time: string; note?: string | undefined; tone?: StatusTone | undefined };

export function Timeline({ events }: { events: TimelineEvent[] }) {
  const dot: Record<StatusTone, string> = {
    success: "bg-success-foreground", pending: "bg-warning", warning: "bg-warning", danger: "bg-destructive", info: "bg-primary", neutral: "bg-muted-foreground",
  };
  return (
    <ol className="relative space-y-4 border-l border-border pl-5">
      {events.map((e, i) => (
        <li key={i} className="relative">
          <span className={cn("absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-background", dot[e.tone ?? "success"])} />
          <p className="text-sm font-medium">{e.label}</p>
          <p className="text-xs text-muted-foreground">{e.time}</p>
          {e.note && <p className="mt-1 text-xs text-muted-foreground">{e.note}</p>}
        </li>
      ))}
    </ol>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode | undefined }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-base font-semibold">{children}</h2>
      {action}
    </div>
  );
}
