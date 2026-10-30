import type { ComponentType } from "react";
import { PersonalDetailsPage } from "./PersonalDetails";
import { SecurityPage } from "./Security";
import { CommunicationPage } from "./Communication";
import { SessionsPage } from "./Sessions";
import { BusinessProfilePage } from "./BusinessProfile";
import { BrandingPage } from "./Branding";
import { CompliancePage } from "./Compliance";
import { TeamPage } from "./Team";
import { ApprovalsPage } from "./Approvals";
import { FeesLimitsPage, PaymentMethodsPage, SettlementAccountsPage, SettlementPreferencesPage, TaxPage } from "./Finance";
import { CustomerSettingsPage, InventorySettingsPage, InvoiceSettingsPage, LinkSettingsPage, PosSettingsPage, StoreSettingsPage } from "./Commerce";
import { ApiKeysPage, ApiLogsPage, IntegrationsPage, IpWhitelistPage, WebhooksPage } from "./Developers";
import { AccessRequestsPage, AuditLogsPage, ConnectedAppsPage, SecurityHistoryPage } from "./Monitoring";

/** One page component per settings slug in the registry. */
export const SETTINGS_PAGES: Record<string, ComponentType> = {
  "personal-details": PersonalDetailsPage,
  security: SecurityPage,
  communication: CommunicationPage,
  sessions: SessionsPage,
  "business-profile": BusinessProfilePage,
  branding: BrandingPage,
  compliance: CompliancePage,
  team: TeamPage,
  approvals: ApprovalsPage,
  "payment-methods": PaymentMethodsPage,
  "settlement-accounts": SettlementAccountsPage,
  "settlement-preferences": SettlementPreferencesPage,
  "fees-limits": FeesLimitsPage,
  tax: TaxPage,
  invoices: InvoiceSettingsPage,
  "payment-links": LinkSettingsPage,
  "online-store": StoreSettingsPage,
  pos: PosSettingsPage,
  inventory: InventorySettingsPage,
  customers: CustomerSettingsPage,
  "api-keys": ApiKeysPage,
  webhooks: WebhooksPage,
  "ip-whitelist": IpWhitelistPage,
  integrations: IntegrationsPage,
  "api-logs": ApiLogsPage,
  "security-history": SecurityHistoryPage,
  "audit-logs": AuditLogsPage,
  "access-requests": AccessRequestsPage,
  "connected-apps": ConnectedAppsPage,
};
