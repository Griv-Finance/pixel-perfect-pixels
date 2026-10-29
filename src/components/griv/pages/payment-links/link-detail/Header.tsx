import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, QrCode, Code2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CopyButton, Field, FormDialog } from "@/components/griv/kit";
import { linkUrl, linksStore } from "@/lib/demo/payment-links";
import { getExtras, setExtras } from "@/lib/demo/link-details";
import { toast } from "sonner";

const OUTLINE = "inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-md border border-input bg-card px-3 text-sm font-medium hover:bg-muted";

/** URL row with copy, the compact URL actions, and the ⋯ menu below. */
export function LinkHeader({ link, live, onEdit, onToggleStatus, onDemo }: {
  link: import("@/lib/demo/payment-links").PaymentLink;
  live: boolean;
  onEdit: () => void;
  onToggleStatus: () => void;
  /** Actions with no demo implementation: brand, domain… */
  onDemo: (what: string) => void;
}) {
  const [dialog, setDialog] = useState<null | "params" | "embed" | "qr" | "note" | "rename">(null);
  const [qr, setQr] = useState<string | null>(null);
  const [name, setName] = useState(link.name);
  const [note, setNote] = useState(getExtras(link.id).note ?? "");
  const [pairs, setPairs] = useState<{ name: string; value: string }[]>([{ name: "", value: "" }]);
  const extras = getExtras(link.id);
  const url = linkUrl(link);

  useEffect(() => {
    if (dialog !== "qr") return;
    let alive = true;
    setQr(null);
    (async () => {
      const QR = await import("qrcode");
      const data = await QR.toDataURL(url, { margin: 1, width: 360 });
      if (alive) setQr(data);
    })();
    return () => {
      alive = false;
    };
  }, [dialog, url]);

  const paramError = (p: { name: string; value: string }, i: number) => {
    if (!p.name && !p.value && pairs.length > 1) return "";
    if (!/^[A-Za-z0-9_-]+$/.test(p.name)) return "Use letters, numbers, dashes or underscores.";
    if (pairs.some((o, j) => j !== i && o.name === p.name)) return "This parameter name is already used.";
    if (!p.value) return "Enter a value.";
    return "";
  };
  const validPairs = pairs.filter((p) => p.name && p.value);
  const paramUrl = validPairs.length ? `${url}?${validPairs.map((p) => `${encodeURIComponent(p.name)}=${encodeURIComponent(p.value)}`).join("&")}` : url;

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-72 flex-1 items-center gap-2 rounded-md border border-input bg-card px-3 py-2">
          <code className="min-w-0 flex-1 truncate text-sm">{url}</code>
          <CopyButton value={url} label="Copy URL" iconOnly />
        </div>
        <button className={OUTLINE} onClick={() => setDialog("params")}>
          <Plus className="h-4 w-4" />
          Add URL parameters
        </button>
        <button className={OUTLINE} onClick={() => setDialog("embed")}>
          <Code2 className="h-4 w-4" />
          Embed buy button
        </button>
        <button className={OUTLINE} onClick={() => setDialog("qr")}>
          <QrCode className="h-4 w-4" />
          Download QR code
        </button>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="mt-2 grid h-7 w-7 place-items-center rounded-md border border-input bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="More actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem onClick={() => setDialog("rename")}>Change name</DropdownMenuItem>
          <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDialog("note")}>Add note</DropdownMenuItem>
          <DropdownMenuItem
            disabled={!live}
            onClick={() => onDemo("copy-to-live")}
          >
            Copy to live mode
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onToggleStatus}>
            {link.status === "Active" ? "Deactivate" : "Activate"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Add URL parameters */}
      <FormDialog
        open={dialog === "params"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Add URL parameters"
        description="Append parameters to this link's URL. Names may use letters, numbers, dashes and underscores."
        footer={
          <button className="btn btn-primary" onClick={() => { setDialog(null); toast.success("URL updated with your parameters"); }}>
            Done
          </button>
        }
      >
        <div className="space-y-4">
          {pairs.map((p, i) => {
            const error = paramError(p, i);
            return (
              <div key={i} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-start">
                <Field label="Parameter name" error={error}>
                  <input
                    className="field h-9 w-full text-sm"
                    value={p.name}
                    onChange={(e) => setPairs((v) => v.map((o, j) => (j === i ? { ...o, name: e.target.value } : o)))}
                    placeholder="utm_source"
                  />
                </Field>
                <Field label="Value">
                  <input
                    className="field h-9 w-full text-sm"
                    value={p.value}
                    onChange={(e) => setPairs((v) => v.map((o, j) => (j === i ? { ...o, value: e.target.value } : o)))}
                    placeholder="newsletter"
                  />
                </Field>
                {pairs.length > 1 && (
                  <button
                    className="mt-7 text-sm text-muted-foreground hover:text-destructive"
                    onClick={() => setPairs((v) => v.filter((_, j) => j !== i))}
                  >
                    Remove
                  </button>
                )}
              </div>
            );
          })}
          <button
            className="text-sm font-medium text-primary hover:underline"
            onClick={() => setPairs((v) => [...v, { name: "", value: "" }])}
          >
            + Add another parameter
          </button>
          <div className="rounded-md border border-input bg-muted/40 px-3 py-2">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Payment link URL with parameters</p>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate text-sm">{paramUrl}</code>
              <CopyButton value={paramUrl} label="Copy URL" iconOnly />
            </div>
          </div>
        </div>
      </FormDialog>

      {/* Embed */}
      <FormDialog
        open={dialog === "embed"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Embed buy button"
        description="Paste this code into your website to show a buy button for this payment link."
        footer={<CopyButton value={embedCode(url)} label="Copy code" className="btn btn-primary h-9 px-3 text-sm text-primary-foreground hover:no-underline" />}
      >
        <pre className="overflow-x-auto rounded-md border border-input bg-muted/40 p-3 text-xs leading-relaxed">{embedCode(url)}</pre>
      </FormDialog>

      {/* QR code */}
      <FormDialog
        open={dialog === "qr"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Download QR code"
        description={`A QR code for ${url}`}
        footer={
          qr ? (
            <a className="btn btn-primary" download={`griv-${link.slug}.png`} href={qr}>
              Download QR code
            </a>
          ) : null
        }
      >
        <div className="grid place-items-center rounded-md border border-input bg-card p-6">
          {qr ? <img src={qr} alt={`QR code for ${url}`} className="h-56 w-56" /> : <p className="text-sm text-muted-foreground">Generating…</p>}
        </div>
      </FormDialog>

      {/* Rename */}
      <FormDialog
        open={dialog === "rename"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Change name"
        footer={
          <button
            className="btn btn-primary"
            disabled={name.trim().length < 2}
            onClick={() => {
              linksStore.set((v) => v.map((x) => (x.id === link.id ? { ...x, name: name.trim() } : x)));
              setDialog(null);
              toast.success("Payment link renamed");
            }}
          >
            Save
          </button>
        }
      >
        <Field label="Payment link name" hint="The URL keeps working when you rename a link.">
          <input className="field h-9 w-full text-sm" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
      </FormDialog>

      {/* Note */}
      <FormDialog
        open={dialog === "note"}
        onOpenChange={(o) => !o && setDialog(null)}
        title={extras.note ? "Edit note" : "Add note"}
        description="Notes are only visible to your team."
        footer={
          <button
            className="btn btn-primary"
            onClick={() => {
              setExtras(link.id, { note: note.trim() });
              setDialog(null);
              toast.success(note.trim() ? "Note saved" : "Note removed");
            }}
          >
            Save
          </button>
        }
      >
        <Field label="Note" optional>
          <textarea className="field min-h-24 w-full text-sm" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. For the October promo campaign" />
        </Field>
      </FormDialog>
    </div>
  );
}

function embedCode(url: string) {
  return `<script async src="https://pay.griv.africa/embed.js"\n  data-payment-link="${url}"></script>`;
}
