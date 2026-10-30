/**
 * Shared building blocks for every Settings page: page layout with Settings / Category / Setting breadcrumbs,
 * permission-aware editing, tabs kept in the URL, sections, rows, toggles, the unsaved-changes bar, row menus.
 */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useBlocker, useNavigate, useSearch } from "@tanstack/react-router";
import { ChevronRight, Info, Loader2, Lock, MoreHorizontal, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/griv/AppShell";
import { FormDialog } from "@/components/griv/kit";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useGriv } from "@/lib/griv-store";
import { setLiveMode, useLiveMode } from "@/lib/live-mode";
import { categoryLabel, getSetting } from "@/lib/settings/registry";
import { permissionLabel, requestAccess, useCan, useViewer, useRoles } from "@/lib/demo/settings/access";
import { logAudit } from "@/lib/demo/settings/activity";
import { cn } from "@/lib/utils";

/* ---------- Page ---------- */
const EditCtx = createContext(true);
/** Can the current viewer change settings on this page? */
export const useCanEdit = () => useContext(EditCtx);

export function SettingsPage({ slug, actions, children, wide }: {
  slug: string; actions?: ReactNode | undefined; children: ReactNode; wide?: boolean | undefined;
}) {
  const g = useGriv();
  const live = useLiveMode();
  const entry = getSetting(slug)!;
  const canEdit = useCan(entry.edit);
  const business = g.businessName || "Nova Retail Ltd.";
  const initials = ((g.firstName[0] ?? "A") + (g.lastName[0] ?? "O")).toUpperCase();
  return (
    <AppShell business={business} initials={initials} live={live} onLiveChange={setLiveMode}>
      <TooltipProvider delayDuration={150}>
        <div className={cn("mx-auto", wide ? "max-w-6xl" : "max-w-5xl")}>
          <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            <Link to="/settings" className="font-medium text-primary hover:underline">Settings</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/settings" search={{ category: entry.category }} className="hover:text-foreground hover:underline">{categoryLabel(entry.category)}</Link>
            <ChevronRight className="h-3 w-3" />
            <span>{entry.name}</span>
          </nav>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{entry.name}</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">{entry.description}</p>
            </div>
            {actions && canEdit && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
          </div>
          {!canEdit && entry.edit && <ReadOnlyBanner permission={entry.edit} setting={entry.name} />}
          <EditCtx.Provider value={canEdit}>{children}</EditCtx.Provider>
        </div>
      </TooltipProvider>
    </AppShell>
  );
}

function ReadOnlyBanner({ permission, setting }: { permission: Parameters<typeof permissionLabel>[0]; setting: string }) {
  const viewer = useViewer();
  const roles = useRoles();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
      <ShieldAlert className="h-4 w-4 shrink-0 text-warning-foreground" />
      <p className="min-w-0 flex-1">
        <span className="font-semibold">View only.</span> Your role ({roles.find((r) => r.id === viewer.roleId)?.name}) can see {setting.toLowerCase()} but can't change it. Needs “{permissionLabel(permission)}”.
      </p>
      {sent ? <span className="text-xs font-semibold text-muted-foreground">Access requested</span> : (
        <button className="btn btn-outline h-8 px-3 text-xs" onClick={() => setOpen(true)}>Request access</button>
      )}
      <FormDialog open={open} onOpenChange={setOpen} title="Request access" description={`Ask an Owner or Administrator for “${permissionLabel(permission)}”.`}
        footer={<>
          <button className="btn btn-outline h-9 text-sm" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn btn-primary h-9 text-sm" onClick={() => {
            requestAccess(permissionLabel(permission), setting, reason.trim());
            logAudit("Access requested", "Access requests", permissionLabel(permission));
            setSent(true); setOpen(false); toast.success("Request sent. You'll see it under Access requests.");
          }}>Send request</button>
        </>}>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="acr-reason">Why do you need it? <span className="font-normal text-muted-foreground">(optional)</span></label>
        <textarea id="acr-reason" className="field h-24 py-2 text-sm" value={reason} onChange={(e) => setReason(e.target.value)} />
      </FormDialog>
    </div>
  );
}

/** Wrap editable controls: everything inside is disabled when the viewer can't edit this page. */
export function Editable({ children, className }: { children: ReactNode; className?: string | undefined }) {
  const canEdit = useCanEdit();
  return <fieldset disabled={!canEdit} className={cn("m-0 min-w-0 border-0 p-0", className)}>{children}</fieldset>;
}

