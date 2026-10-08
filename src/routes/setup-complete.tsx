import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check, Link2 } from "lucide-react";
import { Logo } from "@/components/griv/Logo";
import { useGriv } from "@/lib/griv-store";

export const Route = createFileRoute("/setup-complete")({
  head: () => ({
    meta: [
      { title: "Your business is ready — Griv Finance" },
      { name: "description", content: "Your Griv workspace is set up. Create your first payment link and start getting paid." },
      { property: "og:title", content: "Your business is ready for Griv" },
      { property: "og:description", content: "Your Griv workspace is set up and ready." },
    ],
  }),
  component: Done,
});

function Done() {
  const g = useGriv();
  const items = ["Business profile", "Your needs", "Business account", "Payment setup"];
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <div className="px-8 py-7"><Logo className="h-7" /></div>
      <div className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-lg text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success text-success-foreground"><Check className="h-8 w-8" strokeWidth={2.5} /></div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight">{g.businessName || "Your business"} is ready for Griv.</h1>
          <div className="panel mx-auto mt-8 grid grid-cols-2 gap-3 p-5 text-left">
            {items.map((i) => (
              <div key={i} className="flex items-center gap-2 text-sm font-medium"><Check className="h-4 w-4 text-primary" />{i}</div>
            ))}
          </div>
          <div className="panel mt-4 flex items-center gap-4 p-5 text-left">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"><Link2 className="h-5 w-5" /></span>
            <div className="flex-1">
              <p className="label-caps">Your next step</p>
              <p className="mt-1 font-semibold">Create your first payment link</p>
              <p className="text-sm text-muted-foreground">Give your customers an easy way to pay you.</p>
            </div>
          </div>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/dashboard" className="btn btn-outline">Go to dashboard</Link>
            <Link to="/dashboard" className="btn btn-primary">Create payment link <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
