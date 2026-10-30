import { useMemo, useState } from "react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { AppWindow, Download, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import {
  ConfirmDialog, DataTable, DetailDrawer, DetailList, EmptyState, FilterSelect, FormDialog, SearchInput, StatusBadge, type Column,
} from "@/components/griv/kit";
import { exportCsv } from "@/lib/csv";
import { DATE_RANGES, DEMO_TODAY, fmtDateTime, type DateRange } from "@/lib/dates";
import { createDemoStore } from "@/lib/demo-store";
import { daysAgo } from "@/lib/dates";
import {
  getMember, reviewAccessRequest, useAccessRequests, useCan, useMembers, useViewerId, type AccessRequest,
} from "@/lib/demo/settings/access";
import { logAudit, logSecurity, useAuditEvents, useSecurityEvents, type AuditEvent, type SecurityEvent } from "@/lib/demo/settings/activity";
import { Avatar, Callout, SettingsPage, TEXTAREA, useCanEdit } from "../ui";

const DAYS: Record<DateRange, number> = { Today: 0, "Last 7 days": 6, "Last 30 days": 29, "Last 90 days": 89, "All time": Infinity };
/** Date filter that also counts records created "now" in the demo (after the sample data's fixed today). */
export const withinRange = (iso: string, range: DateRange) => Math.max(0, differenceInCalendarDays(DEMO_TODAY, parseISO(iso))) <= DAYS[range];

const uniq = (xs: string[]) => ["All", ...[...new Set(xs)].sort()];
const outcomeTone = (o: string) => (o === "Success" ? "success" : o === "Failed" || o === "Blocked" ? "danger" : "pending") as "success" | "danger" | "pending";

/* ---------- Security history ---------- */
export function SecurityHistoryPanel() {
  const events = useSecurityEvents();
  const [q, setQ] = useState("");
  const [range, setRange] = useState<DateRange>("All time");
  const [category, setCategory] = useState("All");
  const [user, setUser] = useState("All");
  const [device, setDevice] = useState("All");
  const [ip, setIp] = useState("");
  const [selected, setSelected] = useState<SecurityEvent | null>(null);
  const canExport = useCan("team.view");

  const rows = useMemo(() => events.filter((e) =>
    withinRange(e.at, range) && (category === "All" || e.category === category) && (user === "All" || e.user === user) &&
    (device === "All" || e.device === device) && (!ip || e.ip.includes(ip.trim())) && (!q || e.action.toLowerCase().includes(q.toLowerCase())),
  ), [events, range, category, user, device, ip, q]);
  const filtered = range !== "All time" || category !== "All" || user !== "All" || device !== "All" || !!ip || !!q;

  const cols: Column<SecurityEvent>[] = [
    { key: "action", header: "Action", cell: (e) => <span className="font-medium">{e.action}</span> },
    { key: "category", header: "Category", cell: (e) => e.category, hideBelow: "md" },
    { key: "user", header: "User", cell: (e) => <span className="block max-w-48 truncate">{e.user}</span> },
    { key: "device", header: "Device", cell: (e) => e.device, hideBelow: "lg" },
    { key: "ip", header: "IP address", cell: (e) => <span className="font-mono text-xs">{e.ip}</span>, hideBelow: "lg" },
    { key: "location", header: "Location", cell: (e) => e.location, hideBelow: "md" },
    { key: "at", header: "Time", cell: (e) => <span className="text-muted-foreground">{fmtDateTime(e.at)}</span>, sort: (e) => e.at },
  ];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Search actions" className="sm:w-52" />
        <FilterSelect label="Date" value={range} onChange={(v) => setRange(v as DateRange)} options={DATE_RANGES} />
        <FilterSelect label="Category" value={category} onChange={setCategory} options={uniq(events.map((e) => e.category))} />
        <FilterSelect label="User" value={user} onChange={setUser} options={uniq(events.map((e) => e.user))} />
        <FilterSelect label="Device" value={device} onChange={setDevice} options={uniq(events.map((e) => e.device))} />
        <input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="IP address" aria-label="Filter by IP address" className="field h-9 w-36 text-sm" />
        {filtered && <button className="text-sm font-semibold text-primary hover:underline" onClick={() => { setQ(""); setRange("All time"); setCategory("All"); setUser("All"); setDevice("All"); setIp(""); }}>Clear filters</button>}
        <button className="btn btn-outline ml-auto h-9 text-sm" disabled={!rows.length || !canExport} title={canExport ? undefined : "Your role can't export security history"}
          onClick={() => exportCsv("griv-security-history", rows.map((e) => ({ Action: e.action, Category: e.category, User: e.user, Device: e.device, "IP address": e.ip, Location: e.location, Outcome: e.outcome, Time: e.at })))}>
          <Download className="h-4 w-4" />Export
        </button>
      </div>
      <div className="panel overflow-hidden">
        <DataTable columns={cols} rows={rows} rowKey={(e) => e.id} onRowClick={setSelected} pageSize={10} headerTone="plain" initialSort={{ key: "at", dir: "desc" }}
          empty={<EmptyState title="No activity matches your filters" description="Try adjusting the date range or filters." />} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Sign-ins, authentication changes and blocked access for Nova Retail Ltd. Security history is read-only.</p>
      <DetailDrawer open={!!selected} onOpenChange={(o) => !o && setSelected(null)} title={selected?.action ?? ""} subtitle={selected ? fmtDateTime(selected.at) : undefined}
        badge={selected && <StatusBadge status={selected.outcome} tone={outcomeTone(selected.outcome)} />}>
        {selected && <>
          {selected.category === "Suspicious" && <Callout tone="danger">If this wasn't expected, revoke unknown sessions and change the affected user's password.</Callout>}
          <DetailList items={[["Event ID", <span className="font-mono text-xs">{selected.id}</span>], ["Category", selected.category], ["User", selected.user], ["Device", selected.device], ["IP address", <span className="font-mono text-xs">{selected.ip}</span>], ["Approx. location", selected.location], ["Outcome", selected.outcome], ...(selected.details ? [["Details", selected.details] as [string, string]] : [])]} />
        </>}
      </DetailDrawer>
    </div>
  );
}

