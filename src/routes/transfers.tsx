import { createFileRoute } from "@tanstack/react-router";
import { TransfersPage } from "@/components/griv/pages/transfers/TransfersPage";
export const Route = createFileRoute("/transfers")({
 head: () => ({meta: [
 {title: "Transfers — Griv Finance"},
 {name: "description", content: "Manage Nova Retail’s transfers with Griv Finance."},
 {property: "og:title", content: "Transfers — Griv Finance"},
 {property: "og:description", content: "Manage Nova Retail’s transfers with Griv Finance."},
 {property: "og:type", content: "website"},
 {name: "twitter:card", content: "summary_large_image"},
 ]}), component: TransfersPage,
});
