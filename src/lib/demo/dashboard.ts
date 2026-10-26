// SAMPLE DATA — Griv dashboard preview states, checklist and metrics helpers.
// Nothing here reads from a backend; the preview state is separate from any real account status.
import { createDemoStore } from "@/lib/demo-store";
import { DEMO_TODAY, type DateRange } from "@/lib/dates";
import { differenceInCalendarDays, format, parseISO, subDays } from "date-fns";
import type { LedgerEntry } from "@/lib/demo/ledger";

/* ---------- The three preview states ---------- */
export const DASHBOARD_STATES = ["new", "verified", "active"] as const;
export type DashboardState = (typeof DASHBOARD_STATES)[number];

export const STATE_LABELS: Record<DashboardState, string> = {
  new: "New merchant — compliance incomplete",
  verified: "Verified merchant — setup incomplete",
  active: "Active merchant — transactions recorded",
};

export const STATE_SHORT: Record<DashboardState, string> = {
  new: "New merchant",
  verified: "Verified merchant",
  active: "Active merchant",
};

/** Preview-only store: switching states never changes the merchant's real data. */
const stateStore = createDemoStore<DashboardState>("new");
export const useDashboardState = () => stateStore.use();
export const setDashboardState = (s: DashboardState) => stateStore.set(s);

/* ---------- Setup checklist ---------- */
export type ChecklistTask = {
  id: string;
  label: string;
  description: string;
  done: Record<DashboardState, boolean>;
  /** Route to open, or undefined when the task only supports an honest preview dialog. */
  href?: string;
  preview?: { title: string; description: string };
};

export const CHECKLIST_TASKS: ChecklistTask[] = [
  {
    id: "account",
    label: "Create your Griv account",
    description: "Sign up and secure your login.",
    done: { new: true, verified: true, active: true },
  },
  {
    id: "profile",
    label: "Complete your business profile",
    description: "Business name, address and industry.",
    href: "/onboarding",
    done: { new: true, verified: true, active: true },
  },
  {
    id: "verify",
    label: "Verify your business",
    description: "Upload your CAC certificate and proof of address.",
    done: { new: false, verified: true, active: true },
    preview: {
      title: "Business verification",
      description:
        "Real document verification isn't wired up in this demo yet. In the live product this opens the verification flow: upload your CAC certificate, ID and proof of address, then track the review.",
    },
  },
  {
    id: "methods",
    label: "Choose how you get paid",
    description: "Turn on card, bank transfer, USSD and virtual accounts.",
    href: "/onboarding",
    done: { new: false, verified: false, active: true },
  },
  {
    id: "settlement",
    label: "Add settlement details",
    description: "Pick the bank account your money settles into.",
    href: "/balances",
    done: { new: false, verified: false, active: true },
  },
  {
    id: "sell",
    label: "Add something to sell",
    description: "Create a product, payment link or invoice.",
    href: "/products",
    done: { new: false, verified: false, active: true },
  },
  {
    id: "test",
    label: "Make a test payment",
    description: "Run a POS sale to see money move end to end.",
    href: "/pos",
    done: { new: false, verified: false, active: true },
  },
  {
    id: "first",
    label: "Receive your first payment",
    description: "Share a payment link and watch your balance grow.",
    href: "/payment-links",
    done: { new: false, verified: false, active: true },
  },
];

export const checklistProgress = (state: DashboardState) => {
  const done = CHECKLIST_TASKS.filter((t) => t.done[state]).length;
  return { done, total: CHECKLIST_TASKS.length };
};

/* ---------- Quick actions ---------- */
export type QuickAction = { id: string; label: string; description: string; href: string };

export const QUICK_ACTIONS: QuickAction[] = [
  { id: "link", label: "Payment link", description: "Share a link and get paid.", href: "/payment-links" },
  { id: "invoice", label: "Invoice", description: "Bill a customer with terms.", href: "/invoices" },
  { id: "product", label: "Add product", description: "Build your catalogue.", href: "/products" },
  { id: "pos", label: "POS sale", description: "Charge at the counter.", href: "/pos" },
];

/* ---------- Feature setup cards (verified state) ---------- */
export type FeatureCard = {
  id: string;
  title: string;
  description: string;
  href?: string;
  preview?: { title: string; description: string };
};

