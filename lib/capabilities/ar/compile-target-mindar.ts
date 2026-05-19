/**
 * lib/capabilities/ar/compile-target-mindar.ts — mind-ar lower-level
 * compiler subclass. Pulled out of compile-target.server.ts so the
 * server router stays readable.
 *
 * Why this exists: see compile-target.server.ts header. mind-ar's
 * `OfflineCompiler` imports `canvas` by name; we side-step it by
 * calling `CompilerBase` + `buildTrackingImageList` +
 * `extractTrackingFeatures` directly and supplying our own
 * sharp-backed FakeCanvas.
 */

import "server-only";

import { FakeCanvas, type RgbaImage } from "./compile-target-canvas";

export type ProgressCb = (pct: number) => void;

export type CompilerBaseInstance = {
  compileImageTargets: (
    images: readonly RgbaImage[],
    progress: ProgressCb,
  ) => Promise<void>;
  exportData: () => ArrayBuffer | Uint8Array;
};

type CompilerBaseModule = {
  CompilerBase: new () => CompilerBaseInstance;
};

type ImageListModule = {
  buildTrackingImageList: (targetImage: unknown) => unknown[];
};

type ExtractUtilsModule = {
  extractTrackingFeatures: (
    imageList: unknown[],
    progress: () => void,
  ) => unknown;
};

export async function buildSharpOfflineCompiler(): Promise<CompilerBaseInstance> {
  // Dynamic imports — keeps mind-ar out of the Next.js client bundle and
  // matches the script's import pattern exactly. Specifier kept as a
  // dynamic string so TypeScript doesn't try to type-resolve mind-ar's
  // internal modules (no published @types/mind-ar).
  const compilerBaseSpec = "mind-ar/src/image-target/compiler-base.js";
  const imageListSpec = "mind-ar/src/image-target/image-list.js";
  const extractUtilsSpec = "mind-ar/src/image-target/tracker/extract-utils.js";
  const cpuKernelsSpec = "mind-ar/src/image-target/detector/kernels/cpu/index.js";

  const [
    { CompilerBase },
    { buildTrackingImageList },
    { extractTrackingFeatures },
  ] = await Promise.all([
    import(compilerBaseSpec) as Promise<CompilerBaseModule>,
    import(imageListSpec) as Promise<ImageListModule>,
    import(extractUtilsSpec) as Promise<ExtractUtilsModule>,
  ]);
  // Side-effect import: registers TF.js CPU kernels.
  await import(cpuKernelsSpec);

  class SharpOfflineCompiler extends CompilerBase {
    createProcessCanvas(img: RgbaImage): FakeCanvas {
      return new FakeCanvas(img.width, img.height);
    }

    compileTrack({
      progressCallback,
      targetImages,
      basePercent,
    }: {
      progressCallback: (pct: number) => void;
      targetImages: unknown[];
      basePercent: number;
    }): Promise<unknown[]> {
      return new Promise((resolve) => {
        const percentPerImage = (100 - basePercent) / targetImages.length;
        let percent = 0;
        const list: unknown[] = [];
        for (let i = 0; i < targetImages.length; i++) {
          const targetImage = targetImages[i];
          const imageList = buildTrackingImageList(targetImage);
          const percentPerAction = percentPerImage / imageList.length;
          const trackingData = extractTrackingFeatures(imageList, () => {
            percent += percentPerAction;
            progressCallback(basePercent + percent);
          });
          list.push(trackingData);
        }
        resolve(list);
      });
    }
  }

  return new SharpOfflineCompiler() as unknown as CompilerBaseInstance;
}
