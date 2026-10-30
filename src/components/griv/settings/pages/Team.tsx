import { useMemo, useState } from "react";
import { Download, Globe, Lock, Plus, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import {
  ConfirmDialog, DataTable, DetailDrawer, DetailList, EmptyState, FilterSelect, FormDialog, SearchInput, StatusBadge, type Column,
} from "@/components/griv/kit";
import { exportCsv } from "@/lib/csv";
import { fmtDate, fmtDateTime } from "@/lib/dates";
import {
  ACCESS_MODES, accessModeStore, changeMemberRole, deleteCustomRole, invitationsStore, isLastActiveOwner, parseInviteEmails, permissionLabel,
  removeMember, RESOURCES, saveCustomRole, sendInvites, setMemberStatus, useAccessRequests, useInvitations, useMembers, useRoles, useViewerId,
  type AccessMode, type Member, type Permission, type Role,
} from "@/lib/demo/settings/access";
import { logAudit, logSecurity } from "@/lib/demo/settings/activity";
import { PermissionMatrix } from "../PermissionMatrix";
import { Avatar, ChoiceList, INPUT, RowMenu, Section, SELECT, SettingsPage, SettingsTabs, TEXTAREA, useCanEdit, useTab } from "../ui";
import { AccessRequestsPanel, SecurityHistoryPanel } from "./Monitoring";
import { cn } from "@/lib/utils";

const TABS = ["team", "roles", "invitations", "access-requests", "security-history"] as const;
const memberTone = (s: string) => (s === "Active" ? "success" : s === "Suspended" ? "danger" : "pending") as "success" | "danger" | "pending";

/** "Moves money, approves payouts…" style summary of what a role can do. */
export function roleSummary(role: Role | undefined) {
  if (!role) return [];
  const byRes = RESOURCES.map((r) => {
    const acts = r.actions.filter((a) => role.permissions.includes(`${r.id}.${a}` as Permission));
    return acts.length ? `${r.label}: ${acts.join(", ")}` : null;
  }).filter(Boolean) as string[];
  return byRes;
}

function InviteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const roles = useRoles();
  const members = useMembers();
  const invites = useInvitations();
  const [emails, setEmails] = useState("");
  const [roleId, setRoleId] = useState("viewer");
  const [message, setMessage] = useState("");
  const [tried, setTried] = useState(false);
  const parsed = parseInviteEmails(emails, members, invites);
  const role = roles.find((r) => r.id === roleId);
  const error = !parsed.emails.length ? "Enter at least one email address." : parsed.invalid.length ? `Check these addresses: ${parsed.invalid.join(", ")}` : parsed.existing.length ? `Already on the team or invited: ${parsed.existing.join(", ")}` : null;

  const send = () => {
    setTried(true);
    if (error) return;
    sendInvites(parsed.valid, roleId, message.trim());
    for (const e of parsed.valid) {
      logAudit("Team member invited", "Team", e, { after: { Role: role?.name ?? roleId } });
      logSecurity("Team member invited", "Team", `Invited ${e} as ${role?.name}.`);
    }
    toast.success(`${parsed.valid.length} invitation${parsed.valid.length === 1 ? "" : "s"} created`, { description: "No email service is connected in this demo, so nothing was actually sent." });
    setEmails(""); setMessage(""); setTried(false); onOpenChange(false);
  };

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title="Invite team members" description="They'll get an email to join Nova Retail Ltd. with the role you choose." size="lg"
      footer={<><button className="btn btn-outline h-9 text-sm" onClick={() => onOpenChange(false)}>Cancel</button><button className="btn btn-primary h-9 text-sm" onClick={send}>Send {parsed.valid.length > 1 ? `${parsed.valid.length} invitations` : "invitation"}</button></>}>
      <div className="grid gap-6 md:grid-cols-[1fr_260px]">
        <div className="space-y-4">
          <label className="block text-sm font-medium">Email addresses
            <textarea autoFocus className={cn(TEXTAREA, "mt-1.5", tried && error && "border-destructive")} placeholder="name@company.com, another@company.com" value={emails} onChange={(e) => setEmails(e.target.value)} />
            <span className={cn("mt-1 block text-xs", tried && error ? "font-medium text-destructive" : "font-normal text-muted-foreground")}>{tried && error ? error : "Separate several addresses with commas or new lines."}</span>
          </label>
          <label className="block text-sm font-medium">Role
            <select className={`${SELECT} mt-1.5`} value={roleId} onChange={(e) => setRoleId(e.target.value)}>{roles.filter((r) => r.id !== "owner").map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
            <span className="mt-1 block text-xs font-normal text-muted-foreground">{role?.description}</span>
          </label>
          <label className="block text-sm font-medium">Message <span className="font-normal text-muted-foreground">(optional)</span>
            <textarea className={`${TEXTAREA} mt-1.5 h-20`} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Welcome aboard! You'll be handling…" />
          </label>
        </div>
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-sm font-semibold">What {role?.name} can do</p>
          <ul className="mt-2 max-h-72 space-y-1 overflow-y-auto text-xs text-muted-foreground">{roleSummary(role).map((s) => <li key={s}>• {s}</li>)}</ul>
        </div>
      </div>
    </FormDialog>
  );
}

