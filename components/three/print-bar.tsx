"use client";

/**
 * components/three/print-bar.tsx — The 3D print-bar.
 *
 * One-line role: shared commerce strip under every 3D viewport; B mode (extruded
 * plates + drei Text + raycaster) by default, A mode (drei Html billboard with
 * native HTML form controls) when the device reports `(hover: none)`.
 *
 * Full purpose in print-bar.PURPOSE.md.
 */

import { Html, RoundedBox, Text } from "@react-three/drei";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  defaultQuoteRequest,
  quotePrint,
  requestPrintQuote,
} from "lib/capabilities/commerce/print-order";
import {
  defaultVendorFor,
  type PrintFinishSlug,
  type PrintMaterialSlug,
  type PrintQuoteRequest,
  type PrintScaleSlug,
} from "lib/print-vendors";

/** Colours — chrome-on-midnight palette + spellpunk accents. */
const COLOUR = {
  plate: "#1a1a22",
  plateHover: "#2a2a36",
  plateSelected: "#ff66cc",
  text: "#e6e6f0",
  textDim: "#7d7d8f",
  accentCyan: "#00f3ff",
  accentGold: "#ffd700",
  unavailable: "#ff5566",
} as const;

/** A single column key — the four "tabs" of the bar. */
type Column = "material" | "scale" | "finish" | "action";

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

// ============================================================================
// B mode — 3D toolbar
// ============================================================================

function PriceReadout({
  quote,
}: {
  quote: ReturnType<typeof quotePrint>;
}) {
  const priceText = quote.available
    ? `£${quote.priceGBP.toFixed(2)}`
    : "—";
  return (
    <group position={[0, 0.7, 0]}>
      <Text
        fontSize={0.28}
        color={quote.available ? COLOUR.accentGold : COLOUR.unavailable}
        anchorX="center"
        anchorY="middle"
      >
        {priceText}
      </Text>
    </group>
  );
}

function LeadTimeLine({
  quote,
}: {
  quote: ReturnType<typeof quotePrint>;
}) {
  if (!quote.available) {
    return (
      <group position={[0, -0.5, 0]}>
        <Text
          fontSize={0.09}
          color={COLOUR.unavailable}
          anchorX="center"
          anchorY="middle"
          maxWidth={3.6}
          textAlign="center"
        >
          {quote.unavailableReason ?? "combination unavailable"}
        </Text>
      </group>
    );
  }
  const { printDays, shipDaysUK, shipsFrom } = quote.leadTime;
  return (
    <group position={[0, -0.5, 0]}>
      <Text
        fontSize={0.09}
        color={COLOUR.textDim}
        anchorX="center"
        anchorY="middle"
      >
        {`prints in ${printDays}d · +${shipDaysUK}d UK · ships from ${shipsFrom}`}
      </Text>
    </group>
  );
}

