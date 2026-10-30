import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Loader2, Lock, Minus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  CHANNELS, isLocked, isUnavailable, NOTIFICATION_TABS, prefsStore, setPref, usePrefs, type Channel, type NotificationEvent,
} from "@/lib/demo/settings/notifications";
import { SettingsPage, SettingsTabs, useTab } from "../ui";
import { cn } from "@/lib/utils";

const TAB_IDS = NOTIFICATION_TABS.map((t) => t.id);

function Cell({ e, c, on, onToggle }: { e: NotificationEvent; c: Channel; on: boolean; onToggle: (v: boolean) => void }) {
  const label = `${e.label} by ${CHANNELS.find((x) => x.id === c)?.label}`;
  if (isUnavailable(e, c)) {
    return (
      <Tooltip><TooltipTrigger asChild><span className="inline-grid h-5 w-5 place-items-center text-muted-foreground/50" aria-label={`${label}: not available`}><Minus className="h-3.5 w-3.5" /></span></TooltipTrigger>
        <TooltipContent className="bg-blackwood text-blackwood-foreground">Griv doesn't send this alert by {c === "sms" ? "SMS" : c === "push" ? "push" : c}.</TooltipContent></Tooltip>
    );
  }
  if (isLocked(e, c)) {
    return (
      <Tooltip><TooltipTrigger asChild><span className="relative inline-grid h-5 w-5 place-items-center" aria-label={`${label}: always on`}>
        <input type="checkbox" checked readOnly disabled className="h-4 w-4 accent-primary opacity-60" tabIndex={-1} /><Lock className="absolute -right-2 -top-1 h-2.5 w-2.5 text-muted-foreground" />
      </span></TooltipTrigger><TooltipContent className="max-w-xs bg-blackwood text-blackwood-foreground">Required for your account's security, so it can't be turned off.</TooltipContent></Tooltip>
    );
  }
  return <input type="checkbox" checked={on} onChange={(ev) => onToggle(ev.target.checked)} aria-label={label} className="h-4 w-4 cursor-pointer accent-primary" />;
}

export function CommunicationPage() {
  const [tab, setTab] = useTab(TAB_IDS, "account");
  const prefs = usePrefs();
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const toggle = (id: string, c: Channel, v: boolean) => {
    prefsStore.set((p) => setPref(p, id, c, v));
    setState("saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setState("saved"); timer.current = setTimeout(() => setState("idle"), 2000); }, 500);
  };

  const current = NOTIFICATION_TABS.find((t) => t.id === tab)!;

  return (
    <SettingsPage slug="communication">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">These preferences only apply to you, for Nova Retail Ltd. Customer emails are set in <Link to="/settings/$slug" params={{ slug: "customers" }} className="font-medium text-primary hover:underline">Customer settings</Link>.</p>
        <p className="flex h-5 items-center gap-1.5 text-xs font-medium text-muted-foreground" aria-live="polite">
          {state === "saving" && <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving…</>}
          {state === "saved" && <><Check className="h-3.5 w-3.5 text-success-foreground" />Saved</>}
        </p>
      </div>
      <SettingsTabs className="mt-4" tabs={NOTIFICATION_TABS.map((t) => ({ id: t.id, label: t.label }))} value={tab} onChange={setTab} />
      <div className="max-w-3xl space-y-8">
        {current.groups.map((g) => (
          <table key={g.title} className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-semibold">{g.title}</th>
                {CHANNELS.map((c) => <th key={c.id} className="w-14 pb-2 text-center text-xs font-semibold sm:w-16">{c.label}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y">
              {g.events.map((e) => (
                <tr key={e.id} className="hover:bg-muted/40">
                  <td className="py-2.5 pr-3">
                    {e.label}
                    {e.mandatory && <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Required</span>}
                  </td>
                  {CHANNELS.map((c) => (
                    <td key={c.id} className={cn("text-center")}><Cell e={e} c={c.id} on={!!prefs[e.id]?.[c.id]} onToggle={(v) => toggle(e.id, c.id, v)} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ))}
        <p className="text-xs text-muted-foreground">Push needs the Griv mobile app. SMS is limited to urgent money and security alerts.</p>
      </div>
    </SettingsPage>
  );
}
