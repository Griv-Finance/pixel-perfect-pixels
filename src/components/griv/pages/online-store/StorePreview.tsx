import { FormDialog, EmptyState } from "@/components/griv/kit";
import { useCatalog } from "@/lib/demo/catalog";
import type { StoreSettings } from "@/lib/demo/online-store";
import { formatMoney } from "@/lib/money";
import { ShoppingBag } from "lucide-react";
export const accentClasses = {
  primary: "bg-primary text-primary-foreground",
  blackwood: "bg-blackwood text-blackwood-foreground",
  peridot: "bg-success text-success-foreground",
};
export function StorePreview({
  settings: s,
  open,
  onOpenChange,
}: {
  settings: StoreSettings;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const products = useCatalog().filter(
    (p) =>
      p.status === "Published" &&
      p.channels.includes("Online Store") &&
      s.featured.includes(p.id) &&
      (s.showOut || p.type === "Digital" || p.variants.some((v) => v.available > 0)),
  );
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Storefront preview"
      description="Sample preview using your unsaved settings. Checkout is not connected."
      size="lg"
    >
      <div className="overflow-hidden rounded-xl border">
        <header className={`p-7 ${accentClasses[s.accent]}`}>
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-xl border text-2xl font-semibold">
              {s.mark}
            </span>
            <h2 className="text-2xl font-semibold">{s.name}</h2>
          </div>
          <p className="mt-6 text-xl">{s.tagline}</p>
          <p className="mt-3 text-sm opacity-80">{s.about}</p>
        </header>
        <div className="p-5">
          <div className="mb-5 flex flex-wrap gap-2">
            {s.collections.map((c) => (
              <span key={c.name} className="rounded-full bg-muted px-3 py-1 text-xs">
                {c.name}
              </span>
            ))}
          </div>
          <h3 className="mb-4 font-semibold">Featured favourites</h3>
          {!products.length ? (
            <EmptyState title="No featured products to display" />
          ) : (
            <div className={s.layout === "grid" ? "grid grid-cols-2 gap-4" : "space-y-3"}>
              {products.map((p) => (
                <article
                  key={p.id}
                  className={`rounded-lg border p-4 ${s.layout === "list" ? "flex items-center gap-4" : ""}`}
                >
                  <div className="grid h-20 place-items-center rounded-lg bg-accent text-primary">
                    <ShoppingBag className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="mt-3 font-medium">{p.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatMoney(p.variants[0]?.price ?? 0)}
                    </p>
                    {p.type === "Physical" && p.variants.every((v) => v.available === 0) && (
                      <p className="text-xs text-destructive">Out of stock</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
          <p className="mt-6 border-t pt-4 text-sm text-muted-foreground">
            {s.email} · {s.phone}
            <br />
            Free delivery on orders above {formatMoney(s.freeAbove)}
            {s.pickup ? " · Lekki pickup available" : ""}
          </p>
        </div>
      </div>
    </FormDialog>
  );
}
