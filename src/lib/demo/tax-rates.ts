/** SAMPLE DATA — the merchant's configured tax rates. Invoices reference these by id; nothing is hardcoded. */
import { createDemoStore } from "@/lib/demo-store";

export type TaxRate = {
  id: string;
  name: string;
  /** Percentage, e.g. 7.5 for 7.5%. */
  rate: number;
  /** Inclusive rates are already part of the price; exclusive rates are added on top. */
  inclusive: boolean;
};

export const INITIAL_TAX_RATES: TaxRate[] = [
  { id: "txr_vat", name: "VAT", rate: 7.5, inclusive: false },
  { id: "txr_vat_incl", name: "VAT", rate: 7.5, inclusive: true },
];

export const taxRatesStore = createDemoStore<TaxRate[]>(INITIAL_TAX_RATES);
export const useTaxRates = () => taxRatesStore.use();
export const getTaxRate = (id: string) => taxRatesStore.get().find((t) => t.id === id);

export function addTaxRate(input: Omit<TaxRate, "id">): TaxRate {
  const rate: TaxRate = { ...input, id: `txr_${Date.now().toString(36)}` };
  taxRatesStore.set((all) => [...all, rate]);
  return rate;
}

/** "VAT (7.5%)" or "VAT (7.5% included)". */
export const taxLabel = (t: Pick<TaxRate, "name" | "rate" | "inclusive">) =>
  `${t.name} (${t.rate}%${t.inclusive ? " included" : ""})`;
