import { Link } from "@tanstack/react-router";
import { Link2, ReceiptText, Store, type LucideIcon } from "lucide-react";
import { NEW_MERCHANT_FEATURES } from "@/lib/demo/dashboard";

const ICONS: Record<string, LucideIcon> = { link: Link2, invoice: ReceiptText, store: Store };

/**
 * New-merchant state, modelled on the Dyser reference: exactly three
 * equal-width feature cards — icon top-left, contextual link top-right,
 * title and description below.
 */
export function FeatureDiscovery() {
  return (
    <section aria-label="Feature discovery" className="grid gap-5 md:grid-cols-3">
      {NEW_MERCHANT_FEATURES.map((f) => {
        const Icon = ICONS[f.id] ?? Link2;
        return (
          <Link
            key={f.id}
            to={f.href}
            className="panel group flex flex-col p-6 transition-colors hover:border-primary"
          >
            <span className="flex items-start justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-primary underline underline-offset-4">Learn More</span>
            </span>
            <span className="mt-6 block font-semibold">{f.title}</span>
            <span className="mt-1.5 block text-sm text-muted-foreground">{f.description}</span>
          </Link>
        );
      })}
    </section>
  );
}
