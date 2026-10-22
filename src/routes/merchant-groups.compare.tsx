import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MerchantGroupsLayout } from "@/components/griv/merchant-groups/MerchantGroupsLayout";
import {
  FEATURE_ICONS, MERCHANT_GROUPS, featurePlacement, groupFeatures, type Feature,
} from "@/lib/merchant-groups";

export const Route = createFileRoute("/merchant-groups/compare")({
  head: () => ({
    meta: [
      { title: "Compare merchant group menus — Griv Finance" },
      { name: "description", content: "Compare the ten proposed Griv menus side by side, feature by feature." },
      { property: "og:title", content: "Compare merchant group menus — Griv Finance" },
      { property: "og:description", content: "See which features each type of business gets and where they sit in the menu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Compare,
});

// Every feature used by any group, in the order of the main Griv menu.
const ALL_FEATURES = (Object.keys(FEATURE_ICONS) as Feature[]).filter((f) =>
  MERCHANT_GROUPS.some((g) => featurePlacement(g, f) !== null),
);

function Compare() {
  const [shown, setShown] = useState<string[]>(MERCHANT_GROUPS.map((g) => g.slug));
  const [onlyDiff, setOnlyDiff] = useState(false);
  const groups = MERCHANT_GROUPS.filter((g) => shown.includes(g.slug));
  const toggle = (s: string) =>
    setShown((cur) => (cur.includes(s) ? (cur.length > 1 ? cur.filter((x) => x !== s) : cur) : [...cur, s]));
  const rows = onlyDiff
    ? ALL_FEATURES.filter((f) => new Set(groups.map((g) => featurePlacement(g, f))).size > 1)
    : ALL_FEATURES;

  return (
    <MerchantGroupsLayout current="compare">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight">Compare menus</h1>
        <p className="mt-2 text-muted-foreground">Each cell shows which menu section a feature sits under for that business type. A dash means it isn't shown.</p>
      </div>

      <div className="panel mt-6 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="label-caps">Groups to compare</p>
          <div className="flex gap-3 text-sm">
            <button onClick={() => setShown(MERCHANT_GROUPS.map((g) => g.slug))} className="font-semibold text-primary hover:underline">Select all</button>
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={onlyDiff} onChange={(e) => setOnlyDiff(e.target.checked)} className="h-4 w-4 accent-primary" />
              Only show differences
            </label>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {MERCHANT_GROUPS.map((g) => (
            <button key={g.slug} onClick={() => toggle(g.slug)} data-selected={shown.includes(g.slug)} aria-pressed={shown.includes(g.slug)}
              className="choice px-3 py-1.5 text-sm">
              <span className="font-semibold">{g.letter}</span>{g.name}
            </button>
          ))}
        </div>
      </div>

      <div className="panel mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/60 text-left align-bottom">
              <th className="label-caps sticky left-0 z-10 min-w-40 bg-muted px-4 py-3 font-semibold">Feature</th>
              {groups.map((g) => (
                <th key={g.slug} className="min-w-32 px-3 py-3 font-semibold">
                  <Link to="/merchant-groups/$group" params={{ group: g.slug }} className="hover:text-primary hover:underline">
                    <span className="block text-xs text-muted-foreground">{g.letter}</span>{g.name}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            <tr className="bg-accent/40">
              <td className="sticky left-0 z-10 bg-accent px-4 py-2.5 font-semibold">Menu sections</td>
              {groups.map((g) => <td key={g.slug} className="px-3 py-2.5 text-xs text-muted-foreground">{g.sidebar.map((s) => s.category).join(" · ")}</td>)}
            </tr>
            <tr className="bg-accent/40">
              <td className="sticky left-0 z-10 bg-accent px-4 py-2.5 font-semibold">Menu items</td>
              {groups.map((g) => <td key={g.slug} className="px-3 py-2.5 font-semibold tnum">{groupFeatures(g).length}</td>)}
            </tr>
            {rows.map((f) => {
              const Icon = FEATURE_ICONS[f];
              return (
                <tr key={f} className="hover:bg-muted/40">
                  <td className="sticky left-0 z-10 bg-card px-4 py-2.5 font-medium">
                    <span className="flex items-center gap-2"><Icon className="h-4 w-4 text-muted-foreground" />{f}</span>
                  </td>
                  {groups.map((g) => {
                    const p = featurePlacement(g, f);
                    return (
                      <td key={g.slug} className="px-3 py-2.5">
                        {p === null ? <span className="text-muted-foreground/50">—</span>
                          : p === "Add-on" ? <span className="rounded border border-dashed border-input px-1.5 py-0.5 text-xs text-muted-foreground">Optional</span>
                          : <span className="rounded bg-secondary px-1.5 py-0.5 text-xs font-medium">{p}</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </MerchantGroupsLayout>
  );
}
