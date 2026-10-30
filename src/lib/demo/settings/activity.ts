/**
 * SAMPLE DATA — Security history (sign-ins and authentication changes) and Audit logs
 * (operational and configuration changes). Both are read-only in the UI; settings pages append
 * entries through logSecurity / logAudit so every change made in the demo shows up here.
 */
import { createDemoStore } from "@/lib/demo-store";
import { daysAgo, nowIso } from "@/lib/dates";
import { getMember, viewerStore } from "./access";

/** The device and network this demo session pretends to use. */
export const CURRENT_DEVICE = { id: "#93CFB9CE", label: "Chrome on macOS", ip: "105.112.216.228", location: "Lagos, NG" };

export type SecurityCategory = "Sign-in" | "Authentication" | "Session" | "API" | "Team" | "Suspicious";
export type SecurityEvent = {
  id: string; action: string; category: SecurityCategory; user: string; device: string; ip: string; location: string; at: string;
  outcome: "Success" | "Failed" | "Blocked"; details?: string | undefined;
};

const s = (id: string, action: string, category: SecurityCategory, user: string, d: number, h: number, extra: Partial<SecurityEvent> = {}): SecurityEvent => ({
  id, action, category, user, device: CURRENT_DEVICE.label, ip: CURRENT_DEVICE.ip, location: CURRENT_DEVICE.location, at: daysAgo(d, h, (h * 7) % 60), outcome: "Success", ...extra,
});

export const INITIAL_SECURITY: SecurityEvent[] = [
  s("sec_01", "Successful login", "Sign-in", "ada@novaretail.ng", 0, 9),
  s("sec_02", "Failed login", "Sign-in", "femi@novaretail.ng", 0, 7, { outcome: "Failed", device: "Safari on iPhone", ip: "102.89.34.17", location: "Ibadan, NG", details: "Wrong password entered 3 times." }),
  s("sec_03", "API key created", "API", "seyi@novaretail.ng", 1, 15, { device: "Firefox on Ubuntu", ip: "197.210.55.27", details: "Live secret key “Storefront server” created." }),
  s("sec_04", "Two-factor authentication enabled", "Authentication", "chioma@novaretail.ng", 2, 11, { device: "Chrome on Windows", ip: "197.255.62.106" }),
  s("sec_05", "Suspicious access detected", "Suspicious", "tunde@novaretail.ng", 3, 2, { outcome: "Blocked", device: "Unknown browser on Linux", ip: "45.133.1.88", location: "Amsterdam, NL", details: "Sign-in from a new country at an unusual time was blocked and needs email confirmation." }),
  s("sec_06", "Session revoked", "Session", "ada@novaretail.ng", 4, 18, { details: "Signed out “Safari on iPad” remotely." }),
  s("sec_07", "Passkey registered", "Authentication", "ada@novaretail.ng", 8, 10, { details: "Passkey “MacBook Touch ID” added." }),
  s("sec_08", "Password changed", "Authentication", "ibrahim@novaretail.ng", 9, 13, { device: "Chrome on Android", ip: "102.88.12.4", location: "Abuja, NG" }),
  s("sec_09", "API key revoked", "API", "seyi@novaretail.ng", 12, 16, { device: "Firefox on Ubuntu", ip: "197.210.55.27", details: "Test secret key “Old CI runner” revoked." }),
  s("sec_10", "Two-factor authentication disabled", "Authentication", "grace@novaretail.ng", 40, 9, { device: "Safari on iPhone", ip: "102.89.34.17", location: "Ibadan, NG" }),
  s("sec_11", "Successful login", "Sign-in", "tunde@novaretail.ng", 1, 16, { device: "Edge on Windows", ip: "197.255.62.106" }),
  s("sec_12", "Team member invited", "Team", "ada@novaretail.ng", 2, 12, { details: "Invited bola@novaretail.ng as Operations Manager." }),
];

export const securityStore = createDemoStore<SecurityEvent[]>(INITIAL_SECURITY);
export const useSecurityEvents = () => securityStore.use();

const viewerEmail = () => getMember(viewerStore.get())?.email ?? "you";
const viewerName = () => getMember(viewerStore.get())?.name ?? "You";

