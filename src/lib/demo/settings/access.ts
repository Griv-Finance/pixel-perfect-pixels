/**
 * SAMPLE DATA — team members, roles, permissions, invitations and access requests.
 * The UI checks `can()` to show read-only states, and the mutation helpers check it again.
 * A real backend must still enforce every permission server-side; hiding a button is not authorization.
 */
import { createDemoStore } from "@/lib/demo-store";
import { daysAgo, nowIso } from "@/lib/dates";

/* ---------- Permissions ---------- */
export type Action = "view" | "create" | "edit" | "approve" | "export" | "delete" | "manage";
export const ACTIONS: Action[] = ["view", "create", "edit", "approve", "export", "delete", "manage"];

export const RESOURCES = [
  { id: "balances", label: "Balances", actions: ["view", "export"] },
  { id: "transactions", label: "Transactions", actions: ["view", "export"] },
  { id: "payments", label: "Payments", actions: ["view", "create", "export"] },
  { id: "transfers_payouts", label: "Transfers and payouts", actions: ["view", "create", "approve", "export"] },
  { id: "settlements", label: "Settlements", actions: ["view", "export", "manage"] },
  { id: "payment_links", label: "Payment links", actions: ["view", "create", "edit", "delete"] },
  { id: "invoices", label: "Invoices", actions: ["view", "create", "edit", "export", "delete"] },
  { id: "virtual_accounts", label: "Virtual accounts", actions: ["view", "create", "manage"] },
  { id: "customers", label: "Customers", actions: ["view", "create", "edit", "export", "delete"] },
  { id: "online_store", label: "Online store", actions: ["view", "manage"] },
  { id: "orders", label: "Orders", actions: ["view", "edit", "export"] },
  { id: "products", label: "Products", actions: ["view", "create", "edit", "delete"] },
  { id: "inventory", label: "Inventory", actions: ["view", "edit", "manage"] },
  { id: "pos", label: "POS", actions: ["view", "create", "manage"] },
  { id: "reports", label: "Reports", actions: ["view", "export"] },
  { id: "developers", label: "Developers", actions: ["view", "manage"] },
  { id: "business_settings", label: "Business settings", actions: ["view", "manage"] },
  { id: "team", label: "Team management", actions: ["view", "manage"] },
  { id: "approvals", label: "Approvals", actions: ["view", "approve", "manage"] },
] as const satisfies readonly { id: string; label: string; actions: readonly Action[] }[];

export type ResourceId = (typeof RESOURCES)[number]["id"];
export type Permission = `${ResourceId}.${Action}`;

export const ALL_PERMISSIONS: Permission[] = RESOURCES.flatMap((r) => r.actions.map((a) => `${r.id}.${a}` as Permission));

export const permissionLabel = (p: Permission) => {
  const [res, act] = p.split(".") as [ResourceId, Action];
  const r = RESOURCES.find((x) => x.id === res);
  return `${act[0]!.toUpperCase()}${act.slice(1)} ${r?.label.toLowerCase() ?? res}`;
};

/**
 * Turn a permission on or off while keeping the set consistent:
 * any action other than "view" needs "view" on the same resource, and removing "view" removes the rest.
 */
export function togglePermission(set: Permission[], p: Permission): Permission[] {
  const [res, act] = p.split(".") as [ResourceId, Action];
  const has = set.includes(p);
  if (has) {
    if (act === "view") return set.filter((x) => !x.startsWith(`${res}.`));
    return set.filter((x) => x !== p);
  }
  const view = `${res}.view` as Permission;
  return [...new Set([...set, p, view])];
}

/* ---------- Roles ---------- */
export type Role = { id: string; name: string; description: string; permissions: Permission[]; system: boolean };

const viewAll = RESOURCES.map((r) => `${r.id}.view` as Permission);
const pick = (...ids: ResourceId[]) => RESOURCES.filter((r) => ids.includes(r.id)).flatMap((r) => r.actions.map((a) => `${r.id}.${a}` as Permission));

