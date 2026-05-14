"use client";

/**
 * components/three/print-bar.tsx — The 3D print-bar (orchestrator).
 *
 * One-line role: shared commerce strip under every 3D viewport; B mode
 * (extruded plates + drei Text + raycaster) by default, A mode (drei Html
 * billboard with native HTML form controls) when the device reports
 * `(hover: hover)` returns no.
 *
 * Internals are split across three sibling files for the 300-line cap:
 *   - print-bar-shared.ts  → COLOUR + Column + capitalise
 *   - print-bar-3d.tsx     → PriceReadout + LeadTimeLine + PlateRow
 *   - print-bar-html.tsx   → HtmlBar
 *
 * Full purpose in print-bar.PURPOSE.md.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  defaultQuoteRequest,
  quotePrint,
  requestPrintQuote,
} from "lib/capabilities/commerce/print-order";
import {
  defaultVendorFor,
  type PrintQuoteRequest,
} from "lib/print-vendors";

import { LeadTimeLine, PlateRow, PriceReadout } from "./print-bar-3d";
import { HtmlBar } from "./print-bar-html";

export type PrintBarProps = {
  geometryId: string;
  /** Y offset under the model. Default places the bar just below scene-origin. */
  y?: number;
  /** Z offset toward camera. */
  z?: number;
  /** Optional onOrderReceived callback fired after `requestPrintQuote` resolves. */
  onOrderReceived?: (orderId: string) => void;
};

export default function PrintBar({
  geometryId,
  y = -1.4,
  z = 0,
  onOrderReceived,
}: PrintBarProps) {
  const vendor = useMemo(() => defaultVendorFor("GB"), []);
  const [request, setRequest] = useState<PrintQuoteRequest>(() =>
    defaultQuoteRequest(geometryId),
  );
  const [hoverable, setHoverable] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mm = window.matchMedia("(hover: hover)");
    const apply = () => setHoverable(mm.matches);
    apply();
    mm.addEventListener("change", apply);
    return () => mm.removeEventListener("change", apply);
  }, []);

  // Re-default when geometryId changes (different sculpture → different default).
  useEffect(() => {
    setRequest(defaultQuoteRequest(geometryId));
  }, [geometryId]);

  const quote = useMemo(() => quotePrint(request), [request]);

  const onSubmit = useCallback(async () => {
    const result = await requestPrintQuote(request);
    if (result.status === "received" && result.orderId) {
      onOrderReceived?.(result.orderId);
    }
  }, [request, onOrderReceived]);

  if (!hoverable) {
    return (
      <HtmlBar
        y={y}
        z={z}
        request={request}
        quote={quote}
        vendor={vendor}
        onChange={setRequest}
        onSubmit={onSubmit}
      />
    );
  }

  return (
    <group position={[0, y, z]}>
      <PriceReadout quote={quote} />
      <PlateRow
        request={request}
        vendor={vendor}
        onChange={setRequest}
        onSubmit={onSubmit}
        available={quote.available}
      />
      <LeadTimeLine quote={quote} />
    </group>
  );
}
