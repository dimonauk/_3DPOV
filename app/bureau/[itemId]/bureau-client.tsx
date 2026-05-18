"use client";

/**
 * app/bureau/[itemId]/bureau-client.tsx — Picker orchestrator.
 *
 * Three steps:
 *  1. Visitor picks size / paper / edition → "Get quote" hits
 *     /api/bureau/quote and shows the price summary.
 *  2. Visitor hits "Order this print" → an inline customer +
 *     shipping form reveals.
 *  3. Visitor submits → POST /api/bureau/order, redirect to
 *     /bureau/checkout/[orderId] for Stripe Elements payment.
 *
 * Slim orchestrator per ARCHITECTURE.md Rule 1. Picker form in
 * picker-form.tsx, quote summary in quote-summary.tsx, customer
 * form in customer-form.tsx, styles in bureau/styles.ts.
 *
 * Graceful credentials slot: if STRIPE_SECRET_KEY isn't set, the
 * order endpoint returns 503 stripe_not_configured. The form
 * surfaces the message; the visitor sees a clear "checkout not yet
 * enabled" without a crash.
 */

import { useRouter } from "next/navigation";
import { useState } from "react";

import type {
  EditionChoice,
  PaperChoice,
  Quote,
  SizeChoice,
} from "lib/bureau/types";

import { CustomerForm, type CustomerFormSubmission } from "./bureau/customer-form";
import { PickerForm } from "./bureau/picker-form";
import { QuoteSummary } from "./bureau/quote-summary";
import { BUREAU_PICKER_STYLES } from "./bureau/styles";
import type { QuoteState } from "./bureau/types";

const DEFAULT_SIZE: SizeChoice = "A2";
const DEFAULT_PAPER: PaperChoice = "canson-baryta-photographique";
const DEFAULT_EDITION: EditionChoice = "limited";

type OrderState =
  | { kind: "idle" }
  | { kind: "form" }
  | { kind: "creating" }
  | { kind: "error"; message: string };

export default function BureauClient({ itemId }: { itemId: string }) {
  const router = useRouter();

  const [sizeChoice, setSizeChoice] = useState<SizeChoice>(DEFAULT_SIZE);
  const [paperChoice, setPaperChoice] = useState<PaperChoice>(DEFAULT_PAPER);
  const [edition, setEdition] = useState<EditionChoice>(DEFAULT_EDITION);
  const [quoteState, setQuoteState] = useState<QuoteState>({ kind: "idle" });
  const [orderState, setOrderState] = useState<OrderState>({ kind: "idle" });

  const onQuoteSubmit = async () => {
    setQuoteState({ kind: "fetching" });
    setOrderState({ kind: "idle" }); // changing inputs cancels any open order form
    try {
      const res = await fetch("/api/bureau/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageId: itemId,
          sizeChoice,
          paperChoice,
          edition,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          message?: string;
        } | null;
        setQuoteState({
          kind: "error",
          message: body?.message ?? `Quote failed (${res.status}).`,
        });
        return;
      }
      const quote = (await res.json()) as Quote;
      setQuoteState({ kind: "ready", quote });
    } catch (err) {
      setQuoteState({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const onOrderRevealForm = () => {
    setOrderState({ kind: "form" });
  };

  const onOrderSubmit = async (customer: CustomerFormSubmission) => {
    setOrderState({ kind: "creating" });
    try {
      const res = await fetch("/api/bureau/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageId: itemId,
          sizeChoice,
          paperChoice,
          edition,
          customerEmail: customer.customerEmail,
          customerName: customer.customerName,
          shippingAddress: customer.shippingAddress,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          message?: string;
          error?: string;
        } | null;
        // Surface the server's reason verbatim; 503 stripe_not_configured
        // is the most likely path until credentials are slotted in.
        const message =
          body?.message ??
          (body?.error === "stripe_not_configured"
            ? "Stripe checkout isn't enabled yet — drop the studio an email and we'll take payment manually."
            : `Order failed (${res.status}).`);
        setOrderState({ kind: "error", message });
        return;
      }
      const { orderId } = (await res.json()) as { orderId: string };
      router.push(`/bureau/checkout/${encodeURIComponent(orderId)}`);
    } catch (err) {
      setOrderState({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  };

  return (
    <div className="bp-root">
      <header className="bp-header">
        <h1>Order a print</h1>
        <p>
          One-of-one (or one-of-25) fine-art print of{" "}
          <code>{itemId}</code>. Printed in the studio on a Canon PRO-1100,
          signed, hand-numbered for limited editions. UK shipping
          included.
        </p>
      </header>

      <PickerForm
        sizeChoice={sizeChoice}
        paperChoice={paperChoice}
        edition={edition}
        onSize={setSizeChoice}
        onPaper={setPaperChoice}
        onEdition={setEdition}
        onSubmit={onQuoteSubmit}
        busy={quoteState.kind === "fetching"}
      />

      <div>
        {quoteState.kind === "ready" && orderState.kind !== "form" && orderState.kind !== "creating" && (
          <QuoteSummary quote={quoteState.quote} onOrder={onOrderRevealForm} />
        )}

        {quoteState.kind === "ready" && (orderState.kind === "form" || orderState.kind === "creating") && (
          <CustomerForm
            onSubmit={onOrderSubmit}
            onCancel={() => setOrderState({ kind: "idle" })}
            busy={orderState.kind === "creating"}
            error={orderState.kind === "error" ? orderState.message : null}
          />
        )}

        {quoteState.kind === "ready" && orderState.kind === "error" && (
          <CustomerForm
            onSubmit={onOrderSubmit}
            onCancel={() => setOrderState({ kind: "idle" })}
            busy={false}
            error={orderState.message}
          />
        )}

        {quoteState.kind === "idle" && (
          <div className="bp-empty">
            Pick a size + paper + edition and tap <strong>Get quote</strong>{" "}
            to see the price.
          </div>
        )}
        {quoteState.kind === "fetching" && (
          <div className="bp-empty">Computing…</div>
        )}
        {quoteState.kind === "error" && (
          <div className="bp-empty">
            <div className="bp-error">{quoteState.message}</div>
          </div>
        )}
      </div>

      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx global>{BUREAU_PICKER_STYLES}</style>
    </div>
  );
}
