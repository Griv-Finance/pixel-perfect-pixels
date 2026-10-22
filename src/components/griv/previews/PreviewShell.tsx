import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { AppShell } from "@/components/griv/AppShell";
import { useGriv } from "@/lib/griv-store";

/** Wraps preview pages in the real Griv app layout so the main menu stays exactly as it is. */
export function PreviewShell({ children }: { children: ReactNode }) {
  const g = useGriv();
  const [live, setLive] = useState(true);
  const business = g.businessName || "Nova Retail Ltd.";
  const initials = ((g.firstName[0] ?? "A") + (g.lastName[0] ?? "O")).toUpperCase();
  return (
    <AppShell business={business} initials={initials} live={live} onLiveChange={setLive}>
      <div className="mx-auto max-w-7xl">{children}</div>
    </AppShell>
  );
}

export function PreviewTabs({ current }: { current: "groups" | "compare" }) {
  const cls = (on: boolean) =>
    `rounded-md px-3 py-1.5 ${on ? "bg-blackwood text-blackwood-foreground" : "text-muted-foreground hover:text-foreground"}`;
  return (
    <div className="flex rounded-lg border bg-card p-0.5 text-sm font-medium">
      <Link to="/previews" className={cls(current === "groups")}>All groups</Link>
      <Link to="/previews/compare" className={cls(current === "compare")}>Compare</Link>
    </div>
  );
}
