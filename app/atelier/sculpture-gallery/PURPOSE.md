# Sculpture Gallery — PURPOSE

## What this is

The Sculpture Gallery chamber is two things stacked.

The top half is the **wall**: every mesh in the studio's bench catalogue
(`lib/assets/meshes.ts`) surfaced as its own R3F-previewed card, each
with a download link for the underlying .glb. Same data the
`/atelier` index renders in its Meshes section; the gallery just gives
it a wall of its own and a heading.

The bottom half is the **workshop**: a marching-cubes bench that turns
a voxel scalar field into a watertight GLB. It ships with a built-in
synthetic-sphere SDF as a starting point, accepts .npy and .json voxel
uploads, runs marching-cubes pure-TS on the main thread, renders the
result in R3F with a glassy pink physical material, and exports a
millimetre-scaled binary GLB ready for a slicer. The mesh report tells
you whether the result is watertight before you waste resin on it.

## Files

- `page.tsx` — server component, metadata, hero copy, the wall.
- `sculpture-gallery-client.tsx` — client component, the workshop
  (marching-cubes + Image → Hunyuan3D sibling input).
- `voxels.ts` / `marching.ts` / `mc-tables.ts` / `npy.ts` / `exportGlb.ts`
  — the pure-TS marching-cubes pipeline, ported from the source app.
- `../../api/atelier/sculpture-gallery/image-to-glb/route.ts` —
  operator-only multipart route. Uploads the image to ComfyUI's
  `/upload/image`, dispatches `hunyuan3d-2mv-turbo` via
  `comfyUIGenerateServer`, returns `{ glbUrl, glbBytes }`. Admin-guarded
  via `requireAdminUser` (Hunyuan3D burns bench VRAM; no anonymous
  traffic).
- `PURPOSE.md` — this file.

## Image → Hunyuan3D pipeline

The workshop has a second on-ramp alongside the voxel-upload path.
A reference image goes to the Hangar's ComfyUI bench; ~53 s later, a
~15 MB textured GLB renders in `<model-viewer>` and gets pushed to
the recent-outputs drawer.

The route's contract with the workflow JSON:

- Node `"2"` (LoadImage) — overridden with the uploaded filename.
- Node `"5"` (Hunyuan3dImageTo3D) — overridden with a per-call random
  seed (the workflow's seed is constant; `Hunyuan3dImageTo3D` isn't a
  `KSampler*` so the server's auto-seed-mutation does not fire).
- The prompt field is metadata-only — Hunyuan3D conditions on the
  image, not text. Stored in `sourceRef.comfyui.prompt` for archive.

Env required for production (Vercel): `COMFYUI_SERVICE_URL` pointing at
the tailnet-Funnel hostname and `COMFYUI_AUTH_TOKEN` matching the
bench's shared bearer. Local dev on the bench works without either set
(localhost:8188, no auth).

## Thumbnail-splat — skipped (no splat records on the wall)

Part 2 of the original ticket — swapping `<MeshCard>` thumbnails to
`viz.thumbnail-splat` for splat-flavour records — does not apply here.
Every entry in `lib/assets/meshes.ts` is a GLB (`format: "glb"`) with
no splat source kind; there are 22 meshes and zero of them are splat
records. When the genome catalogue grows a `splatRef` or a sibling
splat catalogue lands, revisit MeshCard with a SplatCard variant that
fetches `card-fast` thumbnails server-side and respects the existing
IntersectionObserver gate.

## Source

Ported from the Vite prototype at
`D:/The_Hangar/apps/sculpture-gallery/`. The source app loaded `.npy`
files served by a Vite dev-server middleware that listed
`D:/The_Hangar/sculptures/`. That folder doesn't exist on the
Holoflow site (or anywhere on the bench at the time of port), so the
upload affordance is the only path to load real voxel data here. If
the studio later commits sculpture .npy files to
`public/assets/sculptures/`, this chamber can read an index from there
without touching the workshop UI.

## Data shape — what we wired vs left

The Vite app's `IndexEntry` shape (name / npy / thumbnail / bytes /
modified) doesn't match Holoflow's `MeshAsset` (slug / name / category
/ url / format / fileSizeBytes / notes / sourceAlgorithm) — meshes
are finished GLBs, the source app's index pointed at raw voxel grids.
So v0 wires the gallery wall against `lib/assets/meshes.ts` (the
right citizen for "the studio's sculpture wall") and keeps the source
app's voxel upload flow as the workshop's load path.

Eventual cross-link the chamber should grow:

- A `voxelUrl?: string` field on `SculptureGenome` (in
  `lib/assets/genomes.ts`) pointing at a committed `.npy`, so a genome
  card can deep-link into the workshop pre-loaded with that field.
- A `genomeId?: string` field on `MeshAsset` so the gallery card and
  the genome card know they refer to the same specimen.

Neither lands in v0 — the genomes catalogue's `meshUrl` field is the
nearest existing seam and could be the join key when the cross-link
arrives.

## Caveats

- Marching-cubes runs on the main thread. At 96^3 a non-trivial field
  takes ~500ms to remesh on a mid-laptop; iso changes regenerate, so
  use 48^3 or 64^3 for live scrubbing.
- The synthetic sphere is just an SDF for the workshop to have
  something on screen on first paint. It isn't a real sculpture.
- The export skips a slicer-side sanity pass. Watertight in the
  bench's check means closed under the marching-cubes vertex-dedup
  grid; sliver triangles and self-intersections aren't caught.
