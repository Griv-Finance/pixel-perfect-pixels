import { useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  CalendarClock,
  Clock3,
  Download,
  FileCheck2,
  FileText,
  MoreHorizontal,
  Send,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog, CopyButton, DashboardPage, EmptyState, Field, FormDialog } from "@/components/griv/kit";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  deliveryStatus,
  invoiceStatus,
  invoiceTotals,
  invoicesStore,
  nextInvoiceId,
  useInvoices,
  type Invoice,
} from "@/lib/demo/invoices";
import {
  availableActions,
  creditNoteRemaining,
  getInvoiceExtras,
  hostedUrl,
  nextCreditNoteId,
  outstanding,
  setInvoiceExtras,
  useInvoiceExtras,
} from "@/lib/demo/invoice-details";
import { customerByName } from "@/lib/demo/customers";
import { formatMoney } from "@/lib/money";
import { DEMO_TODAY } from "@/lib/dates";
import { statusTone, TONE_CLASS } from "@/lib/status";
import { makeRef } from "@/lib/demo-store";
import { cn } from "@/lib/utils";
import { PaymentPagePreview } from "../builder/previews";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLiveMode } from "@/lib/live-mode";
import { useMerchant } from "@/lib/demo/merchant";
import { cancelSchedule } from "@/lib/demo/invoice-builder";
import {
  AccountingSection,
  ActivityTabsSection,
  CreditNotesSection,
  DetailsPanel,
  DocumentSection,
  LineItemsSection,
  MetadataPanel,
  PaymentsSection,
  RecentActivity,
  SummarySection,
  TaxSection,
} from "./sections";

const OUTLINE = "inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-md border border-input bg-card px-3 text-sm font-medium hover:bg-muted";

const STATUS_ICONS: Record<string, LucideIcon> = {
  Draft: FileText,
  Scheduled: CalendarClock,
  Finalized: FileCheck2,
  Sent: Send,
  "Partially paid": Clock3,
  Paid: CheckCircle2,
  Overdue: AlertTriangle,
  Cancelled: XCircle,
};

/** Status badge with a leading icon, same style as the listing page. */
function InvoiceStatusBadge({ status }: { status: string }) {
  const Icon = STATUS_ICONS[status] ?? FileText;
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold", TONE_CLASS[statusTone(status)])}>
      <Icon className="h-3 w-3" />
      {status}
    </span>
  );
}

const ACTION_LABEL: Record<string, string> = {
  edit: "Edit invoice",
  send: "Send invoice",
  charge: "Charge customer",
  "download-pdf": "Download PDF",
  duplicate: "Duplicate invoice",
  "copy-link": "Copy hosted invoice link",
  "mark-paid": "Mark as paid",
  "record-payment": "Record an external payment",
  "credit-note": "Issue credit note",
  void: "Void invoice",
  "delete-draft": "Delete draft invoice",
  "cancel-schedule": "Cancel scheduled finalization",
  "view-page": "View payment page",
};

