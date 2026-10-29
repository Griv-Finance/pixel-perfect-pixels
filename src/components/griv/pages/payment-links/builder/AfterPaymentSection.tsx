import { cn } from "@/lib/utils";
import { recurringItems, type BuilderConfig, type ConfigErrors } from "@/lib/demo/link-builder";

/** Part G — After payment: confirmation page vs redirect, custom message, post-payment invoice. */
export function AfterPaymentSection({ cfg, update, errors }: {
  cfg: BuilderConfig; update: (fn: (c: BuilderConfig) => BuilderConfig) => void; errors: ConfigErrors;
}) {
  const ap = cfg.afterPayment;
  const patch = (over: Partial<BuilderConfig["afterPayment"]>) => update((c) => ({ ...c, afterPayment: { ...c.afterPayment, ...over } }));
  const hasRecurring = cfg.linkType === "products" && recurringItems(cfg).length > 0;

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-sm font-semibold">Confirmation page</h2>
        <div className="mt-3 space-y-2">
          <label className="flex items-start gap-2.5 text-sm font-medium">
            <input type="radio" name="ap-mode" className="mt-0.5" checked={ap.mode === "confirmation"} onChange={() => patch({ mode: "confirmation" })} />
            <span>Show confirmation page</span>
          </label>
          {ap.mode === "confirmation" && (
            <div className="pl-6">
              <label className="flex items-start gap-2.5 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={ap.customMessageEnabled}
                  onChange={(e) => patch({ customMessageEnabled: e.target.checked })}
                />
                <span>Replace default with custom message</span>
              </label>
              {ap.customMessageEnabled && (
                <>
                  <textarea
                    className="field mt-2 min-h-20 text-sm"
                    placeholder="Include any details you'd like customers to see, such as delivery information."
                    aria-label="Custom confirmation message"
                    value={ap.customMessage}
                    onChange={(e) => patch({ customMessage: e.target.value })}
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Please note that custom messages aren't translated based on your customer's location.
                  </p>
                </>
              )}
            </div>
          )}
          <label className="flex items-start gap-2.5 text-sm font-medium">
            <input type="radio" name="ap-mode" className="mt-0.5" checked={ap.mode === "redirect"} onChange={() => patch({ mode: "redirect" })} />
            <span>
              Don't show confirmation page
              <span className="block text-xs font-normal text-muted-foreground">Redirect customers to your website.</span>
            </span>
          </label>
          {ap.mode === "redirect" && (
            <div className="pl-6">
              <input
                className={cn("field h-9 text-sm", errors.redirect && "border-destructive")}
                placeholder="https://your-store.example/thank-you"
                aria-label="Redirect URL"
                value={ap.redirectUrl}
                onChange={(e) => patch({ redirectUrl: e.target.value })}
              />
              {errors.redirect && <p className="mt-1 text-xs font-medium text-destructive" role="alert">{errors.redirect}</p>}
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold">Post-payment invoice</h2>
        <label className="mt-3 flex items-start gap-2.5 text-sm font-medium">
          <input
            type="checkbox"
            className="mt-0.5"
            disabled={hasRecurring}
            checked={ap.invoicePdf}
            onChange={(e) => patch({ invoicePdf: e.target.checked })}
          />
          <span>
            Create an invoice PDF
            {hasRecurring && (
              <span className="block text-xs font-normal text-muted-foreground">Invoices are created automatically for recurring payments.</span>
            )}
          </span>
        </label>
        <p className="mt-2 text-xs text-muted-foreground">
          Post-payment invoices provide more information than a regular receipt. You can also email customers a receipt from your email settings.
        </p>
      </div>
    </section>
  );
}
