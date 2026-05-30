import { createLogger } from "lib/log";
import * as THREE from "three";
import { create } from "zustand";

const log = createLogger("state:silk-brush");

export type BrushKind = "neon" | "particle" | "keijiro";

export type StrokeRecord = {
  id: number;
  points: THREE.Vector3[];
  color: string;
  kind: BrushKind;
};

export interface SilkBrushState {
  activeBrush: BrushKind;
  strokes: StrokeRecord[];
  currentStroke: THREE.Vector3[] | null;

  setActiveBrush: (brush: BrushKind) => void;
  setStrokes: (strokes: StrokeRecord[]) => void;
  setCurrentStroke: (stroke: THREE.Vector3[] | null) => void;
  addStroke: (stroke: StrokeRecord) => void;

  reset: () => void;
}

const initialState = {
  activeBrush: "keijiro" as BrushKind,
  strokes: [] as StrokeRecord[],
  currentStroke: null as THREE.Vector3[] | null,
};

export const useSilkBrushStore = create<SilkBrushState>((set) => ({
  ...initialState,

  setActiveBrush: (activeBrush) => set({ activeBrush }),
  setStrokes: (strokes) => set({ strokes }),
  setCurrentStroke: (currentStroke) => set({ currentStroke }),
  addStroke: (stroke) =>
    set((state) => ({
      strokes: [...state.strokes, stroke],
    })),

  reset: () => set(initialState),
}));