export const FEATURE_CARDS: FeatureCard[] = [
  { id: "links", title: "Payment links", description: "Get paid with a link you share anywhere.", href: "/payment-links" },
  { id: "invoices", title: "Invoices", description: "Send invoices with VAT, terms and reminders.", href: "/invoices" },
  { id: "store", title: "Online store", description: "Sell on a hosted storefront with checkout.", href: "/online-store" },
  { id: "catalog", title: "Products & inventory", description: "Track stock across shop and POS.", href: "/products" },
  { id: "virtual", title: "Virtual accounts", description: "Collect transfers with dedicated bank details.", href: "/virtual-accounts" },
  {
    id: "dev",
    title: "Developers",
    description: "API keys and webhooks for your own product.",
    preview: {
      title: "Developer tools",
      description: "API keys and webhooks aren't part of this demo yet. In the live product this opens the developer dashboard.",
    },
  },
];

/* ---------- Resources and help ---------- */
export type Resource = {
  id: string;
  title: string;
  description: string;
  preview: { title: string; description: string };
};

export const RESOURCES: Resource[] = [
  {
    id: "guide",
    title: "Getting started guide",
    description: "A five-minute tour of money in and money out.",
    preview: {
      title: "Getting started guide",
      description: "The full guide isn't part of this demo yet — this link would open it in the live product.",
    },
  },
  {
    id: "methods",
    title: "Payment methods explained",
    description: "How card, transfer and USSD payments settle.",
    preview: {
      title: "Payment methods explained",
      description: "The explainer isn't part of this demo yet — this link would open it in the live product.",
    },
  },
  {
    id: "import",
    title: "Import your products",
    description: "Bring your catalogue in from a CSV file.",
    preview: {
      title: "Import your products",
      description: "Bulk import isn't wired up in this demo yet. In the live product this opens a CSV upload like the one on the Inventory page.",
    },
  },
  {
    id: "support",
    title: "Talk to support",
    description: "Real people, replies within one business day.",
    preview: {
      title: "Talk to support",
      description: "Live chat isn't wired up in this demo yet — this would open a support conversation in the live product.",
    },
  },
];

/* ---------- Range windows and money helpers (NGN only) ---------- */
const RANGE_DAYS: Record<DateRange, number> = {
  Today: 0,
  "Last 7 days": 6,
  "Last 30 days": 29,
  "Last 90 days": 89,
  "All time": Infinity,
};

const diffFromToday = (iso: string) => differenceInCalendarDays(DEMO_TODAY, parseISO(iso));

export function rowsInRange<T extends { date: string }>(rows: T[], range: DateRange) {
  const n = RANGE_DAYS[range];
  if (!Number.isFinite(n)) return rows;
  return rows.filter((r) => {
    const d = diffFromToday(r.date);
    return d >= 0 && d <= n;
  });
}

/** Same-length window before the selected one, for "vs previous period" deltas. */
export function rowsInPreviousWindow<T extends { date: string }>(rows: T[], range: DateRange) {
  const n = RANGE_DAYS[range];
  if (!Number.isFinite(n)) return [];
  const lo = n + 1;
  const hi = 2 * n + 1;
  return rows.filter((r) => {
    const d = diffFromToday(r.date);
    return d >= lo && d <= hi;
  });
}

/** Sums successful money movement for one ledger type group. NGN only — never adds across currencies. */
export function sumMoney(rows: LedgerEntry[], types: string[]) {
  return rows
    .filter((r) => r.currency === "NGN" && types.includes(r.type) && r.status === "Successful")
    .reduce((s, r) => s + r.amount, 0);
}

export const growthPct = (cur: number, prev: number) =>
  prev > 0 ? Math.round(((cur - prev) / prev) * 100) : undefined;

const MONEY_IN = ["Payment", "Settlement"];
const MONEY_OUT = ["Payout", "Transfer", "Refund", "Fee"];

/** Daily (or hourly for Today) incoming vs outgoing NGN series for the chart. */
export function moneySeries(rows: LedgerEntry[], range: DateRange) {
  const rowsN = rowsInRange(rows, range).filter((r) => r.currency === "NGN");
  if (range === "Today") {
    return Array.from({ length: 8 }, (_, i) => {
      const hour = 8 + i;
      const at = rowsN.filter((r) => parseISO(r.date).getHours() === hour);
      return { key: `${hour}:00`, Incoming: sumMoney(at, MONEY_IN), Outgoing: sumMoney(at, MONEY_OUT) };
    });
  }
  const n = RANGE_DAYS[range];
  return Array.from({ length: n + 1 }, (_, i) => {
    const d = n - i;
    const day = format(subDays(DEMO_TODAY, d), "d MMM");
    const at = rowsN.filter((r) => diffFromToday(r.date) === d);
    return { key: day, Incoming: sumMoney(at, MONEY_IN), Outgoing: sumMoney(at, MONEY_OUT) };
  });
}
