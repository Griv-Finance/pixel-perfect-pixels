import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { FEATURE_CARDS } from "@/lib/demo/dashboard";
import type { PreviewInfo } from "./PreviewNoticeDialog";

/** Feature setup cards for the verified-merchant state: each feature is one switch-on step. */
export function FeatureCards({ onPreview }: { onPreview: (p: PreviewInfo) => void }) {
  return (
    <section aria-label="Feature setup">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">Set up your tools</h2>
        <span className="text-xs text-muted-foreground">Turn on what you need — nothing else</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {FEATURE_CARDS.map((f) => {
          const inner = (
            <>
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{f.title}</p>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">Not set up</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{f.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Set up <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </>
          );
          return f.href ? (
            <Link key={f.id} to={f.href} className="panel flex flex-col p-5 transition-colors hover:border-primary">
              {inner}
            </Link>
          ) : (
            <button key={f.id} type="button" onClick={() => f.preview && onPreview(f.preview)} className="panel flex flex-col p-5 text-left transition-colors hover:border-primary">
              {inner}
            </button>
          );
        })}
      </div>
    </section>
  );
}
