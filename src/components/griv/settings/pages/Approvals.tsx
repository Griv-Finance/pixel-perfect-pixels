import { useState } from "react";
import { GitPullRequestArrow, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  ConfirmDialog, DataTable, DetailDrawer, DetailList, EmptyState, FilterSelect, FormDialog, StatusBadge, type Column,
} from "@/components/griv/kit";
import { CURRENCIES, formatMoney, type Currency } from "@/lib/money";
import { fmtDateTime } from "@/lib/dates";
import { useMembers, useRoles, useViewerId } from "@/lib/demo/settings/access";
import { logAudit } from "@/lib/demo/settings/activity";
import {
  AMOUNT_ACTIONS, APPROVAL_ACTIONS, cannotApproveReason, decide, progress, rulesStore, useApprovalRequests, useRules, validateRule,
  type ApprovalAction, type ApprovalRequest, type ApprovalRule,
} from "@/lib/demo/settings/finance";
import { Callout, INPUT, RowMenu, SELECT, SettingsPage, SettingsTabs, TEXTAREA, useCanEdit, useTab } from "../ui";
import { cn } from "@/lib/utils";

const TABS = ["rules", "pending", "history"] as const;
type Draft = Omit<ApprovalRule, "id"> & { id?: string };
const blank = (): Draft => ({ name: "", action: "Single payouts", currency: "NGN", min: 1_000_000, max: null, levels: [{ roles: ["finance"], approvers: 1 }], allowSelfApproval: false, status: "Active" });

export function useRuleText() {
  const roles = useRoles();
  const rn = (id: string) => roles.find((r) => r.id === id)?.name ?? id;
  return {
    condition: (r: ApprovalRule) => !AMOUNT_ACTIONS.includes(r.action) ? "Every change" :
      r.max != null ? `${formatMoney(r.min ?? 0, r.currency)} – ${formatMoney(r.max, r.currency)}` : (r.min ?? 0) > 0 ? `Above ${formatMoney(r.min ?? 0, r.currency)}` : `Any amount (${r.currency})`,
    approvers: (r: ApprovalRule) => r.levels.map((l, i) => `${r.levels.length > 1 ? `Step ${i + 1}: ` : ""}${l.approvers} × ${l.roles.map(rn).join(" or ")}`).join(" → "),
    rn,
  };
}

