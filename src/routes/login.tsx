import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthLayout, FieldGroup } from "@/components/griv/AuthLayout";
import { setGriv } from "@/lib/griv-store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — Griv Finance" },
      { name: "description", content: "Log in to your Griv account to manage payments, balances and your business." },
      { property: "og:title", content: "Log in — Griv Finance" },
      { property: "og:description", content: "Log in to your Griv business account." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  return (
    <AuthLayout
      topRight={<>New to Griv? <Link to="/" className="font-semibold text-primary hover:underline">Create an account</Link></>}
      aside={<h2 className="text-4xl font-semibold leading-tight tracking-tight">Your business, all in one place.</h2>}
    >
      <h1 className="text-3xl font-semibold tracking-tight">Welcome back.</h1>
      <p className="mt-2 text-muted-foreground">Log in to your Griv account.</p>
      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setGriv({ onboarded: true, businessName: "Nova Retail", firstName: "Ada" });
          navigate({ to: "/dashboard" });
        }}
      >
        <FieldGroup label="Email or phone"><input className="field" value={id} onChange={(e) => setId(e.target.value)} placeholder="ada@novaretail.ng" maxLength={255} /></FieldGroup>
        <FieldGroup label="Password"><input type="password" className="field" value={pw} onChange={(e) => setPw(e.target.value)} maxLength={128} /></FieldGroup>
        <div className="flex justify-end"><button type="button" className="text-sm font-medium text-primary hover:underline">Forgot password?</button></div>
        <button disabled={!id || !pw} className="btn btn-primary w-full">Log in</button>
        <p className="text-center text-xs text-muted-foreground">Demo: any details work and open an active business.</p>
      </form>
    </AuthLayout>
  );
}
