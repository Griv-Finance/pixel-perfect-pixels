import type { ReactNode } from "react";
import { Download, Search, X } from "lucide-react";
import { DATE_RANGES, type DateRange } from "@/lib/dates";
import { cn } from "@/lib/utils";

/** Bar above a table holding search + filters + secondary actions. */
export function Toolbar({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-5 py-4">
      {children}
      {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = "Search…", className }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <div className={cn("relative w-full sm:w-64", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder}
        className="field h-9 pl-9 pr-8 text-sm" />
      {value && (
        <button onClick={() => onChange("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Clear search">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

type Opt = string | { value: string; label: string };

/** Compact labelled dropdown. Use "All" as the no-filter value. */
export function FilterSelect({ label, value, onChange, options, className }: {
  label: string; value: string; onChange: (v: string) => void; options: readonly Opt[]; className?: string;
}) {
  return (
    <label className={cn("relative inline-flex h-9 items-center rounded-lg border border-input bg-card pl-3 text-sm", value !== "All" && "border-primary", className)}>
      <span className="whitespace-nowrap text-muted-foreground">{label}:</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-full cursor-pointer appearance-none bg-transparent pl-1.5 pr-7 font-medium outline-none">
        {options.map((o) => {
          const v = typeof o === "string" ? o : o.value;
          return <option key={v} value={v}>{typeof o === "string" ? o : o.label}</option>;
        })}
      </select>
      <svg className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-muted-foreground" viewBox="0 0 20 20" fill="currentColor" aria-hidden><path d="M5.5 7.5 10 12l4.5-4.5" stroke="currentColor" strokeWidth="1.6" fill="none" /></svg>
    </label>
  );
}

export function DateRangeSelect({ value, onChange }: { value: DateRange; onChange: (v: DateRange) => void }) {
  return <FilterSelect label="Date" value={value} onChange={(v) => onChange(v as DateRange)} options={DATE_RANGES} className={value === "All time" ? "" : "border-input"} />;
}

export function ClearFilters({ show, onClear }: { show: boolean; onClear: () => void }) {
  if (!show) return null;
  return <button onClick={onClear} className="text-sm font-semibold text-primary hover:underline">Clear filters</button>;
}

export function ExportButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} className="btn btn-outline h-9 text-sm">
      <Download className="h-4 w-4" />Export CSV
    </button>
  );
}

/** Segmented tabs for status views (All / Pending / Failed …). */
export function StatusTabs<T extends string>({ value, onChange, tabs }: {
  value: T; onChange: (v: T) => void; tabs: { value: T; label: string; count?: number }[];
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b px-5" role="tablist">
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}
          className={cn("-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors",
            value === t.value ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
          {t.label}
          {t.count != null && <span className="rounded-full bg-muted px-1.5 text-xs tnum">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
