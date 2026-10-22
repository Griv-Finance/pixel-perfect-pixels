import { createDemoStore } from "@/lib/demo-store";
import type { Currency } from "@/lib/money";

/** SAMPLE DATA — Nova Retail Ltd.'s Griv balances. Not real accounts. */
export type BalanceAccount = {
  id: string;
  name: string;
  kind: "Main" | "Payroll" | "Reserve" | "Collections";
  currency: Currency;
  /** Griv wallet identifier shown to the merchant. */
  walletId: string;
  /** Settlement bank account the wallet pays out to. */
  settlementBank: string;
  available: number;
  pending: number;
  reserved: number;
};

export const INITIAL_ACCOUNTS: BalanceAccount[] = [
  { id: "acc_ngn_main", name: "Main NGN", kind: "Main", currency: "NGN", walletId: "GRV-NG-20481937", settlementBank: "GTBank ••4821", available: 24_850_000, pending: 3_120_000, reserved: 500_000 },
  { id: "acc_ngn_payroll", name: "Payroll NGN", kind: "Payroll", currency: "NGN", walletId: "GRV-NG-20481952", settlementBank: "Access Bank ••1290", available: 6_200_000, pending: 0, reserved: 0 },
  { id: "acc_ngn_reserve", name: "Tax reserve NGN", kind: "Reserve", currency: "NGN", walletId: "GRV-NG-20482011", settlementBank: "GTBank ••4821", available: 3_400_000, pending: 0, reserved: 3_400_000 },
  { id: "acc_usd", name: "USD wallet", kind: "Collections", currency: "USD", walletId: "GRV-US-70014420", settlementBank: "Zenith Bank (Dom.) ••0917", available: 18_420.5, pending: 2_140, reserved: 0 },
  { id: "acc_ghs", name: "Accra GHS", kind: "Collections", currency: "GHS", walletId: "GRV-GH-31007768", settlementBank: "Ecobank Ghana ••5530", available: 86_300, pending: 12_450, reserved: 0 },
  { id: "acc_kes", name: "Nairobi KES", kind: "Collections", currency: "KES", walletId: "GRV-KE-41002291", settlementBank: "Equity Bank ••7712", available: 412_500, pending: 38_000, reserved: 0 },
];

/** Shared so Transfers and Payouts reserve money from the same balances Balances shows. */
export const accountsStore = createDemoStore(INITIAL_ACCOUNTS);
export const useAccounts = () => accountsStore.use();
export const getAccount = (id: string) => accountsStore.get().find((a) => a.id === id);

/** Move money from available to pending (used when a demo transfer/payout is initiated, never "completed"). */
export function holdFunds(accountId: string, amount: number) {
  accountsStore.set((list) => list.map((a) => (a.id === accountId ? { ...a, available: a.available - amount, pending: a.pending + amount } : a)));
}
