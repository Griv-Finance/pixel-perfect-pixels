import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardPage } from "@/components/griv/DashboardPage";
import { StateSwitcher } from "@/components/griv/pages/dashboard/StateSwitcher";
import { NewMerchantDashboard } from "@/components/griv/pages/dashboard/NewMerchantDashboard";
import { VerifiedMerchantDashboard } from "@/components/griv/pages/dashboard/VerifiedMerchantDashboard";
import { ActiveMerchantDashboard } from "@/components/griv/pages/dashboard/ActiveMerchantDashboard";
import { PreviewNoticeDialog, type PreviewInfo } from "@/components/griv/pages/dashboard/PreviewNoticeDialog";
import { STATE_LABELS, useDashboardState } from "@/lib/demo/dashboard";
import { useGriv } from "@/lib/griv-store";
import { DEMO_TODAY } from "@/lib/dates";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Griv Finance" },
      {
        name: "description",
        content:
          "Your Griv dashboard, previewed for a new, verified or active merchant — with realistic sample data and no real money moving.",
      },
      { property: "og:title", content: "Dashboard — Griv Finance" },
      { property: "og:description", content: "Preview the Griv dashboard for new, verified and active merchants." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const g = useGriv();
  const state = useDashboardState();
  const [preview, setPreview] = useState<PreviewInfo | null>(null);
  const openPreview = (p: PreviewInfo) => setPreview(p);
  const business = g.businessName || "Nova Retail Ltd.";
  const hour = DEMO_TODAY.getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const description =
    state === "new"
      ? "Your account is ready — get verified and set up to take payments."
      : state === "verified"
        ? "You're verified — finish setup and take your first payment."
        : "Here's how your business is doing.";

  return (
    <DashboardPage
      crumbs={[]}
      title={`${greet}, ${business}.`}
      description={description}
      actions={<StateSwitcher state={state} />}
      notice={
        <>
          Preview dashboard state: <strong>{STATE_LABELS[state]}</strong>. All figures are sample data — switching states
          never changes your real account, and no real money moves.
        </>
      }
    >
      {state === "new" ? (
        <NewMerchantDashboard onPreview={openPreview} />
      ) : state === "verified" ? (
        <VerifiedMerchantDashboard onPreview={openPreview} />
      ) : (
        <ActiveMerchantDashboard />
      )}
      <PreviewNoticeDialog preview={preview} onClose={() => setPreview(null)} />
    </DashboardPage>
  );
}
