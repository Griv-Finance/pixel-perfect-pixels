import { createFileRoute } from "@tanstack/react-router";
import { InvoiceWorkspace } from "@/components/griv/pages/invoices/builder/Workspace";

export const Route = createFileRoute("/invoices/$invoiceId_/edit")({
  head: () => ({
    meta: [
      { title: "Edit draft invoice — Griv Finance" },
      { name: "description", content: "Continue editing a draft or scheduled Griv invoice before it's finalized." },
      { property: "og:title", content: "Edit draft invoice — Griv Finance" },
      { property: "og:description", content: "Continue editing a draft or scheduled Griv invoice before it's finalized." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EditRoute,
});

function EditRoute() {
  const { invoiceId } = Route.useParams();
  return <InvoiceWorkspace invoiceId={invoiceId} />;
}
