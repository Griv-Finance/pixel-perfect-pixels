import { createFileRoute } from "@tanstack/react-router";
import { InvoiceDetail } from "@/components/griv/pages/invoices/detail/Detail";
export const Route = createFileRoute("/invoices/$invoiceId")({
  head: () => ({
    meta: [
      { title: "Invoice — Griv Finance" },
      { name: "description", content: "Invoice details, payments and activity in Griv." },
      { property: "og:title", content: "Invoice — Griv Finance" },
      { property: "og:description", content: "Invoice details, payments and activity in Griv." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InvoiceDetail,
});
