import { Link } from "@tanstack/react-router";
import { FileText, Landmark, ShieldCheck } from "lucide-react";
import type { PreviewInfo } from "./PreviewNoticeDialog";
import { VERIFY_PREVIEW } from "./previews";

const DOCS = [
  { icon: Landmark, label: "CAC certificate" },
  { icon: FileText, label: "Proof of address" },
  { icon: ShieldCheck, label: "Valid government ID" },
];

/** New-merchant state: prominent verification card, the first blocker before any money can move. */
export function VerificationCard({ onPreview }: { onPreview: (p: PreviewInfo) => void }) {
  return (
    <section className="panel p-6 lg:p-8" aria-label="Business verification">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <p className="label-caps">Business verification</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Get verified to start taking payments.</h2>
          <p className="mt-2 text-muted-foreground">
            Confirming your business lets Griv open payment channels in your name. Verification usually takes one to two
            business days once your documents are in.
          </p>
        </div>
        <span className="rounded-full bg-highlight px-3 py-1 text-xs font-semibold text-highlight-foreground">Not started</span>
      </div>
      <ul className="mt-6 grid gap-2 sm:grid-cols-3">
        {DOCS.map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-center gap-2.5 rounded-lg border bg-card px-3.5 py-3 text-sm font-medium">
            <Icon className="h-4 w-4 shrink-0 text-primary" />
            {label}
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" onClick={() => onPreview(VERIFY_PREVIEW)} className="btn btn-primary h-10 text-sm">
          Start business verification
        </button>
        <Link to="/onboarding" className="btn btn-outline h-10 text-sm">
          Continue setup
        </Link>
      </div>
    </section>
  );
}
