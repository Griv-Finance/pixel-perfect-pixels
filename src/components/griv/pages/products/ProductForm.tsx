import { useState } from "react";
import { toast } from "sonner";
import { Field, FormDialog } from "@/components/griv/kit";
import { catalogStore, type Product, type Variant } from "@/lib/demo/catalog";
import { makeRef } from "@/lib/demo-store";
import { CATEGORIES } from "./ProductThumb";
export function ProductForm({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Product>(
    product
      ? structuredClone(product)
      : {
          id: makeRef("PRD"),
          name: "",
          description: "",
          category: "Fashion",
          type: "Physical",
          status: "Draft",
          channels: ["Online Store", "POS"],
          cost: 0,
          options: [],
          variants: [
            { sku: "", label: "Default", price: 0, available: 0, reserved: 0, reorderAt: 5 },
          ],
          createdAt: new Date().toISOString(),
        },
  );
  const [busy, setBusy] = useState(false);
  const update = (patch: Partial<Product>) => setDraft((p) => ({ ...p, ...patch }));
  const variant = (i: number, patch: Partial<Variant>) =>
    update({ variants: draft.variants.map((v, n) => (n === i ? { ...v, ...patch } : v)) });
  const used = catalogStore
    .get()
    .filter((p) => p.id !== draft.id)
    .flatMap((p) => p.variants.map((v) => v.sku.toLowerCase()));
  const skuError =
    draft.variants.some((v) => !v.sku.trim() || used.includes(v.sku.trim().toLowerCase())) ||
    new Set(draft.variants.map((v) => v.sku.trim().toLowerCase())).size !== draft.variants.length;
  const valid =
    !!draft.name.trim() &&
    !skuError &&
    draft.cost >= 0 &&
    Number.isFinite(draft.cost) &&
    draft.variants.every((v) => v.label.trim() && v.price > 0 && Number.isFinite(v.price));
  async function save() {
    if (!valid) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 700));
    const saved = {
      ...draft,
      name: draft.name.trim(),
      variants: draft.variants.map((v) => ({ ...v, sku: v.sku.trim() })),
    };
    catalogStore.set((ps) =>
      product ? ps.map((p) => (p.id === draft.id ? saved : p)) : [saved, ...ps],
    );
    toast.success("Product saved in sample catalog");
    onClose();
  }
  return (
    <FormDialog
      open
      onOpenChange={(o) => !o && !busy && onClose()}
      title={product ? "Edit product" : "Create product"}
      size="lg"
      description="Define your product. Add stock in Inventory."
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save} disabled={!valid || busy}>
            {busy ? "Saving…" : "Save product"}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <Field
          label="Product name"
          htmlFor="product-name"
          error={!draft.name.trim() ? "Enter a product name." : undefined}
        >
          <input
            id="product-name"
            className="field"
            value={draft.name}
            onChange={(e) => update({ name: e.target.value })}
          />
        </Field>
        <Field label="Description" htmlFor="product-description">
          <textarea
            id="product-description"
            className="field"
            value={draft.description}
            onChange={(e) => update({ description: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          {(["type", "category", "status"] as const).map((key) => (
            <Field
              key={key}
              label={key.charAt(0).toUpperCase() + key.slice(1)}
              htmlFor={`product-${key}`}
            >
              <select
                id={`product-${key}`}
                className="field"
                value={draft[key]}
                onChange={(e) => update({ [key]: e.target.value } as Partial<Product>)}
              >
                {(key === "type"
                  ? ["Physical", "Digital"]
                  : key === "category"
                    ? CATEGORIES
                    : ["Draft", "Published", "Archived"]
                ).map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </Field>
          ))}
          <Field
            label="Unit cost (₦)"
            htmlFor="product-cost"
            error={draft.cost < 0 ? "Cost cannot be negative." : undefined}
          >
            <input
              id="product-cost"
              type="number"
              min="0"
              className="field"
              value={draft.cost}
              onChange={(e) => update({ cost: Number(e.target.value) })}
            />
          </Field>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Sales channels</legend>
          <div className="flex gap-5">
            {(["Online Store", "POS"] as const).map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.channels.includes(c)}
                  onChange={(e) =>
                    update({
                      channels: e.target.checked
                        ? [...draft.channels, c]
                        : draft.channels.filter((x) => x !== c),
                    })
                  }
                />
                {c}
              </label>
            ))}
          </div>
        </fieldset>
        <Field
          label="Options"
          htmlFor="product-options"
          hint="Comma-separated attributes, e.g. Size, Colour. Enter combinations below."
        >
          <input
            id="product-options"
            className="field"
            value={draft.options.join(",")}
            onChange={(e) => update({ options: e.target.value.split(",").filter(Boolean) })}
          />
        </Field>
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">Variants</h3>
          <button
            className="btn btn-outline"
            onClick={() =>
              update({
                variants: [
                  ...draft.variants,
                  { sku: "", label: "", price: 0, available: 0, reserved: 0, reorderAt: 5 },
                ],
              })
            }
          >
            Add variant
          </button>
        </div>
        {skuError && (
          <p className="text-sm text-destructive" role="alert">
            Each variant needs a unique SKU across the catalog.
          </p>
        )}
        {draft.variants.map((v, i) => (
          <div key={i} className="rounded-xl border p-3 space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Variant" htmlFor={`variant-${i}`}>
                <input
                  id={`variant-${i}`}
                  className="field"
                  placeholder="Size M / Blue"
                  value={v.label}
                  onChange={(e) => variant(i, { label: e.target.value })}
                />
              </Field>
              <Field label="SKU" htmlFor={`sku-${i}`}>
                <input
                  id={`sku-${i}`}
                  className="field"
                  value={v.sku}
                  onChange={(e) => variant(i, { sku: e.target.value })}
                  readOnly={!!product?.variants.some((x) => x.sku === v.sku)}
                />
              </Field>
              <Field label="Price (₦)" htmlFor={`price-${i}`}>
                <input
                  id={`price-${i}`}
                  className="field"
                  type="number"
                  min="1"
                  value={v.price}
                  onChange={(e) => variant(i, { price: Number(e.target.value) })}
                />
              </Field>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{v.available} available · Add stock in Inventory</span>
              {draft.variants.length > 1 && !product?.variants.some((x) => x.sku === v.sku) && (
                <button
                  onClick={() => update({ variants: draft.variants.filter((_, n) => n !== i) })}
                >
                  Remove variant
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </FormDialog>
  );
}
