/** The merchant identity printed on invoices, read from the business profile captured at onboarding. */
import { useGriv } from "@/lib/griv-store";

export type MerchantInfo = { name: string; address: string; email?: string | undefined };

export function useMerchant(): MerchantInfo {
  const g = useGriv();
  const local = [g.address, g.city].filter((s) => s && s.trim()).join(", ");
  return {
    name: g.businessName || "Nova Retail Ltd.",
    // Until the onboarding address is filled in, fall back to the demo business's location.
    address: local ? [local, g.country].filter(Boolean).join(", ") : "Lagos, Nigeria",
    email: g.email || undefined,
  };
}
