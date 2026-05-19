/**
 * templates/webxr-game-starter/route.ts — Route registration notes.
 *
 * Next 15 App Router does NOT route files that live outside the
 * `app/` tree. The starter ships with two entry points:
 *
 *   1. `templates/webxr-game-starter/page.tsx` — the canonical source
 *      of truth for the template. This is what you copy when you
 *      fork. Lives outside `app/` so it does NOT become a route on
 *      its own — that would clash with users who fork and end up
 *      with two routes resolving to the same path.
 *
 *   2. `app/templates/webxr-game-starter/page.tsx` — a 5-line server
 *      component that re-exports (1). This file IS the routable
 *      surface; navigate to `/templates/webxr-game-starter` in dev
 *      and you will land on the starter.
 *
 * Why this dance:
 *   - Next 15 treats every `page.tsx` inside `app/` as a route. If
 *     we put the canonical template at `app/templates/.../page.tsx`,
 *     anyone copying the directory would also have to delete-or-move
 *     that page to avoid colliding with their own route.
 *   - Splitting "canonical source" from "route surface" keeps the
 *     fork-and-rename ergonomic: copy `templates/webxr-game-starter/`,
 *     rename, point your own `app/<your-slug>/page.tsx` at it.
 *
 * Naming heads-up. This file is NOT a Next route handler. The name
 * `route.ts` lives here because the task spec asked for it; if Next
 * is ever taught to treat `templates/**` as routable, this file would
 * collide with the `page.tsx` neighbour. Rename to `ROUTING.md` if
 * that day comes.
 */

export const TEMPLATE_ROUTE = "/templates/webxr-game-starter";

export const TEMPLATE_ENTRYPOINTS = {
  canonical: "templates/webxr-game-starter/page.tsx",
  route: "app/templates/webxr-game-starter/page.tsx",
} as const;
