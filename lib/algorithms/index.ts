/**
 * lib/algorithms/index.ts — Registry of ported jewellery algorithms.
 *
 * This file is the runtime registry that `/atelier/algorithms/<slug>`
 * pages consult to decide whether to show a live preview or a
 * "source port pending" placeholder.
 *
 * Each entry binds a slug from `lib/assets/algorithms.ts` to a
 * pointer that yields the ported module on demand (the modules
 * import `three` and are sometimes heavy, so we use dynamic
 * imports to keep the index page light).
 */

import type { CommonParams, GeneratedMesh } from "./_base";

export type ParamDescriptor = {
  key: keyof CommonParams;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
};

export type PortedAlgorithm = {
  slug: string;
  /** Loader for the algorithm module — lazy. */
  load: () => Promise<{
    generate: (p: CommonParams) => GeneratedMesh;
    generateGeometry: (p: CommonParams) => import("three").BufferGeometry;
    defaultParams: () => CommonParams;
  }>;
  /** Sliders to expose on the per-algorithm page. */
  params: ParamDescriptor[];
};

const COMMON_PARAMS: ParamDescriptor[] = [
  { key: "seed", label: "Seed", min: 0, max: 9999, step: 1, default: 42 },
  {
    key: "complexity",
    label: "Complexity",
    min: 0,
    max: 1,
    step: 0.01,
    default: 0.5,
  },
  {
    key: "density",
    label: "Density",
    min: 0,
    max: 1,
    step: 0.01,
    default: 0.5,
  },
];

export const portedAlgorithms: Record<string, PortedAlgorithm> = {
  spiral: {
    slug: "spiral",
    load: () => import("./spiral"),
    params: COMMON_PARAMS,
  },
  gyroid: {
    slug: "gyroid",
    load: () => import("./gyroid"),
    params: COMMON_PARAMS,
  },
  lsystem: {
    slug: "lsystem",
    load: () => import("./lsystem"),
    params: COMMON_PARAMS,
  },
  auxetic: {
    slug: "auxetic",
    load: () => import("./auxetic"),
    params: COMMON_PARAMS,
  },
  "fermat-spiral": {
    slug: "fermat-spiral",
    load: () => import("./fermat-spiral"),
    params: COMMON_PARAMS,
  },
  "geodesic-spines": {
    slug: "geodesic-spines",
    load: () => import("./geodesic-spines"),
    params: COMMON_PARAMS,
  },
  "celtic-knot": {
    slug: "celtic-knot",
    load: () => import("./celtic-knot"),
    params: COMMON_PARAMS,
  },
  "swept-sinuous": {
    slug: "swept-sinuous",
    load: () => import("./swept-sinuous"),
    params: COMMON_PARAMS,
  },
  gear: {
    slug: "gear",
    load: () => import("./gear"),
    params: COMMON_PARAMS,
  },
  "skull-sdf": {
    slug: "skull-sdf",
    load: () => import("./skull-sdf"),
    params: COMMON_PARAMS,
  },
  "wing-venation": {
    slug: "wing-venation",
    load: () => import("./wing-venation"),
    params: COMMON_PARAMS,
  },
  tensegrity: {
    slug: "tensegrity",
    load: () => import("./tensegrity"),
    params: COMMON_PARAMS,
  },
  sigil: {
    slug: "sigil",
    load: () => import("./sigil"),
    params: COMMON_PARAMS,
  },
  "torus-knot": {
    slug: "torus-knot",
    load: () => import("./torus-knot"),
    params: COMMON_PARAMS,
  },
  "step-fret": {
    slug: "step-fret",
    load: () => import("./step-fret"),
    params: COMMON_PARAMS,
  },
  interlace: {
    slug: "interlace",
    load: () => import("./interlace"),
    params: COMMON_PARAMS,
  },
  mon: {
    slug: "mon",
    load: () => import("./mon"),
    params: COMMON_PARAMS,
  },
  "non-euclidean": {
    slug: "non-euclidean",
    load: () => import("./non-euclidean"),
    params: COMMON_PARAMS,
  },
  "ribbon-helix": {
    slug: "ribbon-helix",
    load: () => import("./ribbon-helix"),
    params: COMMON_PARAMS,
  },
};

export function isPorted(slug: string): boolean {
  return slug in portedAlgorithms;
}

export const portedSlugs = Object.keys(portedAlgorithms);
