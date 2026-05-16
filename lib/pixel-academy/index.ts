/**
 * lib/pixel-academy — vendored engine for the /play/pixel-academy chamber.
 *
 * Sourced from `D:/The_Hangar/packages/pixel-engine/` (workspace name
 * `@hanger/pixel-engine`). Re-exports the engine surface used by the
 * Pixel Academy client.
 *
 * Vendored, not workspace-linked: the Holoflow site is a standalone
 * Next.js project outside The Hangar monorepo and cannot resolve the
 * pnpm workspace alias. The vendor copy fixes the package's broken
 * relative imports (`'../constants.js'` referencing a sibling file,
 * `'./office/types.js'` that never existed) and drops the `.js`
 * extensions so the bundler-style resolver in `tsconfig.json` can
 * follow them.
 *
 * The editor surface (`packages/pixel-engine/src/editor/*`) is not
 * vendored — the chamber renders the Headmistress sitting at her
 * desk and does not expose furniture editing.
 */

export * from "./types";
export * from "./constants";
export * from "./rendering/office-state";
export * from "./rendering/renderer";
export * from "./rendering/game-loop";
export * from "./rendering/characters";
export * from "./rendering/matrix-effect";
export * from "./layout/tile-map";
export * from "./layout/layout-serializer";
export * from "./layout/furniture-catalog";
export * from "./sprites/sprite-data";
export * from "./sprites/sprite-cache";
export * from "./tool-utils";
