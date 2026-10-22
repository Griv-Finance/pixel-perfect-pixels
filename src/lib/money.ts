/** Currencies Griv supports in this demo. Amounts are kept in major units (e.g. naira, not kobo). */
export const CURRENCIES = ["NGN", "GHS", "KES", "USD", "ZAR"] as const;
export type Currency = (typeof CURRENCIES)[number];

const SYMBOL: Record<Currency, string> = { NGN: "₦", GHS: "GH₵", KES: "KSh ", USD: "$", ZAR: "R " };
export const currencySymbol = (c: Currency) => SYMBOL[c].trim();

/** "₦24,850,000.00". Pass signed: true to prefix + for positive values. Never mix currencies in one total. */
export function formatMoney(amount: number, currency: Currency = "NGN", opts: { signed?: boolean; decimals?: boolean } = {}) {
  const { signed = false, decimals = true } = opts;
  const abs = Math.abs(amount).toLocaleString("en-NG", {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  });
  const sign = amount < 0 ? "−" : signed && amount > 0 ? "+" : "";
  return `${sign}${SYMBOL[currency]}${abs}`;
}

/** Short form for metric cards: "₦24.9M", "$18.4K". */
export function formatMoneyCompact(amount: number, currency: Currency = "NGN") {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "−" : "";
  const [div, suf] = abs >= 1e9 ? [1e9, "B"] : abs >= 1e6 ? [1e6, "M"] : abs >= 1e3 ? [1e3, "K"] : [1, ""];
  const n = abs / div;
  return `${sign}${SYMBOL[currency]}${n >= 100 || div === 1 ? Math.round(n).toLocaleString("en-NG") : n.toFixed(1)}${suf}`;
}

/** Sum amounts per currency instead of into one misleading total. */
export function totalsByCurrency<T>(rows: T[], amount: (r: T) => number, currency: (r: T) => Currency) {
  const out: Partial<Record<Currency, number>> = {};
  for (const r of rows) out[currency(r)] = (out[currency(r)] ?? 0) + amount(r);
  return out;
}

export const formatCount = (n: number) => n.toLocaleString("en-NG");
