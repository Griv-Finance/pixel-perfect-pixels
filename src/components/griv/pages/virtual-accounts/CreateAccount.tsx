import { useState } from "react";
import { Field, FormDialog } from "@/components/griv/kit";
import { ACCOUNT_TYPES, BANKS, TYPE_HELP, type AccountType, type VirtualAccount } from "@/lib/demo/virtual-accounts";
import { CUSTOMERS } from "@/lib/demo/customers";
import { nowIso } from "@/lib/dates";

export function CreateAccount({ onClose, onCreate }: { onClose: () => void; onCreate: (account: VirtualAccount) => void }) {
  const [type, setType] = useState<AccountType>("Dedicated");
  const [name, setName] = useState("");
  const [bank, setBank] = useState<string>(BANKS[0]);
  const [customerId, setCustomerId] = useState("");
  const [reference, setReference] = useState("");
  const [touched, setTouched] = useState<{ name?: boolean; customer?: boolean; reference?: boolean }>({});
  const [busy, setBusy] = useState(false);
  const errors = {
    name: name.trim().length < 3 ? "Enter an account name of at least 3 characters." : "",
    customer: type === "Customer-specific" && !customerId ? "Choose a customer for this account." : "",
    reference: type === "Reusable collection" && !reference.trim() ? "Enter a shared collection reference." : "",
  };
  const invalid = Object.values(errors).some(Boolean);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched({ name: true, customer: true, reference: true });
    if (invalid || busy) return;
    setBusy(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    const created = nowIso();
    const customer = CUSTOMERS.find((item) => item.id === customerId);
    onCreate({
      id: `va_${crypto.randomUUID()}`, name: name.trim(), number: "", bank, type, currency: "NGN",
      customerId: type === "Customer-specific" ? customerId : "",
      assignment: type === "Dedicated" ? "Nova Retail Ltd." : type === "Customer-specific" ? customer!.name : reference.trim(),
      status: "Provisioning", created, transactions: [],
      history: [{ label: "Awaiting bank confirmation", time: created, note: "Assigned once the bank confirms — demo, nothing was requested." }],
    });
  };
  return (
    <FormDialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }} title="Create virtual account" description="Set up a collection account in the demo. No request will be sent to a bank." size="lg"
      footer={<><button className="btn btn-outline" disabled={busy} onClick={onClose}>Cancel</button><button className="btn btn-primary" form="create-virtual-account" type="submit" disabled={invalid || busy}>{busy ? "Creating demo record…" : "Create account"}</button></>}>
      <form id="create-virtual-account" onSubmit={submit} className="space-y-5">
        <fieldset><legend className="mb-2 text-sm font-medium">Account type</legend><div className="grid gap-2 sm:grid-cols-3">
          {ACCOUNT_TYPES.map((item) => <button key={item} type="button" aria-pressed={type === item} className="choice p-3 text-left" data-selected={type === item} onClick={() => setType(item)}><span className="block text-sm font-semibold">{item}</span><span className="mt-1 block text-xs text-muted-foreground">{TYPE_HELP[item]}</span></button>)}
        </div></fieldset>
        <Field label="Account name" htmlFor="va-name" error={touched.name ? errors.name : undefined}><input id="va-name" className="field" value={name} maxLength={80} placeholder="e.g. Lekki collections" onBlur={() => setTouched((old) => ({ ...old, name: true }))} onChange={(event) => setName(event.target.value)} /></Field>
        <Field label="Bank preference" htmlFor="va-bank" hint="Currency: NGN. Bank confirmation is required before an account number is assigned."><select id="va-bank" className="field" value={bank} onChange={(event) => setBank(event.target.value)}>{BANKS.map((item) => <option key={item}>{item}</option>)}</select></Field>
        {type === "Customer-specific" && <Field label="Customer" htmlFor="va-customer" error={touched.customer ? errors.customer : undefined}><select id="va-customer" className="field" value={customerId} onBlur={() => setTouched((old) => ({ ...old, customer: true }))} onChange={(event) => setCustomerId(event.target.value)}><option value="">Choose a customer</option>{CUSTOMERS.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></Field>}
        {type === "Reusable collection" && <Field label="Collection reference" htmlFor="va-reference" error={touched.reference ? errors.reference : undefined}><input id="va-reference" className="field" value={reference} maxLength={100} placeholder="e.g. Lekki shop counter" onBlur={() => setTouched((old) => ({ ...old, reference: true }))} onChange={(event) => setReference(event.target.value)} /></Field>}
        <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">New accounts stay Provisioning. Assigned once the bank confirms — demo, nothing was requested.</p>
      </form>
    </FormDialog>
  );
}
