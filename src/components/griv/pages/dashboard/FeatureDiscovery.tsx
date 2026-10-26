import { Link } from "@tanstack/react-router";
import { ArrowRight, Link2, ReceiptText, Store, type LucideIcon } from "lucide-react";
import { NEW_MERCHANT_FEATURES } from "@/lib/demo/dashboard";

const ICONS: Record<string, LucideIcon> = { link: Link2, invoice: ReceiptText, store: Store };

/**
 * New-merchant state, modelled on the Dyser reference: exactly three
 * equal-width feature cards — icon top-left, title and description below,
 * then a left-aligned arrow action under the description.
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
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <span className="mt-6 block font-semibold">{f.title}</span>
            <span className="mt-1.5 block text-sm text-muted-foreground">{f.description}</span>
            <ArrowRight className="mt-5 h-5 w-5 text-primary transition-transform group-hover:translate-x-0.5" />
          </Link>
        );
      })}
    </section>
  );
}
