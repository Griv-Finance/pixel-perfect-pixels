/**
 * SAMPLE DATA — payment methods, settlement accounts and preferences, fees and limits, and approval workflows.
 * Nothing here moves money. New settlement accounts stay "Pending verification" until a real provider confirms them,
 * and an approved request never completes the payout it guards — that still needs the payment provider.
 */
import { createDemoStore } from "@/lib/demo-store";
import { daysAgo, nowIso } from "@/lib/dates";
import type { Currency } from "@/lib/money";
import { can, getMember, getRole, viewerStore } from "./access";

/* ---------- Payment methods ---------- */
export type PaymentMethod = {
  id: string; name: string; category: "Bank transfer" | "Cards" | "Mobile money" | "Other";
  description: string; currencies: Currency[]; available: boolean; unavailableReason?: string | undefined; enabled: boolean;
  /** Small, method-specific options. */
  options?: { key: string; label: string; value: boolean }[] | undefined;
};

export const paymentMethodsStore = createDemoStore<PaymentMethod[]>([
  { id: "pm_transfer", name: "Bank transfer", category: "Bank transfer", description: "Customers pay into a one-time or dedicated account number.", currencies: ["NGN"], available: true, enabled: true,
    options: [{ key: "dedicated", label: "Give repeat customers a dedicated account number", value: true }] },
  { id: "pm_ussd", name: "USSD", category: "Bank transfer", description: "Pay by dialling a bank short code — no internet needed.", currencies: ["NGN"], available: true, enabled: true },
  { id: "pm_paywithbank", name: "Pay with bank app", category: "Bank transfer", description: "Customers approve the payment in their banking app.", currencies: ["NGN"], available: true, enabled: false },
  { id: "pm_cards_local", name: "Verve, Visa and Mastercard (local)", category: "Cards", description: "Cards issued in Nigeria, with 3-D Secure.", currencies: ["NGN"], available: true, enabled: true,
    options: [{ key: "save_cards", label: "Let customers save cards for faster checkout", value: false }] },
  { id: "pm_cards_intl", name: "International cards", category: "Cards", description: "Visa, Mastercard and Amex cards issued outside Nigeria.", currencies: ["USD", "NGN"], available: true, enabled: false },
  { id: "pm_momo_gh", name: "MTN MoMo and Telecel Cash", category: "Mobile money", description: "Mobile money wallets in Ghana.", currencies: ["GHS"], available: false, unavailableReason: "Needs a verified Ghana business entity." },
  { id: "pm_mpesa", name: "M-Pesa", category: "Mobile money", description: "Mobile money wallets in Kenya.", currencies: ["KES"], available: false, unavailableReason: "Not yet offered for Nigerian businesses." },
  { id: "pm_qr", name: "NQR (scan to pay)", category: "Other", description: "Customers scan a QR code with their bank app.", currencies: ["NGN"], available: true, enabled: false },
  { id: "pm_applepay", name: "Apple Pay", category: "Other", description: "Wallet payments on Apple devices.", currencies: ["USD"], available: false, unavailableReason: "Not supported by Griv yet." },
].map((m) => ({ enabled: false, ...m })) as PaymentMethod[]);
export const usePaymentMethods = () => paymentMethodsStore.use();

/* ---------- Settlement accounts ---------- */
export type SettlementAccount = {
  id: string; bank: string; accountName: string; last4: string; currency: Currency; country: string;
  status: "Verified" | "Pending verification" | "Rejected"; isDefault: boolean; addedAt: string;
};

export const settlementAccountsStore = createDemoStore<SettlementAccount[]>([
  { id: "sa_1", bank: "Guaranty Trust Bank", accountName: "NOVA RETAIL LTD", last4: "2291", currency: "NGN", country: "Nigeria", status: "Verified", isDefault: true, addedAt: daysAgo(200) },
  { id: "sa_2", bank: "Access Bank", accountName: "NOVA RETAIL LTD", last4: "4410", currency: "USD", country: "Nigeria", status: "Pending verification", isDefault: false, addedAt: daysAgo(9) },
  { id: "sa_3", bank: "Moniepoint MFB", accountName: "NOVA RETAIL LTD", last4: "7715", currency: "NGN", country: "Nigeria", status: "Verified", isDefault: false, addedAt: daysAgo(64) },
]);
export const useSettlementAccounts = () => settlementAccountsStore.use();

export const BANKS = ["Access Bank", "First Bank of Nigeria", "Guaranty Trust Bank", "Kuda MFB", "Moniepoint MFB", "Opay", "Stanbic IBTC", "United Bank for Africa", "Wema Bank", "Zenith Bank"];

