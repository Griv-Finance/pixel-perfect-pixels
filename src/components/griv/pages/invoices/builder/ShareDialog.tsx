import { useState } from "react";
import { Download, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CopyButton } from "@/components/griv/kit";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { customerByName } from "@/lib/demo/customers";
import { deliveryStatus, type Invoice } from "@/lib/demo/invoices";
import { hostedUrl } from "@/lib/demo/invoice-details";
import type { MerchantInfo } from "@/lib/demo/merchant";

/** Shown after a successful finalization: download the PDF or copy the payment page link, then continue. */
export function ShareDialog({ invoice, merchant, onContinue }: { invoice: Invoice; merchant: MerchantInfo; onContinue: () => void }) {
  const [busy, setBusy] = useState(false);
  const url = hostedUrl(invoice);
  const queued = deliveryStatus(invoice) === "Sending";
  const download = async () => {
    setBusy(true);
    try {
      const { downloadInvoicePdf } = await import("@/lib/invoice-pdf");
      await downloadInvoicePdf(invoice, merchant);
      toast.success("Invoice PDF downloaded");
    } catch {
      toast.error("Couldn't build the PDF — try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onContinue()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle>Share this invoice with your customer</DialogTitle>
          <DialogDescription>{invoice.id} is finalized. Download the invoice or copy the link to its payment page.</DialogDescription>
        </DialogHeader>

        {queued && (
          <p className="flex gap-2 rounded-lg border bg-highlight/60 p-3 text-xs text-highlight-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Email to {customerByName(invoice.customer)?.email ?? "the customer"} is queued, not delivered — no email service is connected in this demo.
              Share the PDF or link yourself for now.
            </span>
          </p>
        )}

        <div className="space-y-4">
          <div>
            <p className="mb-1.5 text-sm font-medium">Invoice PDF</p>
            <button className="btn btn-outline h-9 text-sm" onClick={download} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download PDF
            </button>
          </div>
          <div>
            <label htmlFor="share-url" className="mb-1.5 block text-sm font-medium">Payment page</label>
            <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5">
              <input id="share-url" readOnly value={url} onFocus={(e) => e.target.select()} className="min-w-0 flex-1 bg-transparent font-mono text-xs outline-none" />
              <CopyButton value={url} label="Copy link" iconOnly />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">Preview link — hosted payment pages go live once Griv's payment backend is connected.</p>
          </div>
        </div>

        <div className="flex justify-end">
          <button className="btn btn-primary h-9 text-sm" onClick={onContinue}>Continue</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
