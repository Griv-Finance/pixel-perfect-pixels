import { useState } from "react";
import { MapPin, Upload, AlertTriangle } from "lucide-react";
import {
  DashboardPage,
  MetricCard,
  MetricGrid,
  Toolbar,
  SearchInput,
  FilterSelect,
  ClearFilters,
  ExportButton,
  DataTable,
  StatusBadge,
  DetailDrawer,
  EmptyState,
  useDemoLoading,
  Field,
} from "@/components/griv/kit";
import { useCatalog, stockStatus, catalogStore } from "@/lib/demo/catalog";
import { movementStore } from "@/lib/demo/inventory";
import { formatMoney } from "@/lib/money";
import { fmtDateTime } from "@/lib/dates";
import { exportCsv } from "@/lib/csv";
import { ProductThumb, CATEGORIES } from "../products/ProductThumb";
import { StockDialog, ImportDialog } from "./StockDialogs";
export function InventoryPage() {
  const products = useCatalog(),
    movements = movementStore.use(),
    loading = useDemoLoading();
  const [search, S] = useState(""),
    [status, T] = useState("All"),
    [category, C] = useState("All"),
    [sku, D] = useState<string | null>(null),
    [adjust, A] = useState<string | null>(null),
    [importing, I] = useState(false);
  const all = products
      .filter((p) => p.type === "Physical")
      .flatMap((product) => product.variants.map((variant) => ({ product, variant }))),
    low = all.filter((r) => stockStatus(r.product, r.variant) === "Low stock"),
    out = all.filter((r) => r.variant.available === 0);
  const rows = all.filter(
    (r) =>
      `${r.product.name} ${r.variant.sku} ${r.variant.label}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (status === "All" || stockStatus(r.product, r.variant) === status) &&
      (category === "All" || r.product.category === category),
  );
  const selected = all.find((r) => r.variant.sku === sku),
    adjusted = all.find((r) => r.variant.sku === adjust),
    clear = () => {
      S("");
      T("All");
      C("All");
    };
  const columns = [
    { key: "time", header: "Time", cell: (m: (typeof movements)[number]) => fmtDateTime(m.time) },
    {
      key: "sku",
      header: "SKU / Type",
      cell: (m: (typeof movements)[number]) => (
        <div className="font-medium">
          {m.sku}
          <p className="text-xs text-muted-foreground">{m.type}</p>
        </div>
      ),
    },
    {
      key: "delta",
      header: "Change",
      cell: (m: (typeof movements)[number]) => (
        <span className={m.delta > 0 ? "text-success" : "text-destructive"}>
          {m.delta > 0 ? "+" : ""}
          {m.delta}
          <span className="ml-2 text-muted-foreground">
            {m.before} → {m.after}
          </span>
        </span>
      ),
    },
    {
      key: "reason",
      header: "Reason / Notes",
      hideBelow: "md" as const,
      cell: (m: (typeof movements)[number]) => (
        <div>
          {m.reason}
          <p className="text-xs text-muted-foreground">{m.notes}</p>
        </div>
      ),
    },
    {
      key: "user",
      header: "By",
      hideBelow: "lg" as const,
      cell: (m: (typeof movements)[number]) => m.user,
    },
  ];
  return (
    <DashboardPage
      title="Inventory"
      crumbs={[{ label: "Sell" }, { label: "Inventory" }]}
      description="Stock clarity, down to the last SKU."
      actions={
        <>
          <ExportButton
            onClick={() =>
              exportCsv(
                "lekki-stock",
                rows.map(({ product: p, variant: v }) => ({
                  sku: v.sku,
                  product: p.name,
                  variant: v.label,
                  available: v.available,
                  reserved: v.reserved,
                  reorder_threshold: v.reorderAt,
                  location: "Lekki shop",
                })),
              )
            }
          />
          <button className="btn btn-primary" onClick={() => I(true)}>
            <Upload className="h-4 w-4" />
            Import counts
          </button>
        </>
      }
    >
      <MetricGrid>
        <MetricCard label="Tracked SKUs" value={all.length} dark sub="Physical product variants" />
        <MetricCard
          label="Low stock"
          value={low.length}
          sub="At or below reorder threshold"
          tone="pending"
        />
        <MetricCard
          label="Out of stock"
          value={out.length}
          sub="Replenishment needed"
          tone="danger"
        />
        <MetricCard
          label="Inventory value"
          value={formatMoney(
            all.reduce((s, r) => s + r.variant.available * r.product.cost, 0),
            "NGN",
          )}
          sub="Available stock × unit cost · NGN"
        />
      </MetricGrid>
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-input bg-highlight/40 p-4">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <div className="flex-1">
          <h2 className="font-semibold">{low.length + out.length} SKUs need attention</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {[...out, ...low]
              .slice(0, 3)
              .map((r) => `${r.product.name} (${r.variant.available})`)
              .join(" · ")}
          </p>
          <button className="mt-2 text-sm font-semibold underline" onClick={() => T("Low stock")}>
            Review low stock
          </button>
        </div>
        <span className="hidden sm:flex items-center gap-1 text-sm">
          <MapPin className="h-4 w-4" />
          Lekki shop
        </span>
      </div>
      <section className="panel overflow-hidden">
        <Toolbar>
          <SearchInput value={search} onChange={S} placeholder="Search product, SKU or variant…" />
          <FilterSelect
            label="Stock"
            value={status}
            onChange={T}
            options={["All", "In stock", "Low stock", "Out of stock"]}
          />
          <FilterSelect
            label="Category"
            value={category}
            onChange={C}
            options={["All", ...CATEGORIES]}
          />
          <ClearFilters show={!!search || status !== "All" || category !== "All"} onClear={clear} />
        </Toolbar>
        <DataTable
          rows={rows}
          rowKey={(r) => r.variant.sku}
          loading={loading}
          onRowClick={(r) => D(r.variant.sku)}
          empty={
            <EmptyState
              title="No matching stock"
              action={
                <button className="btn btn-outline" onClick={clear}>
                  Clear filters
                </button>
              }
            />
          }
          columns={[
            {
              key: "product",
              header: "Product / SKU",
              sort: (r) => r.product.name,
              cell: (r) => (
                <div className="flex gap-3 items-center">
                  <ProductThumb product={r.product} />
                  <div className="font-medium">
                    {r.product.name}
                    <p className="text-xs text-muted-foreground">{r.variant.sku}</p>
                  </div>
                </div>
              ),
            },
            { key: "variant", header: "Variant", hideBelow: "md", cell: (r) => r.variant.label },
            {
              key: "available",
              header: "Available",
              sort: (r) => r.variant.available,
              cell: (r) => <span className="tnum font-semibold">{r.variant.available}</span>,
            },
            {
              key: "reserved",
              header: "Reserved",
              hideBelow: "sm",
              cell: (r) => r.variant.reserved,
            },
            {
              key: "threshold",
              header: "Reorder at",
              hideBelow: "lg",
              cell: (r) => r.variant.reorderAt,
            },
            {
              key: "status",
              header: "Status",
              cell: (r) => <StatusBadge status={stockStatus(r.product, r.variant)} />,
            },
          ]}
          rowActions={(r) => (
            <button
              className="btn btn-outline text-xs"
              onClick={(e) => {
                e.stopPropagation();
                A(r.variant.sku);
              }}
            >
              Adjust
            </button>
          )}
        />
      </section>
      <section className="panel overflow-hidden mt-6">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold">Movement history</h2>
          <p className="text-sm text-muted-foreground">Every change, accounted for · Lekki shop</p>
        </div>
        <DataTable
          rows={movements}
          rowKey={(m) => m.id}
          columns={columns}
          onRowClick={(m) => D(m.sku)}
        />
      </section>
      <DetailDrawer
        open={!!selected}
        onOpenChange={(o) => !o && D(null)}
        title={selected?.product.name ?? "Stock audit"}
        subtitle={`${sku ?? ""} · Lekki shop`}
        wide
        footer={
          <button
            className="btn btn-primary"
            onClick={() => {
              A(sku);
              D(null);
            }}
          >
            Adjust stock
          </button>
        }
      >
        {selected && (
          <>
            <ProductThumb product={selected.product} large />
            <div className="grid grid-cols-3 gap-3">
              {[
                ["Available", selected.variant.available],
                ["Reserved", selected.variant.reserved],
                ["Unit cost", formatMoney(selected.product.cost, "NGN")],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">{k}</p>
                  <p className="font-semibold">{v}</p>
                </div>
              ))}
            </div>
            <Field
              label="Reorder threshold"
              htmlFor="audit-threshold"
              hint="Updates immediately in the sample catalog."
            >
              <input
                id="audit-threshold"
                className="field"
                type="number"
                min="0"
                value={selected.variant.reorderAt}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isSafeInteger(n) && n >= 0)
                    catalogStore.set((ps) =>
                      ps.map((p) => ({
                        ...p,
                        variants: p.variants.map((v) =>
                          v.sku === sku ? { ...v, reorderAt: n } : v,
                        ),
                      })),
                    );
                }}
              />
            </Field>
            <h3 className="font-semibold">Per-SKU audit trail</h3>
            <DataTable
              rows={movements.filter((m) => m.sku === sku)}
              rowKey={(m) => m.id}
              columns={columns.filter((c) => c.key !== "sku")}
            />
          </>
        )}
      </DetailDrawer>
      {adjusted && <StockDialog item={adjusted} onClose={() => A(null)} />}{" "}
      {importing && <ImportDialog onClose={() => I(false)} />}
    </DashboardPage>
  );
}