function TeamTab({ goInvites }: { goInvites: () => void }) {
  const members = useMembers();
  const roles = useRoles();
  const invites = useInvitations();
  const viewer = useViewerId();
  const canEdit = useCanEdit();
  const mode = accessModeStore.use();
  const [summary, setSummary] = useState<"all" | "active" | "inactive">("all");
  const [q, setQ] = useState("");
  const [role, setRole] = useState("All");
  const [status, setStatus] = useState("All");
  const [invite, setInvite] = useState(false);
  const [accessOpen, setAccessOpen] = useState(false);
  const [accessDraft, setAccessDraft] = useState<AccessMode>(mode);
  const [view, setView] = useState<Member | null>(null);
  const [editRole, setEditRole] = useState<Member | null>(null);
  const [roleDraft, setRoleDraft] = useState("");
  const [confirm, setConfirm] = useState<null | { kind: "suspend" | "remove"; m: Member }>(null);
  const roleName = (id: string) => roles.find((r) => r.id === id)?.name ?? id;
  const pending = invites.filter((i) => i.status === "Pending").length;

  const rows = useMemo(() => members.filter((m) =>
    (summary === "all" || (summary === "active" ? m.status === "Active" : m.status === "Suspended")) &&
    (role === "All" || roleName(m.roleId) === role) && (status === "All" || m.status === status) &&
    (!q || `${m.name} ${m.email}`.toLowerCase().includes(q.toLowerCase())),
  ), [members, summary, role, status, q, roles]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = (r: { error?: string }, ok: string, audit: () => void) => { if (r.error) toast.error(r.error); else { audit(); toast.success(ok); } };

  const cols: Column<Member>[] = [
    { key: "name", header: "Name", sort: (m) => m.name, cell: (m) => (
      <span className="flex items-center gap-2"><Avatar name={m.name} /><span className="font-medium">{m.name}</span>
        {m.id === viewer && <span className="rounded border px-1.5 text-[11px] text-muted-foreground">You</span>}
        {m.roleId === "owner" && <span className="rounded border px-1.5 text-[11px] text-muted-foreground">Owner</span>}</span>
    ) },
    { key: "email", header: "Email", cell: (m) => <span className="text-muted-foreground">{m.email}</span>, hideBelow: "md" },
    { key: "role", header: "Role", cell: (m) => roleName(m.roleId), sort: (m) => roleName(m.roleId) },
    { key: "status", header: "Status", cell: (m) => <StatusBadge status={m.status} tone={memberTone(m.status)} /> },
    { key: "last", header: "Last sign-in", cell: (m) => <span className="text-muted-foreground">{m.lastSignIn ? fmtDateTime(m.lastSignIn) : "Never"}</span>, sort: (m) => m.lastSignIn ?? "", hideBelow: "lg" },
    { key: "added", header: "Date added", cell: (m) => <span className="text-muted-foreground">{fmtDate(m.addedAt)}</span>, sort: (m) => m.addedAt, hideBelow: "lg" },
  ];

  const current = ACCESS_MODES.find((a) => a.id === mode)!;
  return (
    <>
      <Section title="Access" description="Who can open this business by default. Owners and Administrators always have access.">
        <div className="flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-muted">{mode === "invited" ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}</span>
          <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{current.label}</p><p className="text-xs text-muted-foreground">{current.description}</p></div>
          {canEdit && <button className="btn btn-outline h-8 px-3 text-xs" onClick={() => { setAccessDraft(mode); setAccessOpen(true); }}>Change access</button>}
        </div>
      </Section>

      <Section title="Direct access" description="Everyone with a role on this business.">
        <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {([["all", "All members", members.length], ["active", "Active members", members.filter((m) => m.status === "Active").length], ["pending", "Pending invites", pending], ["inactive", "Inactive members", members.filter((m) => m.status === "Suspended").length]] as const).map(([id, label, n]) => (
            <button key={id} onClick={() => (id === "pending" ? goInvites() : setSummary(id))}
              className={cn("flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:border-foreground/40", summary === id && "border-primary bg-primary/5 font-semibold text-primary")}>
              {label}<span className="tnum">{n}</span>
            </button>
          ))}
        </div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <SearchInput value={q} onChange={setQ} placeholder="Search name or email" className="sm:w-56" />
          <FilterSelect label="Role" value={role} onChange={setRole} options={["All", ...roles.map((r) => r.name)]} />
          <FilterSelect label="Status" value={status} onChange={setStatus} options={["All", "Active", "Suspended"]} />
          <div className="ml-auto flex gap-2">
            <button className="btn btn-outline h-9 text-sm" disabled={!rows.length} onClick={() => exportCsv("griv-team", rows.map((m) => ({ Name: m.name, Email: m.email, Role: roleName(m.roleId), Status: m.status, "Last sign-in": m.lastSignIn ?? "", "Date added": m.addedAt })))}><Download className="h-4 w-4" />Export</button>
            {canEdit && <button className="btn btn-primary h-9 text-sm" onClick={() => setInvite(true)}><Plus className="h-4 w-4" />Add member</button>}
          </div>
        </div>
        <div className="panel overflow-hidden">
          <DataTable columns={cols} rows={rows} rowKey={(m) => m.id} onRowClick={setView} headerTone="plain"
            rowActions={(m) => (
              <RowMenu items={[
                { label: "View member", onSelect: () => setView(m) },
                { label: "Edit role", disabled: !canEdit, onSelect: () => { setRoleDraft(m.roleId); setEditRole(m); } },
                m.status === "Active"
                  ? { label: "Suspend access", disabled: !canEdit ? true : isLastActiveOwner(members, m.id) ? "The only active Owner can't be suspended" : m.id === viewer ? "You can't suspend yourself" : false, onSelect: () => setConfirm({ kind: "suspend", m }) }
                  : { label: "Reactivate access", disabled: !canEdit, onSelect: () => run(setMemberStatus(m.id, "Active"), `${m.name} reactivated`, () => logAudit("Team member reactivated", "Team", m.name)) },
                { label: "Remove member", danger: true, separatorBefore: true, disabled: !canEdit ? true : isLastActiveOwner(members, m.id) ? "The only active Owner can't be removed" : m.id === viewer ? "You can't remove yourself" : false, onSelect: () => setConfirm({ kind: "remove", m }) },
              ]} />
            )}
            empty={members.length ? <EmptyState title="No members match your filters" description="Try another role, status or search." /> :
              <EmptyState icon={Users} title="Build your team on Griv." description="Invite colleagues and give them access to the tools they need." action={canEdit ? <button className="btn btn-primary h-9 text-sm" onClick={() => setInvite(true)}><UserPlus className="h-4 w-4" />Invite team member</button> : undefined} />} />
        </div>
      </Section>

      <InviteDialog open={invite} onOpenChange={setInvite} />

      <FormDialog open={accessOpen} onOpenChange={setAccessOpen} title="Change access to Nova Retail Ltd." description="Choose who can open this business. You can always invite people individually, and Administrators always have access."
        footer={<><button className="btn btn-outline h-9 text-sm" onClick={() => setAccessOpen(false)}>Cancel</button><button className="btn btn-primary h-9 text-sm" disabled={accessDraft === mode} onClick={() => {
          const from = ACCESS_MODES.find((a) => a.id === mode)!.label, to = ACCESS_MODES.find((a) => a.id === accessDraft)!.label;
          accessModeStore.set(accessDraft);
          logAudit("Business access setting changed", "Team", "Default access", { before: { Access: from }, after: { Access: to } });
          logSecurity("Sensitive permission updated", "Team", `Default access changed to “${to}”.`);
          toast.success("Access updated"); setAccessOpen(false);
        }}>Save</button></>}>
        <ChoiceList name="Access" value={accessDraft} onChange={setAccessDraft} options={ACCESS_MODES} />
        <p className="mt-3 text-xs text-muted-foreground">Access always respects each person's membership, role, explicit permissions and Test/Live restrictions.</p>
      </FormDialog>

      <FormDialog open={!!editRole} onOpenChange={(o) => !o && setEditRole(null)} title={`Edit role for ${editRole?.name}`} description="Changes apply the next time they load a page."
        footer={<><button className="btn btn-outline h-9 text-sm" onClick={() => setEditRole(null)}>Cancel</button><button className="btn btn-primary h-9 text-sm" disabled={roleDraft === editRole?.roleId} onClick={() => {
          if (!editRole) return;
          run(changeMemberRole(editRole.id, roleDraft), "Role updated", () => {
            logAudit("Team role updated", "Team", editRole.name, { before: { Role: roleName(editRole.roleId) }, after: { Role: roleName(roleDraft) } });
            logSecurity("Role or permission changed", "Team", `${editRole.name}: ${roleName(editRole.roleId)} → ${roleName(roleDraft)}.`);
          });
          setEditRole(null);
        }}>Save role</button></>}>
        <select className={SELECT} value={roleDraft} onChange={(e) => setRoleDraft(e.target.value)} aria-label="Role">{roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
        <p className="mt-2 text-xs text-muted-foreground">{roles.find((r) => r.id === roleDraft)?.description}</p>
        {editRole && isLastActiveOwner(members, editRole.id) && roleDraft !== "owner" && <p className="mt-2 text-xs font-medium text-destructive">This is the only active Owner. Make someone else an Owner first.</p>}
      </FormDialog>

      <ConfirmDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)} danger confirmLabel={confirm?.kind === "remove" ? "Remove member" : "Suspend access"}
        title={confirm?.kind === "remove" ? `Remove ${confirm.m.name}?` : `Suspend ${confirm?.m.name}?`}
        description={confirm?.kind === "remove" ? "They lose access straight away. Their past activity stays in the audit log." : "They can't sign in to this business until you reactivate them."}
        onConfirm={() => {
          if (!confirm) return;
          const m = confirm.m;
          if (confirm.kind === "remove") run(removeMember(m.id), `${m.name} removed`, () => logAudit("Team member removed", "Team", m.name, { before: { Role: roleName(m.roleId) } }));
          else run(setMemberStatus(m.id, "Suspended"), `${m.name} suspended`, () => logAudit("Team member suspended", "Team", m.name));
          setConfirm(null); setView(null);
        }} />

      <DetailDrawer open={!!view} onOpenChange={(o) => !o && setView(null)} title={view?.name ?? ""} subtitle={view?.email} badge={view && <StatusBadge status={view.status} tone={memberTone(view.status)} />}>
        {view && <>
          <DetailList items={[["Role", roleName(view.roleId)], ["Last sign-in", view.lastSignIn ? fmtDateTime(view.lastSignIn) : "Never"], ["Date added", fmtDate(view.addedAt)]]} />
          <div><p className="mb-2 text-sm font-semibold">What they can do</p><ul className="space-y-1 text-sm text-muted-foreground">{roleSummary(roles.find((r) => r.id === view.roleId)).map((s) => <li key={s}>• {s}</li>)}</ul></div>
        </>}
      </DetailDrawer>
    </>
  );
}

