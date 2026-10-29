import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, CalendarClock, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog, DashboardPage, EmptyState } from "@/components/griv/kit";
import { cn } from "@/lib/utils";
import { CURRENCIES, type Currency } from "@/lib/money";
import { fmtDateTime } from "@/lib/dates";
import { useLiveMode } from "@/lib/live-mode";
import { useMerchant } from "@/lib/demo/merchant";
import { useTaxRates } from "@/lib/demo/tax-rates";
import { useCustomers } from "@/lib/demo/customers";
import { invoicesStore, isEditable, nextInvoiceId, upsertInvoice, useInvoices, type Invoice } from "@/lib/demo/invoices";
import {
  blankInvoice,
  changeCurrency,
  finalizeInvoice,
  hasItemAmounts,
  validateInvoice,
  type FinalizeOptions,
  type InvoiceErrors,
} from "@/lib/demo/invoice-builder";
import { CustomerSection } from "./CustomerSection";
import { ItemsSection } from "./ItemsSection";
import { CollectionSection, DueSection } from "./CollectionSection";
import { AdditionalOptions } from "./AdditionalOptions";
import { PreviewBody, PreviewTabs, type PreviewTab } from "./previews";
import { ReviewDialog } from "./ReviewDialog";
import { ShareDialog } from "./ShareDialog";
import { EditorSection, INPUT } from "./ui";

const FIELD_FOR: Record<keyof InvoiceErrors, string> = {
  customer: "field-customer",
  items: "field-items",
  total: "field-items",
  discount: "field-items",
  methods: "field-collection",
  installments: "field-collection",
  due: "field-due",
};

type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * Dedicated invoice editor inside the Griv app shell: configuration on the left, a live PDF / email /
 * payment-page preview on the right. Drafts autosave to the shared invoice store; Review opens the
 * finalization modal and a successful finalization opens the share modal.
 */
export function InvoiceWorkspace({ invoiceId }: { invoiceId?: string }) {
  useInvoices();
  const existing = invoiceId ? invoicesStore.get().find((x) => x.id === invoiceId) : undefined;
  if (invoiceId && !existing) {
    return (
      <DashboardPage crumbs={[{ label: "Payments" }, { label: "Invoices", to: "/invoices" }]} title="Invoice not found">
        <EmptyState title="Invoice not found" description="This draft may have been deleted or the demo data was reset." action={<Link to="/invoices" className="btn btn-outline">Back to Invoices</Link>} />
      </DashboardPage>
    );
  }
  if (existing && !isEditable(existing)) {
    return (
      <DashboardPage crumbs={[{ label: "Payments" }, { label: "Invoices", to: "/invoices" }, { label: existing.id }]} title="This invoice is finalized">
        <EmptyState
          title="Finalized invoices can't be edited"
          description="It's an issued financial document. Void it and duplicate it as a new draft, or issue a credit note, from the invoice page."
          action={<Link to="/invoices/$invoiceId" params={{ invoiceId: existing.id }} className="btn btn-outline">Open invoice</Link>}
        />
      </DashboardPage>
    );
  }
  return <Editor key={existing?.id ?? "new"} existing={existing} />;
}

