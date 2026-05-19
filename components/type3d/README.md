# `components/type3d/` — display type as 3D mesh

What this folder is: the studio's display register rendered as
extruded mesh letters, not as glyphs from a webfont. Hero titles,
edition numerals, foil headers, section openers — the type that
wants to feel like an object, not text. Body prose stays HTML —
this kit deliberately doesn't replace `<p>`.

## What ships here

- `MeshText3D` — a `"use client"` React component. Drop-in for an
  HTML `<h1>` at hero scale. Renders the actual text in an
  `sr-only` mirror for assistive tech and search bots; the mesh
  canvas next to it is `aria-hidden`.

The renderer, the materials, and the Web Worker that tessellates
the glyph mesh live in `lib/type3d/` so the bundle code stays
co-located with its dependencies.

## The four materials

- `foil` — the pink-200 → lavender-200 → chrome-100 gradient
  sweep that matches the existing `.lux-foil` CSS treatment. Uses
  a metalness=1 physical material with a fragment-shader inject
  that mixes the three colour stops along world-y with a
  time-varying offset. Default. Pause-able by reduced-motion.
- `chrome` — neutral polished metal. High clearcoat, low
  roughness. Sits well when the plate around it is already loud.
- `matte` — warm-black with subtle ambient. The plate-carries-
  the-colour case — for instance an edition numeral on a chrome
  foil cover where the title is the protagonist.
- `glass` — transmissive, thin-walled. Editorial moments — drop
  caps on a long-read, the table-of-contents numerals on a
  poster, that sort of thing.

## When to reach for `MeshText3D`, and when to leave it HTML

Rule of thumb: if the type is **display register** AND it's
**on-screen at hero-plate scale** AND it's **above the fold or
clearly hero-anchored**, use mesh. Otherwise leave it HTML.

That means:

- Yes for: `<LuxCover>` titles, `<EditionNumeral>` plates, the
  opening header of a section opener, an issue band's big year,
  a print-quality drop title on `/cards/[slug]`.
- No for: every `<h2>` inside an article, navigation labels,
  toasts, button copy, error messages, the cart, the checkout.
  Body prose is HTML. The site needs to reflow, search, copy,
  and translate.

The performance budget says the same thing. One MeshText3D per
viewport plate is fine. Six MeshText3Ds in a TOC list is not.

## Performance budget

- The glyph mesh is built in `lib/type3d/font-mesh.worker.ts`,
  off the main thread. The worker is registered in
  `lib/workers/registry.ts` under the `font-mesh` kind so it
  shares the singleton-per-page lifecycle and the page-hide
  teardown the rest of the workers use.
- A typical hero string (under 40 characters, default depth 12,
  default curve segments 6) takes well under a frame's-worth of
  worker time to tessellate.
- The render loop pauses when the canvas leaves the viewport
  (IntersectionObserver, threshold 0.01) and when the tab is
  hidden (`visibilitychange`). A page that scrolls the mesh out
  of view pays no GPU cost until the user scrolls back.
- Device-pixel-ratio is capped at 2 so retina + 4k displays
  don't quietly burn VRAM on chamfer detail nobody sees.
- Three.js is dynamic-imported from inside the renderer module.
  A page that never mounts a `MeshText3D` never ships three. The
  WebGPU code path is a separate dynamic import — browsers
  without `navigator.gpu` never load `three/webgpu`.

## Accessibility

- The text always renders in an offscreen `<span class="sr-only">`
  wrapped in the requested tag (`h1` / `h2` / `h3` / `div`). This
  is what screen readers, search bots, and select-to-copy actually
  consume. The mesh canvas is `aria-hidden="true"` so it never
  doubles up.
- The semantic tag (`tag` prop) defaults to `div`. Pass `h1` (or
  whichever heading level fits the document outline) when the
  mesh is genuinely a heading. Don't hide an `h1` from the
  outline by leaving the default.
- The fallback path is the same DOM node. If WebGL/WebGPU is
  unavailable, that `sr-only` span is promoted to a visible
  display-serif heading — the page never goes blank for users on
  a browser that can't run the mesh, and the heading still
  participates in the outline.

## Reduced-motion

`prefers-reduced-motion: reduce` is honoured. The mesh still
renders — refusing to draw a hero title because the user prefers
calm motion would be a worse outcome — but:

- the `motion="drift"` idle rotation is suppressed;
- the `motion="tilt-on-hover"` pointer listener never attaches;
- the foil gradient sweep stops updating after the initial paint
  so the chrome sits still.

## File map

```
components/type3d/MeshText3D.tsx     The React component
lib/type3d/renderer.ts               MeshTextRenderer class
lib/type3d/materials.ts              foil / chrome / matte / glass
lib/type3d/font-mesh.ts              Typed wrapper around the worker
lib/type3d/font-mesh.worker.ts       TextGeometry off the main thread
public/fonts/3d/                     Typeface JSON, served as static
```

The Web Worker is registered in `lib/workers/registry.ts` under
the `font-mesh` kind. The literal `new URL("../type3d/...", import.meta.url)`
form is required for Turbopack to find it.

## A note on the fonts

The display font shipped in this commit is **Droid Serif Regular**,
served from `public/fonts/3d/display-droid-serif-regular.typeface.json`.
The brief asked for Cormorant Garamond — the typeface JSON format
that Three.js consumes is generated by Facetype.js from a TTF, and
the studio doesn't have a converted Cormorant artefact yet. Droid
Serif is the closest hero-suitable serif Three ships for free.

When Cormorant is converted, drop the JSON into
`public/fonts/3d/display-cormorant-garamond-regular.typeface.json`
and update the `display` entry in `FONT_PATHS` inside
`lib/type3d/font-mesh.worker.ts` — the worker will fall back to
`fallback-helvetiker-regular.typeface.json` if either path
404s, so a bad swap won't blank the page.

Mono uses Droid Sans Mono and sans uses Droid Sans for the same
reason. Same swap pattern applies when JetBrains Mono + Inter
are converted.
