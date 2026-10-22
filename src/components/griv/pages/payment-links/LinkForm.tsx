import { useState } from "react";
import { Field, FormDialog } from "@/components/griv/kit";
import { CURRENCIES, type Currency } from "@/lib/money";
import { DEMO_TODAY } from "@/lib/dates";
import type { PaymentLink } from "@/lib/demo/payment-links";
export function LinkForm({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (r: PaymentLink) => void;
}) {
  const [model, setModel] = useState<PaymentLink["model"]>("Fixed amount");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [currency, setCurrency] = useState<Currency>("NGN");
  const [description, setDescription] = useState("");
  const [expiry, setExpiry] = useState("");
  const [redirect, setRedirect] = useState("");
  const [phone, setPhone] = useState(true);
  const [address, setAddress] = useState(false);
  const [busy, setBusy] = useState(false);
  let redirectValid = true;
  try {
    if (redirect) redirectValid = new URL(redirect).protocol === "https:";
  } catch {
    redirectValid = false;
  }
  const amountValid =
    model === "Fixed amount" ? Number(amount) > 0 : Number(min) > 0 && Number(max) >= Number(min);
  const valid =
    name.trim().length > 1 && amountValid && redirectValid && (!expiry || expiry > "2026-10-22");
  const save = async () => {
    if (!valid) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 700));
    onSave({
      id: crypto.randomUUID(),
      name: name.trim(),
      slug: `${name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}-${Date.now().toString(36)}`,
      model,
      amount: Number(amount),
      min: Number(min),
      max: Number(max),
      currency,
      description,
      phone,
      address,
      expiry,
      redirect,
      status: "Active",
      created: DEMO_TODAY.toISOString(),
      payments: [],
    });
  };
  return (
    <FormDialog
      open
      onOpenChange={(o) => !o && !busy && onClose()}
      title="Create payment link"
      description="Choose how your customers pay. This link is a local demo, not a live checkout."
      size="lg"
      footer={
        <>
          <button className="btn btn-outline" disabled={busy} onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" disabled={!valid || busy} onClick={save}>
            {busy ? "Creating…" : "Create payment link"}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {(["Fixed amount", "Customer enters amount"] as const).map((m) => (
            <button
              key={m}
              className="choice p-4 text-left"
              data-selected={model === m}
              onClick={() => setModel(m)}
              aria-pressed={model === m}
            >
              <span className="block font-semibold">{m}</span>
              <span className="text-sm text-muted-foreground">
                {m === "Fixed amount"
                  ? "One price for every customer."
                  : "Let customers choose within your limits."}
              </span>
            </button>
          ))}
        </div>
        <Field
          label="Link name"
          htmlFor="link-name"
          error={name.trim().length < 2 ? "Enter at least 2 characters." : ""}
        >
          <input
            id="link-name"
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Currency" htmlFor="link-currency">
            <select
              id="link-currency"
              className="field"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
            >
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          {model === "Fixed amount" ? (
            <Field
              label="Amount"
              htmlFor="link-amount"
              error={!amountValid ? "Enter an amount greater than zero." : ""}
            >
              <input
                id="link-amount"
                className="field"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Minimum"
                htmlFor="link-min"
                error={!amountValid ? "Set positive min ≤ max." : ""}
              >
                <input
                  id="link-min"
                  className="field"
                  type="number"
                  value={min}
                  onChange={(e) => setMin(e.target.value)}
                />
              </Field>
              <Field label="Maximum" htmlFor="link-max">
                <input
                  id="link-max"
                  className="field"
                  type="number"
                  value={max}
                  onChange={(e) => setMax(e.target.value)}
                />
              </Field>
            </div>
          )}
        </div>
        <Field label="Description" htmlFor="link-description">
          <textarea
            id="link-description"
            className="field"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <div className="flex flex-wrap gap-5">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={phone} onChange={(e) => setPhone(e.target.checked)} />
            Collect phone number
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={address}
              onChange={(e) => setAddress(e.target.checked)}
            />
            Collect address
          </label>
        </div>
        <Field
          label="Expiry date"
          htmlFor="link-expiry"
          optional
          error={
            expiry && expiry <= "2026-10-22" ? "Choose a date after 22 Oct 2026 (demo today)." : ""
          }
        >
          <input
            id="link-expiry"
            className="field"
            type="date"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
          />
        </Field>
        <Field
          label="Redirect URL"
          htmlFor="link-redirect"
          optional
          error={!redirectValid ? "Enter a valid HTTPS URL." : ""}
        >
          <input
            id="link-redirect"
            className="field"
            placeholder="https://your-store.example/thank-you"
            value={redirect}
            onChange={(e) => setRedirect(e.target.value)}
          />
        </Field>
      </div>
    </FormDialog>
  );
}
