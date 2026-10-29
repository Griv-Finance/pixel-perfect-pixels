import { createFileRoute } from "@tanstack/react-router";
import { BalancesPage } from "@/components/griv/pages/balances/BalancesPage";
export const Route = createFileRoute("/balances-old")({
  head: () => ({
    meta: [
      { title: "Balances (original) — Griv Finance" },
      {
        name: "description",
        content: "The original Balances design, kept for comparison with the new Transactions-style page.",
      },
      { property: "og:title", content: "Balances (original) — Griv Finance" },
      {
        property: "og:description",
        content: "The original Balances design, kept for comparison with the new Transactions-style page.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BalancesPage,
});
