/**
 * Data model behind the Create/Edit Payment Link workspace (Stripe-style two-column builder).
 * The full builder configuration is stored on the payment link (`PaymentLink.config`) so editing
 * never loses settings the legacy fields alone can't express (recommended products, custom fields,
 * after-payment settings…). Legacy pages keep deriving everything from the classic fields.
 */
import { createDemoStore } from "@/lib/demo-store";
import { formatMoney, type Currency } from "@/lib/money";
import type { PaymentLink } from "./payment-links";
import { catalogStore, type Product } from "./catalog";

export type BillingInterval = "One-off" | "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Yearly";
export type RecurringInterval = Exclude<BillingInterval, "One-off">;
export type TrialUnit = "days" | "weeks" | "months";

export type BuilderProduct = {
  id: string;
  name: string;
  description: string;
  image?: string | undefined;
  currency: Currency;
  interval: BillingInterval;
  amount: number;
  unitLabel: string;
  statementDescriptor: string;
  metadata: { key: string; value: string }[];
  features: string[];
  extraPrices: { id: string; interval: BillingInterval; amount: number }[];
  /** Catalog product this was copied from, when picked from Find or add a product. */
  fromCatalog?: string | undefined;
};

export type BuilderItem = {
  uid: string;
  productId: string;
  quantity: number;
  adjustable: boolean;
  minQty: number;
  maxQty: number;
};

export type BuilderRecommendation = { uid: string; productId: string; quantity: number; adjustable: boolean };

export type CustomField = {
  uid: string;
  type: "Text" | "Numbers only" | "Dropdown";
  label: string;
  required: boolean;
  default: string;
  limitEnabled: boolean;
  limitKind: "At least" | "At most";
  limitA: number;
  limitB: number;
  options: string[];
};

export type BuilderOptions = {
  collectTax: boolean;
  names: "off" | "required" | "optional";
  business: "off" | "required" | "optional";
  address: "off" | "billing" | "billing_shipping";
  phone: boolean;
  trialEnabled: boolean;
  trialDuration: number;
  trialUnit: TrialUnit;
  trialWithoutCard: boolean;
  limitPaymentsEnabled: boolean;
  limitPaymentsMax: number;
};

export type BuilderAdvanced = {
  fields: CustomField[];
  promoCodes: boolean;
  taxIds: boolean;
  savePaymentDetails: boolean;
  requireTerms: boolean;
  cta: string;
};

export type BuilderAfterPayment = {
  mode: "confirmation" | "redirect";
  customMessageEnabled: boolean;
  customMessage: string;
  redirectUrl: string;
  invoicePdf: boolean;
};

export type BuilderFlexible = {
  title: string;
  description: string;
  image?: string | undefined;
  category: string;
  taxIncluded: "yes" | "no";
  presetEnabled: boolean;
  preset: number;
  limitsEnabled: boolean;
  min: number;
  max: number;
};

export type BuilderConfig = {
  linkType: "products" | "flexible";
  currency: Currency;
  products: BuilderProduct[];
  items: BuilderItem[];
  recommendations: BuilderRecommendation[];
  options: BuilderOptions;
  advanced: BuilderAdvanced;
  afterPayment: BuilderAfterPayment;
  flexible: BuilderFlexible;
};

/* ---------- ids & factories ---------- */

let seq = 0;
export const uid = (prefix: string) => `${prefix}_${Date.now().toString(36)}${(seq++).toString(36)}`;

export const newProduct = (over: Partial<BuilderProduct> = {}): BuilderProduct => ({
  id: uid("prod"),
  name: "",
  description: "",
  currency: "NGN",
  interval: "One-off",
  amount: 0,
  unitLabel: "",
  statementDescriptor: "",
  metadata: [],
  features: [],
  extraPrices: [],
  ...over,
});

