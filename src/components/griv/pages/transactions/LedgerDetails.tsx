import { useState } from "react";
import { toast } from "sonner";
import {
  DetailDrawer,
  DetailList,
  Timeline,
  StatusBadge,
  CopyButton,
  ConfirmDialog,
  ErrorState,
  SectionTitle,
} from "@/components/griv/kit";
import { canRefund, requestRefund, retryPayment, type LedgerEntry } from "@/lib/demo/ledger";
import { formatMoney } from "@/lib/money";
import { fmtDateTime } from "@/lib/dates";
export function LedgerDetails({
  entry,
  rows,
  onClose,
}: {
  entry: LedgerEntry | undefined;
  rows: LedgerEntry[];
  onClose: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const refund = async () => {
    if (!entry || busy) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 700));
    requestRefund(entry.id);
    setBusy(false);
    toast.info("Refund pending — awaiting provider confirmation. Demo: nothing was sent.");
  };
  return (
    <>
      <DetailDrawer
        open={!!entry}
        onOpenChange={(o) => {
          if (!o) onClose();
        }}
        title={entry?.type === "Payment" ? "Payment details" : "Transaction details"}
        subtitle={entry?.id}
        badge={entry && <StatusBadge status={entry.status} />}
        footer={
          entry &&
          canRefund(entry, rows) && (
            <button className="btn btn-outline" disabled={busy} onClick={() => setConfirm(true)}>
              {busy ? "Submitting…" : "Request refund"}
            </button>
          )
        }
      >
        {entry && (
          <>
            <p className="text-3xl font-semibold tnum">
              {formatMoney(entry.amount, entry.currency)}
            </p>
            <DetailList
              items={[
                [
                  "Reference",
                  <span className="flex items-center gap-2">
                    {entry.id}
                    <CopyButton value={entry.id} iconOnly />
                  </span>,
                ],
                ["Customer", entry.customer],
                ["Email", entry.email],
                ["Type", entry.type],
                ["Channel", entry.channel],
                ["Date", fmtDateTime(entry.date)],
                ["Gross", formatMoney(entry.amount, entry.currency)],
                ["Fees", formatMoney(entry.fee, entry.currency)],
                ["Net", formatMoney(entry.amount - entry.fee, entry.currency)],
                [
                  "Settlement",
                  entry.status === "Successful" ? "Settled · sample batch STL-2201" : "Not settled",
                ],
                ...(entry.parentId
                  ? [["Original reference", entry.parentId] as [string, string]]
                  : []),
              ]}
            />
            {entry.status === "Failed" && (
              <ErrorState
                title="Payment declined"
                description="The issuing bank declined authorization. A retry creates a new pending attempt; no provider is contacted."
                onRetry={() => {
                  retryPayment(entry.id);
                  toast.info("New attempt pending — no payment was sent.");
                  onClose();
                }}
              />
            )}
            <SectionTitle>Event timeline</SectionTitle>
            <Timeline
              events={[
                {
                  label: entry.type === "Payment" ? "Authorization requested" : "Record created",
                  time: fmtDateTime(entry.date),
                  tone: "info",
                },
                {
                  label: entry.status === "Failed" ? "Authorization declined" : "Processing",
                  time: fmtDateTime(entry.date),
                  tone: entry.status === "Failed" ? "danger" : "info",
                },
                {
                  label:
                    entry.status === "Successful" || entry.status === "Refunded"
                      ? "Settlement confirmed"
                      : "Awaiting provider confirmation",
                  time:
                    entry.status === "Successful" || entry.status === "Refunded"
                      ? fmtDateTime(entry.date)
                      : "Pending",
                  note: "Sample data only. No money is sent from this dashboard.",
                  tone:
                    entry.status === "Successful" || entry.status === "Refunded"
                      ? "success"
                      : "pending",
                },
              ]}
            />
            {rows.some((r) => r.parentId === entry.id && r.type === "Refund") && (
              <p className="rounded-lg bg-accent p-3 text-sm">
                Refund pending. Awaiting provider confirmation; the original payment remains
                unchanged.
              </p>
            )}
          </>
        )}
      </DetailDrawer>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Request full refund?"
        description={
          entry
            ? `${formatMoney(entry.amount, entry.currency)} will be recorded as Refund pending. This is a demo: nothing is sent to a provider and no refund is completed.`
            : ""
        }
        confirmLabel="Confirm refund request"
        danger
        onConfirm={() => void refund()}
      />
    </>
  );
}
