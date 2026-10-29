import { createFileRoute } from "@tanstack/react-router";
import { BalancesPreviewPage } from "@/components/griv/pages/balances/BalancesPreviewPage";
export const Route = createFileRoute("/balances-preview")({
  head: () => ({
    meta: [
      { title: "Balances — Transactions style preview — Griv Finance" },
      {
        name: "description",
        content: "Second Balances design in the MailerSend-inspired Transactions style, using the same balances data.",
      },
      { property: "og:title", content: "Balances — Transactions style preview — Griv Finance" },
      {
        property: "og:description",
        content: "Second Balances design in the MailerSend-inspired Transactions style, using the same balances data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BalancesPreviewPage,
});
