/**
 * SAMPLE DATA — personal account security, business profile, branding and compliance.
 * Security actions that need a real sign-in service (passwords, new 2FA methods, passkeys) are validated
 * but never reported as done. Uploaded documents go to "In review" — never "Verified" just because they were uploaded.
 */
import { createDemoStore } from "@/lib/demo-store";
import { daysAgo, nowIso } from "@/lib/dates";
import type { Currency } from "@/lib/money";

/* ---------- Personal preferences ---------- */
export type PersonalPrefs = {
  backupEmail: string; language: string; timeZone: string; dateFormat: string; numberFormat: string;
  /** Email/phone changes waiting for the user to confirm a code. */
  pendingEmail: string | null; pendingPhone: string | null;
};
export const personalStore = createDemoStore<PersonalPrefs>({
  backupEmail: "", language: "English (Nigeria)", timeZone: "Africa/Lagos (WAT, UTC+1)", dateFormat: "22 Oct 2026", numberFormat: "1,234,567.89",
  pendingEmail: null, pendingPhone: null,
});
export const LANGUAGES = ["English (Nigeria)", "English (United Kingdom)", "English (United States)", "Français"];
export const TIME_ZONES = ["Africa/Lagos (WAT, UTC+1)", "Africa/Accra (GMT, UTC+0)", "Africa/Nairobi (EAT, UTC+3)", "Africa/Johannesburg (SAST, UTC+2)", "Europe/London (GMT/BST)"];
export const DATE_FORMATS = ["22 Oct 2026", "22/10/2026", "10/22/2026", "2026-10-22"];
export const NUMBER_FORMATS = ["1,234,567.89", "1.234.567,89", "1 234 567,89"];

/* ---------- Sign-in methods ---------- */
export type AuthMethod = { id: string; type: "Authenticator app" | "SMS" | "Passkey" | "Security key"; label: string; primary: boolean; addedAt: string };
export const authMethodsStore = createDemoStore<AuthMethod[]>([
  { id: "am_1", type: "Authenticator app", label: "Google Authenticator", primary: true, addedAt: daysAgo(180) },
  { id: "am_2", type: "SMS", label: "+234 ••• ••• 4821", primary: false, addedAt: daysAgo(210) },
]);
export type Passkey = { id: string; name: string; createdAt: string; lastUsed: string | null };
export const passkeysStore = createDemoStore<Passkey[]>([
  { id: "pk_1", name: "MacBook Touch ID", createdAt: daysAgo(8, 10), lastUsed: daysAgo(0, 9) },
]);
export const securityMetaStore = createDemoStore({ passwordUpdatedAt: daysAgo(64), recoveryCodesLeft: 8 });

/* ---------- Sessions ---------- */
export type Session = { id: string; device: string; browser: string; os: string; location: string; ip: string; lastActive: string; current: boolean };
export const sessionsStore = createDemoStore<Session[]>([
  { id: "ses_1", device: "MacBook Pro", browser: "Chrome 141", os: "macOS 15", location: "Lagos, NG", ip: "105.112.216.228", lastActive: daysAgo(0, 14), current: true },
  { id: "ses_2", device: "iPhone 15", browser: "Griv app", os: "iOS 26", location: "Lagos, NG", ip: "102.89.34.17", lastActive: daysAgo(0, 8, 40), current: false },
  { id: "ses_3", device: "Windows PC", browser: "Edge 140", os: "Windows 11", location: "Abuja, NG", ip: "197.255.62.106", lastActive: daysAgo(3, 17, 5), current: false },
  { id: "ses_4", device: "iPad Air", browser: "Safari 26", os: "iPadOS 26", location: "Ibadan, NG", ip: "102.88.12.4", lastActive: daysAgo(9, 20, 30), current: false },
]);

/* ---------- Business profile ---------- */
export type BusinessProfile = {
  legalName: string; tradingName: string; businessType: string; industry: string; description: string; website: string;
  supportEmail: string; supportPhone: string; defaultCurrency: Currency;
  country: string; state: string; city: string; line1: string; line2: string; postalCode: string;
  regNumber: string; regAuthority: string; regDate: string; tin: string; entityType: string;
  publicName: string; showAddressOn: string[]; showPhoneOn: string[]; showEmailOn: string[];
  contacts: { role: string; name: string; email: string; phone: string }[];
};
export const PUBLIC_SURFACES = ["Invoices", "Payment links", "Checkout pages", "Receipts", "Online store"];
/** Fields checked during verification. Changing them goes to review instead of applying straight away. */
export const VERIFIED_FIELDS: (keyof BusinessProfile)[] = ["legalName", "regNumber", "regAuthority", "regDate", "tin", "entityType", "businessType"];