export const INITIAL_ROLES: Role[] = [
  { id: "owner", name: "Owner", system: true, description: "Full access, including ownership and billing. Every business needs at least one active Owner.", permissions: [...ALL_PERMISSIONS] },
  { id: "admin", name: "Administrator", system: true, description: "Full access to products, team and settings.", permissions: [...ALL_PERMISSIONS] },
  { id: "finance", name: "Finance Manager", system: true, description: "Moves money, approves payouts and manages settlements.",
    permissions: [...new Set([...viewAll, ...pick("balances", "transactions", "payments", "transfers_payouts", "settlements", "invoices", "reports"), "approvals.view", "approvals.approve"] as Permission[])] },
  { id: "operations", name: "Operations Manager", system: true, description: "Runs the store, orders, products, inventory and POS.",
    permissions: [...new Set([...viewAll, ...pick("online_store", "orders", "products", "inventory", "pos", "customers", "payment_links")] as Permission[])].filter((p) => !p.startsWith("developers.")) },
  { id: "developer", name: "Developer", system: true, description: "Manages API keys, webhooks and integrations.",
    permissions: [...new Set(["balances.view", "transactions.view", "payments.view", "reports.view", ...pick("developers")] as Permission[])] },
  { id: "support", name: "Support", system: true, description: "Helps customers: views payments and manages customer records.",
    permissions: ["transactions.view", "payments.view", "invoices.view", "orders.view", "orders.edit", "customers.view", "customers.edit", "payment_links.view"] },
  { id: "viewer", name: "Viewer", system: true, description: "Read-only access to everything except developer settings.", permissions: viewAll.filter((p) => p !== "developers.view") },
];

export const rolesStore = createDemoStore<Role[]>(INITIAL_ROLES);
export const useRoles = () => rolesStore.use();
export const getRole = (id: string) => rolesStore.get().find((r) => r.id === id);

export function saveCustomRole(role: Omit<Role, "system" | "id"> & { id?: string }) {
  if (!can("team.manage")) return { error: "You don't have permission to manage roles." };
  if (!role.name.trim()) return { error: "Give the role a name." };
  const clash = rolesStore.get().find((r) => r.name.toLowerCase() === role.name.trim().toLowerCase() && r.id !== role.id);
  if (clash) return { error: "A role with this name already exists." };
  if (role.id) {
    rolesStore.set((all) => all.map((r) => (r.id === role.id && !r.system ? { ...r, ...role, name: role.name.trim() } : r)));
    return { id: role.id };
  }
  const id = `role_${Date.now().toString(36)}`;
  rolesStore.set((all) => [...all, { ...role, name: role.name.trim(), id, system: false }]);
  return { id };
}

export function deleteCustomRole(id: string) {
  if (membersStore.get().some((m) => m.roleId === id && m.status !== "Removed")) return { error: "Move members to another role before deleting this one." };
  rolesStore.set((all) => all.filter((r) => r.id !== id || r.system));
  return {};
}

/* ---------- Members ---------- */
export type MemberStatus = "Active" | "Invited" | "Suspended";
export type Member = {
  id: string; name: string; email: string; roleId: string; status: MemberStatus;
  lastSignIn: string | null; addedAt: string;
};

export const INITIAL_MEMBERS: Member[] = [
  { id: "mem_owner", name: "Ada Okafor", email: "ada@novaretail.ng", roleId: "owner", status: "Active", lastSignIn: daysAgo(0, 9, 12), addedAt: daysAgo(210) },
  { id: "mem_tunde", name: "Tunde Bakare", email: "tunde@novaretail.ng", roleId: "finance", status: "Active", lastSignIn: daysAgo(1, 16, 40), addedAt: daysAgo(180) },
  { id: "mem_chioma", name: "Chioma Eze", email: "chioma@novaretail.ng", roleId: "finance", status: "Active", lastSignIn: daysAgo(2, 11, 5), addedAt: daysAgo(120) },
  { id: "mem_ibrahim", name: "Ibrahim Musa", email: "ibrahim@novaretail.ng", roleId: "operations", status: "Active", lastSignIn: daysAgo(0, 8, 30), addedAt: daysAgo(96) },
  { id: "mem_seyi", name: "Seyi Adeyemi", email: "seyi@novaretail.ng", roleId: "developer", status: "Active", lastSignIn: daysAgo(3, 14, 22), addedAt: daysAgo(60) },
  { id: "mem_grace", name: "Grace Nwosu", email: "grace@novaretail.ng", roleId: "support", status: "Suspended", lastSignIn: daysAgo(41, 10, 0), addedAt: daysAgo(150) },
  { id: "mem_femi", name: "Femi Ojo", email: "femi@novaretail.ng", roleId: "viewer", status: "Active", lastSignIn: daysAgo(6, 9, 45), addedAt: daysAgo(30) },
];

