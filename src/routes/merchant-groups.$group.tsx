import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { GroupAppShell } from "@/components/griv/merchant-groups/GroupAppShell";
import { GroupDashboard, GroupSectionNote } from "@/components/griv/merchant-groups/GroupDashboard";
import { getGroup, type Feature, type MerchantGroup } from "@/lib/merchant-groups";

export const Route = createFileRoute("/merchant-groups/$group")({
  loader: ({ params }) => {
    const group = getGroup(params.group);
    if (!group) throw notFound();
    return { slug: group.slug };
  },
  head: ({ loaderData }) => {
    const g = loaderData ? getGroup(loaderData.slug) : undefined;
    const title = g ? `${g.name} dashboard — Griv Finance` : "Merchant group unavailable — Griv Finance";
    const desc = g ? `Proposed Griv dashboard and menu for ${g.name.toLowerCase()} businesses. ${g.description}` : "This merchant group could not be found.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(g ? [] : [{ name: "robots", content: "noindex" }]),
      ],
    };
  },
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="panel max-w-md p-10 text-center">
        <h1 className="text-2xl font-semibold">This merchant group doesn't exist</h1>
        <Link to="/merchant-groups" className="btn btn-primary mt-6 h-10 text-sm">See all merchant groups</Link>
      </div>
    </div>
  ),
  component: GroupPage,
});

function GroupPage() {
  const { slug } = Route.useLoaderData();
  // key resets the selected menu item when switching groups
  return <GroupView key={slug} group={getGroup(slug)!} />;
}

function GroupView({ group }: { group: MerchantGroup }) {
  const [active, setActive] = useState<Feature>("Dashboard");
  return (
    <GroupAppShell group={group} active={active} onSelect={setActive}>
      {active === "Dashboard"
        ? <GroupDashboard group={group} />
        : <GroupSectionNote group={group} feature={active} onBack={() => setActive("Dashboard")} />}
    </GroupAppShell>
  );
}
