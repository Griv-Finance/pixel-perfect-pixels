/** SAMPLE DATA — defaults for invoices, payment links, the online store, POS, inventory and customers. */
import { createDemoStore } from "@/lib/demo-store";
import { daysAgo } from "@/lib/dates";
import type { Currency } from "@/lib/money";

/* ---------- Invoices ---------- */
export type InvoiceSettings = {
  prefix: string; nextNumber: number; padding: number; currency: Currency; terms: string; dueBehavior: "terms" | "on_receipt" | "fixed_day";
  memo: string; footer: string; taxBehavior: "exclusive" | "inclusive" | "none";
  methods: string[]; hostedPage: boolean; partialPayments: boolean; reminders: { before3: boolean; onDue: boolean; after7: boolean }; autoCollect: boolean;
  emails: { created: boolean; sent: boolean; reminder: boolean; received: boolean; overdue: boolean };
  showLogo: boolean; showAddress: boolean; showTin: boolean; customFields: { label: string; value: string }[]; pageSize: "A4" | "Letter";
};
export const PAYMENT_TERMS = ["Due on receipt", "Net 7", "Net 14", "Net 30", "Net 60"];
export const invoiceSettingsStore = createDemoStore<InvoiceSettings>({
  prefix: "GRV-INV-", nextNumber: 1043, padding: 5, currency: "NGN", terms: "Net 14", dueBehavior: "terms",
  memo: "Thank you for your business.", footer: "Payment is due by the date shown. Bank transfers may take up to one business day to reflect.", taxBehavior: "exclusive",
  methods: ["Bank transfer", "Cards", "USSD"], hostedPage: true, partialPayments: false, reminders: { before3: true, onDue: true, after7: true }, autoCollect: false,
  emails: { created: false, sent: true, reminder: true, received: true, overdue: true },
  showLogo: true, showAddress: true, showTin: true, customFields: [{ label: "RC number", value: "RC 1849302" }], pageSize: "A4",
});
export const invoiceNumberPreview = (s: Pick<InvoiceSettings, "prefix" | "nextNumber" | "padding">) => `${s.prefix}${String(s.nextNumber).padStart(s.padding, "0")}`;

/* ---------- Payment links ---------- */
export type LinkSettings = {
  currency: Currency; collectName: boolean; collectEmail: "required" | "optional"; collectPhone: "off" | "optional" | "required"; billingAddress: "off" | "auto" | "required";
  confirmation: "message" | "redirect"; message: string; redirectUrl: string; sendReceipt: boolean; expiryDays: number | null;
  allowQuantity: boolean; promoCodes: boolean; useBranding: boolean; termsUrl: string;
};
export const linkSettingsStore = createDemoStore<LinkSettings>({
  currency: "NGN", collectName: true, collectEmail: "required", collectPhone: "optional", billingAddress: "off",
  confirmation: "message", message: "Thanks for your payment! A receipt is on its way to your email.", redirectUrl: "", sendReceipt: true, expiryDays: null,
  allowQuantity: false, promoCodes: false, useBranding: true, termsUrl: "",
});

/* ---------- Online store ---------- */
export type StoreSettings = {
  name: string; slug: string; description: string; email: string; phone: string; currency: Currency; visibility: "Live" | "Password protected" | "Offline"; password: string;
  orderEmail: boolean; orderSms: boolean; guestCheckout: boolean; minOrder: number; notesAtCheckout: boolean;
  pickup: boolean; delivery: boolean; flatRate: number; freeOver: number | null; zones: string[];
  returnDays: number; refundPolicy: string;
};
export const storeSettingsStore = createDemoStore<StoreSettings>({
  name: "Nova Retail", slug: "nova-retail", description: "Groceries and home essentials, delivered across Lagos.", email: "shop@novaretail.ng", phone: "+234 803 555 0142", currency: "NGN",
  visibility: "Live", password: "", orderEmail: true, orderSms: false, guestCheckout: true, minOrder: 2000, notesAtCheckout: true,
  pickup: true, delivery: true, flatRate: 1500, freeOver: 30000, zones: ["Lekki", "Victoria Island", "Ikoyi", "Ajah"], returnDays: 7,
  refundPolicy: "Unopened items can be returned within 7 days for a refund to the original payment method. Perishables can't be returned.",
});

