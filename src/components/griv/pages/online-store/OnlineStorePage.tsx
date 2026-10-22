import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Globe, Palette, Truck, CreditCard, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import {
  DashboardPage,
  MetricGrid,
  MetricCard,
  StatusBadge,
  CopyButton,
  Field,
  SectionTitle,
  ConfirmDialog,
  CardsSkeleton,
  useDemoLoading,
} from "@/components/griv/kit";
import { useCatalog } from "@/lib/demo/catalog";
import { storeSettings, storeLive, type StoreSettings } from "@/lib/demo/online-store";
import { useOrders, totals } from "@/lib/demo/orders";
import { inRange } from "@/lib/dates";
import { formatMoneyCompact } from "@/lib/money";
import { StorePreview, accentClasses } from "./StorePreview";
export function OnlineStorePage() {
  const saved = storeSettings.use(),
    live = storeLive.use(),
    catalog = useCatalog(),
    orders = useOrders();
  const [form, setForm] = useState<StoreSettings>(saved),
    [preview, setPreview] = useState(false),
    [confirm, setConfirm] = useState(false),
    [saving, setSaving] = useState(false);
  const loading = useDemoLoading();
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const set = <K extends keyof StoreSettings>(k: K, v: StoreSettings[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const published = catalog.filter(
    (p) => p.status === "Published" && p.channels.includes("Online Store"),
  );
  const recent = orders.filter(
    (o) => o.channel === "Online Store" && inRange(o.date, "Last 30 days"),
  );
  const errors: Partial<
    Record<
      | "name"
      | "mark"
      | "tagline"
      | "about"
      | "email"
      | "phone"
      | "whatsapp"
      | "lagos"
      | "nationwide"
      | "freeAbove"
      | "checkout",
      string
    >
  > = {};
  if (!form.name.trim()) errors.name = "Enter a store name.";
  if (!form.mark.trim() || form.mark.length > 3) errors.mark = "Use 1–3 letters or a mark.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Enter a valid contact email.";
  for (const k of ["phone", "whatsapp"] as const)
    if (!/^\+?[\d\s()-]{7,20}$/.test(form[k])) errors[k] = "Enter a valid phone number.";
  for (const k of ["lagos", "nationwide", "freeAbove"] as const)
    if (!Number.isFinite(form[k]) || form[k] < 0) errors[k] = "Enter a valid non-negative amount.";
  if (!form.card && !form.transfer) errors.checkout = "Enable at least one payment method.";
  const text = (
    key: "name" | "mark" | "tagline" | "about" | "email" | "phone" | "whatsapp",
    label: string,
  ) => (
    <Field label={label} htmlFor={`store-${key}`} {...(errors[key] ? { error: errors[key] } : {})}>
      <input
        id={`store-${key}`}
        className="field"
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
      />
    </Field>
  );
  const toggle = (key: "showOut" | "pickup" | "card" | "transfer" | "guest", label: string) => (
    <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
      <span>{label}</span>
      <input
        type="checkbox"
        className="h-4 w-4 accent-primary"
        checked={form[key]}
        onChange={(e) => set(key, e.target.checked)}
      />
    </label>
  );
  return (
    <DashboardPage
      title="Online Store"
      description="Your brand, your storefront. Make it feel like you."
      actions={
        <>
          <button className="btn btn-outline" onClick={() => setPreview(true)}>
            Preview store <ArrowUpRight className="h-4 w-4" />
          </button>
          <button
            className="btn btn-primary"
            disabled={!dirty || saving || Object.keys(errors).length > 0}
            onClick={async () => {
              setSaving(true);
              await new Promise((r) => setTimeout(r, 700));
              storeSettings.set(form);
              setSaving(false);
              toast.success("Store settings saved in this demo");
            }}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </>
      }
    >
      {loading ? (
        <CardsSkeleton />
      ) : (
        <MetricGrid>
          <MetricCard
            label="Published products"
            value={published.length}
            sub="Available on your storefront"
            icon={ShoppingBag}
          />
          <MetricCard
            label="Store visits"
            value="2,846"
            sub="Last 30 days · sample analytics"
            icon={Globe}
          />
          <MetricCard label="Orders" value={recent.length} sub="Online Store · last 30 days" />
          <MetricCard
            label="Sales · NGN"
            value={formatMoneyCompact(
              recent.filter((o) => o.payment === "Paid").reduce((n, o) => n + totals(o).total, 0),
            )}
            sub="Paid orders · last 30 days"
            dark
          />
        </MetricGrid>
      )}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-5">
        <div className="flex items-center gap-4">
          <div
            className={`grid h-14 w-14 place-items-center rounded-xl text-2xl font-semibold ${accentClasses[form.accent]}`}
          >
            {form.mark}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">{saved.name}</h2>
              <StatusBadge status={live ? "Live" : "Unpublished"} />
            </div>
            <div className="mt-1 flex flex-wrap gap-3 text-sm">
              <span className="text-muted-foreground">novaretail.griv.store</span>
              <CopyButton value="https://novaretail.griv.store" />
            </div>
          </div>
        </div>
        <button className="btn btn-outline" onClick={() => setConfirm(true)}>
          {live ? "Unpublish store" : "Publish store"}
        </button>
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className={`text-sm ${dirty ? "text-primary" : "text-muted-foreground"}`}>
          {dirty ? "● Unsaved changes" : "All changes saved · demo settings"}
        </p>
        <nav className="flex gap-4 text-sm font-medium text-primary">
          <Link to="/products">Products ↗</Link>
          <Link to="/orders">Orders ↗</Link>
          <Link to="/inventory">Inventory ↗</Link>
        </nav>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section className="panel space-y-5 p-5">
          <SectionTitle>
            <span className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Identity & appearance
            </span>
          </SectionTitle>
          <div className="grid gap-4 sm:grid-cols-[1fr_100px]">
            {text("name", "Store name")}
            {text("mark", "Logo mark")}
          </div>
          {text("tagline", "Tagline")}
          <Field label="Theme accent">
            <div className="flex flex-wrap gap-2">
              {(["primary", "blackwood", "peridot"] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => set("accent", a)}
                  aria-pressed={form.accent === a}
                  className={`rounded-lg border-2 px-4 py-2 text-sm ${accentClasses[a]} ${form.accent === a ? "ring-2 ring-ring ring-offset-2" : ""}`}
                >
                  {a === "primary" ? "Lava orange" : a === "blackwood" ? "Blackwood" : "Peridot"}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Product layout">
            <div className="flex gap-2">
              {(["grid", "list"] as const).map((l) => (
                <button
                  key={l}
                  className="choice flex-1 capitalize"
                  data-selected={form.layout === l}
                  onClick={() => set("layout", l)}
                >
                  {l}
                </button>
              ))}
            </div>
          </Field>
          {toggle("showOut", "Show out-of-stock products")}
          {text("about", "About your store")}
          {text("email", "Contact email")}
          <div className="grid gap-4 sm:grid-cols-2">
            {text("phone", "Contact phone")}
            {text("whatsapp", "WhatsApp")}
          </div>
        </section>
        <div className="space-y-6">
          <section className="panel p-5">
            <SectionTitle>Featured products</SectionTitle>
            <p className="mb-4 text-sm text-muted-foreground">
              Choose highlights from your published storefront catalog.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {published.map((p) => (
                <label key={p.id} className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                  <input
                    type="checkbox"
                    checked={form.featured.includes(p.id)}
                    onChange={(e) =>
                      set(
                        "featured",
                        e.target.checked
                          ? [...form.featured, p.id]
                          : form.featured.filter((id) => id !== p.id),
                      )
                    }
                  />
                  {p.name}
                </label>
              ))}
            </div>
            <h3 className="mb-3 mt-6 font-medium">Collections</h3>
            {form.collections.map((c, i) => (
              <div key={i} className="mb-3 grid gap-2 sm:grid-cols-2">
                <Field label={`Collection ${i + 1} name`}>
                  <input
                    aria-label={`Collection ${i + 1} name`}
                    className="field"
                    value={c.name}
                    onChange={(e) =>
                      set(
                        "collections",
                        form.collections.map((x, j) =>
                          j === i ? { ...x, name: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </Field>
                <Field label="Category">
                  <select
                    aria-label={`Collection ${i + 1} category`}
                    className="field"
                    value={c.category}
                    onChange={(e) =>
                      set(
                        "collections",
                        form.collections.map((x, j) =>
                          j === i ? { ...x, category: e.target.value } : x,
                        ),
                      )
                    }
                  >
                    {["Fashion", "Beauty", "Home", "Food & Drinks", "Accessories"].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </Field>
              </div>
            ))}
          </section>
          <section className="panel space-y-4 p-5">
            <SectionTitle>
              <span className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Shipping & delivery
              </span>
            </SectionTitle>
            {(["lagos", "nationwide", "freeAbove"] as const).map((k, i) => (
              <Field
                key={k}
                label={
                  [
                    "Lagos same-day delivery (NGN)",
                    "Nationwide delivery (NGN)",
                    "Free delivery above (NGN)",
                  ][i]!
                }
                {...(errors[k] ? { error: errors[k] } : {})}
              >
                <input
                  aria-label={k}
                  className="field"
                  type="number"
                  min="0"
                  value={form[k]}
                  onChange={(e) => set(k, e.target.value === "" ? NaN : Number(e.target.value))}
                />
              </Field>
            ))}
            {toggle("pickup", "Pickup at Lekki shop")}
            <p className="text-xs text-muted-foreground">
              12 Admiralty Way, Lekki Phase 1, Lagos · Mon–Sat, 9am–6pm
            </p>
          </section>
          <section className="panel space-y-3 p-5">
            <SectionTitle>
              <span className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Checkout settings
              </span>
            </SectionTitle>
            {toggle("card", "Accept card payments")}
            {toggle("transfer", "Accept bank transfers")}
            {errors.checkout && (
              <p role="alert" className="text-sm text-destructive">
                {errors.checkout}
              </p>
            )}
            {toggle("guest", "Allow guest checkout")}
          </section>
        </div>
      </div>
      <StorePreview settings={form} open={preview} onOpenChange={setPreview} />
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={live ? "Unpublish your store?" : "Publish your store?"}
        description="This changes the sample storefront status only. No public website is deployed."
        confirmLabel={live ? "Unpublish" : "Publish"}
        danger={live}
        onConfirm={() => {
          storeLive.set(!live);
          setConfirm(false);
          toast.success("Sample storefront status updated");
        }}
      />
    </DashboardPage>
  );
}
