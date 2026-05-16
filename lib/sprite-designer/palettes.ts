/**
 * lib/sprite-designer/palettes.ts — Curated palette set for the sprite-designer chamber.
 *
 * Originally the bench app at `D:/The_Hangar/apps/sprite-designer/` loaded
 * palette JSON files via Vite's `import.meta.glob` from
 * `D:/The_Hangar/assets/palettes/lospec/`. Next.js / Turbopack doesn't have
 * the same glob shape, and these palettes are small + stable, so the set is
 * inlined here. To add more, paste the colour array — name + hex strings.
 */

export type Palette = { name: string; colors: string[] };

export const HOLOFLOW_5: Palette = {
  name: "Holoflow 5",
  colors: ["#FF66CC", "#66CCFF", "#FFCC66", "#0E0E14", "#E4E4EC"],
};

const lospec = (name: string, hexes: string[]): Palette => ({
  name,
  colors: hexes.map((h) => (h.startsWith("#") ? h : `#${h}`)),
});

export const PALETTES: Palette[] = [
  lospec("Endesga 32", [
    "be4a2f", "d77643", "ead4aa", "e4a672", "b86f50", "733e39", "3e2731",
    "a22633", "e43b44", "f77622", "feae34", "fee761", "63c74d", "3e8948",
    "265c42", "193c3e", "124e89", "0099db", "2ce8f5", "ffffff", "c0cbdc",
    "8b9bb4", "5a6988", "3a4466", "262b44", "181425", "ff0044", "68386c",
    "b55088", "f6757a", "e8b796", "c28569",
  ]),
  lospec("Gameboy Pocket", ["c4cfa1", "8b956d", "4d533c", "1f1f1f"]),
  lospec("Nyx8", [
    "08141e", "0f2a3f", "20394f", "f6d6bd", "c3a38a", "997577", "816271",
    "4e495f",
  ]),
  lospec("Oil 6", ["fbf5ef", "f2d3ab", "c69fa5", "8b6d9c", "494d7e", "272744"]),
  lospec("PICO-8", [
    "000000", "1D2B53", "7E2553", "008751", "AB5236", "5F574F", "C2C3C7",
    "FFF1E8", "FF004D", "FFA300", "FFEC27", "00E436", "29ADFF", "83769C",
    "FF77A8", "FFCCAA",
  ]),
  lospec("Sweetie 16", [
    "1a1c2c", "5d275d", "b13e53", "ef7d57", "ffcd75", "a7f070", "38b764",
    "257179", "29366f", "3b5dc9", "41a6f6", "73eff7", "f4f4f4", "94b0c2",
    "566c86", "333c57",
  ]),
  lospec("Vinik24", [
    "000000", "6f6776", "9a9a97", "c5ccb8", "8b5580", "c38890", "a593a5",
    "666092", "9a4f50", "c28d75", "7ca1c0", "416aa3", "8d6268", "be955c",
    "68aca9", "387080", "6e6962", "93a167", "6eaa78", "557064", "9d9f7f",
    "7e9e99", "5d6872", "433455",
  ]),
];

export const ALL_PALETTES: Palette[] = [HOLOFLOW_5, ...PALETTES];
