import { useEffect, useMemo, useRef, useState } from "react";
import { MoreHorizontal, Plus, PlusCircle, Search, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  catalogChoices,
  priceLabelFor,
  product,
  productFromCatalog,
  uid,
  type BuilderConfig,
  type BuilderProduct,
  type ConfigErrors,
} from "@/lib/demo/link-builder";
import { ProductDrawer } from "./ProductDrawer";

type Props = {
  cfg: BuilderConfig;
  update: (fn: (c: BuilderConfig) => BuilderConfig) => void;
  errors: ConfigErrors;
  onUnwired: () => void;
};

/** Product selection, selected-product cards, and recommended products (Part A of the brief). */
export function ProductsSection({ cfg, update, errors, onUnwired }: Props) {
  const [picker, setPicker] = useState<"main" | "recommendation" | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  // Close the picker on Escape or on a click outside of it.
  useEffect(() => {
    if (!picker) return;
    const onPointerDown = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPicker(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPicker(null);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [picker]);
  const [query, setQuery] = useState("");
  const [drawer, setDrawer] = useState<{ mode: "new" | "edit"; productId?: string; target: "main" | "recommendation" } | null>(null);

  const choices = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalogChoices()
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query]);

  const addCatalogProduct = (catalogId: string, target: "main" | "recommendation") => {
    const existing = cfg.products.find((p) => p.fromCatalog === catalogId);
    const prod = existing ?? productFromCatalog(catalogChoices().find((p) => p.id === catalogId)!, cfg.currency);
    update((c) => {
      const products = existing ? c.products : [...c.products, prod];
      return target === "main"
        ? { ...c, products, items: [...c.items, { uid: uid("item"), productId: prod.id, quantity: 1, adjustable: false, minQty: 0, maxQty: 99 }] }
        : { ...c, products, recommendations: [...c.recommendations, { uid: uid("reco"), productId: prod.id, quantity: 1, adjustable: false }] };
    });
    setPicker(null);
    setQuery("");
  };

  const saveDrawerProduct = (p: BuilderProduct) => {
    if (!drawer) return;
    update((c) => {
      const isNew = !c.products.some((x) => x.id === p.id);
      const products = isNew ? [...c.products, p] : c.products.map((x) => (x.id === p.id ? p : x));
      if (drawer.mode === "edit") return { ...c, products };
      return drawer.target === "main"
        ? { ...c, products, items: [...c.items, { uid: uid("item"), productId: p.id, quantity: 1, adjustable: false, minQty: 0, maxQty: 99 }] }
        : { ...c, products, recommendations: [...c.recommendations, { uid: uid("reco"), productId: p.id, quantity: 1, adjustable: false }] };
    });
    setDrawer(null);
  };

  const removeProduct = (productId: string) =>
    update((c) => ({
      ...c,
      products: c.products.filter((p) => p.id !== productId),
      items: c.items.filter((i) => i.productId !== productId),
      recommendations: c.recommendations.filter((r) => r.productId !== productId),
    }));

  const Picker = ({ target }: { target: "main" | "recommendation" }) => (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className="field h-9 pl-9 text-sm"
          placeholder="Find or add a product…"
          value={query}
          autoFocus
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Find or add a product"
        />
      </div>
      <div className="absolute z-20 mt-1 w-full rounded-lg border bg-card p-1 shadow-lg">
        {choices.map((p) => (
          <button
            key={p.id}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm hover:bg-muted"
            onClick={() => addCatalogProduct(p.id, target)}
          >
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-muted text-[10px] font-bold uppercase">{p.name.slice(0, 1)}</span>
            <span className="min-w-0 flex-1 truncate">{p.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{p.category}</span>
          </button>
        ))}
        {choices.length === 0 && <p className="px-2.5 py-2 text-sm text-muted-foreground">No products match “{query}”.</p>}
        <div className="border-t pt-1">
          <button
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm font-medium text-primary hover:bg-muted"
            onClick={() => {
              setDrawer({ mode: "new", target });
              setPicker(null);
              setQuery("");
            }}
          >
            <PlusCircle className="h-4 w-4" />
            Create a new product
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <section>
      <h2 className="text-sm font-semibold">Product</h2>
      {errors.items && <p className="mt-1.5 text-xs font-medium text-destructive" role="alert">{errors.items}</p>}

      <div className="mt-3">
        {(picker === "main" || cfg.items.length === 0) && <Picker target="main" />}
      </div>

      <div className="mt-3 space-y-3">
        {cfg.items.map((item) => {
          const p = product(cfg, item.productId);
          if (!p) return null;
          const badInterval = !!errors.interval && p.interval !== "One-off";
          return (
            <div key={item.uid} className={cn("rounded-lg border p-4", badInterval ? "border-destructive" : "border-border bg-card")}>
              <div className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-muted text-xs font-bold uppercase">{p.name.slice(0, 1)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className={cn("text-sm", badInterval && "text-destructive")}>{priceLabelFor(p)}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:text-foreground" aria-label={`Actions for ${p.name}`}>
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => setDrawer({ mode: "edit", productId: p.id, target: "main" })}>Edit product</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => removeProduct(p.id)}>
                      Remove product
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) =>
                    update((c) => ({ ...c, items: c.items.map((i) => (i.uid === item.uid ? { ...i, quantity: Math.max(1, Number(e.target.value) || 1) } : i)) }))
                  }
                  aria-label={`Quantity for ${p.name}`}
                  className="field h-9 w-16 text-sm"
                />
                <span className="text-sm text-muted-foreground">Quantity</span>
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={item.adjustable}
                  onChange={(e) => update((c) => ({ ...c, items: c.items.map((i) => (i.uid === item.uid ? { ...i, adjustable: e.target.checked } : i)) }))}
                />
                Let customers adjust quantity
              </label>
              {item.adjustable && (
                <div className="mt-2 flex items-center gap-2 pl-6 text-sm">
                  <span className="text-muted-foreground">Between</span>
                  <input
                    type="number"
                    min={0}
                    value={item.minQty}
                    aria-label="Minimum quantity"
                    onChange={(e) => update((c) => ({ ...c, items: c.items.map((i) => (i.uid === item.uid ? { ...i, minQty: Math.max(0, Number(e.target.value) || 0) } : i)) }))}
                    className="field h-8 w-16 text-sm"
                  />
                  <span className="text-muted-foreground">and</span>
                  <input
                    type="number"
                    min={0}
                    value={item.maxQty}
                    aria-label="Maximum quantity"
                    onChange={(e) => update((c) => ({ ...c, items: c.items.map((i) => (i.uid === item.uid ? { ...i, maxQty: Math.max(0, Number(e.target.value) || 0) } : i)) }))}
                    className="field h-8 w-16 text-sm"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {cfg.items.length > 0 && picker !== "main" && (
        <button className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary hover:underline" onClick={() => setPicker("main")}>
          <Plus className="h-4 w-4" />
          Add another product
        </button>
      )}

      {/* Recommended products */}
      <h2 className="mt-8 text-sm font-semibold">Recommended products</h2>
      <div className="mt-3 space-y-3">
        {cfg.recommendations.map((reco) => {
          const p = product(cfg, reco.productId);
          if (!p) return null;
          const badInterval = !!errors.interval && p.interval !== "One-off";
          return (
            <div key={reco.uid} className={cn("rounded-lg border p-4", badInterval ? "border-destructive" : "border-border bg-card")}>
              <div className="flex items-start gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-muted text-xs font-bold uppercase">{p.name.slice(0, 1)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className={cn("text-sm", badInterval && "text-destructive")}>{priceLabelFor(p)}</p>
                </div>
                <button
                  className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:text-foreground"
                  aria-label={`Remove ${p.name} from recommendations`}
                  onClick={() => update((c) => ({ ...c, recommendations: c.recommendations.filter((r) => r.uid !== reco.uid) }))}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={reco.quantity}
                  aria-label={`Quantity for ${p.name}`}
                  onChange={(e) =>
                    update((c) => ({
                      ...c,
                      recommendations: c.recommendations.map((r) => (r.uid === reco.uid ? { ...r, quantity: Math.max(1, Number(e.target.value) || 1) } : r)),
                    }))
                  }
                  className="field h-9 w-16 text-sm"
                />
                <span className="text-sm text-muted-foreground">Quantity</span>
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={reco.adjustable}
                  onChange={(e) =>
                    update((c) => ({ ...c, recommendations: c.recommendations.map((r) => (r.uid === reco.uid ? { ...r, adjustable: e.target.checked } : r)) }))
                  }
                />
                Let customers adjust quantity
              </label>
            </div>
          );
        })}
        {errors.interval && (
          <p className="flex items-start gap-1.5 text-xs font-medium text-destructive" role="alert">
            ⚠ {errors.interval}
          </p>
        )}
      </div>

      {picker === "recommendation" ? (
        <div className="mt-3">
          <Picker target="recommendation" />
          <button className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground" onClick={() => setPicker(null)}>
            <X className="h-3.5 w-3.5" />
            Cancel
          </button>
        </div>
      ) : (
        <button className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary hover:underline" onClick={() => setPicker("recommendation")}>
          <Plus className="h-4 w-4" />
          Add another recommendation
        </button>
      )}

      {drawer && (
        <ProductDrawer
          key={drawer.productId ?? "new"}
          cfg={cfg}
          product={drawer.mode === "edit" ? product(cfg, drawer.productId!) ?? undefined : undefined}
          onClose={() => setDrawer(null)}
          onUnwired={onUnwired}
          onSave={saveDrawerProduct}
        />
      )}
    </section>
  );
}
