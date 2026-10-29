import { useState } from "react";
import { Building2, ChevronDown, MoreHorizontal, Plus, User } from "lucide-react";
import { Field, FormDialog } from "@/components/griv/kit";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  addCustomer,
  CUSTOMER_COUNTRIES,
  customerByName,
  updateCustomer,
  useCustomers,
  type Customer,
} from "@/lib/demo/customers";
import { invoicesStore } from "@/lib/demo/invoices";
import { cn } from "@/lib/utils";
import { EditorSection, INPUT } from "./ui";

/** Customer: search existing customers, add a new one inline, and see their billing details. */
export function CustomerSection({ value, onChange, error }: {
  value: string; onChange: (name: string, id?: string) => void; error?: string | undefined;
}) {
  const customers = useCustomers();
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<{ mode: "new" | "edit"; prefill?: string } | null>(null);
  const selected = customers.find((c) => c.name === value);

  return (
    <EditorSection id="field-customer" title="Customer">
      {selected ? (
        <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-primary">
            {selected.kind === "org" ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
          </span>
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-medium">{selected.name}</p>
            <p className="truncate text-muted-foreground">{selected.email || "No email address"}</p>
            {selected.phone && <p className="text-muted-foreground">{selected.phone}</p>}
            <p className="text-muted-foreground">
              {[selected.address, selected.city, selected.country].filter(Boolean).join(", ")}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Customer options">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setDialog({ mode: "edit" })}>Edit customer information</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOpen(true)}>Switch customer</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : null}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              INPUT,
              "flex items-center justify-between text-left text-muted-foreground",
              selected && "sr-only",
              error && "border-destructive",
            )}
            aria-invalid={!!error}
            aria-describedby={error ? "customer-error" : undefined}
          >
            Find or add a customer…
            <ChevronDown className="h-4 w-4 opacity-60" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[--radix-popover-trigger-width] min-w-72 p-0">
          <Command>
            <CommandInput placeholder="Search by name or email" />
            <CommandList>
              <CommandEmpty>No customers found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="__add_new_customer"
                  onSelect={() => {
                    setOpen(false);
                    setDialog({ mode: "new" });
                  }}
                  className="font-medium text-primary"
                >
                  <Plus className="h-4 w-4" />
                  Add new customer
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Customers">
                {customers.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={`${c.name} ${c.email}`}
                    onSelect={() => {
                      onChange(c.name, c.id);
                      setOpen(false);
                    }}
                  >
                    {c.kind === "org" ? <Building2 className="h-4 w-4 text-muted-foreground" /> : <User className="h-4 w-4 text-muted-foreground" />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{c.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{c.email}</span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {!selected && !error && <p className="mt-1.5 text-xs text-muted-foreground">Select who you're billing, or create a new customer.</p>}
      {error && (
        <p id="customer-error" role="alert" className="mt-1.5 text-xs font-medium text-destructive">
          {error}
        </p>
      )}

      {dialog && (
        <CustomerDialog
          initial={dialog.mode === "edit" ? selected : undefined}
          onClose={() => setDialog(null)}
          onSaved={(c) => {
            onChange(c.name, c.id);
            setDialog(null);
          }}
        />
      )}
    </EditorSection>
  );
}

type Form = {
  kind: Customer["kind"]; name: string; email: string; phone: string; address: string; city: string;
  country: Customer["country"]; registrationNumber: string; taxId: string;
};

/** Compact create/edit customer dialog — the merchant never leaves the invoice. */
function CustomerDialog({ initial, onClose, onSaved }: { initial?: Customer | undefined; onClose: () => void; onSaved: (c: Customer) => void }) {
  const [f, setF] = useState<Form>({
    kind: initial?.kind ?? "user",
    name: initial?.name ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    address: initial?.address ?? "",
    city: initial?.city ?? "",
    country: initial?.country ?? "Nigeria",
    registrationNumber: initial?.registrationNumber ?? "",
    taxId: initial?.taxId ?? "",
  });
  const [tried, setTried] = useState(false);
  const set = (p: Partial<Form>) => setF((v) => ({ ...v, ...p }));
  const errors = {
    name: !f.name.trim()
      ? "Enter the customer's name."
      : customerByName(f.name.trim()) && customerByName(f.name.trim())?.id !== initial?.id
        ? "A customer with this name already exists."
        : "",
    email: f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email) ? "Enter a valid email address." : "",
  };
  const valid = !errors.name && !errors.email;
  const save = () => {
    setTried(true);
    if (!valid) return;
    const data = {
      kind: f.kind,
      name: f.name.trim(),
      email: f.email.trim(),
      phone: f.phone.trim(),
      address: f.address.trim() || undefined,
      city: f.city.trim(),
      country: f.country,
      registrationNumber: f.kind === "org" ? f.registrationNumber.trim() || undefined : undefined,
      taxId: f.kind === "org" ? f.taxId.trim() || undefined : undefined,
    };
    if (initial) {
      updateCustomer(initial.id, data);
      if (initial.name !== data.name)
        invoicesStore.set((all) => all.map((r) => (r.customer === initial.name ? { ...r, customer: data.name } : r)));
      onSaved({ ...initial, ...data });
    } else {
      onSaved(addCustomer(data));
    }
  };
  return (
    <FormDialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={initial ? "Edit customer" : "Add a customer"}
      description={initial ? "Changes apply to this customer everywhere in Griv." : "The new customer is selected on this invoice when you save."}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>{initial ? "Save customer" : "Add customer"}</button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type" htmlFor="cus-kind">
          <select id="cus-kind" className={INPUT} value={f.kind} onChange={(e) => set({ kind: e.target.value as Form["kind"] })}>
            <option value="user">Individual</option>
            <option value="org">Business</option>
          </select>
        </Field>
        <Field label={f.kind === "org" ? "Business name" : "Full name"} htmlFor="cus-name" error={tried ? errors.name : ""}>
          <input id="cus-name" autoFocus className={INPUT} value={f.name} onChange={(e) => set({ name: e.target.value })} />
        </Field>
        <Field label="Email" htmlFor="cus-email" hint="Needed to email invoices." error={tried ? errors.email : ""}>
          <input id="cus-email" type="email" className={INPUT} value={f.email} onChange={(e) => set({ email: e.target.value })} />
        </Field>
        <Field label="Phone" htmlFor="cus-phone" optional>
          <input id="cus-phone" className={INPUT} value={f.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+234 …" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Billing address" htmlFor="cus-address" optional>
            <input id="cus-address" className={INPUT} value={f.address} onChange={(e) => set({ address: e.target.value })} placeholder="Street address" />
          </Field>
        </div>
        <Field label="City" htmlFor="cus-city" optional>
          <input id="cus-city" className={INPUT} value={f.city} onChange={(e) => set({ city: e.target.value })} />
        </Field>
        <Field label="Country" htmlFor="cus-country">
          <select id="cus-country" className={INPUT} value={f.country} onChange={(e) => set({ country: e.target.value as Form["country"] })}>
            {CUSTOMER_COUNTRIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        {f.kind === "org" && (
          <>
            <Field label="Registration number (RC)" htmlFor="cus-rc" optional>
              <input id="cus-rc" className={INPUT} value={f.registrationNumber} onChange={(e) => set({ registrationNumber: e.target.value })} />
            </Field>
            <Field label="Tax ID (TIN)" htmlFor="cus-tin" optional>
              <input id="cus-tin" className={INPUT} value={f.taxId} onChange={(e) => set({ taxId: e.target.value })} />
            </Field>
          </>
        )}
      </div>
    </FormDialog>
  );
}
