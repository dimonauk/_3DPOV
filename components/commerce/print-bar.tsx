"use client";

/**
 * components/commerce/print-bar.tsx — HTML print-bar (DOM, below-viewport).
 *
 * One-line role: the YouTube-style commerce strip that sits in the DOM
 * directly under any 3D viewport (or output blob). Vendor + scale +
 * finish + material dropdowns → live `quotePrint` on every change →
 * "Add to print order" click → `requestPrintQuote` mock → success line.
 *
 * Sibling of `components/three/print-bar.tsx` — that one renders INSIDE
 * the R3F canvas as 3D plates. This one is plain HTML for chambers
 * where the canvas already owns the 3D space (atelier, viewers) and
 * the bar slots in below the export controls.
 *
 * Voice: terse, lowercase body, sentence-case headings.
 * v0.1: capability returns mocked synchronous quotes + a mock order id.
 *
 * Full purpose in print-bar.PURPOSE.md.
 */

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";

import {
  defaultQuoteRequest,
  quotePrint,
  requestPrintQuote,
} from "lib/capabilities/commerce/print-order";
import { createLogger } from "lib/log";
import {
  defaultVendorFor,
  type PrintFinishSlug,
  type PrintMaterialSlug,
  type PrintQuoteRequest,
  type PrintScaleSlug,
} from "lib/print-vendors";

const log = createLogger("commerce:print-bar");

export type PrintBarSource = {
  kind: "stl" | "glb" | "ply";
  /** Object URL or remote URL of the geometry the bar quotes against. */
  url: string;
  /** Optional human label — drives the geometryId fallback. */
  label?: string;
};

export type PrintBarProps = {
  source: PrintBarSource;
  /** Optional override for the synthesised geometry id. */
  geometryId?: string;
  /** Fired when `requestPrintQuote` returns a mock order id. */
  onOrderReceived?: (orderId: string) => void;
};

type OrderState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "received"; orderId: string }
  | { kind: "unavailable"; reason: string };

export default function PrintBar({
  source,
  geometryId,
  onOrderReceived,
}: PrintBarProps) {
  const vendor = useMemo(() => defaultVendorFor("GB"), []);
  const resolvedGeometryId = useMemo(
    () => geometryId ?? `${source.kind}:${source.label ?? source.url}`,
    [geometryId, source.kind, source.label, source.url],
  );

  const [request, setRequest] = useState<PrintQuoteRequest>(() =>
    defaultQuoteRequest(resolvedGeometryId),
  );
  const [order, setOrder] = useState<OrderState>({ kind: "idle" });
  const [pending, startTransition] = useTransition();

  // Reset state on new geometry — different source → different default.
  useEffect(() => {
    setRequest(defaultQuoteRequest(resolvedGeometryId));
    setOrder({ kind: "idle" });
  }, [resolvedGeometryId]);

  const quote = useMemo(() => quotePrint(request), [request]);
  const material = vendor.materials.find((m) => m.slug === request.material);
  const allowedFinishes = material?.finishes ?? [];

  const onSubmit = useCallback(() => {
    setOrder({ kind: "submitting" });
    startTransition(async () => {
      const result = await requestPrintQuote(request);
      if (result.status === "received" && result.orderId) {
        log.info("print order received", { orderId: result.orderId, request });
        setOrder({ kind: "received", orderId: result.orderId });
        onOrderReceived?.(result.orderId);
      } else {
        log.warn("print order unavailable", {
          reason: result.reason,
          request,
        });
        setOrder({
          kind: "unavailable",
          reason: result.reason ?? "combination unavailable",
        });
      }
    });
  }, [onOrderReceived, request]);

  return (
    <section
      aria-label="Print this"
      className="rounded-sm border border-warm-black-700 bg-warm-black-950/95 px-4 py-3 font-mono text-xs text-chrome-200"
    >
      <header className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-sans tracking-tight text-chrome-100">
          Print this
        </h3>
        <span className="chrome-label text-chrome-500">{vendor.name}</span>
      </header>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
        <label className="flex flex-col gap-1">
          <span className="chrome-label text-chrome-400">Vendor</span>
          <select
            aria-label="Vendor"
            className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-2 py-1 text-chrome-200"
            value={vendor.id}
            disabled
          >
            <option value={vendor.id}>{vendor.name}</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="chrome-label text-chrome-400">Scale</span>
          <select
            aria-label="Scale"
            className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-2 py-1 text-chrome-200"
            value={request.scale}
            onChange={(e) =>
              setRequest({
                ...request,
                scale: e.target.value as PrintScaleSlug,
              })
            }
          >
            {vendor.scaleBands.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="chrome-label text-chrome-400">Finish</span>
          <select
            aria-label="Finish"
            className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-2 py-1 text-chrome-200"
            value={request.finish}
            onChange={(e) =>
              setRequest({
                ...request,
                finish: e.target.value as PrintFinishSlug,
              })
            }
          >
            {allowedFinishes.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="chrome-label text-chrome-400">Material</span>
          <select
            aria-label="Material"
            className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-2 py-1 text-chrome-200"
            value={request.material}
            onChange={(e) =>
              setRequest({
                ...request,
                material: e.target.value as PrintMaterialSlug,
                // material change can invalidate finish — fall back to raw.
                finish: "raw",
              })
            }
          >
            {vendor.materials.map((m) => (
              <option key={m.slug} value={m.slug}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-warm-black-800 pt-3">
        <div className="flex flex-col gap-0.5">
          <span
            className={
              quote.available
                ? "text-base text-pink-200"
                : "text-base text-rose-400"
            }
          >
            {pending
              ? "fetching quote…"
              : quote.available
                ? `From £${quote.priceGBP.toFixed(2)} · ${quote.leadTime.printDays + quote.leadTime.shipDaysUK} day(s) lead time`
                : "—"}
          </span>
          <span className="chrome-label text-chrome-500">
            {quote.available
              ? `prints in ${quote.leadTime.printDays}d · +${quote.leadTime.shipDaysUK}d UK · ships from ${quote.leadTime.shipsFrom}`
              : (quote.unavailableReason ?? "combination unavailable")}
          </span>
        </div>

        <button
          type="button"
          disabled={!quote.available || pending}
          onClick={onSubmit}
          className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-4 py-1.5 chrome-label text-pink-100 transition-colors hover:bg-pink-200/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "fetching quote…" : "Add to print order"}
        </button>
      </div>

      {order.kind === "received" ? (
        <p className="mt-2 rounded-sm border border-emerald-400/30 bg-emerald-900/10 px-3 py-2 text-emerald-200">
          order received · id {order.orderId} · the bench will confirm within
          one working day.
        </p>
      ) : null}

      {order.kind === "unavailable" ? (
        <p className="mt-2 rounded-sm border border-rose-400/40 bg-rose-900/10 px-3 py-2 text-rose-200">
          {order.reason}
        </p>
      ) : null}
    </section>
  );
}
