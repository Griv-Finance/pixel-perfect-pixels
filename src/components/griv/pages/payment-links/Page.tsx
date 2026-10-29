import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, Copy, Download, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  DashboardPage,
  EmptyState,
  Field,
  FormDialog,
  StatusBadge,
  ConfirmDialog,
  TableSkeleton,
  DateRangeSelect,
  useDemoLoading,
} from "@/components/griv/kit";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  LINK_ACTIONS,
  LINK_STATUSES,
  linkUrl,
  linksStore,
  priceLabel,
  useLinks,
  type PaymentLink,
} from "@/lib/demo/payment-links";
import { CURRENCIES, formatMoney } from "@/lib/money";
import { fmtDateTime, inRange, type DateRange } from "@/lib/dates";
import { exportCsv } from "@/lib/csv";
import { DEFAULT_PAGE_SIZE, PAGE_SIZES, paginate } from "@/lib/demo/unified";
import { LinkForm } from "./LinkForm";
import { cn } from "@/lib/utils";

const INPUT = "field h-9 w-full text-sm";

/**
 * Right-aligned row action: a quiet ⋯ button by default; on row hover a bordered [Copy URL][⋯] pair
 * appears. The pair is absolutely positioned so it floats on top of the row instead of widening the
 * actions column and shifting other table content. opacity (not display) keeps the ⋯ trigger mounted
 * while its dropdown menu is open.
 */
function RowActions({ link, onAction }: { link: PaymentLink; onAction: (key: string) => void }) {
  return (
    <td className="relative px-4 py-3 text-right">
      <button
        className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:text-foreground"
        aria-label={`Actions for ${link.name}`}
        onClick={(e) => e.stopPropagation()}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      <div className="pointer-events-none absolute right-4 top-1/2 z-20 flex -translate-y-1/2 items-center rounded-lg border border-border bg-card opacity-0 shadow-sm transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
        <button
          className="flex items-center gap-1.5 whitespace-nowrap rounded-l-lg px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
          onClick={(e) => {
            e.stopPropagation();
            onAction("copy-url");
          }}
        >
          Copy URL
          <Copy className="h-3.5 w-3.5" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:text-foreground"
              aria-label={`Actions for ${link.name}`}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {LINK_ACTIONS.map((a) =>
              a.key === "divider" ? (
                <DropdownMenuSeparator key="divider" />
              ) : (
                <DropdownMenuItem
                  key={a.key}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction(a.key);
                  }}
                  className={a.key === "deactivate" ? "text-destructive focus:text-destructive" : undefined}
                >
                  {a.label}
                </DropdownMenuItem>
              ),
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </td>
  );
}

