/**
 * lib/holo-walk/types.ts — Type definitions for the HoloWalk catalogue.
 *
 * Extracted from `lib/holo-walk/locations.ts` (formerly 2039 lines)
 * per ARCHITECTURE.md Rule 1. The types live alone so consumers can
 * import them without pulling in the 1700-line LOCATIONS data
 * constant — useful for tree-shaking + for clients (route handlers,
 * AR capabilities) that only need the shape.
 *
 * Re-exported from `lib/holo-walk/locations.ts` so existing imports
 * continue to work.
 */

import type { AttractorEngine } from "lib/state/viz";

/** A point on the trail — one light-sculpture, one location, one photograph. */
export type SculptureLocation = {
  readonly id: string;
  readonly name: string;
  readonly city: "manchester" | "london" | string;
  readonly coords: { readonly lat: number; readonly lon: number };
  /** Compass degrees (0 = north, clockwise) the photographer was facing. */
  readonly headingAtCapture: number;
  /** ISO 8601 date the photograph was made. */
  readonly captureDate: string;
  /** URL or `/photographs/...` route slug for the source image. */
  readonly originalPhoto: string;
  readonly sculpture: SculptureSpec;
  /** Optional: photoreal splat capture of the spot. When present, AR /
   *  preview surfaces may choose to render the splat instead of (or
   *  alongside) the algorithmic sculpture. The deploy capability
   *  (`viz.splat-ar-deploy`) writes this field after a splat is
   *  trained and uploaded. */
  readonly splat?: SplatAsset;
  /** Per-spot Aura narration script (Princess voice). Optional. */
  readonly narrationScript?: string;
  /** Render distance envelope in metres — visible from `renderFromM`, fully detailed at `renderToM`. */
  readonly range: { readonly renderFromM: number; readonly renderToM: number };
  /** One-paragraph description in Dimona's bench register. */
  readonly description: string;
};

/** Discriminated rendering-kind union.
 *
 * `attractor` — original algorithmic light-sculpture (clifford / lorenz /
 *   etc.). The v0 shape, still the default.
 * `splat`     — photoreal Gaussian Splat capture. Renders via
 *   `viz.splat-render` + the AR window's R3F overlay. The splat itself
 *   lives in `SculptureLocation.splat`; this discriminant exists so a
 *   sculpture can be marked as splat-primary (the algorithmic sculpture
 *   becomes the cosmetic accent instead of the headline). */
export type SculptureSpec =
  | {
      readonly kind: "attractor";
      readonly engine: AttractorEngine;
      readonly particleCount?: number;
      readonly scale?: number;
    }
  | {
      readonly kind: "splat";
      /** Optional companion attractor for the desktop preview when no
       *  splat is loaded yet (e.g. splash, page-load skeleton). */
      readonly fallbackAttractor?: {
        readonly engine: AttractorEngine;
        readonly particleCount?: number;
        readonly scale?: number;
      };
    };

/**
 * Splat asset bundle attached to a sculpture location. Produced by
 * `viz.splat-ar-deploy`; consumed by `viz.splat-render` and the
 * HoloWalk AR window.
 *
 * Multiple formats can coexist — the consumer (the deploy page,
 * `viz.splat-render`) picks the smallest format the client supports:
 *   `.spz` preferred on mobile (10× smaller than .ply, Niantic Apache-2.0)
 *   `.ksplat` preferred on three.js / mkkellogg viewers
 *   `.ply` always works
 */
export type SplatAsset = {
  /** Canonical INRIA-3DGS PLY URL. Always present. */
  readonly plyUrl: string;
  /** Mobile-optimised SPZ format URL (Niantic). 10× smaller than PLY. */
  readonly spzUrl?: string;
  /** mkkellogg KSplat URL. Three.js-native. */
  readonly ksplatUrl?: string;
  /** iOS AR Quick Look fallback URL — meshed via SuGaR + USDZ wrap. */
  readonly usdzUrl?: string;
  /** Gaussian count — used for delivery-cost reporting and viewer perf hints. */
  readonly gaussianCount: number;
  /** Bytes-on-disk per format, for telemetry. Optional. */
  readonly bytes?: Partial<Record<"ply" | "spz" | "ksplat" | "usdz", number>>;
  /** Licence carried through from the splat record. Always commerce-safe
   *  here — the deploy capability rejects `research-only`. */
  readonly licence: "commercial-ok" | "third-party-commercial";
  /** ISO-8601 timestamp the splat was deployed. */
  readonly deployedAt: string;
};

/** Result of a `locationsNear` query — the location with its distance attached. */
export type LocationWithDistance = SculptureLocation & {
  readonly distanceMeters: number;
};

/** Resolved attractor parameters for a sculpture, or `null` when the
 *  sculpture is a splat-primary spec with no fallback attractor.
 *
 *  Helper introduced when `SculptureSpec` became a discriminated union
 *  ("attractor" | "splat"). Centralises the `kind`-narrowing + default
 *  fill-in so each consumer doesn't have to re-implement it. */
export type ResolvedAttractor = {
  engine: AttractorEngine;
  particleCount: number;
  scale: number;
};