export function SecurityHistoryPage() {
  return <SettingsPage slug="security-history" wide><SecurityHistoryPanel /></SettingsPage>;
}

/* ---------- Audit logs ---------- */
export function AuditLogsPage() {
  const events = useAuditEvents();
  const [q, setQ] = useState("");
  const [range, setRange] = useState<DateRange>("All time");
  const [resource, setResource] = useState("All");
  const [actor, setActor] = useState("All");
  const [result, setResult] = useState("All");
  const [selected, setSelected] = useState<AuditEvent | null>(null);

  const rows = useMemo(() => events.filter((e) =>
    withinRange(e.at, range) && (resource === "All" || e.resourceType === resource) && (actor === "All" || e.actor === actor) && (result === "All" || e.result === result) &&
    (!q || `${e.action} ${e.resource}`.toLowerCase().includes(q.toLowerCase())),
  ), [events, range, resource, actor, result, q]);
  const filtered = range !== "All time" || resource !== "All" || actor !== "All" || result !== "All" || !!q;

  const cols: Column<AuditEvent>[] = [
    { key: "action", header: "Action", cell: (e) => <span className="font-medium">{e.action}</span> },
    { key: "resource", header: "Resource", cell: (e) => <span className="block max-w-56 truncate">{e.resource}<span className="block text-xs text-muted-foreground">{e.resourceType}</span></span> },
    { key: "actor", header: "Performed by", cell: (e) => <span className="flex items-center gap-2"><Avatar name={e.actor} />{e.actor}</span>, hideBelow: "md" },
    { key: "at", header: "Date and time", cell: (e) => <span className="text-muted-foreground">{fmtDateTime(e.at)}</span>, sort: (e) => e.at },
    { key: "ip", header: "IP address", cell: (e) => <span className="font-mono text-xs">{e.ip}</span>, hideBelow: "lg" },
    { key: "result", header: "Result", cell: (e) => <StatusBadge status={e.result} tone={outcomeTone(e.result)} /> },
  ];

  return (
    <SettingsPage slug="audit-logs" wide>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Search actions or resources" className="sm:w-64" />
        <FilterSelect label="Date" value={range} onChange={(v) => setRange(v as DateRange)} options={DATE_RANGES} />
        <FilterSelect label="Area" value={resource} onChange={setResource} options={uniq(events.map((e) => e.resourceType))} />
        <FilterSelect label="Performed by" value={actor} onChange={setActor} options={uniq(events.map((e) => e.actor))} />
        <FilterSelect label="Result" value={result} onChange={setResult} options={uniq(events.map((e) => e.result))} />
        {filtered && <button className="text-sm font-semibold text-primary hover:underline" onClick={() => { setQ(""); setRange("All time"); setResource("All"); setActor("All"); setResult("All"); }}>Clear filters</button>}
        <button className="btn btn-outline ml-auto h-9 text-sm" disabled={!rows.length}
          onClick={() => exportCsv("griv-audit-log", rows.map((e) => ({ "Event ID": e.id, Action: e.action, Resource: e.resource, Area: e.resourceType, "Performed by": e.actor, Time: e.at, "IP address": e.ip, Result: e.result })))}>
          <Download className="h-4 w-4" />Export
        </button>
      </div>
      <div className="panel overflow-hidden">
        <DataTable columns={cols} rows={rows} rowKey={(e) => e.id} onRowClick={setSelected} pageSize={10} headerTone="plain" initialSort={{ key: "at", dir: "desc" }}
          empty={<EmptyState title="No activity matches your filters" description="Try adjusting the date range or filters." />} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Audit logs are read-only and can't be edited or deleted. Sign-ins and authentication changes are in Security history.</p>
      <DetailDrawer open={!!selected} onOpenChange={(o) => !o && setSelected(null)} title={selected?.action ?? ""} subtitle={selected ? fmtDateTime(selected.at) : undefined}
        badge={selected && <StatusBadge status={selected.result} tone={outcomeTone(selected.result)} />}>
        {selected && <>
          <DetailList items={[["Event ID", <span className="font-mono text-xs">{selected.id}</span>], ["Actor", selected.actor], ["Resource", selected.resource], ["Area", selected.resourceType], ["Timestamp", fmtDateTime(selected.at)], ["IP address", <span className="font-mono text-xs">{selected.ip}</span>]]} />
          {(selected.before || selected.after) && (
            <div>
              <p className="mb-2 text-sm font-semibold">Changes</p>
              <div className="overflow-hidden rounded-lg border text-sm">
                <table className="w-full"><thead><tr className="border-b bg-muted/40 text-left text-xs font-semibold text-muted-foreground"><th className="px-3 py-2">Field</th><th className="px-3 py-2">Before</th><th className="px-3 py-2">After</th></tr></thead>
                  <tbody className="divide-y">{[...new Set([...Object.keys(selected.before ?? {}), ...Object.keys(selected.after ?? {})])].map((k) => (
                    <tr key={k}><td className="px-3 py-2 font-medium">{k}</td><td className="px-3 py-2 text-muted-foreground">{selected.before?.[k] ?? "—"}</td><td className="px-3 py-2">{selected.after?.[k] ?? "—"}</td></tr>
                  ))}</tbody></table>
              </div>
            </div>
          )}
          {selected.refs?.length ? <div><p className="mb-1 text-sm font-semibold">Related references</p><p className="font-mono text-xs">{selected.refs.join(" · ")}</p></div> : null}
        </>}
      </DetailDrawer>
    </SettingsPage>
  );
}

