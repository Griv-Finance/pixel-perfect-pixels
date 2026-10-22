import { createFileRoute } from "@tanstack/react-router";
import { VirtualAccountsPage } from "@/components/griv/pages/virtual-accounts/Page";
export const Route = createFileRoute("/virtual-accounts")({
 head: () => ({ meta: [{ title: "Virtual Accounts — Griv Finance" }, { name: "description", content: "Manage Nova Retail virtual accounts with Griv." }, { property: "og:title", content: "Virtual Accounts — Griv Finance" }, { property: "og:description", content: "Manage and track virtual accounts in your Griv workspace." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
 component: VirtualAccountsPage,
});
