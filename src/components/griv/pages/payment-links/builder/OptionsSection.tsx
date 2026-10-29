import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { product, recurringItems, type BuilderConfig, type ConfigErrors } from "@/lib/demo/link-builder";

function Check({ label, checked, onChange, children, hint }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; children?: React.ReactNode; hint?: string;
}) {
  return (
    <div>
      <label className="flex items-start gap-2.5 text-sm font-medium">
        <input type="checkbox" className="mt-0.5" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span>{label}</span>
        {hint && <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label={hint} />}
      </label>
      {checked && children && <div className="mt-1.5 pl-6">{children}</div>}
    </div>
  );
}

/** Part D — standard checkout options under Payment page. */
export function OptionsSection({ cfg, update, errors }: {
  cfg: BuilderConfig; update: (fn: (c: BuilderConfig) => BuilderConfig) => void; errors: ConfigErrors;
}) {
  const o = cfg.options;
  const patch = (over: Partial<BuilderConfig["options"]>) => update((c) => ({ ...c, options: { ...c.options, ...over } }));
  const hasRecurring = cfg.linkType === "products" && recurringItems(cfg).length > 0;

  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold">Options</h2>
      <div className="mt-3 space-y-3.5">
        <Check label="Collect tax automatically" checked={o.collectTax} onChange={(v) => patch({ collectTax: v })} />

        <Check label="Collect customer names" checked={o.names !== "off"} onChange={(v) => patch({ names: v ? "required" : "off" })}>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={o.names === "optional"} onChange={(e) => patch({ names: e.target.checked ? "optional" : "required" })} />
            Mark as optional
          </label>
        </Check>

        <Check label="Collect business names" checked={o.business !== "off"} onChange={(v) => patch({ business: v ? "required" : "off" })}>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={o.business === "optional"} onChange={(e) => patch({ business: e.target.checked ? "optional" : "required" })} />
            Mark as optional
          </label>
        </Check>

        <Check label="Collect customer addresses" checked={o.address !== "off"} onChange={(v) => patch({ address: v ? "billing" : "off" })}>
          <div className="space-y-1.5">
            {(
              [
                ["billing", "Billing addresses only"],
                ["billing_shipping", "Billing and shipping addresses"],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-sm">
                <input type="radio" name="address-mode" checked={o.address === value} onChange={() => patch({ address: value })} />
                {label}
              </label>
            ))}
          </div>
        </Check>

        <Check label="Require customers to provide a phone number" checked={o.phone} onChange={(v) => patch({ phone: v })} />

        {hasRecurring && (
          <Check label="Include a free trial" checked={o.trialEnabled} onChange={(v) => patch({ trialEnabled: v })}>
            <div className="flex items-center gap-2 text-sm">
              <input
                type="number"
                min={1}
                aria-label="Trial duration"
                className={cn("field h-8 w-16 text-sm", errors.trial && "border-destructive")}
                value={o.trialDuration || ""}
                onChange={(e) => patch({ trialDuration: Math.max(0, Number(e.target.value) || 0) })}
              />
              <select className="field h-8 w-24 text-sm" aria-label="Trial unit" value={o.trialUnit} onChange={(e) => patch({ trialUnit: e.target.value as BuilderConfig["options"]["trialUnit"] })}>
                <option value="days">days</option>
                <option value="weeks">weeks</option>
                <option value="months">months</option>
              </select>
            </div>
            {errors.trial && <p className="text-xs font-medium text-destructive" role="alert">{errors.trial}</p>}
            <label className="mt-2 flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-0.5" checked={o.trialWithoutCard} onChange={(e) => patch({ trialWithoutCard: e.target.checked })} />
              <span>Let customers start trial without payment method</span>
            </label>
          </Check>
        )}

        <div>
          <Check
            label="Limit the number of payments"
            checked={o.limitPaymentsEnabled}
            onChange={(v) => patch({ limitPaymentsEnabled: v })}
            hint="Caps how many completed payments this link accepts."
          >
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">At most</span>
              <input
                type="number"
                min={1}
                aria-label="Maximum completed payments"
                className="field h-8 w-20 text-sm"
                value={o.limitPaymentsMax || ""}
                onChange={(e) => patch({ limitPaymentsMax: Math.max(1, Number(e.target.value) || 1) })}
              />
              <span className="text-muted-foreground">completed payments</span>
            </div>
          </Check>
          {errors.limit && <p className="mt-1 text-xs font-medium text-destructive" role="alert">{errors.limit}</p>}
        </div>
      </div>
    </section>
  );
}
