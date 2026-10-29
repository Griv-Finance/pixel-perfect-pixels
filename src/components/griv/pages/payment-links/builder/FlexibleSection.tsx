import { AlertTriangle, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { CURRENCIES, type Currency } from "@/lib/money";
import type { BuilderConfig, ConfigErrors } from "@/lib/demo/link-builder";

const CATEGORIES = ["None", "General electronics", "Clothing", "Food & drinks", "Professional services", "Digital goods", "Other"];

/** Type B — Customers choose what to pay (Part C). No catalog product required. */
export function FlexibleSection({ cfg, update, errors, onUnwired }: {
  cfg: BuilderConfig; update: (fn: (c: BuilderConfig) => BuilderConfig) => void; errors: ConfigErrors; onUnwired: () => void;
}) {
  const flex = cfg.flexible;
  const patch = (over: Partial<BuilderConfig["flexible"]>) => update((c) => ({ ...c, flexible: { ...c.flexible, ...over } }));

  return (
    <section>
      <h2 className="text-sm font-semibold">Customers choose what to pay</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div>
          <label htmlFor="flex-title" className="text-xs font-semibold">
            Title <span className="font-normal text-muted-foreground">(required)</span>
          </label>
          <input
            id="flex-title"
            className={cn("field mt-1.5 h-9 text-sm", errors["flex.title"] && "border-destructive")}
            value={flex.title}
            onChange={(e) => patch({ title: e.target.value })}
          />
          {errors["flex.title"] && <p className="mt-1 text-xs font-medium text-destructive" role="alert">{errors["flex.title"]}</p>}
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold">
            Image <span className="rounded border px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">Optional</span>
          </p>
          <button
            className="mt-1.5 grid h-[76px] w-28 place-items-center rounded-md border border-dashed text-xs font-medium text-primary hover:bg-muted"
            onClick={onUnwired}
          >
            <span className="flex flex-col items-center gap-1">
              <Upload className="h-4 w-4" />
              Upload
            </span>
          </button>
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="flex-desc" className="text-xs font-semibold">
          Description <span className="font-normal text-muted-foreground">Optional</span>
        </label>
        <textarea
          id="flex-desc"
          className="field mt-1.5 min-h-16 text-sm"
          placeholder="This is to give customers more context so they know what they are paying for"
          value={flex.description}
          onChange={(e) => patch({ description: e.target.value })}
        />
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold">Product category</p>
        <p className="text-xs text-muted-foreground">This will be used for calculating automatic tax.</p>
        <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
          <select className="field h-9 text-sm" value={flex.category} aria-label="Product category" onChange={(e) => patch({ category: e.target.value })}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select className="field h-9 text-sm" value={flex.taxIncluded} aria-label="Include tax in price" onChange={(e) => patch({ taxIncluded: e.target.value as "yes" | "no" })}>
            <option value="yes">Include tax in price: Yes</option>
            <option value="no">Include tax in price: No</option>
          </select>
        </div>
      </div>

      <div className="mt-4 max-w-xs">
        <label htmlFor="flex-currency" className="text-xs font-semibold">Currency</label>
        <select id="flex-currency" className="field mt-1.5 h-9 text-sm" value={cfg.currency} onChange={(e) => update((c) => ({ ...c, currency: e.target.value as Currency }))}>
          {CURRENCIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      <label className="mt-5 flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" checked={flex.presetEnabled} onChange={(e) => patch({ presetEnabled: e.target.checked })} />
        Suggest a price
      </label>
      {flex.presetEnabled && (
        <div className="mt-2 max-w-40 pl-6">
          <input
            type="number"
            min="0"
            step="0.01"
            className={cn("field h-9 text-sm", (errors["flex.preset"] || errors["flex.limits"]?.startsWith("Suggested")) && "border-destructive")}
            aria-label="Suggested price"
            value={flex.preset || ""}
            onChange={(e) => patch({ preset: Math.max(0, Number(e.target.value) || 0) })}
          />
          {errors["flex.preset"] && <p className="mt-1 text-xs font-medium text-destructive" role="alert">{errors["flex.preset"]}</p>}
        </div>
      )}

      <label className="mt-4 flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" checked={flex.limitsEnabled} onChange={(e) => patch({ limitsEnabled: e.target.checked })} />
        Set limits
      </label>
      {flex.limitsEnabled && (
        <div className="mt-2 grid max-w-sm grid-cols-2 gap-3 pl-6">
          <div>
            <label htmlFor="flex-min" className="text-xs font-medium text-muted-foreground">Minimum amount</label>
            <input
              id="flex-min"
              type="number"
              min="0"
              className={cn("field mt-1 h-9 text-sm", errors["flex.limits"] && "border-destructive")}
              value={flex.min || ""}
              onChange={(e) => patch({ min: Math.max(0, Number(e.target.value) || 0) })}
            />
          </div>
          <div>
            <label htmlFor="flex-max" className="text-xs font-medium text-muted-foreground">Maximum amount</label>
            <input
              id="flex-max"
              type="number"
              min="0"
              className={cn("field mt-1 h-9 text-sm", errors["flex.limits"] && "border-destructive")}
              value={flex.max || ""}
              onChange={(e) => patch({ max: Math.max(0, Number(e.target.value) || 0) })}
            />
          </div>
          {errors["flex.limits"] && (
            <p className="col-span-2 flex items-start gap-1.5 text-xs font-medium text-destructive" role="alert">
              <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
              {errors["flex.limits"]}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
