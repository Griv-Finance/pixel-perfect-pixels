import { useState } from "react";
import { ChevronDown, Package, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { Field, FormDialog } from "@/components/griv/kit";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { currencySymbol, formatMoney } from "@/lib/money";
import { invoiceTotals, type Invoice, type InvoiceItem } from "@/lib/demo/invoices";
import { catalogOptions, itemErrors, itemFromCatalog } from "@/lib/demo/invoice-builder";
import { addTaxRate, taxLabel, useTaxRates } from "@/lib/demo/tax-rates";
import { useCatalog } from "@/lib/demo/catalog";
import { EditorSection, FieldError, INPUT, LINK_BTN } from "./ui";

type Update = (fn: (r: Invoice) => Invoice) => void;
type Editing = { index: number | "new"; draft: InvoiceItem; tried: boolean };
const emptyItem = (): InvoiceItem => ({ name: "", qty: 1, price: 0 });

/** Items: search the catalogue or add a custom item; compact rows with edit/remove; totals with discount and tax. */
export function ItemsSection({ invoice: r, update, error, showErrors }: {
  invoice: Invoice; update: Update; error?: string | undefined; showErrors: boolean;
}) {
  useCatalog();
  const rates = useTaxRates();
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Editing | null>(null);
  const [taxDialog, setTaxDialog] = useState(false);
  const options = catalogOptions(r.currency);
  const t = invoiceTotals(r, rates);
  const c = r.currency;

  const setItems = (items: InvoiceItem[]) => update((v) => ({ ...v, items }));
  const commit = (addAnother: boolean) => {
    if (!editing) return;
    if (Object.keys(itemErrors(editing.draft)).length) return setEditing({ ...editing, tried: true });
    const items = editing.index === "new" ? [...r.items, editing.draft] : r.items.map((x, i) => (i === editing.index ? editing.draft : x));
    setItems(items);
    setEditing(addAnother ? { index: "new", draft: emptyItem(), tried: false } : null);
  };

  return (
    <EditorSection
      id="field-items"
      title="Items"
      description={options.length ? "Add products from your catalogue or one-off custom items." : "Add one-off custom items to this invoice."}
    >
      {/* Item rows */}
      {r.items.length > 0 && (
        <ul className="mb-3 divide-y rounded-lg border bg-card">
          {r.items.map((x, i) =>
            editing?.index === i ? (
              <li key={i} className="p-3">
                <ItemEditor editing={editing} onChange={setEditing} onSave={commit} onCancel={() => setEditing(null)} invoice={r} />
              </li>
            ) : (
              <ItemRow
                key={i}
                item={x}
                net={t.lines[i]?.net ?? 0}
                discount={t.lines[i]?.itemDiscount ?? 0}
                invoice={r}
                invalid={showErrors && Object.keys(itemErrors(x)).length > 0}
                onEdit={() => setEditing({ index: i, draft: { ...x }, tried: showErrors })}
                onRemove={() => setItems(r.items.filter((_, j) => j !== i))}
              />
            ),
          )}
        </ul>
      )}

      {editing?.index === "new" ? (
        <div className="mb-3 rounded-lg border bg-card p-3">
          <ItemEditor editing={editing} onChange={setEditing} onSave={commit} onCancel={() => setEditing(null)} invoice={r} isNew />
        </div>
      ) : (
        <div className={cn("flex flex-wrap items-center gap-3", r.items.length === 0 && "rounded-lg border border-dashed p-4")}>
          {r.items.length === 0 && (
            <p className="w-full text-sm text-muted-foreground">
              No items yet. {options.length ? "Search your products or add a custom item." : "Add a custom item to get started."}
            </p>
          )}
          {options.length > 0 && (
            <Popover open={search} onOpenChange={(o) => { setSearch(o); if (!o) setQuery(""); }}>
              <PopoverTrigger asChild>
                <button className={cn(INPUT, "flex max-w-72 items-center gap-2 text-left text-muted-foreground")}>
                  <Search className="h-4 w-4" />
                  Find a product…
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-80 p-0">
                <Command>
                  <CommandInput placeholder="Search products" value={query} onValueChange={setQuery} />
                  <CommandList>
                    <CommandEmpty>
                      <button
                        className="w-full px-3 text-left text-sm text-primary hover:underline"
                        onClick={() => {
                          setSearch(false);
                          setEditing({ index: "new", draft: { ...emptyItem(), name: query }, tried: false });
                          setQuery("");
                        }}
                      >
                        Add “{query}” as a custom item
                      </button>
                    </CommandEmpty>
                    <CommandGroup heading="Products">
                      {options.map((o) => (
                        <CommandItem
                          key={o.key}
                          value={`${o.name} ${o.sku}`}
                          onSelect={() => {
                            setItems([...r.items, itemFromCatalog(o)]);
                            setSearch(false);
                            setQuery("");
                          }}
                        >
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="min-w-0 flex-1 truncate">{o.name}</span>
                          <span className="text-xs text-muted-foreground tnum">{formatMoney(o.price, "NGN")}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
          <button className={LINK_BTN} onClick={() => setEditing({ index: "new", draft: emptyItem(), tried: false })}>
            <Plus className="h-4 w-4" />
            Add custom item
          </button>
        </div>
      )}
      {r.currency !== "NGN" && (
        <p className="mt-2 text-xs text-muted-foreground">Catalogue prices are in NGN, so products aren't offered on {r.currency} invoices — Griv never converts prices.</p>
      )}
      <FieldError>{error}</FieldError>

      {/* Totals: subtotal, discount, taxes, total */}
      {r.items.length > 0 && (
        <dl className="ml-auto mt-5 max-w-sm space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="tnum">{formatMoney(t.subtotal, c)}</dd>
          </div>
          <DiscountRow invoice={r} update={update} amount={t.discount} />
          {(r.taxRateIds ?? []).map((id) => {
            const rate = rates.find((x) => x.id === id);
            const line = t.taxes.find((x) => x.id === id);
            if (!rate) return null;
            return (
              <div key={id} className="flex items-center justify-between gap-2">
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  {taxLabel(rate)}
                  <button
                    aria-label={`Remove ${taxLabel(rate)}`}
                    className="rounded text-muted-foreground hover:text-destructive"
                    onClick={() => update((v) => ({ ...v, taxRateIds: (v.taxRateIds ?? []).filter((x) => x !== id) }))}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </dt>
                <dd className="tnum">{formatMoney(line?.amount ?? 0, c)}</dd>
              </div>
            );
          })}
          {/* Line-only taxes (set on an individual item) */}
          {t.taxes.filter((x) => !(r.taxRateIds ?? []).includes(x.id)).map((x) => (
            <div key={x.id} className="flex justify-between">
              <dt className="text-muted-foreground">{taxLabel(x)} <span className="text-xs">(some items)</span></dt>
              <dd className="tnum">{formatMoney(x.amount, c)}</dd>
            </div>
          ))}
          <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={LINK_BTN}>
                <Plus className="h-4 w-4" /> Add tax
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60">
              {rates.filter((x) => !(r.taxRateIds ?? []).includes(x.id)).map((x) => (
                <DropdownMenuItem key={x.id} onClick={() => update((v) => ({ ...v, taxRateIds: [...(v.taxRateIds ?? []), x.id] }))}>
                  {taxLabel(x)}
                  <span className="ml-auto text-xs text-muted-foreground">{x.inclusive ? "Inclusive" : "Exclusive"}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTaxDialog(true)}>Create a tax rate…</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
          <div className="flex justify-between border-t pt-2 text-base font-semibold">
            <dt>Amount due</dt>
            <dd className="tnum">{formatMoney(t.total, c)}</dd>
          </div>
        </dl>
      )}

      {taxDialog && (
        <TaxRateDialog
          onClose={() => setTaxDialog(false)}
          onSave={(rate) => {
            update((v) => ({ ...v, taxRateIds: [...(v.taxRateIds ?? []), rate.id] }));
            setTaxDialog(false);
          }}
        />
      )}
    </EditorSection>
  );
}

function ItemRow({ item: x, net, discount, invoice: r, invalid, onEdit, onRemove }: {
  item: InvoiceItem; net: number; discount: number; invoice: Invoice; invalid: boolean; onEdit: () => void; onRemove: () => void;
}) {
  return (
    <li className={cn("flex items-start gap-3 px-3 py-2.5", invalid && "bg-destructive/5")}>
      <div className="min-w-0 flex-1 text-sm">
        <p className="truncate font-medium">{x.name || "Untitled item"}</p>
        <p className="text-xs text-muted-foreground tnum">
          {x.qty} × {formatMoney(x.price, r.currency)}
          {discount > 0 && ` · −${formatMoney(discount, r.currency)} discount`}
          {x.taxRateIds && x.taxRateIds.length === 0 && " · No tax"}
        </p>
        {invalid && <p className="text-xs font-medium text-destructive">This item needs a name, quantity and price.</p>}
      </div>
      <span className="pt-0.5 text-sm font-medium tnum">{formatMoney(net, r.currency)}</span>
      <button onClick={onEdit} aria-label={`Edit ${x.name || "item"}`} className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button onClick={onRemove} aria-label={`Remove ${x.name || "item"}`} className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

/** Inline item editor; errors appear only after the merchant tries to save. */
function ItemEditor({ editing, onChange, onSave, onCancel, invoice: r, isNew }: {
  editing: Editing; onChange: (e: Editing) => void; onSave: (addAnother: boolean) => void; onCancel: () => void; invoice: Invoice; isNew?: boolean;
}) {
  const rates = useTaxRates();
  const d = editing.draft;
  const [more, setMore] = useState(!!(d.description || d.discount || d.taxRateIds));
  const set = (p: Partial<InvoiceItem>) => onChange({ ...editing, draft: { ...d, ...p } });
  const e = editing.tried ? itemErrors(d) : {};
  const amount = invoiceTotals({ items: [d], discount: 0, taxRateIds: [] }).subtotal;
  const taxValue = d.taxRateIds === undefined ? "" : d.taxRateIds.length === 0 ? "none" : d.taxRateIds[0]!;
  return (
    <div
      className="space-y-3"
      onKeyDown={(ev) => {
        if (ev.key === "Enter" && (ev.metaKey || ev.ctrlKey)) onSave(false);
        if (ev.key === "Escape") onCancel();
      }}
    >
      <div className="flex items-center justify-between text-sm">
        <p className="font-semibold">{isNew ? "New item" : "Edit item"}</p>
        <p className="text-muted-foreground tnum">
          {formatMoney(d.price || 0, r.currency)} × {d.qty || 0} = {formatMoney(amount, r.currency)}
        </p>
      </div>
      <Field label="Item" htmlFor="item-name" error={e.name}>
        <input id="item-name" autoFocus className={INPUT} value={d.name} onChange={(ev) => set({ name: ev.target.value })} placeholder="e.g. Website maintenance — October" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Quantity" htmlFor="item-qty" error={e.qty}>
          <input id="item-qty" type="number" min="1" step="1" className={INPUT} value={d.qty} onChange={(ev) => set({ qty: Number(ev.target.value) })} />
        </Field>
        <Field label="Unit price" htmlFor="item-price" error={e.price}>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{currencySymbol(r.currency)}</span>
            <input id="item-price" type="number" min="0" step="0.01" className={cn(INPUT, "pl-10")} value={d.price || ""} placeholder="0.00" onChange={(ev) => set({ price: Number(ev.target.value) })} />
          </div>
        </Field>
      </div>
      <button className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground" onClick={() => setMore((m) => !m)} aria-expanded={more}>
        Item options
        <ChevronDown className={cn("h-4 w-4 transition-transform", more && "rotate-180")} />
      </button>
      {more && (
        <div className="space-y-3">
          <Field label="Description" htmlFor="item-desc" optional>
            <textarea id="item-desc" className="field min-h-16 w-full text-sm" value={d.description ?? ""} onChange={(ev) => set({ description: ev.target.value || undefined })} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Tax" htmlFor="item-tax">
              <select
                id="item-tax"
                className={INPUT}
                value={taxValue}
                onChange={(ev) => set({ taxRateIds: ev.target.value === "" ? undefined : ev.target.value === "none" ? [] : [ev.target.value] })}
              >
                <option value="">Same as invoice</option>
                <option value="none">No tax on this item</option>
                {rates.map((x) => <option key={x.id} value={x.id}>{taxLabel(x)}</option>)}
              </select>
            </Field>
            <Field label="Discount" htmlFor="item-discount" optional error={e.discount}>
              <div className="flex gap-2">
                <select
                  aria-label="Discount type"
                  className={cn(INPUT, "w-20")}
                  value={d.discount?.type ?? "fixed"}
                  onChange={(ev) => set({ discount: { type: ev.target.value as "fixed" | "percent", value: d.discount?.value ?? 0 } })}
                >
                  <option value="fixed">{currencySymbol(r.currency)}</option>
                  <option value="percent">%</option>
                </select>
                <input
                  id="item-discount"
                  type="number"
                  min="0"
                  className={INPUT}
                  value={d.discount?.value || ""}
                  placeholder="0"
                  onChange={(ev) => {
                    const value = Number(ev.target.value);
                    set({ discount: value ? { type: d.discount?.type ?? "fixed", value } : undefined });
                  }}
                />
              </div>
            </Field>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-3">
        <button className="btn btn-ghost h-8 px-3 text-sm" onClick={onCancel}>Cancel</button>
        {isNew && <button className="btn btn-outline h-8 px-3 text-sm" onClick={() => onSave(true)}>Save and add another</button>}
        <button className="btn btn-primary h-8 px-3 text-sm" onClick={() => onSave(false)}>Save item</button>
      </div>
    </div>
  );
}

function DiscountRow({ invoice: r, update, amount }: { invoice: Invoice; update: Update; amount: number }) {
  const [open, setOpen] = useState(r.discount > 0);
  const t = invoiceTotals(r);
  const err =
    r.discount < 0
      ? "Discount can't be negative."
      : r.discountType === "percent" && r.discount > 100
        ? "Use a percentage between 0 and 100."
        : r.discountType !== "percent" && r.discount > t.subtotal
          ? "Discount can't be more than the subtotal."
          : "";
  if (!open)
    return (
      <div>
        <button className={LINK_BTN} onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add discount
        </button>
      </div>
    );
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <dt className="flex items-center gap-2 text-muted-foreground">
          Discount
          <select
            aria-label="Discount type"
            className="field h-7 w-16 px-2 text-xs"
            value={r.discountType ?? "fixed"}
            onChange={(e) => update((v) => ({ ...v, discountType: e.target.value as "fixed" | "percent" }))}
          >
            <option value="fixed">{currencySymbol(r.currency)}</option>
            <option value="percent">%</option>
          </select>
          <input
            aria-label="Discount value"
            type="number"
            min="0"
            className="field h-7 w-24 px-2 text-xs"
            value={r.discount || ""}
            placeholder="0"
            onChange={(e) => update((v) => ({ ...v, discount: Number(e.target.value) }))}
          />
          <button
            aria-label="Remove discount"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => {
              update((v) => ({ ...v, discount: 0 }));
              setOpen(false);
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </dt>
        <dd className="tnum">−{formatMoney(amount, r.currency)}</dd>
      </div>
      <FieldError>{err}</FieldError>
    </div>
  );
}

function TaxRateDialog({ onClose, onSave }: { onClose: () => void; onSave: (rate: ReturnType<typeof addTaxRate>) => void }) {
  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [inclusive, setInclusive] = useState(false);
  const [tried, setTried] = useState(false);
  const errors = {
    name: !name.trim() ? "Give the tax a name, e.g. VAT." : "",
    rate: !(Number(rate) > 0 && Number(rate) <= 100) ? "Enter a rate between 0 and 100." : "",
  };
  return (
    <FormDialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="Create a tax rate"
      description="Saved to your tax settings so you can reuse it on other invoices."
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setTried(true);
              if (errors.name || errors.rate) return;
              onSave(addTaxRate({ name: name.trim(), rate: Number(rate), inclusive }));
            }}
          >
            Add tax rate
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name" htmlFor="tax-name" error={tried ? errors.name : ""}>
            <input id="tax-name" autoFocus className={INPUT} value={name} onChange={(e) => setName(e.target.value)} placeholder="VAT" />
          </Field>
          <Field label="Rate (%)" htmlFor="tax-rate" error={tried ? errors.rate : ""}>
            <input id="tax-rate" type="number" min="0" max="100" step="0.01" className={INPUT} value={rate} onChange={(e) => setRate(e.target.value)} placeholder="7.5" />
          </Field>
        </div>
        <fieldset className="space-y-2 text-sm">
          <legend className="mb-1 font-medium">Pricing</legend>
          <label className="flex items-start gap-2">
            <input type="radio" className="mt-0.5 accent-primary" checked={!inclusive} onChange={() => setInclusive(false)} />
            <span>Exclusive<span className="block text-xs text-muted-foreground">Added on top of item prices.</span></span>
          </label>
          <label className="flex items-start gap-2">
            <input type="radio" className="mt-0.5 accent-primary" checked={inclusive} onChange={() => setInclusive(true)} />
            <span>Inclusive<span className="block text-xs text-muted-foreground">Already included in item prices; shown for information.</span></span>
          </label>
        </fieldset>
      </div>
    </FormDialog>
  );
}
