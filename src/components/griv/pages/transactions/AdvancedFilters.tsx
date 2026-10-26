import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Field } from "@/components/griv/kit";
import { CHANNELS } from "@/lib/demo/ledger";
import {
  ADVANCED_TYPES,
  AMOUNT_OPS,
  DEFAULT_TXN_FILTERS,
  SOURCE_CHANNELS,
  TXN_STATUSES,
  type AmountOp,
  type TxnFilters,
} from "@/lib/demo/unified";
import { CURRENCIES } from "@/lib/money";

const METHODS = ["All", ...new Set([...CHANNELS, "Mobile money"])];

/** Expanded advanced-filter panel. Edits a draft; nothing changes until Apply. */
export function AdvancedFilters({ open, onToggle, active, onApply, accounts }: {
  open: boolean;
  onToggle: () => void;
  active: TxnFilters;
  onApply: (f: TxnFilters) => void;
  accounts: { value: string; label: string }[];
}) {
  const [draft, setDraft] = useState<TxnFilters>(active);
  useEffect(() => {
    if (open) setDraft(active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  if (!open) return null;
  const set = (patch: Partial<TxnFilters>) => setDraft((d) => ({ ...d, ...patch }));
  const t = draft.type;
  const showPayin = t === "All" || t === "Pay-ins" || t === "Pay-in" || t === "Funding";
  const showPayout = t === "All" || t === "Payouts" || t === "Payout";
  const showTransfer = t === "All" || t === "Transfers" || t === "Transfer";
  const showRefund = t === "All" || t === "Refunds" || t === "Refund";
  const dateError = draft.from && draft.to && draft.from > draft.to;
  return (
    <div className="border-b bg-muted/30 px-5 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Advanced filters</h3>
        <button onClick={onToggle} className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
          Hide <ChevronUp className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Transaction type">
          <select className="field h-9 text-sm" value={draft.type} onChange={(e) => set({ type: e.target.value })}>
            {ADVANCED_TYPES.map((o) => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select className="field h-9 text-sm" value={draft.status} onChange={(e) => set({ status: e.target.value })}>
            {["All", ...TXN_STATUSES].map((o) => <option key={o}>{o}</option>)}
          </select>
        </Field>
        {showPayin && (
          <Field label="Payment method">
            <select className="field h-9 text-sm" value={draft.method} onChange={(e) => set({ method: e.target.value })}>
              {METHODS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>
        )}
        {showPayin && (
          <Field label="Pay-in type">
            <select className="field h-9 text-sm" value={draft.payinType} onChange={(e) => set({ payinType: e.target.value })}>
              {["All", "Pay-in", "Funding"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>
        )}
        <Field label="Amount">
          <div className="flex gap-1">
            <select
              aria-label="Amount comparison"
              className="field h-9 w-32 shrink-0 text-sm"
              value={draft.amountOp}
              onChange={(e) => set({ amountOp: e.target.value as AmountOp })}
            >
              {AMOUNT_OPS.map((o) => <option key={o}>{o}</option>)}
            </select>
            {draft.amountOp === "Between" ? (
              <div className="flex min-w-0 flex-1 gap-1">
                <input aria-label="Minimum amount" type="number" min="0" placeholder="Min" className="field h-9 text-sm" value={draft.amountMin} onChange={(e) => set({ amountMin: e.target.value })} />
                <input aria-label="Maximum amount" type="number" min="0" placeholder="Max" className="field h-9 text-sm" value={draft.amountMax} onChange={(e) => set({ amountMax: e.target.value })} />
              </div>
            ) : (
              <input aria-label="Amount" type="number" min="0" placeholder="0.00" className="field h-9 min-w-0 flex-1 text-sm" value={draft.amount} onChange={(e) => set({ amount: e.target.value })} />
            )}
          </div>
        </Field>
        <Field label="From" hint="Start date">
          <input type="date" className="field h-9 text-sm" value={draft.from} max={draft.to || undefined} onChange={(e) => set({ from: e.target.value })} />
        </Field>
        <Field label="To" hint="End date" error={dateError ? "End date can't be earlier than the start date." : undefined}>
          <input type="date" className="field h-9 text-sm" value={draft.to} min={draft.from || undefined} onChange={(e) => set({ to: e.target.value })} />
        </Field>
        <Field label="Transaction reference">
          <input className="field h-9 text-sm" placeholder="E.g. GRV-802400…" value={draft.ref} onChange={(e) => set({ ref: e.target.value })} />
        </Field>
        {showPayin && (
          <Field label="Payment channel">
            <select className="field h-9 text-sm" value={draft.sourceChannel} onChange={(e) => set({ sourceChannel: e.target.value })}>
              {["All", ...SOURCE_CHANNELS].map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>
        )}
        <Field label="Currency">
          <select className="field h-9 text-sm" value={draft.currency} onChange={(e) => set({ currency: e.target.value })}>
            {["All", ...CURRENCIES].map((o) => <option key={o}>{o}</option>)}
          </select>
        </Field>
        {showPayout && (
          <Field label="Recipient">
            <input className="field h-9 text-sm" placeholder="Recipient name…" value={draft.recipient} onChange={(e) => set({ recipient: e.target.value })} />
          </Field>
        )}
        {showTransfer && (
          <Field label="Account">
            <select className="field h-9 text-sm" value={draft.account} onChange={(e) => set({ account: e.target.value })}>
              {[{ value: "All", label: "All" }, ...accounts].map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
        )}
        {showRefund && (
          <Field label="Original transaction">
            <input className="field h-9 text-sm" placeholder="Original reference…" value={draft.originalRef} onChange={(e) => set({ originalRef: e.target.value })} />
          </Field>
        )}
        <Field label="Keyword" hint="Reference, customer, email, narration…">
          <input className="field h-9 text-sm" placeholder="Search anything…" value={draft.keyword} onChange={(e) => set({ keyword: e.target.value })} />
        </Field>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn btn-outline h-9 text-sm" onClick={() => setDraft({ ...DEFAULT_TXN_FILTERS })}>
          Clear
        </button>
        <button className="btn btn-primary h-9 text-sm" disabled={!!dateError} onClick={() => onApply(draft)}>
          Apply Filters
        </button>
      </div>
      <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
        <ChevronDown className="h-3 w-3" /> Collapsing keeps your selected values until you apply or clear them.
      </p>
    </div>
  );
}
