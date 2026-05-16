/**
 * lib/capabilities/image/print-check.ts — Pure print-readiness verdict.
 *
 * One-line role: given an image's measurable properties (dimensions,
 * format, bit depth, colour space, embedded ICC), return the
 * largest print size it can safely make on the studio's
 * Canon imagePROGRAF PRO-1100, plus warnings and errors.
 *
 * # Why pure
 *
 * Two adapters call this:
 *
 *   1. `print-check.server.ts` — sharp-based, for uploaded files.
 *   2. The Drive list route — uses Drive's `imageMediaMetadata`
 *      to filter web-downscaled copies without downloading the
 *      bytes. Drive metadata gives width/height; the rest is
 *      "unknown" and the function tolerates that.
 *
 * Keeping the math pure lets both callers share thresholds and
 * tests verify the verdict deterministically.
 *
 * # Thresholds
 *
 * `recommendedSize` = largest ISO-A size where the SHORTER axis of the
 * source clears 300 PPI vs the SHORTER axis of the paper. 240 PPI is
 * the floor for "acceptable", 180 PPI is the hard floor for
 * "viewed-at-distance acceptable". Below 180 PPI on A6, we call it
 * "screen only".
 *
 * # Canon PRO-1100 design points
 *
 * - Native 2400×1200 dot pitch is dithered output, not input
 *   resolution. We never demand 2400 PPI source — 300 PPI is the cap.
 * - Driver assumes Adobe RGB through Professional Print & Layout;
 *   sRGB prints but underuses the gamut on glossy paper.
 * - A2 borderless is supported; smaller A-series sizes have margins.
 */

export type PrintSize =
  | "screen-only"
  | "A6"
  | "A5"
  | "A4"
  | "A3"
  | "A2";

export const PRINT_SIZES: readonly PrintSize[] = [
  "screen-only",
  "A6",
  "A5",
  "A4",
  "A3",
  "A2",
] as const;

/** Short × long axis in inches (1 mm = 0.03937 in). */
const SIZE_INCHES: Record<Exclude<PrintSize, "screen-only">, [number, number]> = {
  A6: [4.13, 5.83],
  A5: [5.83, 8.27],
  A4: [8.27, 11.69],
  A3: [11.69, 16.54],
  A2: [16.54, 23.39],
};

/** PPI tiers. Source short-edge / paper short-edge ≥ tier means it fits. */
export const PPI_RECOMMENDED = 300;
export const PPI_ACCEPTABLE = 240;
export const PPI_FLOOR = 180;

const ISO_A_ASPECT = Math.SQRT2; // ~1.41421
const ASPECT_TOLERANCE = 0.05;

export type PrintCheckInput = {
  width: number;
  height: number;
  /** lowercase format: "jpeg" | "png" | "tiff" | "webp" | "heic" | "avif" | "gif" | undefined */
  format?: string;
  /** bits per channel; 8 / 16 typical */
  bitDepth?: number;
  /** "srgb" | "adobe-rgb" | "display-p3" | "prophoto-rgb" | "cmyk" | "lab" | "unknown" */
  colorSpace?:
    | "srgb"
    | "adobe-rgb"
    | "display-p3"
    | "prophoto-rgb"
    | "cmyk"
    | "lab"
    | "unknown";
  /** present + interpretable ICC profile in the file */
  hasIccProfile?: boolean;
  /** for JPEG only; "4:2:0" / "4:2:2" / "4:4:4" / undefined when not JPEG */
  chromaSubsampling?: string;
  /** file size in bytes — used for thumbnail-upscale heuristic */
  fileSizeBytes?: number;
  /** EXIF orientation (1..8). Affects which axis is "short" after applying. */
  exifOrientation?: number;
  /** When true, the file is a 360 equirectangular panorama (2:1 aspect
   *  ratio + XMP GPano tag, or detected by 2:1 + 360-camera EXIF Make).
   *  Equirectangulars don't print as-is — they need to be reframed
   *  through a virtual camera. The verdict will route them to the
   *  reframe chamber instead of failing the aspect check. */
  isEquirectangular?: boolean;
};

