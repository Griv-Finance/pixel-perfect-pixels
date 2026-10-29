import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/griv/kit";
import { LogoMark } from "@/components/griv/Logo";
import { setLiveMode, useLiveMode } from "@/lib/live-mode";
import { linksStore, type PaymentLink } from "@/lib/demo/payment-links";
import { configToLink, clearDraft, configFromLink, defaultConfig, getDraft, setDraft, validateConfig, type BuilderConfig } from "@/lib/demo/link-builder";
import { ConfigColumn } from "./ConfigColumn";
import { CheckoutPreview } from "./CheckoutPreview";

/**
 * Full-screen Create/Edit Payment Link workspace (Stripe-style): a compact top bar, a 40% config
 * column and a 60% live checkout preview. Create mode passes no link; edit passes the link itself.
 */
export function LinkBuilderWorkspace({ link }: { link?: PaymentLink | undefined }) {
  const navigate = useNavigate();
  const key = link?.id ?? "new";
  const initial = useRef<string | null>(null);
  const [cfg, setCfg] = useState<BuilderConfig>(() => {
    const start = getDraft(key) ?? (link ? configFromLink(link) : defaultConfig());
    initial.current = JSON.stringify(start);
    return start;
  });
  const [tab, setTab] = useState<"payment" | "after">("payment");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [pane, setPane] = useState<"config" | "preview">("config");
  const [busy, setBusy] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [unwired, setUnwired] = useState(false);
  const live = useLiveMode();

  const update = (fn: (c: BuilderConfig) => BuilderConfig) =>
    setCfg((c) => {
      const next = fn(c);
      setDraft(key, next);
      return next;
    });

  const dirty = initial.current !== null && JSON.stringify(cfg) !== initial.current;
  const errors = validateConfig(cfg);
  const valid = Object.keys(errors).length === 0;

  const close = () => {
    if (dirty) setDiscarding(true);
    else goBack();
  };
  const goBack = () => {
    clearDraft(key);
    navigate({ to: link ? "/payment-links/$linkId" : "/payment-links", params: link ? { linkId: link.id } : {} });
  };

  const save = async () => {
    if (!valid || busy) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 700));
    const saved = configToLink(cfg, link);
    linksStore.set((all) => (link ? all.map((l) => (l.id === link.id ? saved : l)) : [saved, ...all]));
    clearDraft(key);
    setBusy(false);
    toast.success(link ? "Payment link updated" : "Demo payment link created — no live checkout");
    navigate({ to: "/payment-links/$linkId", params: { linkId: saved.id } });
  };

  const envToggle = (
    <div className="flex rounded-lg border p-0.5 text-xs font-semibold" aria-label="Environment">
      {(["Test", "Live"] as const).map((m) => (
        <button
          key={m}
          onClick={() => setLiveMode(m === "Live")}
          className={`rounded-md px-2.5 py-1.5 ${m === "Live" === live ? (live ? "bg-blackwood text-blackwood-foreground" : "bg-highlight text-highlight-foreground") : "text-muted-foreground"}`}
        >
          {m}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-background px-3 sm:px-5">
        <button
          onClick={close}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Close and go back"
        >
          <X className="h-4.5 w-4.5" />
        </button>
        <LogoMark className="hidden h-6 w-6 shrink-0 sm:block" />
        <h1 className="min-w-0 flex-1 truncate text-sm font-semibold">
          {link ? "Edit payment link" : "Create a payment link"}
        </h1>
        {/* Mobile pane switch */}
        <div className="flex rounded-lg border p-0.5 text-xs font-semibold lg:hidden">
          {(["config", "preview"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPane(p)}
              className={`rounded-md px-2.5 py-1.5 capitalize ${pane === p ? "bg-accent text-primary" : "text-muted-foreground"}`}
            >
              {p}
            </button>
          ))}
        </div>
        {envToggle}
        <button className="btn btn-primary h-8 shrink-0 px-3 text-sm" disabled={!valid || busy} onClick={save}>
          {busy ? "Saving…" : link ? "Update link" : "Create link"}
        </button>
      </header>
      {!live && (
        <div className="bg-highlight py-1 text-center text-xs font-semibold uppercase tracking-[0.14em] text-highlight-foreground">
          Test mode — no real money moves
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* Left column — configuration (~40%) */}
        <div className={`${pane === "config" ? "flex" : "hidden"} min-w-0 flex-1 flex-col overflow-y-auto border-r lg:flex lg:w-[40%] lg:flex-none`}>
          <ConfigColumn cfg={cfg} update={update} errors={errors} tab={tab} onTab={setTab} onUnwired={() => setUnwired(true)} />
        </div>
        {/* Right column — live preview (~60%) */}
        <div className={`${pane === "preview" ? "flex" : "hidden"} min-w-0 flex-1 justify-center overflow-y-auto bg-muted/40 lg:flex lg:w-[60%]`}>
          <CheckoutPreview cfg={cfg} errors={errors} device={device} onDevice={setDevice} tab={tab} live={live} />
        </div>
      </div>

      <ConfirmDialog
        open={discarding}
        onOpenChange={(o) => !o && setDiscarding(false)}
        title="Discard unsaved changes?"
        description="The configuration on this screen hasn't been saved yet. Closing now throws away your changes."
        danger
        confirmLabel="Discard changes"
        onConfirm={goBack}
      />
      <ConfirmDialog
        open={unwired}
        onOpenChange={(o) => !o && setUnwired(false)}
        title="Not wired up in the demo yet"
        description="Image upload isn't connected in this preview. When the real backend arrives, product and payment images will upload to Griv storage here."
        confirmLabel="Got it"
        onConfirm={() => setUnwired(false)}
      />
    </div>
  );
}
