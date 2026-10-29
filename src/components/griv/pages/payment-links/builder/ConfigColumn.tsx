import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { ConfirmDialog } from "@/components/griv/kit";
import type { ConfigErrors, BuilderConfig } from "@/lib/demo/link-builder";
import { ProductsSection } from "./ProductsSection";
import { FlexibleSection } from "./FlexibleSection";
import { OptionsSection } from "./OptionsSection";
import { AdvancedSection } from "./AdvancedSection";
import { AfterPaymentSection } from "./AfterPaymentSection";

type Props = {
  cfg: BuilderConfig;
  update: (fn: (c: BuilderConfig) => BuilderConfig) => void;
  errors: ConfigErrors;
  tab: "payment" | "after";
  onTab: (t: "payment" | "after") => void;
  onUnwired: () => void;
};

/** Left column: Select type, Payment page | After payment tabs, and the configuration sections. */
export function ConfigColumn({ cfg, update, errors, tab, onTab, onUnwired }: Props) {
  const [switching, setSwitching] = useState<BuilderConfig["linkType"] | null>(null);
  const typeConfigured =
    cfg.linkType === "products" ? cfg.items.length > 0 : cfg.flexible.title.trim().length > 0 || cfg.flexible.presetEnabled;

  const askSwitch = (to: BuilderConfig["linkType"]) => {
    if (to === cfg.linkType) return;
    if (typeConfigured) setSwitching(to);
    else update((c) => ({ ...c, linkType: to }));
  };
  const doSwitch = () => {
    if (switching) update((c) => ({ ...c, linkType: switching }));
    setSwitching(null);
  };

  return (
    <div className="px-5 py-6 sm:px-8">
      {/* Select type */}
      <p className="text-sm font-semibold">Select type</p>
      <select
        className="field mt-2 h-9 max-w-xs text-sm"
        value={cfg.linkType}
        onChange={(e) => askSwitch(e.target.value as BuilderConfig["linkType"])}
        aria-label="Select type"
      >
        <option value="products">Products or subscriptions</option>
        <option value="flexible">Customers choose what to pay</option>
      </select>

      {/* Payment page | After payment */}
      <div className="mt-6 flex gap-5 border-b text-sm">
        {(
          [
            ["payment", "Payment page"],
            ["after", "After payment"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => onTab(value)}
            aria-current={tab === value}
            className={`-mb-px border-b-2 pb-2.5 font-medium transition-colors ${
              tab === value ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "payment" ? (
        <div className="pt-6">
          {cfg.linkType === "products" ? (
            <ProductsSection cfg={cfg} update={update} errors={errors} onUnwired={onUnwired} />
          ) : (
            <FlexibleSection cfg={cfg} update={update} errors={errors} onUnwired={onUnwired} />
          )}
          <OptionsSection cfg={cfg} update={update} errors={errors} />
          <AdvancedSection cfg={cfg} update={update} errors={errors} />
        </div>
      ) : (
        <div className="pt-6">
          <AfterPaymentSection cfg={cfg} update={update} errors={errors} />
        </div>
      )}

      <ConfirmDialog
        open={!!switching}
        onOpenChange={(o) => !o && setSwitching(null)}
        title="Switch payment link type?"
        description={
          cfg.linkType === "products"
            ? "Your product configuration will be hidden while “Customers choose what to pay” is selected. Switching back brings it straight back."
            : "Your flexible-payment details will be hidden while “Products or subscriptions” is selected. Switching back brings them straight back."
        }
        confirmLabel="Switch type"
        onConfirm={doSwitch}
      />
      <ChevronDown className="hidden" />
    </div>
  );
}
