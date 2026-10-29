import { useState } from "react";
import { Check, CreditCard, Monitor, Pencil, Smartphone } from "lucide-react";
import { LogoMark } from "@/components/griv/Logo";
import { cn } from "@/lib/utils";
import { formatMoney, type Currency } from "@/lib/money";
import { PAYMENT_METHODS_BY_CURRENCY } from "@/lib/demo/link-details";
import {
  INTERVAL_SUFFIX,
  ctaLabel,
  dueToday,
  product,
  recurringAmount,
  recurringItems,
  type BuilderConfig,
  type ConfigErrors,
  type RecurringInterval,
} from "@/lib/demo/link-builder";

type Props = {
  cfg: BuilderConfig;
  errors: ConfigErrors;
  device: "desktop" | "mobile";
  onDevice: (d: "desktop" | "mobile") => void;
  tab: "payment" | "after";
  live: boolean;
};

/** Right column: a realistic hosted-checkout preview that updates with every configuration change. */
export function CheckoutPreview({ cfg, errors, device, onDevice, tab, live }: Props) {
  const [afterView, setAfterView] = useState<"confirmation" | "invoice">("confirmation");
  return (
    <div className="w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold">Preview</p>
        <div className="flex rounded-lg border p-0.5" role="radiogroup" aria-label="Preview device">
          {(
            [
              ["desktop", Monitor],
              ["mobile", Smartphone],
            ] as const
          ).map(([value, Icon]) => (
            <button
              key={value}
              role="radio"
              aria-checked={device === value}
              aria-label={`${value} preview`}
              onClick={() => onDevice(value)}
              className={cn("grid h-7 w-8 place-items-center rounded-md", device === value ? "bg-accent text-primary" : "text-muted-foreground hover:text-foreground")}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      {tab === "after" && (
        <div className="mb-4 flex gap-4 text-sm">
          {(
            [
              ["confirmation", "Confirmation page"],
              ["invoice", "Post-payment invoice"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setAfterView(value)}
              className={cn("border-b-2 pb-1 font-medium", afterView === value ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {tab === "payment" ? <CheckoutCard cfg={cfg} device={device} live={live} /> : <AfterCard cfg={cfg} device={device} view={afterView} />}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        You can enable more payment methods and change how this page looks in your account settings.
      </p>
      {errors.items && cfg.linkType === "products" && (
        <p className="mt-3 rounded-lg border border-dashed border-destructive/50 bg-card px-4 py-2.5 text-center text-xs text-destructive">{errors.items}</p>
      )}
    </div>
  );
}

/* ---------- shared summary (left side of the checkout) ---------- */

function Summary({ cfg, live, compact }: { cfg: BuilderConfig; live: boolean; compact?: boolean }) {
  const [addedRecos, setAddedRecos] = useState<string[]>([]);
  const rec = recurringItems(cfg)[0];
  const suffix = rec ? INTERVAL_SUFFIX[rec.prod.interval as RecurringInterval] : null;
  const title =
    cfg.linkType === "flexible" ? cfg.flexible.title.trim() : product(cfg, cfg.items[0]?.productId ?? "")?.name || "Payment link";
  const description =
    cfg.linkType === "flexible" ? cfg.flexible.description.trim() : product(cfg, cfg.items[0]?.productId ?? "")?.description ?? "";

  return (
    <div>
      <div className="flex items-center gap-2">
        <LogoMark className="h-5 w-5" />
        <span className="text-sm font-semibold">Nova Retail</span>
        {!live && <span className="rounded bg-blackwood px-1.5 py-0.5 text-[10px] font-bold text-white">Test mode</span>}
      </div>
      <p className={cn("mt-3 font-semibold", compact ? "text-sm" : "text-base")}>{title || "Untitled payment"}</p>
      {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}

      {cfg.linkType === "products" ? (
        <div className="mt-4 space-y-3">
          {cfg.items.map((item) => {
            const p = product(cfg, item.productId);
            if (!p) return null;
            return (
              <div key={item.uid} className="flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Qty: {item.quantity}
                    {p.interval !== "One-off" && ` · Billed ${INTERVAL_SUFFIX[p.interval as RecurringInterval]}`}
                  </p>
                  {cfg.options.trialEnabled && p.interval !== "One-off" && (
                    <p className="text-xs text-muted-foreground">
                      {cfg.options.trialDuration} {cfg.options.trialUnit} free, then {formatMoney(p.amount, cfg.currency)} / {INTERVAL_SUFFIX[p.interval as RecurringInterval]} after
                    </p>
                  )}
                </div>
                <span className="shrink-0 tnum">{formatMoney(p.amount * item.quantity, cfg.currency)}</span>
              </div>
            );
          })}
          {cfg.recommendations.length > 0 && (
            <>
              <p className="pt-1 text-xs font-semibold text-muted-foreground">Add to your order</p>
              {cfg.recommendations.map((reco) => {
                const p = product(cfg, reco.productId);
                if (!p) return null;
                return (
                  <div key={reco.uid} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{pricePer(p, cfg.currency)}</p>
                    </div>
                    <AddOnButton
                      productId={p.id}
                      name={p.name}
                      added={addedRecos.includes(reco.uid)}
                      onToggle={() =>
                        setAddedRecos((v) => (v.includes(reco.uid) ? v.filter((x) => x !== reco.uid) : [...v, reco.uid]))
                      }
                    />
                  </div>
                );
              })}
            </>
          )}
          <Totals
            cfg={cfg}
            extra={cfg.recommendations
              .filter((r) => addedRecos.includes(r.uid))
              .reduce((s, r) => {
                const p = product(cfg, r.productId);
                return p && p.interval === "One-off" ? s + p.amount * r.quantity : s;
              }, 0)}
          />
        </div>
      ) : (
        <FlexAmount cfg={cfg} />
      )}
    </div>
  );
}

function pricePer(p: NonNullable<ReturnType<typeof product>>, currency: Currency) {
  return p.interval === "One-off" ? formatMoney(p.amount, currency) : `${formatMoney(p.amount, currency)} / ${INTERVAL_SUFFIX[p.interval as RecurringInterval]}`;
}

function AddOnButton({ productId, name, added, onToggle }: {
  productId: string; name: string; added: boolean; onToggle: () => void;
}) {
  return (
    <button
      className={cn("flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium", added ? "border-border text-muted-foreground" : "border-primary text-primary hover:bg-accent")}
      onClick={onToggle}
      aria-pressed={added}
      aria-label={`${added ? "Remove" : "Add"} ${name} ${added ? "from" : "to"} your order`}
    >
      {added ? <><Check className="h-3 w-3" /> Added</> : "Add"}
    </button>
  );
}

function Totals({ cfg, extra = 0 }: { cfg: BuilderConfig; extra?: number | undefined }) {
  const rec = recurringItems(cfg)[0];
  const suffix = rec ? INTERVAL_SUFFIX[rec.prod.interval as RecurringInterval] : null;
  const oneOff = dueToday(cfg) + extra;
  const recurringNow = rec && !cfg.options.trialEnabled ? recurringAmount(cfg) : 0;
  return (
    <div className="border-t pt-3">
      <div className="flex items-baseline justify-between gap-3 text-sm font-semibold">
        <span>Total due today</span>
        <span className="tnum">{formatMoney(oneOff + recurringNow, cfg.currency)}</span>
      </div>
      {rec && cfg.options.trialEnabled && (
        <p className="mt-1 text-xs text-muted-foreground">
          Then {formatMoney(recurringAmount(cfg), cfg.currency)} / {suffix} after your free trial
        </p>
      )}
    </div>
  );
}

function FlexAmount({ cfg }: { cfg: BuilderConfig }) {
  const [value, setValue] = useState<string>(() => (cfg.flexible.presetEnabled ? String(cfg.flexible.preset) : ""));
  const amount = Number(value) || 0;
  const outOfRange =
    cfg.flexible.limitsEnabled && amount > 0 && (amount < cfg.flexible.min || (cfg.flexible.max > 0 && amount > cfg.flexible.max));
  return (
    <div className="mt-4">
      <div className="flex max-w-48 items-center rounded-md border px-3 py-2">
        <span className="text-lg font-semibold">{formatMoney(amount, cfg.currency)}</span>
        <Pencil className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <input
        className="sr-only"
        aria-label="Payment amount"
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/[^0-9.]/g, ""))}
      />
      <div className="mt-3 border-t pt-3">
        <div className="flex items-baseline justify-between gap-3 text-sm font-semibold">
          <span>Total due today</span>
          <span className="tnum">{formatMoney(amount, cfg.currency)}</span>
        </div>
        {outOfRange && (
          <p className="mt-1 text-xs text-destructive">
            Enter an amount between {formatMoney(cfg.flexible.min, cfg.currency)} and {formatMoney(cfg.flexible.max, cfg.currency)}.
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------- checkout card ---------- */

function CheckoutCard({ cfg, device, live }: { cfg: BuilderConfig; device: "desktop" | "mobile"; live: boolean }) {
  const [method, setMethod] = useState("Card");
  const [email, setEmail] = useState("");
  const [promo, setPromo] = useState("");
  const [promoAdded, setPromoAdded] = useState(false);
  const [terms, setTerms] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const methods = PAYMENT_METHODS_BY_CURRENCY[cfg.currency] ?? ["Card"];
  const wide = device === "desktop";

  return (
    <div className={cn("mx-auto rounded-xl border bg-card shadow-sm", wide ? "max-w-3xl" : "max-w-sm")}>
      <div className={cn(wide ? "grid md:grid-cols-2 md:divide-x" : "")}>
        <div className="p-6">
          <Summary cfg={cfg} live={live} compact={!wide} />
        </div>
        <div className="p-6">
          <p className="text-sm font-semibold">Contact information</p>
          <input className="field mt-2 h-9 text-sm" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />

          {cfg.options.names !== "off" && (
            <div className="mt-3">
              <label className="text-xs font-medium text-muted-foreground">
                Name {!cfg.options.names.includes("optional") && <span aria-hidden>*</span>}
              </label>
              <input className="field mt-1 h-9 text-sm" aria-label="Name" />
            </div>
          )}
          {cfg.options.business !== "off" && (
            <div className="mt-3">
              <label className="text-xs font-medium text-muted-foreground">
                Business name {!cfg.options.business.includes("optional") && <span aria-hidden>*</span>}
              </label>
              <input className="field mt-1 h-9 text-sm" aria-label="Business name" />
            </div>
          )}
          {cfg.options.phone && (
            <div className="mt-3">
              <label className="text-xs font-medium text-muted-foreground">Phone number</label>
              <input className="field mt-1 h-9 text-sm" placeholder="0800 123 4567" aria-label="Phone number" />
            </div>
          )}
          {cfg.options.address !== "off" && (
            <div className="mt-3">
              <label className="text-xs font-medium text-muted-foreground">
                Billing address {!cfg.options.address.includes("shipping") && <span aria-hidden>*</span>}
              </label>
              <select className="field mt-1 h-9 text-sm" aria-label="Country">
                <option>Nigeria</option>
                <option>Ghana</option>
                <option>Kenya</option>
              </select>
              <input className="field mt-1.5 h-9 text-sm" placeholder="Address line 1" aria-label="Address line 1" />
              <input className="field mt-1.5 h-9 text-sm" placeholder="Address line 2 (Optional)" aria-label="Address line 2" />
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <input className="field h-9 text-sm" placeholder="City" aria-label="City" />
                <input className="field h-9 text-sm" placeholder="Postal code" aria-label="Postal code" />
              </div>
              <select className="field mt-1.5 h-9 text-sm" aria-label="State">
                <option>Lagos</option>
                <option>Abuja FCT</option>
                <option>Rivers</option>
              </select>
            </div>
          )}

          {cfg.advanced.fields.length > 0 && (
            <div className="mt-4 space-y-3">
              {cfg.advanced.fields.map((f) => (
                <div key={f.uid}>
                  <label className="text-xs font-medium text-muted-foreground">
                    {f.label || "Untitled field"} {f.required && <span aria-hidden>*</span>}
                  </label>
                  {f.type === "Dropdown" ? (
                    <select
                      className="field mt-1 h-9 text-sm"
                      aria-label={f.label}
                      value={values[f.uid] ?? f.default}
                      onChange={(e) => setValues((v) => ({ ...v, [f.uid]: e.target.value }))}
                    >
                      <option value="">Choose…</option>
                      {f.options.filter((o) => o.trim()).map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="field mt-1 h-9 text-sm"
                      type={f.type === "Numbers only" ? "number" : "text"}
                      aria-label={f.label}
                      value={values[f.uid] ?? f.default}
                      onChange={(e) => setValues((v) => ({ ...v, [f.uid]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <p className="mt-5 text-sm font-semibold">Payment method</p>
          <div className="mt-2 space-y-1.5">
            {methods.map((m) => (
              <label
                key={m}
                className={cn("flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 text-sm", method === m ? "border-primary ring-1 ring-primary" : "border-border")}
              >
                <input type="radio" name="pm" checked={method === m} onChange={() => setMethod(m)} />
                {m}
              </label>
            ))}
            {method === "Card" && (
              <div className="rounded-md border p-3">
                <input className="field h-9 text-sm" placeholder="Card number" aria-label="Card number" />
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input className="field h-9 text-sm" placeholder="MM / YY" aria-label="Expiry" />
                  <input className="field h-9 text-sm" placeholder="CVC" aria-label="CVC" />
                </div>
              </div>
            )}
          </div>

          {cfg.advanced.promoCodes &&
            (promoAdded ? (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-success-foreground" />
                <span className="font-medium">{promo || "PROMO10"}</span>
                <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setPromoAdded(false)}>
                  Remove
                </button>
              </div>
            ) : (
              <div className="mt-3 flex gap-2">
                <input
                  className="field h-9 flex-1 text-sm uppercase"
                  placeholder="Promotion code"
                  aria-label="Promotion code"
                  value={promo}
                  onChange={(e) => setPromo(e.target.value)}
                />
                <button className="btn btn-outline h-9 px-3 text-sm" onClick={() => setPromoAdded(true)} disabled={!promo.trim()}>
                  Apply
                </button>
              </div>
            ))}

          {cfg.advanced.taxIds && (
            <div className="mt-3">
              <label className="text-xs font-medium text-muted-foreground">Tax ID</label>
              <input className="field mt-1 h-9 text-sm" placeholder="Business tax ID" aria-label="Tax ID" />
            </div>
          )}

          {cfg.advanced.requireTerms && (
            <label className="mt-4 flex items-start gap-2 text-xs">
              <input type="checkbox" className="mt-0.5" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
              <span>I accept the Nova Retail Terms of Service</span>
            </label>
          )}

          <button className="btn btn-primary mt-5 w-full" disabled={cfg.advanced.requireTerms && !terms}>
            <CreditCard className="h-4 w-4" />
            {ctaLabel(cfg)}
          </button>
          <p className="mt-3 text-center text-[10px] text-muted-foreground">Powered by griv · Terms · Privacy</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- after-payment previews ---------- */

function AfterCard({ cfg, device, view }: { cfg: BuilderConfig; device: "desktop" | "mobile"; view: "confirmation" | "invoice" }) {
  const wide = device === "desktop";
  const message = cfg.afterPayment.customMessageEnabled && cfg.afterPayment.customMessage.trim()
    ? cfg.afterPayment.customMessage.trim()
    : cfg.linkType === "products" && recurringItems(cfg).length > 0
      ? "Thanks for subscribing!"
      : "Thank you for your purchase";
  return (
    <div className={cn("mx-auto rounded-xl border bg-card shadow-sm", wide ? "max-w-3xl" : "max-w-sm")}>
      <div className={cn(wide ? "grid md:grid-cols-2 md:divide-x" : "")}>
        <div className="p-6">
          <Summary cfg={cfg} live compact={!wide} />
        </div>
        <div className="p-6">
          {view === "confirmation" ? (
            <div className="flex flex-col items-center py-4 text-center">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-success text-success-foreground">
                <Check className="h-5 w-5" />
              </span>
              {cfg.afterPayment.customMessageEnabled && cfg.afterPayment.customMessage.trim() ? (
                <p className="mt-3 text-sm">{message}</p>
              ) : (
                <>
                  <p className="mt-3 text-sm font-semibold">{message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {cfg.linkType === "products" && recurringItems(cfg).length > 0
                      ? "After your trial, a payment of the amount shown will appear on your statement."
                      : "A payment confirmation is on its way to your email."}
                  </p>
                </>
              )}
              <div className="mt-5 w-full space-y-1 rounded-lg border p-3 text-left text-xs">
                <p className="font-semibold text-muted-foreground">Contact information</p>
                <p>customer@example.com</p>
                <p className="pt-2 font-semibold text-muted-foreground">Payment method</p>
                <p>Visa •••• 4242 — {formatMoney(cfg.linkType === "flexible" ? Number(cfg.flexible.preset) : dueToday(cfg), cfg.currency)}</p>
              </div>
              <button className="mt-4 text-xs font-medium text-primary hover:underline">View all</button>
            </div>
          ) : (
            <div className="py-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Invoice</p>
                <span className="rounded bg-success/20 px-2 py-0.5 text-[10px] font-bold text-success-foreground">Paid</span>
              </div>
              <p className="text-xs text-muted-foreground">INV-PL-0001 · Nova Retail Ltd.</p>
              <div className="mt-4 space-y-2 text-sm">
                {(cfg.linkType === "products"
                  ? cfg.items.map((i) => ({ label: product(cfg, i.productId)?.name ?? "Item", amount: (product(cfg, i.productId)?.amount ?? 0) * i.quantity }))
                  : [{ label: cfg.flexible.title || "Payment", amount: cfg.flexible.preset }]
                ).map((line) => (
                  <div key={line.label} className="flex justify-between gap-3">
                    <span className="min-w-0 truncate">{line.label}</span>
                    <span className="tnum">{formatMoney(line.amount, cfg.currency)}</span>
                  </div>
                ))}
                <div className="flex justify-between gap-3 border-t pt-2 font-semibold">
                  <span>Total</span>
                  <span className="tnum">{formatMoney(dueToday(cfg), cfg.currency)}</span>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">A PDF invoice is emailed to the customer after payment when this option is on.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
