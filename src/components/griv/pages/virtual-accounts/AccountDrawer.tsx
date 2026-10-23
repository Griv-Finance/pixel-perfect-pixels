import { useState } from "react";
import { toast } from "sonner";
import {
  ConfirmDialog,
  CopyButton,
  DetailDrawer,
  DetailList,
  EmptyState,
  Field,
  SectionTitle,
  StatusBadge,
  Timeline,
} from "@/components/griv/kit";
import { CUSTOMERS } from "@/lib/demo/customers";
import { TYPE_HELP, type VirtualAccount } from "@/lib/demo/virtual-accounts";
import { fmtDateTime, nowIso } from "@/lib/dates";
import { formatMoney } from "@/lib/money";

type Action = "Suspend" | "Reactivate" | "Deactivate" | "Reassign";
export function AccountDrawer({
  account,
  onClose,
  onUpdate,
}: {
  account: VirtualAccount;
  onClose: () => void;
  onUpdate: (account: VirtualAccount) => void;
}) {
  const [action, setAction] = useState<Action | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [error, setError] = useState("");
  const details = [
    ["Bank", account.bank],
    ["Account number", account.number || "Awaiting bank confirmation"],
    ["Account name", `Nova Retail/${account.name}`],
    ["Currency", account.currency],
    ["Provider", `Griv via ${account.bank}`],
  ];
  const confirm = () => {
    if (!action) return;
    const customer = CUSTOMERS.find((item) => item.id === customerId);
    if (action === "Reassign" && (!customer || customer.id === account.customerId)) {
      setError("Choose a different customer. No changes were made.");
      return;
    }
    const status =
      action === "Suspend"
        ? "Suspended"
        : action === "Reactivate"
          ? "Active"
          : action === "Deactivate"
            ? "Deactivated"
            : account.status;
    const note =
      action === "Reassign"
        ? `From ${account.assignment || "Unassigned"} to ${customer!.name}. Collection reference retained: ${account.name}.`
        : action === "Deactivate"
          ? "Permanent — this account cannot be reactivated."
          : "Local demo status update; no bank request was sent.";
    onUpdate({
      ...account,
      status,
      ...(action === "Reassign" ? { assignment: customer!.name, customerId: customer!.id } : {}),
      history: [
        ...account.history,
        {
          label: action === "Reassign" ? "Account reassigned" : `Account ${status.toLowerCase()}`,
          time: nowIso(),
          note,
        },
      ],
    });
    toast.success(
      `${action === "Reassign" ? "Assignment updated" : `Account ${status.toLowerCase()}`} — demo only`,
    );
    setAction(null);
  };
  return (
    <>
      <DetailDrawer
        open
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        title={account.name}
        subtitle={`${account.type} · Sample account`}
        badge={<StatusBadge status={account.status} />}
        footer={
          <>
            {account.status === "Active" && (
              <button className="btn btn-outline" onClick={() => setAction("Suspend")}>
                Suspend
              </button>
            )}
            {account.status === "Suspended" && (
              <button className="btn btn-outline" onClick={() => setAction("Reactivate")}>
                Reactivate
              </button>
            )}
            {account.type !== "Dedicated" &&
              account.status !== "Deactivated" &&
              account.status !== "Provisioning" && (
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setCustomerId("");
                    setError("");
                    setAction("Reassign");
                  }}
                >
                  Reassign
                </button>
              )}
            {account.status !== "Deactivated" && (
              <button
                className="btn btn-outline text-destructive"
                onClick={() => setAction("Deactivate")}
              >
                Deactivate
              </button>
            )}
          </>
        }
      >
        <section>
          <SectionTitle
            action={
              <CopyButton
                label="Copy all details"
                value={details.map(([key, value]) => `${key}: ${value}`).join("\n")}
              />
            }
          >
            Account details
          </SectionTitle>
          <DetailList
            items={details.map(([key, value]) => [
              key!,
              <span className="break-words" key={key}>
                {value}{" "}
                {key === "Account number" && account.number && (
                  <CopyButton value={account.number} iconOnly />
                )}
              </span>,
            ])}
          />
          <p className="mt-3 text-xs text-muted-foreground">{TYPE_HELP[account.type]}</p>
          {account.status === "Provisioning" && (
            <p className="mt-3 rounded-lg bg-muted p-3 text-sm">
              Assigned once the bank confirms — demo, nothing was requested.
            </p>
          )}
          {account.status === "Deactivated" && (
            <p className="mt-3 text-sm text-destructive">
              Permanently deactivated. This account cannot be reactivated or reassigned.
            </p>
          )}
        </section>
        <section>
          <SectionTitle>Assignment</SectionTitle>
          <p className="text-sm">{account.assignment || "Unassigned"}</p>
          {account.type === "Dedicated" && (
            <p className="mt-2 text-xs text-muted-foreground">
              Dedicated accounts belong to Nova Retail Ltd. and cannot be reassigned to a customer.
            </p>
          )}
        </section>
        <section>
          <SectionTitle>Incoming transactions</SectionTitle>
          {account.transactions.length ? (
            <ul className="divide-y rounded-lg border">
              {account.transactions.map((transaction) => (
                <li key={transaction.reference} className="space-y-1 p-3 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium">{transaction.customer}</span>
                    <span className="tnum font-semibold">{formatMoney(transaction.amount)}</span>
                  </div>
                  <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                    <span>{transaction.reference} · Successful</span>
                    <span>{fmtDateTime(transaction.date)}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No incoming payments yet"
              description="Transactions will appear after an account is confirmed and receives payments."
            />
          )}
        </section>
        <section>
          <SectionTitle>Assignment & status history</SectionTitle>
          <Timeline
            events={account.history.map((event) => ({
              ...event,
              time: fmtDateTime(event.time),
              tone: "neutral",
            }))}
          />
        </section>
      </DetailDrawer>
      <ConfirmDialog
        open={action !== null}
        onOpenChange={(open) => {
          if (!open) setAction(null);
        }}
        title={`${action ?? "Update"} account?`}
        confirmLabel={action ?? "Confirm"}
        danger={action === "Deactivate"}
        description={
          action === "Deactivate"
            ? "This is permanent. The account cannot be reactivated. This change affects sample data only."
            : action === "Reassign"
              ? "Choose a new customer. This updates the assignment in the demo only."
              : "Update this sample account’s status. No request is sent to the bank."
        }
        onConfirm={confirm}
      >
        {action === "Reassign" && (
          <Field label="New customer" htmlFor="reassign-customer" error={error || undefined}>
            <select
              id="reassign-customer"
              className="field"
              value={customerId}
              onChange={(event) => setCustomerId(event.target.value)}
            >
              <option value="">Choose a different customer</option>
              {CUSTOMERS.filter((customer) => customer.id !== account.customerId).map(
                (customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ),
              )}
            </select>
          </Field>
        )}
      </ConfirmDialog>
      {error && action === null && (
        <ConfirmDialog
          open
          onOpenChange={() => {
            setError("");
            setAction("Reassign");
          }}
          title="Choose a new customer"
          description={error}
          confirmLabel="Choose customer"
          onConfirm={() => {
            setError("");
            setAction("Reassign");
          }}
        />
      )}
    </>
  );
}