export const defaultConfig = (currency: Currency = "NGN"): BuilderConfig => ({
  linkType: "products",
  currency,
  products: [],
  items: [],
  recommendations: [],
  options: {
    collectTax: false,
    names: "off",
    business: "off",
    address: "off",
    phone: true,
    trialEnabled: false,
    trialDuration: 14,
    trialUnit: "days",
    trialWithoutCard: false,
    limitPaymentsEnabled: false,
    limitPaymentsMax: 100,
  },
  advanced: { fields: [], promoCodes: false, taxIds: false, savePaymentDetails: false, requireTerms: false, cta: "" },
  afterPayment: { mode: "confirmation", customMessageEnabled: false, customMessage: "", redirectUrl: "", invoicePdf: false },
  flexible: {
    title: "",
    description: "",
    category: "None",
    taxIncluded: "yes",
    presetEnabled: false,
    preset: 0,
    limitsEnabled: false,
    min: 0,
    max: 0,
  },
});

/** Copy a catalog product into the builder (uses its cheapest variant as the unit price). */
export function productFromCatalog(p: Product, currency: Currency = "NGN"): BuilderProduct {
  const price = Math.min(...p.variants.map((v) => v.price));
  return newProduct({
    name: p.name,
    description: p.description,
    currency,
    interval: "One-off",
    amount: price,
    fromCatalog: p.id,
  });
}

/* ---------- draft store: one saved draft per workspace (link id or "new") ---------- */

const drafts = createDemoStore<Record<string, BuilderConfig>>({});

export const getDraft = (key: string) => drafts.get()[key];
export const setDraft = (key: string, cfg: BuilderConfig) => drafts.set((all) => ({ ...all, [key]: cfg }));
export const clearDraft = (key: string) =>
  drafts.set((all) => {
    const next = { ...all };
    delete next[key];
    return next;
  });

/* ---------- interval helpers ---------- */

/** Suffix after the slash: "₦15,000 /week", "₦2,490 /3 months". */
export const INTERVAL_SUFFIX: Record<RecurringInterval, string> = {
  Daily: "day",
  Weekly: "week",
  Monthly: "month",
  Quarterly: "3 months",
  Yearly: "year",
};

export const intervalSuffix = (i: RecurringInterval) => INTERVAL_SUFFIX[i];

export const TRIAL_UNITS: { value: TrialUnit; label: string }[] = [
  { value: "days", label: "days" },
  { value: "weeks", label: "weeks" },
  { value: "months", label: "months" },
];

/** Trial length stored on the link, in days. */
export const trialInDays = (o: BuilderOptions) =>
  o.trialUnit === "weeks" ? Math.round(o.trialDuration * 7) : o.trialUnit === "months" ? Math.round(o.trialDuration * 30) : Math.round(o.trialDuration);

/* ---------- call to action ---------- */

export function ctaOptions(cfg: BuilderConfig): string[] {
  if (cfg.linkType === "flexible") return ["Pay", "Book", "Donate"];
  const recurring = cfg.items.some((it) => product(cfg, it.productId)?.interval !== "One-off");
  return recurring ? ["Subscribe", "Donate"] : ["Pay", "Book", "Donate"];
}

export const defaultCta = (cfg: BuilderConfig) =>
  cfg.linkType === "products" && cfg.items.some((it) => product(cfg, it.productId)?.interval !== "One-off") ? "Subscribe" : "Pay";

export const ctaLabel = (cfg: BuilderConfig) => cfg.advanced.cta || defaultCta(cfg);

/* ---------- lookups & totals (one currency per link — never summed across currencies) ---------- */

export const product = (cfg: BuilderConfig, id: string) => cfg.products.find((p) => p.id === id);

export const recurringItems = (cfg: BuilderConfig) =>
  [...cfg.items, ...cfg.recommendations]
    .map((line) => ({ line, prod: product(cfg, line.productId) }))
    .filter((x): x is { line: BuilderItem | BuilderRecommendation; prod: BuilderProduct } => !!x.prod && x.prod.interval !== "One-off");

/** "₦15,000 /week" for a product card. */
export const priceLabelFor = (p: BuilderProduct) =>
  p.interval === "One-off" ? formatMoney(p.amount, p.currency) : `${formatMoney(p.amount, p.currency)} / ${INTERVAL_SUFFIX[p.interval as RecurringInterval]}`;

