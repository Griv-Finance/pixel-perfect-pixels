import { useMemo, useState } from "react";
import { AlertTriangle, KeyRound, Plus, Puzzle, Terminal, Webhook as WebhookIcon } from "lucide-react";
import { toast } from "sonner";
import {
  ConfirmDialog, CopyButton, DataTable, DetailDrawer, DetailList, EmptyState, FilterSelect, FormDialog, SearchInput, StatusBadge, type Column,
} from "@/components/griv/kit";
import { useLiveMode } from "@/lib/live-mode";
import { DATE_RANGES, fmtDateTime, type DateRange } from "@/lib/dates";
import { getMember, viewerStore } from "@/lib/demo/settings/access";
import { CURRENT_DEVICE, logAudit, logSecurity } from "@/lib/demo/settings/activity";
import {
  API_LOGS, apiKeysStore, createApiKey, envLabel, envOf, failureCount, forEnv, INTEGRATIONS, ipStore, lastDelivery, maskSecret, rotateApiKey,
  SAMPLE_PAYLOAD, useApiKeys, useIpRules, useWebhooks, validateIpOrCidr, validateWebhookUrl, WEBHOOK_EVENTS, webhooksStore, wouldBlock,
  type ApiKey, type ApiLog, type IpRule, type Webhook,
} from "@/lib/demo/settings/developers";
import { Callout, INPUT, InfoDialog, RowMenu, SettingsPage, SettingsTabs, useCanEdit } from "../ui";
import { withinRange } from "./Monitoring";
import { cn } from "@/lib/utils";

/** Banner reminding which environment the page shows. Switching uses the header's Test/Live control — no second switch here. */
function EnvNote({ what }: { what: string }) {
  const live = useLiveMode();
  return (
    <div className={cn("mb-4 flex flex-wrap items-center gap-2 rounded-lg border px-4 py-2.5 text-sm", live ? "border-border" : "border-highlight bg-highlight/40")}>
      <StatusBadge status={live ? "Live" : "Test"} tone={live ? "success" : "pending"} />
      <span>Showing {live ? "Live" : "Test"} {what} only. Use the Test/Live switch at the top to see the other environment.</span>
    </div>
  );
}

