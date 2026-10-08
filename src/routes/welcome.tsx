import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Logo, LogoMark } from "@/components/griv/Logo";
import { useGriv } from "@/lib/griv-store";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Welcome to Griv — Griv Finance" },
      { name: "description", content: "Set up your business on Griv to collect payments, sell products and run your operations." },
      { property: "og:title", content: "Welcome to Griv" },
      { property: "og:description", content: "Everything you need to run your business." },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const g = useGriv();
  const steps = ["Start", "Run", "Manage", "Grow", "Scale"];
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-blackwood text-blackwood-foreground">
      <div className="px-8 py-7"><Logo variant="light" className="h-8" /></div>
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-8 pb-20">
        <p className="label-caps text-primary">Welcome{g.firstName ? `, ${g.firstName}` : ""}</p>
        <h1 className="mt-4 text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
          Welcome to Griv.<br />
          <span className="text-blackwood-foreground/55">Everything you need to run your business.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-blackwood-foreground/75">
          Griv helps you collect and make payments, sell products, manage inventory, and run your business — all from one platform.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link to="/onboarding" className="btn btn-primary h-12 px-6">Set up my business <ArrowRight className="h-4 w-4" /></Link>
          <Link to="/dashboard" className="text-sm font-medium text-blackwood-foreground/70 hover:text-blackwood-foreground">I'll do this later</Link>
        </div>
        <div className="mt-16 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-blackwood-foreground/50">
          {steps.map((s, i) => (
            <span key={s} className="flex items-center gap-3">
              <span className={i === 0 ? "text-primary" : ""}>{s}</span>
              {i < steps.length - 1 && <span className="h-px w-8 bg-blackwood-foreground/25" />}
            </span>
          ))}
        </div>
      </div>
      <LogoMark className="pointer-events-none absolute -right-40 top-1/2 h-[640px] w-[640px] -translate-y-1/2 opacity-[0.12]" />
    </div>
  );
}
