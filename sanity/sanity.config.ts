/**
 * sanity/sanity.config.ts — Sanity Studio configuration for Holoflow.
 *
 * One-line role: the schema + plugin registry the embedded Studio mounts
 * at `/studio` reads at boot. Reads project id + dataset from env so the
 * same config powers staging and production.
 *
 * # Posture
 * Scaffold-only. The `sanity` package (Studio core) is not currently a
 * direct dependency — only `@sanity/client` + `next-sanity` are. The
 * operator installs `sanity` (and `styled-components` per next-sanity's
 * peer deps) when they actually want the Studio. Until then, this file
 * type-checks against `sanity`'s exports through the `next-sanity`
 * peer-dependency graph; the Studio mount at `app/studio/[[...tool]]`
 * lazy-imports it and renders a "not configured" page when missing.
 */

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";

import { schemaTypes } from "./schemas";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

/** API version. Pin to the date the schemas were authored; bumping later
 *  is a conscious choice, not an implicit one. */
export const apiVersion = "2026-05-14";

export default defineConfig({
  name: "holoflow-studio",
  title: "Holoflow Studio",
  projectId,
  dataset,
  plugins: [structureTool()],
  schema: { types: schemaTypes },
});
