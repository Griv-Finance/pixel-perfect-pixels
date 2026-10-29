/**
 * One place that decides how every status looks across the dashboard.
 * success = final and good, warning = needs action soon, danger = failed or terminal bad,
 * info = planned or partially done, neutral = inactive / not started.
 */
export type StatusTone = "success" | "pending" | "warning" | "danger" | "info" | "neutral";

const TONES: Record<StatusTone, string[]> = {
  success: ["Successful", "Paid", "Completed", "Confirmed", "Fulfilled", "Delivered", "Active", "Published", "In stock", "Settled", "Live", "Received", "Released"],
  pending: ["Pending", "Processing", "Initiated", "Awaiting confirmation", "Awaiting fulfilment", "Unfulfilled", "Shipped", "Awaiting payment", "Unpaid", "Sent", "In transit", "Provisioning", "Reversal pending", "Refund pending", "Held"],
  warning: ["Overdue", "Due soon"],
  danger: ["Failed", "Cancelled", "Declined", "Out of stock", "Suspended", "Reversed", "Rejected", "Expired"],
  info: ["Scheduled", "Partially paid", "Partially refunded", "Refunded", "Returned", "Low stock", "Partially fulfilled"],
  neutral: ["Draft", "Archived", "Inactive", "Deactivated", "Unpublished", "Closed", "Paused", "Not tracked"],
};

const LOOKUP = new Map<string, StatusTone>();
for (const [tone, list] of Object.entries(TONES) as [StatusTone, string[]][]) for (const s of list) LOOKUP.set(s.toLowerCase(), tone);

export const statusTone = (status: string): StatusTone => LOOKUP.get(status.toLowerCase()) ?? "neutral";

export const TONE_CLASS: Record<StatusTone, string> = {
  success: "bg-success text-success-foreground",
  pending: "bg-highlight text-highlight-foreground",
  warning: "bg-warning/15 text-warning-foreground",
  danger: "bg-destructive/10 text-destructive",
  info: "bg-accent text-primary",
  neutral: "bg-status-neutral text-status-neutral-foreground",
};

/** Soft, MailerSend-style badge colours for transaction statuses (soft background + readable text). */
const TXN_SOFT_CLASS: Record<string, string> = {
  Successful: "bg-success/20 text-success-foreground",
  Pending: "bg-warning/20 text-warning-foreground",
  Processing: "bg-blue-500/10 text-blue-700",
  Failed: "bg-destructive/10 text-destructive",
  Cancelled: "bg-status-neutral text-status-neutral-foreground",
  Reversed: "bg-purple-500/10 text-purple-700",
};

export const txnStatusClass = (status: string) =>
  TXN_SOFT_CLASS[status] ?? TONE_CLASS[statusTone(status)];