export function validateAccountNumber(n: string) {
  if (!/^\d+$/.test(n)) return "Use digits only.";
  if (n.length !== 10) return "Nigerian account numbers (NUBAN) have 10 digits.";
  return null;
}

/** Only a verified account in the same currency can become the default. */
export function canSetDefault(a: SettlementAccount) {
  if (a.isDefault) return "Already the default.";
  if (a.status !== "Verified") return "Only verified accounts can receive settlements.";
  return null;
}

export function setDefaultAccount(id: string) {
  const acc = settlementAccountsStore.get().find((a) => a.id === id);
  if (!acc) return { error: "Account not found." };
  const why = canSetDefault(acc);
  if (why) return { error: why };
  settlementAccountsStore.set((all) => all.map((a) => (a.currency === acc.currency ? { ...a, isDefault: a.id === id } : a)));
  return {};
}

/* ---------- Settlement preferences ---------- */
export type SettlementSchedule = "daily_t1" | "weekly" | "manual";
export const SCHEDULES: { id: SettlementSchedule; label: string; description: string; eligible: boolean; reason?: string }[] = [
  { id: "daily_t1", label: "Daily (next business day)", description: "Each business day's successful payments settle the next business day (T+1). Weekend and public-holiday payments settle on the next business day.", eligible: true },
  { id: "weekly", label: "Weekly, every Monday", description: "The week's payments settle together on Monday, or the next business day if Monday is a holiday.", eligible: true },
  { id: "manual", label: "Hold in Griv balance", description: "Funds stay in your Griv balance until you withdraw them.", eligible: true },
];
export type SettlementPrefs = { currency: Currency; schedule: SettlementSchedule; destinationId: string; notifyOnSettle: boolean; notifyOnFail: boolean; minimumAmount: number; autoRetry: boolean };
export const settlementPrefsStore = createDemoStore<SettlementPrefs>({ currency: "NGN", schedule: "daily_t1", destinationId: "sa_1", notifyOnSettle: true, notifyOnFail: true, minimumAmount: 1000, autoRetry: true });

/* ---------- Fees & limits ---------- */
export type FeeRow = { product: string; type: string; currency: Currency; structure: string; min: string; max: string; limit: string };
export const TRANSACTION_FEES: FeeRow[] = [
  { product: "Payments", type: "Local card", currency: "NGN", structure: "1.5%", min: "—", max: "₦2,000.00", limit: "₦5,000,000.00 per transaction" },
  { product: "Payments", type: "International card", currency: "USD", structure: "3.9%", min: "—", max: "—", limit: "$5,000.00 per transaction" },
  { product: "Payments", type: "Bank transfer", currency: "NGN", structure: "1.0%", min: "₦10.00", max: "₦1,000.00", limit: "₦10,000,000.00 per transaction" },
  { product: "Payments", type: "USSD", currency: "NGN", structure: "1.0%", min: "—", max: "₦1,000.00", limit: "₦500,000.00 per transaction" },
  { product: "Transfers", type: "To any Nigerian bank", currency: "NGN", structure: "Flat ₦10.00 – ₦50.00 by amount", min: "₦10.00", max: "₦50.00", limit: "₦5,000,000.00 per transfer" },
  { product: "Virtual accounts", type: "Incoming transfer", currency: "NGN", structure: "0.5%", min: "—", max: "₦300.00", limit: "No per-transaction cap" },
  { product: "POS", type: "Card present", currency: "NGN", structure: "0.5%", min: "—", max: "₦100.00", limit: "₦2,000,000.00 per transaction" },
];
export const SETTLEMENT_FEES: FeeRow[] = [
  { product: "Settlements", type: "Next business day (T+1)", currency: "NGN", structure: "Free", min: "—", max: "—", limit: "—" },
  { product: "Settlements", type: "Manual withdrawal", currency: "NGN", structure: "Flat ₦50.00", min: "₦50.00", max: "₦50.00", limit: "₦10,000,000.00 per withdrawal" },
  { product: "Settlements", type: "USD domiciliary account", currency: "USD", structure: "Flat $5.00", min: "$5.00", max: "$5.00", limit: "$20,000.00 per withdrawal" },
];
export type LimitRow = { name: string; scope: string; currency: Currency; limit: string; used: number; cap: number };
export const PRODUCT_LIMITS: LimitRow[] = [
  { name: "Payment links", scope: "Per payment", currency: "NGN", limit: "₦5,000,000.00", used: 0, cap: 0 },
  { name: "Invoices", scope: "Per invoice", currency: "NGN", limit: "₦20,000,000.00", used: 0, cap: 0 },
  { name: "Bulk payouts", scope: "Recipients per batch", currency: "NGN", limit: "500 recipients", used: 0, cap: 0 },
  { name: "Virtual accounts", scope: "Active accounts", currency: "NGN", limit: "1,000 accounts", used: 214, cap: 1000 },
];
export const ACCOUNT_LIMITS: LimitRow[] = [
  { name: "Daily payouts", scope: "Per day", currency: "NGN", limit: "₦25,000,000.00", used: 8_450_000, cap: 25_000_000 },
  { name: "Monthly payouts", scope: "Per calendar month", currency: "NGN", limit: "₦300,000,000.00", used: 112_300_000, cap: 300_000_000 },
  { name: "Daily collections", scope: "Per day", currency: "NGN", limit: "₦50,000,000.00", used: 6_120_000, cap: 50_000_000 },
  { name: "USD payouts", scope: "Per month", currency: "USD", limit: "$50,000.00", used: 4_800, cap: 50_000 },
];

