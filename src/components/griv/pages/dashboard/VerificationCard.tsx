import { Check, ShieldCheck } from "lucide-react";
import type { PreviewInfo } from "./PreviewNoticeDialog";
import { VERIFY_PREVIEW } from "./previews";

const STEPS = [
  "Provide your business and identity verification details.",
  "Submit your information and track your verification status.",
];

/**
 * New-merchant state, modelled on the Dyser reference: a large horizontal
 * verification card with content on the left and a layered verification
 * illustration on the right — the most prominent element on the page.
 */
export function VerificationCard({ onPreview }: { onPreview: (p: PreviewInfo) => void }) {
  return (
    <section className="panel p-6 sm:p-8 lg:p-10" aria-label="Business verification">
      <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="max-w-xl">
          <h2 className="text-2xl font-semibold tracking-tight">Let's verify your business</h2>
          <p className="mt-2 text-muted-foreground">
            To start accepting live payments, we need to verify your business information in accordance with applicable
            compliance requirements.
          </p>
          <ul className="mt-5 space-y-2.5">
            {STEPS.map((step) => (
              <li key={step} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </span>
                {step}
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => onPreview(VERIFY_PREVIEW)} className="btn btn-primary mt-7 h-10 text-sm">
            Verify Your Business
          </button>
        </div>

        {/* Compact verification illustration: document + status card + check */}
        <div className="relative mx-auto h-52 w-full max-w-[320px]" aria-hidden="true">
          <div className="absolute right-2 top-0 h-32 w-32 rounded-full bg-accent" />
          <div className="absolute left-0 top-3 w-[58%] rounded-xl border bg-card p-4 shadow-md">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-primary">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block h-2 w-16 rounded-full bg-muted" />
                <span className="mt-1.5 block h-2 w-10 rounded-full bg-muted" />
              </span>
            </div>
            <div className="mt-4 space-y-2">
              <span className="block h-2 w-full rounded-full bg-muted" />
              <span className="block h-2 w-4/5 rounded-full bg-muted" />
            </div>
            <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/60 px-2.5 py-2">
              <span className="text-[10px] font-semibold text-muted-foreground">CAC certificate</span>
              <Check className="h-3 w-3 text-primary" />
            </div>
          </div>
          <div className="absolute bottom-2 right-0 w-[46%] rounded-xl border bg-card p-3 shadow-md">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Status</p>
            <span className="mt-2 inline-block rounded-full bg-highlight px-2 py-0.5 text-[10px] font-semibold text-highlight-foreground">
              In review
            </span>
            <div className="mt-2.5 h-1.5 w-full rounded-full bg-muted">
              <div className="h-1.5 w-2/3 rounded-full bg-primary" />
            </div>
          </div>
          <div className="absolute right-[40%] top-5 grid h-11 w-11 place-items-center rounded-full bg-success text-success-foreground shadow-md ring-4 ring-card">
            <Check className="h-5 w-5" />
          </div>
        </div>
      </div>
    </section>
  );
}
