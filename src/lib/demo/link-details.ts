/** helpers that drive the Stripe-style payment link details page, derived from actual link data */
import { createDemoStore } from "./demo-store";
import { fmtDate, fmtDateTime } from "@/lib/dates";
import { formatMoney, type Currency } from "@/lib/money";
import type { PaymentLink } from "./payment-links";

/* ---------- per-link extras (note, metadata, methods, shipping) kept apart from LinkForm saves ---------- */

export type LinkExtras = {
  note?: string;
  metadata?: Record<string, string>;
  methods?: string[];
  shipTo?: string[];
};

export const extrasStore = createDemoStore<Record<string, LinkExtras>>({});
export const useLinkExtras = () => extrasStore.use();
export const getExtras = (id: string) => extrasStore.get()[id] ?? {};
export const setExtras = (id: string, patch: LinkExtras) =>
  extrasStore.set((all) => ({ ...all, [id]: { ...all[id], ...patch } }));

/* ---------- payment methods & shipping ---------- */

export const PAYMENT_METHODS_BY_CURRENCY: Record<Currency, string[]> = {
  NGN: ["Card", "Bank transfer", "USSD", "Mobile money"],
  GHS: ["Card", "Mobile money"],
  KES: ["Card", "Mobile money"],
  USD: ["Card"],
  ZAR: ["Card"],
};

export const SHIP_TO_OPTIONS = ["Nigeria", "Ghana", "Kenya", "South Africa", "Rwanda"];

export const methodsFor = (link: Pick<PaymentLink, "currency">, extras: LinkExtras = {}) =>
  extras.methods ?? PAYMENT_METHODS_BY_CURRENCY[link.currency] ?? ["Card"];
export const shipToFor = (extras: LinkExtras = {}) => extras.shipTo ?? ["Nigeria", "Ghana"];

/* ---------- products table, adaptive to the pricing model ---------- */

export type ProductTable = {
  columns: string[];
  rows: { name: string; nameSub: string; cells: string[] }[];
};

export function productTable(link: PaymentLink): ProductTable {
  const c = link.currency as Currency;
  if (link.model === "Customer enters amount") {
    return {
      columns: ["Name", "Preset price", "Minimum price", "Maximum price"],
      rows: [
        {
          name: link.name,
          nameSub: `Customer chooses (${c})`,
          cells: [
            link.amount > 0 ? formatMoney(link.amount, c) : "—",
            formatMoney(link.min, c),
            formatMoney(link.max, c),
          ],
        },
      ],
    };
  }
  const interval = link.model.includes("Monthly subscription") ? " / month" : "";
  return {
    columns: ["Name", "Quantity", "Adjustable Quantity"],
    rows: [
      {
        name: link.name,
        nameSub: `${formatMoney(link.amount, c)}${interval}${link.trialDays ? ` · ${link.trialDays}-day free trial` : ""}`,
        cells: ["1", "No"],
      },
    ],
  };
}

/* ---------- Details key-values, driven by the link configuration ---------- */

export function detailRows(link: PaymentLink, extras: LinkExtras = {}): [string, string][] {
  const rows: [string, string][] = [
    ["Date created", fmtDateTime(link.created)],
  ];
  if (link.model.includes("Monthly subscription")) {
    rows.push(["Billing type", "Recurring"], ["Billing interval", "Monthly"]);
    if (link.trialDays) rows.push(["Free trial", `${link.trialDays} days`]);
  } else {
    rows.push(["Payment type", "One-time"]);
  }
  if (link.model === "Customer enters amount") {
    rows.push(
      ["Amount type", "Customer chooses"],
      ["Preset amount", link.amount > 0 ? formatMoney(link.amount, link.currency as Currency) : "—"],
      ["Minimum amount", formatMoney(link.min, link.currency as Currency)],
      ["Maximum amount", formatMoney(link.max, link.currency as Currency)],
    );
  }
  rows.push(
    ["Currency", link.currency],
    ["Collect phone numbers", link.phone ? "Yes" : "No"],
    ["Collect addresses", link.address ? "Billing and shipping" : "None required"],
    ["Call to action button", link.model.includes("Monthly subscription") ? "Subscribe" : "Pay"],
    ["Expiry date", link.expiry ? fmtDate(link.expiry) : "No expiry"],
    ["Redirect URL", link.redirect || "None"],
  );
  if (extras.note) rows.push(["Note", extras.note]);
  return rows;
}

/* ---------- events & logs, derived from the link's actual data ---------- */

export const plinkId = (link: Pick<PaymentLink, "id">) => `plink_${link.id.replace(/^link_/, "")}`;

export function linkEvents(link: PaymentLink) {
  const events = [{ text: `A payment link with ID ${plinkId(link)} was created`, time: fmtDateTime(link.created) }];
  for (const p of [...link.payments].reverse()) {
    events.push({ text: `Payment ${p.reference} completed by ${p.customer}`, time: fmtDateTime(p.date) });
  }
  return events;
}

export function linkLogs(link: PaymentLink) {
  return [
    { status: "200 OK", method: "POST", endpoint: "/v1/payment_links", time: fmtDateTime(link.created) },
  ];
}

/** Reference prefix that finds this link's payments on the Transactions page. */
export function txnPrefix(link: Pick<PaymentLink, "id">) {
  const m = /^link_(\d+)$/.exec(link.id);
  return m ? `PL-${m[1]}` : "PL-S1";
}
