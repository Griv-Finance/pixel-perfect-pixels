import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Check, ChevronLeft, User, Building2, Landmark, Users, HeartHandshake, MoreHorizontal,
  Link2, Receipt, Wallet, Globe, CreditCard, Repeat,
} from "lucide-react";
import { Logo } from "@/components/griv/Logo";
import { FieldGroup } from "@/components/griv/AuthLayout";
import { setGriv, toggleIn, useGriv } from "@/lib/griv-store";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your business — Griv Finance" },
      { name: "description", content: "Tell us about your business so Griv can set up your workspace around the way you work." },
      { property: "og:title", content: "Set up your business — Griv Finance" },
      { property: "og:description", content: "Get your business ready on Griv in a few short steps." },
    ],
  }),
  component: Onboarding,
});

const STEPS = ["Business", "Location", "What you do", "How money moves", "Your needs", "Your workspace", "Get paid"];

const TYPES = [
  { v: "Individual", icon: User, d: "Sole trader or freelancer" },
  { v: "Registered Business", icon: Building2, d: "Business name registered with CAC" },
  { v: "Limited Company", icon: Landmark, d: "Ltd company with directors" },
  { v: "Partnership", icon: Users, d: "Two or more owners" },
  { v: "Non-Governmental Organisation", icon: HeartHandshake, d: "NGO or non-profit" },
  { v: "Other", icon: MoreHorizontal, d: "Something else" },
];
const INDUSTRIES = ["Retail", "E-commerce", "Food & Restaurant", "Logistics", "Professional Services", "Technology", "Healthcare", "Education", "Real Estate", "Manufacturing", "Financial Services", "Hospitality", "Agriculture", "Other"];
const STATES = ["Lagos", "Abuja (FCT)", "Rivers", "Oyo", "Kano", "Enugu", "Delta", "Kaduna", "Ogun", "Anambra"];
const CUSTOMER_PAY = ["Bank transfer", "Card", "Payment link", "Cash", "POS", "Online checkout"];
const PAY_OTHERS = ["Bank transfer", "Cards", "Bulk payments", "Scheduled payments", "Cash"];
const CAPS: { group: string; items: string[] }[] = [
  { group: "Collect money", items: ["Accept payments", "Payment links", "Invoices", "Virtual accounts", "Online checkout"] },
  { group: "Pay & manage money", items: ["Pay suppliers", "Send money", "Scheduled payments", "Bulk payouts", "Business balances"] },
  { group: "Sell & operate", items: ["Online store", "Products", "Inventory", "POS", "Customers"] },
  { group: "Grow", items: ["Business insights", "Credit", "AI tools"] },
];
const GET_PAID = [
  { v: "Payment links", icon: Link2, d: "Share a link with customers and get paid online." },
  { v: "Virtual accounts", icon: Wallet, d: "Give customers a dedicated account for payments." },
  { v: "Invoices", icon: Receipt, d: "Create and send invoices with payment options." },
  { v: "Online checkout", icon: Globe, d: "Accept payments directly from your website." },
  { v: "Cards", icon: CreditCard, d: "Accept card payments from your customers." },
  { v: "Direct debit", icon: Repeat, d: "Collect recurring payments automatically." },
];

