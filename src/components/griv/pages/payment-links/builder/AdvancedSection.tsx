import { useState } from "react";
import { ChevronDown, GripVertical, Plus, X } from "lucide-react";
import { OptionsModal } from "./OptionsModal";
import { cn } from "@/lib/utils";
import { ctaOptions, uid, type BuilderConfig, type ConfigErrors } from "@/lib/demo/link-builder";

/** Part E/F — Advanced options: custom fields, promotions, tax IDs, terms and call-to-action. */
export function AdvancedSection({ cfg, update, errors }: {
  cfg: BuilderConfig; update: (fn: (c: BuilderConfig) => BuilderConfig) => void; errors: ConfigErrors;
}) {
  const [open, setOpen] = useState(false);
  const [editingOptions, setEditingOptions] = useState<string | null>(null);
  const a = cfg.advanced;
  const patch = (over: Partial<BuilderConfig["advanced"]>) => update((c) => ({ ...c, advanced: { ...c.advanced, ...over } }));
  const patchField = (id: string, over: Partial<BuilderConfig["advanced"]["fields"][number]>) =>
    patch({ fields: a.fields.map((f) => (f.uid === id ? { ...f, ...over } : f)) });
  const fieldError = (uidValue: string, key: "label" | "options") => errors[`field.${uidValue}.${key}` as const];

  return (
    <section className="mt-8">
      <button className="flex items-center gap-1.5 text-sm font-semibold" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        Advanced options
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="mt-4 space-y-3.5">
          <label className="flex items-start gap-2.5 text-sm font-medium">
            <input type="checkbox" className="mt-0.5" checked={a.fields.length > 0} onChange={(e) => patch({ fields: e.target.checked ? [newField()] : [] })} />
            <span>Add custom fields</span>
          </label>

          {a.fields.map((f) => (
            <div key={f.uid} className="rounded-lg border p-4">
              <div className="grid grid-cols-[minmax(0,140px)_minmax(0,1fr)_auto] items-center gap-2">
                <select
                  className="field h-9 text-sm"
                  aria-label="Field type"
                  value={f.type}
                  onChange={(e) => patchField(f.uid, { type: e.target.value as typeof f.type, options: e.target.value === "Dropdown" ? f.options : [] })}
                >
                  <option>Text</option>
                  <option>Numbers only</option>
                  <option>Dropdown</option>
                </select>
                <div>
                  <input
                    className={cn("field h-9 text-sm", fieldError(f.uid, "label") && "border-destructive")}
                    placeholder="Label"
                    aria-label="Field label"
                    value={f.label}
                    onChange={(e) => patchField(f.uid, { label: e.target.value })}
                  />
                  {fieldError(f.uid, "label") && <p className="mt-1 text-xs font-medium text-destructive" role="alert">{fieldError(f.uid, "label")}</p>}
                </div>
                <button
                  className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:text-foreground"
                  aria-label="Remove field"
                  onClick={() => patch({ fields: a.fields.filter((x) => x.uid !== f.uid) })}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {f.type === "Dropdown" ? (
                <>
                  <p className="mt-2 text-xs text-muted-foreground">Avoid asking for any information restricted or prohibited by law.</p>
                  <div className="mt-2 rounded-md border p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Options</p>
                    {f.options.filter((o) => o.trim()).length > 0 ? (
                      <>
                        <p className="mt-1 text-sm">{f.options.filter((o) => o.trim()).join(", ")}</p>
                        <button className="text-sm font-medium text-primary hover:underline" onClick={() => setEditingOptions(f.uid)}>
                          Edit options
                        </button>
                      </>
                    ) : (
                      <button className="mt-1 w-full rounded border border-dashed px-3 py-2 text-sm text-muted-foreground hover:bg-muted" onClick={() => setEditingOptions(f.uid)}>
                        Add options
                      </button>
                    )}
                    {fieldError(f.uid, "options") && <p className="mt-1 text-xs font-medium text-destructive" role="alert">{fieldError(f.uid, "options")}</p>}
                  </div>
                  <OptionalToggles f={f} patchField={patchField} withDefaultSelect />
                </>
              ) : (
                <>
                  <DefaultRow f={f} patchField={patchField} />
                  <LimitsRow f={f} patchField={patchField} />
                  <label className="mt-2 flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!f.required} onChange={(e) => patchField(f.uid, { required: !e.target.checked })} />
                    Mark as optional
                  </label>
                </>
              )}
            </div>
          ))}

          {a.fields.length > 0 && (
            <button
              className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              onClick={() => patch({ fields: [...a.fields, newField()] })}
            >
              <Plus className="h-4 w-4" />
              Add another field
            </button>
          )}

          <label className="flex items-start gap-2.5 text-sm font-medium">
            <input type="checkbox" className="mt-0.5" checked={a.promoCodes} onChange={(e) => patch({ promoCodes: e.target.checked })} />
            <span>Allow promotion codes</span>
          </label>
          <label className="flex items-start gap-2.5 text-sm font-medium">
            <input type="checkbox" className="mt-0.5" checked={a.taxIds} onChange={(e) => patch({ taxIds: e.target.checked })} />
            <span>Allow business customers to provide tax IDs</span>
          </label>
          <label className="flex items-start gap-2.5 text-sm font-medium">
            <input type="checkbox" className="mt-0.5" checked={a.savePaymentDetails} onChange={(e) => patch({ savePaymentDetails: e.target.checked })} />
            <span>Save payment details for future use</span>
          </label>
          <label className="flex items-start gap-2.5 text-sm font-medium">
            <input type="checkbox" className="mt-0.5" checked={a.requireTerms} onChange={(e) => patch({ requireTerms: e.target.checked })} />
            <span>Require customers to accept your terms of service</span>
          </label>

          <div className="flex items-center gap-2 pt-1 text-sm">
            <select className="field h-9 w-36 text-sm" aria-label="Call to action" value={a.cta || ctaOptions(cfg)[0]} onChange={(e) => patch({ cta: e.target.value })}>
              {ctaOptions(cfg).map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <span className="text-muted-foreground">as the call to action</span>
          </div>
        </div>
      )}

      {editingOptions && (
        <OptionsModal
          open
          initial={a.fields.find((f) => f.uid === editingOptions)?.options ?? []}
          onCancel={() => setEditingOptions(null)}
          onSave={(options) => {
            patchField(editingOptions, { options });
            setEditingOptions(null);
          }}
        />
      )}
    </section>
  );
}