export const membersStore = createDemoStore<Member[]>(INITIAL_MEMBERS);
export const useMembers = () => membersStore.use();
export const getMember = (id: string) => membersStore.get().find((m) => m.id === id);

/** True when this member is the only active Owner — they can't be removed, suspended or demoted. */
export function isLastActiveOwner(members: Member[], id: string) {
  const owners = members.filter((m) => m.roleId === "owner" && m.status === "Active");
  return owners.length === 1 && owners[0]!.id === id;
}

export function changeMemberRole(id: string, roleId: string) {
  if (!can("team.manage")) return { error: "You don't have permission to change roles." };
  const all = membersStore.get();
  if (roleId !== "owner" && isLastActiveOwner(all, id)) return { error: "This is the only active Owner. Make someone else an Owner first." };
  membersStore.set(all.map((m) => (m.id === id ? { ...m, roleId } : m)));
  return {};
}

export function setMemberStatus(id: string, status: MemberStatus) {
  if (!can("team.manage")) return { error: "You don't have permission to change access." };
  const all = membersStore.get();
  if (status !== "Active" && isLastActiveOwner(all, id)) return { error: "This is the only active Owner, so their access can't be suspended." };
  membersStore.set(all.map((m) => (m.id === id ? { ...m, status } : m)));
  return {};
}

export function removeMember(id: string) {
  if (!can("team.manage")) return { error: "You don't have permission to remove members." };
  const all = membersStore.get();
  if (isLastActiveOwner(all, id)) return { error: "This is the only active Owner, so they can't be removed." };
  if (id === viewerStore.get()) return { error: "You can't remove yourself." };
  membersStore.set(all.filter((m) => m.id !== id));
  return {};
}

/* ---------- Invitations ---------- */
export type Invitation = { id: string; email: string; roleId: string; message: string; invitedBy: string; sentAt: string; status: "Pending" | "Expired" | "Revoked" };

export const invitationsStore = createDemoStore<Invitation[]>([
  { id: "inv_1", email: "bola@novaretail.ng", roleId: "operations", message: "", invitedBy: "Ada Okafor", sentAt: daysAgo(2, 12), status: "Pending" },
  { id: "inv_2", email: "kemi.accounts@gmail.com", roleId: "viewer", message: "For the audit.", invitedBy: "Tunde Bakare", sentAt: daysAgo(16, 9), status: "Expired" },
]);
export const useInvitations = () => invitationsStore.use();

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Split a pasted list ("a@x.com, b@y.com") and report bad or already-used addresses. */
export function parseInviteEmails(raw: string, members: Member[], invites: Invitation[]) {
  const emails = [...new Set(raw.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean))];
  const invalid = emails.filter((e) => !EMAIL.test(e));
  const existing = emails.filter((e) => members.some((m) => m.email.toLowerCase() === e) || invites.some((i) => i.status === "Pending" && i.email.toLowerCase() === e));
  return { emails, invalid, existing, valid: emails.filter((e) => EMAIL.test(e) && !existing.includes(e)) };
}

export function sendInvites(emails: string[], roleId: string, message: string) {
  const by = getMember(viewerStore.get())?.name ?? "You";
  const now = nowIso();
  invitationsStore.set((all) => [
    ...emails.map((email, i) => ({ id: `inv_${Date.now().toString(36)}_${i}`, email, roleId, message, invitedBy: by, sentAt: now, status: "Pending" as const })),
    ...all,
  ]);
}

/* ---------- Business access setting ---------- */
export type AccessMode = "invited" | "all_members" | "restricted_dev";
export const ACCESS_MODES: { id: AccessMode; label: string; description: string }[] = [
  { id: "invited", label: "Invited members only", description: "Only people you invite individually can open this business. Nobody gets access just for being in your organisation." },
  { id: "all_members", label: "All authorized team members", description: "Every active team member can sign in, and sees only what their role allows." },
  { id: "restricted_dev", label: "Restricted developer access", description: "Developers can use Test mode only. Live mode needs an Owner or Administrator to grant access." },
];
export const accessModeStore = createDemoStore<AccessMode>("all_members");

