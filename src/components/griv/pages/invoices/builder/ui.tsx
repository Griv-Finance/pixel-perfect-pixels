import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const INPUT = "field h-9 w-full text-sm";
export const LINK_BTN = "inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline disabled:opacity-50";

/** One editor section: strong heading, optional helper text, thin divider between sections. */
export function EditorSection({ id, title, description, action, children }: {
  id?: string; title: string; description?: ReactNode; action?: ReactNode; children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-40 border-b py-6 first:pt-2 last:border-b-0">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Checkbox row with label, helper text and content revealed when checked. */
export function CheckRow({ id, checked, onChange, label, hint, disabled, children }: {
  id: string; checked: boolean; onChange: (v: boolean) => void; label: ReactNode; hint?: ReactNode; disabled?: boolean; children?: ReactNode;
}) {
  return (
    <div className="py-2">
      <label htmlFor={id} className={cn("flex cursor-pointer items-start gap-2.5", disabled && "cursor-not-allowed opacity-60")}>
        <input
          id={id}
          type="checkbox"
          className="mt-0.5 h-4 w-4 accent-primary"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="text-sm">
          <span className="font-medium">{label}</span>
          {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
        </span>
      </label>
      {checked && children && <div className="mt-2 pl-6.5">{children}</div>}
    </div>
  );
}

export function FieldError({ id, children }: { id?: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-xs font-medium text-destructive">
      {children}
    </p>
  );
}
