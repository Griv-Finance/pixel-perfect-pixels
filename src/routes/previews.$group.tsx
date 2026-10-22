import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Columns3 } from "lucide-react";
import { PreviewShell } from "@/components/griv/previews/PreviewShell";
import { PreviewSidebar } from "@/components/griv/previews/PreviewSidebar";
import { PreviewDashboard, PreviewSectionNote } from "@/components/griv/previews/PreviewDashboard";
import { MERCHANT_GROUPS, getGroup, type Feature, type MerchantGroup } from "@/lib/merchant-groups";

export const Route = createFileRoute("/previews/$group")({
  loader: ({ params }) => {
    const group = getGroup(params.group);
    if (!group) throw notFound();
    return { slug: group.slug };
  },
  head: ({ loaderData }) => {
    const g = loaderData ? getGroup(loaderData.slug) : undefined;
    const title = g ? `${g.name} menu preview — Griv Finance` : "Preview unavailable — Griv Finance";
    const desc = g ? `Proposed Griv menu and dashboard for ${g.name.toLowerCase()} businesses. ${g.description}` : "This merchant group preview could not be found.";
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
    <PreviewShell>
      <div className="panel p-10 text-center">
        <h1 className="text-2xl font-semibold">This preview doesn't exist</h1>
        <Link to="/previews" className="btn btn-primary mt-6 h-10 text-sm">See all merchant groups</Link>
      </div>
    </PreviewShell>
  ),
  component: GroupPreview,
});

function GroupPreview() {
  const { slug } = Route.useLoaderData();
  const group = getGroup(slug)!;
  return (
    <PreviewShell>
      {/* key resets the selected menu item when switching groups */}
      <GroupPreviewBody key={group.slug} group={group} />
    </PreviewShell>
  );
}

function GroupPreviewBody({ group }: { group: MerchantGroup }) {
  const navigate = useNavigate();
  const [active, setActive] = useState<Feature>("Dashboard");
  const idx = MERCHANT_GROUPS.indexOf(group);
  const prev = MERCHANT_GROUPS[(idx + MERCHANT_GROUPS.length - 1) % MERCHANT_GROUPS.length]!;
  const next = MERCHANT_GROUPS[(idx + 1) % MERCHANT_GROUPS.length]!;
  const go = (s: string) => navigate({ to: "/previews/$group", params: { group: s } });

  return (
    <>
      <Link to="/previews" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />All merchant groups
      </Link>

      <header className="mt-4 flex flex-wrap items-end justify-between gap-4 border-b pb-6">
        <div className="max-w-xl">
          <p className="label-caps text-primary">Merchant group {group.letter} · menu preview</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{group.name}</h1>
          <p className="mt-2 text-muted-foreground">{group.description}</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <button onClick={() => go(prev.slug)} className="btn btn-outline h-10 w-10 shrink-0 px-0" aria-label={`Previous: ${prev.name}`}><ChevronLeft className="h-4 w-4" /></button>
          <label className="min-w-0 flex-1 sm:w-72 sm:flex-none">
            <span className="sr-only">Switch merchant group</span>
            <select value={group.slug} onChange={(e) => go(e.target.value)} className="field h-10 cursor-pointer text-sm font-medium">
              {MERCHANT_GROUPS.map((g) => <option key={g.slug} value={g.slug}>{g.letter}. {g.name}</option>)}
            </select>
          </label>
          <button onClick={() => go(next.slug)} className="btn btn-outline h-10 w-10 shrink-0 px-0" aria-label={`Next: ${next.name}`}><ChevronRight className="h-4 w-4" /></button>
          <Link to="/previews/compare" className="btn btn-dark h-10 w-full text-sm sm:w-auto"><Columns3 className="h-4 w-4" />Compare</Link>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[250px_1fr]">
        <PreviewSidebar group={group} active={active} onSelect={setActive} />
        <div className="min-w-0">
          {active === "Dashboard"
            ? <PreviewDashboard group={group} />
            : <PreviewSectionNote group={group} feature={active} onBack={() => setActive("Dashboard")} />}
        </div>
      </div>
    </>
  );
}
