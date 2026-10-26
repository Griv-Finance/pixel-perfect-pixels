import { DASHBOARD_STATES, STATE_LABELS, STATE_SHORT, setDashboardState, type DashboardState } from "@/lib/demo/dashboard";

/**
 * The permanent three-state preview control. Sample data only — switching states
 * never changes the merchant's real account status.
 */
export function StateSwitcher({ state }: { state: DashboardState }) {
  return (
    <label
      className="inline-flex h-9 max-w-full items-center rounded-lg border border-input bg-card pl-3 text-sm"
      title={`Preview how the dashboard looks for each merchant type. Sample data only — switching never changes your account. Current: ${STATE_LABELS[state]}`}
    >
      <span className="whitespace-nowrap text-muted-foreground">Preview dashboard state:</span>
      <select
        value={state}
        aria-label="Preview dashboard state"
        onChange={(e) => setDashboardState(e.target.value as DashboardState)}
        className="h-full min-w-0 cursor-pointer appearance-none bg-transparent pl-1.5 pr-6 font-medium outline-none"
      >
        {DASHBOARD_STATES.map((s) => (
          <option key={s} value={s}>
            {STATE_SHORT[s]}
          </option>
        ))}
      </select>
      <svg className="pointer-events-none -ml-6 h-3.5 w-3.5 shrink-0 text-muted-foreground" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path d="M5.5 7.5 10 12l4.5-4.5" stroke="currentColor" strokeWidth="1.6" fill="none" />
      </svg>
    </label>
  );
}
