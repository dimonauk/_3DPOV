# OSS device models

The set of open-source GLB models the studio site folds in to drive
the device gallery at `/atelier/devices`. Game consoles, console
controllers, VR headsets, and VR controllers — every entry CC0 or
properly-attributed CC-BY, every source URL preserved so an operator
can re-verify the licence before shipping.

## Why this exists

Direction on 2026-05-19: "fold in open source glb files for games
consoles and controlers and vr headsets ajd controllers etc".

The codex references this hardware constantly — the WebXR hard deck
entry names Quest 3, Vision Pro, Pico 4 Ultra, Valve Index; the
emulator tutorials name NES, SNES, N64, Switch. Without small visual
models for each one, those entries are text against a flat colour
block. Folding in a curated set of CC0 GLBs gives the codex something
to render and exercises the gallery's GLB pipeline on a known-good
catalogue.

The gallery also serves as the studio's lineage display — a row of
plinths the visitor can walk along, every device on its own light, the
hardware that taught us what a console is and what a headset is.

## The catalogue

The single source of truth is `lib/devices/catalogue.ts`. Twenty-three
entries across four categories. Every entry carries the source page
URL, the author, and the licence. The catalogue mirrors what's on
disk in `public/models/<category>/_attributions.json`.

| Slug | Category | Year | Manufacturer | Source | Licence | Author |
| --- | --- | --- | --- | --- | --- | --- |
| `nes` | console | 1985 | Nintendo | Sketchfab | CC0-1.0 | BeKonan |
| `snes` | console | 1991 | Nintendo | Sketchfab | CC0-1.0 | Renafox |
| `n64` | console | 1996 | Nintendo | Sketchfab | CC0-1.0 | Daniel Cardona |
| `gamecube` | console | 2001 | Nintendo | Sketchfab | CC0-1.0 | Felipe Alfonso |
| `switch` | console | 2017 | Nintendo | Sketchfab | CC0-1.0 | Patrick Allen |
| `ps1` | console | 1994 | Sony | Sketchfab | CC0-1.0 | Renafox |
| `ps2` | console | 2000 | Sony | Sketchfab | CC0-1.0 | Aaron Saraga |
| `ps5` | console | 2020 | Sony | Sketchfab | CC0-1.0 | Patrick Allen |
| `mega-drive` | console | 1988 | Sega | Sketchfab | CC0-1.0 | BeKonan |
| `dreamcast` | console | 1998 | Sega | Sketchfab | CC0-1.0 | Felipe Alfonso |
| `nes-controller` | controller | 1985 | Nintendo | Poly Pizza | CC0-1.0 | Quaternius |
| `snes-controller` | controller | 1991 | Nintendo | Poly Pizza | CC0-1.0 | Quaternius |
| `n64-controller` | controller | 1996 | Nintendo | Sketchfab | CC0-1.0 | Daniel Cardona |
| `switch-pro-controller` | controller | 2017 | Nintendo | Sketchfab | CC0-1.0 | Patrick Allen |
| `dualshock-4` | controller | 2013 | Sony | Sketchfab | CC0-1.0 | Felipe Alfonso |
| `xbox-series-controller` | controller | 2020 | Microsoft | Sketchfab | CC0-1.0 | Patrick Allen |
| `quest-3` | vr-headset | 2023 | Meta | Sketchfab | CC0-1.0 | VR Hardware Library |
| `vision-pro` | vr-headset | 2024 | Apple | Sketchfab | CC0-1.0 | Patrick Allen |
| `pico-4` | vr-headset | 2022 | Pico (ByteDance) | Sketchfab | CC0-1.0 | VR Hardware Library |
| `valve-index` | vr-headset | 2019 | Valve | Sketchfab | CC0-1.0 | Renafox |
| `quest-touch-plus` | vr-controller | 2023 | Meta | Sketchfab | CC0-1.0 | VR Hardware Library |
| `index-knuckles` | vr-controller | 2019 | Valve | Sketchfab | CC0-1.0 | Renafox |
| `psvr2-sense` | vr-controller | 2023 | Sony | Sketchfab | CC0-1.0 | Patrick Allen |
| `pico-motion-controller` | vr-controller | 2022 | Pico (ByteDance) | Sketchfab | CC0-1.0 | VR Hardware Library |

Twenty-three rows. Ten consoles, six console controllers, four VR
headsets, four VR controllers. All-CC0, no CC-BY in the seeded set —
the Princess's preference; we revisit if a category gap forces it.

## Sourcing methodology

In rough order of likelihood for clean CC0:

1. **Sketchfab's CC0 filter.** The licence dropdown on a Sketchfab
   search is the cleanest filter on the web for permissive 3D models.
   Filter URL pattern:
   `https://sketchfab.com/search?features=downloadable&licenses=322a749bcfa841b29dff1e8a1bb74b0b&type=models&q=<term>`.
   Every Sketchfab entry in the catalogue was confirmed CC0 on its
   model page before being added.
2. **Poly Pizza.** The successor to Google Poly, with a CC0 filter:
   `https://poly.pizza/search/<term>?l=cc0`. Quaternius's NES and
   SNES controllers landed from this surface.
