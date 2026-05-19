# Resources — low-poly + cel-shaded + stylised NPR

A workshop index for the aesthetic the studio site keeps reaching for. Faceted geometry, ramp-shaded surfaces, flat colour with a single fresnel rim, hand-painted texture maps that don't pretend to be photographic. The catalogue below is "where to look for what" — not an attempt to list every CC0 site on the open web.

Everything here is CC0, MIT, Apache-2.0, Zlib, BSD, or OFL. Licence column is honest; if you fold a real asset into the repo, attribute it in the file header + add a row to `docs/ATTRIBUTIONS.md`.

The shader side lives in `docs/TSL-MATERIALS.md` and the OSS shader sources are in `docs/OPEN-SOURCE-STACK.md` under "Rendering & 3D". This doc is the asset + tooling + reading-material side.

## Reach for first

When the brief is "a low-poly prop fast, doesn't need to be original":
**[Kenney.nl](https://kenney.nl/assets)**. CC0, packs are coherent, geometry comes optimised. No attribution required, though credit anyway.

When the brief is "a stylised character or set-dressed scene":
**[Quaternius](https://quaternius.com/)**. CC0, the packs hold together visually, the topology is clean enough to retarget.

When the brief is "I know what I want but I don't know who made it":
**[Poly Pizza](https://poly.pizza/)**. Successor to Google Poly; filter the search by CC0 so the attribution stays simple. CC-BY entries are fine if you credit the author in the catalogue `note`.

When the brief is "a captured surface — wood, paper, painted metal":
**[ambientCG](https://ambientcg.com/)**. CC0, PBR-set complete (colour / normal / roughness / displacement). The TSL preset library is procedural-first, but the captured stuff slots in when a scene wants a real swatch.

When the brief is "an environment map for the scene to sit in":
**[Poly Haven](https://polyhaven.com/)**. CC0 HDRIs at studio resolution. Use the 2K set for in-browser scenes, the 4K+ for stills.

## When the asset needs to shrink

A model from any of the catalogues above is going to be heavier than the studio's WebGPU budget. Pipe it through one of these before it lands under `public/models/`:

- **[gltfpack](https://github.com/zeux/meshoptimizer)** (part of meshoptimizer, MIT). The default first pass. `gltfpack -i in.glb -o out.glb -cc` simplifies, optimises vertex cache, and applies meshopt compression. Default settings are sensible.
- **[glTF-Transform CLI](https://github.com/donmccurdy/glTF-Transform)** (MIT). When the transform needs to be scripted — flat normals, weld vertices, prune unused materials. `npx @gltf-transform/cli` works without an install.

Neither needs to be a runtime dependency. Run them at the bench, commit the optimised glb, move on.

## When the geometry needs to be re-topologised

The CC0 catalogues sometimes ship triangle soup. For a quad re-mesh:

- **Blender's built-in Decimate modifier** is fine for a quick collapse. Set "Planar" mode if you want to preserve flat facets.
- **[instant-meshes](https://github.com/wjakob/instant-meshes)** (BSD-3-Clause from the paper repo) for field-aligned quad re-meshing. Heavier than the Blender modifier; reach for it when the topology will be visible (a hero piece, an animated mesh).

The studio's preference: leave the facets as facets unless the mesh will be subdivided or skinned. The aesthetic _is_ the triangle count.

## When the scene needs UI in 3D space

Two paths:

- **2D React panels overlaid on the canvas** — the default. Works in every browser, sits in the DOM, the studio's chrome system handles it.
- **[@react-three/uikit](https://github.com/pmndrs/uikit)** (MIT) — for WebXR surfaces where the DOM can't follow. Flexbox-laid-out 3D meshes. Not yet wired into the site; on the shortlist for the XR-first surfaces.

## When the page wants a different typeface

Self-host via `next/font/google` rather than CDN. The OFL pools to pull from:

- **[Google Fonts](https://github.com/google/fonts)** — the canonical OFL bucket. Cormorant Garamond, Inter, JetBrains Mono all live here. Default first stop.
- **[Velvetyne](https://velvetyne.fr/)** — experimental display typefaces in a magazine-art register. Useful when a section opener needs weight the studio set doesn't carry.
- **[The League of Movable Type](https://www.theleagueofmoveabletype.com/)** — workhorse OFL fonts. League Spartan, Knewave, Goudy Bookletter — reliable when the studio set is wrong.

Confirm per-font OFL on Velvetyne — most are, a few are differently-licensed. Read the licence before shipping.

## Reading material — OSS in this aesthetic

Not for folding in. For studying how someone else solved a thing.

- **[Open Brush](https://github.com/icosa-foundation/open-brush)** (Apache-2.0). The community fork of Tilt Brush. The cel-style brush shader implementations live under `Assets/Resources/Brushes/` — direct reference for how a stylised brush stroke is actually shaded. The studio's `lib/assets/brushes.ts` catalogues the same brush family.
- **[Godot demo projects](https://github.com/godotengine/godot-demo-projects)** (MIT). The `3d/` folder includes a toon-shaded demo and a couple of low-poly scenes. Structural reference for stylised forward rendering. Not Three, but the pipeline shape transfers.
- **[Khronos glTF Sample Models](https://github.com/KhronosGroup/glTF-Sample-Models)** (mixed, mostly CC0 / Apache-2.0). The canonical loader-test set. When a glb won't render, swap it for `DamagedHelmet.glb` to bisect — is it the model or the pipeline?

## What's deliberately not here

- **CC-BY-NC, CC-BY-SA** asset sources. The studio sells. NC and SA both push the licence boundary into uncomfortable territory; easier to stay inside CC0 / CC-BY / OFL.
- **Sketchfab without the CC0 filter.** The CC0 collection ([filtered search](https://sketchfab.com/search?q=&licenses=322a749bcfa841b29dff1e8a1bb74b0b&type=models)) is fine. The default search is a licence minefield.
- **textures.com free tier.** The licence on the free set is a custom contract, not CC0. Easier to use ambientCG.
- **FreePBR free tier.** Similar — licence is custom and unclear in places. Same outcome: use ambientCG or Poly Haven instead.

## Adding a new entry

1. Pull the asset locally. Verify the licence on the source page _and_ in the file header / repo licence.
2. Pipe it through `gltfpack` if it's a glb.
3. Drop it under `public/models/<category>/<slug>.glb` (or the matching folder for textures / HDRIs).
4. Add a row to the relevant runtime catalogue (e.g. `lib/sculpture-gallery/catalogue.ts`).
5. Add an entry under the right section in `docs/OPEN-SOURCE-STACK.md`.
6. If CC-BY, add the author + source URL to `docs/ATTRIBUTIONS.md`.

Five-step process. Five minutes. Worth doing every time so the next person on the bench knows where the thing came from.
