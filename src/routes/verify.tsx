import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { AuthLayout } from "@/components/griv/AuthLayout";
import { useGriv } from "@/lib/griv-store";

export const Route = createFileRoute("/verify")({
  head: () => ({
    meta: [
      { title: "Verify your phone — Griv Finance" },
      { name: "description", content: "Enter the 6-digit code we sent to confirm your Griv account." },
      { property: "og:title", content: "Verify your phone — Griv Finance" },
      { property: "og:description", content: "Confirm your Griv account with a one-time code." },
    ],
  }),
  component: Verify,
});

function Verify() {
  const navigate = useNavigate();
  const g = useGriv();
  const [code, setCode] = useState(Array(6).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const full = code.every((c) => c);

  return (
    <AuthLayout aside={<h2 className="text-4xl font-semibold leading-tight tracking-tight">Keeping your business and your money secure.</h2>}>
      <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4" />Back</Link>
      <h1 className="text-3xl font-semibold tracking-tight">Check your phone.</h1>
      <p className="mt-2 text-muted-foreground">
        We sent a 6-digit code to <span className="font-medium text-foreground">+234 {g.phone || "803 123 4567"}</span>.
      </p>
      <div className="mt-8 flex gap-2">
        {code.map((c, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            value={c}
            inputMode="numeric"
            maxLength={1}
            className="field h-14 text-center text-xl font-semibold tnum"
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(-1);
              const next = [...code]; next[i] = v; setCode(next);
              if (v && i < 5) refs.current[i + 1]?.focus();
            }}
            onKeyDown={(e) => { if (e.key === "Backspace" && !c && i > 0) refs.current[i - 1]?.focus(); }}
          />
        ))}
      </div>
      <button disabled={!full} onClick={() => navigate({ to: "/welcome" })} className="btn btn-primary mt-6 w-full">Verify</button>
      <p className="mt-4 text-center text-sm text-muted-foreground">Didn't get it? <button className="font-semibold text-primary">Resend code</button></p>
      <p className="mt-2 text-center text-xs text-muted-foreground">Demo: enter any 6 digits.</p>
    </AuthLayout>
  );
}
