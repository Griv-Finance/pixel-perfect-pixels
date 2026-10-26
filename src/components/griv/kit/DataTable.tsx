import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { EmptyState, TableSkeleton } from "./basics";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Return a value to make the column sortable. */
  sort?: ((row: T) => string | number) | undefined;
  align?: "left" | "right" | undefined;
  className?: string | undefined;
  /** Hide on small screens to keep tables readable on phones. */
  hideBelow?: "sm" | "md" | "lg" | undefined;
};

const HIDE = { sm: "hidden sm:table-cell", md: "hidden md:table-cell", lg: "hidden lg:table-cell" };

/** Sortable, paginated table. Do search/filtering in the page and pass the filtered rows in. */
export function DataTable<T>({
  columns, rows, rowKey, onRowClick, pageSize = 10, loading, empty, initialSort, rowActions, caption, headerTone = "caps",
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: ((row: T) => void) | undefined;
  pageSize?: number | undefined;
  loading?: boolean | undefined;
  /** "caps" = uppercase label-caps headers (default); "plain" = sentence case with soft tracking. */
  headerTone?: "caps" | "plain" | undefined;
  empty?: ReactNode | undefined;
  initialSort?: { key: string; dir: "asc" | "desc" };
  rowActions?: ((row: T) => ReactNode) | undefined;
  caption?: string | undefined;
}) {
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sort?.key);
    if (!col?.sort || !sort) return rows;
    const get = col.sort;
    return [...rows].sort((a, b) => {
      const x = get(a), y = get(b);
      const r = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
      return sort.dir === "asc" ? r : -r;
    });
  }, [rows, sort, columns]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  useEffect(() => { if (page > pages - 1) setPage(0); }, [pages, page]);
  useEffect(() => { setPage(0); }, [rows]);
  const visible = sorted.slice(page * pageSize, page * pageSize + pageSize);

  const toggleSort = (key: string) =>
    setSort((s) => (s?.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }));

  if (loading) return <TableSkeleton cols={Math.min(columns.length, 5)} />;
  if (!rows.length) return <>{empty ?? <EmptyState title="Nothing here yet" />}</>;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-y bg-muted/60 text-left">
              {columns.map((c) => (
                <th key={c.key} scope="col"
                  aria-sort={sort?.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
                  className={cn(headerTone === "plain" ? "whitespace-nowrap px-4 py-2.5 text-xs font-semibold tracking-[0.08em] text-muted-foreground" : "label-caps whitespace-nowrap px-4 py-2.5 font-semibold", "first:pl-5", c.align === "right" && "text-right", c.hideBelow && HIDE[c.hideBelow])}>
                  {c.sort ? (
                    <button onClick={() => toggleSort(c.key)} className={cn("inline-flex items-center gap-1 hover:text-foreground", c.align === "right" && "flex-row-reverse")}>
                      {c.header}
                      {sort?.key === c.key ? (sort.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </button>
                  ) : c.header}
                </th>
              ))}
              {rowActions && <th className="w-10 px-4 py-2.5"><span className="sr-only">Actions</span></th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {visible.map((r) => (
              <tr key={rowKey(r)} onClick={onRowClick ? () => onRowClick(r) : undefined}
                className={cn("transition-colors hover:bg-muted/40", onRowClick && "cursor-pointer")}>
                {columns.map((c) => (
                  <td key={c.key} className={cn("whitespace-nowrap px-4 py-3 first:pl-5", c.align === "right" && "text-right tnum", c.hideBelow && HIDE[c.hideBelow], c.className)}>
                    {c.cell(r)}
                  </td>
                ))}
                {rowActions && <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>{rowActions(r)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t px-5 py-3 text-sm text-muted-foreground">
        <span>Showing {page * pageSize + 1}–{Math.min(sorted.length, (page + 1) * pageSize)} of {sorted.length}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage((p) => p - 1)} disabled={page === 0} className="grid h-8 w-8 place-items-center rounded-md border disabled:opacity-40" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
          <span className="px-2 tnum">Page {page + 1} of {pages}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page >= pages - 1} className="grid h-8 w-8 place-items-center rounded-md border disabled:opacity-40" aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}
