# Articles registry split — migration plan

`lib/articles.tsx` is 3345 lines, holding the registry array for 42
article entries. Each entry's metadata (slug, title, date, kind, excerpt,
related[], furtherReading[]) lives in the central array, while the
React Body lives in `components/articles/entries/{slug}.tsx`.

Per `docs/ARCHITECTURE.md` Rule 1 (300-line cap) and Rule 5b (every
code file has a `.PURPOSE.md` or colocated metadata), the registry is
migrating to a **colocation pattern**: each entry component file owns
its own typed `entry` record as a named export. `lib/articles.tsx`
shrinks to a thin import-and-sort module.

## The pattern (one entry)

**Before** — central registry holds the data, component file holds only
the Body:

```tsx
// lib/articles.tsx
import OnEditioningPhotographs from "components/articles/entries/on-editioning-photographs";

const ENTRIES: Entry[] = [
  // ... other entries
  {
    slug: "on-editioning-photographs",
    title: "On Editioning Photographs",
    date: "2026-05-11",
    kind: "article",
    excerpt: "The edition is a promise...",
    Body: OnEditioningPhotographs,
  },
];
```

```tsx
// components/articles/entries/on-editioning-photographs.tsx
import CodexRef from "components/codex/codex-ref";

export default function OnEditioningPhotographs() {
  return ( /* JSX */ );
}
```

**After** — component file owns the record:

```tsx
// lib/articles.tsx
import { entry as onEditioningPhotographsEntry } from
  "components/articles/entries/on-editioning-photographs";

const ENTRIES: Entry[] = [
  // ... other entries
  onEditioningPhotographsEntry,
];
```

```tsx
// components/articles/entries/on-editioning-photographs.tsx
import CodexRef from "components/codex/codex-ref";
import type { Entry } from "lib/writing";

export default function OnEditioningPhotographs() {
  return ( /* JSX */ );
}

export const entry: Entry = {
  slug: "on-editioning-photographs",
  title: "On Editioning Photographs",
  date: "2026-05-11",
  kind: "article",
  excerpt: "The edition is a promise...",
  Body: OnEditioningPhotographs,
};
```

## Why colocation, not chunking

Chunking — splitting `lib/articles.tsx` into `lib/articles/registry-a.tsx`
etc. — was considered and rejected. It hides the size problem in
multiple ~700-line files rather than solving it. Each entry's
metadata belongs *with* the component that renders it — when the prose
changes, the date often changes; when the body adds a cross-reference,
related[] needs the same href. Keeping data + Body in one file makes
those edits atomic.

## Migration order

1. **POC** (done — `on-editioning-photographs`, commit `<this commit>`)
2. **Entries with no related[] or furtherReading[]** — smallest moves,
   build muscle memory:
   - `on-editioning-photographs` ✅
   - any others with bare metadata
3. **Entries with related[] only** — modest size
4. **Entries with both related[] and furtherReading[]** — the largest
   migrations; do these last, one per commit so they're reviewable
5. **The trunk pieces** (`why-i-build-my-own-rigs`, `why-i-build-modular`,
   `the-familiar`, `spiral-cognition`, `the-living-stage`,
   `vr-pov-controllers-the-product`) — load-bearing per the
   curriculum audit (`docs/BACKWARDS_DESIGN.md`); migrate last with
   extra eyeballs on the diff

## Acceptance criteria when migration completes

- [ ] `lib/articles.tsx` is < 100 lines (just 42 imports + the array
      + the sort + the helpers).
- [ ] Every file in `components/articles/entries/*.tsx` exports an
      `entry` named export typed as `Entry`.
- [ ] `pnpm typecheck` clean.
- [ ] `pnpm test:e2e` Playwright sweep passes — all article routes
      still render.
- [ ] One trial deploy to a Vercel preview, click into 5 random
      articles, confirm related[] + furtherReading[] still render.

## Sibling files

The same pattern applies to `lib/journal.tsx` (13 entries, 472 lines)
and `lib/tutorials.tsx` (10 entries, 690 lines). Once the article
migration is proven, sibling migrations follow with the same recipe.

`lib/codex.tsx` is different — codex entries have richer metadata
(category, seeAlso, sources) and may want their own `.codex.ts` twin
files rather than colocation. Decide separately.
