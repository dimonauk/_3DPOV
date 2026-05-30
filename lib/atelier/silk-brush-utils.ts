import { ThreeEvent } from "@react-three/fiber";
import { createLogger } from "lib/log";
import { type BrushKind, type StrokeRecord } from "lib/state/silk-brush";
import * as THREE from "three";

const log = createLogger("atelier:silk-brush-utils");

export const BRUSH_LABEL: Record<BrushKind, string> = {
  neon: "Neon",
  particle: "Sparkle",
  keijiro: "Keijiro",
};

export const BRUSH_COLOUR: Record<BrushKind, string> = {
  neon: "#00f2ff",
  particle: "#ffb84d",
  keijiro: "#ff5fbf",
};

export function handlePointerDown(
  e: ThreeEvent<PointerEvent>,
  setCurrentStroke: (stroke: THREE.Vector3[] | null) => void,
) {
  e.stopPropagation();
  setCurrentStroke([e.point.clone()]);
}

export function handlePointerMove(
  e: ThreeEvent<PointerEvent>,
  currentStroke: THREE.Vector3[] | null,
  setCurrentStroke: (stroke: THREE.Vector3[] | null) => void,
) {
  if (!currentStroke) return;
  setCurrentStroke([...currentStroke, e.point.clone()]);
}

export function handlePointerUp(
  currentStroke: THREE.Vector3[] | null,
  activeBrush: BrushKind,
  addStroke: (stroke: StrokeRecord) => void,
  setCurrentStroke: (stroke: THREE.Vector3[] | null) => void,
) {
  if (currentStroke && currentStroke.length > 1) {
    addStroke({
      id: Date.now(),
      points: currentStroke,
      color: BRUSH_COLOUR[activeBrush],
      kind: activeBrush,
    });
  }
  setCurrentStroke(null);
}

export function clearAll(
  strokes: StrokeRecord[],
  setStrokes: (strokes: StrokeRecord[]) => void,
) {
  log.info("clear strokes", { count: strokes.length });
  setStrokes([]);
}
