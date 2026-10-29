import { useState } from "react";
import { Link2, ReceiptText } from "lucide-react";
import { GettingStarted } from "./GettingStarted";
import { PaymentsSection } from "./PaymentsSection";
import { BalancesSection } from "./BalancesSection";
import { CollectionSection } from "./CollectionSection";
import { EcommerceSection } from "./EcommerceSection";
import { DateRangeSelect, FilterSelect } from "@/components/griv/kit/filters";
import { DASHBOARD_CURRENCIES, invoiceStats, linkStats } from "@/lib/demo/dashboard";
import type { DateRange } from "@/lib/dates";
import { useLedger } from "@/lib/demo/ledger";
import { useAccounts } from "@/lib/demo/accounts";
import { PAYMENT_LINKS } from "@/lib/demo/payment-links";
import { INVOICES } from "@/lib/demo/invoices";
import { useOrders } from "@/lib/demo/orders";
import type { Currency } from "@/lib/money";

/**
 * One unified merchant dashboard (MailerLite-inspired): an onboarding checklist that hides
 * once done, then a single Performance overview card holding Payments, Balances & settlements,
 * Payment links, Invoices and E-commerce — all driven by the same period + currency selectors.
 */
export function UnifiedDashboard() {
  const ledger = useLedger();
  const accounts = useAccounts();
  const orders = useOrders();
  const [range, setRange] = useState<DateRange>("Last 30 days");
  const [currency, setCurrency] = useState<Currency>("NGN");
  const [linkId, setLinkId] = useState("all");
  const [invoiceId, setInvoiceId] = useState("all");

  const links = linkStats(PAYMENT_LINKS, linkId, range);
  const invoices = invoiceStats(INVOICES, invoiceId, range);
  const linkOptions = [
    { value: "all", label: "All active payment links" },
    ...PAYMENT_LINKS.filter((l) => l.status === "Active").map((l) => ({ value: l.id, label: l.name })),
  ];
  const invoiceOptions = [
    { value: "all", label: "All active invoices" },
    ...INVOICES.filter((r) => r.status !== "Draft" && r.status !== "Cancelled").map((r) => ({ value: r.id, label: r.id })),
  ];

  return (
    <div className="space-y-4">
      <GettingStarted />

      <section className="overflow-hidden rounded-lg border bg-card">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-5 py-3">
          <h2 className="text-base font-semibold">Performance overview</h2>
          <div className="flex flex-wrap items-center gap-2">
            <DateRangeSelect value={range} onChange={setRange} />
            <FilterSelect
              label="Currency"
              value={currency}
              onChange={(v) => setCurrency(v as Currency)}
              options={DASHBOARD_CURRENCIES.map((c) => ({ value: c, label: c }))}
            />
          </div>
        </header>

        <PaymentsSection ledger={ledger} currency={currency} range={range} />
        <BalancesSection ledger={ledger} accounts={accounts} range={range} />
        <CollectionSection
          icon={Link2}
          title="Payment links"
          className="border-b"
          options={linkOptions}
          value={linkId}
          onValueChange={setLinkId}
          supporting="Track how your payment links are performing."
          manageLabel="Manage payment links"
          manageTo="/payment-links"
          paid={{ label: "Paid", value: links.paid.toLocaleString("en-NG"), series: links.paidSeries }}
          conversion={{
            label: "Avg. conversion rate",
            value: links.conversion == null ? "—" : `${links.conversion}%`,
            series: links.convSeries,
          }}
        />
        <CollectionSection
          icon={ReceiptText}
          title="Invoices"
          className="border-b"
          options={invoiceOptions}
          value={invoiceId}
          onValueChange={setInvoiceId}
          supporting="Track your invoices and customer payments."
          manageLabel="Manage invoices"
          manageTo="/invoices"
          paid={{ label: "Paid", value: invoices.paid.toLocaleString("en-NG"), series: invoices.paidSeries }}
          conversion={{
            label: "Avg. conversion rate",
            value: invoices.conversion == null ? "—" : `${invoices.conversion}%`,
            series: invoices.convSeries,
          }}
        />
        <EcommerceSection orders={orders} range={range} />
      </section>
    </div>
  );
}

// Keep the icon import honest if sections change later.
void ArrowLeftRight;