/* ---------- API keys ---------- */
export function ApiKeysPage() {
  const env = envOf(useLiveMode());
  const keys = forEnv(useApiKeys(), env);
  const canEdit = useCanEdit();
  const [create, setCreate] = useState<null | { label: string; tried: boolean }>(null);
  const [secret, setSecret] = useState<null | { label: string; value: string }>(null);
  const [rename, setRename] = useState<null | { key: ApiKey; label: string }>(null);
  const [confirm, setConfirm] = useState<null | { kind: "rotate" | "revoke"; key: ApiKey }>(null);
  const [reveal, setReveal] = useState(false);
  const [status, setStatus] = useState("Active");
  const rows = keys.filter((k) => status === "All" || k.status === status);

  const doCreate = () => {
    if (!create) return;
    if (!create.label.trim()) return setCreate({ ...create, tried: true });
    const { key, secret: s } = createApiKey(env, create.label);
    logAudit("API configuration updated", "API keys", key.label, { after: { Environment: envLabel(env), Action: "Key created" } });
    logSecurity("API key created", "API", `${envLabel(env)} secret key “${key.label}” created.`);
    setCreate(null); setSecret({ label: key.label, value: s });
  };

  const cols: Column<ApiKey>[] = [
    { key: "label", header: "Label", cell: (k) => <span className="font-medium">{k.label}</span> },
    { key: "pk", header: "Public key", cell: (k) => <span className="flex items-center gap-1.5 font-mono text-xs">{k.publicKey.slice(0, 18)}…<CopyButton value={k.publicKey} iconOnly label="Copy public key" /></span> },
    { key: "sk", header: "Secret key", cell: (k) => <span className="font-mono text-xs text-muted-foreground">{maskSecret(k)}</span>, hideBelow: "md" },
    { key: "created", header: "Created", cell: (k) => <span className="text-muted-foreground">{fmtDateTime(k.createdAt)}</span>, sort: (k) => k.createdAt, hideBelow: "lg" },
    { key: "used", header: "Last used", cell: (k) => <span className="text-muted-foreground">{k.lastUsed ? fmtDateTime(k.lastUsed) : "Never"}</span>, hideBelow: "lg" },
    { key: "status", header: "Status", cell: (k) => <StatusBadge status={k.status} tone={k.status === "Active" ? "success" : "danger"} /> },
  ];

  return (
    <SettingsPage slug="api-keys" wide actions={<button className="btn btn-primary h-9 text-sm" onClick={() => setCreate({ label: "", tried: false })}><Plus className="h-4 w-4" />Create {envLabel(env).toLowerCase()} key</button>}>
      <EnvNote what="API keys" />
      <div className="mb-3 flex items-center gap-2"><FilterSelect label="Status" value={status} onChange={setStatus} options={["All", "Active", "Revoked"]} /></div>
      <div className="panel overflow-hidden">
        <DataTable columns={cols} rows={rows} rowKey={(k) => k.id} headerTone="plain"
          rowActions={(k) => <RowMenu items={[
            { label: "Copy public key", onSelect: () => { void navigator.clipboard?.writeText(k.publicKey).then(() => toast.success("Public key copied"), () => toast.error("Couldn't copy")); } },
            { label: "Reveal secret key", onSelect: () => setReveal(true) },
            { label: "Rename", disabled: !canEdit, onSelect: () => setRename({ key: k, label: k.label }) },
            { label: "Rotate secret", disabled: !canEdit ? true : k.status !== "Active" ? "Revoked keys can't be rotated" : false, onSelect: () => setConfirm({ kind: "rotate", key: k }) },
            { label: "Revoke key", danger: true, separatorBefore: true, disabled: !canEdit ? true : k.status !== "Active" ? "Already revoked" : false, onSelect: () => setConfirm({ kind: "revoke", key: k }) },
          ]} />}
          empty={<EmptyState icon={KeyRound} title={`No ${envLabel(env).toLowerCase()} API keys`} description="Create a key to connect your server to Griv." action={canEdit ? <button className="btn btn-primary h-9 text-sm" onClick={() => setCreate({ label: "", tried: false })}>Create key</button> : undefined} />} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Public keys are safe in your website or app. Secret keys must only live on your server. Demo keys don't work against a real API.</p>

      <FormDialog open={!!create} onOpenChange={(o) => !o && setCreate(null)} title={`Create ${envLabel(env).toLowerCase()} API key`} description="Give it a name that says where it's used."
        footer={<><button className="btn btn-outline h-9 text-sm" onClick={() => setCreate(null)}>Cancel</button><button className="btn btn-primary h-9 text-sm" onClick={doCreate}>Create key</button></>}>
        {create && <label className="block text-sm font-medium">Label<input autoFocus className={cn(INPUT, "mt-1.5", create.tried && !create.label.trim() && "border-destructive")} value={create.label} onChange={(e) => setCreate({ ...create, label: e.target.value })} placeholder="e.g. Storefront server" onKeyDown={(e) => e.key === "Enter" && doCreate()} />
          {create.tried && !create.label.trim() && <span className="mt-1 block text-xs text-destructive">Enter a label.</span>}</label>}
      </FormDialog>
      <FormDialog open={!!secret} onOpenChange={(o) => !o && setSecret(null)} title="Copy your secret key now" description="This is the only time it's shown. Store it in your server's secret manager — Griv keeps only the last 4 characters."
        footer={<button className="btn btn-primary h-9 text-sm" onClick={() => setSecret(null)}>I've saved it</button>}>
        {secret && <div className="space-y-3">
          <p className="text-sm font-medium">{secret.label}</p>
          <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2"><code className="min-w-0 flex-1 break-all text-xs">{secret.value}</code><CopyButton value={secret.value} iconOnly label="Copy secret key" /></div>
          <Callout tone="warning">Never put secret keys in a website, mobile app or public code. If one leaks, rotate it straight away.</Callout>
        </div>}
      </FormDialog>
      <FormDialog open={!!rename} onOpenChange={(o) => !o && setRename(null)} title="Rename key"
        footer={<><button className="btn btn-outline h-9 text-sm" onClick={() => setRename(null)}>Cancel</button><button className="btn btn-primary h-9 text-sm" onClick={() => {
          if (!rename || !rename.label.trim()) return;
          apiKeysStore.set((all) => all.map((k) => (k.id === rename.key.id ? { ...k, label: rename.label.trim() } : k)));
          logAudit("API configuration updated", "API keys", rename.label.trim(), { before: { Label: rename.key.label }, after: { Label: rename.label.trim() } }); toast.success("Key renamed"); setRename(null);
        }}>Save</button></>}>
        {rename && <input autoFocus aria-label="Label" className={INPUT} value={rename.label} onChange={(e) => setRename({ ...rename, label: e.target.value })} />}
      </FormDialog>
      <ConfirmDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)} danger confirmLabel={confirm?.kind === "rotate" ? "Rotate secret" : "Revoke key"}
        title={confirm?.kind === "rotate" ? `Rotate “${confirm.key.label}”?` : `Revoke “${confirm?.key.label}”?`}
        description={confirm?.kind === "rotate" ? "The current secret stops working immediately and a new one is shown once. Update your server right after." : "Any app using this key will stop working immediately. This can't be undone."}
        onConfirm={() => {
          if (!confirm) return;
          const k = confirm.key;
          if (confirm.kind === "rotate") {
            const s = rotateApiKey(k.id);
            if (s) { logAudit("API configuration updated", "API keys", k.label, { after: { Action: "Secret rotated" } }); logSecurity("API key rotated", "API", `${envLabel(k.env)} key “${k.label}” rotated.`); setSecret({ label: k.label, value: s }); }
          } else {
            apiKeysStore.set((all) => all.map((x) => (x.id === k.id ? { ...x, status: "Revoked" } : x)));
            logAudit("API configuration updated", "API keys", k.label, { after: { Action: "Key revoked" } }); logSecurity("API key revoked", "API", `${envLabel(k.env)} key “${k.label}” revoked.`);
            toast.success("Key revoked");
          }
          setConfirm(null);
        }} />
      <InfoDialog open={reveal} onOpenChange={setReveal} title="Secret keys can't be shown again">
        <p>For your security, Griv never stores secret keys in a readable form, so they can't be revealed after creation.</p><p>If you've lost a secret, rotate the key to get a new one.</p>
      </InfoDialog>
    </SettingsPage>
  );
}

