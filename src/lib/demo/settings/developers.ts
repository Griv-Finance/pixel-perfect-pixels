/**
 * SAMPLE DATA — developer settings. API keys, webhooks, IP rules and API logs each belong to one
 * environment (Test or Live); pages filter by the header's Test/Live switch and never show the other.
 * Secret keys are never stored in readable form: a new secret is shown once, then only its last 4 characters remain.
 */
import { createDemoStore } from "@/lib/demo-store";
import { daysAgo, nowIso } from "@/lib/dates";

export type Env = "test" | "live";
export const envOf = (live: boolean): Env => (live ? "live" : "test");
export const envLabel = (e: Env) => (e === "live" ? "Live" : "Test");

/** Only rows for the selected environment — the one rule every developer page follows. */
export const forEnv = <T extends { env: Env }>(rows: T[], env: Env) => rows.filter((r) => r.env === env);

/* ---------- API keys ---------- */
export type ApiKey = {
  id: string; env: Env; label: string; publicKey: string; secretLast4: string;
  createdAt: string; lastUsed: string | null; status: "Active" | "Revoked";
};

const rand = (n: number) => {
  const c = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < n; i++) s += c[Math.floor(Math.random() * c.length)];
  return s;
};

export const keyPrefix = (env: Env, kind: "pk" | "sk") => `${kind}_${env}_`;
export const maskSecret = (k: Pick<ApiKey, "env" | "secretLast4">) => `${keyPrefix(k.env, "sk")}••••••••••••${k.secretLast4}`;

export const apiKeysStore = createDemoStore<ApiKey[]>([
  { id: "key_l1", env: "live", label: "Storefront server", publicKey: "pk_live_7Hq2LmN4xRtV9bKc", secretLast4: "Q8vZ", createdAt: daysAgo(1, 15), lastUsed: daysAgo(0, 13), status: "Active" },
  { id: "key_l2", env: "live", label: "Accounting sync", publicKey: "pk_live_3Fz8PwK2yHsD6nJe", secretLast4: "m4Tq", createdAt: daysAgo(88, 10), lastUsed: daysAgo(2, 4), status: "Active" },
  { id: "key_t1", env: "test", label: "Local development", publicKey: "pk_test_9Ab4CdE6fGh8JkLm", secretLast4: "x2Wp", createdAt: daysAgo(120, 9), lastUsed: daysAgo(0, 11), status: "Active" },
  { id: "key_t2", env: "test", label: "Old CI runner", publicKey: "pk_test_2Nm5PqR7sTu9VwXy", secretLast4: "a7Kd", createdAt: daysAgo(200, 9), lastUsed: daysAgo(13, 3), status: "Revoked" },
]);
export const useApiKeys = () => apiKeysStore.use();

/** Create a key and return its full secret ONCE. Only the last 4 characters are kept afterwards. */
export function createApiKey(env: Env, label: string) {
  const secret = `${keyPrefix(env, "sk")}${rand(32)}`;
  const key: ApiKey = { id: `key_${Date.now().toString(36)}`, env, label: label.trim(), publicKey: `${keyPrefix(env, "pk")}${rand(16)}`, secretLast4: secret.slice(-4), createdAt: nowIso(), lastUsed: null, status: "Active" };
  apiKeysStore.set((all) => [key, ...all]);
  return { key, secret };
}

export function rotateApiKey(id: string) {
  const k = apiKeysStore.get().find((x) => x.id === id);
  if (!k || k.status !== "Active") return null;
  const secret = `${keyPrefix(k.env, "sk")}${rand(32)}`;
  apiKeysStore.set((all) => all.map((x) => (x.id === id ? { ...x, secretLast4: secret.slice(-4), lastUsed: null } : x)));
  return secret;
}

/* ---------- Webhooks ---------- */
export const WEBHOOK_EVENTS = [
  "charge.success", "charge.failed", "transfer.success", "transfer.failed", "transfer.reversed", "payout.pending", "payout.success",
  "payout.failed", "refund.processed", "invoice.created", "invoice.paid", "invoice.overdue", "paymentlink.payment", "order.created",
  "order.fulfilled", "settlement.completed", "virtualaccount.credited", "inventory.low",
] as const;

export type Delivery = { id: string; event: string; status: "Succeeded" | "Failed" | "Pending"; code: number | null; at: string; attempts: number; durationMs: number | null };
export type Webhook = {
  id: string; env: Env; url: string; description: string; events: string[]; enabled: boolean;
  secretLast4: string; createdAt: string; deliveries: Delivery[];
};

const dl = (id: string, event: string, ok: boolean, d: number, h: number): Delivery => ({ id, event, status: ok ? "Succeeded" : "Failed", code: ok ? 200 : 503, at: daysAgo(d, h, 12), attempts: ok ? 1 : 3, durationMs: ok ? 180 + ((d * 37) % 300) : 10000 });

