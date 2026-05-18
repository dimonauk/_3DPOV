"use client";

/**
 * app/bureau/[itemId]/bureau-client.tsx — Picker orchestrator.
 *
 * MVP loop:
 *  1. User lands on /bureau/<provenance-id> (from a chamber, or
 *     direct link).
 *  2. Three radio groups (size / paper / edition) — defaults to
 *     A2 + Canson Baryta + Limited (the studio's preferred path).
 *  3. "Get quote" POSTs to /api/bureau/quote, surfaces the Quote
 *     object as a sticky summary panel.
 *  4. "Order this print" CTA wires to the Stripe Payment Intent
 *     step in a follow-up commit; for now it just opens a clear
 *     "Stripe checkout coming soon" notice.
 *
 * Slim orchestrator per ARCHITECTURE.md Rule 1. Form lives in
 * picker-form.tsx, summary in quote-summary.tsx, styles in
 * bureau/styles.ts.
 */

import { useState } from "react";

import type {
  EditionChoice,
  PaperChoice,
  Quote,
  SizeChoice,
} from "lib/bureau/types";

import { PickerForm } from "./bureau/picker-form";
import { QuoteSummary } from "./bureau/quote-summary";
import { BUREAU_PICKER_STYLES } from "./bureau/styles";
import type { QuoteState } from "./bureau/types";

const DEFAULT_SIZE: SizeChoice = "A2";
const DEFAULT_PAPER: PaperChoice = "canson-baryta-photographique";
const DEFAULT_EDITION: EditionChoice = "limited";

export default function BureauClient({ itemId }: { itemId: string }) {
  const [sizeChoice, setSizeChoice] = useState<SizeChoice>(DEFAULT_SIZE);
  const [paperChoice, setPaperChoice] = useState<PaperChoice>(DEFAULT_PAPER);
  const [edition, setEdition] = useState<EditionChoice>(DEFAULT_EDITION);
  const [state, setState] = useState<QuoteState>({ kind: "idle" });

  const onSubmit = async () => {
    setState({ kind: "fetching" });
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
        setState({
          kind: "error",
          message: body?.message ?? `Quote failed (${res.status}).`,
        });
        return;
      }
      const quote = (await res.json()) as Quote;
      setState({ kind: "ready", quote });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const onOrder = () => {
    // TODO: wire to /api/bureau/order once the Stripe Payment Intent
    // step lands. Until then surface honestly.
    alert(
      "Stripe checkout is in the next commit — for now, the quote stands.",
    );
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
        onSubmit={onSubmit}
        busy={state.kind === "fetching"}
      />

      <div>
        {state.kind === "ready" && (
          <QuoteSummary quote={state.quote} onOrder={onOrder} />
        )}
        {state.kind === "idle" && (
          <div className="bp-empty">
            Pick a size + paper + edition and tap <strong>Get quote</strong>{" "}
            to see the price.
          </div>
        )}
        {state.kind === "fetching" && (
          <div className="bp-empty">Computing…</div>
        )}
        {state.kind === "error" && (
          <div className="bp-empty">
            <div className="bp-error">{state.message}</div>
          </div>
        )}
      </div>

      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx global>{BUREAU_PICKER_STYLES}</style>
    </div>
  );
}
