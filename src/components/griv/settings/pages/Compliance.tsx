import { useRef, useState } from "react";
import { CheckCircle2, CircleAlert, Clock, FileText, Plus, Upload, XCircle } from "lucide-react";
import { toast } from "sonner";
import { FormDialog, StatusBadge, Timeline } from "@/components/griv/kit";
import { fmtDate, fmtDateTime } from "@/lib/dates";
import {
  addHistory, docsStore, infoRequestsStore, overallVerification, peopleStore, validateDocFile, VERIFICATION_COPY, verificationHistoryStore,
  type ComplianceDoc, type DocStatus, type VerificationStatus,
} from "@/lib/demo/settings/business";
import { logAudit } from "@/lib/demo/settings/activity";
import { Callout, INPUT, InfoDialog, Section, SettingsPage, TEXTAREA, useCanEdit } from "../ui";
import { cn } from "@/lib/utils";

const docTone = (s: DocStatus) => (s === "Accepted" ? "success" : s === "In review" ? "pending" : s === "Rejected" || s === "Expired" ? "danger" : "neutral") as "success" | "pending" | "danger" | "neutral";
const STATUS_ICON: Record<VerificationStatus, typeof Clock> = { "Not started": CircleAlert, "In progress": Clock, "Pending review": Clock, Verified: CheckCircle2, "Requires action": CircleAlert, Rejected: XCircle };
const ALL_STATUSES = Object.keys(VERIFICATION_COPY) as VerificationStatus[];