export const webhooksStore = createDemoStore<Webhook[]>([
  { id: "wh_l1", env: "live", url: "https://api.novaretail.ng/hooks/griv", description: "Order and payment updates for the storefront", enabled: true,
    events: ["charge.success", "charge.failed", "order.created", "refund.processed", "invoice.paid"], secretLast4: "9fQe", createdAt: daysAgo(70, 10),
    deliveries: [dl("dlv_1", "charge.success", true, 0, 12), dl("dlv_2", "order.created", true, 0, 11), dl("dlv_3", "charge.failed", false, 1, 9), dl("dlv_4", "invoice.paid", true, 2, 15), dl("dlv_5", "refund.processed", false, 3, 18)] },
  { id: "wh_l2", env: "live", url: "https://hooks.ledgerly.io/griv/nova", description: "Accounting sync", enabled: false,
    events: ["settlement.completed", "payout.success"], secretLast4: "K2pa", createdAt: daysAgo(40, 10),
    deliveries: [dl("dlv_6", "settlement.completed", false, 6, 8), dl("dlv_7", "payout.success", false, 6, 9)] },
  { id: "wh_t1", env: "test", url: "https://nova-dev.ngrok.app/webhooks", description: "Local tunnel", enabled: true,
    events: [...WEBHOOK_EVENTS], secretLast4: "tT4n", createdAt: daysAgo(14, 10),
    deliveries: [dl("dlv_8", "charge.success", true, 0, 10), dl("dlv_9", "transfer.failed", true, 0, 10)] },
]);
export const useWebhooks = () => webhooksStore.use();

export const failureCount = (w: Webhook) => w.deliveries.filter((d) => d.status === "Failed").length;
export const lastDelivery = (w: Webhook) => [...w.deliveries].sort((a, b) => b.at.localeCompare(a.at))[0];

export function validateWebhookUrl(url: string, env: Env) {
  let u: URL;
  try { u = new URL(url.trim()); } catch { return "Enter a full URL, like https://example.com/webhooks."; }
  if (env === "live" && u.protocol !== "https:") return "Live endpoints must use https.";
  if (u.protocol !== "https:" && u.protocol !== "http:") return "Use an http or https URL.";
  if (env === "live" && /^(localhost|127\.|0\.0\.0\.0)/.test(u.hostname)) return "Live endpoints can't point at your own computer.";
  return null;
}

export const SAMPLE_PAYLOAD = (event: string) => JSON.stringify({
  event,
  data: { id: "txn_8K2Q4M", reference: "GRV-REF-3H7P", amount: 25000, currency: "NGN", status: event.endsWith("failed") ? "failed" : "success", customer: { email: "c•••@example.com" }, created_at: "2026-10-22T13:04:11Z" },
}, null, 2);

/* ---------- IP whitelist ---------- */
export type IpRule = { id: string; env: Env; value: string; label: string; addedAt: string; addedBy: string; status: "Active" | "Disabled" };

export const ipStore = createDemoStore<IpRule[]>([
  { id: "ip_1", env: "live", value: "105.112.216.228", label: "Lagos office", addedAt: daysAgo(60, 10), addedBy: "Seyi Adeyemi", status: "Active" },
  { id: "ip_2", env: "live", value: "34.89.120.0/24", label: "Storefront servers (GCP)", addedAt: daysAgo(58, 10), addedBy: "Seyi Adeyemi", status: "Active" },
  { id: "ip_3", env: "live", value: "2a05:d014:9e0::/48", label: "Backup region (AWS)", addedAt: daysAgo(20, 10), addedBy: "Ada Okafor", status: "Disabled" },
]);
export const useIpRules = () => ipStore.use();

const IPV4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
function isIpv6(s: string) {
  if (!/^[0-9a-fA-F:]+$/.test(s) || !s.includes(":")) return false;
  const dbl = s.split("::");
  if (dbl.length > 2) return false;
  const parts = s.split(":").filter((p, i, arr) => p !== "" || (i > 0 && i < arr.length - 1 && false));
  if (parts.some((p) => p.length > 4)) return false;
  return dbl.length === 2 ? parts.length < 8 : parts.length === 8;
}

/** Accepts IPv4, IPv6 and CIDR ranges (e.g. 10.0.0.0/24, 2001:db8::/32). Returns an error message or null. */
export function validateIpOrCidr(raw: string): string | null {
  const v = raw.trim();
  if (!v) return "Enter an IP address or CIDR range.";
  const [ip, mask, extra] = v.split("/");
  if (extra !== undefined) return "That doesn't look like a valid IP address or CIDR range.";
  const v4 = IPV4.test(ip!);
  const v6 = !v4 && isIpv6(ip!);
  if (!v4 && !v6) return "That doesn't look like a valid IP address or CIDR range.";
  if (mask !== undefined) {
    if (!/^\d{1,3}$/.test(mask)) return "The range after / must be a number.";
    const n = Number(mask);
    if (v4 && (n < 8 || n > 32)) return "IPv4 ranges must be between /8 and /32.";
    if (v6 && (n < 16 || n > 128)) return "IPv6 ranges must be between /16 and /128.";
  }
  return null;
}