export type PrintCheckVerdict = {
  /** False only when the file is unprintable at any size (errors present
   *  OR maxPrintableSize is "screen-only" AND lossy/format issues exist). */
  printable: boolean;
  /** Largest size that meets ≥240 PPI both axes. For equirectangulars,
   *  this is the size achievable AFTER reframing at 90° FOV (a
   *  generous reframe — the actual reframed resolution depends on the
   *  user's chosen FOV in the reframe chamber). */
  maxPrintableSize: PrintSize;
  /** Largest size that meets ≥300 PPI both axes. */
  recommendedSize: PrintSize;
  /** Effective PPI at maxPrintableSize (short-edge basis). */
  effectivePpiAtMax: number;
  /** Effective PPI at recommendedSize (short-edge basis). */
  effectivePpiAtRecommended: number;
  /** True when this looks like a web-downscale (< A4 at 240 PPI) so
   *  the Drive scan can hide it. */
  isLikelyWebDownscale: boolean;
  /** True when this is a 360 equirectangular; the chamber should offer
   *  the reframe-360 tool instead of a direct print. */
  needsReframe: boolean;
  /** True when this image is eligible as training corpus for the
   *  360-native generation model the studio is building. Stricter than
   *  `printable`: requires the image to be equirectangular, ≥5K wide,
   *  not a web downscale, and (when known) from a recognised 360 camera. */
  isTrainingEligible: boolean;
  warnings: string[];
  errors: string[];
};

function swapForOrientation(
  width: number,
  height: number,
  orientation: number | undefined,
): { width: number; height: number } {
  // EXIF orientations 5..8 are the rotated/transposed ones.
  if (orientation && orientation >= 5 && orientation <= 8) {
    return { width: height, height: width };
  }
  return { width, height };
}

/** Largest size whose paper-short-edge × ppi ≤ source-short-edge AND
 *  paper-long-edge × ppi ≤ source-long-edge. */
function largestSizeAtPpi(
  shortPx: number,
  longPx: number,
  ppi: number,
): PrintSize {
  // Iterate large→small so the first fit wins.
  const order: Array<Exclude<PrintSize, "screen-only">> = [
    "A2",
    "A3",
    "A4",
    "A5",
    "A6",
  ];
  for (const size of order) {
    const [shortIn, longIn] = SIZE_INCHES[size];
    if (shortPx >= shortIn * ppi && longPx >= longIn * ppi) {
      return size;
    }
  }
  return "screen-only";
}

/** Effective PPI when printed at the given size, short-edge basis. */
function ppiAt(shortPx: number, size: PrintSize): number {
  if (size === "screen-only") return 0;
  const shortIn = SIZE_INCHES[size][0];
  return Math.round(shortPx / shortIn);
}