export function CompliancePage() {
  const docs = docsStore.use();
  const people = peopleStore.use();
  const requests = infoRequestsStore.use();
  const history = verificationHistoryStore.use();
  const canEdit = useCanEdit();
  const fileRef = useRef<HTMLInputElement>(null);
  const [target, setTarget] = useState<ComplianceDoc | null>(null);
  const [uploads, setUploads] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [answer, setAnswer] = useState<Record<string, string>>({});
  const [person, setPerson] = useState<null | { name: string; role: string; ownership: string }>(null);
  const [personErr, setPersonErr] = useState<string | null>(null);
  const [stored, setStored] = useState<ComplianceDoc | null>(null);
  const open = requests.filter((r) => r.status === "Open").length;
  const status = overallVerification(docs, open);
  const copy = VERIFICATION_COPY[status];
  const Icon = STATUS_ICON[status];
  const ownership = people.reduce((n, p) => n + (p.ownership ?? 0), 0);

  const pickFor = (d: ComplianceDoc) => { setTarget(d); fileRef.current?.click(); };
  const onFile = (f: File | undefined) => {
    if (!f || !target) return;
    const err = validateDocFile(f);
    if (err) { toast.error(err); return; }
    const d = target;
    setUploading(d.id);
    setTimeout(() => {
      const now = new Date().toISOString();
      docsStore.set((all) => all.map((x) => (x.id === d.id ? { ...x, status: "In review", fileName: f.name, uploadedAt: x.uploadedAt ?? now, updatedAt: now, note: undefined } : x)));
      setUploads((u) => ({ ...u, [d.id]: URL.createObjectURL(f) }));
      addHistory(`${d.name} ${d.fileName ? "replaced" : "uploaded"}`, f.name);
      logAudit(d.fileName ? "Compliance document replaced" : "Compliance document uploaded", "Compliance", d.name, { result: "Pending review", after: { File: f.name, Status: "In review" } });
      toast.success("Uploaded — now waiting for review", { description: "Documents are only accepted after Griv's compliance team checks them." });
      setUploading(null);
    }, 700);
  };

  const viewDoc = (d: ComplianceDoc, download?: boolean) => {
    const url = uploads[d.id];
    if (!url) { setStored(d); return; }
    if (download) { const a = document.createElement("a"); a.href = url; a.download = d.fileName ?? "document"; a.click(); }
    else window.open(url, "_blank", "noopener");
  };

  const sections: ComplianceDoc["section"][] = ["Business", "Tax", "Ownership"];

  return (
    <SettingsPage slug="compliance" wide>
      <section className="mb-8 rounded-xl border p-5">
        <div className="flex flex-wrap items-start gap-4">
          <span className={cn("grid h-10 w-10 place-items-center rounded-lg", status === "Verified" ? "bg-success text-success-foreground" : status === "Rejected" ? "bg-destructive/10 text-destructive" : status === "Requires action" ? "bg-warning/15 text-warning-foreground" : "bg-muted")}><Icon className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><h2 className="text-base font-semibold">{copy.title}</h2><StatusBadge status={status} tone={status === "Verified" ? "success" : status === "Rejected" ? "danger" : status === "Requires action" ? "warning" : status === "Not started" ? "neutral" : "pending"} /></div>
            <p className="mt-1 text-sm text-muted-foreground">{copy.body}</p>
            <p className="mt-2 text-sm"><span className="font-semibold">Next step:</span> {copy.next}</p>
          </div>
        </div>
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer font-medium text-primary">What each status means</summary>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">{ALL_STATUSES.map((s) => <div key={s}><dt className="font-medium">{s}</dt><dd className="text-xs text-muted-foreground">{VERIFICATION_COPY[s].body}</dd></div>)}</dl>
        </details>
      </section>

      {requests.length > 0 && (
        <Section title="Additional information requests" description="Questions from Griv's compliance reviewers.">
          <div className="space-y-3">{requests.map((r) => (
            <div key={r.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold">{r.title}</p><StatusBadge status={r.status} tone={r.status === "Open" ? "warning" : "success"} /></div>
              <p className="mt-1 text-sm text-muted-foreground">{r.detail}</p>
              <p className="mt-1 text-xs text-muted-foreground">Asked {fmtDateTime(r.askedAt)}</p>
              {r.status === "Open" ? (canEdit && (
                <div className="mt-3 space-y-2">
                  <textarea className={TEXTAREA} placeholder="Your answer" value={answer[r.id] ?? ""} onChange={(e) => setAnswer({ ...answer, [r.id]: e.target.value })} />
                  <button className="btn btn-primary h-9 text-sm" disabled={(answer[r.id] ?? "").trim().length < 10} onClick={() => {
                    infoRequestsStore.set((all) => all.map((x) => (x.id === r.id ? { ...x, status: "Answered", answer: answer[r.id]!.trim() } : x)));
                    addHistory("Additional information sent", r.title, "info");
                    logAudit("Compliance request answered", "Compliance", r.title, { result: "Pending review" });
                    toast.success("Answer sent to the reviewer");
                  }}>Send answer</button>
                  <p className="text-xs text-muted-foreground">At least 10 characters.</p>
                </div>
              )) : <p className="mt-2 rounded-md bg-muted/60 px-3 py-2 text-sm">{r.answer}</p>}
            </div>
          ))}</div>
        </Section>
      )}

      <Section title="Documents" description="PDF, JPG or PNG, up to 10 MB each. Uploading sends a document for review — it isn't accepted until a reviewer checks it.">
        <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" aria-label="Choose document file" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
        {sections.map((sec) => (
          <div key={sec} className="mb-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{sec === "Tax" ? "Tax documents" : sec === "Ownership" ? "Ownership" : "Business documents"}</p>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/40 text-left text-xs font-semibold tracking-[0.08em] text-muted-foreground">
                  <th className="px-4 py-2.5">Document</th><th className="hidden px-4 py-2.5 md:table-cell">Requirement</th><th className="px-4 py-2.5">Status</th>
                  <th className="hidden px-4 py-2.5 lg:table-cell">Uploaded</th><th className="hidden px-4 py-2.5 lg:table-cell">Last updated</th><th className="px-4 py-2.5 text-right">Action</th></tr></thead>
                <tbody className="divide-y">{docs.filter((d) => d.section === sec).map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-3"><span className="flex items-start gap-2"><FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /><span><span className="font-medium">{d.name}</span>{d.fileName && <span className="block text-xs text-muted-foreground">{d.fileName}</span>}{d.note && <span className="block text-xs text-destructive">{d.note}</span>}</span></span></td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{d.requirement}</td>
                    <td className="px-4 py-3">{uploading === d.id ? <span className="text-xs text-muted-foreground">Uploading…</span> : <StatusBadge status={d.status} tone={docTone(d.status)} />}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{d.uploadedAt ? fmtDate(d.uploadedAt) : "—"}</td>
                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{d.updatedAt ? fmtDate(d.updatedAt) : "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-3">
                        {d.fileName && <button className="text-sm font-medium text-primary hover:underline" onClick={() => viewDoc(d)}>View</button>}
                        {d.fileName && <button className="text-sm font-medium text-primary hover:underline" onClick={() => viewDoc(d, true)}>Download</button>}
                        {canEdit && d.status !== "Accepted" && <button className="btn btn-outline h-8 px-3 text-xs" disabled={uploading === d.id} onClick={() => pickFor(d)}><Upload className="h-3.5 w-3.5" />{d.fileName ? "Replace" : "Upload"}</button>}
                      </span>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        ))}
      </Section>

      <Section title="Ownership and directors" description="Everyone who owns 5% or more, plus all directors and authorized representatives."
        action={canEdit ? <button className="btn btn-outline h-8 px-3 text-xs" onClick={() => { setPerson({ name: "", role: "Shareholder", ownership: "" }); setPersonErr(null); }}><Plus className="h-3.5 w-3.5" />Add person</button> : undefined}>
        {ownership < 100 && <div className="mb-3"><Callout tone="warning">Listed ownership adds up to {ownership}%. Add the remaining owners or explain it in the open request above.</Callout></div>}
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/40 text-left text-xs font-semibold tracking-[0.08em] text-muted-foreground"><th className="px-4 py-2.5">Name</th><th className="px-4 py-2.5">Role</th><th className="px-4 py-2.5 text-right">Ownership</th><th className="hidden px-4 py-2.5 md:table-cell">Nationality</th><th className="px-4 py-2.5">ID check</th></tr></thead>
            <tbody className="divide-y">{people.map((p) => (
              <tr key={p.id}><td className="px-4 py-3 font-medium">{p.name}</td><td className="px-4 py-3">{p.role}</td><td className="px-4 py-3 text-right tnum">{p.ownership != null ? `${p.ownership}%` : "—"}</td><td className="hidden px-4 py-3 md:table-cell">{p.nationality}</td>
                <td className="px-4 py-3"><StatusBadge status={p.idStatus} tone={p.idStatus === "Verified" ? "success" : p.idStatus === "In review" ? "pending" : "neutral"} /></td></tr>
            ))}</tbody>
          </table>
        </div>
      </Section>

      <Section title="Verification history"><Timeline events={history.map((h) => ({ label: h.label, time: fmtDateTime(h.at), note: h.note, tone: h.tone === "danger" ? "danger" : h.tone === "success" ? "success" : h.tone === "pending" ? "pending" : "info" }))} /></Section>

      <FormDialog open={!!person} onOpenChange={(o) => !o && setPerson(null)} title="Add owner or director" description="They'll be asked to verify their identity by email."
        footer={<><button className="btn btn-outline h-9 text-sm" onClick={() => setPerson(null)}>Cancel</button><button className="btn btn-primary h-9 text-sm" onClick={() => {
          if (!person) return;
          const own = person.ownership === "" ? null : Number(person.ownership);
          if (!person.name.trim()) return setPersonErr("Enter their full legal name.");
          if (own != null && (!(own >= 0) || own > 100)) return setPersonErr("Ownership must be between 0 and 100%.");
          if (own != null && ownership + own > 100) return setPersonErr(`That would bring ownership to ${ownership + own}%.`);
          peopleStore.set((all) => [...all, { id: `p_${Date.now().toString(36)}`, name: person.name.trim(), role: person.role, ownership: own, nationality: "Nigerian", idStatus: "Missing" }]);
          addHistory("Owner or director added", person.name.trim());
          logAudit("Ownership information changed", "Compliance", person.name.trim(), { result: "Pending review", after: { Role: person.role, Ownership: own != null ? `${own}%` : "—" } });
          toast.success("Person added — their ID check is still needed"); setPerson(null);
        }}>Add person</button></>}>
        {person && <div className="space-y-4">
          <label className="block text-sm font-medium">Full legal name<input autoFocus className={`${INPUT} mt-1.5`} value={person.name} onChange={(e) => setPerson({ ...person, name: e.target.value })} /></label>
          <label className="block text-sm font-medium">Role<select className={`${INPUT} mt-1.5`} value={person.role} onChange={(e) => setPerson({ ...person, role: e.target.value })}>{["Shareholder", "Director", "Director, shareholder", "Authorized representative"].map((r) => <option key={r}>{r}</option>)}</select></label>
          <label className="block text-sm font-medium">Ownership % <span className="font-normal text-muted-foreground">(leave empty if none)</span><input type="number" min={0} max={100} className={`${INPUT} mt-1.5`} value={person.ownership} onChange={(e) => setPerson({ ...person, ownership: e.target.value })} /></label>
          {personErr && <p className="text-xs font-medium text-destructive" role="alert">{personErr}</p>}
        </div>}
      </FormDialog>
      <InfoDialog open={!!stored} onOpenChange={(o) => !o && setStored(null)} title={stored?.fileName ?? "Document"}>
        <p>This sample file was “uploaded” before this demo session, so there's no copy to open. Files you upload now can be viewed and downloaded until you reload the page.</p>
      </InfoDialog>
    </SettingsPage>
  );
}