/* ---------- Access requests ---------- */
export function AccessRequestsPanel() {
  const requests = useAccessRequests();
  const members = useMembers();
  const viewer = useViewerId();
  const canReview = useCan("team.manage");
  const [status, setStatus] = useState("Pending");
  const [selected, setSelected] = useState<AccessRequest | null>(null);
  const [reject, setReject] = useState<AccessRequest | null>(null);
  const [note, setNote] = useState("");
  const name = (id: string) => members.find((m) => m.id === id)?.name ?? "Former member";
  const rows = requests.filter((r) => status === "All" || r.status === status);

  const act = (r: AccessRequest, d: "Approved" | "Rejected") => {
    const res = reviewAccessRequest(r.id, d);
    if (res.error) return toast.error(res.error);
    logAudit(d === "Approved" ? "Access request approved" : "Access request rejected", "Access requests", `${name(r.memberId)}: ${r.requested}`, note ? { after: { Note: note } } : {});
    toast.success(d === "Approved" ? `Approved — ${name(r.memberId)} now has ${r.requested}` : "Request rejected");
    setSelected(null); setReject(null); setNote("");
  };

  const cols: Column<AccessRequest>[] = [
    { key: "who", header: "Requested by", cell: (r) => <span className="flex items-center gap-2"><Avatar name={name(r.memberId)} />{name(r.memberId)}</span> },
    { key: "req", header: "Requested access", cell: (r) => <span className="font-medium">{r.requested}</span> },
    { key: "res", header: "Resource", cell: (r) => r.resource, hideBelow: "md" },
    { key: "reason", header: "Reason", cell: (r) => <span className="block max-w-56 truncate text-muted-foreground">{r.reason || "—"}</span>, hideBelow: "lg" },
    { key: "at", header: "Requested", cell: (r) => <span className="text-muted-foreground">{fmtDateTime(r.createdAt)}</span>, sort: (r) => r.createdAt },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} tone={r.status === "Approved" ? "success" : r.status === "Pending" ? "pending" : r.status === "Rejected" ? "danger" : "neutral"} /> },
    { key: "reviewer", header: "Reviewer", cell: (r) => r.reviewer ?? "—", hideBelow: "lg" },
  ];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <FilterSelect label="Status" value={status} onChange={setStatus} options={["All", "Pending", "Approved", "Rejected", "Expired"]} />
        {!canReview && <p className="text-xs text-muted-foreground">You can see requests, but only people who manage the team can approve them.</p>}
      </div>
      <div className="panel overflow-hidden">
        <DataTable columns={cols} rows={rows} rowKey={(r) => r.id} onRowClick={setSelected} headerTone="plain" initialSort={{ key: "at", dir: "desc" }}
          rowActions={(r) => r.status === "Pending" && canReview && r.memberId !== viewer ? (
            <span className="flex justify-end gap-2"><button className="text-sm font-semibold text-primary hover:underline" onClick={() => act(r, "Approved")}>Approve</button><button className="text-sm font-semibold text-destructive hover:underline" onClick={() => setReject(r)}>Reject</button></span>
          ) : null}
          empty={<EmptyState icon={ShieldAlert} title={status === "Pending" ? "No pending requests" : "No requests here"} description="When a teammate asks for more access, it shows up here for review." />} />
      </div>
      <DetailDrawer open={!!selected} onOpenChange={(o) => !o && setSelected(null)} title={selected?.requested ?? ""} subtitle={selected ? `Requested by ${name(selected.memberId)}` : undefined}
        badge={selected && <StatusBadge status={selected.status} tone={selected.status === "Approved" ? "success" : selected.status === "Pending" ? "pending" : selected.status === "Rejected" ? "danger" : "neutral"} />}
        footer={selected?.status === "Pending" && canReview ? (selected.memberId === viewer ? <p className="text-sm text-muted-foreground">You can't review your own request.</p> : <>
          <button className="btn btn-outline h-9 text-sm text-destructive" onClick={() => setReject(selected)}>Reject</button>
          <button className="btn btn-primary h-9 text-sm" onClick={() => act(selected, "Approved")}>Approve</button>
        </>) : undefined}>
        {selected && <>
          <DetailList items={[["Member", `${name(selected.memberId)} (${getMember(selected.memberId)?.email ?? ""})`], ["Requested", selected.requested], ["Resource", selected.resource], ["Reason", selected.reason || "—"], ["Requested on", fmtDateTime(selected.createdAt)]]} />
          <div>
            <p className="mb-2 text-sm font-semibold">History</p>
            <ol className="space-y-2 border-l pl-4 text-sm">
              <li><span className="font-medium">Requested</span> · {fmtDateTime(selected.createdAt)}</li>
              {selected.reviewedAt && <li><span className="font-medium">{selected.status} by {selected.reviewer}</span> · {fmtDateTime(selected.reviewedAt)}</li>}
              {selected.status === "Expired" && <li className="text-muted-foreground">Expired after 30 days without a decision</li>}
            </ol>
          </div>
        </>}
      </DetailDrawer>
      <ConfirmDialog open={!!reject} onOpenChange={(o) => { if (!o) { setReject(null); setNote(""); } }} danger confirmLabel="Reject request" title="Reject this request?"
        description="The member keeps their current access. You can add a note explaining why." onConfirm={() => reject && act(reject, "Rejected")}>
        <textarea className={TEXTAREA} placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      </ConfirmDialog>
    </div>
  );
}

