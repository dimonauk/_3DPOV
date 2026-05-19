"use client";

/**
 * app/atelier/breeding-preview/preview-client.tsx
 *
 * State owner for the breeding preview: two kingdom slots, active slot, k
 * softness. Lays out the kingdom picker, three SDF canvases (parent A, blend,
 * parent B), and the softness slider.
 */

import { useState } from "react";

import KingdomPicker from "components/breeding/kingdom-picker";
import SdfCanvas from "components/breeding/sdf-canvas";
import SoftnessSlider from "components/breeding/softness-slider";
import { KINGDOMS, type KingdomId } from "lib/breeding/sdf-shaders";

export default function BreedingPreviewClient() {
  const [parentA, setParentA] = useState<KingdomId>(0);
  const [parentB, setParentB] = useState<KingdomId>(1);
  const [activeSlot, setActiveSlot] = useState<"A" | "B">("A");
  const [k, setK] = useState<number>(0.25);

  const pickKingdom = (id: KingdomId) => {
    if (activeSlot === "A") {
      setParentA(id);
      setActiveSlot("B");
    } else {
      setParentB(id);
      setActiveSlot("A");
    }
  };

  return (
    <div className="space-y-6">
      <KingdomPicker
        parentA={parentA}
        parentB={parentB}
        activeSlot={activeSlot}
        onSelectSlot={setActiveSlot}
        onPickKingdom={pickKingdom}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr]">
        <CanvasPanel
          label={`Parent A — ${KINGDOMS[parentA]?.label ?? "—"}`}
        >
          <SdfCanvas
            parentA={parentA}
            parentB={parentB}
            kSoftness={k}
            size={256}
            showOnly="A"
          />
        </CanvasPanel>

        <CanvasPanel
          label={`Blend — k = ${k.toFixed(4)}`}
          highlight
        >
          <SdfCanvas
            parentA={parentA}
            parentB={parentB}
            kSoftness={k}
            size={512}
          />
        </CanvasPanel>

        <CanvasPanel
          label={`Parent B — ${KINGDOMS[parentB]?.label ?? "—"}`}
        >
          <SdfCanvas
            parentA={parentA}
            parentB={parentB}
            kSoftness={k}
            size={256}
            showOnly="B"
          />
        </CanvasPanel>
      </div>

      <SoftnessSlider value={k} onChange={setK} />
    </div>
  );
}

function CanvasPanel({
  label,
  highlight,
  children,
}: {
  label: string;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        "rounded-sm border bg-warm-black-900/30 p-3 " +
        (highlight
          ? "border-pink-200/40"
          : "border-warm-black-800")
      }
    >
      <div className="chrome-label mb-2">{label}</div>
      <div className="flex justify-center">{children}</div>
    </div>
  );
}
