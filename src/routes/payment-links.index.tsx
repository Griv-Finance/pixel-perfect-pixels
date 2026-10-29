import { createFileRoute } from "@tanstack/react-router";
import { PaymentLinksPage } from "@/components/griv/pages/payment-links/Page";
export const Route = createFileRoute("/payment-links/")({
  head: () => ({
    meta: [
      { title: "Payment Links — Griv Finance" },
      { name: "description", content: "Manage Nova Retail payment links with Griv." },
      { property: "og:title", content: "Payment Links — Griv Finance" },
      {
        property: "og:description",
        content: "Manage and track payment links in your Griv workspace.",
      },
      { property: "og:type", content": "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PaymentLinksPage,
});
