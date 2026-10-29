import { describe, expect, it } from "vitest";
import {
  configFromLink,
  configToLink,
  ctaOptions,
  defaultConfig,
  dueToday,
  newProduct,
  priceLabelFor,
  trialInDays,
  validateConfig,
  configIsValid,
  type BuilderConfig,
  type BuilderProduct,
} from "@/lib/demo/link-builder";
import { PAYMENT_LINKS, priceLabel } from "@/lib/demo/payment-links";
import { formatMoney } from "@/lib/money";

const CURRENCY = "NGN" as const;

function withProducts(cfg: BuilderConfig, ...products: BuilderProduct[]): BuilderConfig {
  let next: BuilderConfig = { ...cfg, products: [...cfg.products, ...products] };
  for (const p of products) {
    next = {
      ...next,
      items: [
        ...next.items,
        { uid: `item_${p.id}`, productId: p.id, quantity: 1, adjustable: false, minQty: 0, maxQty: 99 },
      ],
    };
  }
  return next;
}

const oneOff = (amount: number) => newProduct({ name: "Ankara Tote", amount, currency: CURRENCY, interval: "One-off" });
const monthly = (amount: number) => newProduct({ name: "Snack Box", amount, currency: CURRENCY, interval: "Monthly" });

describe("create/edit payment link builder", () => {
  it("creates a one-time product link with the quantity in the total", () => {
    let cfg = defaultConfig(CURRENCY);
    const p = oneOff(15000);
    cfg = withProducts(cfg, p);
    cfg = { ...cfg, items: cfg.items.map((i) => ({ ...i, quantity: 2 })) };
    const link = configToLink(cfg);
    expect(link.model).toBe("Fixed amount");
    expect(link.amount).toBe(30000);
    expect(link.name).toBe("Ankara Tote");
  });

  it("creates a monthly subscription and shows the interval on price labels", () => {
    const cfg = withProducts(defaultConfig(CURRENCY), monthly(15000));
    const link = configToLink(cfg);
    expect(link.model).toBe("Monthly subscription");
    expect(link.interval).toBe("Monthly");
    expect(priceLabel(link)).toBe(`${formatMoney(15000, "NGN")} /month`);
  });

  it("supports a weekly billing interval end to end", () => {
    const cfg = withProducts(defaultConfig(CURRENCY), newProduct({ name: "Weekly Box", amount: 5000, currency: CURRENCY, interval: "Weekly" }));
    const link = configToLink(cfg);
    expect(link.interval).toBe("Weekly");
    expect(priceLabel(link)).toBe(`${formatMoney(5000, "NGN")} /week`);
    expect(priceLabelFor(cfg.products[0]!)).toBe(`${formatMoney(5000, "NGN")} / week`);
  });

  it("stores a trial in days, including weeks and months", () => {
    const base = defaultConfig(CURRENCY);
    expect(trialInDays({ ...base.options, trialUnit: "days", trialDuration: 30 })).toBe(30);
    expect(trialInDays({ ...base.options, trialUnit: "weeks", trialDuration: 2 })).toBe(14);
    const cfg = withProducts({ ...base, options: { ...base.options, trialEnabled: true, trialDuration: 30, trialUnit: "days" } }, monthly(2500));
    const link = configToLink(cfg);
    expect(link.model).toBe("14 day trial then Monthly subscription");
    expect(link.trialDays).toBe(30);
  });

  it("keeps recommended products out of the amount due until the customer adds them", () => {
    const cfg = withProducts(defaultConfig(CURRENCY), oneOff(15000));
    const reco = oneOff(5000);
    const withReco = { ...cfg, products: [...cfg.products, reco], recommendations: [{ uid: "reco_1", productId: reco.id, quantity: 1, adjustable: false }] };
    expect(dueToday(withReco)).toBe(15000);
    expect(dueToday(withReco, 5000)).toBe(20000);
  });

  it("blocks mixed recurring intervals with an inline error", () => {
    const cfg = withProducts(defaultConfig(CURRENCY), monthly(5000), newProduct({ name: "Yearly Plan", amount: 9000, currency: CURRENCY, interval: "Yearly" }));
    expect(validateConfig(cfg).interval).toBe("The prices on all line items must have the same recurring interval.");
    expect(configIsValid(cfg)).toBe(false);
  });

  it("requires a product before creating a products link", () => {
    expect(validateConfig(defaultConfig(CURRENCY)).items).toBe("Select a product to continue.");
  });

  it("validates the flexible payment configuration", () => {
    const cfg = { ...defaultConfig(CURRENCY), linkType: "flexible" as const };
    expect(validateConfig(cfg)["flex.title"]).toBeTruthy();
    const titled = { ...cfg, flexible: { ...cfg.flexible, title: "Support us" } };
    expect(validateConfig(titled)["flex.title"]).toBeUndefined();
    const crossed = { ...titled, flexible: { ...titled.flexible, limitsEnabled: true, min: 10000, max: 500 } };
    expect(validateConfig(crossed)["flex.limits"]).toBe("The minimum can't be greater than the maximum.");
    const outside = { ...titled, flexible: { ...titled.flexible, presetEnabled: true, preset: 5, limitsEnabled: true, min: 100, max: 900 } };
    expect(validateConfig(outside)["flex.preset"]).toBeTruthy();
  });

  it("validates custom fields: labels required, dropdowns need two options", () => {
    const base = withProducts(defaultConfig(CURRENCY), oneOff(1000));
    const field = { uid: "f1", type: "Dropdown" as const, label: "", required: true, default: "", limitEnabled: false, limitKind: "At most" as const, limitA: 0, limitB: 0, options: ["Male"] };
    const errors = validateConfig({ ...base, advanced: { ...base.advanced, fields: [field] } });
    expect(errors["field.f1.label"]).toBeTruthy();
    expect(errors["field.f1.options"]).toBe("Add at least two options.");
    const okConfig = {
      ...base,
      advanced: { ...base.advanced, fields: [{ ...field, label: "Gender", options: ["Male", "Female"] }] },
    };
    expect(validateConfig(okConfig)["field.f1.label"]).toBeUndefined();
    expect(validateConfig(okConfig)["field.f1.options"]).toBeUndefined();
    expect(configIsValid(okConfig)).toBe(true);
  });

  it("only accepts HTTPS redirect URLs", () => {
    const base = withProducts(defaultConfig(CURRENCY), oneOff(1000));
    const bad = { ...base, afterPayment: { ...base.afterPayment, mode: "redirect" as const, redirectUrl: "http://example.com" } };
    expect(validateConfig(bad).redirect).toBe("Enter a valid HTTPS URL.");
    const good = { ...bad, afterPayment: { ...bad.afterPayment, redirectUrl: "https://example.com/thanks" } };
    expect(configIsValid(good)).toBe(true);
  });

  it("blocks payment limits while customers can adjust quantity", () => {
    let cfg = withProducts(defaultConfig(CURRENCY), oneOff(1000));
    cfg = { ...cfg, items: cfg.items.map((i) => ({ ...i, adjustable: true })), options: { ...cfg.options, limitPaymentsEnabled: true } };
    expect(validateConfig(cfg).limit).toBe("To limit the number of payments on this link, turn off letting customers adjust quantity.");
  });

  it("offers Subscribe for recurring links and Pay, Book, Donate otherwise", () => {
    expect(ctaOptions(withProducts(defaultConfig(CURRENCY), monthly(5000)))).toEqual(["Subscribe", "Donate"]);
    expect(ctaOptions(withProducts(defaultConfig(CURRENCY), oneOff(5000)))).toEqual(["Pay", "Book", "Donate"]);
    expect(ctaOptions({ ...defaultConfig(CURRENCY), linkType: "flexible" })).toEqual(["Pay", "Book", "Donate"]);
  });

  it("round-trips a link through the builder without losing configuration", () => {
    const original = PAYMENT_LINKS.find((l) => l.model === "14 day trial then Monthly subscription")!;
    const cfg = configFromLink(original);
    expect(cfg.linkType).toBe("products");
    expect(cfg.options.trialEnabled).toBe(true);
    expect(cfg.options.trialDuration).toBe(14);
    const rebuilt = configToLink(cfg, original);
    expect(rebuilt.model).toBe(original.model);
    expect(rebuilt.amount).toBe(original.amount);
    expect(rebuilt.trialDays).toBe(14);
    expect(rebuilt.config).toEqual(cfg);
  });

  it("rebuilds legacy flexible links with their preset and limits", () => {
    const chosen = PAYMENT_LINKS.find((l) => l.model === "Customer enters amount")!;
    const cfg = configFromLink(chosen);
    expect(cfg.linkType).toBe("flexible");
    expect(cfg.flexible.title).toBe(chosen.name);
    expect(cfg.flexible.preset).toBe(chosen.amount);
    const rebuilt = configToLink(cfg, chosen);
    expect(rebuilt.model).toBe("Customer enters amount");
    expect(rebuilt.min).toBe(chosen.min);
    expect(rebuilt.max).toBe(chosen.max);
  });
});
