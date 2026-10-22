import { useState } from "react";
import { toast } from "sonner";
import {
  DetailDrawer,
  DetailList,
  SectionTitle,
  StatusBadge,
  Timeline,
  Field,
  ConfirmDialog,
  ErrorState,
} from "@/components/griv/kit";
import { type Order, orderStore, totals } from "@/lib/demo/orders";
import { CUSTOMERS } from "@/lib/demo/customers";
import { formatMoney } from "@/lib/money";
import { fmtDateTime, nowIso } from "@/lib/dates";
export function OrderDetail({ order: o, onClose }: { order: Order; onClose: () => void }) {
  const [carrier, setCarrier] = useState(""),
    [tracking, setTracking] = useState(""),
    [note, setNote] = useState(""),
    [cancel, setCancel] = useState(false),
    [busy, setBusy] = useState(false);
  const customer = CUSTOMERS.find((c) => c.id === o.customerId)!;
  const t = totals(o);
  const update = (patch: Partial<Order>, label: string) => {
    orderStore.set((rows) =>
      rows.map((r) =>
        r.id === o.id ? { ...r, ...patch, events: [...r.events, { label, time: nowIso() }] } : r,
      ),
    );
    toast.success(`${label} · demo`);
  };
  const transition = async (status: Order["fulfilment"]) => {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 700));
    update(
      {
        fulfilment: status,
        ...(status === "Shipped" ? { carrier: carrier.trim(), tracking: tracking.trim() } : {}),
      },
      `Order ${status.toLowerCase()}`,
    );
    setBusy(false);
  };
  const print = () => {
    const frame = document.createElement("iframe");
    frame.style.position = "fixed";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.title = "Packing slip";
    document.body.appendChild(frame);
    const d = frame.contentDocument;
    if (!d) return;
    d.open();
    d.write("<html><head><title>Packing slip</title></head><body></body></html>");
    d.close();
    const add = (tag: string, text: string) => {
      const e = d.createElement(tag);
      e.textContent = text;
      d.body.appendChild(e);
    };
    add("h1", `Nova Retail · Packing slip ${o.id}`);
    add("p", `${customer.name} · ${customer.phone}`);
    add("p", `14 Market Road, ${customer.city}, ${customer.country}`);
    o.items.forEach((i) => add("p", `${i.quantity} × ${i.name} · ${i.variant} · ${i.sku}`));
    add("p", "Sample packing slip — not proof of payment");
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    setTimeout(() => frame.remove(), 1000);
  };
  return (
    <DetailDrawer
      open
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
      wide
      title={o.id}
      subtitle={`${fmtDateTime(o.date)} · ${o.channel}`}
      badge={
        <>
          <StatusBadge status={o.payment} />
          <StatusBadge status={o.fulfilment} />
        </>
      }
      footer={
        <button className="btn btn-outline" onClick={print}>
          Print packing slip
        </button>
      }
    >
      <SectionTitle>Customer & shipping</SectionTitle>
      <DetailList
        items={[
          ["Customer", customer.name],
          ["Email", customer.email],
          ["Phone", customer.phone],
          [
            "Shipping address",
            o.channel === "POS"
              ? "Pickup · Lekki shop"
              : `14 Market Road, ${customer.city}, ${customer.country}`,
          ],
        ]}
      />
      <section>
        <SectionTitle>Line items</SectionTitle>
        {o.items.map((i) => (
          <div key={i.sku} className="flex justify-between gap-3 border-b py-3 text-sm">
            <div>
              <p className="font-medium">{i.name}</p>
              <p className="text-xs text-muted-foreground">
                {i.variant} · {i.sku}
              </p>
              <p>
                {i.quantity} × {formatMoney(i.price)}
              </p>
            </div>
            <span>{formatMoney(i.quantity * i.price)}</span>
          </div>
        ))}
        <div className="mt-3">
          <DetailList
            items={[
              ["Subtotal", formatMoney(t.subtotal)],
              ["Discount", `−${formatMoney(o.discount)}`],
              ["VAT (7.5%)", formatMoney(t.vat)],
              ["Delivery", formatMoney(o.delivery)],
              ["Total · NGN", formatMoney(t.total)],
            ]}
          />
        </div>
      </section>
      <section>
        <SectionTitle>Payment & refund history</SectionTitle>
        {o.payment === "Failed" ? (
          <ErrorState
            title="Payment failed"
            description="Sample card authorization was declined. No payment was collected; ask the customer to use another method."
          />
        ) : (
          <Timeline
            events={[
              {
                label: o.payment === "Awaiting payment" ? "Awaiting payment" : "Payment recorded",
                time: fmtDateTime(o.date),
                note:
                  o.payment === "Awaiting payment"
                    ? "No provider confirmation received."
                    : `${formatMoney(t.total)} · sample bank transfer`,
              },
              ...(o.payment === "Refunded" || o.payment === "Partially refunded"
                ? [
                    {
                      label: o.payment,
                      time: fmtDateTime(o.date),
                      note: formatMoney(o.payment === "Refunded" ? t.total : t.total / 2),
                    },
                  ]
                : []),
              ...(o.refundPending
                ? [
                    {
                      label: "Refund pending",
                      time: "Awaiting provider confirmation",
                      note: "Demo only — no refund was sent.",
                    },
                  ]
                : []),
            ]}
          />
        )}
      </section>
      <section>
        <SectionTitle>Fulfilment</SectionTitle>
        {o.tracking && (
          <p className="mb-4 text-sm">
            {o.carrier} · Tracking: {o.tracking}
          </p>
        )}
        <Timeline events={o.events.map((e) => ({ ...e, time: fmtDateTime(e.time) }))} />
        <div className="mt-5 space-y-3">
          {o.fulfilment === "Unfulfilled" && (
            <button
              disabled={busy || o.payment !== "Paid"}
              className="btn btn-primary"
              onClick={() => transition("Processing")}
            >
              {busy ? "Updating…" : "Mark processing"}
            </button>
          )}
          {o.fulfilment === "Processing" && (
            <>
              <Field
                label="Carrier"
                error={!carrier.trim() ? "Enter a carrier." : (undefined as never)}
              >
                <input
                  aria-label="Carrier"
                  className="field"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                />
              </Field>
              <Field
                label="Tracking number"
                error={
                  !/^[A-Za-z0-9-]{5,40}$/.test(tracking)
                    ? "Use 5–40 letters, numbers or hyphens."
                    : (undefined as never)
                }
              >
                <input
                  aria-label="Tracking number"
                  className="field"
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                />
              </Field>
              <button
                className="btn btn-primary"
                disabled={busy || !carrier.trim() || !/^[A-Za-z0-9-]{5,40}$/.test(tracking)}
                onClick={() => transition("Shipped")}
              >
                {busy ? "Updating…" : "Fulfil & ship"}
              </button>
            </>
          )}
          {o.fulfilment === "Shipped" && (
            <button
              disabled={busy}
              className="btn btn-primary"
              onClick={() => transition("Delivered")}
            >
              Mark delivered
            </button>
          )}
          {["Unfulfilled", "Processing", "Shipped"].includes(o.fulfilment) && (
            <button className="btn btn-outline ml-2" onClick={() => setCancel(true)}>
              Cancel order
            </button>
          )}
          {o.payment !== "Paid" && o.fulfilment === "Unfulfilled" && (
            <p className="text-xs text-muted-foreground">
              Payment must be confirmed before processing.
            </p>
          )}
        </div>
      </section>
      <section>
        <SectionTitle>Order notes</SectionTitle>
        {o.notes.map((n, i) => (
          <p key={i} className="mb-2 rounded-lg bg-muted p-3 text-sm">
            {n}
          </p>
        ))}
        <Field label="Add an internal note">
          <textarea
            aria-label="Order note"
            className="field"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>
        <button
          className="btn btn-outline mt-3"
          disabled={!note.trim() || busy}
          onClick={async () => {
            setBusy(true);
            await new Promise((r) => setTimeout(r, 700));
            update({ notes: [...o.notes, note.trim()] }, "Note added");
            setNote("");
            setBusy(false);
          }}
        >
          Add note
        </button>
      </section>
      <ConfirmDialog
        open={cancel}
        onOpenChange={setCancel}
        title="Cancel this order?"
        description="Fulfilment will stop. For paid orders a refund remains pending provider confirmation. Demo only — no money is sent."
        confirmLabel="Cancel order"
        danger
        onConfirm={() => {
          update(
            {
              fulfilment: "Cancelled",
              refundPending: o.payment === "Paid" || o.payment === "Partially refunded",
            },
            "Order cancelled",
          );
          setCancel(false);
        }}
      />
    </DetailDrawer>
  );
}