export function PaymentLinksPage() {
  const navigate = useNavigate();
  const rows = useLinks();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [currency, setCurrency] = useState("All");
  const [range, setRange] = useState<DateRange>("All time");
  const [applied, setApplied] = useState({ search: "", status: "All", currency: "All", range: "All time" as DateRange });
  const [create, setCreate] = useState(false);
  const [editing, setEditing] = useState<PaymentLink | null>(null);
  const [renaming, setRenaming] = useState<PaymentLink | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirming, setConfirming] = useState<PaymentLink | null>(null);
  const [unwired, setUnwired] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [page, setPage] = useState(1);
  const loading = useDemoLoading();

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.name.toLowerCase().includes(applied.search.toLowerCase()) &&
          (applied.status === "All" || r.status === applied.status) &&
          (applied.currency === "All" || r.currency === applied.currency) &&
          inRange(r.created, applied.range),
      ),
    [rows, applied],
  );
  useEffect(() => setPage(1), [applied, pageSize]);
  const view = useMemo(() => paginate(filtered, page, pageSize), [filtered, page, pageSize]);

  const set = (patch: Partial<typeof applied>) => setApplied((a) => ({ ...a, ...patch }));
  const draft = { search, status, currency, range };
  const searchNow = () => setApplied(draft);
  const clearAll = () => {
    setSearch("");
    setStatus("All");
    setCurrency("All");
    setRange("All time");
    setApplied({ search: "", status: "All", currency: "All", range: "All time" });
  };

  const copyUrl = (r: PaymentLink) => {
    navigator.clipboard
      .writeText(linkUrl(r))
      .then(() => toast.success("Link copied"))
      .catch(() => toast.error("Copy unavailable"));
  };
  const toggleStatus = (r: PaymentLink) => {
    linksStore.set((v) => v.map((x) => (x.id === r.id ? { ...x, status: x.status === "Active" ? "Inactive" : "Active" } : x)));
    toast.success(`Demo link ${r.status === "Active" ? "deactivated" : "reactivated"}`);
  };
  const rename = () => {
    if (!renaming || renameValue.trim().length < 2) return;
    linksStore.set((v) => v.map((x) => (x.id === renaming.id ? { ...x, name: renameValue.trim() } : x)));
    toast.success("Demo link renamed");
    setRenaming(null);
  };

  const onAction = (r: PaymentLink, key: string) => {
    if (key === "copy-url") copyUrl(r);
    else if (key === "preview") navigate({ to: "/payment-links/$linkId", params: { linkId: r.id } });
    else if (key === "rename") {
      setRenaming(r);
      setRenameValue(r.name);
    } else if (key === "edit") setEditing(r);
    else if (key === "copy-live") setUnwired(true);
    else if (key === "deactivate") setConfirming(r);
  };

  const doExport = (excel: boolean) => {
    setExportOpen(false);
    exportCsv(
      "payment-links",
      filtered.map((r) => ({
        name: r.name,
        url: linkUrl(r),
        model: r.model,
        price: priceLabel(r),
        volume: r.payments.length,
        collected: r.payments.reduce((s, p) => s + p.amount, 0),
        currency: r.currency,
        status: r.status,
        created: r.created,
      })),
      { excel },
    );
  };

  return (
    <DashboardPage
      title="Payment Links"
      crumbs={[{ label: "Payments" }, { label: "Payment Links" }]}
      description="Reusable, shareable links to collect payments from anyone."
      actions={
        <button className="btn btn-primary" onClick={() => setCreate(true)}>
          <Plus className="h-4 w-4" />
          Create payment link
        </button>
      }
    >
      <section className="panel overflow-hidden">
        {/* Filter container */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            searchNow();
          }}
          className="px-5 py-5 sm:px-6"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Link name">
              <input
                className={INPUT}
                placeholder="E.g. Weekend essentials…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Field>
            <Field label="Date or period">
              <DateRangeSelect value={range} onChange={setRange} />
            </Field>
            <Field label="Status">
              <select className={INPUT} value={status} onChange={(e) => setStatus(e.target.value)}>
                {["All", ...LINK_STATUSES].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="Currency">
              <select className={INPUT} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {["All", ...CURRENCIES].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={clearAll}
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="h-4 w-4" />
              Clear filters
            </button>
            <button type="submit" className="btn btn-primary h-9 text-sm">
              <Search className="h-4 w-4" />
              Search
            </button>
          </div>
        </form>

        {loading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : (
          <>
            {/* Table toolbar: count + Export */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3">
              <p className="text-sm">
                <span className="font-semibold tnum">{view.total}</span> {view.total === 1 ? "link" : "links"}
              </p>
              <Popover open={exportOpen} onOpenChange={setExportOpen}>
                <PopoverTrigger asChild>
                  <button className="btn btn-outline h-9 text-sm" disabled={!filtered.length} aria-haspopup="menu">
                    <Download className="h-4 w-4" />
                    Export
                    <ChevronDown className="h-4 w-4 opacity-70" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-48 p-1" role="menu">
                  <button
                    role="menuitem"
                    className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => doExport(false)}
                  >
                    Export CSV
                  </button>
                  <button
                    role="menuitem"
                    className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => doExport(true)}
                  >
                    Export CSV for Excel
                  </button>
                </PopoverContent>
              </Popover>
            </div>

            {view.total === 0 ? (
              <div className="border-t">
                <EmptyState
                  title="No payment links match your filters"
                  description="Try a different search, another period, or clear everything and search again."
                  action={
                    <button className="btn btn-outline" onClick={clearAll}>
                      Clear filters
                    </button>
                  }
                />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto border-t">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left">
                        <Th>Name</Th>
                        <Th>Status</Th>
                        <Th>Price</Th>
                        <Th className="hidden md:table-cell">Volume</Th>
                        <Th className="hidden lg:table-cell">Date</Th>
                        <th scope="col" className="w-px" aria-label="Actions" />
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {view.rows.map((r) => (
                        <tr key={r.id} className="group transition-colors hover:bg-muted/40">
                          <td className="max-w-64 px-4 py-3 first:pl-5">
                            <button
                              className="block max-w-64 truncate font-semibold hover:underline"
                              onClick={() => navigate({ to: "/payment-links/$linkId", params: { linkId: r.id } })}
                            >
                              {r.name}
                            </button>
                            <span className="block max-w-64 truncate text-xs text-muted-foreground">
                              {linkUrl(r).replace("https://", "")}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={r.status} />
                          </td>
                          <td className="px-4 py-3">{priceLabel(r)}</td>
                          <td className="hidden px-4 py-3 md:table-cell">
                            {r.payments.length ? (
                              <span>
                                <span className="tnum">{r.payments.length}</span>
                                <span className="block text-xs text-muted-foreground">
                                  {formatMoney(
                                    r.payments.reduce((s, p) => s + p.amount, 0),
                                    r.currency,
                                  )}{" "}
                                  collected
                                </span>
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground lg:table-cell">
                            {fmtDateTime(r.created)}
                          </td>
                          <RowActions link={r} onAction={(key) => onAction(r, key)} />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>View</span>
                    <select
                      aria-label="Rows per page"
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="h-8 rounded-md border bg-card px-2 text-sm"
                    >
                      {PAGE_SIZES.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="tnum">
                      {view.from}–{view.to} of {view.total.toLocaleString()}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={view.page === 1}
                      className="grid h-8 w-8 place-items-center rounded-md border disabled:opacity-40"
                      aria-label="Previous page"
                    >
                      <ChevronLeftSmall />
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(view.pages, p + 1))}
                      disabled={view.page >= view.pages}
                      className="grid h-8 w-8 place-items-center rounded-md border disabled:opacity-40"
                      aria-label="Next page"
                    >
                      <ChevronRightSmall />
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </section>

      {create && (
        <LinkForm
          onClose={() => setCreate(false)}
          onSave={(r) => {
            linksStore.set((v) => [r, ...v]);
            setCreate(false);
            toast.success("Demo payment link created — no live checkout");
          }}
        />
      )}
      {editing && (
        <LinkForm
          link={editing}
          onClose={() => setEditing(null)}
          onSave={(r) => {
            linksStore.set((v) => v.map((x) => (x.id === editing.id ? { ...x, ...r, id: editing.id } : x)));
            setEditing(null);
            toast.success("Demo payment link updated");
          }}
        />
      )}
      {renaming && (
        <FormDialog
          open
          onOpenChange={(o) => !o && setRenaming(null)}
          title="Change name"
          description="This changes the local sample link only."
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setRenaming(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" disabled={renameValue.trim().length < 2} onClick={rename}>
                Save name
              </button>
            </>
          }
        >
          <Field label="Link name" htmlFor="rename-link" error={renameValue.trim().length < 2 ? "Enter at least 2 characters." : ""}>
            <input id="rename-link" className="field" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
          </Field>
        </FormDialog>
      )}
      <ConfirmDialog
        open={!!confirming}
        onOpenChange={(o) => !o && setConfirming(null)}
        title={`${confirming?.status === "Active" ? "Deactivate" : "Reactivate"} payment link?`}
        description="This changes the local sample link only. No live checkout is affected."
        onConfirm={() => {
          if (confirming) toggleStatus(confirming);
          setConfirming(null);
        }}
      />
      <ConfirmDialog
        open={unwired}
        onOpenChange={(o) => !o && setUnwired(false)}
        title="Copy to live mode isn't wired up in this demo yet"
        description="Test-mode links can't be copied to a live workspace here. When live mode arrives, this will duplicate the link with live keys."
        confirmLabel="Got it"
        onConfirm={() => setUnwired(false)}
      />
    </DashboardPage>
  );
}

function Th({ children, className }: { children: ReactNode; className?: string | undefined }) {
  return (
    <th
      scope="col"
      className={cn(
        "whitespace-nowrap px-4 py-2.5 text-xs font-semibold tracking-[0.08em] text-muted-foreground first:pl-5",
        className,
      )}
    >
      {children}
    </th>
  );
}

const ChevronLeftSmall = () => (
  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
    <path d="M12 5 7 10l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ChevronRightSmall = () => (
  <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
    <path d="m8 5 5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