/** Does an IPv4 address fall inside a rule (exact IP or IPv4 CIDR)? IPv6 rules never match an IPv4 address. */
export function ipMatches(ip: string, rule: string) {
  const [base, mask] = rule.split("/");
  if (!IPV4.test(base!) || !IPV4.test(ip)) return ip === rule;
  if (mask === undefined) return ip === base;
  const toInt = (s: string) => s.split(".").reduce((n, o) => (n << 8) + Number(o), 0) >>> 0;
  const m = Number(mask) === 0 ? 0 : (~0 << (32 - Number(mask))) >>> 0;
  return (toInt(ip) & m) === (toInt(base!) & m);
}

/** With an allowlist active, would API calls from this IP be blocked? */
export const wouldBlock = (ip: string, rules: IpRule[]) => {
  const active = rules.filter((r) => r.status === "Active");
  return active.length > 0 && !active.some((r) => ipMatches(ip, r.value));
};

/* ---------- Integrations ---------- */
export type Integration = { id: string; name: string; category: "Accounting" | "Communication" | "E-commerce" | "Analytics" | "Logistics"; description: string };
export const INTEGRATIONS: Integration[] = [
  { id: "quickbooks", name: "QuickBooks Online", category: "Accounting", description: "Sync payments, invoices and payouts into your books." },
  { id: "zoho", name: "Zoho Books", category: "Accounting", description: "Push settled transactions and fees to Zoho Books." },
  { id: "sage", name: "Sage Business Cloud", category: "Accounting", description: "Reconcile settlements against your Sage ledger." },
  { id: "slack", name: "Slack", category: "Communication", description: "Post payment, payout and approval alerts to a channel." },
  { id: "whatsapp", name: "WhatsApp Business", category: "Communication", description: "Send receipts and invoice reminders on WhatsApp." },
  { id: "shopify", name: "Shopify", category: "E-commerce", description: "Accept Griv payments at your Shopify checkout." },
  { id: "woocommerce", name: "WooCommerce", category: "E-commerce", description: "Griv checkout for WordPress stores." },
  { id: "gig", name: "GIG Logistics", category: "Logistics", description: "Create deliveries for online store orders." },
  { id: "ga4", name: "Google Analytics 4", category: "Analytics", description: "Track checkout conversions from payment links." },
];

/* ---------- API logs ---------- */
export type ApiLog = {
  id: string; env: Env; at: string; method: "GET" | "POST" | "PUT" | "DELETE"; endpoint: string; status: number; durationMs: number;
  ip: string; keyLabel: string; requestBody?: string | undefined; responseBody: string; error?: string | undefined;
};

const ENDPOINTS: [ApiLog["method"], string][] = [
  ["POST", "/v1/charges"], ["GET", "/v1/transactions"], ["POST", "/v1/transfers"], ["GET", "/v1/balances"], ["POST", "/v1/payment-links"],
  ["GET", "/v1/invoices/inv_7Q2K"], ["POST", "/v1/invoices"], ["POST", "/v1/refunds"], ["GET", "/v1/customers"], ["DELETE", "/v1/webhooks/wh_old"],
];
const STATUSES = [200, 200, 201, 200, 200, 400, 200, 401, 200, 404, 200, 422, 200, 500, 201, 429];

function makeLogs(env: Env, count: number): ApiLog[] {
  return Array.from({ length: count }, (_, i) => {
    const [method, endpoint] = ENDPOINTS[(i * 7 + (env === "live" ? 3 : 0)) % ENDPOINTS.length]!;
    const status = STATUSES[(i * 5 + (env === "live" ? 1 : 0)) % STATUSES.length]!;
    const ok = status < 400;
    const err = status === 400 ? "amount must be a positive number" : status === 401 ? "Invalid API key provided" : status === 404 ? "No such resource" : status === 422 ? "currency is not supported for this account" : status === 429 ? "Too many requests — slow down and retry" : status === 500 ? "Internal error — safe to retry with the same idempotency key" : undefined;
    return {
      id: `req_${env === "live" ? "L" : "T"}${(9100 - i * 37).toString(36).toUpperCase()}${i}`, env,
      at: daysAgo(Math.floor(i / 6), 23 - (i % 6) * 3, (i * 13) % 60), method, endpoint, status, durationMs: ok ? 90 + ((i * 53) % 400) : 40 + ((i * 17) % 120),
      ip: i % 4 === 0 ? "34.89.120.14" : "105.112.216.228", keyLabel: env === "live" ? (i % 3 ? "Storefront server" : "Accounting sync") : "Local development",
      requestBody: method === "GET" || method === "DELETE" ? undefined : JSON.stringify({ amount: 25000, currency: "NGN", customer: { email: "c•••@example.com" } }, null, 2),
      responseBody: JSON.stringify(ok ? { status: "success", data: { id: "obj_8K2Q4M" } } : { status: "error", message: err }, null, 2), error: err,
    };
  });
}
export const API_LOGS: ApiLog[] = [...makeLogs("live", 42), ...makeLogs("test", 30)];
