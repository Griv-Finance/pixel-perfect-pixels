import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { FormDialog, StatusBadge } from "@/components/griv/kit";
import { setGriv, useGriv } from "@/lib/griv-store";
import { DATE_FORMATS, LANGUAGES, NUMBER_FORMATS, personalStore, TIME_ZONES } from "@/lib/demo/settings/business";
import { authMethodsStore, passkeysStore, sessionsStore } from "@/lib/demo/settings/business";
import { useRoles, useViewer } from "@/lib/demo/settings/access";
import { logAudit, logSecurity } from "@/lib/demo/settings/activity";
import { Callout, INPUT, Row, SaveBar, Section, SELECT, SettingsPage, useDraft } from "../ui";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^\+?[\d\s()-]{7,20}$/;

/** The signed-in person's identity: onboarding details when present, otherwise the demo owner. */
export function useIdentity() {
  const g = useGriv();
  return {
    first: g.firstName || "Ada", last: g.lastName || "Okafor",
    email: g.email || "ada@novaretail.ng", phone: g.phone || "+234 803 555 0101",
  };
}

type Edit = null | "name" | "email" | "backup" | "phone";

export function PersonalDetailsPage() {
  const me = useIdentity();
  const prefs = personalStore.use();
  const methods = authMethodsStore.use();
  const passkeys = passkeysStore.use();
  const sessions = sessionsStore.use();
  const viewer = useViewer();
  const roles = useRoles();
  const [edit, setEdit] = useState<Edit>(null);
  const [value, setValue] = useState({ a: "", b: "" });
  const [error, setError] = useState<string | null>(null);
  const { draft, set, dirty, reset } = useDraft({ language: prefs.language, timeZone: prefs.timeZone, dateFormat: prefs.dateFormat, numberFormat: prefs.numberFormat });

  const open = (e: Edit) => {
    setError(null);
    setValue(e === "name" ? { a: me.first, b: me.last } : e === "backup" ? { a: prefs.backupEmail, b: "" } : { a: "", b: "" });
    setEdit(e);
  };

  const submit = () => {
    if (edit === "name") {
      if (!value.a.trim() || !value.b.trim()) return setError("Enter both your first and last name.");
      setGriv({ firstName: value.a.trim(), lastName: value.b.trim() });
      logAudit("Personal details changed", "Personal details", "Name", { before: { Name: `${me.first} ${me.last}` }, after: { Name: `${value.a.trim()} ${value.b.trim()}` } });
      toast.success("Name updated");
    } else if (edit === "email") {
      const v = value.a.trim().toLowerCase();
      if (!EMAIL.test(v)) return setError("Enter a valid email address.");
      if (v === me.email.toLowerCase()) return setError("That's already your email address.");
      personalStore.set((p) => ({ ...p, pendingEmail: v }));
      logSecurity("Email change requested", "Authentication", `Change to ${v} waiting for confirmation.`);
      toast.message("Email change started", { description: "It only takes effect after the new address is confirmed." });
    } else if (edit === "backup") {
      const v = value.a.trim().toLowerCase();
      if (v && !EMAIL.test(v)) return setError("Enter a valid email address.");
      if (v && v === me.email.toLowerCase()) return setError("Use a different address from your main email.");
      personalStore.set((p) => ({ ...p, backupEmail: v }));
      toast.success(v ? "Backup email saved — confirm it from your inbox" : "Backup email removed");
    } else if (edit === "phone") {
      const v = value.a.trim();
      if (!PHONE.test(v)) return setError("Enter a phone number with country code, like +234 803 555 0101.");
      personalStore.set((p) => ({ ...p, pendingPhone: v }));
      logSecurity("Phone change requested", "Authentication", `Change to ${v} waiting for SMS confirmation.`);
      toast.message("Phone change started", { description: "It only takes effect after the code sent to the new number is confirmed." });
    }
    setEdit(null);
  };

  return (
    <SettingsPage slug="personal-details">
      <Section title="Profile" description="How you appear to teammates and in activity logs.">
        <div>
          <Row label="Name" action={<button className="btn btn-outline h-8 px-3 text-xs" onClick={() => open("name")}>Edit</button>}>{me.first} {me.last}</Row>
          <Row label="Email address" hint="Used to sign in" action={<button className="btn btn-outline h-8 px-3 text-xs" onClick={() => open("email")}>Change</button>}>
            <span className="flex flex-wrap items-center gap-2">{me.email}<StatusBadge status="Verified" tone="success" /></span>
            {prefs.pendingEmail && (
              <span className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <StatusBadge status="Pending verification" tone="pending" />Changing to {prefs.pendingEmail}.
                <button className="font-semibold text-primary hover:underline" onClick={() => { personalStore.set((p) => ({ ...p, pendingEmail: null })); toast.success("Email change cancelled"); }}>Cancel change</button>
              </span>
            )}
          </Row>
          <Row label="Backup email" hint="For account recovery" action={<button className="btn btn-outline h-8 px-3 text-xs" onClick={() => open("backup")}>{prefs.backupEmail ? "Edit" : "Add backup email"}</button>}>
            {prefs.backupEmail ? <span className="flex flex-wrap items-center gap-2">{prefs.backupEmail}<StatusBadge status="Unverified" tone="neutral" /></span> : <span className="text-muted-foreground">Not set</span>}
          </Row>
          <Row label="Phone number" hint="For SMS codes and urgent alerts" action={<button className="btn btn-outline h-8 px-3 text-xs" onClick={() => open("phone")}>Change</button>}>
            <span className="flex flex-wrap items-center gap-2">{me.phone}<StatusBadge status="Verified" tone="success" /></span>
            {prefs.pendingPhone && (
              <span className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <StatusBadge status="Pending verification" tone="pending" />Changing to {prefs.pendingPhone}.
                <button className="font-semibold text-primary hover:underline" onClick={() => { personalStore.set((p) => ({ ...p, pendingPhone: null })); toast.success("Phone change cancelled"); }}>Cancel change</button>
              </span>
            )}
          </Row>
        </div>
        {(prefs.pendingEmail || prefs.pendingPhone) && (
          <div className="mt-4"><Callout>No email or SMS service is connected in this demo, so the confirmation message wasn't actually sent. Your current details stay in use until a change is confirmed.</Callout></div>
        )}
      </Section>

      <Section title="Language and region" description="Choose your language and how dates, times and numbers are shown to you.">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">Preferred language
            <select className={`${SELECT} mt-1.5`} value={draft.language} onChange={(e) => set({ language: e.target.value })}>{LANGUAGES.map((l) => <option key={l}>{l}</option>)}</select>
          </label>
          <label className="text-sm font-medium">Time zone
            <select className={`${SELECT} mt-1.5`} value={draft.timeZone} onChange={(e) => set({ timeZone: e.target.value })}>{TIME_ZONES.map((l) => <option key={l}>{l}</option>)}</select>
          </label>
          <label className="text-sm font-medium">Date format
            <select className={`${SELECT} mt-1.5`} value={draft.dateFormat} onChange={(e) => set({ dateFormat: e.target.value })}>{DATE_FORMATS.map((l) => <option key={l}>{l}</option>)}</select>
          </label>
          <label className="text-sm font-medium">Number format
            <select className={`${SELECT} mt-1.5`} value={draft.numberFormat} onChange={(e) => set({ numberFormat: e.target.value })}>{NUMBER_FORMATS.map((l) => <option key={l}>{l}</option>)}</select>
          </label>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Preview: {draft.dateFormat} · {draft.numberFormat.replace("1", "₦1")} · {draft.timeZone.split(" ")[0]}</p>
        <SaveBar dirty={dirty} onCancel={reset} onSave={() => { personalStore.set((p) => ({ ...p, ...draft })); toast.success("Preferences saved"); }} />
      </Section>

      <Section title="Sign-in and security" description="A summary of how your account is protected.">
        <Link to="/settings/$slug" params={{ slug: "security" }} className="flex items-center justify-between border-b py-3.5 text-sm hover:text-primary">
          <span><span className="font-medium">Two-step authentication</span><span className="block text-xs text-muted-foreground">{methods.length} method{methods.length === 1 ? "" : "s"} · {passkeys.length} passkey{passkeys.length === 1 ? "" : "s"}</span></span><ChevronRight className="h-4 w-4" />
        </Link>
        <Link to="/settings/$slug" params={{ slug: "sessions" }} className="flex items-center justify-between py-3.5 text-sm hover:text-primary">
          <span><span className="font-medium">Active sessions</span><span className="block text-xs text-muted-foreground">{sessions.length} signed-in device{sessions.length === 1 ? "" : "s"}</span></span><ChevronRight className="h-4 w-4" />
        </Link>
      </Section>

      <Section title="Businesses" description="The Griv businesses you're a member of.">
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/40 text-left text-xs font-semibold tracking-[0.08em] text-muted-foreground"><th className="px-4 py-2.5">Name</th><th className="px-4 py-2.5">Your role</th><th className="hidden px-4 py-2.5 sm:table-cell">Account ID</th></tr></thead>
            <tbody><tr><td className="px-4 py-3 font-medium">Nova Retail Ltd.</td><td className="px-4 py-3">{roles.find((r) => r.id === viewer.roleId)?.name}</td><td className="hidden px-4 py-3 font-mono text-xs text-muted-foreground sm:table-cell">acct_1NJ0ECjgnw240DK</td></tr></tbody>
          </table>
        </div>
      </Section>

      <FormDialog open={edit !== null} onOpenChange={(o) => !o && setEdit(null)}
        title={edit === "name" ? "Edit name" : edit === "email" ? "Change email address" : edit === "backup" ? "Backup email" : "Change phone number"}
        description={edit === "email" ? "We'll send a confirmation link to the new address. Your current email keeps working until you confirm." : edit === "phone" ? "We'll text a 6-digit code to the new number." : undefined}
        footer={<><button className="btn btn-outline h-9 text-sm" onClick={() => setEdit(null)}>Cancel</button><button className="btn btn-primary h-9 text-sm" onClick={submit}>{edit === "email" || edit === "phone" ? "Send confirmation" : "Save"}</button></>}>
        <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-4">
          {edit === "name" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">First name<input autoFocus className={`${INPUT} mt-1.5`} value={value.a} onChange={(e) => setValue({ ...value, a: e.target.value })} /></label>
              <label className="text-sm font-medium">Last name<input className={`${INPUT} mt-1.5`} value={value.b} onChange={(e) => setValue({ ...value, b: e.target.value })} /></label>
            </div>
          ) : (
            <label className="block text-sm font-medium">{edit === "phone" ? "New phone number" : edit === "backup" ? "Backup email (leave empty to remove)" : "New email address"}
              <input autoFocus type={edit === "phone" ? "tel" : "email"} className={`${INPUT} mt-1.5`} value={value.a} onChange={(e) => setValue({ ...value, a: e.target.value })} placeholder={edit === "phone" ? "+234 803 555 0101" : "name@company.com"} />
            </label>
          )}
          {error && <p className="text-xs font-medium text-destructive" role="alert">{error}</p>}
        </form>
      </FormDialog>
    </SettingsPage>
  );
}
