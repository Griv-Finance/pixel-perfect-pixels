import { createFileRoute } from "@tanstack/react-router";
import { InventoryPage } from "@/components/griv/pages/inventory/InventoryPage";
export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — Griv Finance" },
      { name: "description", content: "Manage inventory for Nova Retail on Griv." },
      { property: "og:title", content: "Inventory — Griv Finance" },
      { property: "og:description", content: "Manage inventory for Nova Retail on Griv." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InventoryPage,
});
