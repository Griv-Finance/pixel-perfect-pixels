// Brand logos are plain static PNGs in /public/brand so any host (Lovable, Vercel, etc.) serves them directly.
const solid = "/brand/primary.solid.logo.png";
const light = "/brand/primary.transparent.logo.png";
const mark = "/brand/secondary.solid.logo.mark.png";

export function Logo({ variant = "dark", className = "h-7" }: { variant?: "dark" | "light"; className?: string }) {
  return <img src={variant === "dark" ? solid : light} alt="Griv" className={`${className} w-auto`} />;
}

export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return <img src={mark} alt="" aria-hidden className={className} />;
}