/* ---------- Webhooks ---------- */
type WhDraft = { id?: string; url: string; description: string; events: string[]; tried: boolean };
export function WebhooksPage() {
  const env = envOf(useLiveMode());
  const hooks = forEnv(useWebhooks(), env);
  const canEdit = useCanEdit();
  const [draft, setDraft] = useState<WhDraft | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "events" | "deliveries" | "settings">("overview");
  const [secret, setSecret] = useState<string | null>(null);
  const [del, setDel] = useState<Webhook | null>(null);
  const [payload, setPayload] = useState<string | null>(null);
  const open = hooks.find((h) => h.id === openId) ?? null;

  const save = () => {
    if (!draft) return;
    const urlErr = validateWebhookUrl(draft.url, env);
    if (urlErr || !draft.events.length) return setDraft({ ...draft, tried: true });
    if (draft.id) {
      const before = hooks.find((h) => h.id === draft.id)!;
      webhooksStore.set((all) => all.map((h) => (h.id === draft.id ? { ...h, url: draft.url.trim(), description: draft.description, events: draft.events } : h)));
      logAudit("Webhook configuration updated", "Webhooks", draft.url.trim(), { before: { Events: `${before.events.length} events`, URL: before.url }, after: { Events: `${draft.events.length} events`, URL: draft.url.trim() } });
      toast.success("Endpoint updated");
    } else {
      const s = `whsec_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
      webhooksStore.set((all) => [...all, { id: `wh_${Date.now().toString(36)}`, env, url: draft.url.trim(), description: draft.description, events: draft.events, enabled: true, secretLast4: s.slice(-4), createdAt: new Date().toISOString(), deliveries: [] }]);
      logAudit("Webhook configuration updated", "Webhooks", draft.url.trim(), { after: { Environment: envLabel(env), Events: `${draft.events.length} events`, Action: "Endpoint added" } });
      setSecret(s);
    }
    setDraft(null);
  };

  const cols: Column<Webhook>[] = [
    { key: "url", header: "Endpoint URL", cell: (h) => <span className="block max-w-xs truncate font-mono text-xs">{h.url}<span className="block font-sans text-xs text-muted-foreground">{h.description}</span></span> },
    { key: "env", header: "Environment", cell: (h) => envLabel(h.env), hideBelow: "lg" },
    { key: "events", header: "Events", cell: (h) => `${h.events.length} event${h.events.length === 1 ? "" : "s"}`, hideBelow: "md" },
    { key: "status", header: "Status", cell: (h) => <StatusBadge status={h.enabled ? "Enabled" : "Disabled"} tone={h.enabled ? "success" : "neutral"} /> },
    { key: "last", header: "Last delivery", cell: (h) => { const d = lastDelivery(h); return d ? <span className="text-muted-foreground">{fmtDateTime(d.at)}</span> : "—"; }, hideBelow: "lg" },
    { key: "fail", header: "Failures", align: "right", cell: (h) => <span className={cn("tnum", failureCount(h) > 0 && "font-semibold text-destructive")}>{failureCount(h)}</span> },
  ];
  const setEnabled = (h: Webhook, v: boolean) => { webhooksStore.set((all) => all.map((x) => (x.id === h.id ? { ...x, enabled: v } : x))); logAudit("Webhook configuration updated", "Webhooks", h.url, { before: { Status: h.enabled ? "Enabled" : "Disabled" }, after: { Status: v ? "Enabled" : "Disabled" } }); toast.success(v ? "Endpoint enabled" : "Endpoint disabled"); };
  const rotate = (h: Webhook) => { const s = `whsec_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`; webhooksStore.set((all) => all.map((x) => (x.id === h.id ? { ...x, secretLast4: s.slice(-4) } : x))); logAudit("Webhook configuration updated", "Webhooks", h.url, { after: { Action: "Signing secret rotated" } }); setSecret(s); };

  return (
    <SettingsPage slug="webhooks" wide actions={<button className="btn btn-primary h-9 text-sm" onClick={() => setDraft({ url: "", description: "", events: ["charge.success"], tried: false })}><Plus className="h-4 w-4" />Add endpoint</button>}>
      <EnvNote what="webhook endpoints" />
      <div className="panel overflow-hidden">
        <DataTable columns={cols} rows={hooks} rowKey={(h) => h.id} headerTone="plain" onRowClick={(h) => { setOpenId(h.id); setTab("overview"); }}
          rowActions={(h) => <RowMenu items={[
            { label: "View deliveries", onSelect: () => { setOpenId(h.id); setTab("deliveries"); } },
            { label: "Edit endpoint", disabled: !canEdit, onSelect: () => setDraft({ id: h.id, url: h.url, description: h.description, events: h.events, tried: false }) },
            { label: h.enabled ? "Disable endpoint" : "Enable endpoint", disabled: !canEdit, onSelect: () => setEnabled(h, !h.enabled) },
            { label: "Rotate signing secret", disabled: !canEdit, onSelect: () => rotate(h) },
            { label: "Delete endpoint", danger: true, separatorBefore: true, disabled: !canEdit, onSelect: () => setDel(h) },
          ]} />}
          empty={<EmptyState icon={WebhookIcon} title="Connect Griv to your applications." description="Create a webhook endpoint to receive real-time updates." action={canEdit ? <button className="btn btn-primary h-9 text-sm" onClick={() => setDraft({ url: "", description: "", events: ["charge.success"], tried: false })}>Add endpoint</button> : undefined} />} />
      </div>

      <FormDialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)} size="lg" title={draft?.id ? "Edit endpoint" : `Add ${envLabel(env).toLowerCase()} endpoint`} description="Griv sends a signed POST request to this URL when the events you pick happen."
        footer={<><button className="btn btn-outline h-9 text-sm" onClick={() => setDraft(null)}>Cancel</button><button className="btn btn-primary h-9 text-sm" onClick={save}>{draft?.id ? "Save" : "Add endpoint"}</button></>}>
        {draft && <div className="space-y-4">
          <label className="block text-sm font-medium">Endpoint URL<input autoFocus className={cn(INPUT, "mt-1.5 font-mono", draft.tried && validateWebhookUrl(draft.url, env) && "border-destructive")} placeholder="https://example.com/webhooks/griv" value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} />
            {draft.tried && validateWebhookUrl(draft.url, env) && <span className="mt-1 block text-xs text-destructive">{validateWebhookUrl(draft.url, env)}</span>}</label>
          <label className="block text-sm font-medium">Description <span className="font-normal text-muted-foreground">(optional)</span><input className={`${INPUT} mt-1.5`} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label>
          <div>
            <div className="mb-2 flex items-center justify-between"><p className="text-sm font-medium">Events ({draft.events.length})</p>
              <button className="text-xs font-semibold text-primary hover:underline" onClick={() => setDraft({ ...draft, events: draft.events.length === WEBHOOK_EVENTS.length ? [] : [...WEBHOOK_EVENTS] })}>{draft.events.length === WEBHOOK_EVENTS.length ? "Clear all" : "Select all"}</button></div>
            <div className="grid max-h-56 gap-1 overflow-y-auto rounded-lg border p-2 sm:grid-cols-2">{WEBHOOK_EVENTS.map((ev) => (
              <label key={ev} className="flex items-center gap-2 rounded px-2 py-1 font-mono text-xs hover:bg-muted"><input type="checkbox" className="h-3.5 w-3.5 accent-primary" checked={draft.events.includes(ev)} onChange={() => setDraft({ ...draft, events: draft.events.includes(ev) ? draft.events.filter((x) => x !== ev) : [...draft.events, ev] })} />{ev}</label>
            ))}</div>
            {draft.tried && !draft.events.length && <p className="mt-1 text-xs text-destructive">Pick at least one event.</p>}
          </div>
        </div>}
      </FormDialog>

      <DetailDrawer wide open={!!open} onOpenChange={(o) => !o && setOpenId(null)} title={<span className="break-all font-mono text-base">{open?.url}</span>} subtitle={open?.description}
        badge={open && <StatusBadge status={open.enabled ? "Enabled" : "Disabled"} tone={open.enabled ? "success" : "neutral"} />}>
        {open && <>
          <SettingsTabs className="mb-0" value={tab} onChange={setTab} tabs={[{ id: "overview", label: "Overview" }, { id: "events", label: "Events" }, { id: "deliveries", label: "Deliveries", count: open.deliveries.length }, { id: "settings", label: "Settings" }]} />
          {tab === "overview" && <DetailList items={[["Environment", envLabel(open.env)], ["Subscribed events", `${open.events.length}`], ["Signing secret", <span className="font-mono text-xs">whsec_••••••••{open.secretLast4}</span>], ["Last delivery", lastDelivery(open) ? fmtDateTime(lastDelivery(open)!.at) : "None yet"], ["Failed deliveries", `${failureCount(open)}`], ["Created", fmtDateTime(open.createdAt)]]} />}
          {tab === "events" && <div className="space-y-1">{open.events.map((ev) => (
            <div key={ev} className="flex items-center justify-between rounded-md border px-3 py-2"><code className="text-xs">{ev}</code><button className="text-xs font-semibold text-primary hover:underline" onClick={() => setPayload(ev)}>Preview payload</button></div>
          ))}</div>}
          {tab === "deliveries" && (open.deliveries.length ? <div className="overflow-x-auto rounded-lg border"><table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/40 text-left text-xs font-semibold text-muted-foreground"><th className="px-3 py-2">Event</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Response</th><th className="px-3 py-2">Time</th><th /></tr></thead>
            <tbody className="divide-y">{[...open.deliveries].sort((a, b) => b.at.localeCompare(a.at)).map((d) => (
              <tr key={d.id}><td className="px-3 py-2 font-mono text-xs">{d.event}</td><td className="px-3 py-2"><StatusBadge status={d.status} tone={d.status === "Succeeded" ? "success" : d.status === "Failed" ? "danger" : "pending"} /></td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{d.code ?? "—"}{d.durationMs ? ` · ${d.durationMs} ms` : ""}{d.attempts > 1 ? ` · ${d.attempts} tries` : ""}</td><td className="px-3 py-2 text-xs text-muted-foreground">{fmtDateTime(d.at)}</td>
                <td className="px-3 py-2 text-right">{d.status === "Failed" && canEdit && <button className="text-xs font-semibold text-primary hover:underline" onClick={() => {
                  webhooksStore.set((all) => all.map((h) => (h.id === open.id ? { ...h, deliveries: h.deliveries.map((x) => (x.id === d.id ? { ...x, status: "Pending", code: null, durationMs: null } : x)) } : h)));
                  toast.message("Retry queued", { description: "No delivery server runs in this demo, so it stays pending." });
                }}>Retry</button>}</td></tr>
            ))}</tbody></table></div> : <EmptyState icon={WebhookIcon} title="No deliveries yet" description="Deliveries appear here once a subscribed event happens." />)}
          {tab === "settings" && canEdit && <div className="space-y-3">
            <button className="btn btn-outline h-9 w-full justify-start text-sm" onClick={() => setDraft({ id: open.id, url: open.url, description: open.description, events: open.events, tried: false })}>Edit URL and events</button>
            <button className="btn btn-outline h-9 w-full justify-start text-sm" onClick={() => setEnabled(open, !open.enabled)}>{open.enabled ? "Disable endpoint" : "Enable endpoint"}</button>
            <button className="btn btn-outline h-9 w-full justify-start text-sm" onClick={() => rotate(open)}>Rotate signing secret</button>
            <button className="btn btn-outline h-9 w-full justify-start text-sm text-destructive" onClick={() => setDel(open)}>Delete endpoint</button>
          </div>}
          {tab === "settings" && !canEdit && <p className="text-sm text-muted-foreground">Your role can view endpoints but not change them.</p>}
        </>}
      </DetailDrawer>
      <FormDialog open={!!secret} onOpenChange={(o) => !o && setSecret(null)} title="Copy your signing secret" description="Use it to check that webhook requests really come from Griv. It's shown only once."
        footer={<button className="btn btn-primary h-9 text-sm" onClick={() => setSecret(null)}>I've saved it</button>}>
        {secret && <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2"><code className="min-w-0 flex-1 break-all text-xs">{secret}</code><CopyButton value={secret} iconOnly label="Copy signing secret" /></div>}
      </FormDialog>
      <FormDialog open={!!payload} onOpenChange={(o) => !o && setPayload(null)} title={payload ?? ""} description="Example body. Customer details are masked." footer={<button className="btn btn-primary h-9 text-sm" onClick={() => setPayload(null)}>Close</button>}>
        {payload && <pre className="overflow-x-auto rounded-lg bg-blackwood p-4 text-xs text-blackwood-foreground">{SAMPLE_PAYLOAD(payload)}</pre>}
      </FormDialog>
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} danger confirmLabel="Delete endpoint" title="Delete this endpoint?" description="Griv stops sending events to it straight away."
        onConfirm={() => { if (!del) return; webhooksStore.set((all) => all.filter((h) => h.id !== del.id)); logAudit("Webhook configuration updated", "Webhooks", del.url, { after: { Action: "Endpoint deleted" } }); toast.success("Endpoint deleted"); setDel(null); setOpenId(null); }} />
    </SettingsPage>
  );
}

/* ---------- IP whitelist ---------- */
export function IpWhitelistPage() {
  const env = envOf(useLiveMode());
  const rules = forEnv(useIpRules(), env);
  const canEdit = useCanEdit();
  const [draft, setDraft] = useState<null | { id?: string; value: string; label: string; tried: boolean }>(null);
  const [remove, setRemove] = useState<IpRule | null>(null);
  const blocked = wouldBlock(CURRENT_DEVICE.ip, rules);
  const me = getMember(viewerStore.get())?.name ?? "You";

  const preview = (next: IpRule[]) => wouldBlock(CURRENT_DEVICE.ip, next);
  const draftRules = draft ? (draft.id ? rules.map((r) => (r.id === draft.id ? { ...r, value: draft.value.trim() } : r)) : [...rules, { id: "new", env, value: draft.value.trim(), label: "", addedAt: "", addedBy: "", status: "Active" as const }]) : rules;
  const draftErr = draft && !draft.id ? validateIpOrCidr(draft.value) : null;
  const dup = draft && !draft.id && rules.some((r) => r.value === draft.value.trim());

  const cols: Column<IpRule>[] = [
    { key: "value", header: "IP address or range", cell: (r) => <span className="font-mono text-xs">{r.value}</span> },
    { key: "label", header: "Label", cell: (r) => r.label || "—" },
    { key: "added", header: "Date added", cell: (r) => <span className="text-muted-foreground">{fmtDateTime(r.addedAt)}</span>, hideBelow: "md" },
    { key: "by", header: "Added by", cell: (r) => r.addedBy, hideBelow: "lg" },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} tone={r.status === "Active" ? "success" : "neutral"} /> },
  ];
  return (
    <SettingsPage slug="ip-whitelist" actions={<button className="btn btn-primary h-9 text-sm" onClick={() => setDraft({ value: "", label: "", tried: false })}><Plus className="h-4 w-4" />Add IP</button>}>
      <EnvNote what="IP rules" />
      <p className="mb-4 text-sm text-muted-foreground">When the list has active entries, {envLabel(env)} API requests made with secret keys are only accepted from these addresses. The dashboard itself isn't affected. Leave it empty to allow every address.</p>
      {blocked && <div className="mb-4"><Callout tone="danger">Your current IP ({CURRENT_DEVICE.ip}) isn't on the list, so API calls from here would be blocked.</Callout></div>}
      <div className="panel overflow-hidden">
        <DataTable columns={cols} rows={rules} rowKey={(r) => r.id} headerTone="plain"
          rowActions={(r) => canEdit ? <RowMenu items={[
            { label: "Edit label", onSelect: () => setDraft({ id: r.id, value: r.value, label: r.label, tried: false }) },
            { label: r.status === "Active" ? "Disable" : "Enable", onSelect: () => { ipStore.set((all) => all.map((x) => (x.id === r.id ? { ...x, status: x.status === "Active" ? "Disabled" : "Active" } : x))); logAudit("API configuration updated", "IP whitelist", r.value, { after: { Status: r.status === "Active" ? "Disabled" : "Active" } }); } },
            { label: "Remove IP", danger: true, separatorBefore: true, onSelect: () => setRemove(r) },
          ]} /> : null}
          empty={<EmptyState title="No IP restrictions" description={`${envLabel(env)} API requests are accepted from any address. Add your servers' IPs to lock this down.`} />} />
      </div>
      <FormDialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)} title={draft?.id ? "Edit label" : "Add IP address"} description={draft?.id ? undefined : "A single address (IPv4 or IPv6) or a CIDR range like 34.89.120.0/24."}
        footer={<><button className="btn btn-outline h-9 text-sm" onClick={() => setDraft(null)}>Cancel</button><button className="btn btn-primary h-9 text-sm" onClick={() => {
          if (!draft) return;
          if (draft.id) { ipStore.set((all) => all.map((r) => (r.id === draft.id ? { ...r, label: draft.label.trim() } : r))); logAudit("API configuration updated", "IP whitelist", draft.value, { after: { Label: draft.label.trim() } }); toast.success("Label updated"); setDraft(null); return; }
          if (draftErr || dup) return setDraft({ ...draft, tried: true });
          ipStore.set((all) => [...all, { id: `ip_${Date.now().toString(36)}`, env, value: draft.value.trim(), label: draft.label.trim(), addedAt: new Date().toISOString(), addedBy: me, status: "Active" }]);
          logAudit("API configuration updated", "IP whitelist", draft.value.trim(), { after: { Environment: envLabel(env), Action: "IP added" } }); logSecurity("IP whitelist changed", "API", `${draft.value.trim()} added (${envLabel(env)}).`);
          toast.success("IP added"); setDraft(null);
        }}>{draft?.id ? "Save" : "Add IP"}</button></>}>
        {draft && <div className="space-y-4">
          {!draft.id && <label className="block text-sm font-medium">IP address or CIDR<input autoFocus className={cn(INPUT, "mt-1.5 font-mono", draft.tried && (draftErr || dup) && "border-destructive")} value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })} placeholder="105.112.216.228" />
            {draft.tried && (draftErr || dup) && <span className="mt-1 block text-xs text-destructive">{draftErr ?? "That address is already on the list."}</span>}</label>}
          <label className="block text-sm font-medium">Label<input autoFocus={!!draft.id} className={`${INPUT} mt-1.5`} value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} placeholder="e.g. Production servers" /></label>
          {!draft.id && !draftErr && preview(draftRules) && <Callout tone="warning"><span className="flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" />Your current IP ({CURRENT_DEVICE.ip}) still wouldn't be allowed.</span></Callout>}
        </div>}
      </FormDialog>
      <ConfirmDialog open={!!remove} onOpenChange={(o) => !o && setRemove(null)} danger confirmLabel="Remove IP" title={`Remove ${remove?.value}?`}
        description={remove && preview(rules.filter((r) => r.id !== remove.id)) ? `Careful: afterwards API calls from your current IP (${CURRENT_DEVICE.ip}) would be blocked.` : "Requests from this address will be rejected if other entries remain active."}
        onConfirm={() => { if (!remove) return; ipStore.set((all) => all.filter((r) => r.id !== remove.id)); logAudit("API configuration updated", "IP whitelist", remove.value, { after: { Action: "IP removed" } }); logSecurity("IP whitelist changed", "API", `${remove.value} removed.`); toast.success("IP removed"); setRemove(null); }} />
    </SettingsPage>
  );
}

