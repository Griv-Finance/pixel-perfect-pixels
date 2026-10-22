import type { ReactNode } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/** Right-hand panel for a record's details. */
export function DetailDrawer({ open, onOpenChange, title, subtitle, badge, children, footer, wide }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: ReactNode; subtitle?: ReactNode; badge?: ReactNode;
  children: ReactNode; footer?: ReactNode; wide?: boolean;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={cn("flex w-full flex-col gap-0 p-0", wide ? "sm:max-w-2xl" : "sm:max-w-lg")}>
        <SheetHeader className="border-b px-6 py-5 text-left">
          <div className="flex flex-wrap items-center gap-2 pr-6">
            <SheetTitle className="text-xl">{title}</SheetTitle>
            {badge}
          </div>
          {subtitle ? <SheetDescription>{subtitle}</SheetDescription> : <SheetDescription className="sr-only">Details</SheetDescription>}
        </SheetHeader>
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t px-6 py-4">{footer}</div>}
      </SheetContent>
    </Sheet>
  );
}

/** Centered dialog for create/edit forms and multi-step flows. */
export function FormDialog({ open, onOpenChange, title, description, children, footer, size = "md" }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: ReactNode; description?: ReactNode;
  children: ReactNode; footer?: ReactNode; size?: "md" | "lg" | "xl";
}) {
  const w = { md: "sm:max-w-lg", lg: "sm:max-w-2xl", xl: "sm:max-w-4xl" }[size];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("flex max-h-[92vh] flex-col gap-0 p-0", w)}>
        <DialogHeader className="border-b px-6 py-5 text-left">
          <DialogTitle className="text-xl">{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : <DialogDescription className="sr-only">Form</DialogDescription>}
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t px-6 py-4">{footer}</div>}
      </DialogContent>
    </Dialog>
  );
}

/** "Are you sure?" dialog. Use danger for destructive or money-moving actions. */
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = "Confirm", danger, onConfirm, children }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; description?: ReactNode;
  confirmLabel?: string; danger?: boolean; onConfirm: () => void; children?: ReactNode;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className={danger ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-primary text-primary-foreground hover:bg-primary/90"}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