export type LimitReview = { id: string; limit: string; requested: string; reason: string; at: string; status: "Pending" };
export const limitReviewsStore = createDemoStore<LimitReview[]>([]);

/* ---------- Approvals ---------- */
export const APPROVAL_ACTIONS = [
  "Single payouts", "Bulk payouts", "Transfers", "Settlement account changes", "High-value transactions",
  "API credential changes", "Team permission changes",
] as const;
export type ApprovalAction = (typeof APPROVAL_ACTIONS)[number];
export const AMOUNT_ACTIONS: ApprovalAction[] = ["Single payouts", "Bulk payouts", "Transfers", "High-value transactions"];

export type ApprovalLevel = { roles: string[]; approvers: number };
export type ApprovalRule = {
  id: string; name: string; action: ApprovalAction; currency: Currency; min: number | null; max: number | null;
  levels: ApprovalLevel[]; allowSelfApproval: boolean; status: "Active" | "Inactive";
};

export const rulesStore = createDemoStore<ApprovalRule[]>([
  { id: "rule_1", name: "Large payouts", action: "Single payouts", currency: "NGN", min: 5_000_000, max: null, levels: [{ roles: ["finance", "admin"], approvers: 2 }], allowSelfApproval: false, status: "Active" },
  { id: "rule_2", name: "Bulk payouts", action: "Bulk payouts", currency: "NGN", min: 0, max: null, levels: [{ roles: ["finance"], approvers: 1 }, { roles: ["owner", "admin"], approvers: 1 }], allowSelfApproval: false, status: "Active" },
  { id: "rule_3", name: "New settlement accounts", action: "Settlement account changes", currency: "NGN", min: null, max: null, levels: [{ roles: ["owner"], approvers: 1 }], allowSelfApproval: false, status: "Active" },
  { id: "rule_4", name: "Live API keys", action: "API credential changes", currency: "NGN", min: null, max: null, levels: [{ roles: ["owner", "admin"], approvers: 1 }], allowSelfApproval: true, status: "Inactive" },
]);
export const useRules = () => rulesStore.use();

export function validateRule(r: Omit<ApprovalRule, "id">) {
  const e: Record<string, string> = {};
  if (!r.name.trim()) e["name"] = "Give the rule a name.";
  if (AMOUNT_ACTIONS.includes(r.action)) {
    if (r.min != null && r.min < 0) e["min"] = "Minimum can't be negative.";
    if (r.min != null && r.max != null && r.max <= r.min) e["max"] = "Maximum must be more than the minimum.";
  }
  if (!r.levels.length) e["levels"] = "Add at least one approval level.";
  r.levels.forEach((l, i) => {
    if (!l.roles.length) e[`level.${i}`] = "Pick at least one approver role.";
    else if (l.approvers < 1) e[`level.${i}`] = "At least one approver is needed.";
  });
  return e;
}

export type ApprovalDecision = { memberId: string; name: string; decision: "Approved" | "Rejected"; at: string; level: number; note?: string | undefined };
export type ApprovalRequest = {
  id: string; title: string; ruleId: string; requestedBy: string; amount: number | null; currency: Currency;
  createdAt: string; status: "Pending" | "Approved" | "Rejected"; decisions: ApprovalDecision[]; reference: string;
};

