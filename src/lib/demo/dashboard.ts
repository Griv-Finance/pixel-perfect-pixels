// SAMPLE DATA + metric helpers for the unified merchant dashboard (MailerLite-style).
// One dashboard for every merchant: sections adapt to the data that exists.
// Money rule: every total is filtered to a single currency — amounts are never summed across currencies.
import { createDemoStore } from "@/lib/demo-store";
import { DEMO_TODAY, type DateRange } from "@/lib/dates";
import { differenceInCalendarDays, format, parseISO, subDays } from "date-fns";
import type { Currency } from "@/lib/money";
import type { LedgerEntry } from "@/lib/demo/ledger";
import type { PaymentLink } from "@/lib/demo/payment-links";
import { invoiceStatus, type Invoice } from "@/lib/demo/invoices";
import { totals, type Order } from "@/lib/demo/orders";
import type { BalanceAccount } from "@/lib/demo/accounts";

/* ---------- Onboarding checklist: exactly three tasks, hidden once all are done ---------- */
export type OnboardingTask = { id: "email" | "profile" | "verify"; label: string; description: string };

export const ONBOARDING_TASKS: OnboardingTask[] = [
  { id: "email", label: "Email verification", description: "Verify your email address." },
  { id: "profile", label: "Complete profile", description: "Complete your personal and business profile." },
  {
    id: "verify",
    label: "Verify business",
    description: "Submit the required information and documents to verify your business.",
  },
];

const onboardingStore = createDemoStore<Record<string, boolean>>({ email: true, profile: true, verify: false });
export const useOnboarding = () => onboardingStore.use();
export const onboardingDone = () => onboardingStore.get();
export const completeOnboardingTask = (id: string) => onboardingStore.set((s) => ({ ...s, [id]: true }));
export const onboardingAllDone = (s: Record<string, boolean>) => ONBOARDING_TASKS.every((t) => s[t.id]);

/* ---------- Period + currency ---------- */
export const DASHBOARD_CURRENCIES: Currency[] = ["NGN", "USD", "GHS", "KES"];

const RANGE_DAYS: Record<DateRange, number> = {
  Today: 0,
  "Last 7 days": 6,
  "Last 30 days": 29,
  "Last 90 days": 89,
  "All time": Infinity,
};

const dayDiff = (iso: string) => differenceInCalendarDays(DEMO_TODAY, parseISO(iso));

export function inPeriod(iso: string, range: DateRange) {
  const d = dayDiff(iso);
  if (d < 0) return false;
  const n = RANGE_DAYS[range];
  return !Number.isFinite(n) ? true : d <= n;
}

type Bucket = { key: string; match: (iso: string) => boolean };

/** Ordered chart buckets: hourly for Today, daily otherwise (All time spans the data it is given). */
function buckets(range: DateRange, rows: { date: string }[]): Bucket[] {
  if (range === "Today") {
    const endHour = DEMO_TODAY.getHours();
    return Array.from({ length: Math.max(1, endHour - 7) }, (_, i) => {
      const h = 8 + i;
      return { key: `${h}:00`, match: (iso: string) => parseISO(iso).getHours() === h };
    });
  }
  let n = RANGE_DAYS[range];
  if (!Number.isFinite(n)) n = rows.reduce((m, r) => Math.max(m, dayDiff(r.date)), 0);
  const total = n + 1;
  return Array.from({ length: total }, (_, i) => {
    const d = total - 1 - i;
    const key = format(subDays(DEMO_TODAY, d), "d MMM");
    return { key, match: (iso: string) => dayDiff(iso) === d };
  });
}

export type Pt = { key: string; value: number };

const perBucket = (bs: Bucket[], valueOf: (match: Bucket["match"]) => number): Pt[] =>
  bs.map(({ key, match }) => ({ key, value: valueOf(match) }));

const cumulative = (bs: Bucket[], countOf: (match: Bucket["match"]) => number): Pt[] => {
  let run = 0;
  return bs.map(({ key, match }) => {
    run += countOf(match);
    return { key, value: run };
  });
};

const hash = (s: string) => {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 997;
  return h;
};

/* ---------- Payments section ---------- */
export type PaymentMetric = "payments" | "deposits" | "withdrawals";

export const PAYMENT_METRIC_OPTIONS: { value: PaymentMetric; label: string }[] = [
  { value: "payments", label: "Total payments" },
  { value: "deposits", label: "Total deposits" },
  { value: "withdrawals", label: "Total withdrawals" },
];

/** Deposits are pay-ins; withdrawals are payouts; total payments is combined gross activity. */
const GROUP_TYPES: Record<PaymentMetric, string[]> = {
  payments: ["Payment", "Payout"],
  deposits: ["Payment"],
  withdrawals: ["Payout"],
};

export type PaymentStats = {
  total: number;
  successful: number;
  failed: number;
  pending: number;
  avgSeconds: number | null;
};

/** Gross money activity excludes failed attempts; pending money is included until it settles. */
const gross = (rows: LedgerEntry[]) =>
  rows.filter((r) => r.status !== "Failed").reduce((s, r) => s + r.amount, 0);

export function paymentStats(
  ledger: LedgerEntry[],
  { metric, currency, range }: { metric: PaymentMetric; currency: Currency; range: DateRange },
): PaymentStats {
  const rows = ledger.filter(
    (r) => r.currency === currency && GROUP_TYPES[metric].includes(r.type) && inPeriod(r.date, range),
  );
  const seconds = rows.map((r) => 1.2 + (hash(r.id) % 29) / 10);
  return {
    total: gross(rows),
    successful: rows.filter((r) => r.status === "Successful").length,
    failed: rows.filter((r) => r.status === "Failed").length,
    pending: rows.filter((r) => r.status === "Pending").length,
    avgSeconds: seconds.length ? seconds.reduce((a, b) => a + b, 0) / seconds.length : null,
  };
}

