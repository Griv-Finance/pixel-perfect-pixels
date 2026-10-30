/** SAMPLE DATA — the personal notification matrix: which events reach you by which channel. */
import { createDemoStore } from "@/lib/demo-store";

export type Channel = "email" | "sms" | "push" | "inApp";
export const CHANNELS: { id: Channel; label: string }[] = [
  { id: "email", label: "Email" }, { id: "sms", label: "SMS" }, { id: "push", label: "Push" }, { id: "inApp", label: "In-app" },
];

export type NotificationEvent = {
  id: string; label: string;
  /** Security-critical: always delivered by email and in-app; can't be switched off. */
  mandatory?: boolean | undefined;
  /** Channels Griv can't deliver this event on (shown disabled with a reason). */
  unavailable?: Channel[] | undefined;
};
export type NotificationGroup = { title: string; events: NotificationEvent[] };
export type NotificationTab = { id: string; label: string; groups: NotificationGroup[] };

const ev = (id: string, label: string, extra: Partial<NotificationEvent> = {}): NotificationEvent => ({ id, label, ...extra });
const noSms: Channel[] = ["sms"];

export const NOTIFICATION_TABS: NotificationTab[] = [
  { id: "account", label: "Account", groups: [
    { title: "Business profile and verification", events: [
      ev("biz_profile_updated", "Business profile updated"),
      ev("verification_required", "Business verification required", { mandatory: true }),
      ev("verification_approved", "Business verification approved"),
      ev("verification_rejected", "Business verification rejected", { mandatory: true }),
    ] },
    { title: "Team management", events: [
      ev("member_invited", "Team member invited", { unavailable: noSms }),
      ev("member_joined", "Team member joined", { unavailable: noSms }),
      ev("member_removed", "Team member removed"),
      ev("role_changed", "Role or permission changed"),
    ] },
    { title: "Approvals", events: [
      ev("approval_received", "Approval request received"),
      ev("approval_completed", "Approval request completed"),
    ] },
  ] },
  { id: "transactions", label: "Transactions & balances", groups: [
    { title: "Incoming payments", events: [
      ev("in_success", "Incoming payment successful"),
      ev("in_failed", "Incoming payment failed"),
      ev("funding_received", "Account funding received"),
    ] },
    { title: "Outgoing payments", events: [
      ev("out_initiated", "Outgoing payment initiated"),
      ev("out_completed", "Outgoing payment completed"),
      ev("out_failed", "Outgoing payment failed"),
      ev("transfer_pending", "Transfer pending"),
      ev("transfer_completed", "Transfer completed"),
    ] },
    { title: "Settlements and balances", events: [
      ev("settle_initiated", "Settlement initiated"),
      ev("settle_completed", "Settlement completed"),
      ev("settle_failed", "Settlement failed"),
      ev("balance_threshold", "Balance threshold reached"),
      ev("recon_issue", "Reconciliation issue detected"),
    ] },
  ] },
  { id: "commerce", label: "Payments & commerce", groups: [
    { title: "Invoices", events: [
      ev("inv_created", "Invoice created", { unavailable: noSms }),
      ev("inv_sent", "Invoice sent", { unavailable: noSms }),
      ev("inv_viewed", "Invoice viewed", { unavailable: noSms }),
      ev("inv_paid", "Invoice paid"),
      ev("inv_overdue", "Invoice overdue"),
    ] },
    { title: "Payment links and store", events: [
      ev("link_payment", "Payment link payment received"),
      ev("order_new", "New online store order"),
      ev("order_cancelled", "Order cancelled"),
      ev("order_fulfilled", "Order fulfilled", { unavailable: noSms }),
      ev("refund_initiated", "Refund initiated"),
      ev("refund_completed", "Refund completed"),
    ] },
    { title: "Inventory and POS", events: [
      ev("stock_low", "Inventory running low"),
      ev("stock_out", "Product out of stock"),
      ev("pos_completed", "POS transaction completed", { unavailable: noSms }),
    ] },
  ] },
  { id: "developers", label: "Developers & API", groups: [
    { title: "API", events: [
      ev("key_created", "API key created", { mandatory: true }),
      ev("key_revoked", "API key revoked", { mandatory: true }),
      ev("api_auth_failure", "API authentication failure"),
      ev("api_unusual", "Unusual API activity"),
    ] },
    { title: "Webhooks and integrations", events: [
      ev("webhook_failed", "Webhook delivery failed"),
      ev("webhook_disabled", "Webhook endpoint disabled"),
      ev("integration_disconnected", "Integration disconnected"),
      ev("api_disruption", "API service disruption"),
    ] },
  ] },
  { id: "security", label: "Security & compliance", groups: [
    { title: "Account security", events: [
      ev("new_device", "New device sign-in", { mandatory: true }),
      ev("suspicious_signin", "Suspicious sign-in attempt", { mandatory: true }),
      ev("password_changed", "Password changed", { mandatory: true }),
      ev("2fa_changed", "Two-factor authentication changed", { mandatory: true }),
      ev("recovery_changed", "Recovery method changed", { mandatory: true }),
      ev("sensitive_permission", "Sensitive permission updated"),
    ] },
    { title: "Compliance", events: [
      ev("compliance_review", "Compliance review requested", { mandatory: true }),
      ev("restriction_applied", "Account restriction applied", { mandatory: true }),
    ] },
  ] },
  { id: "updates", label: "Product updates", groups: [
    { title: "Griv updates", events: [
      ev("features", "New feature announcements", { unavailable: noSms }),
      ev("improvements", "Product improvements", { unavailable: noSms }),
      ev("maintenance", "Maintenance announcements"),
      ev("platform", "Platform updates", { unavailable: noSms }),
      ev("education", "Educational content", { unavailable: ["sms", "push"] }),
    ] },
  ] },
];

export const ALL_EVENTS = NOTIFICATION_TABS.flatMap((t) => t.groups.flatMap((g) => g.events));
export type Prefs = Record<string, Record<Channel, boolean>>;

/** Mandatory events are always on for email and in-app. */
export const isLocked = (e: NotificationEvent, c: Channel) => !!e.mandatory && (c === "email" || c === "inApp");
export const isUnavailable = (e: NotificationEvent, c: Channel) => !!e.unavailable?.includes(c);

function defaults(): Prefs {
  const p: Prefs = {};
  for (const e of ALL_EVENTS) {
    const quiet = ["inv_viewed", "inv_created", "features", "education", "platform", "member_joined"].includes(e.id);
    p[e.id] = { email: !quiet || e.id === "features", sms: ["out_failed", "settle_failed", "suspicious_signin", "in_success"].includes(e.id), push: ["in_success", "order_new", "stock_out", "approval_received"].includes(e.id), inApp: true };
  }
  return normalize(p);
}

/** Force locked channels on and unavailable channels off, whatever was saved. */
export function normalize(p: Prefs): Prefs {
  const out: Prefs = {};
  for (const e of ALL_EVENTS) {
    const row = { ...(p[e.id] ?? { email: false, sms: false, push: false, inApp: false }) };
    for (const c of CHANNELS) {
      if (isLocked(e, c.id)) row[c.id] = true;
      if (isUnavailable(e, c.id)) row[c.id] = false;
    }
    out[e.id] = row;
  }
  return out;
}

export function setPref(p: Prefs, eventId: string, channel: Channel, on: boolean): Prefs {
  return normalize({ ...p, [eventId]: { ...p[eventId]!, [channel]: on } });
}

export const prefsStore = createDemoStore<Prefs>(defaults());
export const usePrefs = () => prefsStore.use();
