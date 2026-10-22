import { useMemo, useState } from "react";
import {
  DashboardPage,
  MetricGrid,
  MetricCard,
  DataTable,
  StatusBadge,
  StatusTabs,
  Toolbar,
  SearchInput,
  FilterSelect,
  DateRangeSelect,
  ClearFilters,
  ExportButton,
  EmptyState,
  useDemoLoading,
  type Column,
} from "@/components/griv/kit";
import { useOrders, fulfilments, payments, totals, type Order } from "@/lib/demo/orders";
import { CUSTOMERS } from "@/lib/demo/customers";
import { fmtDate, inRange, type DateRange } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { exportCsv } from "@/lib/csv";
import { OrderDetail } from "./OrderDetail";
const customer = (o: Order) => CUSTOMERS.find((c) => c.id === o.customerId)?.name ?? "Guest";
export function OrdersPage() {
  const orders = useOrders(),
    loading = useDemoLoading();
  const [status, setStatus] = useState("All"),
    [payment, setPayment] = useState("All"),
    [channel, setChannel] = useState("All"),
    [date, setDate] = useState<DateRange>("All time"),
    [search, setSearch] = useState(""),
    [selected, setSelected] = useState<string | null>(null);
  const clear = () => {
    setStatus("All");
    setPayment("All");
    setChannel("All");
    setDate("All time");
    setSearch("");
  };
  const rows = useMemo(
    () =>
      orders.filter(
        (o) =>
          (status === "All" || o.fulfilment === status) &&
          (payment === "All" || o.payment === payment) &&
          (channel === "All" || o.channel === channel) &&
          inRange(o.date, date) &&
          `${o.id} ${customer(o)}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [orders, status, payment, channel, date, search],
  );
  const columns: Column<Order>[] = [
    {
      key: "id",
      header: "Order",
      cell: (o) => (
        <div>
          <button className="font-semibold text-primary" onClick={() => setSelected(o.id)}>
            {o.id}
          </button>
          <p className="mt-1 text-xs text-muted-foreground">{customer(o)}</p>
        </div>
      ),
      sort: (o) => o.id,
    },
    {
      key: "items",
      header: "Items",
      cell: (o) => o.items.reduce((n, i) => n + i.quantity, 0),
      hideBelow: "lg",
    },
    {
      key: "total",
      header: "Total · NGN",
      cell: (o) => formatMoney(totals(o).total),
      sort: (o) => totals(o).total,
      hideBelow: "sm",
    },
    {
      key: "payment",
      header: "Payment",
      cell: (o) => (
        <div>
          <StatusBadge status={o.payment} />
          {o.refundPending && (
            <div className="mt-1">
              <StatusBadge status="Refund pending" />
            </div>
          )}
        </div>
      ),
    },
    { key: "fulfilment", header: "Fulfilment", cell: (o) => <StatusBadge status={o.fulfilment} /> },
    { key: "channel", header: "Channel", cell: (o) => o.channel, hideBelow: "lg" },
    {
      key: "date",
      header: "Date",
      cell: (o) => fmtDate(o.date),
      sort: (o) => o.date,
      hideBelow: "md",
    },
  ];
  const active = orders.find((o) => o.id === selected);
  return (
    <DashboardPage
      title="Orders"
      description="From checkout to doorstep. Keep every order moving."
      actions={
        <ExportButton
          disabled={!rows.length}
          onClick={() =>
            exportCsv(
              "nova-orders",
              rows.map((o) => ({
                Order: o.id,
                Customer: customer(o),
                Items: o.items.reduce((n, i) => n + i.quantity, 0),
                Total: totals(o).total,
                Currency: "NGN",
                Payment: o.payment,
                Fulfilment: o.fulfilment,
                Channel: o.channel,
                Date: o.date,
              })),
            )
          }
        />
      }
    >
      <MetricGrid cols={5}>
        <MetricCard
          label="Total orders"
          value={orders.length}
          sub="All channels · sample data"
          dark
        />
        <MetricCard
          label="Awaiting fulfilment"
          value={orders.filter((o) => ["Unfulfilled", "Processing"].includes(o.fulfilment)).length}
          sub="Unfulfilled + processing"
        />
        <MetricCard
          label="Fulfilled"
          value={orders.filter((o) => ["Shipped", "Delivered"].includes(o.fulfilment)).length}
          sub="Shipped + delivered"
        />
        <MetricCard
          label="Cancelled"
          value={orders.filter((o) => o.fulfilment === "Cancelled").length}
        />
        <MetricCard
          label="Returned"
          value={orders.filter((o) => o.fulfilment === "Returned").length}
        />
      </MetricGrid>
      <section className="panel overflow-hidden">
        <StatusTabs
          value={status}
          onChange={setStatus}
          tabs={["All", ...fulfilments].map((v) => ({
            value: v,
            label: v,
            count: v === "All" ? orders.length : orders.filter((o) => o.fulfilment === v).length,
          }))}
        />
        <Toolbar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search order or customer…"
          />
          <FilterSelect
            label="Payment"
            value={payment}
            onChange={setPayment}
            options={["All", ...payments]}
          />
          <FilterSelect
            label="Channel"
            value={channel}
            onChange={setChannel}
            options={["All", "Online Store", "POS"]}
          />
          <DateRangeSelect value={date} onChange={setDate} />
          <ClearFilters
            show={
              status !== "All" ||
              payment !== "All" ||
              channel !== "All" ||
              date !== "All time" ||
              !!search
            }
            onClear={clear}
          />
        </Toolbar>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(o) => o.id}
          onRowClick={(o) => setSelected(o.id)}
          loading={loading}
          empty={
            <EmptyState
              title="No matching orders"
              description="Try another customer, date or status."
              action={
                <button className="btn btn-outline" onClick={clear}>
                  Clear filters
                </button>
              }
            />
          }
          caption="Nova Retail sample orders"
        />
      </section>
      {active && <OrderDetail key={active.id} order={active} onClose={() => setSelected(null)} />}
    </DashboardPage>
  );
}