/* ---------- Integrations ---------- */
export function IntegrationsPage() {
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const rows = INTEGRATIONS.filter((i) => (cat === "All" || i.category === cat) && (!q || `${i.name} ${i.description}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <SettingsPage slug="integrations" wide>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Search integrations" />
        <FilterSelect label="Category" value={cat} onChange={setCat} options={["All", ...new Set(INTEGRATIONS.map((i) => i.category))]} />
      </div>
      <p className="mb-3 text-sm text-muted-foreground"><span className="font-semibold text-foreground">0</span> connected · {INTEGRATIONS.length} available</p>
      {rows.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{rows.map((i) => (
        <div key={i.id} className="flex flex-col rounded-xl border p-4">
          <div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-sm font-bold">{i.name[0]}</span>
            <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{i.name}</p><p className="text-xs text-muted-foreground">{i.category}</p></div><StatusBadge status="Not connected" tone="neutral" /></div>
          <p className="mt-3 flex-1 text-sm text-muted-foreground">{i.description}</p>
          <button className="btn btn-outline mt-4 h-8 self-start px-3 text-xs" onClick={() => setInfo(i.name)}>Connect</button>
        </div>
      ))}</div> : <EmptyState icon={Puzzle} title="No integrations match" description="Try another search or category." />}
      <InfoDialog open={!!info} onOpenChange={(o) => !o && setInfo(null)} title={`Connect ${info}`}>
        <p>Connecting {info} needs you to sign in to your {info} account and approve access. That connection isn't available in this demo, so nothing was connected.</p>
        <p>Connected services will show here with Configure and Disconnect options.</p>
      </InfoDialog>
    </SettingsPage>
  );
}

/* ---------- API logs ---------- */
const statusClass = (s: number) => (s < 300 ? "bg-success/20 text-success-foreground" : s < 500 ? "bg-warning/20 text-warning-foreground" : "bg-destructive/10 text-destructive");
export function ApiLogsPage() {
  const env = envOf(useLiveMode());
  const [range, setRange] = useState<DateRange>("Last 7 days");
  const [status, setStatus] = useState("All");
  const [method, setMethod] = useState("All");
  const [endpoint, setEndpoint] = useState("");
  const [sel, setSel] = useState<ApiLog | null>(null);
  const logs = useMemo(() => forEnv(API_LOGS, env).filter((l) =>
    withinRange(l.at, range) && (method === "All" || l.method === method) && (!endpoint || l.endpoint.includes(endpoint.trim())) &&
    (status === "All" || (status === "Succeeded (2xx)" ? l.status < 300 : status === "Client errors (4xx)" ? l.status >= 400 && l.status < 500 : l.status >= 500)),
  ), [env, range, status, method, endpoint]);
  const cols: Column<ApiLog>[] = [
    { key: "at", header: "Timestamp", cell: (l) => <span className="text-muted-foreground">{fmtDateTime(l.at)}</span>, sort: (l) => l.at },
    { key: "method", header: "Method", cell: (l) => <span className="font-mono text-xs font-semibold">{l.method}</span> },
    { key: "endpoint", header: "Endpoint", cell: (l) => <span className="font-mono text-xs">{l.endpoint}</span> },
    { key: "status", header: "Status", cell: (l) => <span className={cn("rounded px-1.5 py-0.5 font-mono text-xs font-semibold", statusClass(l.status))}>{l.status}</span> },
    { key: "env", header: "Environment", cell: (l) => envLabel(l.env), hideBelow: "lg" },
    { key: "id", header: "Request ID", cell: (l) => <span className="font-mono text-xs text-muted-foreground">{l.id}</span>, hideBelow: "md" },
    { key: "dur", header: "Duration", align: "right", cell: (l) => `${l.durationMs} ms`, sort: (l) => l.durationMs, hideBelow: "md" },
  ];
  return (
    <SettingsPage slug="api-logs" wide>
      <EnvNote what="API requests" />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <FilterSelect label="Date" value={range} onChange={(v) => setRange(v as DateRange)} options={DATE_RANGES} />
        <FilterSelect label="Status" value={status} onChange={setStatus} options={["All", "Succeeded (2xx)", "Client errors (4xx)", "Server errors (5xx)"]} />
        <FilterSelect label="Method" value={method} onChange={setMethod} options={["All", "GET", "POST", "PUT", "DELETE"]} />
        <input className="field h-9 w-48 font-mono text-sm" placeholder="/v1/charges" aria-label="Filter by endpoint" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} />
      </div>
      <div className="panel overflow-hidden">
        <DataTable columns={cols} rows={logs} rowKey={(l) => l.id} onRowClick={setSel} headerTone="plain" pageSize={15} initialSort={{ key: "at", dir: "desc" }}
          empty={<EmptyState icon={Terminal} title="No requests match your filters" description="Try a longer date range or clear the filters." />} />
      </div>
      <DetailDrawer wide open={!!sel} onOpenChange={(o) => !o && setSel(null)} title={sel ? `${sel.method} ${sel.endpoint}` : ""} subtitle={sel?.id}
        badge={sel && <span className={cn("rounded px-1.5 py-0.5 font-mono text-xs font-semibold", statusClass(sel.status))}>{sel.status}</span>}>
        {sel && <>
          <DetailList items={[["Time", fmtDateTime(sel.at)], ["Environment", envLabel(sel.env)], ["Duration", `${sel.durationMs} ms`], ["Source IP", <span className="font-mono text-xs">{sel.ip}</span>], ["API key", sel.keyLabel], ["Authorization", <span className="font-mono text-xs text-muted-foreground">[redacted]</span>]]} />
          {sel.error && <Callout tone="danger">{sel.error}</Callout>}
          {sel.requestBody && <div><p className="mb-1.5 text-sm font-semibold">Request body</p><pre className="overflow-x-auto rounded-lg bg-blackwood p-3 text-xs text-blackwood-foreground">{sel.requestBody}</pre></div>}
          <div><p className="mb-1.5 text-sm font-semibold">Response body</p><pre className="overflow-x-auto rounded-lg bg-blackwood p-3 text-xs text-blackwood-foreground">{sel.responseBody}</pre></div>
          <p className="text-xs text-muted-foreground">Secrets, authorization headers and personal details are never stored in logs.</p>
        </>}
      </DetailDrawer>
    </SettingsPage>
  );
}
