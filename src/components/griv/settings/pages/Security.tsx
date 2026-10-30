import { useState } from "react";
import { KeyRound, Plus, ShieldCheck, Smartphone, Fingerprint } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog, FormDialog, StatusBadge } from "@/components/griv/kit";
import { authMethodsStore, passkeysStore, securityMetaStore, type AuthMethod } from "@/lib/demo/settings/business";
import { logSecurity } from "@/lib/demo/settings/activity";
import { fmtDate, fmtDateTime } from "@/lib/dates";
import { Callout, ChoiceList, INPUT, InfoDialog, Row, RowMenu, Section, SettingsPage } from "../ui";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { DEMO_TODAY } from "@/lib/dates";

/** Password rules shown live while typing. */
export function passwordChecks(pw: string, current: string) {
  return [
    { ok: pw.length >= 10, label: "At least 10 characters" },
    { ok: /[a-zA-Z]/.test(pw) && /\d/.test(pw), label: "Letters and numbers" },
    { ok: !!pw && pw !== current, label: "Different from your current password" },
  ];
}

export function SecurityPage() {
  const meta = securityMetaStore.use();
  const methods = authMethodsStore.use();
  const passkeys = passkeysStore.use();
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState<string | null>(null);
  const [honest, setHonest] = useState<null | { title: string; body: string }>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState<"app" | "sms" | "key">("app");
  const [remove, setRemove] = useState<null | { kind: "method"; m: AuthMethod } | { kind: "passkey"; id: string; name: string }>(null);
  const [reauth, setReauth] = useState("");

  const checks = passwordChecks(pw.next, pw.current);
  const submitPassword = () => {
    if (!pw.current) return setPwError("Enter your current password to confirm it's you.");
    if (!checks.every((c) => c.ok)) return setPwError("Your new password doesn't meet all the requirements.");
    if (pw.next !== pw.confirm) return setPwError("The new passwords don't match.");
    setPwOpen(false);
    setHonest({ title: "Password not changed", body: "Your new password passed every check, but no sign-in service is connected to this demo, so nothing was changed. When sign-in is connected, this will update your password and sign out your other sessions." });
  };

  const confirmRemove = () => {
    if (!remove) return;
    if (!reauth) { toast.error("Enter your password to confirm."); return; }
    if (remove.kind === "method") {
      authMethodsStore.set((all) => {
        const left = all.filter((m) => m.id !== remove.m.id);
        if (remove.m.primary && left[0]) left[0] = { ...left[0], primary: true };
        return left;
      });
      logSecurity("Two-factor authentication method removed", "Authentication", `${remove.m.type} (${remove.m.label}) removed.`);
    } else {
      passkeysStore.set((all) => all.filter((p) => p.id !== remove.id));
      logSecurity("Passkey removed", "Authentication", `Passkey “${remove.name}” removed.`);
    }
    toast.success("Removed from this demo account", { description: "No real sign-in settings were changed." });
    setRemove(null); setReauth("");
  };

  const pwAge = differenceInCalendarDays(DEMO_TODAY, parseISO(meta.passwordUpdatedAt));

  return (
    <SettingsPage slug="security">
      <Section title="Password" description="Changing your password signs you out of every other device.">
        <Row label="Password" action={<button className="btn btn-outline h-8 px-3 text-xs" onClick={() => { setPw({ current: "", next: "", confirm: "" }); setPwError(null); setPwOpen(true); }}>Change password</button>}>
          <span className="flex flex-wrap items-center gap-2"><StatusBadge status="Set" tone="success" /><span className="text-muted-foreground">Last updated {fmtDate(meta.passwordUpdatedAt)} ({pwAge} days ago)</span></span>
        </Row>
      </Section>

      <Section title="Two-step authentication" description="A second step after your password, so a stolen password alone can't open your account."
        action={<button className="btn btn-outline h-8 px-3 text-xs" onClick={() => setAddOpen(true)}><Plus className="h-3.5 w-3.5" />Add authentication method</button>}>
        {methods.length === 0 ? (
          <Callout tone="warning">Two-step authentication is off. Add a method to protect your account and money movements.</Callout>
        ) : (
          <div className="rounded-lg border">
            {methods.map((m) => (
              <div key={m.id} className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0">
                <span className="grid h-8 w-8 place-items-center rounded-md bg-muted">{m.type === "SMS" ? <Smartphone className="h-4 w-4" /> : m.type === "Security key" ? <KeyRound className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}</span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium">{m.type}{m.primary && <StatusBadge status="Primary" tone="info" />}</p>
                  <p className="text-xs text-muted-foreground">{m.label} · added {fmtDate(m.addedAt)}</p>
                </div>
                <RowMenu items={[
                  { label: "Make primary", disabled: m.primary ? "Already primary" : false, onSelect: () => { authMethodsStore.set((all) => all.map((x) => ({ ...x, primary: x.id === m.id }))); logSecurity("Primary two-factor method changed", "Authentication", `${m.type} is now primary.`); toast.success(`${m.type} is now your primary method`); } },
                  { label: "Remove", danger: true, separatorBefore: true, disabled: methods.length === 1 ? "Add another method before removing your only one" : false, onSelect: () => setRemove({ kind: "method", m }) },
                ]} />
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 rounded-lg border px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Recovery codes</p>
              <p className="text-xs text-muted-foreground">{meta.recoveryCodesLeft} of 10 one-time codes left. Use one if you lose access to your other methods.</p>
            </div>
            <button className="btn btn-outline h-8 px-3 text-xs" onClick={() => setHonest({ title: "Recovery codes can't be generated here", body: "New recovery codes have to come from a real sign-in service so they actually work. None is connected to this demo, so no codes were created and your existing codes are unchanged." })}>Regenerate codes</button>
          </div>
        </div>
      </Section>

      <Section title="Passkeys" description="Sign in with your fingerprint, face, device PIN or a hardware security key."
        action={<button className="btn btn-outline h-8 px-3 text-xs" onClick={() => setHonest({ title: "Passkeys need a sign-in service", body: "Registering a passkey asks your device to create a key that a real sign-in server then stores and checks. No sign-in server is connected to this demo, so no passkey was created." })}><Plus className="h-3.5 w-3.5" />Add passkey</button>}>
        {passkeys.length === 0 ? (
          <div className="rounded-lg border border-dashed px-6 py-8 text-center text-sm"><Fingerprint className="mx-auto h-6 w-6 text-primary" /><p className="mt-2 font-semibold">No passkeys yet</p><p className="text-muted-foreground">Add one to sign in without typing a password.</p></div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/40 text-left text-xs font-semibold tracking-[0.08em] text-muted-foreground"><th className="px-4 py-2.5">Passkey</th><th className="px-4 py-2.5">Created</th><th className="px-4 py-2.5">Last used</th><th className="w-10" /></tr></thead>
              <tbody className="divide-y">{passkeys.map((p) => (
                <tr key={p.id}><td className="px-4 py-3 font-medium">{p.name}</td><td className="px-4 py-3 text-muted-foreground">{fmtDate(p.createdAt)}</td><td className="px-4 py-3 text-muted-foreground">{p.lastUsed ? fmtDateTime(p.lastUsed) : "Never"}</td>
                  <td className="px-2"><RowMenu items={[{ label: "Remove passkey", danger: true, onSelect: () => setRemove({ kind: "passkey", id: p.id, name: p.name }) }]} /></td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Section>

      <FormDialog open={pwOpen} onOpenChange={setPwOpen} title="Change password" description="Confirm your current password first."
        footer={<><button className="btn btn-outline h-9 text-sm" onClick={() => setPwOpen(false)}>Cancel</button><button className="btn btn-primary h-9 text-sm" onClick={submitPassword}>Change password</button></>}>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); submitPassword(); }}>
          <label className="block text-sm font-medium">Current password<input type="password" autoComplete="current-password" className={`${INPUT} mt-1.5`} value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></label>
          <label className="block text-sm font-medium">New password<input type="password" autoComplete="new-password" className={`${INPUT} mt-1.5`} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></label>
          <ul className="space-y-1 text-xs">{checks.map((c) => <li key={c.label} className={c.ok ? "text-success-foreground" : "text-muted-foreground"}>{c.ok ? "✓" : "○"} {c.label}</li>)}</ul>
          <label className="block text-sm font-medium">Confirm new password<input type="password" autoComplete="new-password" className={`${INPUT} mt-1.5`} value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></label>
          {pwError && <p className="text-xs font-medium text-destructive" role="alert">{pwError}</p>}
        </form>
      </FormDialog>

      <FormDialog open={addOpen} onOpenChange={setAddOpen} title="Add authentication method" description="Pick how you'd like to confirm it's you."
        footer={<><button className="btn btn-outline h-9 text-sm" onClick={() => setAddOpen(false)}>Cancel</button><button className="btn btn-primary h-9 text-sm" onClick={() => { setAddOpen(false); setHonest({ title: "Setup can't be completed in the demo", body: "Adding a method needs a real sign-in service to issue a secret, check your first code and store the method securely. None is connected, so no method was added." }); }}>Continue</button></>}>
        <ChoiceList name="Method" value={addType} onChange={setAddType} options={[
          { id: "app", label: "Authenticator app", description: "Google Authenticator, Microsoft Authenticator, 1Password and similar." },
          { id: "sms", label: "SMS text message", description: "A code sent to your phone. Less secure than an app — use as a backup." },
          { id: "key", label: "Hardware security key", description: "A USB or NFC key such as a YubiKey." },
        ]} />
      </FormDialog>

      <ConfirmDialog open={!!remove} onOpenChange={(o) => { if (!o) { setRemove(null); setReauth(""); } }} danger confirmLabel="Remove"
        title={remove?.kind === "passkey" ? `Remove “${remove.name}”?` : `Remove ${remove?.kind === "method" ? remove.m.type : ""}?`}
        description="You won't be able to use it to sign in. Enter your password to confirm." onConfirm={confirmRemove}>
        <input type="password" aria-label="Password" placeholder="Password" className={INPUT} value={reauth} onChange={(e) => setReauth(e.target.value)} />
      </ConfirmDialog>

      <InfoDialog open={!!honest} onOpenChange={(o) => !o && setHonest(null)} title={honest?.title ?? ""}><p>{honest?.body}</p></InfoDialog>
    </SettingsPage>
  );
}
