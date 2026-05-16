/**
 * Vendored from `services/image-to-pixel/` (MIT — Image-to-Pixel by
 * @jonobr1 et al). Type surface for the one export we use; the
 * implementation is plain JS that handles p5/Q5 too, but in our
 * browser context the function resolves to a plain HTMLCanvasElement.
 */

export type PixelateDither =
  | "none"
  | "Floyd-Steinberg"
  | "ordered"
  | "2x2 Bayer"
  | "4x4 Bayer"
  | "clustered 4x4"
  | "atkinson";

export type PixelateOptions = {
  /** Source image — accepts HTMLImageElement, HTMLCanvasElement,
   *  ImageData, or a URL string. */
  image: HTMLImageElement | HTMLCanvasElement | ImageData | string;
  /** Number of pixels wide for the pixelated image. Height follows
   *  source aspect ratio. */
  width: number;
  dither?: PixelateDither;
  /** Dithering strength 0–100. */
  strength?: number;
  /** Palette name from Lospec (e.g. "endesga-32") or an array of
   *  `#rrggbb` hex strings. Null means no quantisation. */
  palette?: string | ReadonlyArray<string> | null;
  /** `pixel` returns a canvas at the pixelated dimensions; `original`
   *  scales back to the source's dimensions (nearest-neighbour). */
  resolution?: "pixel" | "original";
};

export function pixelate(options: PixelateOptions): Promise<HTMLCanvasElement>;