/** Full Stripe-style page for one invoice — opened from the list, not a modal. */
export function InvoiceDetail() {
  const { invoiceId } = useParams({ from: "/invoices/$invoiceId" });
  const navigate = useNavigate();
  useInvoices();
  useInvoiceExtras();
  const invoice = invoicesStore.get().find((r) => r.id === invoiceId);

  const [viewPage, setViewPage] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const live = useLiveMode();
  const merchant = useMerchant();
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [crediting, setCrediting] = useState(false);
  const [voiding, setVoiding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [metaOpen, setMetaOpen] = useState(false);
  const [demo, setDemo] = useState<null | "mark-paid" | "charge">(null);

  if (!invoice) {
    return (
      <DashboardPage title="Invoice" crumbs={[{ label: "Payments" }, { label: "Invoices", to: "/invoices" }]}>
        <EmptyState
          title="Invoice not found"
          description="This sample invoice may have been deleted or the demo data was reset."
          action={
            <Link to="/invoices" className="btn btn-outline">
              Back to Invoices
            </Link>
          }
        />
      </DashboardPage>
    );
  }

  const extras = getInvoiceExtras(invoice.id);
  const status = invoiceStatus(invoice);
  const actions = availableActions(invoice);
  const customer = customerByName(invoice.customer);
  const remaining = outstanding(invoice);
  const patchInvoice = (patch: Partial<Invoice>) =>
    invoicesStore.set((v) => v.map((r) => (r.id === invoice.id ? { ...r, ...patch } : r)));

  const run = (key: string) => {
    if (key === "edit") return navigate({ to: "/invoices/$invoiceId/edit", params: { invoiceId: invoice.id } });
    // Drafts are finalized through the editor's review step; issued invoices can be (re)sent here.
    if (key === "send") {
      if (status === "Draft") return navigate({ to: "/invoices/$invoiceId/edit", params: { invoiceId: invoice.id } });
      return setSending(true);
    }
    if (key === "cancel-schedule") return setCancelling(true);
    if (key === "view-page") return setViewPage(true);
    if (key === "charge") return setDemo("charge");
    if (key === "download-pdf") {
      import("@/lib/invoice-pdf")
        .then(({ downloadInvoicePdf }) => downloadInvoicePdf(invoice, merchant))
        .then(() => toast.success("Invoice PDF downloaded"), () => toast.error("Could not generate the PDF"));
      return;
    }
    if (key === "duplicate") {
      const { scheduledFor: _s, finalizedAt: _f, ...rest } = invoice;
      const copy: Invoice = {
        ...rest,
        id: nextInvoiceId(invoicesStore.get()),
        status: "Draft",
        delivery: "Not sent",
        payments: [],
        reminders: [],
        created: DEMO_TODAY.toISOString(),
      };
      invoicesStore.set((v) => [copy, ...v]);
      toast.success("Invoice duplicated as draft");
      navigate({ to: "/invoices/$invoiceId", params: { invoiceId: copy.id } });
      return;
    }
    if (key === "copy-link") {
      navigator.clipboard?.writeText(hostedUrl(invoice));
      toast.success("Hosted invoice link copied");
      return;
    }
    if (key === "mark-paid") return setDemo("mark-paid");
    if (key === "record-payment") return setRecording(true);
    if (key === "credit-note") return setCrediting(true);
    if (key === "void") return setVoiding(true);
    if (key === "delete-draft") return setDeleting(true);
  };

  return (
    <DashboardPage
      crumbs={[{ label: "Payments" }, { label: "Invoices", to: "/invoices" }, { label: invoice.id }]}
      title={
        <span className="flex flex-wrap items-center gap-2">
          {invoice.id}
          <InvoiceStatusBadge status={status} />
        </span>
      }
      description={`Billed to ${invoice.customer} · ${formatMoney(invoiceTotals(invoice).total, invoice.currency)}${status !== "Draft" && status !== "Scheduled" && status !== "Cancelled" ? ` · ${formatMoney(remaining, invoice.currency)} outstanding` : ""}`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {actions.includes("edit") && (
            <button className={status === "Draft" ? "btn btn-primary h-9 px-3 text-sm" : OUTLINE} onClick={() => run("edit")}>
              {status === "Draft" ? "Continue editing" : "Edit invoice"}
            </button>
          )}
          {actions.includes("cancel-schedule") && (
            <button className={OUTLINE} onClick={() => run("cancel-schedule")}>Cancel schedule</button>
          )}
          {actions.includes("send") && status !== "Draft" && (
            <button className="btn btn-primary h-9 px-3 text-sm" onClick={() => run("send")}>
              <Send className="h-4 w-4" />
              {deliveryStatus(invoice) === "Not sent" ? "Send invoice" : "Resend invoice"}
            </button>
          )}
          {actions.includes("charge") && (
            <button className={OUTLINE} onClick={() => run("charge")}>Charge customer</button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="grid h-9 w-9 place-items-center rounded-md border border-input bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="More actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {actions
                .filter((a) => !["edit", "send", "charge", "cancel-schedule"].includes(a))
                .map((a) => (
                  <DropdownMenuItem
                    key={a}
                    className={a === "delete-draft" || a === "void" ? "text-destructive focus:text-destructive" : undefined}
                    onClick={() => run(a)}
                  >
                    {ACTION_LABEL[a]}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
    >
      {invoice.status === "Scheduled" && invoice.scheduledFor && (
        <p className="mb-4 flex items-start gap-2 rounded-lg border bg-accent/60 px-4 py-2.5 text-sm">
          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          Scheduled to finalize on {new Date(invoice.scheduledFor).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
          {invoice.sendOnFinalize ? " and email the customer" : ""}. It stays editable until then. Scheduled jobs run on Griv's servers, which this demo doesn't have.
        </p>
      )}
      {deliveryStatus(invoice) === "Sending" && (
        <p className="mb-4 rounded-lg border bg-highlight/60 px-4 py-2.5 text-sm text-highlight-foreground">
          The invoice email is queued but not delivered — no email service is connected in this demo. Share the PDF or payment link yourself.
        </p>
      )}
      {/* Hosted invoice URL + Download PDF */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {invoice.status === "Draft" || invoice.status === "Scheduled" ? (
          <p className="flex min-w-72 flex-1 items-center rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
            The payment page link is created when this invoice is finalized.
          </p>
        ) : (
          <div className="flex min-w-72 flex-1 items-center gap-2 rounded-md border border-input bg-card px-3 py-2">
            <code className="min-w-0 flex-1 truncate text-sm">{hostedUrl(invoice)}</code>
            <CopyButton value={hostedUrl(invoice)} label="Copy link" iconOnly />
          </div>
        )}
        <button className={OUTLINE} onClick={() => run("download-pdf")}>
          <Download className="h-4 w-4" />
          Download PDF
        </button>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <RecentActivity invoice={invoice} extras={extras} onAddNote={() => setNoteOpen(true)} />
          <SummarySection invoice={invoice} />
          <DocumentSection invoice={invoice} merchant={merchant} />
          <LineItemsSection invoice={invoice} />
          <TaxSection invoice={invoice} />
          <AccountingSection />
          <PaymentsSection
            invoice={invoice}
            onRecord={actions.includes("record-payment") ? () => setRecording(true) : undefined}
          />
          <CreditNotesSection
            invoice={invoice}
            extras={extras}
            onAdd={actions.includes("credit-note") ? () => setCrediting(true) : undefined}
          />
          <ActivityTabsSection invoice={invoice} />
        </div>
        <div className="min-w-0">
          <DetailsPanel invoice={invoice} extras={extras} />
          <MetadataPanel extras={extras} onEdit={() => setMetaOpen(true)} />
        </div>
      </div>

      {/* Add note */}
      <NoteDialog
        open={noteOpen}
        onOpenChange={setNoteOpen}
        existing={extras.notes ?? []}
        onSave={(text) => {
          if (text) {
            setInvoiceExtras(invoice.id, {
              notes: [...(extras.notes ?? []), { text, time: DEMO_TODAY.toISOString() }],
            });
          }
          setNoteOpen(false);
          toast.success(text ? "Note saved" : "Note removed");
        }}
      />

      {/* Send invoice */}
      <FormDialog
        open={sending}
        onOpenChange={(o) => !o && setSending(false)}
        title={deliveryStatus(invoice) === "Not sent" ? "Send invoice" : "Resend invoice"}
        description="The customer receives an email with a link to pay this invoice. Sending doesn't change the payment status."
        footer={
          <button
            className="btn btn-primary"
            disabled={!customer?.email}
            onClick={() => {
              // No email service in the demo: the email is queued, never shown as delivered.
              patchInvoice({ delivery: "Sending" });
              toast.info("Email queued — it won't be delivered in this demo because no email service is connected.");
              setSending(false);
            }}
          >
            {deliveryStatus(invoice) === "Not sent" ? "Send invoice" : "Resend invoice"}
          </button>
        }
      >
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-6">
            <dt className="text-muted-foreground">Recipient</dt>
            <dd className="text-right font-medium">
              {invoice.customer}
              <span className="block text-xs text-muted-foreground">{customer?.email}</span>
            </dd>
          </div>
          <div className="flex justify-between gap-6">
            <dt className="text-muted-foreground">Delivery</dt>
            <dd>Email with hosted payment page</dd>
          </div>
          <div className="flex justify-between gap-6">
            <dt className="text-muted-foreground">Amount due</dt>
            <dd className="tnum font-medium">{formatMoney(remaining, invoice.currency)}</dd>
          </div>
        </dl>
      </FormDialog>

      {/* Record an external payment — stays pending until a real provider confirms */}
      <RecordPaymentDialog
        open={recording}
        onOpenChange={setRecording}
        invoice={invoice}
        remaining={remaining}
        onSave={(amount, method) => {
          setInvoiceExtras(invoice.id, {
            pendingPayments: [
              ...(extras.pendingPayments ?? []),
              { reference: makeRef("PAY"), amount, date: DEMO_TODAY.toISOString(), method },
            ],
          });
          setRecording(false);
          toast.info("Payment recorded — pending confirmation. It completes only when the provider confirms it.");
        }}
      />

      {/* Issue credit note */}
      <CreditNoteDialog
        open={crediting}
        onOpenChange={setCrediting}
        invoice={invoice}
        max={creditNoteRemaining(invoice)}
        onSave={(amount, reason) => {
          setInvoiceExtras(invoice.id, {
            creditNotes: [
              ...(extras.creditNotes ?? []),
              { id: nextCreditNoteId(extras, invoice), amount, reason, date: DEMO_TODAY.toISOString().slice(0, 10) },
            ],
          });
          setCrediting(false);
          toast.success("Credit note issued");
        }}
      />

      {/* Void invoice */}
      <ConfirmDialog
        open={voiding}
        onOpenChange={(o) => !o && setVoiding(false)}
        title="Void this invoice?"
        description="The invoice will be marked voided. Existing payment history is retained."
        confirmLabel="Void invoice"
        danger
        onConfirm={() => {
          patchInvoice({ status: "Cancelled" });
          setVoiding(false);
          toast.success("Invoice voided");
        }}
      />

      {/* Delete draft */}
      <ConfirmDialog
        open={deleting}
        onOpenChange={(o) => !o && setDeleting(false)}
        title="Delete this draft?"
        description="The draft invoice will be permanently removed from the sample data."
        confirmLabel="Delete draft"
        danger
        onConfirm={() => {
          invoicesStore.set((v) => v.filter((r) => r.id !== invoice.id));
          setDeleting(false);
          toast.success("Draft invoice deleted");
          navigate({ to: "/invoices" });
        }}
      />

      {/* Cancel scheduled finalization */}
      <ConfirmDialog
        open={cancelling}
        onOpenChange={(o) => !o && setCancelling(false)}
        title="Cancel scheduled finalization?"
        description="The invoice goes back to being a draft. Nothing is sent to the customer."
        confirmLabel="Cancel schedule"
        onConfirm={() => {
          invoicesStore.set((v) => v.map((r) => (r.id === invoice.id ? cancelSchedule(r) : r)));
          setCancelling(false);
          toast.success("Scheduled finalization cancelled — the invoice is a draft again");
        }}
      />

      {/* Hosted payment page preview */}
      <Dialog open={viewPage} onOpenChange={setViewPage}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment page</DialogTitle>
            <DialogDescription>What {invoice.customer} sees at the hosted invoice link. Preview only — hosted pages aren't live in this demo.</DialogDescription>
          </DialogHeader>
          <PaymentPagePreview invoice={invoice} merchant={merchant} live={live} />
        </DialogContent>
      </Dialog>

      {/* Metadata */}
      <MetaDialog
        open={metaOpen}
        onOpenChange={setMetaOpen}
        metadata={extras.metadata ?? {}}
        onSave={(metadata) => {
          setInvoiceExtras(invoice.id, { metadata });
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
          {demo === "mark-paid"
            ? "Marking an invoice as paid isn't wired up in the demo yet — record an external payment instead; it stays pending until a provider confirms."
            : "Charging a customer isn't wired up in the demo yet — no payment provider is connected."}
        </p>
      </FormDialog>
    </DashboardPage>
  );
}

/* ---------- dialogs ---------- */

function NoteDialog({ open, onOpenChange, existing, onSave }: {
  open: boolean; onOpenChange: (o: boolean) => void; existing?: { text: string; time: string }[];
  onSave: (text: string) => void;
}) {
  const [text, setText] = useState("");
  return (
    <FormDialog
      open={open}
      onOpenChange={(o) => { if (o) setText(""); onOpenChange(o); }}
      title={existing?.length ? "Add another note" : "Add note"}
      description="Notes are only visible to your team."
      footer={
        <button className="btn btn-primary" onClick={() => onSave(text.trim())}>
          Save
        </button>
      }
    >
      <Field label="Note">
        <textarea className="field min-h-24 w-full text-sm" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Customer asked to settle after the weekend" />
      </Field>
    </FormDialog>
  );
}

function RecordPaymentDialog({ open, onOpenChange, invoice, remaining, onSave }: {
  open: boolean; onOpenChange: (o: boolean) => void; invoice: Invoice; remaining: number;
  onSave: (amount: number, method: string) => void;
}) {
  const [amount, setAmount] = useState(String(remaining || 0));
  const [method, setMethod] = useState("Bank transfer");
  const valid = Number(amount) > 0 && Number(amount) <= remaining;
  return (
    <FormDialog
      open={open}
      onOpenChange={(o) => { if (o) { setAmount(String(remaining || 0)); setMethod("Bank transfer"); } onOpenChange(o); }}
      title="Record an external payment"
      description={`Record a payment received outside Griv for ${invoice.id}. It stays pending until a provider confirms it.`}
      footer={
        <button className="btn btn-primary" disabled={!valid} onClick={() => onSave(Number(amount), method)}>
          Record payment
        </button>
      }
    >
      <div className="space-y-4">
        <Field label="Amount" error={Number(amount) > remaining ? `Amount cannot exceed the ${formatMoney(remaining, invoice.currency)} outstanding.` : ""}>
          <input className="field h-9 w-full text-sm" type="number" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Method">
          <select className="field h-9 w-full text-sm" value={method} onChange={(e) => setMethod(e.target.value)}>
            {["Bank transfer", "Card", "Cash", "Mobile money"].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </Field>
        <p className="text-xs text-muted-foreground">
          {formatMoney(remaining, invoice.currency)} is still outstanding on this invoice.
        </p>
      </div>
    </FormDialog>
  );
}

function CreditNoteDialog({ open, onOpenChange, invoice, max, onSave }: {
  open: boolean; onOpenChange: (o: boolean) => void; invoice: Invoice; max: number;
  onSave: (amount: number, reason: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const valid = Number(amount) > 0 && Number(amount) <= max && reason.trim().length > 0;
  return (
    <FormDialog
      open={open}
      onOpenChange={(o) => { if (o) { setAmount(""); setReason(""); } onOpenChange(o); }}
      title="Issue credit note"
      description={`Credit up to ${formatMoney(max, invoice.currency)} of the amount already paid on ${invoice.id}.`}
      footer={
        <button className="btn btn-primary" disabled={!valid} onClick={() => onSave(Number(amount), reason.trim())}>
          Issue credit note
        </button>
      }
    >
      <div className="space-y-4">
        <Field label="Amount" error={Number(amount) > max ? `Credit notes cannot exceed ${formatMoney(max, invoice.currency)}.` : ""}>
          <input className="field h-9 w-full text-sm" type="number" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Reason">
          <input className="field h-9 w-full text-sm" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Damaged goods returned" />
        </Field>
      </div>
    </FormDialog>
  );
}

function MetaDialog({ open, onOpenChange, metadata, onSave }: {
  open: boolean; onOpenChange: (o: boolean) => void; metadata?: Record<string, string>;
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
          onClick={() => { onSave({ ...(metadata ?? {}), [key.trim()]: value.trim() }); setKey(""); setValue(""); }}
        >
          Save
        </button>
      }
    >
      <div className="space-y-4">
        {Object.entries(metadata ?? {}).map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-4 rounded-md border border-input px-3 py-2 text-sm">
            <span className="font-medium">{k}</span>
            <span className="text-muted-foreground">{v}</span>
          </div>
        ))}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Key" error={key && !/^[A-Za-z0-9_-]+$/.test(key) ? "Use letters, numbers, dashes or underscores." : ""}>
            <input className="field h-9 w-full text-sm" value={key} onChange={(e) => setKey(e.target.value)} placeholder="po_number" />
          </Field>
          <Field label="Value">
            <input className="field h-9 w-full text-sm" value={value} onChange={(e) => setValue(e.target.value)} placeholder="PO-2026-114" />
          </Field>
        </div>
      </div>
    </FormDialog>
  );
}