/** Total due today in the link's currency (selected items only; recommendations count once added). */
export function dueToday(cfg: BuilderConfig, extraOneOff = 0) {
  return (
    cfg.items.reduce((sum, line) => {
      const p = product(cfg, line.productId);
      return p && p.interval === "One-off" ? sum + p.amount * line.quantity : sum;
    }, 0) + extraOneOff
  );
}

/** The recurring charge per interval, or 0 for one-time links. */
export function recurringAmount(cfg: BuilderConfig) {
  const first = recurringItems(cfg)[0];
  return first ? first.prod.amount * first.line.quantity : 0;
}

/* ---------- validation ---------- */

export type ConfigErrors = Partial<
  Record<"items" | "interval" | "limit" | "trial" | "flex.title" | "flex.preset" | "flex.limits" | "redirect" | "currency", string> &
    Record<`field.${string}.label` | `field.${string}.options`, string>
>;

export function validateConfig(cfg: BuilderConfig): ConfigErrors {
  const errors: ConfigErrors = {};
  if (cfg.linkType === "products") {
    if (cfg.items.length === 0) errors.items = "Select a product to continue.";
    const intervals = new Set(recurringItems(cfg).map((x) => x.prod.interval));
    if (intervals.size > 1) errors.interval = "The prices on all line items must have the same recurring interval.";
    if (cfg.options.trialEnabled && cfg.options.trialDuration < 1)
      errors.trial = "Enter a trial duration of at least 1.";
    if (cfg.options.limitPaymentsEnabled && cfg.items.some((it) => it.adjustable))
      errors.limit = "To limit the number of payments on this link, turn off letting customers adjust quantity.";
  } else {
    if (cfg.flexible.title.trim().length < 2) errors["flex.title"] = "Enter a title of at least 2 characters.";
    if (cfg.flexible.presetEnabled && !(cfg.flexible.preset > 0)) errors["flex.preset"] = "Enter an amount greater than zero.";
    if (cfg.flexible.limitsEnabled) {
      if (!(cfg.flexible.min > 0)) errors["flex.limits"] = "Set a positive minimum amount.";
      else if (cfg.flexible.max < cfg.flexible.min) errors["flex.limits"] = "The minimum can't be greater than the maximum.";
    }
    if (cfg.flexible.limitsEnabled && cfg.flexible.presetEnabled && cfg.flexible.preset > 0) {
      if (cfg.flexible.preset < cfg.flexible.min || cfg.flexible.preset > cfg.flexible.max)
        errors["flex.preset"] = "The preset amount must sit between the minimum and maximum.";
    }
  }
  for (const f of cfg.advanced.fields) {
    if (f.label.trim().length < 1) errors[`field.${f.uid}.label` as const] = "Enter a label.";
    if (f.type === "Dropdown" && f.options.filter((o) => o.trim()).length < 2)
      errors[`field.${f.uid}.options` as const] = "Add at least two options.";
  }
  if (cfg.afterPayment.mode === "redirect") {
    let ok = false;
    try {
      ok = new URL(cfg.afterPayment.redirectUrl).protocol === "https:";
    } catch {
      ok = false;
    }
    if (!ok) errors.redirect = "Enter a valid HTTPS URL.";
  }
  return errors;
}

export const configIsValid = (cfg: BuilderConfig) => Object.keys(validateConfig(cfg)).length === 0;

/* ---------- PaymentLink ⇄ BuilderConfig ---------- */