export const businessStore = createDemoStore<BusinessProfile>({
  legalName: "Nova Retail Limited", tradingName: "Nova Retail", businessType: "Limited liability company", industry: "Retail & e-commerce",
  description: "Everyday groceries, drinks and home essentials, in store in Lekki and online across Lagos.", website: "https://novaretail.ng",
  supportEmail: "support@novaretail.ng", supportPhone: "+234 803 555 0142", defaultCurrency: "NGN",
  country: "Nigeria", state: "Lagos", city: "Lekki", line1: "14 Admiralty Way", line2: "Lekki Phase 1", postalCode: "105102",
  regNumber: "RC 1849302", regAuthority: "Corporate Affairs Commission (CAC)", regDate: "2019-03-14", tin: "23849102-0001", entityType: "Private company limited by shares",
  publicName: "Nova Retail", showAddressOn: ["Invoices", "Receipts"], showPhoneOn: ["Invoices", "Checkout pages", "Receipts", "Online store"], showEmailOn: ["Invoices", "Payment links", "Checkout pages", "Receipts", "Online store"],
  contacts: [
    { role: "Primary contact", name: "Ada Okafor", email: "ada@novaretail.ng", phone: "+234 803 555 0101" },
    { role: "Finance contact", name: "Tunde Bakare", email: "finance@novaretail.ng", phone: "+234 803 555 0122" },
    { role: "Technical contact", name: "Seyi Adeyemi", email: "dev@novaretail.ng", phone: "" },
  ],
});
/** Verified-field edits waiting for Griv's compliance team. */
export const pendingProfileStore = createDemoStore<{ changes: Partial<BusinessProfile>; submittedAt: string } | null>(null);

export function splitVerifiedChanges(before: BusinessProfile, after: BusinessProfile) {
  const direct: Partial<BusinessProfile> = {}, review: Partial<BusinessProfile> = {};
  for (const k of Object.keys(after) as (keyof BusinessProfile)[]) {
    if (JSON.stringify(before[k]) === JSON.stringify(after[k])) continue;
    (VERIFIED_FIELDS.includes(k) ? review : direct)[k] = after[k] as never;
  }
  return { direct, review };
}

/* ---------- Branding ---------- */
export type Branding = {
  logo: string | null; squareLogo: string | null; brandColor: string; accentColor: string; displayName: string;
  supportContact: string; customerDescription: string; receiptFooter: string; invoiceFooter: string;
};
export const brandingStore = createDemoStore<Branding>({
  logo: null, squareLogo: null, brandColor: "#f76905", accentColor: "#291107", displayName: "Nova Retail",
  supportContact: "support@novaretail.ng · +234 803 555 0142", customerDescription: "Groceries and home essentials, delivered across Lagos.",
  receiptFooter: "Thank you for shopping with Nova Retail. Returns accepted within 7 days with this receipt.",
  invoiceFooter: "Payment is due by the date shown. Bank transfers may take up to one business day to reflect.",
});
export const HEX = /^#[0-9a-fA-F]{6}$/;
/** Pick readable text (dark or white) for a background colour. */
export function readableOn(hex: string) {
  if (!HEX.test(hex)) return "#ffffff";
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? "#1a1a1a" : "#ffffff";
}

/* ---------- Compliance ---------- */
export type VerificationStatus = "Not started" | "In progress" | "Pending review" | "Verified" | "Requires action" | "Rejected";
export const VERIFICATION_COPY: Record<VerificationStatus, { title: string; body: string; next: string }> = {
  "Not started": { title: "Verification hasn't started", body: "Live payments stay limited until your business is verified.", next: "Upload your registration documents to begin." },
  "In progress": { title: "Verification in progress", body: "Some documents are uploaded, but a few are still missing.", next: "Upload the remaining required documents." },
  "Pending review": { title: "Waiting for Griv's review", body: "Everything required is uploaded. Reviews usually take 1–2 business days.", next: "Nothing to do now — we'll email you when the review is done." },
  Verified: { title: "Your business is verified", body: "All Griv products are available, within your account limits.", next: "Keep documents up to date when your details change." },
  "Requires action": { title: "We need something from you", body: "A reviewer asked for more information before verification can finish.", next: "Answer the open request below." },
  Rejected: { title: "Verification was not approved", body: "A document didn't meet requirements. Live payments remain limited.", next: "Read the reviewer's note and upload a corrected document." },
};

