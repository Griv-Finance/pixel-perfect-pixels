import { differenceInCalendarDays, format, parseISO } from "date-fns";

/** Fixed "today" for the sample data so dates, filters and "overdue" stay consistent. */
export const DEMO_TODAY = new Date("2026-10-22T14:00:00+01:00");

export const DATE_RANGES = ["Today", "Last 7 days", "Last 30 days", "Last 90 days", "All time"] as const;
export type DateRange = (typeof DATE_RANGES)[number];

const DAYS: Record<DateRange, number> = { Today: 0, "Last 7 days": 6, "Last 30 days": 29, "Last 90 days": 89, "All time": Infinity };

export function inRange(iso: string, range: DateRange) {
  const diff = differenceInCalendarDays(DEMO_TODAY, parseISO(iso));
  return diff >= 0 ? diff <= DAYS[range] : range === "All time";
}

export const fmtDate = (iso: string) => format(parseISO(iso), "d MMM yyyy");
export const fmtDateTime = (iso: string) => format(parseISO(iso), "d MMM yyyy, HH:mm");
export const fmtTime = (iso: string) => format(parseISO(iso), "HH:mm");

/** ISO string N days (and optional hours) before DEMO_TODAY. Handy for building sample data. */
export function daysAgo(days: number, hour = 10, minute = 0) {
  const d = new Date(DEMO_TODAY);
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/** Current moment for newly created demo records. */
export const nowIso = () => new Date().toISOString();
