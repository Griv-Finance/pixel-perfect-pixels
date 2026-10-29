import { useState } from "react";
import { ChevronDown, Plus, Upload, X } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { formatMoney } from "@/lib/money";
import { CURRENCIES, type Currency } from "@/lib/money";
import {
  INTERVAL_SUFFIX,
  newProduct,
  uid,
  type BillingInterval,
  type BuilderConfig,
  type BuilderProduct,
} from "@/lib/demo/link-builder";
import { cn } from "@/lib/utils";

const INTERVALS: BillingInterval[] = ["One-off", "Daily", "Weekly", "Monthly", "Quarterly", "Yearly"];

type Props = {
  cfg: BuilderConfig;
  product?: BuilderProduct | undefined;
  onClose: () => void;
  onSave: (p: BuilderProduct) => void;
  onUnwired: () => void;
};

/** Right-hand Add/Edit product drawer (Part B): info, more options, pricing, optional preview panel. */
export function ProductDrawer({ cfg, product: existing, onClose, onSave, onUnwired }: Props) {
  const [p, setP] = useState<BuilderProduct>(() => (existing ? structuredClone(existing) : newProduct({ currency: cfg.currency })));
  const [showPreview, setShowPreview] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const editing = !!existing;

  const patch = (over: Partial<BuilderProduct>) => setP((v) => ({ ...v, ...over }));
  const nameError = submitted && p.name.trim().length < 1 ? "Name is required." : "";
  const amountError =
    submitted && !(p.amount > 0) ? "Enter an amount greater than zero." : p.currency !== cfg.currency ? `All products must share the link's currency (${cfg.currency}).` : "";
  const valid = p.name.trim().length >= 1 && p.amount > 0 && p.currency === cfg.currency;

  const save = () => {
    setSubmitted(true);
    if (!valid) return;
    onSave({ ...p, name: p.name.trim(), description: p.description.trim() });
  };

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className={cn("flex h-full w-full flex-col gap-0 overflow-hidden p-0", showPreview ? "sm:max-w-4xl" : "sm:max-w-xl")}>
        <div className="flex items-center justify-between gap-3 border-b px-6 py-4">
          <div className="min-w-0">
            <SheetTitle className="text-base">{editing ? "Update a product" : "Add a product"}</SheetTitle>
            <SheetDescription className="sr-only">{editing ? "Update a product" : "Add a product"}</SheetDescription>
          </div>
          <button
            className="btn btn-outline h-8 shrink-0 px-3 text-xs"
            onClick={() => setShowPreview((v) => !v)}
            aria-pressed={showPreview}
          >
            {showPreview ? "Close preview" : "Show preview"}
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          <div className="min-w-0 flex-1 overflow-y-auto px-6 py-5">
            {editing && (
              <p className="mb-5 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                Changes you make here will also apply to other payment links or integrations using this product.
              </p>
            )}

            {/* Product information */}
            <div>
              <label htmlFor="drawer-name" className="text-xs font-semibold">
                Name <span className="font-normal text-muted-foreground">(required)</span>
              </label>
              <p className="text-xs text-muted-foreground">Name of the product or service, visible to customers.</p>
              <input id="drawer-name" className={cn("field mt-1.5 h-9 text-sm", nameError && "border-destructive")} value={p.name} onChange={(e) => patch({ name: e.target.value })} />
              {nameError && <p className="mt-1 text-xs font-medium text-destructive" role="alert">{nameError}</p>}
            </div>
            <div className="mt-4">
              <label htmlFor="drawer-desc" className="text-xs font-semibold">
                Description
              </label>
              <p className="text-xs text-muted-foreground">Appears at checkout, on the customer portal, and in quotes.</p>
              <textarea id="drawer-desc" className="field mt-1.5 min-h-16 text-sm" value={p.description} onChange={(e) => patch({ description: e.target.value })} />
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold">Image</p>
              <p className="text-xs text-muted-foreground">Appears at checkout. JPEG, PNG, or WEBP under 2MB.</p>
              <button className="btn btn-outline mt-1.5 h-8 px-3 text-xs" onClick={onUnwired}>
                <Upload className="h-3.5 w-3.5" />
                Upload
              </button>
            </div>

            {/* More options */}
            <button className="mt-5 flex items-center gap-1 text-sm font-medium text-primary hover:underline" onClick={() => setMoreOpen((v) => !v)} aria-expanded={moreOpen}>
              More options
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", moreOpen && "rotate-180")} />
            </button>
            {moreOpen && (
              <div className="mt-3 space-y-4 rounded-lg border p-4">
                <div>
                  <label htmlFor="drawer-statement" className="text-xs font-semibold">Statement descriptor</label>
                  <p className="text-xs text-muted-foreground">Overrides the default. Only used for subscription payments.</p>
                  <input id="drawer-statement" className="field mt-1.5 h-9 text-sm" value={p.statementDescriptor} onChange={(e) => patch({ statementDescriptor: e.target.value })} />
                </div>
                <div>
                  <label htmlFor="drawer-unit" className="text-xs font-semibold">Unit label</label>
                  <p className="text-xs text-muted-foreground">Describes how you sell your product (e.g. “seat”). Use the plural form for packaged prices.</p>
                  <input id="drawer-unit" className="field mt-1.5 h-9 text-sm" value={p.unitLabel} onChange={(e) => patch({ unitLabel: e.target.value })} />
                </div>
                <div>
                  <p className="text-xs font-semibold">Metadata</p>
                  <p className="text-xs text-muted-foreground">Structured information for your own use, such as internal_sku=enterprise_plan. Metadata isn't shown to customers.</p>
                  {p.metadata.map((m, i) => (
                    <div key={i} className="mt-2 flex items-center gap-2">
                      <input className="field h-8 text-xs" placeholder="Key" value={m.key} aria-label="Metadata key" onChange={(e) => patch({ metadata: p.metadata.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)) })} />
                      <input className="field h-8 text-xs" placeholder="Value" value={m.value} aria-label="Metadata value" onChange={(e) => patch({ metadata: p.metadata.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />
                      <button className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:text-foreground" aria-label="Remove metadata" onClick={() => patch({ metadata: p.metadata.filter((_, j) => j !== i) })}>
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <button className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:underline" onClick={() => patch({ metadata: [...p.metadata, { key: "", value: "" }] })}>
                    <Plus className="h-3.5 w-3.5" /> Add metadata
                  </button>
                </div>
                <div>
                  <p className="text-xs font-semibold">Marketing feature list</p>
                  <p className="text-xs text-muted-foreground">Adds sellable features to display in pricing tables. Each feature can include a short benefit that customers will see when they try to cancel.</p>
                  {p.features.map((f, i) => (
                    <div key={i} className="mt-2 flex items-center gap-2">
                      <input className="field h-8 text-xs" placeholder="Feature benefit" value={f} aria-label={`Feature ${i + 1}`} onChange={(e) => patch({ features: p.features.map((x, j) => (j === i ? e.target.value : x)) })} />
                      <button className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:text-foreground" aria-label="Remove feature" onClick={() => patch({ features: p.features.filter((_, j) => j !== i) })}>
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <button className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:underline" onClick={() => patch({ features: [...p.features, ""] })}>
                    <Plus className="h-3.5 w-3.5" /> Add line
                  </button>
                </div>
              </div>
            )}

            {/* Pricing */}
            <hr className="my-5 border-border" />
            <p className="text-xs font-semibold">Pricing</p>
            <div className="mt-2 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Pricing model">
              {(["Recurring", "One-off"] as const).map((m) => {
                const selected = m === "Recurring" ? p.interval !== "One-off" : p.interval === "One-off";
                return (
                  <button
                    key={m}
                    role="radio"
                    aria-checked={selected}
                    onClick={() => patch({ interval: m === "Recurring" ? "Monthly" : "One-off" })}
                    className={cn("rounded-md border px-3 py-2 text-sm font-medium", selected ? "border-primary ring-1 ring-primary" : "border-border text-muted-foreground hover:bg-muted")}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
            <div className="mt-3">
              <label htmlFor="drawer-amount" className="text-xs font-semibold">
                Amount <span className="font-normal text-muted-foreground">(required)</span>
              </label>
              <div className="relative mt-1.5 flex">
                <input
                  id="drawer-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  className={cn("field h-9 flex-1 text-sm", amountError && "border-destructive")}
                  value={p.amount || ""}
                  onChange={(e) => patch({ amount: Math.max(0, Number(e.target.value) || 0) })}
                />
                <select
                  className="field absolute right-0 top-0 h-9 w-24 rounded-l-none border-l-0 text-sm"
                  value={p.currency}
                  aria-label="Currency"
                  onChange={(e) => patch({ currency: e.target.value as Currency })}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              {amountError && <p className="mt-1 text-xs font-medium text-destructive" role="alert">{amountError}</p>}
            </div>
            {p.interval !== "One-off" && (
              <>
                <div className="mt-3">
                  <label htmlFor="drawer-period" className="text-xs font-semibold">Billing period</label>
                  <select
                    id="drawer-period"
                    className="field mt-1.5 h-9 text-sm"
                    value={p.interval}
                    onChange={(e) => patch({ interval: e.target.value as BillingInterval })}
                  >
                    {INTERVALS.filter((i) => i !== "One-off").map((i) => (
                      <option key={i}>{i}</option>
                    ))}
                  </select>
                </div>
                <p className="mt-2 text-sm font-medium">
                  {formatMoney(p.amount, p.currency)} / {INTERVAL_SUFFIX[p.interval as "Monthly"]}
                </p>
              </>
            )}

            {/* Additional prices (editing an existing product) */}
            {editing && (
              <div className="mt-5">
                <p className="text-xs font-semibold">Additional prices</p>
                <p className="text-xs text-muted-foreground">Other prices already attached to this product. Existing prices are never overwritten.</p>
                {p.extraPrices.map((x, i) => (
                  <div key={x.id} className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      className="field h-8 w-28 text-xs"
                      value={x.amount || ""}
                      aria-label="Additional price amount"
                      onChange={(e) => patch({ extraPrices: p.extraPrices.map((y, j) => (j === i ? { ...y, amount: Math.max(0, Number(e.target.value) || 0) } : y)) })}
                    />
                    <select
                      className="field h-8 w-28 text-xs"
                      value={x.interval}
                      aria-label="Additional price interval"
                      onChange={(e) => patch({ extraPrices: p.extraPrices.map((y, j) => (j === i ? { ...y, interval: e.target.value as BillingInterval } : y)) })}
                    >
                      {INTERVALS.map((iv) => (
                        <option key={iv}>{iv}</option>
                      ))}
                    </select>
                    <button className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:text-foreground" aria-label="Remove price" onClick={() => patch({ extraPrices: p.extraPrices.filter((_, j) => j !== i) })}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  onClick={() => patch({ extraPrices: [...p.extraPrices, { id: uid("price"), interval: p.interval, amount: 0 }] })}
                >
                  <Plus className="h-3.5 w-3.5" /> Add another price
                </button>
              </div>
            )}
          </div>

          {/* Optional in-drawer preview */}
          {showPreview && (
            <aside className="hidden w-80 shrink-0 overflow-y-auto border-l bg-muted/40 px-6 py-5 sm:block">
              <p className="text-sm font-semibold">Preview</p>
              <p className="text-xs text-muted-foreground">Estimate totals based on pricing model, unit quantity, and tax.</p>
              <div className="mt-4 rounded-lg bg-card p-4 text-sm shadow-sm">
                <p className="text-xs font-semibold text-muted-foreground">Unit quantity</p>
                <p className="mt-1">1</p>
                <hr className="my-3 border-border" />
                <p className="tnum">1 × {formatMoney(p.amount, p.currency)} = {formatMoney(p.amount, p.currency)}</p>
                {p.interval !== "One-off" && (
                  <>
                    <hr className="my-3 border-border" />
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold">Total per {INTERVAL_SUFFIX[p.interval as "Monthly"]}</span>
                      <span className="font-semibold tnum">{formatMoney(p.amount, p.currency)}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Billed at the start of the period</p>
                  </>
                )}
                {p.interval === "One-off" && (
                  <>
                    <hr className="my-3 border-border" />
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold">Total</span>
                      <span className="font-semibold tnum">{formatMoney(p.amount, p.currency)}</span>
                    </div>
                  </>
                )}
              </div>
            </aside>
          )}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t px-6 py-4">
          <button className="btn btn-outline h-9 text-sm" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary h-9 text-sm" onClick={save}>
            {editing ? "Update product" : "Add product"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
