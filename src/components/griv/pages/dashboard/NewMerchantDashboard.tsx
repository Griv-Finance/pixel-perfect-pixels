import { VerificationCard } from "./VerificationCard";
import { GettingStartedCard } from "./GettingStartedCard";
import { FeatureDiscovery } from "./FeatureDiscovery";
import type { PreviewInfo } from "./PreviewNoticeDialog";

/**
 * New-merchant state, modelled on the Dyser reference: the "Account Setup"
 * heading is rendered by the route header, then a verification card, a
 * Getting Started card and exactly three feature cards — no checklist,
 * progress bar, analytics, charts or tables in this state.
 */
export function NewMerchantDashboard({ onPreview }: { onPreview: (p: PreviewInfo) => void }) {
  return (
    <div className="space-y-5">
      <VerificationCard onPreview={onPreview} />
      <GettingStartedCard onPreview={onPreview} />
      <FeatureDiscovery />
    </div>
  );
}
