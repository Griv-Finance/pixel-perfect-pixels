import { createFileRoute } from "@tanstack/react-router";
import { TransactionsPage } from "@/components/griv/pages/transactions/TransactionsPage";
export const Route = createFileRoute("/transactions")({
 head: () => ({ meta: [
 { title: "Transactions — Griv Finance" },
 { name: "description", content: "Manage Nova Retail’s transactions with Griv Finance." },
 { property: "og:title", content: "Transactions — Griv Finance" },
 { property: "og:description", content: "Manage Nova Retail’s transactions with Griv Finance." },
 { property: "og:type", content: "website" },
 { name: "twitter:card", content: "summary_large_image" }
 ] }), component: TransactionsPage,
});
