import { createFileRoute } from "@tanstack/react-router";
import { OrdersPage } from "@/components/griv/pages/orders/OrdersPage";
export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Orders — Griv Finance" },
      { name: "description", content: "Manage Nova Retail orders." },
      { property: "og:title", content: "Orders — Griv Finance" },
      { property: "og:description", content: "Manage your commerce with Griv." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrdersPage,
});