export const requestsStore = createDemoStore<ApprovalRequest[]>([
  { id: "APR-0051", title: "Payout to Dangote Flour Mills", ruleId: "rule_1", requestedBy: "mem_tunde", amount: 7_850_000, currency: "NGN", createdAt: daysAgo(0, 10, 4), status: "Pending", reference: "PAY-9K3D7F",
    decisions: [{ memberId: "mem_chioma", name: "Chioma Eze", decision: "Approved", at: daysAgo(0, 11, 20), level: 0 }] },
  { id: "APR-0050", title: "October salaries — 46 recipients", ruleId: "rule_2", requestedBy: "mem_chioma", amount: 18_420_000, currency: "NGN", createdAt: daysAgo(1, 9, 30), status: "Pending", reference: "BLK-2Q8M4R", decisions: [] },
  { id: "APR-0049", title: "Add settlement account Access Bank •••• 4410", ruleId: "rule_3", requestedBy: "mem_tunde", amount: null, currency: "USD", createdAt: daysAgo(9, 9, 10), status: "Pending", reference: "sa_2", decisions: [] },
  { id: "APR-0042", title: "Payout to Lagos Packaging Co.", ruleId: "rule_1", requestedBy: "mem_tunde", amount: 6_200_000, currency: "NGN", createdAt: daysAgo(11, 14), status: "Approved", reference: "PAY-7H2K9Q",
    decisions: [{ memberId: "mem_chioma", name: "Chioma Eze", decision: "Approved", at: daysAgo(11, 15), level: 0 }, { memberId: "mem_owner", name: "Ada Okafor", decision: "Approved", at: daysAgo(11, 16), level: 0 }] },
  { id: "APR-0039", title: "Payout to Unverified Vendor Ltd", ruleId: "rule_1", requestedBy: "mem_chioma", amount: 5_400_000, currency: "NGN", createdAt: daysAgo(13, 9), status: "Rejected", reference: "PAY-3M8T4X",
    decisions: [{ memberId: "mem_tunde", name: "Tunde Bakare", decision: "Rejected", at: daysAgo(13, 10), level: 0, note: "Vendor isn't onboarded yet." }] },
]);
export const useApprovalRequests = () => requestsStore.use();

/** Which level is waiting for approvals, and how many approvals are in so far across all levels. */
export function progress(req: ApprovalRequest, rule: ApprovalRule | undefined) {
  const levels = rule?.levels ?? [{ roles: [], approvers: 1 }];
  const required = levels.reduce((n, l) => n + l.approvers, 0);
  const approvals = req.decisions.filter((d) => d.decision === "Approved").length;
  let level = 0, counted = 0;
  for (; level < levels.length; level++) {
    const got = req.decisions.filter((d) => d.decision === "Approved" && d.level === level).length;
    counted += got;
    if (got < levels[level]!.approvers) break;
  }
  return { required, approvals, level: Math.min(level, levels.length - 1), done: level >= levels.length };
}

/** Why the current viewer can't approve this request, or null if they can. */
export function cannotApproveReason(req: ApprovalRequest, rule: ApprovalRule | undefined, memberId = viewerStore.get()): string | null {
  if (req.status !== "Pending") return "This request has already been decided.";
  if (!can("approvals.approve", memberId)) return "Your role can't approve requests.";
  if (req.requestedBy === memberId && !rule?.allowSelfApproval) return "You can't approve a request you made.";
  if (req.decisions.some((d) => d.memberId === memberId)) return "You've already approved this request.";
  const member = getMember(memberId);
  const p = progress(req, rule);
  const level = rule?.levels[p.level];
  if (level && member && !level.roles.includes(member.roleId)) {
    return `This step needs ${level.roles.map((r) => getRole(r)?.name ?? r).join(" or ")}.`;
  }
  return null;
}

export function decide(id: string, decision: "Approved" | "Rejected", note?: string) {
  const req = requestsStore.get().find((r) => r.id === id);
  if (!req) return { error: "Request not found." };
  const rule = rulesStore.get().find((r) => r.id === req.ruleId);
  const why = cannotApproveReason(req, rule);
  if (why) return { error: why };
  const me = viewerStore.get();
  const p = progress(req, rule);
  const d: ApprovalDecision = { memberId: me, name: getMember(me)?.name ?? "You", decision, at: nowIso(), level: p.level, note };
  const next: ApprovalRequest = { ...req, decisions: [...req.decisions, d] };
  if (decision === "Rejected") next.status = "Rejected";
  else if (progress(next, rule).done) next.status = "Approved";
  requestsStore.set((all) => all.map((r) => (r.id === id ? next : r)));
  return { request: next };
}
