# The Hitchhiker's Interface — design notes

A page-based reading surface for Holoflow's catalogue of writing
(articles + journal + tutorials + codex entries) that takes its
aesthetic from the **on-screen stationery in the Alien films**
(Nostromo MU/TH/UR terminal pages, Weyland-Yutani briefing documents,
the in-suit HUDs) and its **interaction model** from the BBC
animations of *The Hitchhiker's Guide to the Galaxy* — each entry is
a self-contained "page" with diagrammatic insets, circuit-trace
connectors between callouts, and a quiet flip cadence instead of
infinite scroll.

Status: design sketch. Nothing built yet. This doc sits as the brief
for when the first page lands.

## Why this and why now

The site currently surfaces written work via three near-identical
list-plus-detail patterns (`/articles`, `/journal`, `/tutorials`).
The detail pages are vertical-scroll prose. That works as an archive
but loses two things that matter:

1. **Cross-reference becomes invisible.** Today's `related` field
   shows as a link list at the bottom of each detail page; visitors
   rarely scroll that far, and there is no spatial sense of how the
   pieces connect.
2. **Diagrams and images sit *inside* paragraphs instead of being
   *part of the page*.** A long-exposure photograph anchored to a
   journal entry about that exposure is currently a vertical block;
   on a Nostromo-style page it would be a labelled inset with the
   shutter / ISO / aperture numbers as callouts joined to it by
   circuit traces.

A page-based reader fixes both. Cross-references become *visible
edges* (animated circuit traces leading off the page to adjacent
entries the visitor can flip to). Images become *plates* with
callout connections to the paragraphs that reference them.

## The aesthetic — Alien on-screen stationery

The visual language to study (own existing skill if it doesn't yet
exist: `holoflow-alien-stationery`):

- **Type:** monospaced, slightly broken letterforms; mix of cap-only
  headings and lowercase body. Eurostile / Microgramma feel; we
  already use a custom monospace via `next/font`.
- **Plate edges:** thin bracket-corners (top-left, bottom-right), or
  full enclosing thin border with cut corners.
