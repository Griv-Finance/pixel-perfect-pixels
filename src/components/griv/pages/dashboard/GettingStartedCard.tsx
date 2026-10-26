import { Check } from "lucide-react";
import type { PreviewInfo } from "./PreviewNoticeDialog";
import { EXPLORE_PREVIEW } from "./previews";

/**
 * New-merchant state, modelled on the Dyser reference: a large horizontal
 * Getting Started card with content on the left and layered Griv product-UI
 * miniatures (payment link, code snippet, product, confirmation) on the right.
 */
export function GettingStartedCard({ onPreview }: { onPreview: (p: PreviewInfo) => void }) {
  return (
    <section className="panel p-6 sm:p-8 lg:p-10" aria-label="Getting started">
      <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="max-w-xl">
          <h2 className="text-2xl font-semibold tracking-tight">Getting Started</h2>
          <p className="mt-2 text-muted-foreground">
            Discover how Griv helps your business collect payments, sell products and services, manage customers, and run
            daily operations — all from one platform.
          </p>
          <button type="button" onClick={() => onPreview(EXPLORE_PREVIEW)} className="btn btn-outline mt-7 h-10 text-sm">
            Explore Griv
          </button>
        </div>

        {/* Layered product-UI illustration */}
        <div className="relative mx-auto h-44 w-full max-w-[340px]" aria-hidden="true">
          <div className="absolute left-0 top-6 z-10 w-[62%] rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold">Payment link</p>
              <span className="rounded bg-highlight px-1.5 py-0.5 text-[10px] font-semibold text-highlight-foreground">
                Active
              </span>
            </div>
            <p className="mt-2 truncate font-mono text-[11px] text-muted-foreground">griv.link/nova-retail</p>
            <p className="mt-2 text-lg font-semibold tnum">₦12,500.00</p>
            <div className="mt-3 grid h-8 place-items-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
              Pay now
            </div>
          </div>
          <div className="absolute right-0 top-0 w-[46%] rounded-xl bg-blackwood p-3.5 font-mono text-[10px] leading-relaxed text-blackwood-foreground/85 shadow-md">
            <p>
              <span className="font-semibold text-primary">POST</span> /v1/payments
            </p>
            <p className="opacity-70">{"{"}</p>
            <p className="pl-2 opacity-70">"amount": 12500,</p>
            <p className="pl-2 opacity-70">"currency": "NGN"</p>
            <p className="opacity-70">{"}"}</p>
          </div>
          <div className="absolute bottom-2 right-4 w-[52%] rounded-xl border bg-card p-3 shadow-md">
            <div className="flex items-center gap-2.5">
              <span className="h-9 w-9 shrink-0 rounded-lg bg-accent" />
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold">Shea Butter 250ml</span>
                <span className="block text-[11px] text-muted-foreground tnum">₦4,300.00</span>
              </span>
            </div>
          </div>
          <div className="absolute bottom-10 left-2 flex items-center gap-2 rounded-full border bg-card py-1.5 pl-1.5 pr-3 shadow-md">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-success text-success-foreground">
              <Check className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-semibold">Payment received</span>
          </div>
        </div>
      </div>
    </section>
  );
}
