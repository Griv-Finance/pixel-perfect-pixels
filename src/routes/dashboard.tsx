import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/components/griv/DashboardPage";
import { UnifiedDashboard } from "@/components/griv/pages/dashboard/unified/UnifiedDashboard";
import { useGriv } from "@/lib/griv-store";
import { DEMO_TODAY } from "@/lib/dates";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Griv Finance" },
      {
        name: "description",
        content:
          "Your Griv dashboard — payments, balances and settlements, payment links, invoices and e-commerce performance, with realistic sample data.",
      },
      { property: "og:title", content: "Dashboard — Griv Finance" },
      { property: "og:description", content: "Payments-first merchant analytics for your Griv business." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const g = useGriv();
  const business = g.businessName || "Nova Retail Ltd.";
  const named = business.replace(/\.$/, "");
  const hour = DEMO_TODAY.getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <DashboardPage
      crumbs={[]}
      title={`${greet}, ${named}.`}
      description="Here's how your business is doing."
      notice={false}
    >
      <UnifiedDashboard />
    </DashboardPage>
  );
}
