/** The merchant identity printed on invoices, read from the business profile captured at onboarding. */
import { useGriv } from "@/lib/griv-store";

export type MerchantInfo = { name: string; address: string; email?: string | undefined };

export function useMerchant(): MerchantInfo {
  const g = useGriv();
  const address = [g.address, g.city, g.country].filter((s) => s && s.trim()).join(", ");
  return {
    name: g.businessName || "Nova Retail Ltd.",
    address: address || "Lagos, Nigeria",
    email: g.email || undefined,
  };
}
