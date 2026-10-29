import { createFileRoute } from "@tanstack/react-router";
import { LinkBuilderWorkspace } from "@/components/griv/pages/payment-links/builder/Workspace";
export const Route = createFileRoute("/payment-links/new")({
  head: () => ({
    meta: [
      { title: "Create a payment link — Griv Finance" },
      { name: "description", content: "Configure products, subscriptions or flexible payments with a live checkout preview." },
      { property: "og:title", content: "Create a payment link — Griv Finance" },
      { property: "og:description", content: "Configure products, subscriptions or flexible payments with a live checkout preview." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <LinkBuilderWorkspace />,
});
