/**
 * app/sitemap.ts — Unified sitemap for holoflow.co.uk.
 *
 * Five sources, deduped by url:
 *
 *   1. Curated static routes: union of every href in the navbar
 *      (`components/layout/navbar-config.ts`) and the footer
 *      (`lib/footer-groups.ts`). Editing those config files is the
 *      only place we need to touch when a public surface moves.
 *
 *   2. Atelier chambers: every `app/atelier/<slug>/page.tsx` on disk.
 *      Walked from the filesystem at request time so adding a new
 *      chamber doesn't need a sitemap edit.
 *
 *   3. Long-form content registries: `articles`, `journal`,
 *      `tutorials`, `codex`. Each entry's `date` field drives
 *      `lastModified` so Google sees a stable update cadence.
 *
 *   4. Shopify-backed routes: collections, products, CMS pages.
 *      Pull from the cached helpers so a slow Shopify response can't
 *      stall the sitemap.
 *
 *   5. Implicit "/" — the root, always present.
 *
 * # Exclusions
 *   - Session-scoped routes (`/signin`, `/cards/mine`, `/wallet`).
 *     They render differently per-user; Google has no use for them.
 *   - Admin routes (anything under `/admin`) — gated by
 *     `isAdminEmail()` and noindex'd by default.
 *
 * # Resilience
 * Each source is wrapped in its own try/catch: a transient Shopify
 * outage drops Shopify routes from the sitemap, but the static +
 * registry-driven routes still ship. The function never throws.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

import type { MetadataRoute } from "next";

import { createLogger, errToObject } from "lib/log";
import { getPages } from "lib/shopify";
import { getCollections, getProducts } from "lib/shopify/cached";
import { baseUrl, validateEnvironmentVariables } from "lib/utils";

import { GROUPS } from "components/layout/navbar-config";
import { FOOTER_GROUPS } from "lib/footer-groups";
import { articles } from "lib/articles";
import { journal } from "lib/journal";
import { tutorials } from "lib/tutorials";
import { codex } from "lib/codex";

export const dynamic = "force-dynamic";

const log = createLogger("sitemap");

/** Routes we deliberately exclude — session-state, admin, drafts. */
const EXCLUDED_PREFIXES: ReadonlyArray<string> = [
  "/admin",
  "/signin",
  "/wallet",
  "/cards/mine",
];

function isExcluded(href: string): boolean {
  return EXCLUDED_PREFIXES.some((p) => href === p || href.startsWith(`${p}/`));
}

type Route = { url: string; lastModified: string };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  validateEnvironmentVariables();

  const nowIso = new Date().toISOString();
  const seen = new Map<string, Route>();
  const add = (path: string, lastModified: string) => {
    if (isExcluded(path)) return;
    const url = `${baseUrl}${path}`;
    if (!seen.has(url)) {
      seen.set(url, { url, lastModified });
    }
  };

  // Root — always present.
  add("", nowIso);

  // Curated static routes from navbar + footer.
  for (const group of GROUPS) {
    for (const link of group.links) add(link.href, nowIso);
  }
  for (const group of FOOTER_GROUPS) {
    for (const link of group.links) add(link.href, nowIso);
  }

  // Atelier chambers — every `app/atelier/<slug>/page.tsx` on disk.
  try {
    const slugs = await listAtelierChambers();
    for (const slug of slugs) add(`/atelier/${slug}`, nowIso);
  } catch (err) {
    log.warn("sitemap:atelier_walk_failed", { err: errToObject(err) });
  }

  // Long-form content registries.
  for (const e of articles) add(`/articles/${e.slug}`, isoDate(e.date));
  for (const e of journal) add(`/journal/${e.slug}`, isoDate(e.date));
  for (const e of tutorials) add(`/tutorials/${e.slug}`, isoDate(e.date));
  for (const e of codex) add(`/codex/${e.slug}`, isoDate(e.date));

  // Shopify-backed routes — wrap in their own try/catch so a slow or
  // failing Shopify response can't kill the whole sitemap. Each
  // section that fails just drops its rows from the output.
  await Promise.allSettled([
    (async () => {
      try {
        const collections = await getCollections();
        for (const c of collections) add(c.path, c.updatedAt ?? nowIso);
      } catch (err) {
        log.warn("sitemap:shopify_collections_failed", { err: errToObject(err) });
      }
    })(),
    (async () => {
      try {
        const products = await getProducts({});
        for (const p of products) add(`/product/${p.handle}`, p.updatedAt ?? nowIso);
      } catch (err) {
        log.warn("sitemap:shopify_products_failed", { err: errToObject(err) });
      }
    })(),
    (async () => {
      try {
        const pages = await getPages();
        for (const p of pages) add(`/${p.handle}`, p.updatedAt ?? nowIso);
      } catch (err) {
        log.warn("sitemap:shopify_pages_failed", { err: errToObject(err) });
      }
    })(),
  ]);

  const out = Array.from(seen.values()).sort((a, b) => a.url.localeCompare(b.url));
  log.info("sitemap:built", { count: out.length });
  return out;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Walk `app/atelier/` and return one slug per directory that contains
 * a `page.tsx`. Skips dot-dirs and any directory without a page file
 * (e.g. shared `_components/`). Stable, deterministic order.
 */
async function listAtelierChambers(): Promise<string[]> {
  const root = path.join(process.cwd(), "app", "atelier");
  const entries = await fs.readdir(root, { withFileTypes: true });
  const slugs: string[] = [];
  for (const e of entries) {
    if (!e.isDirectory() || e.name.startsWith(".") || e.name.startsWith("_")) {
      continue;
    }
    try {
      await fs.access(path.join(root, e.name, "page.tsx"));
      slugs.push(e.name);
    } catch {
      // No page.tsx — not a public chamber.
    }
  }
  return slugs.sort();
}

/**
 * Coerce a content registry's `date` field (loose YYYY-MM-DD or full
 * ISO) into a sitemap-shaped ISO timestamp. Falls back to "now" if
 * the date is malformed — never throws.
 */
function isoDate(raw: unknown): string {
  if (typeof raw !== "string" || raw.length === 0) return new Date().toISOString();
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
}
