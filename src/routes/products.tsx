import { createFileRoute } from "@tanstack/react-router";
import { ProductsPage } from "@/components/griv/pages/products/ProductsPage";
export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Products — Griv Finance" },
      { name: "description", content: "Manage products for Nova Retail on Griv." },
      { property: "og:title", content: "Products — Griv Finance" },
      { property: "og:description", content: "Manage products for Nova Retail on Griv." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductsPage,
});
