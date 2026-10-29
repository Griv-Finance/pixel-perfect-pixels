/** SAMPLE DATA — Nova Retail collection links and fictional confirmed payments. */
import { createDemoStore } from "@/lib/demo-store";
import { daysAgo } from "@/lib/dates";
import { formatMoney, type Currency } from "@/lib/money";

export type LinkPayment = { reference: string; customer: string; amount: number; date: string };

export const LINK_MODELS = [
  "Fixed amount",
  "Customer enters amount",
  "Monthly subscription",
  "14 day trial then Monthly subscription",
] as const;
export const LINK_STATUSES = ["Active", "Inactive", "Expired"] as const;
export type LinkModel = (typeof LINK_MODELS)[number];

export type PaymentLink = {
  id: string;
  name: string;
  slug: string;
  model: LinkModel;
  amount: number;
  /** Length of the free trial, only for "14 day trial then Monthly subscription". */
  trialDays?: number;
  min: number;
  max: number;
  currency: Currency;
  description: string;
  phone: boolean;
  address: boolean;
  expiry: string;
  redirect: string;
  status: "Active" | "Inactive" | "Expired";
  created: string;
  payments: LinkPayment[];
};

export const linkUrl = (r: PaymentLink) => `https://pay.griv.africa/novaretail/${r.slug}`;

const base = [
  "Weekend essentials",
  "Lagos delivery top-up",
  "Corporate gift boxes",
  "Accra pop-up",
  "October pre-orders",
  "Community collection",
  "Summer clearance",
].map((name, i) => ({
  id: `link_${i}`,
  name,
  slug: name.toLowerCase().replaceAll(" ", "-"),
  model: (i % 2 ? "Customer enters amount" : "Fixed amount") as LinkModel,
  amount: i === 3 ? 150 : 12500 + i * 5000,
  min: 100,
  max: 100000,
  currency: (i === 3 ? "GHS" : "NGN") as Currency,
  description: `Nova Retail — ${name}`,
  phone: true,
  address: i % 2 === 0,
  expiry: i === 6 ? daysAgo(8).slice(0, 10) : "",
  redirect: "",
  status: (i === 6 ? "Expired" : i === 4 ? "Inactive" : "Active") as PaymentLink["status"],
  created: daysAgo(35 - i * 3),
  payments: Array.from({ length: i === 4 ? 0 : 3 + i }, (_, j) => ({
    reference: `PL-${i + 1}0${j + 1}`,
    customer: ["Chioma Eze", "Tunde Bakare", "Amaka Stores"][j % 3]!,
    amount: i === 3 ? 150 : i % 2 ? 5000 + j * 1000 : 12500 + i * 5000,
    date: daysAgo(12 - j),
  })),
}));

const SUBSCRIPTIONS: PaymentLink[] = [
  {
    id: "link_sub_1",
    name: "Nova Pro monthly",
    slug: "nova-pro-monthly",
    model: "Monthly subscription",
    amount: 2500,
    min: 0,
    max: 0,
    currency: "NGN",
    description: "Nova Retail — Nova Pro monthly plan",
    phone: true,
    address: false,
    expiry: "",
    redirect: "",
    status: "Active",
    created: daysAgo(9),
    payments: Array.from({ length: 4 }, (_, j) => ({
      reference: `PL-S10${j + 1}`,
      customer: ["Chioma Eze", "Tunde Bakare", "Amaka Stores", "Fola Adeyemi"][j]!,
      amount: 2500,
      date: daysAgo(6 - j),
    })),
  },
  {
    id: "link_sub_2",
    name: "Pro 14-day trial",
    slug: "pro-14-day-trial",
    model: "14 day trial then Monthly subscription",
    amount: 2500,
    trialDays: 14,
    min: 0,
    max: 0,
    currency: "NGN",
    description: "Nova Retail — Nova Pro with a 14-day free trial",
    phone: true,
    address: false,
    expiry: "",
    redirect: "",
    status: "Active",
    created: daysAgo(3),
    payments: [],
  },
];

export const PAYMENT_LINKS: PaymentLink[] = [...base, ...SUBSCRIPTIONS];

/** Shared between the Payment Links list and each link's own page, so edits follow the merchant. */
export const linksStore = createDemoStore(PAYMENT_LINKS);
export const useLinks = () => linksStore.use();
export const getLink = (id: string) => linksStore.get().find((l) => l.id === id);

/** Row-menu actions in display order; Deactivate sits below a divider. */
export const LINK_ACTIONS = [
  { key: "copy-url", label: "Copy url" },
  { key: "preview", label: "Preview payment link" },
  { key: "rename", label: "Change name" },
  { key: "edit", label: "Edit" },
  { key: "copy-live", label: "Copy to live mode" },
  { key: "divider" },
  { key: "deactivate", label: "Deactivate" },
] as const;

/** Price-column text, e.g. "₦12,500" or "₦2,500 /month · 14-day trial". */
export function priceLabel(r: Pick<PaymentLink, "model" | "amount" | "currency" | "trialDays">) {
  if (r.model === "Monthly subscription") return `${formatMoney(r.amount, r.currency)} /month`;
  if (r.model === "14 day trial then Monthly subscription")
    return `${formatMoney(r.amount, r.currency)} /month · ${r.trialDays ?? 14}-day trial`;
  if (r.model === "Fixed amount") return formatMoney(r.amount, r.currency);
  return "Customer chooses";
}
