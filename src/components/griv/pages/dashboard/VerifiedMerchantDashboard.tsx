import { Link } from "@tanstack/react-router";
import { BadgeCheck } from "lucide-react";
import { useAccounts } from "@/lib/demo/accounts";
import { MetricCard, MetricGrid, SectionTitle } from "@/components/griv/kit";
import { formatMoney } from "@/lib/money";
import { SetupChecklist } from "./SetupChecklist";
import { QuickActions, ResourcesHelp } from "./QuickActions";
import { FeatureCards } from "./FeatureCards";
import type { PreviewInfo } from "./PreviewNoticeDialog";

/**
 * Verified merchant state: compliance is done, so the focus shifts to feature setup
 * and taking the first payment, with only a limited financial overview.
 */
export function VerifiedMerchantDashboard({ onPreview }: { onPreview: (p: PreviewInfo) => void }) {
  const accounts = useAccounts();
  const main = accounts.find((a) => a.id === "acc_ngn_main")!;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Primary activation action */}
        <section className="flex flex-col justify-between rounded-xl bg-blackwood p-6 text-blackwood-foreground lg:p-8" aria-label="Activate your business">
          <div>
            <p className="flex items-center gap-2 label-caps text-blackwood-foreground/60">
              <BadgeCheck className="h-4 w-4 text-primary" />
              You're verified
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Now take your first payment.</h2>
            <p className="mt-2 max-w-lg text-sm text-blackwood-foreground/70">
              Your account is confirmed, so payment channels can open in your business name. Create a payment link, share
              it, and your first payment will land straight in your wallet.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link to="/payment-links" className="btn btn-primary h-10 text-sm">
              Create a payment link
            </Link>
            <Link to="/onboarding" className="btn h-10 border border-blackwood-foreground/25 text-sm hover:bg-blackwood-foreground/10">
              Finish payment setup
            </Link>
          </div>
        </section>

        {/* Limited financial overview */}
        <section aria-label="Limited overview">
          <p className="label-caps mb-3">Quick look at your money</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <MetricCard
              label="Available balance"
              value={formatMoney(main.available, "NGN")}
              sub={<>NGN main wallet · <Link to="/balances" className="font-semibold text-primary hover:underline">see all wallets</Link></>}
            />
            <MetricCard
              label="Settlements in transit"
              value={formatMoney(main.pending, "NGN")}
              sub="Waiting to settle into your bank"
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            A fuller overview appears once your first payment comes in — sample data, shown to keep the demo realistic.
          </p>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <SetupChecklist state="verified" onPreview={onPreview} />
        <FeatureCards onPreview={onPreview} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <QuickActions />
        <ResourcesHelp onPreview={onPreview} />
      </div>
    </div>
  );
}
