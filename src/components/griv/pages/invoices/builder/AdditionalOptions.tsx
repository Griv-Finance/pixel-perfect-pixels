import { useState } from "react";
import { ChevronDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Invoice } from "@/lib/demo/invoices";
import type { MerchantInfo } from "@/lib/demo/merchant";
import { CheckRow, INPUT, LINK_BTN } from "./ui";

type Update = (fn: (r: Invoice) => Invoice) => void;
const MAX_FIELDS = 4;

/** Advanced settings behind progressive disclosure: numbering, template, memo, footer, custom fields, tax ID, page size, branding. */
export function AdditionalOptions({ invoice: r, update, merchant, onBranding }: {
  invoice: Invoice; update: Update; merchant: MerchantInfo; onBranding: () => void;
}) {
  const configured = !!(r.memo || r.footer || r.customFields?.length || r.taxId || r.template === "minimal" || r.pageSize === "Letter");
  const [open, setOpen] = useState(configured);
  const [memoOn, setMemoOn] = useState(r.memo !== undefined);
  const [footerOn, setFooterOn] = useState(r.footer !== undefined);
  const [taxOn, setTaxOn] = useState(r.taxId !== undefined);
  const fields = r.customFields ?? [];

  return (
    <section className="py-6">
      <button className="flex w-full items-start justify-between gap-3 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span>
          <span className="block text-base font-semibold">Additional options</span>
          <span className="block text-sm text-muted-foreground">Memo, footer, custom fields, tax ID, template and PDF settings.</span>
        </span>
        <ChevronDown className={cn("mt-1 h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-sm font-medium">Invoice number</p>
              <p className="flex h-9 items-center rounded-md border bg-muted/50 px-3 font-mono text-sm">{r.id}</p>
              <p className="mt-1.5 text-xs text-muted-foreground">Next number in your GRV-INV- sequence. Numbers are never reused.</p>
            </div>
            <div>
              <label htmlFor="inv-template" className="mb-1.5 block text-sm font-medium">Template</label>
              <select id="inv-template" className={INPUT} value={r.template ?? "classic"} onChange={(e) => update((v) => ({ ...v, template: e.target.value as Invoice["template"] }))}>
                <option value="classic">Griv classic</option>
                <option value="minimal">Minimal</option>
              </select>
            </div>
          </div>

          <div className="divide-y rounded-lg border bg-card px-3">
            <CheckRow
              id="opt-memo"
              checked={memoOn}
              onChange={(v) => {
                setMemoOn(v);
                update((x) => ({ ...x, memo: v ? (x.memo ?? "") : undefined }));
              }}
              label="Memo"
              hint="A note shown near the top of the invoice."
            >
              <textarea
                aria-label="Memo"
                className="field min-h-16 w-full text-sm"
                placeholder="e.g. Thanks for your business! Please quote the invoice number when paying."
                value={r.memo ?? ""}
                onChange={(e) => update((x) => ({ ...x, memo: e.target.value }))}
              />
            </CheckRow>
            <CheckRow
              id="opt-footer"
              checked={footerOn}
              onChange={(v) => {
                setFooterOn(v);
                update((x) => ({ ...x, footer: v ? (x.footer ?? "") : undefined }));
              }}
              label="Footer"
              hint="Payment instructions or business notes at the bottom of the invoice."
            >
              <textarea
                aria-label="Footer"
                className="field min-h-16 w-full text-sm"
                placeholder="e.g. RC 1234567 · Registered in Lagos"
                value={r.footer ?? ""}
                onChange={(e) => update((x) => ({ ...x, footer: e.target.value }))}
              />
            </CheckRow>
            <CheckRow
              id="opt-fields"
              checked={fields.length > 0}
              onChange={(v) => update((x) => ({ ...x, customFields: v ? [{ label: "", value: "" }] : undefined }))}
              label="Custom fields"
              hint="Extra details such as a PO number, shown under the invoice details."
            >
              <div className="space-y-2">
                {fields.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      aria-label={`Custom field ${i + 1} name`}
                      className={cn(INPUT, "h-8")}
                      placeholder="Field name (e.g. PO number)"
                      value={f.label}
                      onChange={(e) => update((x) => ({ ...x, customFields: fields.map((g, j) => (j === i ? { ...g, label: e.target.value } : g)) }))}
                    />
                    <input
                      aria-label={`Custom field ${i + 1} value`}
                      className={cn(INPUT, "h-8")}
                      placeholder="Value"
                      value={f.value}
                      onChange={(e) => update((x) => ({ ...x, customFields: fields.map((g, j) => (j === i ? { ...g, value: e.target.value } : g)) }))}
                    />
                    <button
                      aria-label={`Remove custom field ${i + 1}`}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        const next = fields.filter((_, j) => j !== i);
                        update((x) => ({ ...x, customFields: next.length ? next : undefined }));
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {fields.length < MAX_FIELDS && (
                  <button className={LINK_BTN} onClick={() => update((x) => ({ ...x, customFields: [...fields, { label: "", value: "" }] }))}>
                    <Plus className="h-4 w-4" /> Add custom field
                  </button>
                )}
              </div>
            </CheckRow>
            <CheckRow
              id="opt-taxid"
              checked={taxOn}
              onChange={(v) => {
                setTaxOn(v);
                update((x) => ({ ...x, taxId: v ? (x.taxId ?? "") : undefined }));
              }}
              label="Tax ID"
              hint="Show your business tax identification number (TIN) on the invoice."
            >
              <input aria-label="Tax ID" className={cn(INPUT, "max-w-64")} placeholder="e.g. 12345678-0001" value={r.taxId ?? ""} onChange={(e) => update((x) => ({ ...x, taxId: e.target.value }))} />
            </CheckRow>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="inv-page" className="mb-1.5 block text-sm font-medium">PDF page size</label>
              <select id="inv-page" className={INPUT} value={r.pageSize ?? "A4"} onChange={(e) => update((v) => ({ ...v, pageSize: e.target.value as Invoice["pageSize"] }))}>
                <option value="A4">A4</option>
                <option value="Letter">Letter</option>
              </select>
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium">Branding</p>
              <div className="flex items-center gap-2.5 rounded-md border bg-card px-3 py-1.5">
                <span className="grid h-6 w-6 place-items-center rounded bg-primary text-[11px] font-bold text-primary-foreground">{merchant.name.slice(0, 1)}</span>
                <span className="min-w-0 flex-1 text-xs leading-tight">
                  <span className="block truncate font-medium">{merchant.name}</span>
                  <span className="block truncate text-muted-foreground">{merchant.address}</span>
                </span>
                <button className="text-xs font-medium text-primary hover:underline" onClick={onBranding}>Change</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