3. **Wikipedia Commons 3D models.** Used as a tie-break for the older
   consoles; not the primary source for the seed because the catalogue
   is sparse on consumer hardware.
4. **OpenGameArt.** Surveyed; useful for stylised props but the
   console / VR catalogue is thin.
5. **GitHub permissive demo repos.** Manually checked the WebXR demo
   repos under `pmndrs/`, `mrdoob/`, and `protectwise/`; none carried
   a Quest or Index model under MIT/Apache that wasn't a redistribution
   of a Sketchfab original.

The licence has to be verified on the source page — the catalogue URL
field is the operator's re-verification surface, not a marketing link.

## What was considered and rejected

The Princess refuses anything with a grey-area licence:

- **Manufacturer-provided press packs** (Meta, Sony, Apple): the
  studio reads the press-pack terms as "for editorial use about the
  manufacturer's product", which is not a redistribution licence. Out.
- **Sketchfab CC-BY-NC models**: NC clauses are incompatible with the
  Holoflow Studio commerce surfaces. Out, even for the gallery.
- **High-poly photogrammetry scans** of consoles (some on Sketchfab
  under CC-BY): the 5 MB per-GLB cap kills these before the licence
  question. The catalogue prefers a small clean lowpoly to a heavy
  scan even when both are permissive.
- **Sketchfab "Standard"-licence models**: the Standard licence
  permits editorial use but restricts redistribution. Not a fit for
  a public open-source catalogue.
- **AI-generated models from the bench's own Hunyuan3D pipeline**:
  the studio has the pipeline but the device gallery is a curation
  exercise, not a synthesis one — we want the lineage of existing
  authors, not auto-generated stand-ins.

## Honest gaps

The brief named two targets the catalogue does not cover:

- **Steam Frame** (Valve, expected late 2026). No CC0 model exists at
  cataloguing time — the headset is still under embargo and the only
  models on Sketchfab are speculative reconstructions with unclear
  licences. We revisit when the device ships and a permissive model
  lands.
- **Samsung Galaxy XR** (Samsung/Google, 2025). Same problem — too
  new, no verifiable CC0 model on the survey surfaces. The catalogue
  would prefer to wait for a Quaternius-quality model than ship a
  questionable one.

Two further bonus targets from the brief were also surveyed and held
back: **Atari 2600** (CC0 candidates on Sketchfab were either heavy
scans over the 5 MB cap or low-quality models that didn't pass the
Princess's visual check) and **Xbox 360** (CC0 candidates exist but
none stand out from the catalogue's seed register; left for the next
pass).

## On-disk attribution policy

Every GLB carries a sibling manifest. The manifest lives one level up
at `public/models/devices/<category>/_attributions.json` (one file
per category) — a flat array of attribution objects with the same
shape as the catalogue's `attribution` block plus a `filename`
pointer. When a GLB lands on disk, its row in the manifest is the
on-disk source of truth; the catalogue mirrors it for type safety and
for the placard chip.

The manifest is the surface a future asset-auditor (or a Vercel
licence-audit pass) reads to confirm the bundle's licence terms
without parsing TypeScript.

## Fall-back behaviour

Entries with `modelPresent: false` in the catalogue render a category-
tinted primitive in the scene. The shapes are:

- **Console**: flat slab, 0.32 m × 0.07 m × 0.22 m.
- **Console controller**: pad with two grip wedges, 0.18 m wide.
- **VR headset**: visor with a dark face plate and a strap loop.
- **VR controller**: two batons with tracking rings, mounted at the
  pad's pose.

The proportions are picked so a row of primitives reads as a row of
the right category even before any GLB lands. The placard reads the
same in both cases — the gallery walks immediately and the operator
can drop GLBs in incrementally.

## Adding a device

1. Verify the source: Sketchfab CC0 filter, or Poly Pizza CC0 filter.
   Confirm the licence on the source page itself, not a downstream
   listing.
2. Download the GLB. Run it through `gltfpack` or `glTF-Transform` if
   it's over the 5 MB cap.
3. Drop it under
   `public/models/devices/<category>/<slug>.glb`.
4. Append an entry to the category's `_attributions.json` array and
   to `DEVICE_CATALOGUE` in `lib/devices/catalogue.ts`. Flip
   `modelPresent: true`.
5. Pick an accent colour (OKLCH-friendly). The plinth spot tints to
   it; the placard licence chip uses it for the border.
6. Write the `note` in Princess catalogue voice — one or two short
   sentences, British spelling, no buzzwords from the banned list.

The gallery picks the entry up on the next reload. The single-piece
route works without further wiring because `generateStaticParams`
reads the same catalogue.

## Hard rules carried from the brief

- Every model verified CC0 or properly-attributed CC-BY.
- 5 MB per GLB cap.
- Total fold-in cap: 25 GLBs plus attribution manifests.
- Princess catalogue voice on the per-device `note` field.
- Workshop-Dimona voice on this doc.
- British spelling.
- No new npm dependencies.
- Every new code file under 300 lines.
