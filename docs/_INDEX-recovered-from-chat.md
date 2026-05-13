# Recovered chat-only content — index

Everything below was sitting in chat scrollback only. It has now been
written back to disk in this sandbox so you can batch-copy it across to
`D:\The_Hangar\apps\production\holo-flow-studio\` on desktop.

The Codex routes + 8 entries are written as real source files so they
will compile if `lib/codex.tsx` is imported. The remaining items are
under `docs/_chat-*.md` as raw chat dumps — they need a final read /
edit pass before becoming committed code.

## A. Drop-in source files (ready to use)

Codex system (new, replaces what got lost in the reset):

- `lib/codex.tsx` — types, registry, helpers, CATEGORY_ORDER
- `app/codex/page.tsx` — listing page grouped by category
- `app/codex/[slug]/page.tsx` — detail page with prev/next + cross-refs
- `components/codex/entries/three-sixty-photography.tsx`
- `components/codex/entries/virtual-reality.tsx`
- `components/codex/entries/augmented-reality.tsx`
- `components/codex/entries/spatial-audio-explained.tsx`
- `components/codex/entries/kolor-autopano-historical.tsx`
- `components/codex/entries/ptgui-hugin-lightroom-stitching.tsx`
- `components/codex/entries/pano2vr-tour-building.tsx`
- `components/codex/entries/one-press-three-sixty-capture.tsx`

Three new entries that lived only in chat (now real files):

- `components/tutorials/entries/building-a-pov-led-rig.tsx`
- `components/articles/entries/on-editioning-photographs.tsx`
- `components/journal/entries/the-week-before.tsx`

Important: these three need their **registry hook-ups** added by hand
(I have not edited the existing `lib/articles.tsx`, `lib/tutorials.tsx`,
`lib/journal.tsx` files yet — they still point to one entry each):

```ts
// lib/tutorials.tsx
import BuildingAPovLedRig from "components/tutorials/entries/building-a-pov-led-rig";
// then add to ENTRIES:
{
  slug: "building-a-pov-led-rig",
  title: "Building a persistence-of-vision LED rig",
  date: "2026-05-12",
  kind: "tutorial",
  excerpt: "Weekend build of a Teensy + TLC5927 + 96 addressable LEDs rig that holds a photograph to a pixel.",
  Body: BuildingAPovLedRig,
},
```

```ts
// lib/articles.tsx
import OnEditioningPhotographs from "components/articles/entries/on-editioning-photographs";
{
  slug: "on-editioning-photographs",
  title: "On Editioning Photographs",
  date: "2026-05-11",
  kind: "article",
  excerpt: "The edition is a promise. A note on sizes, artist's proofs, certificates, and what it means to close one.",
  Body: OnEditioningPhotographs,
},
```

```ts
// lib/journal.tsx
import TheWeekBefore from "components/journal/entries/the-week-before";
{
  slug: "the-week-before",
  title: "The week before",
  date: "2026-05-13",
  kind: "journal",
  excerpt: "Pre-flight notes. The drone fleet on the bench, the time-sync firmware for first flights, tomorrow's shoot.",
  Body: TheWeekBefore,
},
```

The Codex entries also need a corresponding **nav / footer link** —
add `/codex` to `FALLBACK_MENU` in `components/layout/navbar/index.tsx`
and to the Studio list in `components/layout/footer.tsx`.

## B. Master copy doc (already a real .md)

- `docs/copy-master.md` — every public page's copy in one document,
  for refinement in Google Docs. ~28kB.

## C. Raw chat dumps (need a voice-pass / decision before use)

These are the assistant-message texts pulled straight out of chat
transcripts. Treat them as drafts, not source:

- `docs/_chat-three-entries-source.md` — the chat message that
  produced the three new tutorial/article/journal entries above. Kept
  as reference so you can see the introduction + footnotes I wrote
  about each one.
- `docs/_chat-early-codex-source.md` — the pre-voice-update plain
  draft of the first five Codex entries (poi, persistence-of-vision,
  pov-led-array, long-exposure-photography, and the early
  uk-caa-drone-regulations sketch). Needs voice-passing into
  Adams-Pratchett before commit.
- `docs/_chat-codex-uk-caa-and-misc.md` — later codex roadmap +
  uk-caa material in the new voice.
- `docs/_chat-codex-roadmap.md`,
  `docs/_chat-codex-roadmap-2.md`,
  `docs/_chat-codex-roadmap-3.md` — successive cuts of the Codex
  taxonomy / category fill-list. Useful for deciding what to write
  next.
- `docs/_chat-tutorial-stream-source.md` — the 2017 VeeR → 2026
  modern-systems tutorial stream index (T01–T10 mapping).
- `docs/_chat-evolution-statement.md` — the "Dimona has evolved
  traditional light painting into the modern era…" copy and
  variants.
- `docs/_chat-business-card-titles.md` — the ten business-card
  title options for the DM's expo (27 Manchester).
- `docs/_chat-paper-comparison-notes.md` — Hahnemühle vs Canson
  comparison notes for a future article.

## D. Pending (still only in summary text, not yet drafted)

- Voice-pass of the five early Codex entries listed above
- Codex categories not yet seeded: Apparatus deep-dives (Pixelstick,
  Magiblade, Teensy, addressable LEDs, Hall-effect sensor), Drone
  (Mavic 2 Pro, drone-mounted light painting), Production (SLA, voxel
  tracing, acrylic light waveguide, edge lighting), Print
  (Hahnemühle papers, Canon PROGRAF, ICC profiles), Commerce (edition
  size, certificate of authenticity), Community (Reuben Wu, Eric
  Staller, Trevor Williams, Light Painting World Alliance, pixel poi
  scene)
- Tonight's drone flight journal entry — both the success and
  failed-test variants
- Other tutorials queued: stitching workflow walkthrough, FPV
  pipeline setup, ambisonic recording, programming POV frames,
  capture-to-geometry pipeline
- Other articles queued: Hahnemühle vs Canson, Mavic 2 Pro as
  editorial camera, stitching seams meditation, photographing one's
  own gestures, flow-arts to fine-art lineage
- Other journal entries: first photograph recollection, specific
  shoot record writeup, Salford studio bench inventory

## E. Operational TODOs on your side (separate from content)

- Shopify Payments activation
- Six webhooks
- Delete the test product
- Termly policies
- Klaviyo / Plausible env vars in Vercel
- Firebase env vars in Vercel
- Real GLB uploads
- Real photograph uploads
- Custom domain DNS (already set)