function RolesTab() {
  const roles = useRoles();
  const members = useMembers();
  const canEdit = useCanEdit();
  const [selectedId, setSelectedId] = useState("finance");
  const [draft, setDraft] = useState<null | { id?: string; name: string; description: string; permissions: Permission[] }>(null);
  const [error, setError] = useState<string | null>(null);
  const selected = roles.find((r) => r.id === selectedId) ?? roles[0]!;
  const count = (id: string) => members.filter((m) => m.roleId === id).length;

  const save = () => {
    if (!draft) return;
    const r = saveCustomRole(draft);
    if (r.error) return setError(r.error);
    logAudit(draft.id ? "Custom role updated" : "Custom role created", "Team", draft.name, { after: { Permissions: `${draft.permissions.length} permissions` } });
    toast.success(draft.id ? "Role updated" : "Role created");
    setSelectedId(r.id!); setDraft(null); setError(null);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <div>
        <div className="space-y-1">
          {roles.map((r) => (
            <button key={r.id} onClick={() => { setSelectedId(r.id); setDraft(null); }} className={cn("flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-muted", selectedId === r.id && !draft && "bg-muted font-semibold")}>
              <span>{r.name}{!r.system && <span className="ml-1.5 text-xs font-normal text-muted-foreground">Custom</span>}</span>
              <span className="text-xs text-muted-foreground tnum">{count(r.id)}</span>
            </button>
          ))}
        </div>
        {canEdit && <button className="btn btn-outline mt-3 h-9 w-full text-sm" onClick={() => { setDraft({ name: "", description: "", permissions: ["balances.view", "transactions.view"] }); setError(null); }}><Plus className="h-4 w-4" />Create custom role</button>}
      </div>
      <div>
        {draft ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">Role name<input className={`${INPUT} mt-1.5`} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Branch cashier" /></label>
              <label className="text-sm font-medium">Description<input className={`${INPUT} mt-1.5`} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label>
            </div>
            <p className="text-xs text-muted-foreground">Turning on Create, Edit, Approve, Export, Delete or Manage also turns on View for that product. Turning off View removes the rest.</p>
            <PermissionMatrix value={draft.permissions} onChange={(p) => setDraft({ ...draft, permissions: p })} />
            {error && <p className="text-sm font-medium text-destructive" role="alert">{error}</p>}
            <div className="flex justify-end gap-2"><button className="btn btn-outline h-9 text-sm" onClick={() => setDraft(null)}>Cancel</button><button className="btn btn-primary h-9 text-sm" onClick={save}>{draft.id ? "Save role" : "Create role"}</button></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h3 className="text-base font-semibold">{selected.name}</h3><p className="text-sm text-muted-foreground">{selected.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">{selected.system ? "Default role — permissions are fixed." : "Custom role"} · {count(selected.id)} member{count(selected.id) === 1 ? "" : "s"} · {selected.permissions.length} permissions</p></div>
              {canEdit && (
                <div className="flex gap-2">
                  <button className="btn btn-outline h-8 px-3 text-xs" onClick={() => setDraft({ name: `${selected.name} (copy)`, description: selected.description, permissions: [...selected.permissions] })}>Duplicate</button>
                  {!selected.system && <button className="btn btn-outline h-8 px-3 text-xs" onClick={() => setDraft({ id: selected.id, name: selected.name, description: selected.description, permissions: [...selected.permissions] })}>Edit</button>}
                  {!selected.system && <button className="btn btn-outline h-8 px-3 text-xs text-destructive" onClick={() => { const r = deleteCustomRole(selected.id); if (r.error) toast.error(r.error); else { logAudit("Custom role deleted", "Team", selected.name); toast.success("Role deleted"); setSelectedId("viewer"); } }}>Delete</button>}
                </div>
              )}
            </div>
            <PermissionMatrix value={selected.permissions} readOnly />
            {selected.id === "owner" && <p className="text-xs text-muted-foreground">Every business keeps at least one active Owner — the last one can't be removed, suspended or given another role.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function InvitationsTab() {
  const invites = useInvitations();
  const roles = useRoles();
  const canEdit = useCanEdit();
  const [open, setOpen] = useState(false);
  type Inv = (typeof invites)[number];
  const cols: Column<Inv>[] = [
    { key: "email", header: "Email", cell: (i) => <span className="font-medium">{i.email}</span> },
    { key: "role", header: "Role", cell: (i) => roles.find((r) => r.id === i.roleId)?.name ?? i.roleId },
    { key: "by", header: "Invited by", cell: (i) => i.invitedBy, hideBelow: "md" },
    { key: "sent", header: "Sent", cell: (i) => <span className="text-muted-foreground">{fmtDateTime(i.sentAt)}</span>, sort: (i) => i.sentAt },
    { key: "status", header: "Status", cell: (i) => <StatusBadge status={i.status} tone={i.status === "Pending" ? "pending" : i.status === "Expired" ? "neutral" : "danger"} /> },
  ];
  return (
    <div>
      <div className="mb-3 flex justify-end">{canEdit && <button className="btn btn-primary h-9 text-sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Invite team member</button>}</div>
      <div className="panel overflow-hidden">
        <DataTable columns={cols} rows={invites} rowKey={(i) => i.id} headerTone="plain" initialSort={{ key: "sent", dir: "desc" }}
          rowActions={(i) => canEdit && i.status !== "Revoked" ? <RowMenu items={[
            { label: "Resend invitation", onSelect: () => { invitationsStore.set((all) => all.map((x) => (x.id === i.id ? { ...x, status: "Pending", sentAt: new Date().toISOString() } : x))); logAudit("Invitation resent", "Team", i.email); toast.success("Invitation renewed", { description: "No email service is connected, so no email was sent." }); } },
            { label: "Revoke invitation", danger: true, separatorBefore: true, disabled: i.status !== "Pending" ? "Only pending invitations can be revoked" : false, onSelect: () => { invitationsStore.set((all) => all.map((x) => (x.id === i.id ? { ...x, status: "Revoked" } : x))); logAudit("Invitation revoked", "Team", i.email); toast.success("Invitation revoked"); } },
          ]} /> : null}
          empty={<EmptyState icon={UserPlus} title="No invitations" description="Invite colleagues and give them access to the tools they need." />} />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Invitations expire after 7 days.</p>
      <InviteDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

export function TeamPage() {
  const [tab, setTab] = useTab(TABS, "team");
  const invites = useInvitations();
  const requests = useAccessRequests();
  return (
    <SettingsPage slug="team" wide>
      <SettingsTabs value={tab} onChange={setTab} tabs={[
        { id: "team", label: "Team" }, { id: "roles", label: "Roles & permissions" },
        { id: "invitations", label: "Invitations", count: invites.filter((i) => i.status === "Pending").length },
        { id: "access-requests", label: "Access requests", count: requests.filter((r) => r.status === "Pending").length },
        { id: "security-history", label: "Security history" },
      ]} />
      {tab === "team" && <TeamTab goInvites={() => setTab("invitations")} />}
      {tab === "roles" && <RolesTab />}
      {tab === "invitations" && <InvitationsTab />}
      {tab === "access-requests" && <AccessRequestsPanel />}
      {tab === "security-history" && <SecurityHistoryPanel />}
      {permissionLabel("team.manage") ? null : null}
    </SettingsPage>
  );
}
