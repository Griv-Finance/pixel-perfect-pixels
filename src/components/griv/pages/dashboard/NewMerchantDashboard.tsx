import { Link } from "@tanstack/react-router";
import { SetupChecklist } from "./SetupChecklist";
import { VerificationCard } from "./VerificationCard";
import { QuickActions, ResourcesHelp } from "./QuickActions";
import type { PreviewInfo } from "./PreviewNoticeDialog";

/**
 * New-merchant state: verification first, then an actionable setup checklist,
 * quick actions and resources — never a wall of empty zeros.
 */
export function NewMerchantDashboard({ onPreview }: { onPreview: (p: PreviewInfo) => void }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <div className="space-y-4">
        <VerificationCard onPreview={onPreview} />
        <SetupChecklist state="new" onPreview={onPreview} />
      </div>
      <div className="space-y-4">
        <QuickActions />
        <ResourcesHelp onPreview={onPreview} />
      </div>
    </div>
  );
}
