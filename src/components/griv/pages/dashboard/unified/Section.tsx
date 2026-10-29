import type { ComponentType, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** One analytics band: thin border, light-grey header with an icon and the section name. */
export function DashboardSection({ icon: Icon, title, actions, className, children }: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  actions?: ReactNode;
  className?: string | undefined;
  children: ReactNode;
}) {
  return (
    <section className={cn("overflow-hidden bg-card", className)}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-5 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
          {title}
        </h2>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}

/** Quiet, bold dropdown that reads like MailerLite's filter headings ("All active forms ⌄"). */
export function InlineSelect<T extends string>({ value, onChange, options, className }: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string | undefined;
}) {
  return (
    <label className={cn("relative inline-flex max-w-full items-center font-semibold", className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        aria-label={options.find((o) => o.value === value)?.label}
        className="cursor-pointer appearance-none truncate bg-transparent pr-5 outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-0 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
    </label>
  );
}

/** Small labelled metric used inside bordered grid cells. */
export function Metric({ label, value, sub, big, className }: {
  label: string;
  value: ReactNode;
  sub?: string;
  big?: boolean;
  className?: string | undefined;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="truncate text-sm font-medium">{label}</p>
      <p className={cn("tnum font-semibold tracking-tight", big ? "mt-1 text-4xl" : "mt-1 text-2xl")}>{value}</p>
      {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}