function Editor({ existing }: { existing?: Invoice | undefined }) {
  const navigate = useNavigate();
  const live = useLiveMode();
  const merchant = useMerchant();
  useTaxRates();
  useCustomers();

  const [r, setR] = useState<Invoice>(() => existing ?? blankInvoice(nextInvoiceId(invoicesStore.get())));
  const lastSaved = useRef(JSON.stringify(r));
  const done = useRef(false);
  const latest = useRef(r);
  latest.current = r;
  const [saveState, setSaveState] = useState<SaveState>(existing ? "saved" : "idle");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [pane, setPane] = useState<"edit" | "preview">("edit");
  const [tab, setTab] = useState<PreviewTab>("pdf");
  const [pendingCurrency, setPendingCurrency] = useState<Currency | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [shared, setShared] = useState<Invoice | null>(null);
  const [branding, setBranding] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const update = (fn: (v: Invoice) => Invoice) => setR((v) => fn(v));
  const serialized = JSON.stringify(r);
  const unsaved = serialized !== lastSaved.current;
  const savable = (v: Invoice) => !!v.customer.trim();

  /** Write the current draft to the shared store. Throws if the write fails. */
  const persist = (v: Invoice) => {
    if (done.current) return;
    upsertInvoice(v);
    lastSaved.current = JSON.stringify(v);
    setSavedAt(new Date().toISOString());
    setSaveState("saved");
  };

  // Debounced autosave once a customer is chosen.
  useEffect(() => {
    if (!unsaved || !savable(r) || done.current) return;
    setSaveState("saving");
    const h = setTimeout(() => {
      try {
        persist(latest.current);
      } catch {
        setSaveState("error");
      }
    }, 800);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized]);

  // Never lose a draft: flush pending changes when leaving the editor; warn on tab close.
  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      if (!done.current && JSON.stringify(latest.current) !== lastSaved.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      const v = latest.current;
      if (!done.current && savable(v) && JSON.stringify(v) !== lastSaved.current) {
        try {
          upsertInvoice(v);
        } catch {
          /* store write failed; nothing more we can do on unmount */
        }
      }
    };
  }, []);

  const errors = validateInvoice(r);
  const shown: InvoiceErrors = attempted ? errors : {};
  const isNew = !existing;
  const title = isNew ? "Create invoice" : r.status === "Scheduled" ? `Edit scheduled invoice` : `Edit draft`;

  const goBack = () => navigate({ to: existing ? "/invoices/$invoiceId" : "/invoices", params: existing ? { invoiceId: existing.id } : {} });
  const close = () => {
    if (saveState === "error") return setLeaving(true);
    if (unsaved && savable(r)) {
      try {
        persist(r);
      } catch {
        return setLeaving(true);
      }
    }
    goBack();
  };

  const saveDraft = () => {
    if (!savable(r)) {
      setAttempted(true);
      document.getElementById("field-customer")?.scrollIntoView({ behavior: "smooth", block: "start" });
      toast.error("Choose a customer before saving a draft.");
      return;
    }
    try {
      persist(r);
      toast.success(`Draft ${r.id} saved`);
      navigate({ to: "/invoices/$invoiceId", params: { invoiceId: r.id } });
    } catch {
      setSaveState("error");
      toast.error("Couldn't save the draft. Your changes are still on this page — try again.");
    }
  };

  const review = () => {
    const keys = Object.keys(errors) as (keyof InvoiceErrors)[];
    if (keys.length) {
      setAttempted(true);
      setPane("edit");
      const el = document.getElementById(FIELD_FOR[keys[0]!]);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
      (el?.querySelector("button, input, select, textarea") as HTMLElement | null)?.focus({ preventScroll: true });
      toast.error("A few things need fixing before you can review this invoice.");
      return;
    }
    setReviewing(true);
  };

  const finalize = async (o: FinalizeOptions) => {
    await new Promise((res) => setTimeout(res, 900));
    const next = finalizeInvoice(r, o);
    upsertInvoice(next);
    done.current = true;
    lastSaved.current = JSON.stringify(next);
    setR(next);
    setReviewing(false);
    if (next.status === "Scheduled") {
      toast.success(`Finalization scheduled for ${fmtDateTime(next.scheduledFor!)}`);
      navigate({ to: "/invoices/$invoiceId", params: { invoiceId: next.id } });
    } else {
      setShared(next);
    }
  };

  const onCurrency = (c: Currency) => {
    if (c === r.currency) return;
    if (hasItemAmounts(r)) setPendingCurrency(c);
    else update((v) => changeCurrency(v, c));
  };

  const previewVisible = showPreview || pane === "preview";

  return (
    <DashboardPage crumbs={[{ label: "Payments" }, { label: "Invoices", to: "/invoices" }, { label: isNew ? "Create invoice" : r.id }]}>
      {/* Sticky editor header */}
      <div className="sticky top-16 z-10 -mx-4 -mt-4 mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-b bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <button onClick={close} className="grid h-8 w-8 shrink-0 place-items-center rounded-md border bg-card text-muted-foreground hover:text-foreground" aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight">{title}</h1>
          <SaveIndicator state={saveState} savedAt={savedAt} hasCustomer={savable(r)} />
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border p-0.5 text-xs font-semibold lg:hidden" role="tablist" aria-label="Editor view">
            {(["edit", "preview"] as const).map((p) => (
              <button key={p} role="tab" aria-selected={pane === p} onClick={() => setPane(p)} className={cn("rounded-md px-2.5 py-1.5 capitalize", pane === p ? "bg-accent text-primary" : "text-muted-foreground")}>
                {p}
              </button>
            ))}
          </div>
          <button onClick={() => setShowPreview((s) => !s)} className="btn btn-ghost hidden h-9 px-3 text-sm lg:inline-flex" aria-pressed={!showPreview}>
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? "Hide preview" : "Show preview"}
          </button>
          <button onClick={saveDraft} className="btn btn-outline h-9 px-3 text-sm">Save draft</button>
          <button onClick={review} className="btn btn-primary h-9 px-3 text-sm">Review invoice</button>
        </div>
      </div>

      {r.status === "Scheduled" && r.scheduledFor && (
        <p className="mb-4 flex items-start gap-2 rounded-lg border bg-accent/60 px-4 py-2.5 text-sm">
          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          Scheduled to finalize on {fmtDateTime(r.scheduledFor)}. You can keep editing until then — Review again to change the schedule.
        </p>
      )}

      <div className={cn("grid gap-8", showPreview && "lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]")}>
        {/* Left — configuration */}
        <div className={cn("min-w-0", pane === "edit" ? "block" : "hidden lg:block", !showPreview && "lg:mx-auto lg:w-full lg:max-w-2xl")}>
          <CustomerSection
            value={r.customer}
            error={shown.customer}
            onChange={(name, id) => update((v) => ({ ...v, customer: name, customerId: id }))}
          />
          <EditorSection title="Currency" description="All amounts on this invoice use this currency.">
            <select aria-label="Currency" className={cn(INPUT, "w-48")} value={r.currency} onChange={(e) => onCurrency(e.target.value as Currency)}>
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <p className="mt-1.5 text-xs text-muted-foreground">Changing currency clears the items — Griv never converts amounts.</p>
          </EditorSection>
          <ItemsSection invoice={r} update={update} error={shown.items ?? shown.total ?? shown.discount} showErrors={attempted} />
          <CollectionSection invoice={r} update={update} errors={{ methods: shown.methods, installments: shown.installments }} />
          <DueSection invoice={r} update={update} error={shown.due} />
          <AdditionalOptions invoice={r} update={update} merchant={merchant} onBranding={() => setBranding(true)} />
        </div>

        {/* Right — live preview */}
        {previewVisible && (
          <aside className={cn("min-w-0", pane === "preview" ? "block" : "hidden lg:block")} aria-label="Invoice preview">
            <div className="rounded-xl bg-muted/50 p-4 lg:sticky lg:top-36 lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold">Preview</p>
                <button className="text-xs font-medium text-primary hover:underline" onClick={() => setBranding(true)}>Change branding</button>
              </div>
              <PreviewTabs tab={tab} onTab={setTab} />
              <PreviewBody tab={tab} invoice={r} merchant={merchant} live={live} />
            </div>
          </aside>
        )}
      </div>

      {reviewing && <ReviewDialog invoice={r} merchant={merchant} live={live} onClose={() => setReviewing(false)} onFinalize={finalize} />}
      {shared && (
        <ShareDialog invoice={shared} merchant={merchant} onContinue={() => navigate({ to: "/invoices/$invoiceId", params: { invoiceId: shared.id } })} />
      )}

      <ConfirmDialog
        open={pendingCurrency !== null}
        onOpenChange={(o) => !o && setPendingCurrency(null)}
        title={`Change currency to ${pendingCurrency}?`}
        description={`Your ${r.items.length} ${r.items.length === 1 ? "item is" : "items are"} priced in ${r.currency}. Changing currency clears all items${r.discountType !== "percent" && r.discount ? " and the fixed discount" : ""} — Griv never converts amounts, so you'll re-add them in ${pendingCurrency}.`}
        confirmLabel="Change and clear items"
        danger
        onConfirm={() => {
          if (pendingCurrency) update((v) => changeCurrency(v, pendingCurrency));
          setPendingCurrency(null);
        }}
      />
      <ConfirmDialog
        open={branding}
        onOpenChange={setBranding}
        title="Branding settings aren't wired up in this demo yet"
        description="Invoices use the business name and address from your Griv profile. Logo upload and brand colours will live in Settings → Branding once it exists."
        confirmLabel="Got it"
        onConfirm={() => setBranding(false)}
      />
      <ConfirmDialog
        open={leaving}
        onOpenChange={setLeaving}
        title="Leave without saving?"
        description="Your latest changes couldn't be saved. If you leave now they'll be lost."
        confirmLabel="Leave anyway"
        danger
        onConfirm={() => {
          done.current = true;
          goBack();
        }}
      />
    </DashboardPage>
  );
}

function SaveIndicator({ state, savedAt, hasCustomer }: { state: SaveState; savedAt: string | null; hasCustomer: boolean }) {
  if (state === "saving")
    return (
      <p className="flex items-center gap-1 text-xs text-muted-foreground" aria-live="polite">
        <Loader2 className="h-3 w-3 animate-spin" /> Saving…
      </p>
    );
  if (state === "error")
    return (
      <p className="flex items-center gap-1 text-xs font-medium text-destructive" aria-live="polite">
        <AlertCircle className="h-3 w-3" /> Unable to save changes
      </p>
    );
  if (state === "saved")
    return (
      <p className="flex items-center gap-1 text-xs text-muted-foreground" aria-live="polite">
        <Check className="h-3 w-3" /> All changes saved{savedAt ? ` · ${new Date(savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}
      </p>
    );
  return <p className="text-xs text-muted-foreground">{hasCustomer ? "Not saved yet" : "Drafts save automatically once you pick a customer"}</p>;
}
