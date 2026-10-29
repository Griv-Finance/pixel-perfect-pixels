import { createFileRoute, Outlet } from "@tanstack/react-router";
export const Route = createFileRoute("/payment-links")({
  head: () => ({
    meta: [
      { title: "Payment Links — Griv Finance" },
      { name: "description", content: "Manage Nova Retail payment links with Griv." },
      { property: "og:title", content: "Payment Links — Griv Finance" },
      {
        property: "og:description",
        content: "Manage and track payment links in your Griv workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  // Parent shell only; the list is the index route and each link gets its own child page.
  component: () => <Outlet />,
});
