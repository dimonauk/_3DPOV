/**
 * Type declarations for @mkkellogg/gaussian-splats-3d.
 *
 * The upstream package doesn't ship .d.ts files. This declaration
 * covers the Viewer surface we actually use in SplatViewer.tsx.
 * Loose `any` types for the enum members and option bags — the
 * library's runtime surface is stable enough but pinning concrete
 * types here is more brittle than it's worth.
 *
 * If the upstream package starts shipping types, delete this file.
 */

declare module "@mkkellogg/gaussian-splats-3d" {
  export const WebXRMode: {
    None: number;
    VR: number;
    AR: number;
  };

  export const SceneRevealMode: {
    Default: number;
    Gradual: number;
    Instant: number;
  };

  export const RenderMode: {
    Always: number;
    OnChange: number;
    Never: number;
  };

  export interface ViewerOptions {
    cameraUp?: [number, number, number];
    initialCameraPosition?: [number, number, number];
    initialCameraLookAt?: [number, number, number];
    rootElement?: HTMLElement;
    selfDrivenMode?: boolean;
    useBuiltInControls?: boolean;
    ignoreDevicePixelRatio?: boolean;
    gpuAcceleratedSort?: boolean;
    enableSIMDInSort?: boolean;
    sharedMemoryForWorkers?: boolean;
    sphericalHarmonicsDegree?: 0 | 1 | 2 | 3;
    dynamicScene?: boolean;
    sceneRevealMode?: number;
    renderMode?: number;
    webXRMode?: number;
    webXRSessionInit?: Record<string, unknown>;
    integerBasedSort?: boolean;
    splatSortDistanceMapPrecision?: number;
    renderer?: unknown;
    camera?: unknown;
  }

  export interface AddSplatSceneOptions {
    position?: [number, number, number];
    rotation?: [number, number, number, number];
    scale?: [number, number, number];
    splatAlphaRemovalThreshold?: number;
    showLoadingUI?: boolean;
    progressiveLoad?: boolean;
    format?: number;
  }

  export class Viewer {
    constructor(options?: ViewerOptions);
    addSplatScene(url: string, options?: AddSplatSceneOptions): Promise<void>;
    addSplatScenes(scenes: Array<{ path: string } & AddSplatSceneOptions>): Promise<void>;
    removeSplatScene(index: number): Promise<void>;
    getSplatScene(index: number): unknown;
    getSceneCount(): number;
    start(): void;
    stop(): void;
    update(): void;
    render(): void;
    dispose(): void;
    setRenderMode(mode: number): void;
  }

  /** Three.js-native splat layer for embedding inside an existing
   *  scene + renderer + camera. Used by the AR layer to overlay a
   *  splat scene without taking over the renderer. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const DropInViewer: any;
}
