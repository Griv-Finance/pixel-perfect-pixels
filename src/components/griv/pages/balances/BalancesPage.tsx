import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, Plus, Repeat } from "lucide-react";
import { toast } from "sonner";
import {
  DashboardPage,
  DataTable,
  DetailList,
  EmptyState,
  ExportButton,
  Field,
  FormDialog,
  StatusBadge,
  useDemoLoading,
  type Column,
} from "@/components/griv/kit";
import { PayoutFlow } from "../payouts/PayoutFlow";
import { accountsStore, useAccounts } from "@/lib/demo/accounts";
import { balanceHistory, liensFor, type BalanceMove, type Lien } from "@/lib/demo/balance-history";
import { formatMoney, type Currency } from "@/lib/money";
import { fmtDateTime } from "@/lib/dates";
import { exportCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";

function UnderTabs({ value, onChange, tabs }: {
  value: string; onChange: (v: string) => void; tabs: string[];
}) {
  return (
    <div className="flex gap-5 overflow-x-auto" role="tablist">
      {tabs.map((t) => (
        <button
          key={t}
          role="tab"
          aria-selected={value === t}
          onClick={() => onChange(t)}
          className={cn(
            "-mb-px whitespace-nowrap border-b-2 px-1 pb-3 pt-1 text-sm font-medium transition-colors",
            value === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

export function BalancesPage() {
  const accounts = useAccounts();
  const loading = useDemoLoading();
  const currencies = [...new Set(accounts.map((a) => a.currency))];
  const [currency, setCurrency] = useState<Currency>(currencies[0] ?? "NGN");
  const [tab, setTab] = useState("Balance History");
  const [addOpen, setAddOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Bank transfer");

  const wallets = accounts.filter((a) => a.currency === currency);
  const available = wallets.reduce((s, a) => s + a.available, 0);
  const pending = wallets.reduce((s, a) => s + a.pending, 0);
  const history = useMemo(() => balanceHistory(currency), [currency]);
  const liens = useMemo(() => liensFor(currency), [currency]);

  const addFunds = () => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return;
    const target = wallets.find((a) => a.kind === "Main") ?? wallets[0];
    if (!target) return;
    accountsStore.set((list) =>
      list.map((a) => (a.id === target.id ? { ...a, pending: a.pending + n } : a)),
    );
    setAddOpen(false);
    setAmount("");
    toast("Funding request pending — awaiting confirmation. Demo: no money moved.");
  };

  const moveColumns: Column<BalanceMove>[] = [
    { key: "date", header: "Date / Time", cell: (r) => fmtDateTime(r.date), sort: (r) => r.date },
    {
      key: "details",
      header: "Details",
      cell: (r) => (
        <div>
          <span className="block">{r.details}</span>
          <Link to="/transactions" search={{ q: r.reference }} className="text-xs text-primary hover:underline">
            {r.reference}
          </Link>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      sort: (r) => r.amount,
      cell: (r) => (
        <span className={cn("font-medium", r.amount >= 0 ? "text-success-foreground" : "text-destructive")}>
          {formatMoney(r.amount, r.currency, { signed: true })}
        </span>
      ),
    },
    {
      key: "balanceAfter",
      header: "Balance After",
      align: "right",
      sort: (r) => r.balanceAfter,
      cell: (r) => <span className="font-medium">{formatMoney(r.balanceAfter, r.currency)}</span>,
    },
  ];
  const lienColumns: Column<Lien>[] = [
    { key: "date", header: "Date / Time", cell: (r) => fmtDateTime(r.date), sort: (r) => r.date },
    { key: "reference", header: "Reference", cell: (r) => r.id },
    { key: "reason", header: "Reason", cell: (r) => r.reason },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      sort: (r) => r.amount,
      cell: (r) => formatMoney(r.amount, r.currency),
    },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <DashboardPage
      title="Balances"
      crumbs={[{ label: "Money" }]}
      description="Manage your balances across supported currencies. View available funds, pending settlements, and account activity."
    >
      <UnderTabs value={currency} onChange={(v) => setCurrency(v as Currency)} tabs={currencies} />

      <section className="flex flex-wrap items-end justify-between gap-8 py-8">
        <div className="flex flex-wrap gap-x-14 gap-y-6">
          <div>
            <p className="text-sm text-muted-foreground">Pending Balance ({currency})</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight tnum">
              {formatMoney(pending, currency)}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">Funds received but not yet available</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Available Balance ({currency})</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight tnum">
              {formatMoney(available, currency)}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">For withdrawals and payouts</p>
          </div>
        </div>
        <div className="flex w-full max-w-xs flex-col gap-2">
          <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Funds
          </button>
          <div className="flex gap-2">
            <button className="btn btn-outline flex-1" onClick={() => setWithdrawOpen(true)}>
              <ArrowUpRight className="h-4 w-4" />
              Withdraw
            </button>
            <button className="btn btn-outline flex-1" onClick={() => setConvertOpen(true)}>
              <Repeat className="h-4 w-4" />
              Convert Funds
            </button>
          </div>
        </div>
      </section>

      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <UnderTabs value={tab} onChange={setTab} tabs={["Balance History", "Lien History"]} />
        <ExportButton
          disabled={!(tab === "Balance History" ? history : liens).length}
          onClick={() =>
            tab === "Balance History"
              ? exportCsv(`balance-history-${currency}`.toLowerCase(), history)
              : exportCsv(`lien-history-${currency}`.toLowerCase(), liens)
          }
        />
      </div>
      <section className="panel overflow-hidden">
        {tab === "Balance History" ? (
          <>
            <p className="px-5 pt-4 text-xs text-muted-foreground">
              Posted movements for {currency} only. Pending items appear once they settle, and each
              row links to its transaction details.
            </p>
            <DataTable
              columns={moveColumns}
              rows={history}
              rowKey={(r) => r.id}
              pageSize={10}
              loading={loading}
              initialSort={{ key: "date", dir: "desc" }}
              empty={
                <EmptyState
                  title="No balance movements yet"
                  description={`Posted ${currency} movements will appear here.`}
                />
              }
            />
          </>
        ) : (
          <>
            <p className="px-5 pt-4 text-xs text-muted-foreground">
              Prototype sample data — lien management isn't wired up in this demo yet.
            </p>
            <DataTable
              columns={lienColumns}
              rows={liens}
              rowKey={(r) => r.id}
              pageSize={10}
              loading={loading}
              initialSort={{ key: "date", dir: "desc" }}
              empty={
                <EmptyState
                  title="No liens for this currency"
                  description={`Held or released ${currency} funds will appear here.`}
                />
              }
            />
          </>
        )}
      </section>

      <FormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add Funds"
        description={`Fund your ${currency} balance. The amount stays pending until the provider confirms it.`}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setAddOpen(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={!(Number(amount) > 0)} onClick={addFunds}>
              Request funding
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Amount" hint="Demo only — nothing is charged and no money moves.">
            <input
              type="number"
              min="0"
              className="field"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
          <Field label="Funding method">
            <select className="field" value={method} onChange={(e) => setMethod(e.target.value)}>
              {["Bank transfer", "Card", "USSD"].map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <DetailList
            items={[
              ["Currency", currency],
              ["Lands in", (wallets.find((a) => a.kind === "Main") ?? wallets[0])?.name ?? "—"],
              ["Status after request", "Pending until confirmed"],
            ]}
          />
        </div>
      </FormDialog>

      <FormDialog
        open={convertOpen}
        onOpenChange={setConvertOpen}
        title="Convert Funds"
        description="Currency conversion isn't wired up in this demo yet."
        footer={<button className="btn btn-outline" onClick={() => setConvertOpen(false)}>Close</button>}
      >
        <p className="text-sm text-muted-foreground">
          Converting between {currencies.join(", ")} balances will be available once the conversion
          service is connected. Your {currency} balances are unchanged.
        </p>
      </FormDialog>

      {withdrawOpen && <PayoutFlow onClose={() => setWithdrawOpen(false)} />}
    </DashboardPage>
  );
}
