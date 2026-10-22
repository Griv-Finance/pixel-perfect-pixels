/**
 * One place that decides how every status looks across the dashboard.
 * success = final and good, pending = in progress / waiting, danger = failed or needs action,
 * info = planned or partially done, neutral = inactive / not started.
 */
export type StatusTone = "success" | "pending" | "danger" | "info" | "neutral";

const TONES: Record<StatusTone, string[]> = {
  success: ["Successful", "Paid", "Completed", "Confirmed", "Fulfilled", "Delivered", "Active", "Published", "In stock", "Settled", "Live", "Received"],
  pending: ["Pending", "Processing", "Initiated", "Awaiting confirmation", "Awaiting fulfilment", "Unfulfilled", "Shipped", "Awaiting payment", "Unpaid", "Sent", "In transit", "Provisioning", "Reversal pending", "Refund pending"],
  danger: ["Failed", "Overdue", "Cancelled", "Declined", "Out of stock", "Suspended", "Reversed", "Rejected", "Expired"],
  info: ["Scheduled", "Partially paid", "Partially refunded", "Refunded", "Returned", "Low stock", "Partially fulfilled"],
  neutral: ["Draft", "Archived", "Inactive", "Deactivated", "Unpublished", "Closed", "Paused", "Not tracked"],
};

const LOOKUP = new Map<string, StatusTone>();
for (const [tone, list] of Object.entries(TONES) as [StatusTone, string[]][]) for (const s of list) LOOKUP.set(s.toLowerCase(), tone);

export const statusTone = (status: string): StatusTone => LOOKUP.get(status.toLowerCase()) ?? "neutral";

export const TONE_CLASS: Record<StatusTone, string> = {
  success: "bg-success text-success-foreground",
  pending: "bg-highlight text-highlight-foreground",
  danger: "bg-destructive/10 text-destructive",
  info: "bg-accent text-primary",
  neutral: "bg-muted text-muted-foreground",
};
