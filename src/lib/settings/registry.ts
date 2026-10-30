/**
 * The Settings directory: every setting page, its category, the words people search for,
 * and which permission is needed to change it. The homepage, search, breadcrumbs and
 * page permissions all read from this one list.
 */
import type { LucideIcon } from "lucide-react";
import {
  User, ShieldCheck, Mail, MonitorSmartphone, Building2, Palette, FileCheck2, Users, GitPullRequestArrow,
  CreditCard, Landmark, CalendarClock, Gauge, Percent, FileText, Link2, Store, Monitor, Boxes, Contact,
  KeyRound, Webhook, Network, Puzzle, Terminal, History, ScrollText, UserPlus, AppWindow,
} from "lucide-react";
import type { Permission } from "@/lib/demo/settings/access";

export type CategoryId = "personal" | "business" | "payments" | "commerce" | "developers" | "security";

export const CATEGORIES: { id: CategoryId; label: string; description: string }[] = [
  { id: "personal", label: "Personal settings", description: "Settings that only apply to you." },
  { id: "business", label: "Business settings", description: "Company details, team and controls." },
  { id: "payments", label: "Payments & finance", description: "How you collect, settle and pay." },
  { id: "commerce", label: "Products & commerce", description: "Defaults for invoices, links, store and POS." },
  { id: "developers", label: "Developers & integrations", description: "API access and connected services." },
  { id: "security", label: "Security & monitoring", description: "Who did what, and who has access." },
];

export type SettingEntry = {
  slug: string;
  name: string;
  description: string;
  category: CategoryId;
  icon: LucideIcon;
  keywords: string[];
  /** Permission needed to change this page. null = personal or read-only pages anyone signed in can use. */
  edit: Permission | null;
};