export function printCheck(input: PrintCheckInput): PrintCheckVerdict {
  const warnings: string[] = [];
  const errors: string[] = [];

  // -- Validate dimensions --
  if (
    !Number.isFinite(input.width) ||
    !Number.isFinite(input.height) ||
    input.width <= 0 ||
    input.height <= 0
  ) {
    return {
      printable: false,
      maxPrintableSize: "screen-only",
      recommendedSize: "screen-only",
      effectivePpiAtMax: 0,
      effectivePpiAtRecommended: 0,
      isLikelyWebDownscale: false,
      needsReframe: false,
      isTrainingEligible: false,
      warnings,
      errors: ["Image dimensions are missing or invalid."],
    };
  }

  // Apply EXIF orientation before computing short/long axis.
  const { width, height } = swapForOrientation(
    input.width,
    input.height,
    input.exifOrientation,
  );
  const shortPx = Math.min(width, height);
  const longPx = Math.max(width, height);

  // -- Hard errors (colour-space + format) --
  if (input.colorSpace === "cmyk") {
    errors.push(
      "CMYK images are not supported by the print pipeline — convert to sRGB or Adobe RGB.",
    );
  }
  if (input.colorSpace === "lab") {
    errors.push(
      "Lab images are not supported by the print pipeline — convert to sRGB or Adobe RGB.",
    );
  }

  // -- Compute sizes --
  const maxAcceptable = largestSizeAtPpi(shortPx, longPx, PPI_ACCEPTABLE);
  const maxRecommended = largestSizeAtPpi(shortPx, longPx, PPI_RECOMMENDED);
  const maxFloor = largestSizeAtPpi(shortPx, longPx, PPI_FLOOR);

  // -- Aspect ratio vs ISO-A --
  // Equirectangulars are 2:1 by definition; that's expected, not a
  // warning — they get routed to the reframe chamber instead.
  const aspect = longPx / shortPx;
  if (
    !input.isEquirectangular &&
    Math.abs(aspect - ISO_A_ASPECT) > ASPECT_TOLERANCE
  ) {
    warnings.push(
      `Aspect ratio ${aspect.toFixed(2)} differs from ISO A-series (1.41) — will require crop or border.`,
    );
  }

  // -- ICC profile --
  if (input.hasIccProfile === false) {
    warnings.push(
      "No embedded ICC profile — driver will assume sRGB, may print muted on premium paper.",
    );
  }

  // -- Colour space gamut hints --
  if (input.colorSpace === "srgb" && maxAcceptable !== "screen-only") {
    warnings.push(
      "sRGB image — Canon PRO-1100 driver expects Adobe RGB for full gamut. Acceptable, but underused on glossy paper.",
    );
  }
  if (input.colorSpace === "prophoto-rgb") {
    warnings.push(
      "ProPhoto RGB source — soft-clipping possible on perceptual rendering intent.",
    );
  }

  // -- Bit depth --
  if (
    typeof input.bitDepth === "number" &&
    input.bitDepth < 16 &&
    (maxAcceptable === "A3" || maxAcceptable === "A2")
  ) {
    warnings.push(
      `${input.bitDepth}-bit at ${maxAcceptable} risks banding on smooth gradients — 16-bit TIFF recommended for prints A3 and larger.`,
    );
  }

  // -- Format-specific --
  if (input.format === "jpeg") {
    if (
      input.chromaSubsampling === "4:2:0" &&
      (maxAcceptable === "A3" || maxAcceptable === "A2")
    ) {
      warnings.push(
        "JPEG 4:2:0 chroma subsampling detected — soft edges possible at A3 and larger; prefer 4:4:4 or TIFF.",
      );
    }
    if (maxAcceptable === "A2") {
      warnings.push(
        "Lossy JPEG at A2 — visible at close inspection. TIFF or PNG recommended for the largest print.",
      );
    }
  }
  if (input.format === "gif") {
    warnings.push(
      "GIF is 256-colour palette — fine for small prints, will look posterised above A5.",
    );
  }
  if (input.format === "webp" || input.format === "avif") {
    warnings.push(
      `${input.format.toUpperCase()} is a web-first lossy format — consider exporting from the original.`,
    );
  }

  // -- Thumbnail / web-downscale heuristic --
  // Any file under A4-at-240 (1984 × 2806 short × long) is likely a web copy.
  const isLikelyWebDownscale =
    maxAcceptable === "screen-only" ||
    maxAcceptable === "A6" ||
    maxAcceptable === "A5";

  // -- Sub-floor: warn that the file is screen-only --
  if (maxFloor === "screen-only") {
    warnings.push(
      "Below the 180 PPI floor even on A6 — this is a thumbnail or screen-only file.",
    );
  }

  // -- Equirectangular reframe note --
  // A 360 equirectangular at 90° rectilinear FOV keeps roughly
  // width / 4 horizontal pixels (90° / 360°). For an 8K equirectangular
  // (7680×3840) that's a 1920px-wide rectilinear crop — A4-ish at 240
  // PPI. We override maxPrintableSize for equirectangulars to reflect
  // what's achievable AFTER reframing.
  let maxAfterReframe = maxAcceptable;
  let recommendedAfterReframe = maxRecommended;
  if (input.isEquirectangular) {
    // Rough rule: at 90° FOV the rectilinear render is `width / 4`
    // wide; vertical follows from the chosen output aspect. We compute
    // the rectilinear short-edge as `min(width / 4, height / 2)` —
    // height / 2 because vertical FOV in a square 90° view is also
    // ~90° → half the height.
    const reframedShort = Math.min(width / 4, height / 2);
    const reframedLong = Math.round(reframedShort * ISO_A_ASPECT);
    maxAfterReframe = largestSizeAtPpi(
      reframedShort,
      reframedLong,
      PPI_ACCEPTABLE,
    );
    recommendedAfterReframe = largestSizeAtPpi(
      reframedShort,
      reframedLong,
      PPI_RECOMMENDED,
    );
    warnings.push(
      `360 equirectangular detected — reframe through the virtual camera before printing. Max size shown reflects a 90° FOV reframe; tighter FOV crops yield smaller prints.`,
    );
  }

  const printable =
    errors.length === 0 && maxAfterReframe !== "screen-only";

  // Training-corpus eligibility: equirectangular, ≥5K wide, not a
  // downscale, dimensions reasonable. Strict so the Drive scan only
  // tags genuine corpus material.
  const isTrainingEligible =
    Boolean(input.isEquirectangular) &&
    longPx >= 5000 &&
    !isLikelyWebDownscale;

  return {
    printable,
    maxPrintableSize: maxAfterReframe,
    recommendedSize: recommendedAfterReframe,
    effectivePpiAtMax: ppiAt(
      input.isEquirectangular ? Math.min(width / 4, height / 2) : shortPx,
      maxAfterReframe,
    ),
    effectivePpiAtRecommended: ppiAt(
      input.isEquirectangular ? Math.min(width / 4, height / 2) : shortPx,
      recommendedAfterReframe,
    ),
    isLikelyWebDownscale,
    needsReframe: Boolean(input.isEquirectangular),
    isTrainingEligible,
    warnings,
    errors,
  };
}

