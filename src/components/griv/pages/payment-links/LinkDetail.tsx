import { useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import { DashboardPage, ConfirmDialog, EmptyState, Field, FormDialog, StatusBadge } from "@/components/griv/kit";
import { getLink, linksStore, priceLabel, useLinks } from "@/lib/demo/payment-links";
import {
  PAYMENT_METHODS_BY_CURRENCY,
  SHIP_TO_OPTIONS,
  getExtras,
  setExtras,
  useLinkExtras,
  type LinkExtras,
} from "@/lib/demo/link-details";
import { formatMoney, type Currency } from "@/lib/money";
import { useLiveMode } from "@/lib/live-mode";
import { LinkHeader } from "./link-detail/Header";
import {
  DetailsSection,
  EventsSection,
  LogsSection,
  MetadataSection,
  PaymentMethodsSection,
  ProductsSection,
  ShippingSection,
} from "./link-detail/sections";
import { TipsPanel } from "./link-detail/Tips";
import { AnalyticsTab } from "./link-detail/Analytics";

const TABS = ["Overview", "Payments and analytics"] as const;

/** Full Stripe-style page for one payment link — opened from the list, not a modal. */
export function LinkDetail() {
  const { linkId } = useParams({ from: "/payment-links/$linkId" });
  const navigate = useNavigate();
  useLinks();
  useLinkExtras();
  const link = getLink(linkId);
  const live = useLiveMode();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [confirming, setConfirming] = useState(false);
  const [metaOpen, setMetaOpen] = useState(false);
  const [managing, setManaging] = useState<null | "shipping" | "methods">(null);
  const [demo, setDemo] = useState<string | null>(null);

  if (!link) {
    return (
      <DashboardPage title="Payment link" crumbs={[{ label: "Payments" }, { label: "Payment Links", to: "/payment-links" }]}>
        <EmptyState
          title="Payment link not found"
          description="This sample link may have been renamed or the demo data was reset."
          action={
            <Link to="/payment-links" className="btn btn-outline">
              Back to Payment Links
            </Link>
          }
        />
      </DashboardPage>
    );
  }

  const extras = getExtras(link.id);
  const c = link.currency as Currency;
  const recurring = link.model.includes("Monthly subscription");
  const priceInfo =
    link.model === "Customer enters amount" ? undefined : recurring ? priceLabel(link) : formatMoney(link.amount, c);

  const toggle = () => {
    linksStore.set((v) => v.map((x) => (x.id === link.id ? { ...x, status: x.status === "Active" ? "Inactive" : "Active" } : x)));
    toast.success(`Payment link ${link.status === "Active" ? "deactivated" : "activated"}`);
    setConfirming(false);
  };

  return (
    <DashboardPage
      crumbs={[{ label: "Payments" }, { label: "Payment Links", to: "/payment-links" }, { label: "Details" }]}
      title={
        <>
          {link.name}
          {priceInfo && <span className="ml-2 text-base font-normal text-muted-foreground">for {priceInfo}</span>}
        </>
      }
      description="Copy and share to start accepting payments with this link."
    >
      <LinkHeader
        link={link}
        live={live}
        onEdit={() => navigate({ to: "/payment-links/$linkId_/edit", params: { linkId: link.id } })}
        onToggleStatus={() => setConfirming(true)}
        onDemo={(what) => setDemo(what)}
      />

      <div className="mb-6 flex gap-6 border-b">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative pb-2 text-sm font-medium ${
              tab === t ? "text-foreground after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" ? (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <ProductsSection link={link} />
            {link.address && <ShippingSection extras={extras} onManage={() => setManaging("shipping")} />}
            <PaymentMethodsSection link={link} extras={extras} onManage={() => setManaging("methods")} />
            <DetailsSection link={link} extras={extras} status={<StatusBadge status={link.status} />} />
            <MetadataSection extras={extras} onEdit={() => setMetaOpen(true)} />
            <EventsSection link={link} />
            <LogsSection link={link} />
          </div>
          <TipsPanel onAction={(key) => setDemo(key)} />
        </div>
      ) : (
        <AnalyticsTab link={link} />
      )}

      <ConfirmDialog
        open={confirming}
        onOpenChange={(o) => !o && setConfirming(false)}
        title={`${link.status === "Active" ? "Deactivate" : "Activate"} payment link?`}
        description={
          link.status === "Active"
            ? "Customers will no longer be able to pay through this link."
            : "Customers will be able to pay through this link again."
        }
        confirmLabel={link.status === "Active" ? "Deactivate" : "Activate"}
        danger={link.status === "Active"}
        onConfirm={toggle}
      />

      <ManageDialog
        open={managing === "methods"}
        onOpenChange={(o) => !o && setManaging(null)}
        title="Manage payment methods"
        description="Choose the payment methods customers can use on this link."
        options={PAYMENT_METHODS_BY_CURRENCY[c] ?? ["Card"]}
        selected={extras.methods ?? PAYMENT_METHODS_BY_CURRENCY[c] ?? ["Card"]}
        onSave={(methods) => {
          setExtras(link.id, { methods });
          setManaging(null);
          toast.success("Payment methods updated");
        }}
      />

      <ManageDialog
        open={managing === "shipping"}
        onOpenChange={(o) => !o && setManaging(null)}
        title="Manage shipping"
        description="Choose the destinations this link ships to."
        options={SHIP_TO_OPTIONS}
        selected={extras.shipTo ?? ["Nigeria", "Ghana"]}
        onSave={(shipTo) => {
          setExtras(link.id, { shipTo });
          setManaging(null);
          toast.success("Shipping destinations updated");
        }}
      />

      <MetaDialog
        open={metaOpen}
        onOpenChange={setMetaOpen}
        extras={extras}
        onSave={(metadata) => {
          setExtras(link.id, { metadata });
          setMetaOpen(false);
          toast.success("Metadata saved");
        }}
      />

      <FormDialog
        open={demo !== null}
        onOpenChange={(o) => !o && setDemo(null)}
        title="Not wired up in the demo"
      >
        <p className="text-sm text-muted-foreground">
          {demo === "copy-to-live"
            ? "Copying this payment link to live mode isn't wired up in the demo yet."
            : demo === "methods"
              ? "The full payment-methods settings page isn't wired up in the demo yet — use Manage on this page instead."
              : "This setting isn't wired up in the demo yet."}
        </p>
      </FormDialog>
    </DashboardPage>
  );
}

/** Checkbox dialog shared by Manage payment methods and Manage shipping. */
function ManageDialog({ open, onOpenChange, title, description, options, selected, onSave }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; description: string;
  options: string[]; selected: string[]; onSave: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState<string[]>(selected);
  const toggle = (o: string) =>
    setDraft((v) => (v.includes(o) ? v.filter((x) => x !== o) : [...v, o]));
  return (
    <FormDialog
      open={open}
      onOpenChange={(o) => {
        if (o) setDraft(selected);
        onOpenChange(o);
      }}
      title={title}
      description={description}
      footer={
        <button className="btn btn-primary" disabled={draft.length === 0} onClick={() => onSave(draft)}>
          Save
        </button>
      }
    >
      <div className="space-y-2">
        {options.map((o) => (
          <label key={o} className="flex items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              className="accent-primary"
              checked={draft.includes(o)}
              onChange={() => toggle(o)}
            />
            {o}
          </label>
        ))}
      </div>
    </FormDialog>
  );
}

/** Add metadata key-value pairs. */
function MetaDialog({ open, onOpenChange, extras, onSave }: {
  open: boolean; onOpenChange: (o: boolean) => void; extras: LinkExtras;
  onSave: (metadata: Record<string, string>) => void;
}) {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const valid = /^[A-Za-z0-9_-]+$/.test(key) && value.trim().length > 0;
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit metadata"
      description="Metadata is only visible to your team."
      footer={
        <button
          className="btn btn-primary"
          disabled={!valid}
          onClick={() => {
            onSave({ ...(extras.metadata ?? {}), [key.trim()]: value.trim() });
            setKey("");
            setValue("");
          }}
        >
          Save
        </button>
      }
    >
      <div className="space-y-4">
        {Object.entries(extras.metadata ?? {}).map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-4 rounded-md border border-input px-3 py-2 text-sm">
            <span className="font-medium">{k}</span>
            <span className="text-muted-foreground">{v}</span>
          </div>
        ))}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Key" error={key && !/^[A-Za-z0-9_-]+$/.test(key) ? "Use letters, numbers, dashes or underscores." : ""}>
            <input className="field h-9 w-full text-sm" value={key} onChange={(e) => setKey(e.target.value)} placeholder="campaign" />
          </Field>
          <Field label="Value">
            <input className="field h-9 w-full text-sm" value={value} onChange={(e) => setValue(e.target.value)} placeholder="october_promo" />
          </Field>
        </div>
      </div>
    </FormDialog>
  );
}

