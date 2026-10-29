/** Download rows as a CSV file in the browser. `excel` adds a BOM and CRLF line endings so Excel opens it cleanly. */
export function exportCsv(
  filename: string,
  rows: Record<string, string | number | null | undefined>[],
  opts: { excel?: boolean } = {},
) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]!);
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const nl = opts.excel ? "\r\n" : "\n";
  const csv =
    (opts.excel ? "\uFEFF" : "") +
    [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join(nl);
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
