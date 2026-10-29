import { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronsUpDown, Globe, Paintbrush, Share2, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tip = { icon: LucideIcon; title: string; text: string; action: string; key: string };

const TIPS: Tip[] = [
  { icon: Paintbrush, title: "Customize your brand", text: "Match the look and feel of your brand by adding your logo, fonts, and colors.", action: "Brand settings", key: "brand" },
  { icon: Globe, title: "Add your domain", text: "Use your own domain for your payment links.", action: "Custom domain settings", key: "domain" },
  { icon: Share2, title: "Increase conversion", text: "Win more international customers by turning on relevant payment methods.", action: "Manage payment methods", key: "methods" },
  { icon: Share2, title: "Share your payment link", text: "Start collecting payments by sharing your link with customers.", action: "Copy payment link", key: "copy" },
];

/** Stripe-style contextual tips carousel for the right-hand column. */
export function TipsPanel({ onAction }: { onAction: (key: string) => void }) {
  const [index, setIndex] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  const tip = TIPS[index]!;
  const Icon = tip.icon;

  return (
    <aside>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Tips for using your link</h2>
        <button
          className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:text-foreground"
          aria-label={collapsed ? "Expand tips" : "Collapse tips"}
          onClick={() => setCollapsed((c) => !c)}
        >
          <ChevronsUpDown className="h-3.5 w-3.5" />
        </button>
      </div>
      {!collapsed && (
        <div className="relative rounded-lg border border-border bg-card p-4">
          <button
            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
            aria-label="Dismiss tips"
            onClick={() => setDismissed(true)}
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-primary">
            <Icon className="h-4 w-4" />
          </span>
          <p className="mt-3 text-sm font-semibold">{tip.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{tip.text}</p>
          <button className="mt-2 text-sm font-medium text-primary hover:underline" onClick={() => onAction(tip.key)}>
            {tip.action} →
          </button>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {TIPS.map((t, i) => (
                <span
                  key={t.key}
                  className={cn("h-1.5 w-1.5 rounded-full", i === index ? "bg-primary" : "bg-muted-foreground/30")}
                />
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button
                className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:text-foreground"
                aria-label="Previous tip"
                onClick={() => setIndex((i) => (i - 1 + TIPS.length) % TIPS.length)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:text-foreground"
                aria-label="Next tip"
                onClick={() => setIndex((i) => (i + 1) % TIPS.length)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