/** Payment value over time for the selected metric — one currency only. */
export function paymentSeries(
  ledger: LedgerEntry[],
  { metric, currency, range }: { metric: PaymentMetric; currency: Currency; range: DateRange },
): Pt[] {
  const rows = ledger.filter((r) => r.currency === currency && GROUP_TYPES[metric].includes(r.type));
  return perBucket(buckets(range, rows), (match) => gross(rows.filter((r) => match(r.date))));
}

/* ---------- Balances & settlements section (NGN wallets) ---------- */
export type SettlementStats = {
  available: number;
  pendingBalance: number;
  settledAmount: number;
  completed: number;
  pendingSettlements: number;
};

export function settlementStats(
  ledger: LedgerEntry[],
  accounts: BalanceAccount[],
  range: DateRange,
): SettlementStats {
  const ngAccounts = accounts.filter((a) => a.currency === "NGN");
  const rows = ledger.filter((r) => r.currency === "NGN" && r.type === "Settlement" && inPeriod(r.date, range));
  const ok = rows.filter((r) => r.status === "Successful");
  return {
    available: ngAccounts.reduce((s, a) => s + a.available, 0),
    pendingBalance: ngAccounts.reduce((s, a) => s + a.pending, 0),
    settledAmount: ok.reduce((s, r) => s + r.amount, 0),
    completed: ok.length,
    pendingSettlements: rows.filter((r) => r.status === "Pending").length,
  };
}

/* ---------- Payment links section ---------- */
/** Fabricated eligible visits per link so a conversion rate exists; deterministic, not random. */
export const linkVisits = (l: PaymentLink) => 60 + (hash(l.id) % 140);

export type LinkStats = {
  paid: number;
  conversion: number | null;
  paidSeries: Pt[];
  convSeries: Pt[];
};

export function linkStats(
  links: PaymentLink[],
  linkId: string,
  range: DateRange,
): LinkStats {
  const selected = linkId === "all" ? links : links.filter((l) => l.id === linkId);
  const pays = selected
    .flatMap((l) => l.payments)
    .filter((p) => inPeriod(p.date, range));
  const visits = selected.reduce((s, l) => s + linkVisits(l), 0);
  const bs = buckets(range, pays);
  const paidAt = (match: Bucket["match"]) => pays.filter((p) => match(p.date)).length;
  return {
    paid: pays.length,
    conversion: visits ? Math.round((pays.length / visits) * 1000) / 10 : null,
    paidSeries: cumulative(bs, paidAt),
    convSeries: cumulative(bs, paidAt).map((p) => ({
      key: p.key,
      value: visits ? Math.round((p.value / visits) * 1000) / 10 : 0,
    })),
  };
}

/* ---------- Invoices section ---------- */
export type InvoiceStats = {
  paid: number;
  conversion: number | null;
  paidSeries: Pt[];
  convSeries: Pt[];
};

export function invoiceStats(
  invoices: Invoice[],
  invoiceId: string,
  range: DateRange,
): InvoiceStats {
  const selected = invoiceId === "all" ? invoices : invoices.filter((r) => r.id === invoiceId);
  const issuable = selected.filter((r) => r.status !== "Draft" && r.status !== "Cancelled");
  const issued = issuable.filter((r) => inPeriod(r.issue, range));
  const paid = issued.filter((r) => invoiceStatus(r) === "Paid");
  const bs = buckets(range, issued.map((r) => ({ date: r.issue })));
  const paidAt = (match: Bucket["match"]) => issued.filter((r) => match(r.issue) && invoiceStatus(r) === "Paid").length;
  const issuedAt = (match: Bucket["match"]) => issued.filter((r) => match(r.issue)).length;
  const paidRun = cumulative(bs, paidAt);
  const issuedRun = cumulative(bs, issuedAt);
  return {
    paid: paid.length,
    conversion: issued.length ? Math.round((paid.length / issued.length) * 1000) / 10 : null,
    paidSeries: paidRun,
    convSeries: issuedRun.map((p, i) => ({
      key: p.key,
      value: p.value ? Math.round((paidRun[i]!.value / p.value) * 1000) / 10 : 0,
    })),
  };
}

/* ---------- E-commerce section (NGN orders) ---------- */
export type EcommerceStats = {
  revenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  revenueSeries: Pt[];
  orderSeries: Pt[];
};

export function ecommerceStats(orders: Order[], range: DateRange): EcommerceStats {
  const rows = orders.filter((o) => inPeriod(o.date, range));
  const revenueOf = (o: Order) => totals(o).total;
  const bs = buckets(range, rows);
  return {
    revenue: rows.reduce((s, o) => s + revenueOf(o), 0),
    paidRevenue: rows.filter((o) => o.payment === "Paid").reduce((s, o) => s + revenueOf(o), 0),
    pendingRevenue: rows.filter((o) => o.payment === "Awaiting payment").reduce((s, o) => s + revenueOf(o), 0),
    totalOrders: rows.length,
    completedOrders: rows.filter((o) => o.fulfilment === "Delivered").length,
    pendingOrders: rows.filter((o) => o.fulfilment === "Unfulfilled" || o.fulfilment === "Processing").length,
    revenueSeries: perBucket(bs, (match) =>
      rows.filter((o) => match(o.date)).reduce((s, o) => s + revenueOf(o), 0),
    ),
    orderSeries: perBucket(bs, (match) => rows.filter((o) => match(o.date)).length),
  };
}
