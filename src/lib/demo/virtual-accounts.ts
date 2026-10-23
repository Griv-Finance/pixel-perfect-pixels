/** SAMPLE DATA — fictional Nova Retail collection accounts; no bank connection. */
import { daysAgo } from "@/lib/dates";
import { CUSTOMERS } from "@/lib/demo/customers";

export const ACCOUNT_TYPES = ["Dedicated", "Customer-specific", "Reusable collection"] as const;
export const BANKS = ["Wema Bank", "Providus Bank", "Sterling Bank"] as const;
export const ACCOUNT_STATUSES = ["Active", "Suspended", "Deactivated", "Provisioning"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];
export const TYPE_HELP: Record<AccountType, string> = {
  Dedicated: "Your business’s own collection account. Cannot be reassigned.",
  "Customer-specific": "Assigned to one customer so their payments are easy to identify.",
  "Reusable collection": "A shared collection reference, such as Lekki shop counter.",
};
export type VirtualAccount = {
  id: string;
  name: string;
  number: string;
  bank: string;
  type: AccountType;
  currency: "NGN";
  assignment: string;
  customerId: string;
  status: AccountStatus;
  created: string;
  history: { label: string; time: string; note: string }[];
  transactions: { reference: string; customer: string; amount: number; date: string }[];
};

const LOCATIONS = [
  "Lekki shop counter",
  "Ikeja showroom",
  "Victoria Island pop-up",
  "Online orders",
  "Surulere counter",
  "Wholesale desk",
  "Yaba pickup",
  "Marina outlet",
];
export const VIRTUAL_ACCOUNTS: VirtualAccount[] = Array.from({ length: 25 }, (_, i) => {
  const type = ACCOUNT_TYPES[i % 3]!;
  const customer = CUSTOMERS[i % 16]!;
  const name =
    type === "Dedicated"
      ? i === 0
        ? "Main collections"
        : `Business collections ${Math.floor(i / 3) + 1}`
      : type === "Customer-specific"
        ? customer.name
        : LOCATIONS[Math.floor(i / 3) % LOCATIONS.length]!;
  const status: AccountStatus =
    i > 22 ? "Provisioning" : i === 20 ? "Deactivated" : i % 8 === 7 ? "Suspended" : "Active";
  const assignment =
    type === "Dedicated"
      ? "Nova Retail Ltd."
      : type === "Customer-specific"
        ? customer.name
        : i === 11
          ? ""
          : name;
  const created = daysAgo(100 - i * 3);
  return {
    id: `va_${i + 1}`,
    name,
    number: status === "Provisioning" ? "" : String(1204567800 + i),
    bank: BANKS[i % BANKS.length]!,
    type,
    currency: "NGN",
    assignment,
    customerId: type === "Customer-specific" ? customer.id : "",
    status,
    created,
    history: [
      { label: "Account created", time: created, note: "Historical sample record." },
      {
        label: status === "Provisioning" ? "Awaiting bank confirmation" : "Initial assignment",
        time: created,
        note:
          status === "Provisioning"
            ? "Demo — nothing was requested."
            : assignment || "Unassigned collection reference",
      },
      ...(status === "Suspended" || status === "Deactivated"
        ? [
            {
              label: `Account ${status.toLowerCase()}`,
              time: daysAgo(3),
              note: "Historical sample status change.",
            },
          ]
        : []),
    ],
    transactions:
      status === "Provisioning"
        ? []
        : Array.from({ length: 3 }, (_, j) => ({
            reference: `VA-${i + 1}-${j + 1}`,
            customer: type === "Customer-specific" ? customer.name : CUSTOMERS[j]!.name,
            amount: (i + 1) * 1250 + (j + 1) * 15000,
            date: daysAgo(j === 2 ? 40 : 5 + j * 8),
          })),
  };
});
