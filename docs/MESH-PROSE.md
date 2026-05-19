# Mesh prose — body text as 3D mesh

A short note on why body text is now a mesh, how the shared scene
holds it, and where this system stops earning its keep.

## Why this exists

Direction from 2026-05-19: "everything needs to be 3d meshs … including
text." Head and eye tracking now drive the camera on holoflow.co.uk.
The moment the camera moves, anything painted as HTML stops sharing
a coordinate space with anything painted as mesh — the HTML stays
nailed to the viewport while the meshes parallax around behind it,
and the seam between the two becomes visible immediately.

The fix is to bring body text into the same 3D scene as the rest of
the page chrome. Hero titles already got there via `MeshText3D`
(extruded glyphs, TextGeometry). Body text needs a different
technique because the per-glyph polygon count of TextGeometry would
melt the budget on the first paragraph. The body register uses
signed-distance-field text instead — one quad per glyph, antialiased
at any zoom, ~80kb library, worker for the SDF generation.

## The library — troika-three-text

`troika-three-text` (MIT, ~80kb) is the SDF text renderer the
codebase uses for body prose. The package ships its own worker
which generates the glyph SDFs off the main thread, so the page
doesn't stall while a paragraph lays out. We dynamic-import the
module so pages that never mount a `MeshProseLayer` don't pay the
bundle weight.

Worker integration: troika handles this internally. The worker
script is bundled and instantiated by the library on first
`Text.sync()` call. If Turbopack ever chokes on the embedded
worker URL, the fix is to wrap our own worker in
`lib/type3d/` mirroring `font-mesh.worker.ts`. As of the initial
build the bundled worker works under Next 15 + Turbopack.

## The shared scene

One canvas, one renderer, one camera, one render loop. Every
`<MeshProseLayer>` registers its troika Text mesh into the same
scene rather than spinning up a renderer of its own. The
`<MeshSceneProvider>` component owns the canvas (`position: fixed;
inset: 0; pointer-events: none; z-index: -1`) and exposes the
registry through React context.

This matters for three reasons.

First, one canvas means one camera. When the tracking system
publishes a `viewerpose` CustomEvent on `window`, every mesh in
every layer moves together because they all share the camera. If
each layer carried its own renderer, the camera would have to be
cloned and re-aimed per layer and the parallax bands would
desynchronise.

Second, one renderer means one WebGL/WebGPU context, which is the
only sustainable approach — browsers cap the number of live
contexts at around 8-16 and pages with many paragraphs would hit
that cap immediately.

Third, one render loop means one rAF subscription. The loop pauses
when the page is hidden, pauses when no layers are registered, and
resumes when a layer mounts. Pages with no mesh prose never
schedule a frame.

## Progressive enhancement

HTML always wins for accessibility and SEO. The `<MeshProseLayer>`
wrapper renders its children as normal HTML on the server and on
first paint. The mesh upgrade only mounts when:

  - a `MeshSceneProvider` is present somewhere above (`useMeshSceneAvailable`)
  - the device supports WebGL or WebGPU
  - `prefers-reduced-motion` is not `reduce`
  - the reader hasn't opted out via `MeshSceneToggle`

When all four hold, the layer builds a troika Text mesh from the
wrapper's `textContent`, registers it with the provider, and drops
the HTML's `color` to transparent so the mesh paints in its place.
The HTML stays at full size for layout — the page is laid out by
HTML, the mesh just paints over the same rectangle.

When any of the four don't hold, the HTML stays visible and no
mesh ever mounts. Screen readers read the HTML. Search bots index
the HTML. Select-to-copy works against the HTML. The mesh is an
overlay; the document is text.

## Performance budget

Working figures for the initial cut:

  - **Glyph cap per scene:** around 4,000 visible glyphs. Each
    glyph is a four-vertex quad, so the scene's vertex count
    stays under ~16,000 even with a long-form article fully
    in view. troika culls offscreen layers automatically.
  - **SDF texture footprint:** one texture per font face, around
    1MB on disk and ~4-8MB on the GPU after upload. Three fonts
    (sans, mono, display) = ~24MB GPU ceiling.
  - **Worker boot:** ~200ms for the troika worker on first use.
    Pre-warmed by the provider's idle-time hook when it lands.
  - **rAF:** ~3-5ms per frame for the position re-park pass on
    a desktop GPU, well inside the 16.6ms budget.

If the figures slip, the first lever is the glyph cap — gate
`MeshProseLayer` registration on viewport visibility so prose
that's scrolled out of view doesn't sit in the scene at all.

## Opt-out path

`<MeshSceneToggle>` writes `holoflow.mesh-scene.opt-out=1` to
localStorage and broadcasts a `holoflow:mesh-scene-toggle`
CustomEvent so every `useMeshSceneAvailable` hook in the current
tab picks up the change without a reload. Other tabs sync via the
native `storage` event.

The toggle belongs in the same surface as the existing
accessibility controls — footer chrome, settings drawer, wherever
that surface ends up living.

## When NOT to use MeshProseLayer

Don't wrap:

  - **Forms.** Inputs, textareas, selects — the mesh can't be
    typed into. Keep HTML.
  - **Links the reader clicks.** A mesh paint over a link still
    leaves the link clickable (HTML stays in the tab order), but
    the visual feedback gets muddier than it needs to. Keep HTML
    for anchor-heavy passages, or accept that the mesh paints
    over an `underline`.
  - **Code blocks with syntax highlighting.** The mesh paints
    one colour per layer; preserving the token colours would
    require splitting into many layers and adds nothing the
    reader notices at body scale. Keep HTML.
  - **Anything that mutates after mount.** The mesh reads
    `textContent` once at mount. If the content changes, the
    HTML updates but the mesh doesn't. Remount the wrapper to
    refresh.

Use `MeshProseLayer` for paragraphs, list items, captions,
pull-quotes, and any block of static narrative prose that fills a
`prose-gallery`. The showcase is the first paragraph of
`two-new-diagram-tools-on-the-bench` — wrap one paragraph at a
time and gauge the perf hit before scaling up.

## See also

  - `components/type3d/MeshText3D.tsx` — the display-register
    sibling. Same shared-scene contract, different rendering
    technique (TextGeometry, extruded polygons).
  - `docs/PARALLAX.md` — the scroll-driven parallax layer; the
    mesh scene and the parallax store run in parallel without
    interaction.
  - `docs/WORKERS.md` — the shared worker registry. troika
    manages its own worker, so it isn't registered there, but
    the lifecycle pattern (lazy boot, `pagehide` teardown) is the
    same.