- **Colour palette:** the site's pink (#ff6fb5) instead of CRT
  green-amber; warm-black ground (#0a0a14) under everything; a
  desaturated cyan (~ #5ed4ff) for connector lines so they read as
  *separate* from text.
- **Status bars + frame chrome:** numeric counters at the top of each
  page (page number, total pages, current section / "FILE:
  HOLOFLOW//JOURNAL/THE-BUS-AT-FOUR"), thin progress lines.
- **Inset plates for images:** a labelled rectangle with the image
  filename, capture timestamp / shutter spec, alt text rendered as a
  caption line. Plate has bracket corners. Image sits inside a 4:3
  or 2:3 mat with a 1-2px chrome border.
- **Connector lines between items:** SVG paths that follow grid axes
  (no diagonals — read as schematic traces, not lines on a map). A
  trace can loop around the plate edges and exit the page toward a
  related entry. On hover, the trace highlights and the target
  entry's title shows as a tooltip near the page edge.

## The interaction — Hitchhiker's Guide

Each entry is *a page*. A page is a fixed viewport-sized canvas, not
a scroll container. Two interactions move you between pages:

1. **Forward/back across this entry.** Long entries are paginated —
   four to six pages, each with its own composition (text + plates +
   traces). Arrow-key + on-screen "▸" / "◂" advance; the URL
   updates with `?page=2`.
2. **Sideways to a related entry.** Each page exposes its cross-
   references along its edges; clicking a trace flies to that
   entry's first page. The history stack works (back-button goes
   back through pages, not through scroll position).

A small navigator at the bottom — like Hitchhiker's "ARTICLE: ___ /
INDEX" line — shows the current entry, its section, and the broader
location in the catalogue.

The pace is deliberate. Visitors read one page, look at the diagrams,
maybe flip to a referenced entry, come back. Closer to a book than a
scroll feed.

## Composition primitives

The page renderer composes from these primitives. (Each is one React
component; the page MDX/JSX declares which primitives go where.)

| Primitive | Role |
|---|---|
| `<Plate>` | Bracket-cornered text block. Body prose paragraph(s) live here. |
| `<ImagePlate>` | Image inset with caption + technical metadata strip (filename / shutter / aperture / ISO if photo, or filetype / triangle count if 3D). |
| `<Callout>` | Short label connected by a trace to another primitive. |
| `<Trace>` | SVG path between two primitives by id. Axis-aligned only. |
| `<PageHeader>` | "FILE: HOLOFLOW//<section>/<slug>" + page counter + section name. |
| `<PageFooter>` | "ARTICLE: <title> / INDEX → <section>" + forward/back arrows. |
| `<EdgeRef>` | A trace that exits the page toward a related entry, with a tooltip on hover. |

A page's JSX reads like a manual:

```tsx
<Page id="bus-at-four-p2" section="JOURNAL">
  <PageHeader file="HOLOFLOW//JOURNAL/THE-BUS-AT-FOUR" page={2} of={4} />

  <Plate id="p2-prose-1">
    The top deck of the first bus of the day is one of the best rooms…
  </Plate>

  <ImagePlate
    id="p2-image-1"
    src="/journal/the-bus-at-four/top-deck.jpg"
    alt="empty top deck, night bus"
    meta={["NIKON Z6", "f/2.8", "1/30s", "ISO 3200"]}
  />

  <Callout from="p2-image-1" to="p2-prose-1" anchor="best-rooms">
    "best rooms"
  </Callout>

  <EdgeRef to="why-night" edge="right" label="Why Night" />

  <PageFooter prev="bus-at-four-p1" next="bus-at-four-p3" />
</Page>
```

## What changes on the existing entries

Nothing breaks. The existing scroll-based detail pages stay live as
the canonical archive. The new surface is **additive** — a parallel
route, probably `/guide/<section>/<slug>` or `/manual/<section>/<slug>`,
that re-renders the same `Entry` data via the page-based primitives.

The `Entry` type already has everything we need: `Body` (the prose
paragraphs), `heroImage` (one plate), `related` (the edge-refs),
`furtherReading` (external traces, rendered differently). The new
surface walks the same data, just lays it out as pages instead of
scroll.

For entries with image-rich content (the new `the-bus-at-four` is
written specifically with image slots), the page renderer can fan
those slots out as separate plates with traces back to the paragraph
that references them. For prose-only entries (`year-one-fire` is the
canonical example), the page renderer still works — it just renders
two or three plates of prose per page and one or two edge-refs.

## Implementation phases

### Phase 0 — visual language

- [ ] Build `<Plate>`, `<ImagePlate>`, `<Callout>`, `<Trace>` as a
      standalone Storybook-style page (`/atelier/guide-primitives`)
      so the look is calibrated before any real entry uses them.
- [ ] Settle the pink + warm-black + cyan palette against the
      existing site shell. Decide if the manual chrome (status bars,
      page counter) keeps the studio's normal `next/font` mono or
      adopts a slightly broken-letterform variant for atmosphere.

### Phase 1 — single-page renderer

- [ ] `<Page>` component with viewport-fixed layout, keyboard
      forward/back, URL `?page=N` sync.
- [ ] `/guide/journal/the-bus-at-four` route that walks the existing
      entry's `Body` paragraphs into 3-4 pages with image plates.
- [ ] Trace rendering: SVG paths between primitive ids, axis-aligned,
      hover-highlight.

### Phase 2 — cross-entry edges

- [ ] `<EdgeRef>` primitive — page-edge traces with tooltip + click
      navigation to the target entry's first page.
- [ ] History stack works correctly across edges (back button goes
      back through previously-visited pages, including cross-entry).

### Phase 3 — auto-layout for prose-only entries

- [ ] A renderer that takes an entry whose `Body` is plain JSX (no
      explicit page hints) and lays it out as 3-6 pages with
      automatic plate sizing + automatic edge-ref placement around
      the page boundary.

### Phase 4 — the index page

- [ ] `/guide` itself: a 2D map of the catalogue. Entries as nodes,
      cross-references as traces, sections as territory. The map is
      the navigator; clicking a node opens its first page.

## What this is not

- Not a replacement for the existing list-and-detail routes; they
  remain the archive.
- Not infinite scroll. The whole point is fixed-page composition.
- Not a 3D / WebGL surface. The aesthetic is *2D screen stationery*;
  3D would break the manual-page metaphor.
- Not "every page has a video". Video can live in an `<ImagePlate>`
  for entries that warrant it (the lightpainting MP4 exports, the
  splat previews), but most pages stay still.
- Not an SPA-style transition fest. Page-flips can be a quiet fade or
  a stationery-style "next" mechanic — not whoosh-and-warp.

## Open questions

- **Mobile.** A fixed-page reader on a phone needs different
  geometry. Probably one plate per page on narrow viewports, with
  edge-refs as a swipe-up drawer. Worth prototyping with the
  bus-at-four entry first.
- **Accessibility.** Page navigation needs keyboard shortcuts +
  visible focus management. Traces are decorative and should be
  `aria-hidden`; the underlying cross-reference data should be
  reachable via a screen-reader-friendly link list.
- **Where the trace data lives.** Today the `related` field on
  `Entry` carries the cross-references. A trace also needs a *side*
  of the page to exit from (left / right / top / bottom). Either
  extend `related` with an optional `edge` field, or auto-layout
  it based on the visited / proximate set.

## When this lands

After Stripe is fully slotted (`docs/STRIPE-SLOT-IN.md`) and the
bureau loop is verified live. The Hitchhiker's interface is a
read-side experience improvement; the commerce loop is the
priority for the current sprint. This doc holds the brief so the
next time the studio has a calm afternoon, Phase 0 has somewhere
to start.
