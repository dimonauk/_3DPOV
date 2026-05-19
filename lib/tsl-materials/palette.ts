/**
 * lib/tsl-materials/palette.ts — Studio palette in TSL `color()` form.
 *
 * Single source of truth for every TSL preset. Mirrors the tokens in
 * app/globals.css — pink-50..600, mint-50..500, lavender-50..500,
 * chrome-100..500, warm-black-50..950 — so a swatch tweak in CSS can
 * be matched here in one edit.
 *
 * The TSL `color()` helper lives in `three/tsl`. It returns a
 * ConstNode the rest of the graph can compose with. To avoid the
 * per-preset import boilerplate, this module re-exports a single
 * `paletteColor(token)` helper that resolves a token name to a hex
 * int, plus a `paletteHex` map for callers that want the raw number
 * (Three.Color, MeshStandardMaterial constructor, etc.).
 *
 * Why two surfaces and not a TSL-native ConstNode export: the TSL
 * `color()` factory binds to a particular three build at call time.
 * Returning hex ints lets each preset wrap them with whichever TSL
 * version it imported, which keeps the palette decoupled from the
 * shader graph.
 */

/* eslint-disable @typescript-eslint/no-magic-numbers */

export const paletteHex = {
  // Soft pinks — workshop accent, foil sweeps, glow rings.
  "pink-50": 0xfff5f9,
  "pink-100": 0xffe4ee,
  "pink-200": 0xffc4d9,
  "pink-300": 0xff9fbf,
  "pink-400": 0xff78a5,
  "pink-500": 0xff558f,
  "pink-600": 0xe83c75,

  // Mint — secondary accent, opposite-pole highlight on holographics.
  "mint-50": 0xeffbf5,
  "mint-100": 0xd5f5e3,
  "mint-200": 0xa8ecc6,
  "mint-300": 0x76dea6,
  "mint-400": 0x46cf89,
  "mint-500": 0x23b471,

  // Lavender — anodised tints, cool fresnel rims, holo midtones.
  "lavender-50": 0xf6f2ff,
  "lavender-100": 0xe8ddff,
  "lavender-200": 0xcfb7ff,
  "lavender-300": 0xb490ff,
  "lavender-400": 0x9a6dff,
  "lavender-500": 0x8250ee,

  // Warm black — matte body colour, ambient floor, never pure 000.
  "warm-black-50": 0xf6f4f7,
  "warm-black-100": 0xd9d5dc,
  "warm-black-700": 0x2a232f,
  "warm-black-800": 0x1d181f,
  "warm-black-900": 0x14111a,
  "warm-black-950": 0x0c0a12,

  // Chrome — silver highlights, technical labels in 3D, anodised base.
  "chrome-100": 0xeef1f5,
  "chrome-200": 0xd6dde5,
  "chrome-300": 0xb5c0cd,
  "chrome-400": 0x8d9bad,
  "chrome-500": 0x6a7b8e,
} as const;

export type PaletteToken = keyof typeof paletteHex;

/**
 * Resolve a palette token to its hex int. Cheap — the table is a
 * frozen const, this is a property lookup.
 */
export function paletteColor(token: PaletteToken): number {
  return paletteHex[token];
}

/**
 * Build a TSL `color()` node from a palette token. Takes the TSL
 * module as an argument so the preset can pass the version it
 * imported (`three/tsl` vs `three/webgpu` re-exports) without this
 * module reaching for its own copy. Returns whatever the supplied
 * `color()` factory returns — typed as `unknown` because TSL's node
 * types are not re-exported uniformly across three's surfaces.
 */
export function tslPaletteColor(
  tsl: { color: (hex: number) => unknown },
  token: PaletteToken,
): unknown {
  return tsl.color(paletteHex[token]);
}
