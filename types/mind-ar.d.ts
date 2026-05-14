// Ambient declaration for mind-ar 1.2.5 (Three.js mode).
// No @types/mind-ar exists upstream; this types only the surface we use.
// If you add more mind-ar features, extend here.

declare module "mind-ar/dist/mindar-image-three.prod.js" {
  import type { Scene, PerspectiveCamera, WebGLRenderer, Group } from "three";

  export interface MindARThreeOptions {
    container: HTMLElement;
    imageTargetSrc: string;
    maxTrack?: number;
    uiLoading?: "yes" | "no" | string;
    uiScanning?: "yes" | "no" | string;
    uiError?: "yes" | "no" | string;
    filterMinCF?: number;
    filterBeta?: number;
    missTolerance?: number;
    warmupTolerance?: number;
  }

  export interface MindARAnchor {
    group: Group;
    onTargetFound?: () => void;
    onTargetLost?: () => void;
    onTargetUpdate?: () => void;
  }

  export class MindARThree {
    constructor(options: MindARThreeOptions);
    readonly renderer: WebGLRenderer;
    readonly scene: Scene;
    readonly camera: PerspectiveCamera;
    addAnchor(targetIndex: number): MindARAnchor;
    start(): Promise<void>;
    stop(): void;
    pause(keepVideo?: boolean): void;
    resume(): void;
  }
}
