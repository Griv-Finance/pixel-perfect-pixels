import { useState } from "react";
import { Check, ChevronsUpDown, HandCoins, Package } from "lucide-react";
import { ConfirmDialog } from "@/components/griv/kit";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ConfigErrors, BuilderConfig } from "@/lib/demo/link-builder";
import { ProductsSection } from "./ProductsSection";
import { FlexibleSection } from "./FlexibleSection";
import { OptionsSection } from "./OptionsSection";
import { AdvancedSection } from "./AdvancedSection";
import { AfterPaymentSection } from "./AfterPaymentSection";

const LINK_TYPES = [
  {
    value: "products",
    label: "Products or subscriptions",
    description: "Best for selling goods, services or recurring plans at set prices.",
    icon: Package,
  },
  {
    value: "flexible",
    label: "Customers choose what to pay",
    description: "Best for tips, donations, contributions or pay-what-you-want.",
    icon: HandCoins,
  },
] as const;

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
  const current = LINK_TYPES.find((t) => t.value === cfg.linkType) ?? LINK_TYPES[0];
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
      {/* Select type: each option carries an icon and a one-line "what it's for" */}
      <p className="text-sm font-semibold">Select type</p>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="field mt-2 flex h-9 w-auto max-w-full items-center gap-2 text-left text-sm" aria-label="Select type">
            <current.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{current.label}</span>
            <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80 p-1">
          {LINK_TYPES.map((t) => (
            <DropdownMenuItem
              key={t.value}
              onSelect={() => askSwitch(t.value)}
              className={cn("items-start gap-2.5 px-2.5 py-2", t.value === cfg.linkType && "bg-muted")}
            >
              <t.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{t.label}</span>
                <span className="block text-xs text-muted-foreground">{t.description}</span>
              </span>
              {t.value === cfg.linkType && <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

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
    </div>
  );
}
