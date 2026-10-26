import { createFileRoute } from "@tanstack/react-router";
import { UnifiedTransactionsPage } from "@/components/griv/pages/transactions/UnifiedTransactionsPage";
export const Route = createFileRoute("/transactions")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Transactions — Griv Finance" },
      { name: "description", content: "View, track, and manage all your financial transactions in one place with Griv Finance." },
      { property: "og:title", content: "Transactions — Griv Finance" },
      {
        property: "og:description",
        content: "View, track, and manage all your financial transactions in one place with Griv Finance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UnifiedTransactionsPage,
});
