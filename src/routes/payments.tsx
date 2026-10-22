import { createFileRoute } from "@tanstack/react-router";
import { PaymentsPage } from "@/components/griv/pages/payments/PaymentsPage";
export const Route = createFileRoute("/payments")({
  head: () => ({
    meta: [
      { title: "Payments — Griv Finance" },
      { name: "description", content: "Manage Nova Retail’s payments with Griv Finance." },
      { property: "og:title", content: "Payments — Griv Finance" },
      { property: "og:description", content: "Manage Nova Retail’s payments with Griv Finance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PaymentsPage,
});
