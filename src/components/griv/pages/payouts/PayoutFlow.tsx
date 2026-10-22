import { useState } from "react";
import { toast } from "sonner";
import { DetailList, Field, FormDialog } from "@/components/griv/kit";
import { getAccount, holdFunds, useAccounts } from "@/lib/demo/accounts";
import { BANKS, payoutFee, payoutsStore, recipientStore, type Recipient } from "@/lib/demo/payouts";
import { makeRef } from "@/lib/demo-store";
import { DEMO_TODAY, nowIso } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
export function PayoutFlow({ onClose }: { onClose: () => void }) {
  const recipients = recipientStore.use(),
    accounts = useAccounts();
  const [step, setStep] = useState(0),
    [recipientId, setRecipientId] = useState(""),
    [bank, setBank] = useState(""),
    [account, setAccount] = useState(""),
    [resolved, setResolved] = useState(""),
    [lookup, setLookup] = useState(false),
    [lookupError, setLookupError] = useState(""),
    [source, setSource] = useState(""),
    [amount, setAmount] = useState(""),
    [narration, setNarration] = useState(""),
    [schedule, setSchedule] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const isNew = recipientId === "new";
  const recipient: Recipient | undefined =
    isNew && resolved
      ? { id: "new", name: resolved, bank, account, currency: "NGN", channel: "Bank transfer" }
      : recipients.find((r) => r.id === recipientId);
  const from = accounts.find((a) => a.id === source);
  const n = Number(amount),
    fee = payoutFee(n, recipient?.currency),
    total = Math.round((n + fee) * 100) / 100;
  const amountError =
    !Number.isFinite(n) || n <= 0
      ? "Enter an amount greater than zero."
      : !/^[0-9]+(\.[0-9]{1,2})?$/.test(amount)
        ? "Use at most two decimal places."
        : from && total > from.available
          ? "Insufficient available balance, including fees."
          : "";
  const scheduleError =
    schedule && schedule <= DEMO_TODAY.toISOString().slice(0, 10)
      ? "Choose a date after 22 October 2026 (demo today)."
      : "";
  const valid =
    step === 0
      ? !!recipient
      : !!recipient &&
        !!from &&
        from.currency === recipient.currency &&
        !amountError &&
        !!narration.trim() &&
        !scheduleError;
  async function verify() {
    setLookup(true);
    setLookupError("");
    await new Promise((r) => setTimeout(r, 700));
    if (account === "0000000000") {
      setLookupError("Account could not be verified. Check the NUBAN and try again.");
    } else setResolved("TOLU ADEYEMI");
    setLookup(false);
  }
  async function confirm() {
    if (busy || !valid || !recipient) return;
    setBusy(true);
    setError("");
    await new Promise((r) => setTimeout(r, 700));
    const current = getAccount(source);
    if (!current || current.currency !== recipient.currency || current.available < total) {
      setError("Insufficient available funds. Go back and choose a funded account.");
      setBusy(false);
      return;
    }
    let target = recipient;
    if (isNew) {
      target = { ...recipient, id: makeRef("REC") };
      recipientStore.set((r) => [...r, target]);
    }
    holdFunds(source, total);
    payoutsStore.set((rows) => [
      {
        id: makeRef("PAY"),
        recipient: target,
        source,
        amount: n,
        fee,
        currency: target.currency,
        status: "Pending",
        date: nowIso(),
        narration: narration.trim(),
        ...(schedule ? { schedule } : {}),
      },
      ...rows,
    ]);
    toast("Awaiting provider confirmation (demo — nothing was sent)");
    onClose();
  }
  return (
    <FormDialog
      open
      onOpenChange={(o) => {
        if (!o && !busy && !lookup) onClose();
      }}
      title="Create payout"
      description="Pay an external recipient. All verification and payments are simulated."
      footer={
        <>
          <button
            className="btn btn-outline"
            disabled={busy || lookup}
            onClick={() => (step ? setStep(step - 1) : onClose())}
          >
            {step ? "Back" : "Cancel"}
          </button>
          <button
            className="btn btn-primary"
            disabled={!valid || busy || lookup}
            onClick={() => (step < 2 ? setStep(step + 1) : void confirm())}
          >
            {busy ? "Holding funds…" : step === 2 ? "Confirm payout" : "Continue"}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <p className="label-caps">
          Step {step + 1} of 3 · {["Recipient", "Payment details", "Review & confirm"][step]}
        </p>
        {step === 0 && (
          <>
            <Field label="Recipient" htmlFor="payout-recipient">
              <select
                id="payout-recipient"
                className="field"
                value={recipientId}
                onChange={(e) => {
                  setRecipientId(e.target.value);
                  setSource("");
                }}
              >
                <option value="">Choose a saved recipient</option>
                {recipients.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} · {r.bank} · {r.currency}
                  </option>
                ))}
                <option value="new">+ Add new bank recipient (NGN)</option>
              </select>
            </Field>
            {isNew && (
              <>
                <Field label="Bank" htmlFor="recipient-bank">
                  <select
                    id="recipient-bank"
                    className="field"
                    value={bank}
                    onChange={(e) => {
                      setBank(e.target.value);
                      setResolved("");
                      setLookupError("");
                    }}
                  >
                    <option value="">Select bank</option>
                    {BANKS.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                </Field>
                <Field
                  label="Account number (NUBAN)"
                  htmlFor="recipient-account"
                  {...(account && !/^\d{10}$/.test(account)
                    ? { error: "Enter exactly 10 digits." }
                    : { hint: "Fictional details only. Name lookup is simulated." })}
                >
                  <input
                    id="recipient-account"
                    className="field"
                    inputMode="numeric"
                    maxLength={10}
                    value={account}
                    onChange={(e) => {
                      setAccount(e.target.value);
                      setResolved("");
                      setLookupError("");
                    }}
                    disabled={lookup}
                  />
                </Field>
                <button
                  className="btn btn-outline"
                  disabled={!bank || !/^\d{10}$/.test(account) || lookup}
                  onClick={() => void verify()}
                >
                  {lookup ? "Verifying account…" : "Verify account name"}
                </button>
                {resolved && (
                  <div className="rounded-lg bg-success p-4 text-success-foreground">
                    <p className="label-caps">Resolved account name · simulated</p>
                    <p className="mt-1 font-semibold">{resolved}</p>
                    <p className="text-xs">
                      {bank} · {account} — not a real bank verification.
                    </p>
                  </div>
                )}
                {lookupError && (
                  <p role="alert" className="text-sm text-destructive">
                    {lookupError}
                  </p>
                )}
              </>
            )}
            {!isNew && recipient && (
              <DetailList
                items={[
                  ["Recipient", recipient.name],
                  ["Bank / channel", `${recipient.bank} · ${recipient.channel}`],
                  ["Account", recipient.account],
                  ["Currency", recipient.currency],
                ]}
              />
            )}
          </>
        )}
        {step === 1 && (
          <>
            <Field label="Pay from" htmlFor="payout-source">
              <select
                id="payout-source"
                className="field"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                <option value="">Select funding account</option>
                {accounts
                  .filter((a) => a.currency === recipient?.currency)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} · {formatMoney(a.available, a.currency)} available
                    </option>
                  ))}
              </select>
            </Field>
            <Field
              label={`Amount (${recipient?.currency})`}
              htmlFor="payout-amount"
              {...(amountError && amount
                ? { error: amountError }
                : { hint: "Fees are added to the payout amount." })}
            >
              <input
                id="payout-amount"
                className="field"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>
            <Field
              label="Narration"
              htmlFor="payout-narration"
              {...(!narration.trim() ? { error: "Narration is required." } : {})}
            >
              <input
                id="payout-narration"
                className="field"
                value={narration}
                maxLength={120}
                onChange={(e) => setNarration(e.target.value)}
                placeholder="e.g. Delivery partner settlement"
              />
            </Field>
            <Field
              label="Schedule date"
              optional
              htmlFor="payout-schedule"
              {...(scheduleError
                ? { error: scheduleError }
                : {
                    hint: "Demo today is 22 Oct 2026. Scheduled requests remain Pending until confirmed.",
                  })}
            >
              <input
                id="payout-schedule"
                className="field"
                type="date"
                min="2026-10-23"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
              />
            </Field>
          </>
        )}
        {step === 2 && (
          <>
            <DetailList
              items={[
                ["Recipient", recipient?.name],
                ["Bank / channel", recipient?.bank],
                ["Account", recipient?.account],
                ["From", from?.name],
                ["Amount", formatMoney(n, recipient?.currency)],
                ["Fee", formatMoney(fee, recipient?.currency)],
                ["Total hold", formatMoney(total, recipient?.currency)],
                ["Narration", narration],
                ["Schedule", schedule || "Immediately after confirmation"],
              ]}
            />
            <p className="rounded-lg bg-highlight p-3 text-sm text-highlight-foreground">
              A demo hold will reserve the total. This request stays Pending — no payment is sent to
              a bank or mobile money provider.
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
