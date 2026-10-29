import { useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Copy } from "lucide-react";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from "recharts";
import {
  DashboardPage,
  CopyButton,
  DetailList,
  EmptyState,
  StatusBadge,
  ConfirmDialog,
} from "@/components/griv/kit";
import { getLink, linkUrl, linksStore, priceLabel, useLinks } from "@/lib/demo/payment-links";
import { formatMoney } from "@/lib/money";
import { fmtDate } from "@/lib/dates";
import { LinkForm } from "./LinkForm";

/** Full page for one payment link — opened from the list, not a modal. */
export function LinkDetail() {
  const { linkId } = useParams({ from: "/payment-links/$linkId" });
  useLinks(); // keep the page in sync with edits made here or on the list
  const link = getLink(linkId);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (!link) {
    return (
      <DashboardPage title="Payment link" crumbs={[{ label: "Payments" }, { label: "Payment Links" }]}>
        <EmptyState
          title="Payment link not found"
          description="This sample link may have been renamed or the demo data was reset."
          action={
            <Link to="/payment-links" className="btn btn-outline">
              Back to Payment Links
            </Link>
          }
        />
      </DashboardPage>
    );
  }

  const copy = () =>
    navigator.clipboard
      .writeText(linkUrl(link))
      .then(() => toast.success("Link copied"))
      .catch(() => toast.error("Copy unavailable"));
  const toggle = () => {
    linksStore.set((v) => v.map((x) => (x.id === link.id ? { ...x, status: x.status === "Active" ? "Inactive" : "Active" } : x)));
    toast.success(`Demo link ${link.status === "Active" ? "deactivated" : "reactivated"}`);
    setConfirming(false);
  };
  const collected = link.payments.reduce((s, p) => s + p.amount, 0);

  return (
    <DashboardPage
      title={link.name}
      crumbs={[{ label: "Payments" }, { label: "Payment Links" }, { label: link.name }]}
      description={link.description || "Payment link details."}
      actions={
        <>
          <button className="btn btn-outline" onClick={copy}>
            <Copy className="h-4 w-4" />
            Copy URL
          </button>
          <button className="btn btn-outline" onClick={() => setEditing(true)}>
            Edit
          </button>
          {link.status !== "Expired" && (
            <button className="btn btn-primary" onClick={() => setConfirming(true)}>
              {link.status === "Active" ? "Deactivate" : "Reactivate"}
            </button>
          )}
        </>
      }
    >
      <Link
        to="/payment-links"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Payment Links
      </Link>

      <section className="panel space-y-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="break-all font-medium text-primary">{linkUrl(link)}</p>
          <StatusBadge status={link.status} />
        </div>
        <DetailList
          items={[
            ["Price", priceLabel(link)],
            ["Pricing model", link.model],
            ["Currency", link.currency],
            [
              "Phone / address",
              `${link.phone ? "Required" : "Not required"} / ${link.address ? "Required" : "Not required"}`,
            ],
            ["Expiry", link.expiry ? fmtDate(link.expiry) : "No expiry"],
            ["Redirect", link.redirect || "None"],
            ["Created", fmtDate(link.created)],
          ]}
        />
      </section>

      <section className="panel space-y-4 p-5 sm:p-6">
        <h2 className="font-semibold">What customers see</h2>
        <div className="mx-auto max-w-sm rounded-xl border bg-card p-6 text-center shadow-sm">
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Nova Retail</p>
          <h3 className="mt-2 text-lg font-semibold">{link.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{link.description || "Payment link"}</p>
          <p className="mt-4 text-2xl font-semibold tnum">{priceLabel(link)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{link.currency}</p>
          <button className="btn btn-primary mt-5 w-full" disabled>
            Pay now
          </button>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Checkout preview only — paying here isn't wired up in the demo.
          </p>
        </div>
      </section>

      <section className="panel space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Collection history</h2>
          <p className="text-sm text-muted-foreground">
            <span className="tnum font-semibold text-foreground">{link.payments.length}</span>{" "}
            {link.payments.length === 1 ? "payment" : "payments"}
            {link.payments.length > 0 && <> · {formatMoney(collected, link.currency)} collected</>}
          </p>
        </div>
        {link.payments.length ? (
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={link.payments.map((p) => ({ date: fmtDate(p.date), amount: p.amount }))}>
                <XAxis dataKey="date" fontSize={10} />
                <Tooltip formatter={(v) => formatMoney(Number(v), link.currency)} />
                <Bar dataKey="amount" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState title="No collections yet" />
        )}
      </section>

      {link.payments.length > 0 && (
        <section className="panel space-y-4 p-5 sm:p-6">
          <h2 className="font-semibold">Associated payments</h2>
          {link.payments.map((p) => (
            <div key={p.reference} className="flex justify-between gap-3 border-b pb-3 text-sm last:border-0">
              <div>
                {p.customer}
                <p className="text-xs text-muted-foreground">
                  {p.reference} · {fmtDate(p.date)}
                </p>
              </div>
              <div className="text-right">
                {formatMoney(p.amount, link.currency)}
                <p>
                  <StatusBadge status="Successful" />
                </p>
              </div>
            </div>
          ))}
        </section>
      )}

      <div className="mt-2">
        <CopyButton value={linkUrl(link)} label="Copy link" />
      </div>

      {editing && (
        <LinkForm
          link={link}
          onClose={() => setEditing(false)}
          onSave={(r) => {
            linksStore.set((v) => v.map((x) => (x.id === link.id ? { ...x, ...r, id: link.id } : x)));
            setEditing(false);
            toast.success("Demo payment link updated");
          }}
        />
      )}
      <ConfirmDialog
        open={confirming}
        onOpenChange={(o) => !o && setConfirming(false)}
        title={`${link.status === "Active" ? "Deactivate" : "Reactivate"} payment link?`}
        description="This changes the local sample link only. No live checkout is affected."
        onConfirm={toggle}
      />
    </DashboardPage>
  );
}
