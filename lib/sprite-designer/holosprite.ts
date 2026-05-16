/**
 * lib/sprite-designer/holosprite.ts — .holosprite project file (JSON envelope).
 *
 * Frames serialise as base64 RGBA bytes — same shape we get out of ImageData,
 * no compression. A 64-frame 64×64 project is ~1 MB; a 16-frame 32×32 is ~65 kB.
 *
 * Versioning is explicit so we can break the format later without silent
 * breakage: load() refuses unrecognised major versions.
 */

export const HOLOSPRITE_VERSION = 1;

export type HolospriteProject = {
  version: number;
  width: number;
  height: number;
  paletteName: string;
  paletteColors: string[];
  frames: string[]; // base64-encoded RGBA bytes, one per frame
  fps: number;
  createdAt: string; // ISO timestamp
};

export function serialize(input: {
  width: number;
  height: number;
  paletteName: string;
  paletteColors: string[];
  frames: ImageData[];
  fps: number;
}): string {
  const project: HolospriteProject = {
    version: HOLOSPRITE_VERSION,
    width: input.width,
    height: input.height,
    paletteName: input.paletteName,
    paletteColors: input.paletteColors,
    fps: input.fps,
    frames: input.frames.map((f) => bytesToBase64(f.data)),
    createdAt: new Date().toISOString(),
  };
  return JSON.stringify(project);
}

export function deserialize(text: string): {
  width: number;
  height: number;
  paletteName: string;
  paletteColors: string[];
  frames: ImageData[];
  fps: number;
} {
  const project = JSON.parse(text) as HolospriteProject;
  if (project.version !== HOLOSPRITE_VERSION) {
    throw new Error(
      `unsupported .holosprite version ${project.version} (this build expects ${HOLOSPRITE_VERSION})`,
    );
  }
  const frames = project.frames.map((b64) => {
    const bytes = base64ToBytes(b64);
    if (bytes.length !== project.width * project.height * 4) {
      throw new Error(
        `frame size mismatch: expected ${project.width * project.height * 4} bytes, got ${bytes.length}`,
      );
    }
    return new ImageData(
      new Uint8ClampedArray(bytes),
      project.width,
      project.height,
    );
  });
  return {
    width: project.width,
    height: project.height,
    paletteName: project.paletteName,
    paletteColors: project.paletteColors,
    frames,
    fps: project.fps,
  };
}

export function downloadHolosprite(text: string, filename: string): Blob {
  const blob = new Blob([text], { type: "application/json" });
  const name = filename.endsWith(".holosprite")
    ? filename
    : `${filename}.holosprite`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = name;
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return blob;
}

// Use the browser's built-in btoa/atob, but feed them via a Uint8Array→binary-
// string bridge so we don't blow the call stack on large frames.
function bytesToBase64(bytes: Uint8ClampedArray | Uint8Array): string {
  let str = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    str += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(str);
}

function base64ToBytes(b64: string): Uint8Array {
  const str = atob(b64);
  const out = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) out[i] = str.charCodeAt(i);
  return out;
}