export type DocStatus = "Missing" | "In review" | "Accepted" | "Rejected" | "Expired";
export type ComplianceDoc = {
  id: string; name: string; requirement: "Required" | "Optional" | "Required if applicable"; section: "Business" | "Tax" | "Ownership";
  status: DocStatus; uploadedAt: string | null; updatedAt: string | null; fileName: string | null; note?: string | undefined;
};
export const docsStore = createDemoStore<ComplianceDoc[]>([
  { id: "doc_cac", name: "Certificate of incorporation", requirement: "Required", section: "Business", status: "Accepted", uploadedAt: daysAgo(190), updatedAt: daysAgo(186), fileName: "nova-cac-certificate.pdf" },
  { id: "doc_memart", name: "Memorandum and articles of association", requirement: "Required", section: "Business", status: "Accepted", uploadedAt: daysAgo(190), updatedAt: daysAgo(186), fileName: "memart.pdf" },
  { id: "doc_status", name: "CAC status report (Form CAC 1.1)", requirement: "Required", section: "Business", status: "Rejected", uploadedAt: daysAgo(20), updatedAt: daysAgo(18), fileName: "status-report-2019.pdf", note: "The report must be issued within the last 12 months." },
  { id: "doc_address", name: "Proof of business address", requirement: "Required", section: "Business", status: "In review", uploadedAt: daysAgo(4), updatedAt: daysAgo(4), fileName: "lekki-utility-bill.jpg" },
  { id: "doc_tin", name: "Tax identification (TIN) certificate", requirement: "Required", section: "Tax", status: "Accepted", uploadedAt: daysAgo(190), updatedAt: daysAgo(186), fileName: "firs-tin.pdf" },
  { id: "doc_vat", name: "VAT registration certificate", requirement: "Required if applicable", section: "Tax", status: "Missing", uploadedAt: null, updatedAt: null, fileName: null },
  { id: "doc_ubo", name: "Register of beneficial owners (PSC)", requirement: "Required", section: "Ownership", status: "Missing", uploadedAt: null, updatedAt: null, fileName: null },
  { id: "doc_licence", name: "Operating licence", requirement: "Optional", section: "Business", status: "Missing", uploadedAt: null, updatedAt: null, fileName: null },
]);

export const DOC_TYPES = ["application/pdf", "image/jpeg", "image/png"];
export const MAX_DOC_MB = 10;
export function validateDocFile(f: { type: string; size: number; name: string }) {
  if (!DOC_TYPES.includes(f.type)) return "Upload a PDF, JPG or PNG file.";
  if (f.size > MAX_DOC_MB * 1024 * 1024) return `Files must be ${MAX_DOC_MB} MB or smaller.`;
  if (f.size === 0) return "This file is empty.";
  return null;
}

/** Overall status from the documents and open requests. Uploading alone never makes anything "Verified". */
export function overallVerification(docs: ComplianceDoc[], openRequests: number, decided?: "Verified" | "Rejected"): VerificationStatus {
  if (decided) return decided;
  const required = docs.filter((d) => d.requirement === "Required");
  if (docs.every((d) => d.status === "Missing")) return "Not started";
  if (openRequests > 0 || required.some((d) => d.status === "Rejected" || d.status === "Expired")) return "Requires action";
  if (required.some((d) => d.status === "Missing")) return "In progress";
  if (required.every((d) => d.status === "Accepted")) return "Pending review";
  return "Pending review";
}

export type Person = { id: string; name: string; role: string; ownership: number | null; nationality: string; idStatus: "Verified" | "In review" | "Missing" };
export const peopleStore = createDemoStore<Person[]>([
  { id: "p_1", name: "Ada Okafor", role: "Director, shareholder", ownership: 60, nationality: "Nigerian", idStatus: "Verified" },
  { id: "p_2", name: "Kunle Okafor", role: "Shareholder", ownership: 30, nationality: "Nigerian", idStatus: "In review" },
  { id: "p_3", name: "Tunde Bakare", role: "Director (finance)", ownership: null, nationality: "Nigerian", idStatus: "Missing" },
]);

export type InfoRequest = { id: string; title: string; detail: string; askedAt: string; status: "Open" | "Answered"; answer?: string | undefined };
export const infoRequestsStore = createDemoStore<InfoRequest[]>([
  { id: "rq_1", title: "Explain the 10% unaccounted ownership", detail: "The shareholders listed add up to 90%. Tell us who holds the remaining 10%, or upload an updated register of members.", askedAt: daysAgo(3, 11), status: "Open" },
]);

export type HistoryItem = { label: string; at: string; note?: string | undefined; tone?: "success" | "danger" | "pending" | "info" | undefined };
export const verificationHistoryStore = createDemoStore<HistoryItem[]>([
  { label: "Additional information requested", at: daysAgo(3, 11), note: "Ownership adds up to 90%.", tone: "pending" },
  { label: "CAC status report rejected", at: daysAgo(18, 10), note: "Report older than 12 months.", tone: "danger" },
  { label: "Proof of address uploaded", at: daysAgo(4, 9), tone: "info" },
  { label: "Core documents accepted", at: daysAgo(186, 15), tone: "success" },
  { label: "Verification started", at: daysAgo(190, 9), tone: "info" },
]);
export const addHistory = (label: string, note?: string, tone: HistoryItem["tone"] = "info") =>
  verificationHistoryStore.set((all) => [{ label, at: nowIso(), note, tone }, ...all]);
