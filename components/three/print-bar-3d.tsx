"use client";

/**
 * components/three/print-bar-3d.tsx — B-mode 3D toolbar.
 *
 * Three exports: PriceReadout (3D Text, gold/red), LeadTimeLine (3D Text
 * below the plates), PlateRow (four plates side-by-side, hover opens an
 * option-stack above each). The Plate + OptionPlate primitives are in
 * `./print-bar-3d-plate`.
 */

import { Text } from "@react-three/drei";
import { useState } from "react";

import { quotePrint } from "lib/capabilities/commerce/print-order";
import {
  defaultVendorFor,
  type PrintFinishSlug,
  type PrintMaterialSlug,
  type PrintQuoteRequest,
  type PrintScaleSlug,
} from "lib/print-vendors";

import { Plate, OptionPlate } from "./print-bar-3d-plate";
import { COLOUR, capitalise, type Column } from "./print-bar-shared";

export function PriceReadout({
  quote,
}: {
  quote: ReturnType<typeof quotePrint>;
}) {
  const priceText = quote.available ? `£${quote.priceGBP.toFixed(2)}` : "—";
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

export function LeadTimeLine({
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

export function PlateRow({
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
