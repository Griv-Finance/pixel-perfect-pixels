import { Link } from "@tanstack/react-router";
import { Wallet } from "lucide-react";
import { DashboardSection, Metric } from "./Section";
import { settlementStats } from "@/lib/demo/dashboard";
import { formatMoney, formatMoneyCompact } from "@/lib/money";
import type { DateRange } from "@/lib/dates";
import type { LedgerEntry } from "@/lib/demo/ledger";
import type { BalanceAccount } from "@/lib/demo/accounts";
import { cn } from "@/lib/utils";

/** MailerLite's Automations layout: one-third primary metric, two-thirds 2×2 metric grid, no graph. */
export function BalancesSection({ ledger, accounts, range }: {
  ledger: LedgerEntry[];
  accounts: BalanceAccount[];
  range: DateRange;
}) {
  const s = settlementStats(ledger, accounts, range);
  const cells = [
    { label: "Pending balance", value: formatMoneyCompact(s.pendingBalance, "NGN"), sub: "Awaiting settlement", cls: "border-b" },
    { label: "Settled amount", value: formatMoneyCompact(s.settledAmount, "NGN"), sub: range, cls: "border-b sm:border-l" },
    { label: "Completed settlements", value: s.completed.toLocaleString("en-NG"), sub: range, cls: "sm:border-l" },
    { label: "Pending settlements", value: s.pendingSettlements.toLocaleString("en-NG"), sub: range, cls: "" },
  ];

  return (
    <DashboardSection icon={Wallet} title="Balances & settlements" className="border-b">
      <div className="grid lg:grid-cols-3">
        <div className="p-6 lg:border-r">
          <Metric label="Available balance" value={formatMoneyCompact(s.available, "NGN")} big />
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Money across your NGN wallets that you can use or pay out right now.
          </p>
          <Link to="/balances" className="mt-4 inline-block text-sm font-semibold text-primary underline-offset-2 hover:underline">
            View balances
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:col-span-2">
          {cells.map((c) => (
            <div key={c.label} className={cn("p-6", c.cls)}>
              <Metric label={c.label} value={c.value} sub={c.sub} />
            </div>
          ))}
        </div>
      </div>
    </DashboardSection>
  );
}