function PlateRow({
  request,
  vendor,
  onChange,
  onSubmit,
  available,
}: {
  request: PrintQuoteRequest;
  vendor: ReturnType<typeof defaultVendorFor>;
  onChange: (r: PrintQuoteRequest) => void;
  onSubmit: () => void;
  available: boolean;
}) {
  const [openColumn, setOpenColumn] = useState<Column | null>(null);

  const materialOptions = vendor.materials.map((m) => ({
    slug: m.slug as PrintMaterialSlug,
    label: m.label,
  }));
  const scaleOptions = vendor.scaleBands.map((b) => ({
    slug: b.slug as PrintScaleSlug,
    label: b.label,
  }));
  const finishOptions: { slug: PrintFinishSlug; label: string }[] = (() => {
    const material = vendor.materials.find((m) => m.slug === request.material);
    const allowed = material?.finishes ?? [];
    return allowed.map((f) => ({ slug: f, label: capitalise(f) }));
  })();

  const currentMaterialLabel =
    vendor.materials.find((m) => m.slug === request.material)?.label ?? "—";
  const currentScaleLabel =
    vendor.scaleBands.find((b) => b.slug === request.scale)?.label ?? "—";
  const currentFinishLabel = capitalise(request.finish);

  return (
    <group position={[0, 0, 0]}>
      <Plate
        x={-2.4}
        label="material"
        value={currentMaterialLabel}
        open={openColumn === "material"}
        onHover={() => setOpenColumn("material")}
        onLeave={() => setOpenColumn((c) => (c === "material" ? null : c))}
      >
        {openColumn === "material" &&
          materialOptions.map((opt, i) => (
            <OptionPlate
              key={opt.slug}
              y={(i + 1) * 0.46}
              label={opt.label}
              selected={opt.slug === request.material}
              onSelect={() => {
                onChange({ ...request, material: opt.slug, finish: "raw" });
                setOpenColumn(null);
              }}
            />
          ))}
      </Plate>

      <Plate
        x={-0.8}
        label="scale"
        value={currentScaleLabel}
        open={openColumn === "scale"}
        onHover={() => setOpenColumn("scale")}
        onLeave={() => setOpenColumn((c) => (c === "scale" ? null : c))}
      >
        {openColumn === "scale" &&
          scaleOptions.map((opt, i) => (
            <OptionPlate
              key={opt.slug}
              y={(i + 1) * 0.46}
              label={opt.label}
              selected={opt.slug === request.scale}
              onSelect={() => {
                onChange({ ...request, scale: opt.slug });
                setOpenColumn(null);
              }}
            />
          ))}
      </Plate>

      <Plate
        x={0.8}
        label="finish"
        value={currentFinishLabel}
        open={openColumn === "finish"}
        onHover={() => setOpenColumn("finish")}
        onLeave={() => setOpenColumn((c) => (c === "finish" ? null : c))}
      >
        {openColumn === "finish" &&
          finishOptions.map((opt, i) => (
            <OptionPlate
              key={opt.slug}
              y={(i + 1) * 0.46}
              label={opt.label}
              selected={opt.slug === request.finish}
              onSelect={() => {
                onChange({ ...request, finish: opt.slug });
                setOpenColumn(null);
              }}
            />
          ))}
      </Plate>

      <Plate
        x={2.4}
        label="action"
        value={available ? "print to order" : "unavailable"}
        accent
        open={false}
        onHover={() => undefined}
        onLeave={() => undefined}
        onClick={available ? onSubmit : undefined}
      />
    </group>
  );
}

function Plate({
  x,
  label,
  value,
  open,
  accent,
  onHover,
  onLeave,
  onClick,
  children,
}: {
  x: number;
  label: string;
  value: string;
  open: boolean;
  accent?: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const baseColour = accent
    ? open || hovered
      ? COLOUR.plateSelected
      : "#33222a"
    : open || hovered
      ? COLOUR.plateHover
      : COLOUR.plate;
  return (
    <group position={[x, 0, 0]}>
      <RoundedBox
        args={[1.45, 0.55, 0.12]}
        radius={0.06}
        smoothness={4}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover();
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          onLeave();
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        <meshStandardMaterial
          color={baseColour}
          metalness={0.85}
          roughness={0.25}
          emissive={accent && hovered ? COLOUR.accentCyan : "#000000"}
          emissiveIntensity={accent && hovered ? 0.35 : 0}
        />
      </RoundedBox>
      <Text
        position={[0, 0.12, 0.07]}
        fontSize={0.07}
        color={COLOUR.textDim}
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
      <Text
        position={[0, -0.08, 0.07]}
        fontSize={0.11}
        color={COLOUR.text}
        anchorX="center"
        anchorY="middle"
        maxWidth={1.3}
      >
        {value}
      </Text>
      {children}
    </group>
  );
}

function OptionPlate({
  y,
  label,
  selected,
  onSelect,
}: {
  y: number;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <group position={[0, y, 0.01]}>
      <RoundedBox
        args={[1.35, 0.38, 0.08]}
        radius={0.04}
        smoothness={4}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <meshStandardMaterial
          color={selected ? COLOUR.plateSelected : hovered ? COLOUR.plateHover : COLOUR.plate}
          metalness={0.7}
          roughness={0.35}
        />
      </RoundedBox>
      <Text
        position={[0, 0, 0.05]}
        fontSize={0.09}
        color={selected ? "#1a1a22" : COLOUR.text}
        anchorX="center"
        anchorY="middle"
        maxWidth={1.2}
      >
        {label}
      </Text>
    </group>
  );
}

// ============================================================================
// A mode — drei Html billboard, hover-less devices
// ============================================================================

function HtmlBar({
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

function capitalise(s: string): string {
  return s.length === 0 ? s : s[0]!.toUpperCase() + s.slice(1);
}