export function AccessRequestsPage() {
  return <SettingsPage slug="access-requests" wide><AccessRequestsPanel /></SettingsPage>;
}

/* ---------- Connected applications ---------- */
type ConnectedApp = { id: string; name: string; developer: string; permissions: string[]; connectedAt: string; lastActivity: string; status: "Active" | "Revoked"; authorizedBy: string };
export const connectedAppsStore = createDemoStore<ConnectedApp[]>([
  { id: "app_1", name: "Ledgerly Books", developer: "Ledgerly Technologies Ltd", permissions: ["Read transactions", "Read settlements", "Read invoices"], connectedAt: daysAgo(88, 10), lastActivity: daysAgo(0, 6), status: "Active", authorizedBy: "Tunde Bakare" },
  { id: "app_2", name: "Shipmate Delivery", developer: "Shipmate Africa", permissions: ["Read orders", "Update order fulfilment"], connectedAt: daysAgo(30, 14), lastActivity: daysAgo(1, 18), status: "Active", authorizedBy: "Ibrahim Musa" },
  { id: "app_3", name: "SalesPulse Analytics", developer: "Pulse Labs", permissions: ["Read transactions", "Read customers"], connectedAt: daysAgo(160, 9), lastActivity: daysAgo(70, 9), status: "Revoked", authorizedBy: "Ada Okafor" },
]);