/* ---------- POS ---------- */
export type PosLocation = { id: string; name: string; address: string; staff: number };
export type PosDevice = { id: string; name: string; serial: string; locationId: string; assignedTo: string; status: "Online" | "Offline" | "Pending pairing"; lastSeen: string | null };
export const posLocationsStore = createDemoStore<PosLocation[]>([
  { id: "loc_1", name: "Lekki flagship", address: "14 Admiralty Way, Lekki Phase 1", staff: 6 },
  { id: "loc_2", name: "Ikeja mall kiosk", address: "Ikeja City Mall, Obafemi Awolowo Way", staff: 2 },
]);
export const posDevicesStore = createDemoStore<PosDevice[]>([
  { id: "dev_1", name: "Front counter", serial: "GRV-P1-88213", locationId: "loc_1", assignedTo: "Ibrahim Musa", status: "Online", lastSeen: daysAgo(0, 13, 50) },
  { id: "dev_2", name: "Kiosk till", serial: "GRV-P1-88544", locationId: "loc_2", assignedTo: "Unassigned", status: "Offline", lastSeen: daysAgo(2, 19, 5) },
]);
export type PosSettings = { currency: Currency; printReceipt: "always" | "ask" | "never"; emailReceipt: boolean; receiptMessage: string; notifyEach: boolean; dailySummary: boolean; staffDiscounts: boolean; staffRefunds: boolean; pinLock: boolean };
export const posSettingsStore = createDemoStore<PosSettings>({ currency: "NGN", printReceipt: "ask", emailReceipt: true, receiptMessage: "Thank you! Keep this receipt for returns.", notifyEach: false, dailySummary: true, staffDiscounts: false, staffRefunds: false, pinLock: true });

/* ---------- Inventory ---------- */
export type InventorySettings = { tracking: boolean; threshold: number; lowEmail: boolean; lowInApp: boolean; outOfStock: "hide" | "show_sold_out" | "allow_backorder"; adjustRoles: string[]; requireReason: boolean; movementHistory: boolean; perLocation: boolean };
export const inventorySettingsStore = createDemoStore<InventorySettings>({ tracking: true, threshold: 10, lowEmail: true, lowInApp: true, outOfStock: "show_sold_out", adjustRoles: ["owner", "admin", "operations"], requireReason: true, movementHistory: true, perLocation: false });

/* ---------- Customers ---------- */
export type CustomerSettings = {
  requireEmail: boolean; requirePhone: boolean; collectAddress: boolean; dedupeBy: "email" | "phone" | "email_or_phone"; idFields: string[];
  receiptEmail: boolean; receiptSms: boolean; invoiceReminders: boolean; refundEmails: boolean; marketingConsent: boolean;
  exportRoles: string[]; deleteRoles: string[]; supportEmail: string; supportPhone: string; supportHours: string;
};
export const ID_FIELDS = ["Company name", "Tax ID (TIN)", "Customer reference", "Date of birth"];
export const customerSettingsStore = createDemoStore<CustomerSettings>({
  requireEmail: true, requirePhone: false, collectAddress: false, dedupeBy: "email_or_phone", idFields: ["Company name"],
  receiptEmail: true, receiptSms: false, invoiceReminders: true, refundEmails: true, marketingConsent: false,
  exportRoles: ["owner", "admin", "finance"], deleteRoles: ["owner", "admin"], supportEmail: "support@novaretail.ng", supportPhone: "+234 803 555 0142", supportHours: "Mon–Sat, 8am–7pm WAT",
});