/** Rebuild the builder configuration for an existing link (lossless when it was saved with one). */
export function configFromLink(link: PaymentLink): BuilderConfig {
  if (link.config) return structuredClone(link.config);
  const cfg = defaultConfig(link.currency);
  if (link.model === "Customer enters amount") {
    cfg.linkType = "flexible";
    cfg.flexible.title = link.name;
    cfg.flexible.description = link.description;
    cfg.flexible.presetEnabled = link.amount > 0;
    cfg.flexible.preset = link.amount;
    cfg.flexible.limitsEnabled = true;
    cfg.flexible.min = link.min;
    cfg.flexible.max = link.max;
    return cfg;
  }
  const recurring = link.model !== "Fixed amount";
  const p = newProduct({
    name: link.name,
    description: link.description,
    currency: link.currency,
    interval: recurring ? (link.interval ?? "Monthly") : "One-off",
    amount: link.amount,
  });
  cfg.products = [p];
  cfg.items = [{ uid: uid("item"), productId: p.id, quantity: 1, adjustable: false, minQty: 0, maxQty: 99 }];
  if (link.model === "14 day trial then Monthly subscription") {
    cfg.options.trialEnabled = true;
    cfg.options.trialDuration = link.trialDays ?? 14;
    cfg.options.trialUnit = "days";
  }
  if (link.cta) cfg.advanced.cta = link.cta;
  if (link.redirect) {
    cfg.afterPayment.mode = "redirect";
    cfg.afterPayment.redirectUrl = link.redirect;
  }
  return cfg;
}

/** Map the builder configuration back onto the classic payment-link fields. */
export function configToLink(cfg: BuilderConfig, existing?: PaymentLink): PaymentLink {
  const cta = ctaLabel(cfg);
  if (cfg.linkType === "flexible") {
    return {
      id: existing?.id ?? uid("link"),
      name: cfg.flexible.title.trim(),
      slug: existing?.slug ?? slugFor(cfg.flexible.title),
      model: "Customer enters amount",
      amount: cfg.flexible.presetEnabled ? cfg.flexible.preset : 0,
      min: cfg.flexible.limitsEnabled ? cfg.flexible.min : 0,
      max: cfg.flexible.limitsEnabled ? cfg.flexible.max : 0,
      currency: cfg.currency,
      description: cfg.flexible.description.trim(),
      phone: cfg.options.phone,
      address: cfg.options.address !== "off",
      expiry: existing?.expiry ?? "",
      redirect: cfg.afterPayment.mode === "redirect" ? cfg.afterPayment.redirectUrl : "",
      status: existing?.status ?? "Active",
      created: existing?.created ?? new Date().toISOString(),
      payments: existing?.payments ?? [],
      cta,
      config: structuredClone(cfg),
    };
  }
  const rec = recurringItems(cfg)[0];
  const oneOffTotal = dueToday(cfg);
  const isSubscription = !!rec;
  const model: PaymentLink["model"] = isSubscription
    ? cfg.options.trialEnabled
      ? "14 day trial then Monthly subscription"
      : "Monthly subscription"
    : "Fixed amount";
  const first = cfg.items[0] ? product(cfg, cfg.items[0].productId) : undefined;
  return {
    id: existing?.id ?? uid("link"),
    name: first?.name.trim() || "Payment link",
    slug: existing?.slug ?? slugFor(first?.name || "payment-link"),
    model,
    amount: isSubscription ? recurringAmount(cfg) : oneOffTotal,
    ...(isSubscription && cfg.options.trialEnabled ? { trialDays: trialInDays(cfg.options) } : {}),
    ...(isSubscription ? { interval: rec!.prod.interval as RecurringInterval } : {}),
    min: 0,
    max: 0,
    currency: cfg.currency,
    description: first?.description ?? "",
    phone: cfg.options.phone,
    address: cfg.options.address !== "off",
    expiry: existing?.expiry ?? "",
    redirect: cfg.afterPayment.mode === "redirect" ? cfg.afterPayment.redirectUrl : "",
    status: existing?.status ?? "Active",
    created: existing?.created ?? new Date().toISOString(),
    payments: existing?.payments ?? [],
    cta,
    config: structuredClone(cfg),
  };
}

const slugFor = (name: string) =>
  `${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;

/** Sample catalog products for the "Find or add a product…" picker (published, in stock first). */
export function catalogChoices() {
  return catalogStore
    .get()
    .filter((p) => p.status === "Published")
    .sort((a, b) => Number(b.featured) - Number(a.featured));
}
