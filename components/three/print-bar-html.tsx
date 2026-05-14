"use client";

/**
 * components/three/print-bar-html.tsx — A-mode HTML-billboard print-bar.
 *
 * Drei `<Html transform>` billboard with native HTML <select> form
 * controls, used by `<PrintBar>` when the device reports
 * `(hover: hover)` returns no — touch-only devices where the B-mode
 * raycaster-hover UI doesn't have a natural input mechanism.
 */

import { Html } from "@react-three/drei";

import { quotePrint } from "lib/capabilities/commerce/print-order";
import {
  defaultVendorFor,
  type PrintFinishSlug,
  type PrintMaterialSlug,
  type PrintQuoteRequest,
  type PrintScaleSlug,
} from "lib/print-vendors";

import { capitalise } from "./print-bar-shared";

export function HtmlBar({
  y,
  z,
  request,
  quote,
  vendor,
  onChange,
  onSubmit,
}: {
  y: number;
  z: number;
  request: PrintQuoteRequest;
  quote: ReturnType<typeof quotePrint>;
  vendor: ReturnType<typeof defaultVendorFor>;
  onChange: (r: PrintQuoteRequest) => void;
  onSubmit: () => void;
}) {
  const material = vendor.materials.find((m) => m.slug === request.material);
  return (
    <group position={[0, y, z]}>
      <Html transform distanceFactor={4} center occlude={false}>
        <div className="rounded-sm border border-warm-black-700 bg-warm-black-950/95 px-4 py-3 text-xs text-chrome-200 shadow-xl backdrop-blur-md w-[420px] font-mono">
          <div className="flex items-baseline justify-between">
            <span className="text-chrome-400">{vendor.name}</span>
            <span
              className={
                quote.available ? "text-pink-200 text-base" : "text-rose-400"
              }
            >
              {quote.available ? `£${quote.priceGBP.toFixed(2)}` : "—"}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <label className="flex flex-col gap-1">
              <span className="chrome-label">material</span>
              <select
                className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-2 py-1 text-chrome-200"
                value={request.material}
                onChange={(e) =>
                  onChange({
                    ...request,
                    material: e.target.value as PrintMaterialSlug,
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
            <label className="flex flex-col gap-1">
              <span className="chrome-label">scale</span>
              <select
                className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-2 py-1 text-chrome-200"
                value={request.scale}
                onChange={(e) =>
                  onChange({
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
              <span className="chrome-label">finish</span>
              <select
                className="rounded-sm border border-warm-black-700 bg-warm-black-900 px-2 py-1 text-chrome-200"
                value={request.finish}
                onChange={(e) =>
                  onChange({
                    ...request,
                    finish: e.target.value as PrintFinishSlug,
                  })
                }
              >
                {(material?.finishes ?? []).map((f) => (
                  <option key={f} value={f}>
                    {capitalise(f)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-chrome-400">
              {quote.available
                ? `prints in ${quote.leadTime.printDays}d · +${quote.leadTime.shipDaysUK}d UK · ${quote.leadTime.shipsFrom}`
                : quote.unavailableReason ?? "combination unavailable"}
            </span>
            <button
              type="button"
              disabled={!quote.available}
              onClick={onSubmit}
              className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-3 py-1 chrome-label text-pink-100 hover:bg-pink-200/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              print to order
            </button>
          </div>
        </div>
      </Html>
    </group>
  );
}
