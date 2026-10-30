import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog, StatusBadge } from "@/components/griv/kit";
import { sessionsStore, type Session } from "@/lib/demo/settings/business";
import { logSecurity } from "@/lib/demo/settings/activity";
import { fmtDateTime } from "@/lib/dates";
import { Section, SettingsPage } from "../ui";

export function SessionsPage() {
  const sessions = sessionsStore.use();
  const [revoke, setRevoke] = useState<Session | null>(null);
  const [others, setOthers] = useState(false);
  const otherCount = sessions.filter((s) => !s.current).length;

  return (
    <SettingsPage slug="sessions">
      <Section title="Where you're signed in" description="If you don't recognise a device, revoke it and change your password."
        action={<button className="btn btn-outline h-8 px-3 text-xs" disabled={!otherCount} onClick={() => setOthers(true)}>Sign out all other sessions</button>}>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/40 text-left text-xs font-semibold tracking-[0.08em] text-muted-foreground">
              <th className="px-4 py-2.5">Device</th><th className="px-4 py-2.5">Browser</th><th className="hidden px-4 py-2.5 md:table-cell">Operating system</th>
              <th className="px-4 py-2.5">Location</th><th className="hidden px-4 py-2.5 lg:table-cell">IP address</th><th className="px-4 py-2.5">Last activity</th><th className="px-4 py-2.5" />
            </tr></thead>
            <tbody className="divide-y">{sessions.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-medium">{s.device}</td>
                <td className="px-4 py-3">{s.browser}</td>
                <td className="hidden px-4 py-3 md:table-cell">{s.os}</td>
                <td className="px-4 py-3">{s.location} <span className="text-xs text-muted-foreground">(approx.)</span></td>
                <td className="hidden px-4 py-3 font-mono text-xs lg:table-cell">{s.ip}</td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{s.current ? "Now" : fmtDateTime(s.lastActive)}</td>
                <td className="px-4 py-3 text-right">{s.current ? <StatusBadge status="Current session" tone="info" /> : <button className="text-sm font-semibold text-destructive hover:underline" onClick={() => setRevoke(s)}>Revoke</button>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        {!otherCount && <p className="mt-3 text-sm text-muted-foreground">This is your only signed-in session.</p>}
      </Section>

      <ConfirmDialog open={!!revoke} onOpenChange={(o) => !o && setRevoke(null)} danger confirmLabel="Revoke session"
        title={`Revoke ${revoke?.device}?`} description={`${revoke?.browser} in ${revoke?.location} will need to sign in again.`}
        onConfirm={() => {
          if (!revoke) return;
          sessionsStore.set((all) => all.filter((x) => x.id !== revoke.id));
          logSecurity("Session revoked", "Session", `Signed out “${revoke.browser} on ${revoke.device}”.`);
          toast.success("Session removed from the list", { description: "No sign-in service is connected in this demo, so no real device was signed out." });
          setRevoke(null);
        }} />
      <ConfirmDialog open={others} onOpenChange={setOthers} danger confirmLabel="Sign out others"
        title={`Sign out ${otherCount} other session${otherCount === 1 ? "" : "s"}?`} description="Everywhere except this browser will need to sign in again."
        onConfirm={() => {
          sessionsStore.set((all) => all.filter((x) => x.current));
          logSecurity("Other sessions signed out", "Session", `${otherCount} sessions revoked.`);
          toast.success("Other sessions removed from the list", { description: "No real devices were signed out in this demo." });
          setOthers(false);
        }} />
    </SettingsPage>
  );
}
