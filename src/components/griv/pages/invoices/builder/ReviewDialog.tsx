import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/money";
import { customerByName } from "@/lib/demo/customers";
import { invoiceTotals, type Invoice } from "@/lib/demo/invoices";
import { finalizeInvoice, reviewErrors, type FinalizeOptions } from "@/lib/demo/invoice-builder";
import type { MerchantInfo } from "@/lib/demo/merchant";
import { DEMO_TODAY } from "@/lib/dates";
import { format, addDays } from "date-fns";
import { InvoiceDocument, PreviewBody, PreviewTabs, type PreviewTab } from "./previews";

const minSchedule = format(DEMO_TODAY, "yyyy-MM-dd'T'HH:mm");
const defaultSchedule = format(addDays(DEMO_TODAY, 1), "yyyy-MM-dd'T'09:00");

/**
 * Final verification step (not another editor): choose Finalize and send / Finalize only, PDF payment
 * link, optional scheduled finalization, and inspect the PDF, email and payment page before committing.
 */
export function ReviewDialog({ invoice, merchant, live, onClose, onFinalize }: {
  invoice: Invoice; merchant: MerchantInfo; live: boolean; onClose: () => void; onFinalize: (o: FinalizeOptions) => Promise<void>;
}) {
  const [send, setSend] = useState(invoice.sendOnFinalize ?? true);
  const [includeLink, setIncludeLink] = useState(invoice.includePaymentLink ?? true);
  const [schedule, setSchedule] = useState(!!invoice.scheduledFor);
  const [scheduleAt, setScheduleAt] = useState(invoice.scheduledFor ?? defaultSchedule);
  const [tab, setTab] = useState<PreviewTab>("pdf");
  const [pane, setPane] = useState<"settings" | "preview">("settings");
  const [enlarged, setEnlarged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const opts: FinalizeOptions = { send, includePaymentLink: includeLink, scheduleAt: schedule ? scheduleAt : undefined };
  const problems = reviewErrors(invoice, opts);
  const previewOpts = schedule && !problems.length ? opts : { ...opts, scheduleAt: undefined };
  const preview = finalizeInvoice(invoice, previewOpts);
  const total = invoiceTotals(invoice).total;
  const email = customerByName(invoice.customer)?.email;
  const action = schedule ? "Schedule finalization" : send ? "Finalize and send" : "Finalize";

  const confirm = async () => {
    if (busy || problems.length) return;
    setBusy(true);
    setFailure(null);
    try {
      await onFinalize(opts);
    } catch {
      setFailure("We couldn't finalize this invoice. Nothing was lost — your draft is saved. Try again in a moment.");
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-full max-w-full flex-col gap-0 p-0 sm:h-auto sm:max-h-[92vh] sm:max-w-5xl">
        <DialogHeader className="border-b px-5 py-4 text-left">
          <DialogTitle className="pr-8 text-lg">
            Review {formatMoney(total, invoice.currency)} invoice for {invoice.customer}
          </DialogTitle>
          <DialogDescription className="sr-only">Choose how to finalize this invoice and check the previews.</DialogDescription>
        </DialogHeader>

        {/* Mobile switch between settings and preview */}
        <div className="flex gap-1 border-b px-5 py-2 text-sm font-medium md:hidden" role="tablist">
          {(["settings", "preview"] as const).map((p) => (
            <button key={p} role="tab" aria-selected={pane === p} onClick={() => setPane(p)} className={cn("rounded-md px-3 py-1 capitalize", pane === p ? "bg-accent text-primary" : "text-muted-foreground")}>
              {p}
            </button>
          ))}
        </div>

        <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[19rem_minmax(0,1fr)] md:overflow-hidden">
          {/* Left — finalization and delivery */}
          <div className={cn("space-y-4 border-r p-5 md:overflow-y-auto", pane === "settings" ? "block" : "hidden md:block")}>
            <div role="radiogroup" aria-label="Finalization" className="grid grid-cols-2 gap-2">
              {[
                { v: true, label: "Finalize and send" },
                { v: false, label: "Finalize only" },
              ].map(({ v, label }) => (
                <button
                  key={label}
                  role="radio"
                  aria-checked={send === v}
                  onClick={() => setSend(v)}
                  className={cn("rounded-lg border px-3 py-2 text-left text-sm font-medium", send === v ? "border-primary bg-accent text-primary ring-1 ring-primary" : "hover:bg-muted")}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="space-y-3 rounded-lg border p-3 text-sm">
              {send ? (
                <>
                  <p className="text-muted-foreground">Griv emails the invoice with a link to pay. Drafts stay editable until they're finalized.</p>
                  <div>
                    <p className="mb-1 text-xs font-medium">To</p>
                    <p className={cn("rounded-md border bg-muted/50 px-2.5 py-1.5 text-sm", !email && "border-destructive text-destructive")}>
                      {email ?? "No email on this customer"}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">A PDF and payment page are still created, for you to share yourself.</p>
              )}
              <label className="flex items-start gap-2">
                <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" checked={includeLink} onChange={(e) => setIncludeLink(e.target.checked)} />
                <span>
                  <span className="font-medium">Include link to payment page on PDF</span>
                  <span className="block text-xs text-muted-foreground">Allow your customer to pay using the payment methods you've enabled.</span>
                </span>
              </label>
              <label className="flex items-start gap-2">
                <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" checked={schedule} onChange={(e) => setSchedule(e.target.checked)} />
                <span>
                  <span className="font-medium">Schedule finalization date</span>
                  <span className="block text-xs text-muted-foreground">Choose when this invoice should be finalized. You can keep editing until then.</span>
                </span>
              </label>
              {schedule && (
                <div className="pl-6">
                  <input
                    type="datetime-local"
                    aria-label="Finalization date and time"
                    className="field h-9 w-full text-sm"
                    min={minSchedule}
                    value={scheduleAt}
                    onChange={(e) => setScheduleAt(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {send ? "The email goes out when it finalizes." : "Nothing is emailed."} Scheduled jobs run on Griv's servers, which this demo doesn't have.
                  </p>
                </div>
              )}
            </div>

            {problems.length > 0 && (
              <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
                <p className="mb-1 flex items-center gap-1.5 font-medium text-destructive">
                  <AlertTriangle className="h-4 w-4" /> Fix before finalizing
                </p>
                <ul className="list-disc space-y-0.5 pl-5 text-xs text-destructive">
                  {problems.map((p) => <li key={p}>{p}</li>)}
                </ul>
              </div>
            )}
            {failure && (
              <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{failure}</p>
            )}
          </div>

          {/* Right — previews */}
          <div className={cn("min-w-0 bg-muted/40 p-5 md:overflow-y-auto", pane === "preview" ? "block" : "hidden md:block")}>
            <PreviewTabs tab={tab} onTab={setTab} />
            <div className="mx-auto max-w-xl">
              <PreviewBody tab={tab} invoice={preview} merchant={merchant} live={live} final willSend={send} onEnlarge={() => setEnlarged(true)} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t px-5 py-3">
          <button className="btn btn-outline h-9 text-sm" disabled={busy} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary h-9 text-sm" disabled={busy || problems.length > 0} onClick={confirm} aria-busy={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? (schedule ? "Scheduling…" : "Finalizing…") : action}
          </button>
        </div>

        <Dialog open={enlarged} onOpenChange={setEnlarged}>
          <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>PDF preview</DialogTitle>
              <DialogDescription>{invoice.id} · {invoice.pageSize ?? "A4"}</DialogDescription>
            </DialogHeader>
            <InvoiceDocument invoice={preview} merchant={merchant} final />
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
