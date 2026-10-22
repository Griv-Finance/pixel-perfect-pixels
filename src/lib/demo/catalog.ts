import { createDemoStore } from "@/lib/demo-store";

/**
 * SAMPLE DATA — Nova Retail's product catalogue.
 * Products own what is sold (name, price, variants). Stock numbers live on each variant and are
 * managed by Inventory; Products, POS, Orders and Online Store read them from this one store.
 */
export type ProductCategory = "Fashion" | "Beauty" | "Home" | "Food & Drinks" | "Accessories";
export type ProductStatus = "Published" | "Draft" | "Archived";
export type Channel = "Online Store" | "POS";

export type Variant = {
  sku: string;
  /** e.g. "Size 42 / Brown". "Default" when the product has no options. */
  label: string;
  price: number;
  /** Units on hand that can still be sold. */
  available: number;
  /** Units held for unfulfilled orders. */
  reserved: number;
  reorderAt: number;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  type: "Physical" | "Digital";
  status: ProductStatus;
  channels: Channel[];
  /** Unit cost in NGN, used for inventory value. */
  cost: number;
  featured?: boolean;
  options: string[];
  variants: Variant[];
  createdAt: string;
};

export const INITIAL_PRODUCTS: Product[] = [
  { id: "prd_01", name: "Ankara Tote Bag", description: "Hand-stitched tote in bold Ankara print with leather straps.", category: "Fashion", type: "Physical", status: "Published", channels: ["Online Store", "POS"], cost: 7_500, featured: true, options: ["Print"],
    variants: [
      { sku: "ANK-TOTE-SUN", label: "Sunburst", price: 15_000, available: 22, reserved: 3, reorderAt: 10 },
      { sku: "ANK-TOTE-IND", label: "Indigo", price: 15_000, available: 16, reserved: 1, reorderAt: 10 },
    ], createdAt: "2026-06-02T10:00:00Z" },
  { id: "prd_02", name: "Shea Body Butter 250g", description: "Unrefined Nigerian shea butter whipped with coconut oil.", category: "Beauty", type: "Physical", status: "Published", channels: ["Online Store", "POS"], cost: 2_100, featured: true, options: [],
    variants: [{ sku: "SHEA-250", label: "Default", price: 4_900, available: 12, reserved: 4, reorderAt: 25 }], createdAt: "2026-05-11T10:00:00Z" },
  { id: "prd_03", name: "Adire Throw Pillow", description: "Indigo adire cushion cover with insert, 45 × 45 cm.", category: "Home", type: "Physical", status: "Published", channels: ["Online Store"], cost: 6_200, featured: true, options: [],
    variants: [{ sku: "ADR-PIL-45", label: "Default", price: 14_500, available: 54, reserved: 2, reorderAt: 15 }], createdAt: "2026-04-20T10:00:00Z" },
  { id: "prd_04", name: "Leather Sandals", description: "Handmade Kano leather sandals.", category: "Fashion", type: "Physical", status: "Published", channels: ["Online Store", "POS"], cost: 8_800, options: ["Size"],
    variants: [
      { sku: "LTH-SND-40", label: "Size 40", price: 17_500, available: 2, reserved: 1, reorderAt: 5 },
      { sku: "LTH-SND-42", label: "Size 42", price: 17_500, available: 0, reserved: 0, reorderAt: 5 },
      { sku: "LTH-SND-44", label: "Size 44", price: 17_500, available: 6, reserved: 0, reorderAt: 5 },
    ], createdAt: "2026-07-08T10:00:00Z" },
  { id: "prd_05", name: "Zobo Hibiscus Drink 1L", description: "Chilled zobo with ginger and pineapple.", category: "Food & Drinks", type: "Physical", status: "Published", channels: ["POS"], cost: 900, options: [],
    variants: [{ sku: "ZOBO-1L", label: "Default", price: 2_000, available: 64, reserved: 0, reorderAt: 30 }], createdAt: "2026-08-14T10:00:00Z" },
  { id: "prd_06", name: "Chin Chin Snack Jar", description: "Crunchy homemade chin chin, 500g jar.", category: "Food & Drinks", type: "Physical", status: "Published", channels: ["Online Store", "POS"], cost: 1_400, options: [],
    variants: [{ sku: "CHN-500", label: "Default", price: 3_500, available: 41, reserved: 5, reorderAt: 20 }], createdAt: "2026-08-14T10:00:00Z" },
  { id: "prd_07", name: "Beaded Statement Necklace", description: "Coral-style glass bead necklace.", category: "Accessories", type: "Physical", status: "Published", channels: ["Online Store", "POS"], cost: 5_000, featured: true, options: [],
    variants: [{ sku: "BEAD-NCK-01", label: "Default", price: 12_000, available: 9, reserved: 0, reorderAt: 8 }], createdAt: "2026-03-30T10:00:00Z" },
  { id: "prd_08", name: "Kente Bow Tie", description: "Woven kente bow tie, adjustable strap.", category: "Accessories", type: "Physical", status: "Published", channels: ["Online Store", "POS"], cost: 2_600, options: [],
    variants: [{ sku: "KNT-BOW-01", label: "Default", price: 6_500, available: 33, reserved: 0, reorderAt: 10 }], createdAt: "2026-02-18T10:00:00Z" },
  { id: "prd_09", name: "Black Soap Bar (3-pack)", description: "Traditional ose dudu black soap.", category: "Beauty", type: "Physical", status: "Published", channels: ["Online Store", "POS"], cost: 1_200, options: [],
    variants: [{ sku: "BLK-SOAP-3", label: "Default", price: 3_000, available: 0, reserved: 0, reorderAt: 20 }], createdAt: "2026-05-11T10:00:00Z" },
  { id: "prd_10", name: "Aso Oke Head Wrap", description: "Hand-loomed aso oke gele.", category: "Fashion", type: "Physical", status: "Published", channels: ["Online Store"], cost: 9_500, options: ["Colour"],
    variants: [
      { sku: "ASO-GEL-GLD", label: "Gold", price: 22_000, available: 7, reserved: 2, reorderAt: 4 },
      { sku: "ASO-GEL-WIN", label: "Wine", price: 22_000, available: 3, reserved: 0, reorderAt: 4 },
    ], createdAt: "2026-09-01T10:00:00Z" },
  { id: "prd_11", name: "Scented Candle — Lagos Rain", description: "Soy wax candle, 40-hour burn.", category: "Home", type: "Physical", status: "Draft", channels: ["Online Store"], cost: 3_300, options: [],
    variants: [{ sku: "CND-LGR-01", label: "Default", price: 8_500, available: 18, reserved: 0, reorderAt: 6 }], createdAt: "2026-10-12T10:00:00Z" },
  { id: "prd_12", name: "Nigerian Cooking E-book", description: "60 family recipes, instant PDF download.", category: "Food & Drinks", type: "Digital", status: "Published", channels: ["Online Store"], cost: 0, options: [],
    variants: [{ sku: "EBOOK-COOK", label: "Default", price: 5_000, available: 0, reserved: 0, reorderAt: 0 }], createdAt: "2026-01-09T10:00:00Z" },
  { id: "prd_13", name: "Woven Raffia Basket", description: "Large storage basket, natural raffia.", category: "Home", type: "Physical", status: "Published", channels: ["POS"], cost: 4_000, options: [],
    variants: [{ sku: "RAF-BSK-L", label: "Default", price: 9_000, available: 11, reserved: 0, reorderAt: 5 }], createdAt: "2026-06-22T10:00:00Z" },
  { id: "prd_14", name: "Ankara Face Cap", description: "Six-panel cap in Ankara print.", category: "Accessories", type: "Physical", status: "Archived", channels: [], cost: 2_000, options: [],
    variants: [{ sku: "ANK-CAP-01", label: "Default", price: 5_500, available: 4, reserved: 0, reorderAt: 0 }], createdAt: "2025-11-03T10:00:00Z" },
];

