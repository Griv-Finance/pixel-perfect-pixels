import { Shirt, Sparkles, House, Coffee, Gem } from "lucide-react";
import type { Product } from "@/lib/demo/catalog";
const icons = {
  Fashion: Shirt,
  Beauty: Sparkles,
  Home: House,
  "Food & Drinks": Coffee,
  Accessories: Gem,
};
const colors = {
  Fashion: "bg-accent text-accent-foreground",
  Beauty: "bg-primary/15 text-foreground",
  Home: "bg-highlight text-foreground",
  "Food & Drinks": "bg-success/15 text-foreground",
  Accessories: "bg-muted text-foreground",
};
export function ProductThumb({
  product,
  large = false,
}: {
  product: Pick<Product, "name" | "category">;
  large?: boolean;
}) {
  const Icon = icons[product.category];
  return (
    <div
      aria-hidden
      className={`flex shrink-0 items-center justify-center gap-2 rounded-xl ${colors[product.category]} ${large ? "h-32 w-full" : "h-11 w-11"}`}
    >
      <Icon className={large ? "h-9 w-9" : "h-5 w-5"} />
      {large && (
        <span className="text-3xl font-semibold opacity-50">
          {product.name
            .split(" ")
            .slice(0, 2)
            .map((s) => s[0])
            .join("")}
        </span>
      )}
    </div>
  );
}
export const CATEGORIES = ["Fashion", "Beauty", "Home", "Food & Drinks", "Accessories"] as const;
