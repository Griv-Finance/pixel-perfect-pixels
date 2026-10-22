import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/griv/Logo";

/** Standalone page frame for the merchant groups landing and comparison pages. */
export function MerchantGroupsLayout({ current, children }: { current: "groups" | "compare"; children: ReactNode }) {
  const tab = (on: boolean) =>
    `rounded-md px-3 py-1.5 ${on ? "bg-blackwood text-blackwood-foreground" : "text-muted-foreground hover:text-foreground"}`;
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link to="/merchant-groups" aria-label="Merchant groups home"><Logo className="h-6" /></Link>
          <nav className="ml-auto flex rounded-lg border bg-card p-0.5 text-sm font-medium" aria-label="Merchant groups">
            <Link to="/merchant-groups" className={tab(current === "groups")}>All groups</Link>
            <Link to="/merchant-groups/compare" className={tab(current === "compare")}>Compare</Link>
          </nav>
          <Link to="/dashboard" className="hidden items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground sm:inline-flex">
            <ArrowLeft className="h-4 w-4" />Back to Griv
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}
