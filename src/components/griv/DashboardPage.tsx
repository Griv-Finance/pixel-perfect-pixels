import type { ReactNode } from "react";
import { AppShell } from "./AppShell";
import { DemoNotice, PageHeader, type Crumb } from "./kit/basics";
import { useGriv } from "@/lib/griv-store";
import { setLiveMode, useLiveMode } from "@/lib/live-mode";

/**
 * Standard dashboard page: the real Griv app layout + breadcrumb/title header + sample-data notice.
 * Every management page (Balances, Invoices, Orders…) uses this so they look and behave the same.
 */
export function DashboardPage({ crumbs, title, description, actions, notice, children }: {
  crumbs?: Crumb[]; title?: ReactNode; description?: string; actions?: ReactNode;
  /** Override the sample-data notice text, or pass false to hide it. */
  notice?: ReactNode | false;
  children: ReactNode;
}) {
  const g = useGriv();
  const live = useLiveMode();
  const business = g.businessName || "Nova Retail Ltd.";
  const initials = ((g.firstName[0] ?? "A") + (g.lastName[0] ?? "O")).toUpperCase();
  return (
    <AppShell business={business} initials={initials} live={live} onLiveChange={setLiveMode}>
      <div className="mx-auto max-w-7xl">
        <PageHeader crumbs={[{ label: "Dashboard", to: "/dashboard" }, ...(crumbs ?? [])]} title={title} description={description} actions={actions} />
        {notice ? <DemoNotice>{notice}</DemoNotice> : null}
        {children}
      </div>
    </AppShell>
  );
}