/* ---------- Tabs (kept in ?tab= so pages can deep-link) ---------- */
export function useTab<T extends string>(tabs: readonly T[], fallback: T): [T, (t: T) => void] {
  const search = useSearch({ strict: false }) as { tab?: string };
  const navigate = useNavigate();
  const current = (tabs as readonly string[]).includes(search.tab ?? "") ? (search.tab as T) : fallback;
  const set = (t: T) => void navigate({ to: ".", search: (prev: Record<string, unknown>) => ({ ...prev, tab: t === fallback ? undefined : t }), replace: true });
  return [current, set];
}

export function SettingsTabs<T extends string>({ tabs, value, onChange, className }: {
  tabs: { id: T; label: string; count?: number | undefined }[]; value: T; onChange: (t: T) => void; className?: string | undefined;
}) {
  return (
    <div role="tablist" className={cn("mb-6 flex gap-5 overflow-x-auto border-b", className)}>
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}
          className={cn("-mb-px flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 pb-2.5 pt-1 text-sm font-medium transition-colors",
            value === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
          {t.label}
          {t.count != null && <span className={cn("rounded-full px-1.5 text-xs tnum", value === t.id ? "bg-primary/10 text-primary" : "bg-muted")}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------- Layout pieces ---------- */
export function Section({ title, description, action, children, className }: {
  title: ReactNode; description?: ReactNode | undefined; action?: ReactNode | undefined; children?: ReactNode; className?: string | undefined;
}) {
  return (
    <section className={cn("border-t py-7 first-of-type:border-t-0 first-of-type:pt-0", className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-2xl">
          <h2 className="text-base font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Label on the left, value in the middle, optional action on the right. */
export function Row({ label, hint, children, action }: { label: ReactNode; hint?: ReactNode | undefined; children?: ReactNode; action?: ReactNode | undefined }) {
  return (
    <div className="grid gap-1 border-b py-3.5 last:border-b-0 sm:grid-cols-[200px_1fr_auto] sm:items-center sm:gap-4">
      <div className="text-sm font-medium">{label}{hint && <p className="text-xs font-normal text-muted-foreground">{hint}</p>}</div>
      <div className="min-w-0 text-sm">{children}</div>
      {action && <div className="sm:justify-self-end">{action}</div>}
    </div>
  );
}

export function ToggleRow({ label, description, checked, onChange, locked, unavailable }: {
  label: ReactNode; description?: ReactNode | undefined; checked: boolean; onChange: (v: boolean) => void;
  /** Always on — explain why. */ locked?: string | undefined;
  /** Can't be turned on — explain why. */ unavailable?: string | undefined;
}) {
  const reason = locked ?? unavailable;
  const control = <Switch checked={locked ? true : unavailable ? false : checked} onCheckedChange={onChange} disabled={!!reason} aria-label={typeof label === "string" ? label : undefined} />;
  return (
    <div className="flex items-start justify-between gap-6 border-b py-3.5 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        {reason && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Lock className="h-3 w-3" />{reason}</p>}
      </div>
      {control}
    </div>
  );
}

export function Hint({ children }: { children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild><button type="button" className="inline-grid h-4 w-4 place-items-center align-middle text-muted-foreground hover:text-foreground" aria-label="More info"><Info className="h-3.5 w-3.5" /></button></TooltipTrigger>
      <TooltipContent className="max-w-xs bg-blackwood text-blackwood-foreground">{children}</TooltipContent>
    </Tooltip>
  );
}

export function Callout({ tone = "info", children, action }: { tone?: "info" | "warning" | "danger"; children: ReactNode; action?: ReactNode }) {
  const cls = { info: "border-border bg-muted/50", warning: "border-warning/40 bg-warning/10", danger: "border-destructive/30 bg-destructive/5" }[tone];
  return (
    <div className={cn("flex flex-wrap items-start gap-2.5 rounded-lg border px-4 py-3 text-sm", cls)}>
      <Info className={cn("mt-0.5 h-4 w-4 shrink-0", tone === "danger" ? "text-destructive" : tone === "warning" ? "text-warning-foreground" : "text-muted-foreground")} />
      <div className="min-w-0 flex-1">{children}</div>
      {action}
    </div>
  );
}

export const INPUT = "field h-9 text-sm";
export const SELECT = "field h-9 text-sm";
export const TEXTAREA = "field h-24 py-2 text-sm";

/* ---------- Unsaved changes ---------- */
/**
 * Keeps an editable copy of saved settings. `dirty` drives the save bar, and leaving the page
 * (or closing the tab) with unsaved edits asks for confirmation first.
 */
export function useDraft<T>(saved: T) {
  const [draft, setDraft] = useState<T>(saved);
  const savedKey = JSON.stringify(saved);
  const dirty = JSON.stringify(draft) !== savedKey;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  // Pick up outside changes (another tab of this page, a reset) when there are no local edits.
  useEffect(() => { if (!dirtyRef.current) setDraft(saved); }, [savedKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useBlocker({
    shouldBlockFn: () => (dirtyRef.current ? !window.confirm("You have unsaved changes. Leave and discard them?") : false),
    enableBeforeUnload: () => dirtyRef.current,
  });
  const set = (patch: Partial<T>) => setDraft((d) => ({ ...d, ...patch }));
  return { draft, set, setDraft, dirty, reset: () => setDraft(saved) };
}

/** Sticky bar shown while a form has unsaved changes. */
export function SaveBar({ dirty, onSave, onCancel, disabled, message = "You have unsaved changes", saveLabel = "Save changes" }: {
  dirty: boolean; onSave: () => void | { error?: string | undefined }; onCancel: () => void; disabled?: boolean | undefined; message?: string | undefined; saveLabel?: string | undefined;
}) {
  const canEdit = useCanEdit();
  const [saving, setSaving] = useState(false);
  if (!dirty || !canEdit) return null;
  const save = () => {
    setSaving(true);
    setTimeout(() => {
      const r = onSave();
      setSaving(false);
      if (r && r.error) toast.error(r.error);
    }, 450);
  };
  return (
    <div className="sticky bottom-4 z-10 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 shadow-lg" role="region" aria-label="Unsaved changes">
      <p className="flex items-center gap-2 text-sm font-medium"><span className="h-2 w-2 rounded-full bg-primary" />{message}</p>
      <div className="flex gap-2">
        <button type="button" className="btn btn-outline h-9 text-sm" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="button" className="btn btn-primary h-9 text-sm" onClick={save} disabled={saving || disabled}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}{saving ? "Saving…" : saveLabel}
        </button>
      </div>
    </div>
  );
}

/* ---------- Row actions ---------- */
export type MenuItem = { label: string; onSelect: () => void; danger?: boolean | undefined; disabled?: string | boolean | undefined; separatorBefore?: boolean | undefined; heading?: string | undefined };

export function RowMenu({ items, label = "Actions" }: { items: MenuItem[]; label?: string | undefined }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={label} onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel className="text-sm font-bold">{label}</DropdownMenuLabel>
        {items.map((it) => (
          <div key={it.label}>
            {it.separatorBefore && <DropdownMenuSeparator />}
            <DropdownMenuItem disabled={!!it.disabled} onSelect={it.onSelect} title={typeof it.disabled === "string" ? it.disabled : undefined}
              className={cn(it.danger && "text-destructive focus:text-destructive")}>
              {it.label}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Simple "this needs a real service" dialog with one button. */
export function InfoDialog({ open, onOpenChange, title, children }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; children: ReactNode }) {
  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={title} footer={<button className="btn btn-primary h-9 text-sm" onClick={() => onOpenChange(false)}>Got it</button>}>
      <div className="space-y-3 text-sm text-muted-foreground">{children}</div>
    </FormDialog>
  );
}

/** Radio choices shown as bordered rows (used for access modes, schedules, behaviours). */
export function ChoiceList<T extends string>({ value, onChange, options, name }: {
  value: T; onChange: (v: T) => void; name: string;
  options: { id: T; label: string; description?: string | undefined; disabled?: string | undefined }[];
}) {
  return (
    <div className="space-y-2" role="radiogroup" aria-label={name}>
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} data-selected={value === o.id} disabled={!!o.disabled}
          onClick={() => onChange(o.id)} className="choice w-full items-start disabled:cursor-not-allowed disabled:opacity-50">
          <span className={cn("mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border", value === o.id ? "border-primary" : "border-input")}>
            {value === o.id && <span className="h-2 w-2 rounded-full bg-primary" />}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold">{o.label}</span>
            {o.description && <span className="mt-0.5 block text-xs text-muted-foreground">{o.description}</span>}
            {o.disabled && <span className="mt-0.5 block text-xs text-muted-foreground">{o.disabled}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}

/** Small round initials avatar for people in tables. */
export function Avatar({ name, className }: { name: string; className?: string | undefined }) {
  const initials = name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary text-[11px] font-semibold text-secondary-foreground", className)}>{initials}</span>;
}
