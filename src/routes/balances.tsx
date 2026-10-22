import { createFileRoute } from "@tanstack/react-router";
import { BalancesPage } from "@/components/griv/pages/balances/BalancesPage";
export const Route = createFileRoute("/balances")({
 head: () => ({ meta: [
 { title: "Balances — Griv Finance" },
 { name: "description", content: "Manage Nova Retail’s balances with Griv Finance." },
 { property: "og:title", content: "Balances — Griv Finance" },
 { property: "og:description", content: "Manage Nova Retail’s balances with Griv Finance." },
 { property: "og:type", content: "website" },
 { name: "twitter:card", content: "summary_large_image" }
 ] }), component: BalancesPage,
});
