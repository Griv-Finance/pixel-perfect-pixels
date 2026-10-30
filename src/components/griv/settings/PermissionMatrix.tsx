import { Check } from "lucide-react";
import { ACTIONS, RESOURCES, togglePermission, type Permission } from "@/lib/demo/settings/access";
import { cn } from "@/lib/utils";

/** Grid of products × actions. Only actions that make sense for a product get a box; turning on any action also turns on View. */
export function PermissionMatrix({ value, onChange, readOnly }: { value: Permission[]; onChange?: (v: Permission[]) => void; readOnly?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-xs font-semibold text-muted-foreground">
            <th className="sticky left-0 bg-muted/40 px-3 py-2 text-left">Product</th>
            {ACTIONS.map((a) => <th key={a} className="px-2 py-2 text-center capitalize">{a}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y">
          {RESOURCES.map((r) => (
            <tr key={r.id} className="hover:bg-muted/30">
              <td className="sticky left-0 whitespace-nowrap bg-card px-3 py-2 font-medium">{r.label}</td>
              {ACTIONS.map((a) => {
                const applies = (r.actions as readonly string[]).includes(a);
                const p = `${r.id}.${a}` as Permission;
                const on = value.includes(p);
                return (
                  <td key={a} className="px-2 py-2 text-center">
                    {!applies ? <span className="text-muted-foreground/40" aria-hidden>·</span> : readOnly ? (
                      on ? <Check className="mx-auto h-4 w-4 text-success-foreground" aria-label={`${a} ${r.label}: allowed`} /> : <span className="sr-only">{`${a} ${r.label}: not allowed`}</span>
                    ) : (
                      <input type="checkbox" className={cn("h-4 w-4 cursor-pointer accent-primary")} checked={on} aria-label={`${a} ${r.label}`}
                        onChange={() => onChange?.(togglePermission(value, p))} />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