/** Digital products don't track stock. */
export const tracksStock = (p: Product) => p.type === "Physical";

export function stockStatus(p: Product, v: Variant): "In stock" | "Low stock" | "Out of stock" | "Not tracked" {
  if (!tracksStock(p)) return "Not tracked";
  if (v.available <= 0) return "Out of stock";
  if (v.available <= v.reorderAt) return "Low stock";
  return "In stock";
}

export function productStockStatus(p: Product) {
  if (!tracksStock(p)) return "Not tracked" as const;
  const total = p.variants.reduce((t, v) => t + v.available, 0);
  if (total <= 0) return "Out of stock" as const;
  return p.variants.some((v) => stockStatus(p, v) !== "In stock") ? ("Low stock" as const) : ("In stock" as const);
}

export const priceRange = (p: Product) => {
  const prices = p.variants.map((v) => v.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
};

export const catalogStore = createDemoStore(INITIAL_PRODUCTS);
export const useCatalog = () => catalogStore.use();

/** Change one variant's available quantity (Inventory adjustments, POS sales). Never goes below 0. */
export function adjustStock(sku: string, delta: number) {
  catalogStore.set((list) =>
    list.map((p) => ({
      ...p,
      variants: p.variants.map((v) => (v.sku === sku ? { ...v, available: Math.max(0, v.available + delta) } : v)),
    })),
  );
}

export const findVariant = (sku: string) => {
  for (const p of catalogStore.get()) {
    const v = p.variants.find((x) => x.sku === sku);
    if (v) return { product: p, variant: v };
  }
  return undefined;
};
