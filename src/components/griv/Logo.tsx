import solid from "@/assets/primary.solid.logo.png.asset.json";
import light from "@/assets/primary.transparent.logo.png.asset.json";
import mark from "@/assets/secondary.solid.logo.mark.png.asset.json";

export function Logo({ variant = "dark", className = "h-7" }: { variant?: "dark" | "light"; className?: string }) {
  return <img src={variant === "dark" ? solid.url : light.url} alt="Griv" className={`${className} w-auto`} />;
}

export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return <img src={mark.url} alt="" aria-hidden className={className} />;
}
