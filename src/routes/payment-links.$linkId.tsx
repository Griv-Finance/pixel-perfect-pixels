import { createFileRoute } from "@tanstack/react-router";
import { LinkDetail } from "@/components/griv/pages/payment-links/LinkDetail";
export const Route = createFileRoute("/payment-links/$linkId")({
  head: () => ({
    meta: [
      { title: "Payment link — Griv Finance" },
      { name: "description", content: "Details, collections and preview for a Griv payment link." },
      { property: "og:title", content: "Payment link — Griv Finance" },
      {
        property: "og:description",
        content: "Details, collections and preview for a Griv payment link.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LinkDetail,
});
