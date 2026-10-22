// SAMPLE DATA — Nova Retail storefront settings; no public store is provisioned.
import { createDemoStore } from "@/lib/demo-store";
export type StoreSettings = {
  name: string;
  mark: string;
  tagline: string;
  accent: "primary" | "blackwood" | "peridot";
  layout: "grid" | "list";
  showOut: boolean;
  about: string;
  email: string;
  phone: string;
  whatsapp: string;
  featured: string[];
  collections: { name: string; category: string }[];
  lagos: number;
  nationwide: number;
  freeAbove: number;
  pickup: boolean;
  card: boolean;
  transfer: boolean;
  guest: boolean;
};
export const storeSettings = createDemoStore<StoreSettings>({
  name: "Nova Retail",
  mark: "N",
  tagline: "Everyday essentials. Exceptionally African.",
  accent: "primary",
  layout: "grid",
  showOut: false,
  about:
    "Thoughtfully made fashion, beauty and home essentials from Nigeria. Discover a little everyday joy.",
  email: "hello@novaretail.example",
  phone: "+234 803 555 0140",
  whatsapp: "+234 803 555 0140",
  featured: ["prd_01", "prd_02", "prd_03", "prd_07"],
  collections: [
    { name: "Everyday favourites", category: "Fashion" },
    { name: "Home & living", category: "Home" },
  ],
  lagos: 2500,
  nationwide: 4500,
  freeAbove: 50000,
  pickup: true,
  card: true,
  transfer: true,
  guest: true,
});
export const storeLive = createDemoStore(true);
