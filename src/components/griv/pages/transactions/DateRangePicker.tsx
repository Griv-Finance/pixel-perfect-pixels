import { format, subDays } from "date-fns";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { parseISO } from "date-fns";
import type { DateRange as RDPRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DEMO_TODAY, fmtDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

/**
 * "Date or period" picker, MailerSend-style: a bordered trigger showing the selected range,
 * a calendar to pick it, and quick presets below.
 */
export function DateRangePicker({ from, to, onChange }: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) {
  const iso = (d: Date) => format(d, "yyyy-MM-dd");
  const selected: RDPRange | undefined = from
    ? { from: parseISO(from), to: to ? parseISO(to) : parseISO(from) }
    : undefined;
  const preset = (days: number) => onChange(iso(subDays(DEMO_TODAY, days)), iso(DEMO_TODAY));
  const label = from
    ? `${fmtDate(from)} to ${fmtDate(to || from)}`
    : "Any date";
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex h-9 w-full items-center gap-2 rounded-lg border border-input bg-card px-3 text-left text-sm hover:bg-muted/40"
          aria-haspopup="dialog"
        >
          <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className={cn("min-w-0 flex-1 truncate", !from && "text-muted-foreground")}>{label}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="range"
          selected={selected}
          onSelect={(range) =>
            onChange(
              range?.from ? format(range.from, "yyyy-MM-dd") : "",
              range?.to ? format(range.to, "yyyy-MM-dd") : "",
            )
          }
          disabled={{ after: DEMO_TODAY }}
          defaultMonth={from ? parseISO(from) : DEMO_TODAY}
          numberOfMonths={2}
          className="pointer-events-auto p-3"
        />
        <div className="flex flex-wrap items-center gap-1.5 border-t p-2.5">
          {(
            [
              ["Today", 0],
              ["Last 7 days", 6],
              ["Last 30 days", 29],
              ["Last 90 days", 89],
            ] as const
          ).map(([label, days]) => (
            <button
              key={label}
              onClick={() => preset(days)}
              className="rounded-md border px-2 py-1 text-xs font-medium hover:bg-muted"
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => onChange("", "")}
            className="ml-auto text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
