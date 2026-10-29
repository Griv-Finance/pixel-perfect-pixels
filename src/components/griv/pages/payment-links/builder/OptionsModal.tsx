import { useState } from "react";
import { GripVertical, Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const MAX_OPTIONS = 10;

/** Compact "Add options" modal for dropdown custom fields: reorderable rows, counter, Cancel/Save. */
export function OptionsModal({ open, initial, onCancel, onSave }: {
  open: boolean; initial: string[]; onCancel: () => void; onSave: (options: string[]) => void;
}) {
  const [rows, setRows] = useState<string[]>(() => (initial.length ? [...initial] : ["", ""]));
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const clean = rows.map((r) => r.trim()).filter(Boolean);
  const saveable = clean.length >= 2;

  const setRow = (i: number, v: string) => setRows((rs) => rs.map((r, j) => (j === i ? v : r)));
  const move = (from: number, to: number) =>
    setRows((rs) => {
      const next = [...rs];
      const [row] = next.splice(from, 1);
      next.splice(to, 0, row!);
      return next;
    });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-md p-0">
        <div className="flex items-start justify-between gap-3 px-6 pt-5">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-base">Add options</DialogTitle>
            <DialogDescription className="text-xs">Your customer will be allowed to select only one option.</DialogDescription>
          </DialogHeader>
          <button className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:text-foreground" aria-label="Close" onClick={onCancel}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-80 space-y-2 overflow-y-auto px-6 py-4">
          {rows.map((row, i) => (
            <div
              key={i}
              draggable
              onDragStart={() => setDragFrom(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragFrom !== null && dragFrom !== i) move(dragFrom, i);
                setDragFrom(null);
              }}
              className={cn("flex items-center gap-2", dragFrom === i && "opacity-50")}
            >
              <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" aria-label="Drag to reorder" />
              <input
                className="field h-9 text-sm"
                value={row}
                aria-label={`Option ${i + 1}`}
                autoFocus={i === rows.length - 1 && !row}
                onChange={(e) => setRow(i, e.target.value)}
              />
              <button
                className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:text-foreground"
                aria-label="Remove option"
                onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <div className="flex items-center justify-between pt-1">
            <button
              className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              disabled={rows.length >= MAX_OPTIONS}
              onClick={() => setRows((rs) => [...rs, ""])}
            >
              <Plus className="h-4 w-4" />
              Add another option
              <kbd className="rounded border px-1 text-[10px] text-muted-foreground">⌘N</kbd>
            </button>
            <p className="text-xs text-muted-foreground tnum">{MAX_OPTIONS - rows.length} options left</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <button className="btn btn-outline h-9 text-sm" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary h-9 text-sm disabled:opacity-50" disabled={!saveable} onClick={() => onSave(clean)}>
            Save
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
