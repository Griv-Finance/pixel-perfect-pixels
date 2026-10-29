import { createFileRoute, Outlet } from "@tanstack/react-router";
export const Route = createFileRoute("/invoices")({
  head: () => ({
    meta: [
      { title: "Invoices — Griv Finance" },
      { name: "description", content: "Manage Nova Retail invoices with Griv." },
      { property: "og:title", content: "Invoices — Griv Finance" },
      { property: "og:description", content: "Manage and track invoices in your Griv workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  // Parent shell only; the list is the index route and each invoice gets its own child page.
  component: () => <Outlet />,
});
