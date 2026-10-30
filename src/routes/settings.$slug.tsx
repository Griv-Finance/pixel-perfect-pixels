import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getSetting } from "@/lib/settings/registry";
import { SETTINGS_PAGES } from "@/components/griv/settings/pages";

export const Route = createFileRoute("/settings/$slug")({
  validateSearch: (s: Record<string, unknown>) => ({
    tab: typeof s["tab"] === "string" ? s["tab"] : undefined,
  }),
  beforeLoad: ({ params }) => {
    if (!getSetting(params.slug)) throw notFound();
  },
  head: ({ params }) => {
    const s = getSetting(params.slug);
    const title = s ? `${s.name} — Settings — Griv Finance` : "Setting not found — Griv Finance";
    const description = s?.description ?? "This setting doesn't exist.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(s ? [] : [{ name: "robots", content: "noindex" }]),
      ],
    };
  },
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div>
        <p className="text-lg font-semibold">That setting doesn't exist</p>
        <Link to="/settings" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">Back to Settings</Link>
      </div>
    </div>
  ),
  component: SettingPage,
});

function SettingPage() {
  const { slug } = Route.useParams();
  const Page = SETTINGS_PAGES[slug];
  return Page ? <Page /> : null;
}