export const SETTINGS: SettingEntry[] = [
  // Personal
  { slug: "personal-details", name: "Personal details", category: "personal", icon: User, edit: null,
    description: "Manage your name, email address, phone number, and personal preferences.",
    keywords: ["profile", "name", "email", "phone", "language", "time zone", "timezone", "format", "account"] },
  { slug: "security", name: "Security & authentication", category: "personal", icon: ShieldCheck, edit: null,
    description: "Manage passwords, two-factor authentication, passkeys, and account protection.",
    keywords: ["password", "2fa", "two-factor", "two step", "authenticator", "passkey", "recovery codes", "mfa", "login"] },
  { slug: "communication", name: "Communication preferences", category: "personal", icon: Mail, edit: null,
    description: "Choose which notifications you receive and how they are delivered.",
    keywords: ["notifications", "email", "sms", "push", "alerts", "in-app"] },
  { slug: "sessions", name: "Active sessions", category: "personal", icon: MonitorSmartphone, edit: null,
    description: "Review devices and sessions currently signed in to your account.",
    keywords: ["devices", "sign out", "logout", "browser", "session"] },
  // Business
  { slug: "business-profile", name: "Business profile", category: "business", icon: Building2, edit: "business_settings.manage",
    description: "Manage company details, registration information, business address, and public information.",
    keywords: ["company", "address", "registration", "rc number", "cac", "tin", "legal", "website", "support"] },
  { slug: "branding", name: "Branding", category: "business", icon: Palette, edit: "business_settings.manage",
    description: "Customize business logos, colors, and customer-facing payment experiences.",
    keywords: ["logo", "color", "colour", "checkout", "receipt", "footer", "brand"] },
  { slug: "compliance", name: "Compliance & documents", category: "business", icon: FileCheck2, edit: "business_settings.manage",
    description: "Manage business verification, regulatory information, and required documents.",
    keywords: ["kyc", "kyb", "verification", "documents", "directors", "owners", "cac", "upload"] },
  { slug: "team", name: "Team & permissions", category: "business", icon: Users, edit: "team.manage",
    description: "Invite team members, assign roles, and control access.",
    keywords: ["members", "invite", "roles", "permissions", "users", "staff", "access", "team"] },
  { slug: "approvals", name: "Approvals", category: "business", icon: GitPullRequestArrow, edit: "approvals.manage",
    description: "Configure approval workflows for sensitive financial and administrative actions.",
    keywords: ["approval", "maker checker", "workflow", "payout approval", "dual control"] },
  // Payments & finance
  { slug: "payment-methods", name: "Payment methods", category: "payments", icon: CreditCard, edit: "business_settings.manage",
    description: "Configure supported payment methods and collection preferences.",
    keywords: ["cards", "bank transfer", "ussd", "mobile money", "collection"] },
  { slug: "settlement-accounts", name: "Settlement accounts", category: "payments", icon: Landmark, edit: "settlements.manage",
    description: "Manage bank accounts and other supported settlement destinations.",
    keywords: ["bank", "bank account", "payout account", "withdrawal account", "nuban"] },
  { slug: "settlement-preferences", name: "Settlement preferences", category: "payments", icon: CalendarClock, edit: "settlements.manage",
    description: "Configure settlement currencies, schedules, and preferences.",
    keywords: ["schedule", "t+1", "settlement currency", "auto settlement", "bank"] },
  { slug: "fees-limits", name: "Fees & limits", category: "payments", icon: Gauge, edit: "business_settings.manage",
    description: "View applicable fees, transaction limits, and product restrictions.",
    keywords: ["pricing", "charges", "limits", "caps", "transaction limit"] },
  { slug: "tax", name: "Tax settings", category: "payments", icon: Percent, edit: "business_settings.manage",
    description: "Manage tax information and default tax behavior.",
    keywords: ["vat", "tax rate", "tin", "inclusive", "exclusive", "exemption"] },
  // Commerce
  { slug: "invoices", name: "Invoice settings", category: "commerce", icon: FileText, edit: "business_settings.manage",
    description: "Configure invoice defaults, numbering, payment terms, and reminders.",
    keywords: ["invoice", "numbering", "prefix", "payment terms", "reminders", "memo", "footer", "pdf"] },
  { slug: "payment-links", name: "Payment link settings", category: "commerce", icon: Link2, edit: "business_settings.manage",
    description: "Manage default payment link behavior and customer checkout preferences.",
    keywords: ["payment link", "checkout", "redirect", "expiry", "receipt"] },
  { slug: "online-store", name: "Online store settings", category: "commerce", icon: Store, edit: "business_settings.manage",
    description: "Manage storefront information, order preferences, and commerce configurations.",
    keywords: ["store", "storefront", "shipping", "returns", "refund policy", "orders"] },
  { slug: "pos", name: "POS settings", category: "commerce", icon: Monitor, edit: "business_settings.manage",
    description: "Configure point-of-sale devices, locations, and receipt preferences.",
    keywords: ["pos", "terminal", "device", "location", "branch", "receipt"] },
  { slug: "inventory", name: "Inventory settings", category: "commerce", icon: Boxes, edit: "business_settings.manage",
    description: "Configure stock alerts, inventory tracking, and stock management defaults.",
    keywords: ["stock", "low stock", "inventory", "out of stock", "threshold"] },
  { slug: "customers", name: "Customer settings", category: "commerce", icon: Contact, edit: "business_settings.manage",
    description: "Configure customer records, communication defaults, and customer-facing preferences.",
    keywords: ["customer", "receipts", "customer emails", "support details", "data access"] },
  // Developers
  { slug: "api-keys", name: "API keys", category: "developers", icon: KeyRound, edit: "developers.manage",
    description: "Manage credentials used to connect applications to Griv.",
    keywords: ["api", "keys", "secret key", "public key", "credentials", "developers", "token"] },
  { slug: "webhooks", name: "Webhooks", category: "developers", icon: Webhook, edit: "developers.manage",
    description: "Configure webhook endpoints, subscribed events, and delivery behavior.",
    keywords: ["api", "webhook", "events", "endpoint", "callback", "developers"] },
  { slug: "ip-whitelist", name: "IP whitelist", category: "developers", icon: Network, edit: "developers.manage",
    description: "Restrict sensitive API access to approved IP addresses.",
    keywords: ["ip", "allowlist", "whitelist", "cidr", "firewall", "api"] },
  { slug: "integrations", name: "Integrations", category: "developers", icon: Puzzle, edit: "developers.manage",
    description: "Manage external services and connected applications.",
    keywords: ["integrations", "apps", "accounting", "quickbooks", "zoho", "slack", "connect"] },
  { slug: "api-logs", name: "API logs", category: "developers", icon: Terminal, edit: null,
    description: "Inspect API requests, errors, and integration activity.",
    keywords: ["api", "logs", "requests", "errors", "debug", "developers"] },
  // Security & monitoring
  { slug: "security-history", name: "Security history", category: "security", icon: History, edit: null,
    description: "Review sign-ins, authentication changes, and suspicious access events.",
    keywords: ["sign-in", "login history", "security events", "suspicious", "password"] },
  { slug: "audit-logs", name: "Audit logs", category: "security", icon: ScrollText, edit: null,
    description: "Review administrative, operational, and configuration changes.",
    keywords: ["audit", "activity", "changes", "history", "who changed"] },
  { slug: "access-requests", name: "Access requests", category: "security", icon: UserPlus, edit: "team.manage",
    description: "Review and manage requests for additional permissions.",
    keywords: ["access", "request", "permission request", "team"] },
  { slug: "connected-apps", name: "Connected applications", category: "security", icon: AppWindow, edit: "developers.manage",
    description: "Review applications authorized to access the business account.",
    keywords: ["oauth", "apps", "authorized apps", "third party", "revoke"] },
];

export const getSetting = (slug: string) => SETTINGS.find((s) => s.slug === slug);
export const categoryLabel = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)?.label ?? "";

/**
 * Settings search: matches name, category, description and keywords.
 * Name and keyword hits rank above description-only hits.
 */
export function searchSettings(query: string): SettingEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return SETTINGS;
  const words = q.split(/\s+/);
  const scored = SETTINGS.map((s) => {
    const name = s.name.toLowerCase();
    const cat = categoryLabel(s.category).toLowerCase();
    const desc = s.description.toLowerCase();
    const keys = s.keywords.join(" ").toLowerCase();
    let score = 0;
    for (const w of words) {
      if (name.includes(w)) score += 6;
      else if (keys.includes(w)) score += 4;
      else if (cat.includes(w)) score += 2;
      else if (desc.includes(w)) score += 1;
      else return { s, score: 0 };
    }
    return { s, score };
  });
  return scored.filter((x) => x.score > 0).sort((a, b) => b.score - a.score).map((x) => x.s);
}