/* ---------- Access requests ---------- */
export type AccessRequestStatus = "Pending" | "Approved" | "Rejected" | "Expired";
export type AccessRequest = {
  id: string; memberId: string; requested: string; roleId?: string | undefined; resource: string; reason: string;
  createdAt: string; status: AccessRequestStatus; reviewer?: string | undefined; reviewedAt?: string | undefined;
};

export const accessRequestsStore = createDemoStore<AccessRequest[]>([
  { id: "acr_1", memberId: "mem_femi", requested: "Finance Manager role", roleId: "finance", resource: "Transfers and payouts", reason: "Covering payouts while Tunde is on leave next week.", createdAt: daysAgo(1, 10, 15), status: "Pending" },
  { id: "acr_2", memberId: "mem_seyi", requested: "Export transactions", resource: "Transactions", reason: "Need a CSV to reconcile webhook deliveries.", createdAt: daysAgo(3, 15, 2), status: "Pending" },
  { id: "acr_3", memberId: "mem_ibrahim", requested: "Manage settlements", resource: "Settlements", reason: "Want to change the settlement schedule.", createdAt: daysAgo(12, 9, 30), status: "Rejected", reviewer: "Ada Okafor", reviewedAt: daysAgo(11, 13) },
  { id: "acr_4", memberId: "mem_chioma", requested: "Approve transfers and payouts", resource: "Transfers and payouts", reason: "Second approver for bulk payouts.", createdAt: daysAgo(25, 11), status: "Approved", reviewer: "Ada Okafor", reviewedAt: daysAgo(24, 10) },
  { id: "acr_5", memberId: "mem_grace", requested: "View balances", resource: "Balances", reason: "", createdAt: daysAgo(48, 16), status: "Expired" },
]);
export const useAccessRequests = () => accessRequestsStore.use();

export function requestAccess(requested: string, resource: string, reason: string) {
  const req: AccessRequest = { id: `acr_${Date.now().toString(36)}`, memberId: viewerStore.get(), requested, resource, reason, createdAt: nowIso(), status: "Pending" };
  accessRequestsStore.set((all) => [req, ...all]);
  return req;
}

export function reviewAccessRequest(id: string, decision: "Approved" | "Rejected") {
  if (!can("team.manage")) return { error: "You don't have permission to review access requests." };
  const req = accessRequestsStore.get().find((r) => r.id === id);
  if (!req || req.status !== "Pending") return { error: "This request has already been handled." };
  if (req.memberId === viewerStore.get()) return { error: "You can't review your own request." };
  const reviewer = getMember(viewerStore.get())?.name ?? "You";
  accessRequestsStore.set((all) => all.map((r) => (r.id === id ? { ...r, status: decision, reviewer, reviewedAt: nowIso() } : r)));
  if (decision === "Approved" && req.roleId) membersStore.set((all) => all.map((m) => (m.id === req.memberId ? { ...m, roleId: req.roleId! } : m)));
  return {};
}

/* ---------- Who is using the dashboard (permission preview) ---------- */
/** The member whose permissions the dashboard uses. Defaults to the Owner; switchable to preview other roles. */
export const viewerStore = createDemoStore<string>("mem_owner");
export const useViewerId = () => viewerStore.use();

export function permissionsOf(memberId: string, members = membersStore.get(), roles = rolesStore.get()): Permission[] {
  const m = members.find((x) => x.id === memberId);
  if (!m || m.status !== "Active") return [];
  return roles.find((r) => r.id === m.roleId)?.permissions ?? [];
}

export const can = (p: Permission, memberId = viewerStore.get()) => permissionsOf(memberId).includes(p);

/** React hook: does the current viewer have this permission? Re-renders when roles, members or viewer change. */
export function useCan(p: Permission | null) {
  const viewer = viewerStore.use();
  const members = membersStore.use();
  const roles = rolesStore.use();
  if (p === null) return true;
  return permissionsOf(viewer, members, roles).includes(p);
}

export function useViewer() {
  const id = viewerStore.use();
  const members = membersStore.use();
  return members.find((m) => m.id === id) ?? INITIAL_MEMBERS[0]!;
}