/**
 * Compute a verdict from Drive's `imageMediaMetadata` alone — no file
 * download required. Drive only gives us width/height + rotation + camera
 * make/model, so the verdict is "best effort": format/bitDepth/colour
 * space are unknown, but the size/PPI math is exact.
 *
 * Heuristic for equirectangular: 2:1 aspect ratio + camera make known
 * to ship 360 sensors. Cheap and works for the Drive-scan filter; the
 * full-fidelity check runs server-side when the file is actually pulled.
 */
const KNOWN_360_CAMERA_MAKES = new Set([
  "DJI",
  "Insta360",
  "RICOH",
  "GoPro",
  "Garmin",
  "Kandao",
  "Xiaomi",
]);

export type DriveMetaForCheck = {
  width?: number;
  height?: number;
  rotation?: number;
  cameraMake?: string;
  cameraModel?: string;
  /** File name — helps catch obvious thumbnails ("IMG_4571_small.jpg") */
  fileName?: string;
  /** Bytes — helps spot web-downscaled JPEGs */
  fileSizeBytes?: number;
};

export function printCheckFromDriveMeta(
  meta: DriveMetaForCheck,
): PrintCheckVerdict {
  if (typeof meta.width !== "number" || typeof meta.height !== "number") {
    // No dimensions — Drive doesn't expose them for some formats (HEIC,
    // some RAWs). Return a benign "unknown" verdict; the caller can
    // fall back to downloading + the sharp adapter.
    return {
      printable: false,
      maxPrintableSize: "screen-only",
      recommendedSize: "screen-only",
      effectivePpiAtMax: 0,
      effectivePpiAtRecommended: 0,
      isLikelyWebDownscale: false,
      needsReframe: false,
      isTrainingEligible: false,
      warnings: ["Drive didn't report dimensions for this file — needs a deeper check."],
      errors: [],
    };
  }
  const aspect = Math.max(meta.width, meta.height) / Math.min(meta.width, meta.height);
  const isEquirectangular =
    Math.abs(aspect - 2) < 0.02 &&
    Math.max(meta.width, meta.height) >= 4096 &&
    (!meta.cameraMake || KNOWN_360_CAMERA_MAKES.has(meta.cameraMake));

  const input: PrintCheckInput = {
    width: meta.width,
    height: meta.height,
    isEquirectangular,
  };
  if (typeof meta.rotation === "number") {
    // Drive rotation is degrees (0/90/180/270); EXIF orientation 1..8.
    // Map: 90 → 6, 180 → 3, 270 → 8, else 1.
    input.exifOrientation =
      meta.rotation === 90
        ? 6
        : meta.rotation === 180
          ? 3
          : meta.rotation === 270
            ? 8
            : 1;
  }
  return printCheck(input);
}

/** Human-readable summary for badges and toast lines. One line. */
export function summarisePrintVerdict(v: PrintCheckVerdict): string {
  if (!v.printable) {
    if (v.errors.length > 0) return v.errors[0]!;
    return "Screen-only — too small to print";
  }
  const prefix = v.needsReframe ? "After reframe, prints up to" : "Prints up to";
  if (v.recommendedSize === v.maxPrintableSize) {
    return `${prefix} ${v.maxPrintableSize} at ${v.effectivePpiAtMax} PPI`;
  }
  return `${prefix} ${v.maxPrintableSize} (acceptable) · ${v.recommendedSize} recommended`;
}