function newField() {
  return { uid: uid("field"), type: "Text" as const, label: "", required: true, default: "", limitEnabled: false, limitKind: "At most" as const, limitA: 0, limitB: 0, options: [] };
}

function DefaultRow({ f, patchField }: { f: BuilderConfig["advanced"]["fields"][number]; patchField: (id: string, over: Partial<BuilderConfig["advanced"]["fields"][number]>) => void }) {
  const [enabled, setEnabled] = useState(f.default.length > 0);
  return (
    <>
      <label className="mt-2 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={enabled} onChange={(e) => { setEnabled(e.target.checked); patchField(f.uid, { default: e.target.checked ? f.default : "" }); }} />
        Set a default value
      </label>
      {enabled && (
        <input className="field mt-1.5 h-8 w-48 text-sm" aria-label="Default value" value={f.default} onChange={(e) => patchField(f.uid, { default: e.target.value })} />
      )}
    </>
  );
}

function LimitsRow({ f, patchField }: { f: BuilderConfig["advanced"]["fields"][number]; patchField: (id: string, over: Partial<BuilderConfig["advanced"]["fields"][number]>) => void }) {
  return (
    <>
      <label className="mt-2 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={f.limitEnabled} onChange={(e) => patchField(f.uid, { limitEnabled: e.target.checked })} />
        Set limits
      </label>
      {f.limitEnabled && (
        <div className="mt-1.5 flex items-center gap-2 text-sm">
          <select className="field h-8 w-24 text-sm" aria-label="Limit kind" value={f.limitKind} onChange={(e) => patchField(f.uid, { limitKind: e.target.value as "At least" | "At most" })}>
            <option>At least</option>
            <option>At most</option>
          </select>
          <input
            type="number"
            min={0}
            className="field h-8 w-16 text-sm"
            aria-label="Limit value"
            value={f.limitA || ""}
            onChange={(e) => patchField(f.uid, { limitA: Math.max(0, Number(e.target.value) || 0) })}
          />
          <span className="text-muted-foreground">characters</span>
        </div>
      )}
    </>
  );
}

function OptionalToggles({ f, patchField, withDefaultSelect }: {
  f: BuilderConfig["advanced"]["fields"][number];
  patchField: (id: string, over: Partial<BuilderConfig["advanced"]["fields"][number]>) => void;
  withDefaultSelect?: boolean;
}) {
  const [defaultEnabled, setDefaultEnabled] = useState(f.default.length > 0);
  return (
    <>
      <label className="mt-2 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={defaultEnabled}
          onChange={(e) => {
            setDefaultEnabled(e.target.checked);
            patchField(f.uid, { default: e.target.checked ? f.options.filter((o) => o.trim())[0] ?? "" : "" });
          }}
        />
        Set a default value
      </label>
      {defaultEnabled && withDefaultSelect && (
        <select className="field mt-1.5 h-8 w-48 text-sm" aria-label="Default option" value={f.default} onChange={(e) => patchField(f.uid, { default: e.target.value })}>
          <option value="">None</option>
          {f.options.filter((o) => o.trim()).map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      )}
      <label className="mt-2 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={!f.required} onChange={(e) => patchField(f.uid, { required: !e.target.checked })} />
        Mark as optional
      </label>
    </>
  );
}

export { GripVertical };
