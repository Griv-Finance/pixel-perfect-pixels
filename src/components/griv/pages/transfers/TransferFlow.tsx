import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { DetailList, Field, FormDialog } from "@/components/griv/kit";
import { getAccount, holdFunds, useAccounts } from "@/lib/demo/accounts";
import { makeRef } from "@/lib/demo-store";
import { nowIso } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { transfersStore } from "@/lib/demo/transfers";
export function TransferFlow({ onClose }: { onClose: () => void }) {
  const accounts = useAccounts();
  const [step, setStep] = useState(0);
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const from = accounts.find((a) => a.id === source),
    to = accounts.find((a) => a.id === destination);
  const n = Number(amount);
  const destinationError =
    source === destination && destination
      ? "Choose a different account. Source and destination cannot be the same."
      : from && to && from.currency !== to.currency
        ? "Cross-currency transfers are not supported. Choose an account in the same currency."
        : "";
  const amountError =
    !Number.isFinite(n) || n <= 0
      ? "Enter an amount greater than zero."
      : n > (from?.available ?? 0)
        ? "Insufficient available balance."
        : Math.round(n * 100) !== n * 100 && Math.abs(Math.round(n * 100) - n * 100) > 0.00001
          ? "Use at most two decimal places."
          : "";
  const valid =
    step === 0
      ? !!from
      : step === 1
        ? !!to && !destinationError
        : !amountError && !!reference.trim() && !destinationError;
  async function confirm() {
    if (busy) return;
    setBusy(true);
    setError("");
    await new Promise((r) => setTimeout(r, 700));
    const current = getAccount(source);
    if (!current || current.available < n || !valid) {
      setError("The available balance changed. Check your amount and try again.");
      setBusy(false);
      return;
    }
    holdFunds(source, n);
    transfersStore.set((rows) => [
      {
        id: makeRef("TRF"),
        source,
        destination,
        amount: n,
        currency: current.currency,
        reference: reference.trim(),
        status: "Pending",
        date: nowIso(),
      },
      ...rows,
    ]);
    toast("Awaiting confirmation (demo — no money moved)");
    onClose();
  }
  return (
    <FormDialog
      open
      onOpenChange={(o) => {
        if (!o && !busy) onClose();
      }}
      title="Initiate transfer"
      description="Move funds between Nova Retail’s own Griv accounts."
      footer={
        <>
          <button
            className="btn btn-outline"
            disabled={busy}
            onClick={() => (step ? setStep(step - 1) : onClose())}
          >
            {step ? "Back" : "Cancel"}
          </button>
          <button
            className="btn btn-primary"
            disabled={!valid || busy}
            onClick={() => (step < 3 ? setStep(step + 1) : void confirm())}
          >
            {busy ? "Holding funds…" : step === 3 ? "Confirm transfer" : "Continue"}
            {step < 3 && <ArrowRight className="h-4 w-4" />}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex gap-2 text-xs text-muted-foreground">
          {["Source", "Destination", "Amount", "Review"].map((s, i) => (
            <span
              key={s}
              className={`flex-1 border-t-2 pt-2 ${i === step ? "border-primary font-semibold text-foreground" : "border-border"}`}
            >
              {i + 1}. {s}
            </span>
          ))}
        </div>
        {step === 0 && (
          <Field
            label="Source account"
            htmlFor="transfer-source"
            hint="Only available funds can be transferred."
          >
            <select
              id="transfer-source"
              className="field"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            >
              <option value="">Select source account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} · {formatMoney(a.available, a.currency)} available
                </option>
              ))}
            </select>
          </Field>
        )}
        {step === 1 && (
          <Field
            label="Destination account"
            htmlFor="transfer-destination"
            {...(destinationError
              ? { error: destinationError }
              : { hint: "Internal Griv accounts only. External recipients belong in Payouts." })}
          >
            <select
              id="transfer-destination"
              className="field"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            >
              <option value="">Select destination account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} · {a.currency}
                </option>
              ))}
            </select>
          </Field>
        )}
        {step === 2 && (
          <>
            <Field
              label={`Amount (${from?.currency})`}
              htmlFor="transfer-amount"
              {...(amount
                ? { error: amountError }
                : { hint: "Enter an amount greater than zero." })}
            >
              <input
                id="transfer-amount"
                className="field"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>
            <Field
              label="Reference"
              htmlFor="transfer-reference"
              {...(!reference.trim() ? { error: "A reference is required." } : {})}
            >
              <input
                id="transfer-reference"
                className="field"
                maxLength={120}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. October payroll funding"
              />
            </Field>
          </>
        )}
        {step === 3 && (
          <>
            <DetailList
              items={[
                ["From", from?.name],
                ["To", to?.name],
                ["Amount", formatMoney(n, from?.currency)],
                ["Reference", reference],
                ["Fee", formatMoney(0, from?.currency)],
              ]}
            />
            <p className="rounded-lg bg-highlight p-3 text-sm text-highlight-foreground">
              Confirmation places a demo hold on your source balance. Awaiting provider confirmation
              — no money will be moved.
            </p>
          </>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </FormDialog>
  );
}
