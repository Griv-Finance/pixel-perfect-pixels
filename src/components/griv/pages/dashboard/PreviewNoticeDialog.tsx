import type { ReactNode } from "react";
import { FormDialog } from "@/components/griv/kit";

export type PreviewInfo = { title: string; description: string };

/** Honest preview: tells the user a flow isn't wired up in the demo instead of faking success. */
export function PreviewNoticeDialog({ preview, onClose }: { preview: PreviewInfo | null; onClose: () => void }) {
  return (
    <FormDialog
      open={!!preview}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={preview?.title ?? ""}
      description={preview?.description ?? ""}
      footer={
        <button type="button" onClick={onClose} className="btn btn-primary h-9 text-sm">
          Got it
        </button>
      }
    >
      <div className="flex items-start gap-3 rounded-lg border border-dashed border-input bg-muted/40 p-4 text-sm">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-primary font-semibold">i</span>
        <p className="text-muted-foreground">
          Nothing was submitted — this step isn't wired up in the demo yet. In the live product it would be fully functional.
        </p>
      </div>
      <p className="text-xs text-muted-foreground">Preview mode: sample data only, no real money moves.</p>
    </FormDialog>
  );
}

/** Convenience prop type shared by the state dashboards. */
export type PreviewTrigger = (p: PreviewInfo) => void;

export function PreviewButton({ onClick, className, children }: { onClick: () => void; className?: string; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={className ?? "btn btn-outline h-9 text-sm"}>
      {children}
    </button>
  );
}
