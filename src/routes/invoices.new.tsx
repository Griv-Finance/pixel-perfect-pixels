import { createFileRoute } from "@tanstack/react-router";
import { InvoiceWorkspace } from "@/components/griv/pages/invoices/builder/Workspace";

export const Route = createFileRoute("/invoices/new")({
  head: () => ({
    meta: [
      { title: "Create invoice — Griv Finance" },
      { name: "description", content: "Bill a customer with line items, taxes and payment terms, with a live PDF, email and payment page preview." },
      { property: "og:title", content: "Create invoice — Griv Finance" },
      { property: "og:description", content: "Bill a customer with line items, taxes and payment terms, with a live PDF, email and payment page preview." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <InvoiceWorkspace />,
});
