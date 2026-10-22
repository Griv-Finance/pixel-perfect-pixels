import { useMemo, useState } from "react";
import { ArrowDownLeft, Building2, Clock3, Plus, Wallet } from "lucide-react";
import { toast } from "sonner";
import {
  CardsSkeleton, ClearFilters, CopyButton, DashboardPage, DataTable, DateRangeSelect,
  EmptyState, ExportButton, FilterSelect, MetricCard, MetricGrid, SearchInput,
  StatusBadge, StatusTabs, Toolbar, useDemoLoading, type Column,
} from "@/components/griv/kit";
import { ACCOUNT_STATUSES, ACCOUNT_TYPES, BANKS, TYPE_HELP, VIRTUAL_ACCOUNTS, type VirtualAccount } from "@/lib/demo/virtual-accounts";
import { fmtDate, inRange, type DateRange } from "@/lib/dates";
import { formatMoney, formatMoneyCompact } from "@/lib/money";
import { exportCsv } from "@/lib/csv";
import { AccountDrawer } from "./AccountDrawer";
import { CreateAccount } from "./CreateAccount";

export function VirtualAccountsPage() {
  const [accounts, setAccounts] = useState(VIRTUAL_ACCOUNTS);
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [bank, setBank] = useState("All");
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("All");
  const [assignment, setAssignment] = useState("All");
  const [date, setDate] = useState<DateRange>("All time");
  const loading = useDemoLoading();
  const active = accounts.find((account) => account.id === selected);
  const payments = accounts.flatMap((account) => account.transactions).filter((transaction) => inRange(transaction.date, "Last 30 days"));
  const incoming = payments.reduce((sum, transaction) => sum + transaction.amount, 0);
  const filtered = useMemo(() => accounts.filter((account) => {
    const query = search.toLowerCase().trim();
    return (!query || [account.name, account.number, account.bank, account.assignment].join(" ").toLowerCase().includes(query))
      && (bank === "All" || account.bank === bank)
      && (type === "All" || account.type === type)
      && (status === "All" || account.status === status)
      && (assignment === "All" || (assignment === "Assigned" ? Boolean(account.assignment) : !account.assignment))
      && inRange(account.created, date);
  }), [accounts, search, bank, type, status, assignment, date]);
  const clear = () => { setSearch(""); setBank("All"); setType("All"); setStatus("All"); setAssignment("All"); setDate("All time"); };
  const hasFilters = Boolean(search || bank !== "All" || type !== "All" || status !== "All" || assignment !== "All" || date !== "All time");
  const columns: Column<VirtualAccount>[] = [
    { key: "name", header: "Account name", sort: (account) => account.name, cell: (account) => <button className="text-left font-semibold hover:text-primary" onClick={() => setSelected(account.id)}>{account.name}<span className="mt-1 block text-xs font-normal text-muted-foreground md:hidden">{account.bank}</span></button> },
    { key: "number", header: "Account number", hideBelow: "sm", sort: (account) => account.number, cell: (account) => account.number ? <span className="flex items-center gap-2 tnum">{account.number}<span onClick={(event) => event.stopPropagation()}><CopyButton value={account.number} iconOnly /></span></span> : <span className="text-xs text-muted-foreground">Awaiting bank</span> },
    { key: "bank", header: "Bank", hideBelow: "lg", sort: (account) => account.bank, cell: (account) => account.bank },
    { key: "type", header: "Type", hideBelow: "md", sort: (account) => account.type, cell: (account) => account.type },
    { key: "currency", header: "Currency", hideBelow: "lg", cell: (account) => account.currency },
    { key: "assignment", header: "Customer / reference", hideBelow: "lg", sort: (account) => account.assignment, cell: (account) => <span className="block max-w-40 truncate" title={account.assignment}>{account.assignment || "Unassigned"}</span> },
    { key: "status", header: "Status", sort: (account) => account.status, cell: (account) => <StatusBadge status={account.status} /> },
    { key: "created", header: "Created", hideBelow: "lg", sort: (account) => account.created, cell: (account) => fmtDate(account.created) },
  ];
  const download = () => {
    exportCsv("virtual-accounts-sample", filtered.map((account) => ({
      "Account name": account.name, "Account number": account.number, Bank: account.bank,
      Type: account.type, Currency: account.currency, "Customer / reference": account.assignment,
      Status: account.status, Created: account.created, "Sample data": "Yes",
    })));
    toast.success(`Exported ${filtered.length} sample accounts`);
  };
  return (
    <DashboardPage title="Virtual Accounts" crumbs={[{ label: "Virtual Accounts" }]} description="Give every collection a home. Manage business and customer accounts in one place."
      actions={<button className="btn btn-primary" onClick={() => setCreating(true)}><Plus className="h-4 w-4" />Create virtual account</button>}>
      {loading ? <CardsSkeleton /> : <MetricGrid>
        <MetricCard label="Total accounts" value={accounts.length} sub="Across 3 partner banks · NGN" icon={Wallet} dark />
        <MetricCard label="Active accounts" value={accounts.filter((account) => account.status === "Active").length} sub="Available in the sample dataset" icon={Building2} />
        <MetricCard label="Incoming · last 30 days" value={formatMoneyCompact(incoming)} sub={`${payments.length} payments · ${formatMoney(incoming, "NGN", { decimals: false })}`} icon={ArrowDownLeft} />
        <MetricCard label="Provisioning" value={accounts.filter((account) => account.status === "Provisioning").length} sub="Awaiting bank confirmation" icon={Clock3} />
      </MetricGrid>}
      <section aria-label="Account types" className="mb-6 grid gap-4 rounded-xl border bg-card p-4 md:grid-cols-3">
        {ACCOUNT_TYPES.map((item) => <div key={item}><h2 className="text-sm font-semibold">{item}</h2><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{TYPE_HELP[item]}</p></div>)}
      </section>
      <section className="panel min-w-0 overflow-hidden" aria-label="Virtual accounts">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5"><div><h2 className="font-semibold">Collection accounts</h2><p className="mt-1 text-xs text-muted-foreground">NGN accounts · Select an account to view details and manage its assignment.</p></div><ExportButton onClick={download} disabled={!filtered.length || loading} /></div>
        <Toolbar><SearchInput value={search} onChange={setSearch} placeholder="Search accounts or numbers…" />
          <FilterSelect label="Bank" value={bank} onChange={setBank} options={["All", ...BANKS]} />
          <FilterSelect label="Type" value={type} onChange={setType} options={["All", ...ACCOUNT_TYPES]} />
          <FilterSelect label="Status" value={status} onChange={setStatus} options={["All", ...ACCOUNT_STATUSES]} />
          <FilterSelect label="Assignment" value={assignment} onChange={setAssignment} options={["All", "Assigned", "Unassigned"]} />
          <DateRangeSelect value={date} onChange={setDate} />
          <ClearFilters show={hasFilters} onClear={clear} />
        </Toolbar>
        <StatusTabs value={status} onChange={setStatus} tabs={["All", ...ACCOUNT_STATUSES].map((item) => ({ value: item, label: item, count: item === "All" ? accounts.length : accounts.filter((account) => account.status === item).length }))} />
        <DataTable columns={columns} rows={filtered} rowKey={(account) => account.id} onRowClick={(account) => setSelected(account.id)} loading={loading} pageSize={10} caption="Sample virtual collection accounts" empty={<EmptyState title="No accounts found" description="Try a different search or clear your filters to see all collection accounts." action={<button className="btn btn-outline" onClick={clear}>Clear filters</button>} />} />
      </section>
      {active && <AccountDrawer key={active.id} account={active} onClose={() => setSelected(null)} onUpdate={(updated) => setAccounts((current) => current.map((account) => account.id === updated.id ? updated : account))} />}
      {creating && <CreateAccount onClose={() => setCreating(false)} onCreate={(account) => { setAccounts((current) => [account, ...current]); clear(); setCreating(false); setSelected(account.id); toast.message("Demo account added · Provisioning", { description: "Assigned once the bank confirms — demo, nothing was requested." }); }} />}
    </DashboardPage>
  );
}
