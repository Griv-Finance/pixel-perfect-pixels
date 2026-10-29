import type { ReactNode } from "react";
import { CreditCard, Info, Landmark, Smartphone } from "lucide-react";
import { StatusBadge } from "@/components/griv/kit";
import { fmtDate } from "@/lib/dates";
import type { PaymentLink } from "@/lib/demo/payment-links";
import {
  detailRows,
  linkEvents,
  linkLogs,
  methodsFor,
  productTable,
  shipToFor,
  type LinkExtras,
} from "@/lib/demo/link-details";

const METHOD_ICON = { Card: CreditCard, "Bank transfer": Landmark, USSD: Smartphone, "Mobile money": Smartphone } as const;
const FLAGS: Record<string, string> = { Nigeria: "🇳🇬", Ghana: "🇬🇭", Kenya: "🇰🇪", "South Africa": "🇿🇦", Rwanda: "🇷🇼" };

/** Stripe-style section: small semibold heading, thin divider, no card wrapper. */
export function Section({ title, info, action, children }: {
  title: string; info?: boolean; action?: ReactNode; children: ReactNode;
}) {
  return (
    <section className="border-b py-6 first:pt-0 last:border-b-0 last:pb-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold">
          {title}
          {info && <Info className="h-3.5 w-3.5 text-muted-foreground" />}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

const MANAGE_BTN = "inline-flex h-7 items-center gap-1 rounded-md border border-input bg-card px-2.5 text-xs font-medium hover:bg-muted";

/** Adaptive products table: fixed/quantity columns, or preset/min/max for customer-chosen amounts. */
export function ProductsSection({ link }: { link: PaymentLink }) {
  const { columns, rows } = productTable(link);
  return (
    <Section title="Products">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            {columns.map((c) => (
              <th key={c} className="py-2 pr-4 font-medium last:pr-0">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-b last:border-b-0">
              <td className="py-3 pr-4">
                <span className="font-medium text-primary">{r.name}</span>
                <span className="block text-xs text-muted-foreground">{r.nameSub}</span>
              </td>
              {r.cells.map((c, i) => (
                <td key={i} className="py-3 pr-4 last:pr-0">{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

/** Only for links that collect shipping addresses. */
export function ShippingSection({ extras, onManage }: { extras: LinkExtras; onManage: () => void }) {
  const destinations = shipToFor(extras);
  return (
    <Section title="Shipping" action={<button className={MANAGE_BTN} onClick={onManage}>Manage</button>}>
      <dl className="space-y-1.5 text-sm">
        <div className="flex gap-4">
          <dt className="w-28 shrink-0 text-muted-foreground">Ship to</dt>
          <dd>{destinations.map((d) => `${FLAGS[d] ?? ""} ${d}`).join(", ")}</dd>
        </div>
        <div className="flex gap-4">
          <dt className="w-28 shrink-0 text-muted-foreground">Shipping rates</dt>
          <dd className="text-muted-foreground">No shipping rates added</dd>
        </div>
      </dl>
    </Section>
  );
}

export function PaymentMethodsSection({ link, extras, onManage }: {
  link: PaymentLink; extras: LinkExtras; onManage: () => void;
}) {
  return (
    <Section
      title="Payment methods"
      info
      action={<button className={MANAGE_BTN} onClick={onManage}>Manage</button>}
    >
      <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {methodsFor(link, extras).map((m) => {
          const Icon = METHOD_ICON[m as keyof typeof METHOD_ICON] ?? CreditCard;
          return (
            <li key={m} className="flex items-center gap-1.5">
              <Icon className="h-4 w-4 text-muted-foreground" />
              {m}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

export function DetailsSection({ link, extras, status }: {
  link: PaymentLink; extras: LinkExtras; status: ReactNode;
}) {
  return (
    <Section title="Details">
      <dl className="text-sm">
        <Row label="Status">{status}</Row>
        {detailRows(link, extras).map(([k, v]) => (
          <Row key={k} label={k}>{v}</Row>
        ))}
      </dl>
    </Section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-1.5">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-right font-medium">{children}</dd>
    </div>
  );
}

export function MetadataSection({ extras, onEdit }: { extras: LinkExtras; onEdit: () => void }) {
  const entries = Object.entries(extras.metadata ?? {});
  return (
    <Section
      title="Metadata"
      action={<button className={MANAGE_BTN} onClick={onEdit}>Edit metadata</button>}
    >
      <p className="mb-3 text-sm text-muted-foreground">Use metadata to store additional information about this payment link.</p>
      {entries.length ? (
        <dl className="text-sm">
          {entries.map(([k, v]) => (
            <div key={k} className="flex items-start justify-between gap-6 py-1.5">
              <dt className="shrink-0 font-medium">{k}</dt>
              <dd className="min-w-0 break-words text-right text-muted-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-muted-foreground">No metadata</p>
      )}
    </Section>
  );
}

export function EventsSection({ link }: { link: PaymentLink }) {
  return (
    <Section title="Events">
      <ul className="divide-y text-sm">
        {linkEvents(link).map((e, i) => (
          <li key={i} className="flex items-start justify-between gap-6 py-2 first:pt-0 last:pb-0">
            <span className="min-w-0">{e.text}</span>
            <span className="shrink-0 whitespace-nowrap text-muted-foreground">{e.time}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function LogsSection({ link }: { link: PaymentLink }) {
  return (
    <Section title="Logs">
      <ul className="divide-y text-sm">
        {linkLogs(link).map((l, i) => (
          <li key={i} className="flex items-center justify-between gap-6 py-2 first:pt-0 last:pb-0">
            <span className="flex min-w-0 items-center gap-3">
              <span className="rounded border border-border bg-success-foreground/10 px-1.5 py-0.5 text-xs font-medium text-success-foreground">{l.status}</span>
              <span className="text-muted-foreground">{l.method}</span>
              <code className="min-w-0 truncate">{l.endpoint}</code>
            </span>
            <span className="shrink-0 whitespace-nowrap text-muted-foreground">{l.time}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/** Expiry date formatted for the header, shared with the details rows. */
export const expiryLabel = (link: PaymentLink) => (link.expiry ? fmtDate(link.expiry) : "No expiry");
export { StatusBadge };