export function logSecurity(action: string, category: SecurityCategory, details?: string, outcome: SecurityEvent["outcome"] = "Success") {
  securityStore.set((all) => [{
    id: `sec_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, action, category, user: viewerEmail(),
    device: CURRENT_DEVICE.label, ip: CURRENT_DEVICE.ip, location: CURRENT_DEVICE.location, at: nowIso(), outcome, details,
  }, ...all]);
}

/* ---------- Audit logs ---------- */
export type AuditResult = "Success" | "Failed" | "Pending review" | "Pending approval";
export type AuditEvent = {
  id: string; action: string; resource: string; resourceType: string; actor: string; at: string; ip: string; result: AuditResult;
  before?: Record<string, string> | undefined; after?: Record<string, string> | undefined; refs?: string[] | undefined;
};

const a = (id: string, action: string, resourceType: string, resource: string, actor: string, d: number, h: number, extra: Partial<AuditEvent> = {}): AuditEvent => ({
  id, action, resourceType, resource, actor, at: daysAgo(d, h, (h * 11) % 60), ip: CURRENT_DEVICE.ip, result: "Success", ...extra,
});

export const INITIAL_AUDIT: AuditEvent[] = [
  a("aud_01", "Business information changed", "Business profile", "Support email", "Ada Okafor", 1, 10, { before: { "Support email": "hello@novaretail.ng" }, after: { "Support email": "support@novaretail.ng" } }),
  a("aud_02", "Team member invited", "Team", "bola@novaretail.ng", "Ada Okafor", 2, 12, { after: { Role: "Operations Manager" } }),
  a("aud_03", "Team role updated", "Team", "Chioma Eze", "Ada Okafor", 5, 15, { before: { Role: "Viewer" }, after: { Role: "Finance Manager" } }),
  a("aud_04", "Payment configuration changed", "Payment methods", "USSD", "Tunde Bakare", 6, 11, { before: { Status: "Disabled" }, after: { Status: "Enabled" } }),
  a("aud_05", "Settlement account added", "Settlement accounts", "Access Bank •••• 4410", "Tunde Bakare", 9, 9, { result: "Pending review", after: { Currency: "USD", Status: "Pending verification" } }),
  a("aud_06", "Approval rule changed", "Approvals", "Large payouts", "Ada Okafor", 10, 14, { before: { "Minimum amount": "₦2,000,000.00" }, after: { "Minimum amount": "₦5,000,000.00" } }),
  a("aud_07", "Payout approved", "Approvals", "PAY-7H2K9Q", "Chioma Eze", 11, 16, { refs: ["PAY-7H2K9Q", "APR-0042"] }),
  a("aud_08", "Payout rejected", "Approvals", "PAY-3M8T4X", "Tunde Bakare", 13, 10, { refs: ["PAY-3M8T4X", "APR-0039"] }),
  a("aud_09", "API configuration updated", "API keys", "Storefront server", "Seyi Adeyemi", 1, 15, { after: { Environment: "Live", Type: "Secret key" } }),
  a("aud_10", "Webhook configuration updated", "Webhooks", "https://api.novaretail.ng/hooks/griv", "Seyi Adeyemi", 4, 13, { before: { Events: "3 events" }, after: { Events: "5 events" } }),
  a("aud_11", "Invoice settings updated", "Invoice settings", "Default payment terms", "Ada Okafor", 15, 11, { before: { Terms: "Net 7" }, after: { Terms: "Net 14" } }),
  a("aud_12", "Product configuration changed", "Inventory settings", "Low-stock threshold", "Ibrahim Musa", 18, 9, { before: { Threshold: "5" }, after: { Threshold: "10" } }),
  a("aud_13", "Settlement account removed", "Settlement accounts", "Zenith Bank •••• 0981", "Ada Okafor", 30, 10),
  a("aud_14", "Payout approved", "Approvals", "PAY-1Q6R2Z", "Femi Ojo", 21, 12, { result: "Failed", after: { Reason: "Approver lacks Approve payouts permission" } }),
];

export const auditStore = createDemoStore<AuditEvent[]>(INITIAL_AUDIT);
export const useAuditEvents = () => auditStore.use();

export function logAudit(action: string, resourceType: string, resource: string, extra: Partial<Pick<AuditEvent, "before" | "after" | "refs" | "result">> = {}) {
  auditStore.set((all) => [{
    id: `aud_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, action, resourceType, resource, actor: viewerName(),
    at: nowIso(), ip: CURRENT_DEVICE.ip, result: "Success", ...extra,
  }, ...all]);
}

/** Compare two flat objects and return only the keys that changed, as display strings (for audit before/after). */
export function diffFields<T extends Record<string, unknown>>(before: T, after: T, labels: Partial<Record<keyof T, string>> = {}) {
  const b: Record<string, string> = {}, aft: Record<string, string> = {};
  for (const k of Object.keys(after) as (keyof T)[]) {
    const x = before[k], y = after[k];
    if (JSON.stringify(x) === JSON.stringify(y)) continue;
    const label = labels[k] ?? String(k);
    b[label] = fmt(x);
    aft[label] = fmt(y);
  }
  return { before: b, after: aft, changed: Object.keys(aft) };
}
const fmt = (v: unknown) => (typeof v === "boolean" ? (v ? "On" : "Off") : Array.isArray(v) ? v.join(", ") || "—" : v == null || v === "" ? "—" : String(v));
