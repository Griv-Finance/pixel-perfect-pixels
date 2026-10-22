import { createFileRoute } from "@tanstack/react-router";
import { PayoutsPage } from "@/components/griv/pages/payouts/PayoutsPage";
export const Route = createFileRoute("/payouts")({
  head: () => ({
    meta: [
      { title: "Payouts — Griv Finance" },
      { name: "description", content: "Manage Nova Retail’s payouts with Griv Finance." },
      { property: "og:title", content: "Payouts — Griv Finance" },
      { property: "og:description", content: "Manage Nova Retail’s payouts with Griv Finance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PayoutsPage,
});