function Onboarding() {
  const navigate = useNavigate();
  const g = useGriv();
  const [step, setStep] = useState(0);

  const canContinue = [
    !!g.businessName && !!g.businessType,
    !!g.state && !!g.city,
    !!g.industry,
    g.customerPay.length > 0,
    g.capabilities.length > 0,
    true,
    g.getPaid.length > 0,
  ][step];

  const next = () => {
    if (step === STEPS.length - 1) {
      setGriv({ onboarded: true });
      navigate({ to: "/setup-complete" });
    } else setStep(step + 1);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[360px_1fr]">
      <aside className="hidden flex-col border-r bg-cream p-10 lg:flex">
        <Link to="/"><Logo className="h-7" /></Link>
        <h2 className="mt-14 text-2xl font-semibold tracking-tight">Get your business ready.</h2>
        <p className="mt-2 text-sm text-muted-foreground">One short step at a time. You can change anything later.</p>
        <ol className="mt-10 space-y-1">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={s}>
                <button
                  disabled={i > step}
                  onClick={() => setStep(i)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${active ? "bg-card font-semibold shadow-sm" : done ? "text-foreground hover:bg-card/60" : "text-muted-foreground"}`}
                >
                  <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${done ? "bg-blackwood text-blackwood-foreground" : active ? "bg-primary text-primary-foreground" : "border border-input"}`}>
                    {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  {s}
                </button>
              </li>
            );
          })}
        </ol>
        <p className="mt-auto text-xs text-muted-foreground">Griv Finance · Built for African businesses</p>
      </aside>

      <main className="flex min-h-screen flex-col">
        <div className="h-1 bg-muted lg:hidden"><div className="h-full bg-primary transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
        <div className="flex items-center justify-between px-6 py-6 lg:px-12">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4" />Back</button>
          ) : <span />}
          <span className="label-caps">Step {step + 1} of {STEPS.length}</span>
        </div>
        <div className="flex flex-1 justify-center px-6 pb-10 lg:px-12">
          <div key={step} className="w-full max-w-[600px] animate-in fade-in slide-in-from-bottom-2 duration-300">
            {step === 0 && (
              <Step title="Let's get to know your business." sub="This helps us set up Griv around the way your business works.">
                <FieldGroup label="Business name"><input className="field" value={g.businessName} onChange={(e) => setGriv({ businessName: e.target.value })} placeholder="Nova Retail Ltd." maxLength={120} /></FieldGroup>
                <div>
                  <span className="mb-2 block text-sm font-medium">Business type</span>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {TYPES.map(({ v, icon: Icon, d }) => (
                      <button key={v} className="choice" data-selected={g.businessType === v} onClick={() => setGriv({ businessType: v })}>
                        <Icon className="h-5 w-5 shrink-0 text-primary" />
                        <span><span className="block text-sm font-semibold">{v}</span><span className="block text-xs text-muted-foreground">{d}</span></span>
                      </button>
                    ))}
                  </div>
                </div>
              </Step>
            )}
            {step === 1 && (
              <Step title="Where is your business based?" sub="We'll use this for verification and local payment options.">
                <FieldGroup label="Country">
                  <select className="field" value={g.country} onChange={(e) => setGriv({ country: e.target.value })}>
                    <option>Nigeria</option><option disabled>Ghana — coming soon</option><option disabled>Kenya — coming soon</option>
                  </select>
                </FieldGroup>
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="State">
                    <select className="field" value={g.state} onChange={(e) => setGriv({ state: e.target.value })}>
                      <option value="">Select state</option>{STATES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </FieldGroup>
                  <FieldGroup label="City"><input className="field" value={g.city} onChange={(e) => setGriv({ city: e.target.value })} placeholder="Ikeja" maxLength={80} /></FieldGroup>
                </div>
                <FieldGroup label="Business address"><input className="field" value={g.address} onChange={(e) => setGriv({ address: e.target.value })} placeholder="12 Allen Avenue" maxLength={200} /></FieldGroup>
              </Step>
            )}
            {step === 2 && (
              <Step title="What does your business do?" sub="Pick the closest match.">
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map((i) => (
                    <button key={i} className="choice px-3.5 py-2 text-sm font-medium" data-selected={g.industry === i} onClick={() => setGriv({ industry: i })}>{i}</button>
                  ))}
                </div>
                <FieldGroup label="Describe your business" hint="Optional">
                  <textarea className="field h-24 py-3" value={g.description} onChange={(e) => setGriv({ description: e.target.value })} placeholder="We sell fashion products online and from our physical store." maxLength={500} />
                </FieldGroup>
                <FieldGroup label="Website" hint="Optional"><input className="field" value={g.website} onChange={(e) => setGriv({ website: e.target.value })} placeholder="novaretail.ng" maxLength={200} /></FieldGroup>
              </Step>
            )}
            {step === 3 && (
              <Step title="How does money move in your business?" sub="Select all that apply.">
                <Multi label="How do your customers usually pay you?" options={CUSTOMER_PAY} value={g.customerPay} onChange={(v) => setGriv({ customerPay: v })} />
                <Multi label="How do you usually pay others?" options={PAY_OTHERS} value={g.payOthers} onChange={(v) => setGriv({ payOthers: v })} />
              </Step>
            )}
            {step === 4 && (
              <Step title="What do you want to do with Griv?" sub="Choose what you need today. You can always add more later.">
                {CAPS.map((c) => (
                  <div key={c.group}>
                    <p className="label-caps mb-2">{c.group}</p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {c.items.map((i) => {
                        const sel = g.capabilities.includes(i);
                        return (
                          <button key={i} className="choice py-2.5 text-sm font-medium" data-selected={sel} onClick={() => setGriv({ capabilities: toggleIn(g.capabilities, i) })}>
                            <span className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${sel ? "border-primary bg-primary text-primary-foreground" : "border-input"}`}>{sel && <Check className="h-3 w-3" />}</span>
                            {i}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </Step>
            )}
            {step === 5 && (
              <Step title="Here's how Griv can help." sub="Your Griv workspace will be set up around these needs.">
                <div className="panel divide-y">
                  {g.capabilities.map((c) => (
                    <div key={c} className="flex items-center gap-3 px-5 py-3.5">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-success text-success-foreground"><Check className="h-3.5 w-3.5" /></span>
                      <span className="font-medium">{c}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-highlight px-5 py-4 text-sm text-highlight-foreground">
                  Your dashboard will put <strong>{g.capabilities.slice(0, 2).join(" and ")}</strong> front and centre.
                </div>
                <button onClick={() => setStep(4)} className="text-sm font-semibold text-primary hover:underline">Change selections</button>
              </Step>
            )}
            {step === 6 && (
              <Step title="How do you want to get paid?" sub="Choose one or more. You can set up the rest anytime.">
                <div className="grid gap-2 sm:grid-cols-2">
                  {GET_PAID.map(({ v, icon: Icon, d }) => (
                    <button key={v} className="choice items-start py-4" data-selected={g.getPaid.includes(v)} onClick={() => setGriv({ getPaid: toggleIn(g.getPaid, v) })}>
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-primary"><Icon className="h-4.5 w-4.5" /></span>
                      <span><span className="block text-sm font-semibold">{v}</span><span className="mt-0.5 block text-xs text-muted-foreground">{d}</span></span>
                    </button>
                  ))}
                </div>
              </Step>
            )}

            <div className="mt-10 flex items-center justify-between border-t pt-6">
              <Link to="/dashboard" className="btn btn-ghost px-0 text-sm">Save and finish later</Link>
              <button disabled={!canContinue} onClick={next} className="btn btn-primary min-w-36">
                {step === STEPS.length - 1 ? "Finish setup" : "Continue"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Step({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-muted-foreground">{sub}</p>
      <div className="mt-8 space-y-6">{children}</div>
    </div>
  );
}

function Multi({ label, options, value, onChange }: { label: string; options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div>
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o} className="choice px-3.5 py-2 text-sm font-medium" data-selected={value.includes(o)} onClick={() => onChange(toggleIn(value, o))}>{o}</button>
        ))}
      </div>
    </div>
  );
}