function RuleDialog({ draft, setDraft }: { draft: Draft | null; setDraft: (d: Draft | null) => void }) {
  const roles = useRoles();
  const [tried, setTried] = useState(false);
  if (!draft) return null;
  const errors = validateRule(draft);
  const amount = AMOUNT_ACTIONS.includes(draft.action);
  const e = (k: string) => (tried ? errors[k] : undefined);
  const save = () => {
    setTried(true);
    if (Object.keys(errors).length) return;
    const before = draft.id ? rulesStore.get().find((r) => r.id === draft.id) : undefined;
    if (draft.id) rulesStore.set((all) => all.map((r) => (r.id === draft.id ? { ...(draft as ApprovalRule) } : r)));
    else rulesStore.set((all) => [...all, { ...draft, id: `rule_${Date.now().toString(36)}` }]);
    logAudit(draft.id ? "Approval rule changed" : "Approval rule created", "Approvals", draft.name.trim(), before ? { before: { Levels: `${before.levels.length}`, Minimum: String(before.min ?? "—"), Status: before.status }, after: { Levels: `${draft.levels.length}`, Minimum: String(draft.min ?? "—"), Status: draft.status } } : {});
    toast.success(draft.id ? "Rule updated" : "Rule created");
    setTried(false); setDraft(null);
  };
  const setLevel = (i: number, patch: Partial<Draft["levels"][number]>) => setDraft({ ...draft, levels: draft.levels.map((l, j) => (j === i ? { ...l, ...patch } : l)) });
  return (
    <FormDialog open onOpenChange={(o) => !o && setDraft(null)} title={draft.id ? "Edit approval rule" : "New approval rule"} size="lg"
      description="Requests matching this rule wait until every step has enough approvals."
      footer={<><button className="btn btn-outline h-9 text-sm" onClick={() => setDraft(null)}>Cancel</button><button className="btn btn-primary h-9 text-sm" onClick={save}>{draft.id ? "Save rule" : "Create rule"}</button></>}>
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">Rule name<input className={cn(INPUT, "mt-1.5", e("name") && "border-destructive")} value={draft.name} onChange={(ev) => setDraft({ ...draft, name: ev.target.value })} placeholder="e.g. Large payouts" />{e("name") && <span className="mt-1 block text-xs text-destructive">{e("name")}</span>}</label>
          <label className="text-sm font-medium">Action<select className={`${SELECT} mt-1.5`} value={draft.action} onChange={(ev) => setDraft({ ...draft, action: ev.target.value as ApprovalAction })}>{APPROVAL_ACTIONS.map((a) => <option key={a}>{a}</option>)}</select></label>
        </div>
        {amount && (
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="text-sm font-medium">Currency<select className={`${SELECT} mt-1.5`} value={draft.currency} onChange={(ev) => setDraft({ ...draft, currency: ev.target.value as Currency })}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select></label>
            <label className="text-sm font-medium">Minimum amount<input type="number" min={0} className={cn(INPUT, "mt-1.5", e("min") && "border-destructive")} value={draft.min ?? ""} onChange={(ev) => setDraft({ ...draft, min: ev.target.value === "" ? null : Number(ev.target.value) })} />{e("min") && <span className="mt-1 block text-xs text-destructive">{e("min")}</span>}</label>
            <label className="text-sm font-medium">Maximum amount<input type="number" min={0} className={cn(INPUT, "mt-1.5", e("max") && "border-destructive")} placeholder="No maximum" value={draft.max ?? ""} onChange={(ev) => setDraft({ ...draft, max: ev.target.value === "" ? null : Number(ev.target.value) })} />{e("max") && <span className="mt-1 block text-xs text-destructive">{e("max")}</span>}</label>
          </div>
        )}
        <div>
          <p className="mb-2 text-sm font-medium">Approval steps</p>
          <div className="space-y-3">
            {draft.levels.map((l, i) => (
              <div key={i} className="rounded-lg border p-3">
                <div className="mb-2 flex items-center justify-between"><p className="text-sm font-semibold">Step {i + 1}</p>
                  {draft.levels.length > 1 && <button className="text-muted-foreground hover:text-destructive" aria-label={`Remove step ${i + 1}`} onClick={() => setDraft({ ...draft, levels: draft.levels.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></button>}</div>
                <div className="flex flex-wrap gap-2">
                  {roles.filter((r) => r.permissions.includes("approvals.approve")).map((r) => (
                    <label key={r.id} className={cn("flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs", l.roles.includes(r.id) && "border-primary bg-primary/5 text-primary")}>
                      <input type="checkbox" className="sr-only" checked={l.roles.includes(r.id)} onChange={() => setLevel(i, { roles: l.roles.includes(r.id) ? l.roles.filter((x) => x !== r.id) : [...l.roles, r.id] })} />{r.name}
                    </label>
                  ))}
                </div>
                <label className="mt-3 flex items-center gap-2 text-sm">Approvers needed
                  <input type="number" min={1} max={5} className="field h-8 w-20 text-sm" value={l.approvers} onChange={(ev) => setLevel(i, { approvers: Math.max(0, Number(ev.target.value)) })} />
                </label>
                {e(`level.${i}`) && <p className="mt-1 text-xs text-destructive">{e(`level.${i}`)}</p>}
              </div>
            ))}
          </div>
          <button className="mt-2 text-sm font-semibold text-primary hover:underline" onClick={() => setDraft({ ...draft, levels: [...draft.levels, { roles: ["owner", "admin"], approvers: 1 }] })}>+ Add another step</button>
          <p className="mt-1 text-xs text-muted-foreground">Only roles with the “Approve approvals” permission are listed.</p>
        </div>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" checked={draft.allowSelfApproval} onChange={(ev) => setDraft({ ...draft, allowSelfApproval: ev.target.checked })} />
          <span>Let people approve their own requests<span className="block text-xs text-muted-foreground">Off by default — most businesses require a second person.</span></span></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-primary" checked={draft.status === "Active"} onChange={(ev) => setDraft({ ...draft, status: ev.target.checked ? "Active" : "Inactive" })} />Rule is active</label>
      </div>
    </FormDialog>
  );
}

function RequestDrawer({ req, onClose }: { req: ApprovalRequest | null; onClose: () => void }) {
  const rules = useRules();
  const members = useMembers();
  useViewerId();
  const text = useRuleText();
  const [reject, setReject] = useState(false);
  const [note, setNote] = useState("");
  if (!req) return null;
  const rule = rules.find((r) => r.id === req.ruleId);
  const p = progress(req, rule);
  const why = cannotApproveReason(req, rule);
  const who = members.find((m) => m.id === req.requestedBy)?.name ?? "Former member";
  const act = (d: "Approved" | "Rejected") => {
    const r = decide(req.id, d, note.trim() || undefined);
    if (r.error) { toast.error(r.error); return; }
    logAudit(d === "Approved" ? "Approval given" : "Approval request rejected", "Approvals", `${req.id} · ${req.title}`, { refs: [req.id, req.reference], ...(note ? { after: { Note: note } } : {}) });
    if (r.request?.status === "Approved") toast.success("Fully approved", { description: "The payment itself still needs the payment provider to process it — it stays pending until then." });
    else toast.success(d === "Approved" ? "Approval recorded — waiting for the next approver" : "Request rejected");
    setReject(false); setNote(""); onClose();
  };
  return (
    <>
      <DetailDrawer open onOpenChange={(o) => !o && onClose()} title={req.title} subtitle={`${req.id} · requested by ${who}`}
        badge={<StatusBadge status={req.status} tone={req.status === "Approved" ? "success" : req.status === "Rejected" ? "danger" : "pending"} />}
        footer={req.status === "Pending" ? (why ? <p className="text-sm text-muted-foreground">{why}</p> : <>
          <button className="btn btn-outline h-9 text-sm text-destructive" onClick={() => setReject(true)}>Reject</button>
          <button className="btn btn-primary h-9 text-sm" onClick={() => act("Approved")}>Approve</button>
        </>) : undefined}>
        <DetailList items={[["Amount", req.amount != null ? formatMoney(req.amount, req.currency) : "—"], ["Rule", rule?.name ?? "—"], ["Required approvals", text.approvers(rule ?? { levels: [] } as unknown as ApprovalRule) || "—"], ["Progress", `${p.approvals} of ${p.required}`], ["Reference", <span className="font-mono text-xs">{req.reference}</span>], ["Created", fmtDateTime(req.createdAt)]]} />
        <div>
          <p className="mb-2 text-sm font-semibold">Approval history</p>
          <ol className="space-y-2 border-l pl-4 text-sm">
            <li><span className="font-medium">Requested by {who}</span><span className="block text-xs text-muted-foreground">{fmtDateTime(req.createdAt)}</span></li>
            {req.decisions.map((d, i) => (
              <li key={i}><span className={cn("font-medium", d.decision === "Rejected" && "text-destructive")}>{d.decision} by {d.name}{rule && rule.levels.length > 1 ? ` (step ${d.level + 1})` : ""}</span>
                <span className="block text-xs text-muted-foreground">{fmtDateTime(d.at)}{d.note ? ` · “${d.note}”` : ""}</span></li>
            ))}
            {req.status === "Pending" && <li className="text-muted-foreground">Waiting for {rule ? `${rule.levels[p.level]!.roles.map(text.rn).join(" or ")} (step ${p.level + 1})` : "an approver"}</li>}
          </ol>
        </div>
        {req.status === "Approved" && <Callout>Approval only clears this request. The payout or transfer still has to be processed by the payment provider and stays pending until it confirms.</Callout>}
      </DetailDrawer>
      <ConfirmDialog open={reject} onOpenChange={setReject} danger confirmLabel="Reject request" title="Reject this request?" description="The requester is told it was rejected. Add a short reason." onConfirm={() => act("Rejected")}>
        <textarea className={TEXTAREA} placeholder="Reason (optional)" value={note} onChange={(ev) => setNote(ev.target.value)} />
      </ConfirmDialog>
    </>
  );
}

export function ApprovalsPage() {
  const [tab, setTab] = useTab(TABS, "rules");
  const rules = useRules();
  const requests = useApprovalRequests();
  const members = useMembers();
  const canEdit = useCanEdit();
  const text = useRuleText();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [del, setDel] = useState<ApprovalRule | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [histStatus, setHistStatus] = useState("All");
  const who = (id: string) => members.find((m) => m.id === id)?.name ?? "Former member";
  const pending = requests.filter((r) => r.status === "Pending");
  const history = requests.filter((r) => r.status !== "Pending" && (histStatus === "All" || r.status === histStatus));

  const ruleCols: Column<ApprovalRule>[] = [
    { key: "name", header: "Rule", cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "action", header: "Action", cell: (r) => r.action, hideBelow: "md" },
    { key: "cond", header: "Applies to", cell: (r) => <span className="text-muted-foreground">{text.condition(r)}</span> },
    { key: "appr", header: "Approvers", cell: (r) => <span className="block max-w-xs whitespace-normal text-sm">{text.approvers(r)}</span>, hideBelow: "lg" },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} tone={r.status === "Active" ? "success" : "neutral"} /> },
  ];
  const reqCols: Column<ApprovalRequest>[] = [
    { key: "title", header: "Request", cell: (r) => <span className="font-medium">{r.title}<span className="block text-xs font-normal text-muted-foreground">{r.id}</span></span> },
    { key: "by", header: "Requested by", cell: (r) => who(r.requestedBy), hideBelow: "md" },
    { key: "amount", header: "Amount", align: "right", cell: (r) => (r.amount != null ? formatMoney(r.amount, r.currency) : "—") },
    { key: "req", header: "Required", cell: (r) => progress(r, rules.find((x) => x.id === r.ruleId)).required, hideBelow: "lg" },
    { key: "cur", header: "Approvals", cell: (r) => { const p = progress(r, rules.find((x) => x.id === r.ruleId)); return <span className="tnum">{p.approvals} / {p.required}</span>; } },
    { key: "created", header: "Created", cell: (r) => <span className="text-muted-foreground">{fmtDateTime(r.createdAt)}</span>, sort: (r) => r.createdAt, hideBelow: "md" },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} tone={r.status === "Approved" ? "success" : r.status === "Rejected" ? "danger" : "pending"} /> },
  ];

  return (
    <SettingsPage slug="approvals" wide actions={tab === "rules" ? <button className="btn btn-primary h-9 text-sm" onClick={() => setDraft(blank())}><Plus className="h-4 w-4" />New rule</button> : undefined}>
      <SettingsTabs value={tab} onChange={setTab} tabs={[{ id: "rules", label: "Approval rules" }, { id: "pending", label: "Pending approvals", count: pending.length }, { id: "history", label: "Approval history" }]} />
      {tab === "rules" && (
        <>
          <p className="mb-3 max-w-3xl text-sm text-muted-foreground">Example: payouts above ₦5,000,000.00 need two approvals from Finance Managers or Administrators. People can't approve their own requests unless a rule allows it.</p>
          <div className="panel overflow-hidden">
            <DataTable columns={ruleCols} rows={rules} rowKey={(r) => r.id} headerTone="plain" onRowClick={canEdit ? (r) => setDraft({ ...r }) : undefined}
              rowActions={(r) => canEdit ? <RowMenu items={[
                { label: "Edit rule", onSelect: () => setDraft({ ...r }) },
                { label: r.status === "Active" ? "Deactivate" : "Activate", onSelect: () => { rulesStore.set((all) => all.map((x) => (x.id === r.id ? { ...x, status: x.status === "Active" ? "Inactive" : "Active" } : x))); logAudit("Approval rule changed", "Approvals", r.name, { before: { Status: r.status }, after: { Status: r.status === "Active" ? "Inactive" : "Active" } }); toast.success(`Rule ${r.status === "Active" ? "deactivated" : "activated"}`); } },
                { label: "Delete rule", danger: true, separatorBefore: true, onSelect: () => setDel(r) },
              ]} /> : null}
              empty={<EmptyState icon={GitPullRequestArrow} title="No approval rules yet" description="Add a rule so large payouts or sensitive changes need a second person." action={canEdit ? <button className="btn btn-primary h-9 text-sm" onClick={() => setDraft(blank())}>New rule</button> : undefined} />} />
          </div>
        </>
      )}
      {tab === "pending" && (
        <div className="panel overflow-hidden">
          <DataTable columns={reqCols} rows={pending} rowKey={(r) => r.id} headerTone="plain" onRowClick={(r) => setOpen(r.id)} initialSort={{ key: "created", dir: "desc" }}
            rowActions={(r) => <button className="text-sm font-semibold text-primary hover:underline" onClick={() => setOpen(r.id)}>Review</button>}
            empty={<EmptyState icon={GitPullRequestArrow} title="Nothing waiting for approval" description="Requests that match an active rule show up here." />} />
        </div>
      )}
      {tab === "history" && (
        <>
          <div className="mb-3"><FilterSelect label="Status" value={histStatus} onChange={setHistStatus} options={["All", "Approved", "Rejected"]} /></div>
          <div className="panel overflow-hidden">
            <DataTable columns={reqCols} rows={history} rowKey={(r) => r.id} headerTone="plain" onRowClick={(r) => setOpen(r.id)} initialSort={{ key: "created", dir: "desc" }}
              empty={<EmptyState title="No decided requests" description="Approved and rejected requests are kept here." />} />
          </div>
        </>
      )}
      <RuleDialog draft={draft} setDraft={setDraft} />
      <RequestDrawer req={requests.find((r) => r.id === open) ?? null} onClose={() => setOpen(null)} />
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setDel(null)} danger confirmLabel="Delete rule" title={`Delete “${del?.name}”?`}
        description="Matching actions won't need approval any more. Requests already waiting keep their current approvers."
        onConfirm={() => { if (!del) return; rulesStore.set((all) => all.filter((r) => r.id !== del.id)); logAudit("Approval rule deleted", "Approvals", del.name); toast.success("Rule deleted"); setDel(null); }} />
    </SettingsPage>
  );
}
