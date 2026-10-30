import { createFileRoute } from "@tanstack/react-router";
import { SettingsHome } from "@/components/griv/settings/SettingsHome";

const title = "Settings — Griv Finance";
const description = "Manage your business, payments, team, and account preferences on Griv.";

export const Route = createFileRoute("/settings/")({
  validateSearch: (s: Record<string, unknown>) => ({
    category: typeof s["category"] === "string" ? s["category"] : undefined,
  }),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsHome,
});
