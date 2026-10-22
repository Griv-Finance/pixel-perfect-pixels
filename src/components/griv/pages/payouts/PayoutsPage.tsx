import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Upload, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import {
  DashboardPage,
  MetricGrid,
  MetricCard,
  Toolbar,
  SearchInput,
  DateRangeSelect,
  FilterSelect,
  ClearFilters,
  ExportButton,
  StatusTabs,
  DataTable,
  StatusBadge,
  EmptyState,
  ErrorState,
  DetailDrawer,
  DetailList,
  Timeline,
  CopyButton,
  FormDialog,
  useDemoLoading,
  type Column,
} from "@/components/griv/kit";
import { getAccount, holdFunds, useAccounts } from "@/lib/demo/accounts";
import { payoutsStore, type Payout } from "@/lib/demo/payouts";
import { formatMoney, formatMoneyCompact } from "@/lib/money";
import { fmtDate, fmtDateTime, inRange, nowIso, type DateRange } from "@/lib/dates";
import { makeRef } from "@/lib/demo-store";
import { exportCsv } from "@/lib/csv";
import { PayoutFlow } from "./PayoutFlow";
import { BulkPayoutFlow } from "./BulkPayoutFlow";
const statuses = ["All", "Successful", "Pending", "Failed", "Scheduled"];
export function PayoutsPage() {
  const rows = payoutsStore.use(),
    accounts = useAccounts(),
    loading = useDemoLoading();
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState("All"),
    [currency, setCurrency] = useState("All"),
    [date, setDate] = useState<DateRange>("All time"),
    [selected, setSelected] = useState<Payout | null>(null),
    [flow, setFlow] = useState<"single" | "bulk" | null>(null),
    [retry, setRetry] = useState<Payout | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const filtered = rows.filter(
    (r) =>
      (status === "All" || r.status === status) &&
      (currency === "All" || r.currency === currency) &&
      inRange(r.date, date) &&
      `${r.id} ${r.recipient.name} ${r.recipient.bank} ${r.narration}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const clear = () => {
    setSearch("");
    setStatus("All");
    setCurrency("All");
    setDate("All time");
  };
  const columns: Column<Payout>[] = [
    {
      key: "reference",
      header: "Reference",
      sort: (r) => r.id,
      cell: (r) => (
        <button className="font-semibold hover:text-primary" onClick={() => setSelected(r)}>
          {r.id}
        </button>
      ),
    },
    {
      key: "recipient",
      header: "Recipient",
      hideBelow: "sm",
      sort: (r) => r.recipient.name,
      cell: (r) => (
        <div className="max-w-44 truncate font-medium">
          {r.recipient.name}
          <span className="block text-xs font-normal text-muted-foreground">
            ••{r.recipient.account.slice(-4)}
          </span>
        </div>
      ),
    },
    {
      key: "bank",
      header: "Bank / channel",
      hideBelow: "lg",
      cell: (r) => (
        <div>
          {r.recipient.bank}
          <span className="block text-xs text-muted-foreground">{r.recipient.channel}</span>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      sort: (r) => r.amount,
      cell: (r) => formatMoney(r.amount, r.currency),
    },
    { key: "currency", header: "Currency", hideBelow: "lg", cell: (r) => r.currency },
    {
      key: "fee",
      header: "Fee",
      align: "right",
      hideBelow: "lg",
      cell: (r) => formatMoney(r.fee, r.currency),
    },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    {
      key: "date",
      header: "Date",
      hideBelow: "md",
      sort: (r) => r.date,
      cell: (r) => fmtDate(r.date),
    },
  ];
  const total = retry ? Math.round((retry.amount + retry.fee) * 100) / 100 : 0;
  const retryAccount = accounts.find((a) => a.id === retry?.source);
  const canRetry = !!retryAccount && retryAccount.available >= total;
  async function confirmRetry() {
    if (!retry || busy || !canRetry) return;
    setBusy(true);
    setError("");
    await new Promise((r) => setTimeout(r, 700));
    const current = getAccount(retry.source);
    if (!current || current.available < total) {
      setError("Insufficient available balance. Retry after funding the source account.");
      setBusy(false);
      return;
    }
    const { reason: _, schedule: __, ...original } = retry;
    const attempt: Payout = {
      ...original,
      id: makeRef("PAY"),
      retryOf: retry.id,
      status: "Pending",
      date: nowIso(),
    };
    holdFunds(retry.source, total);
    payoutsStore.set((r) => [attempt, ...r]);
    setRetry(null);
    setSelected(attempt);
    setBusy(false);
    toast("Retry awaiting provider confirmation (demo — nothing was sent)");
  }
  return (
    <DashboardPage
      crumbs={[{ label: "Money" }, { label: "Payouts" }]}
      title="Payouts"
      description="Pay your suppliers, team, and partners outside Griv."
      actions={
        <>
          <button className="btn btn-outline" onClick={() => setFlow("bulk")}>
            <Upload className="h-4 w-4" />
            Bulk payout
          </button>
          <button className="btn btn-primary" onClick={() => setFlow("single")}>
            <Plus className="h-4 w-4" />
            Create payout
          </button>
        </>
      }
    >
      <MetricGrid cols={5}>
        <MetricCard
          dark
          label="Payout value · NGN"
          value={formatMoneyCompact(
            rows
              .filter((r) => r.currency === "NGN" && r.status === "Successful")
              .reduce((s, r) => s + r.amount, 0),
          )}
          sub={`${rows.length} payouts · all currencies`}
          icon={ArrowUpRight}
        />
        {["Successful", "Pending", "Failed", "Scheduled"].map((s) => (
          <MetricCard
            key={s}
            label={s}
            value={rows.filter((r) => r.status === s).length}
            sub={
              s === "Failed"
                ? "Review and retry eligible payouts"
                : s === "Scheduled"
                  ? "Upcoming sample payouts"
                  : "Payouts · all currencies"
            }
          />
        ))}
      </MetricGrid>
      <div className="mb-6 flex flex-wrap justify-between gap-2 text-sm text-muted-foreground">
        <p>External bank & mobile money payments. Fees shown before you confirm.</p>
        <Link to="/transfers" className="font-semibold text-primary hover:underline">
          Moving between your accounts? Transfers →
        </Link>
      </div>
      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="font-semibold">Payout history</h2>
          <span className="text-xs text-muted-foreground">All times local</span>
        </div>
        <Toolbar
          right={
            <ExportButton
              disabled={!filtered.length}
              onClick={() =>
                exportCsv(
                  "griv-payout-report",
                  filtered.map((r) => ({
                    reference: r.id,
                    recipient: r.recipient.name,
                    bank: r.recipient.bank,
                    channel: r.recipient.channel,
                    account: r.recipient.account,
                    amount: r.amount,
                    currency: r.currency,
                    fee: r.fee,
                    status: r.status,
                    date: r.date,
                    narration: r.narration,
                    scheduled: r.schedule ?? "",
                    failure_reason: r.reason ?? "",
                    retry_of: r.retryOf ?? "",
                  })),
                )
              }
            />
          }
        >
          <SearchInput value={search} onChange={setSearch} placeholder="Search payouts…" />
          <DateRangeSelect value={date} onChange={setDate} />
          <FilterSelect
            label="Currency"
            value={currency}
            onChange={setCurrency}
            options={["All", "NGN", "GHS", "KES", "USD"]}
          />
          <ClearFilters
            show={!!search || status !== "All" || currency !== "All" || date !== "All time"}
            onClear={clear}
          />
        </Toolbar>
        <StatusTabs
          value={status}
          onChange={setStatus}
          tabs={statuses.map((s) => ({
            value: s,
            label: s,
            count: s === "All" ? rows.length : rows.filter((r) => r.status === s).length,
          }))}
        />
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(r) => r.id}
          onRowClick={setSelected}
          loading={loading}
          empty={
            <EmptyState
              title={rows.length ? "No matching payouts" : "No payouts yet"}
              description="Create a payout or adjust your search and filters."
              action={
                <button
                  className="btn btn-outline"
                  onClick={rows.length ? clear : () => setFlow("single")}
                >
                  {rows.length ? "Clear filters" : "Create payout"}
                </button>
              }
            />
          }
        />
      </section>
      <DetailDrawer
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) setSelected(null);
        }}
        title="Payout details"
        subtitle={selected?.id}
        badge={selected && <StatusBadge status={selected.status} />}
        footer={
          selected?.status === "Failed" ? (
            <button
              className="btn btn-primary"
              onClick={() => {
                setRetry(selected);
                setError("");
              }}
            >
              Retry payout
            </button>
          ) : null
        }
      >
        {selected && (
          <>
            <p className="text-3xl font-semibold tnum">
              {formatMoney(selected.amount, selected.currency)}
            </p>
            <DetailList
              items={[
                [
                  "Reference",
                  <span className="flex gap-2">
                    {selected.id}
                    <CopyButton value={selected.id} iconOnly />
                  </span>,
                ],
                ["Recipient", selected.recipient.name],
                ["Bank / channel", `${selected.recipient.bank} · ${selected.recipient.channel}`],
                ["Account", selected.recipient.account],
                ["Funding account", accounts.find((a) => a.id === selected.source)?.name],
                ["Currency", selected.currency],
                ["Fee", formatMoney(selected.fee, selected.currency)],
                ["Total", formatMoney(selected.amount + selected.fee, selected.currency)],
                ["Narration", selected.narration],
                ["Date", fmtDateTime(selected.date)],
                ["Schedule", selected.schedule ?? "Not scheduled"],
                ...(selected.retryOf ? [["Retry of", selected.retryOf] as [string, string]] : []),
              ]}
            />
            {selected.status === "Failed" && (
              <ErrorState
                title="Payout failed"
                description={
                  selected.reason ?? "The provider could not complete this sample payout."
                }
              />
            )}
            <h3 className="font-semibold">Event timeline</h3>
            <Timeline
              events={[
                { label: "Payout created", time: fmtDateTime(selected.date), tone: "info" },
                selected.status === "Pending"
                  ? {
                      label: "Awaiting provider confirmation (demo — nothing was sent)",
                      time: fmtDateTime(selected.date),
                      tone: "pending",
                    }
                  : selected.status === "Failed"
                    ? {
                        label: "Destination rejected payout",
                        time: fmtDateTime(selected.date),
                        tone: "danger",
                      }
                    : selected.status === "Scheduled"
                      ? {
                          label: "Scheduled for " + selected.schedule,
                          time: fmtDateTime(selected.date),
                          tone: "info",
                        }
                      : {
                          label: "Provider confirmed payout (sample)",
                          time: fmtDateTime(selected.date),
                          tone: "success",
                        },
              ]}
            />
          </>
        )}
      </DetailDrawer>
      {flow === "single" && <PayoutFlow onClose={() => setFlow(null)} />}{" "}
      {flow === "bulk" && <BulkPayoutFlow onClose={() => setFlow(null)} />}
      {retry && (
        <FormDialog
          open
          onOpenChange={(o) => {
            if (!o && !busy) setRetry(null);
          }}
          title="Retry payout?"
          description="The failed attempt stays in your history. A new Pending attempt will be created."
          footer={
            <>
              <button className="btn btn-outline" disabled={busy} onClick={() => setRetry(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={busy || !canRetry}
                onClick={() => void confirmRetry()}
              >
                {busy ? "Holding funds…" : "Confirm retry"}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <DetailList
              items={[
                ["Recipient", retry.recipient.name],
                ["Original reference", retry.id],
                ["Source", retryAccount?.name],
                ["Amount", formatMoney(retry.amount, retry.currency)],
                ["Fee", formatMoney(retry.fee, retry.currency)],
                ["Total hold", formatMoney(total, retry.currency)],
              ]}
            />
            <p className="text-sm text-muted-foreground">
              Demo only. This reserves funds and waits for provider confirmation; nothing is sent.
            </p>
            {(!canRetry || error) && (
              <p role="alert" className="text-sm text-destructive">
                {error || "Insufficient available balance for this retry and fee."}
              </p>
            )}
          </div>
        </FormDialog>
      )}
    </DashboardPage>
  );
}
