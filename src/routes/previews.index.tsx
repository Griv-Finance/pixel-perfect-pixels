import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Eye } from "lucide-react";
import { PreviewShell, PreviewTabs } from "@/components/griv/previews/PreviewShell";
import { MERCHANT_GROUPS, groupFeatures } from "@/lib/merchant-groups";

export const Route = createFileRoute("/previews/")({
  head: () => ({
    meta: [
      { title: "Merchant Group Previews — Griv Finance" },
      { name: "description", content: "Explore ten proposed Griv menu layouts, each tailored to a different type of business." },
      { property: "og:title", content: "Merchant Group Previews — Griv Finance" },
      { property: "og:description", content: "See how Griv could simplify its menu for online stores, retailers, service businesses and more." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PreviewsLanding,
});

function PreviewsLanding() {
  return (
    <PreviewShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="label-caps flex items-center gap-1.5 text-primary"><Eye className="h-3.5 w-3.5" />Preview area</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Merchant Group Previews</h1>
          <p className="mt-2 text-muted-foreground">
            Ten proposed menu layouts, each showing only what a type of business needs. These are previews — your main Griv menu on the left stays the same.
          </p>
        </div>
        <PreviewTabs current="groups" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {MERCHANT_GROUPS.map((g) => (
          <article key={g.slug} className="panel flex flex-col p-6 transition-colors hover:border-foreground/30">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blackwood text-sm font-bold text-blackwood-foreground">{g.letter}</span>
              <div className="min-w-0">
                <h2 className="font-semibold leading-tight">{g.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{g.description}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {g.sidebar.map((s) => (
                <span key={s.category} className="rounded-md bg-muted px-2 py-1 text-xs font-medium">
                  {s.category} <span className="text-muted-foreground">· {s.items.length}</span>
                </span>
              ))}
            </div>
            <div className="mt-auto flex items-center justify-between pt-6">
              <span className="text-xs text-muted-foreground">{groupFeatures(g).length} menu items</span>
              <Link to="/previews/$group" params={{ group: g.slug }} className="btn btn-primary h-9 text-sm">
                View preview<ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </PreviewShell>
  );
}
