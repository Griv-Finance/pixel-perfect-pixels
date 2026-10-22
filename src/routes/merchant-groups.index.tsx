import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Eye } from "lucide-react";
import { MerchantGroupsLayout } from "@/components/griv/merchant-groups/MerchantGroupsLayout";
import { MERCHANT_GROUPS, groupFeatures } from "@/lib/merchant-groups";

export const Route = createFileRoute("/merchant-groups/")({
  head: () => ({
    meta: [
      { title: "Merchant Groups — Griv Finance" },
      { name: "description", content: "Explore ten proposed Griv dashboards, each with a menu tailored to a different type of business." },
      { property: "og:title", content: "Merchant Groups — Griv Finance" },
      { property: "og:description", content: "See how Griv could simplify its menu for online stores, retailers, service businesses and more." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MerchantGroupsLanding,
});

function MerchantGroupsLanding() {
  return (
    <MerchantGroupsLayout current="groups">
      <div className="max-w-2xl">
        <p className="label-caps flex items-center gap-1.5 text-primary"><Eye className="h-3.5 w-3.5" />Menu previews</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Merchant groups</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Ten proposed Griv dashboards. Each one shows only the menu a type of business needs. Pick one to open it.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {MERCHANT_GROUPS.map((g) => (
          <Link
            key={g.slug}
            to="/merchant-groups/$group"
            params={{ group: g.slug }}
            className="panel group flex flex-col p-6 transition-colors hover:border-primary"
          >
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
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                Open dashboard<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </MerchantGroupsLayout>
  );
}
