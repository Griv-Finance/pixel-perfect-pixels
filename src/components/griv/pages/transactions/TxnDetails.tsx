import { Link } from "@tanstack/react-router";
import {
  CopyButton,
  DetailDrawer,
  DetailList,
  StatusBadge,
  Timeline,
} from "@/components/griv/kit";
import { LedgerDetails } from "./LedgerDetails";
import { useAccounts } from "@/lib/demo/accounts";
import { ledgerStore } from "@/lib/demo/ledger";
import { payoutsStore } from "@/lib/demo/payouts";
import { transfersStore } from "@/lib/demo/transfers";
import type { UnifiedTxn } from "@/lib/demo/unified";
import { formatMoney } from "@/lib/money";
import { fmtDateTime } from "@/lib/dates";

/** Type-specific details for a unified transaction row. */
export function TxnDetails({ txn, onClose }: { txn: UnifiedTxn | undefined; onClose: () => void }) {
  const accounts = useAccounts();
  const transfers = transfersStore.use();
  const payouts = payoutsStore.use();
  const ledger = ledgerStore.use();
  const name = (id: string) => accounts.find((a) => a.id === id)?.name ?? id;

  if (txn && (txn.type === "Transfer" || txn.type === "Payout")) {
    const transfer = txn.type === "Transfer" ? transfers.find((r) => r.id === txn.id) : undefined;
    const payout = txn.type === "Payout" ? payouts.find((r) => r.id === txn.id) : undefined;
    return (
      <DetailDrawer open={!!txn} onOpenChange={(o) => !o && onClose()} title={`${txn.type} details`} subtitle={txn.id} badge={<StatusBadge status={txn.status} />}>
        <p className="text-3xl font-semibold tnum">{formatMoney(txn.amount, txn.currency)}</p>
        {transfer && (
          <>
            <DetailList
              items={[
                ["Reference", <span className="flex gap-2">{transfer.id}<CopyButton value={transfer.id} iconOnly /></span>],
                ["Description", transfer.reference],
                ["Source", name(transfer.source)],
                ["Destination", name(transfer.destination)],
                ["Currency", transfer.currency],
                ["Initiated", fmtDateTime(transfer.date)],
                ["Completed", transfer.completed ? fmtDateTime(transfer.completed) : "Not completed"],
              ]}
            />
            {transfer.reason && (
              <p className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">{transfer.reason}</p>
            )}
            <h3 className="font-semibold">Event timeline</h3>
            <Timeline
              events={[
                { label: "Transfer initiated", time: fmtDateTime(transfer.date), tone: "info" },
                transfer.status === "Pending"
                  ? { label: "Awaiting confirmation (demo — no money moved)", time: fmtDateTime(transfer.date), tone: "pending" }
                  : transfer.status === "Failed"
                    ? { label: "Transfer failed", time: fmtDateTime(transfer.date), tone: "danger" }
                    : { label: "Transfer completed (sample)", time: fmtDateTime(transfer.completed ?? transfer.date), tone: "success" },
              ]}
            />
            <p className="text-xs text-muted-foreground">
              Manage transfers on the{" "}
              <Link to="/transfers" className="font-medium text-primary hover:underline">Transfers page</Link>.
            </p>
          </>
        )}
        {payout && (
          <>
            <DetailList
              items={[
                ["Reference", <span className="flex gap-2">{payout.id}<CopyButton value={payout.id} iconOnly /></span>],
                ["Recipient", payout.recipient.name],
                ["Bank / channel", `${payout.recipient.bank} · ${payout.recipient.channel}`],
                ["Account", payout.recipient.account],
                ["Funding account", name(payout.source)],
                ["Currency", payout.currency],
                ["Fee", formatMoney(payout.fee, payout.currency)],
                ["Total", formatMoney(payout.amount + payout.fee, payout.currency)],
                ["Narration", payout.narration],
                ["Date", fmtDateTime(payout.date)],
                ["Schedule", payout.schedule ?? "Not scheduled"],
                ...(payout.retryOf ? [["Retry of", payout.retryOf] as [string, string]] : []),
              ]}
            />
            {payout.status === "Failed" && payout.reason && (
              <p className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">{payout.reason}</p>
            )}
            <h3 className="font-semibold">Event timeline</h3>
            <Timeline
              events={[
                { label: "Payout created", time: fmtDateTime(payout.date), tone: "info" },
                payout.status === "Pending"
                  ? { label: "Awaiting provider confirmation (demo — nothing was sent)", time: fmtDateTime(payout.date), tone: "pending" }
                  : payout.status === "Failed"
                    ? { label: "Destination rejected payout", time: fmtDateTime(payout.date), tone: "danger" }
                    : payout.status === "Scheduled"
                      ? { label: `Scheduled for ${payout.schedule}`, time: fmtDateTime(payout.date), tone: "info" }
                      : { label: "Provider confirmed payout (sample)", time: fmtDateTime(payout.date), tone: "success" },
              ]}
            />
            <p className="text-xs text-muted-foreground">
              Manage payouts on the{" "}
              <Link to="/payouts" className="font-medium text-primary hover:underline">Payouts page</Link>.
            </p>
          </>
        )}
      </DetailDrawer>
    );
  }

  const entry = txn ? ledger.find((r) => r.id === txn.id) : undefined;
  return entry ? <LedgerDetails entry={entry} rows={ledger} onClose={onClose} /> : null;
}