export function ConnectedAppsPage() {
  const apps = connectedAppsStore.use();
  const canEdit = useCanEdit();
  const [view, setView] = useState<ConnectedApp | null>(null);
  const [revoke, setRevoke] = useState<ConnectedApp | null>(null);
  const [status, setStatus] = useState("Active");
  const rows = apps.filter((a) => status === "All" || a.status === status);
  const cols: Column<ConnectedApp>[] = [
    { key: "name", header: "Application", cell: (a) => <span className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-md bg-muted"><AppWindow className="h-4 w-4" /></span><span className="font-medium">{a.name}</span></span> },
    { key: "dev", header: "Developer", cell: (a) => a.developer, hideBelow: "md" },
    { key: "perm", header: "Permissions", cell: (a) => <span className="text-muted-foreground">{a.permissions.length} permission{a.permissions.length === 1 ? "" : "s"}</span> },
    { key: "connected", header: "Connected", cell: (a) => <span className="text-muted-foreground">{fmtDateTime(a.connectedAt)}</span>, hideBelow: "lg" },
    { key: "last", header: "Last activity", cell: (a) => <span className="text-muted-foreground">{fmtDateTime(a.lastActivity)}</span>, hideBelow: "md" },
    { key: "status", header: "Status", cell: (a) => <StatusBadge status={a.status} tone={a.status === "Active" ? "success" : "danger"} /> },
  ];
  return (
    <SettingsPage slug="connected-apps" wide>
      <div className="mb-3 flex items-center gap-2"><FilterSelect label="Status" value={status} onChange={setStatus} options={["All", "Active", "Revoked"]} /></div>
      <div className="panel overflow-hidden">
        <DataTable columns={cols} rows={rows} rowKey={(a) => a.id} onRowClick={setView} headerTone="plain"
          rowActions={(a) => a.status === "Active" && canEdit ? <button className="text-sm font-semibold text-destructive hover:underline" onClick={() => setRevoke(a)}>Revoke access</button> : null}
          empty={<EmptyState icon={AppWindow} title="No connected applications" description="Apps you authorize to read or change your Griv data will appear here." />} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Sample apps for this demo. Revoking here only updates the list — no real access tokens exist.</p>
      <DetailDrawer open={!!view} onOpenChange={(o) => !o && setView(null)} title={view?.name ?? ""} subtitle={view?.developer}
        badge={view && <StatusBadge status={view.status} tone={view.status === "Active" ? "success" : "danger"} />}
        footer={view?.status === "Active" && canEdit ? <button className="btn btn-outline h-9 text-sm text-destructive" onClick={() => setRevoke(view)}>Revoke access</button> : undefined}>
        {view && <>
          <DetailList items={[["Authorized by", view.authorizedBy], ["Connected", fmtDateTime(view.connectedAt)], ["Last activity", fmtDateTime(view.lastActivity)]]} />
          <div><p className="mb-2 text-sm font-semibold">Permissions</p><ul className="space-y-1.5 text-sm">{view.permissions.map((p) => <li key={p} className="rounded-md border px-3 py-2">{p}</li>)}</ul></div>
        </>}
      </DetailDrawer>
      <ConfirmDialog open={!!revoke} onOpenChange={(o) => !o && setRevoke(null)} danger confirmLabel="Revoke access" title={`Revoke ${revoke?.name}?`}
        description="The app immediately loses access to your Griv data. Anyone using it will need to reconnect."
        onConfirm={() => {
          if (!revoke) return;
          connectedAppsStore.set((all) => all.map((a) => (a.id === revoke.id ? { ...a, status: "Revoked" } : a)));
          logAudit("Connected application revoked", "Connected applications", revoke.name);
          logSecurity("Connected application revoked", "API", `${revoke.name} by ${revoke.developer}`);
          toast.success(`${revoke.name} revoked`);
          setRevoke(null); setView(null);
        }} />
    </SettingsPage>
  );
}

export { FormDialog };
