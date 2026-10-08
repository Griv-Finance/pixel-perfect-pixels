import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo, LogoMark } from "./Logo";

export function AuthLayout({
  aside,
  topRight,
  children,
}: {
  aside: ReactNode;
  topRight?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(380px,44%)_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-blackwood p-10 text-blackwood-foreground lg:flex">
        <Link to="/">
          <Logo variant="light" className="h-8" />
        </Link>
        <div className="relative z-10 max-w-md">{aside}</div>
        <p className="relative z-10 text-xs text-blackwood-foreground/60">
          © 2026 Griv Finance. Everything you need to run your business.
        </p>
        <LogoMark className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 opacity-10" />
      </aside>
      <main className="flex min-h-screen flex-col bg-background">
        <div className="flex items-center justify-between px-6 py-6 lg:justify-end lg:px-10">
          <Logo className="h-7 lg:hidden" />
          <div className="text-sm text-muted-foreground">{topRight}</div>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <div className="w-full max-w-[440px]">{children}</div>
        </div>
      </main>
    </div>
  );
}

export function FieldGroup({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}
