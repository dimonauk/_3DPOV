/**
 * Ambient module declaration for @mediapipe/tasks-vision.
 *
 * The upstream package ships a `vision.d.ts` types file BUT its
 * `exports` map lists conditional `types` AFTER `import` / `require` /
 * `default`. TypeScript's modern resolver picks the first match and
 * lands on the runtime entry, never reading the types.
 *
 * Declared as classes so the symbols work in BOTH type position
 * (`import("@mediapipe/tasks-vision").HandLandmarker`) and value
 * position (`const { HandLandmarker } = await import(...)`).
 *
 * If/when upstream fixes its exports map (`types` first), delete this.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type */

declare module "@mediapipe/tasks-vision" {
  export class HandLandmarker {
    static createFromOptions(vision: any, options: any): Promise<HandLandmarker>;
    detect(image: any, options?: any): any;
    detectForVideo(image: any, timestamp: number, options?: any): any;
    close(): void;
    setOptions(options: any): Promise<void>;
  }

  export class FilesetResolver {
    static forVisionTasks(wasmPath: string): Promise<any>;
  }

  export class GestureRecognizer {
    static createFromOptions(vision: any, options: any): Promise<GestureRecognizer>;
    recognize(image: any, options?: any): any;
    recognizeForVideo(image: any, timestamp: number, options?: any): any;
    close(): void;
  }

  export class ImageSegmenter {
    static createFromOptions(vision: any, options: any): Promise<ImageSegmenter>;
    close(): void;
  }

  export class ObjectDetector {
    static createFromOptions(vision: any, options: any): Promise<ObjectDetector>;
    close(): void;
  }

  export class FaceLandmarker {
    static createFromOptions(vision: any, options: any): Promise<FaceLandmarker>;
    detect(image: any, options?: any): any;
    detectForVideo(image: any, timestamp: number, options?: any): any;
    close(): void;
  }

  export class PoseLandmarker {
    static createFromOptions(vision: any, options: any): Promise<PoseLandmarker>;
    close(): void;
  }

  // Common result / options interfaces — loose so we don't drift from
  // upstream as the surface evolves.
  export interface Landmark { x: number; y: number; z?: number; visibility?: number }
  export interface NormalizedLandmark extends Landmark {}
  export interface HandLandmarkerResult {
    landmarks: NormalizedLandmark[][];
    worldLandmarks?: Landmark[][];
    handednesses?: any[];
  }
  export type HandLandmarkerOptions = any;
  export type WasmFileset = any;
}
