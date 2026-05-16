# Voxelisation pipeline — project plan

> Status: planning, 2026-05-16. Captures the full voxelisation stack the studio wants — five methods with different speed/quality/use trade-offs. The simple 1:1 pixel→voxel chamber ships first (live as `/atelier/voxel-image`); the depth-aware methods are queued behind it. Not all of these are for the immediate project, but the capabilities matter for HoloWalk, the print bureau, and the 360 model corpus.

## Why voxelise at all

Three downstream consumers want voxel output for different reasons:

- **HoloWalk AR** — visitors at a GPS coordinate see the captured scene reconstructed around them in 3D. Needs real depth.
- **Print bureau** — sculpture-of-a-place product: a 3D-printed voxel block of the room/street/landscape a photo was taken in. Needs real depth + manifold conversion.
- **360 model training corpus** — depth-conditioned generation ("generate a 360 image consistent with this depth volume"). Needs depth, doesn't need perfect manifold.
- **Aesthetic / animation** (pixel-stream chamber, lightpaint interpolation) — purely visual, no real depth needed.

The first three need depth. The last doesn't. Hence two parallel tracks.

## The five methods

| # | Method | Depth source | Quality | Speed | Best for |
|---|---|---|---|---|---|
| 0 | 1 pixel = 1 voxel (no depth) | none | aesthetic only | ms | pixel-stream, lightpaint interpolation, dataset augmentation |
| 1 | Cubemap + monocular depth | DepthAnythingV2 on 6 faces | medium | ~10s on 4090 | quick AR, dataset generation |
| 2 | 360-native depth model | PanoFormer / OmniDepth | high | ~30s on 4090 | seam-free AR, premium dataset |
| 3 | Stereo from dual-lens 360 | parallax between Osmo's twin fisheye | very high (near field) | ~5s on 4090 | accurate near-field reconstruction |
| 4 | 360 gaussian splat | multi-position capture + OmniGS | best | minutes-hours | print bureau sculpture, VR exhibits |
| 5 | NeRF / nerfstudio | multi-position capture + nerfstudio | highest | hours | flagship installations |

## Method 0 (shipped)

Already live as `/atelier/voxel-image` (commit pending). 1:1 pixel→voxel mapping on either a plane or a sphere, with optional pixel-stream animation. No depth. Pure aesthetic / dataset-augmentation use.

## Method 1 — Cubemap + DepthAnythingV2

The cheapest depth-aware path. Reuses what's already on the bench in `lightpainting-forge`.

### Pipeline

1. Equirectangular → 6 cubemap faces (or 18 tangent-plane views for less polar distortion)
2. Run DepthAnythingV2 on each face independently
3. Stitch depth maps back to spherical coordinates with overlap-blending at seams
4. For each pixel: convert (lat, lon, depth) → 3D point
5. Voxelise the point cloud at chosen voxel size

### Tooling

- Cubemap conversion: existing libvips / sharp + small custom code, or ffmpeg `v360`
- DepthAnythingV2: already wired in `app/atelier/lightpainting-forge/depth-client.ts`
- Voxelisation: bin point cloud into a 3D grid; for 1cm voxels in a 5m³ space = 125M cells (sparse storage essential)
- Sparse representation: octree (cheap to implement) or OpenVDB (better, needs WASM port)

### Where it slots

New chamber `/atelier/voxelise-360` (in `make-3d`). Builds on existing depth infrastructure. Phase 1 effort: ~2 days.

### Limitations

- Stitching seams visible in the depth field unless overlap-blended
- DepthAnythingV2 trained on flat photos, struggles with extreme equirectangular distortion at poles
- Polar voxels (above/below camera) least reliable

## Method 2 — 360-native depth

For when method 1's seams aren't acceptable.

### Candidates

- [**PanoFormer**](https://github.com/zhijieshen-BJTU/PanoFormer) — transformer with spherical-aware attention. Best 2024 result on Stanford2D3D + Matterport3D.
- [**OmniDepth**](https://github.com/sunset1995/360MonoDepth) — earlier baseline, still solid for indoor scenes
- [**S2D3D-Net**](https://github.com/sunset1995/HoHoNet) — indoor 360 layout + depth

### Pipeline

Same shape as method 1 but the depth step runs on the equirectangular directly. No cubemap conversion, no seam stitching.

### Tooling

- Model weights from each repo (PyTorch)
- Bench runs it; emit a depth equirectangular alongside the colour equirectangular
- Voxelisation step identical to method 1

### Where it slots

Same chamber `/atelier/voxelise-360`, "engine" dropdown picks DepthAnythingV2 or PanoFormer. Phase 2 effort: ~1 week (mostly model integration + benchmarking).

## Method 3 — Dual-lens stereo

The Osmo 360 (and Insta360 X3/X4) have two fisheye lenses with known baseline. If we can access raw output before stitching, parallax gives real stereo depth.

### Pipeline

1. Capture in raw mode (Osmo: .dng, Insta: .insp)
2. Demosaic each fisheye independently
3. Compute disparity between the two fisheye views in their overlap zone
4. Triangulate → depth → 3D point cloud
5. Voxelise

### Tooling

- DJI: closed format but readable with their SDK
- Insta360: more open, X3 raw is documented
- Stereo matching: OpenCV's StereoSGBM (well-trodden) or learning-based (RAFT-Stereo for higher quality)

### Where it slots

A capability `lib/capabilities/viz/stereo-360-depth.ts` server-side; runs on the bench, uploads depth to Vercel Blob, chamber displays the result. Phase 3 effort: ~2 weeks (raw format wrangling is the unknown).

### Limitations

- Accurate only within the parallax baseline's effective range (~5m for Osmo's small baseline)
- Beyond that range, the two fisheyes converge — no stereo signal
- Best for indoor / near-field outdoor scenes; useless for landscape

## Method 4 — 360 gaussian splat

The studio's existing splat ladder, but for 360. Slot 3-4 in your roadmap.

### Pipeline

1. Multi-position capture: walk a 1-2m loop, shoot 360s every metre. 5-10 captures per scene.
2. Estimate camera poses via COLMAP or a 360-aware SfM (OpenSfM with spherical model)
3. Train gaussian splat with a 360-aware loss (OmniGS, 360GS, PanoSplat)
4. Output: gaussian field in 3D
5. Voxelise by binning gaussians into a grid (sum of gaussian weights at each voxel)

### Tooling

- [**OmniGS**](https://github.com/liyves/OmniGS) — most recent (2024), gradient-based
- [**360GS**](https://github.com/inuex35/360-gaussian-splatting) — alternative
- [**PanoSplat**](https://github.com/zhongqingmars/PanoSplat) — wider baseline support
- Reuses your existing splat pipeline scaffold

### Where it slots

Slot 4 in the splat ladder per `memory:project-splat-ladder`. Phase 4 effort: ~3 weeks (mostly capture-workflow tooling + COLMAP fights).

### Limitations

- Multi-position capture is a real shoot; not a one-photo workflow
- Each scene needs ~10-30 minutes of capture
- Best quality but biggest commitment

## Method 5 — NeRF

The ultimate path. Same input as method 4 (multi-position captures), different reconstruction algorithm.

### Pipeline

1. Multi-position capture (same as method 4)
2. Train a neural radiance field with [nerfstudio](https://docs.nerf.studio/)
3. Sample the field on a voxel grid

### Tooling

- nerfstudio is the canonical training framework
- Use Instant-NGP or 3D Gaussian Splatting as the underlying model (nerfstudio supports both)

### Where it slots

A capability behind the same `/atelier/voxelise-360` chamber, "engine" option becomes splat / nerf. Phase 5 effort: ~2 weeks (assuming nerfstudio runs cleanly).

## Cross-pipeline value

The voxel output from any method flows into multiple consumers:

```
Voxel field
├── HoloWalk anchor (AR display, real 3D)
├── Print bureau ("sculpture of a place" 3D-printed product)
├── 360 model corpus (depth-conditioned training data)
├── VR exhibit (walk inside the photo)
├── Lightpaint chamber (animate voxel trails)
└── Pixel-stream effect (aesthetic-only animation)
```

Voxel storage format: standard sparse-voxel representation. Octree for in-memory editing; OpenVDB for archival.

## Storage scale

- 1cm voxels in a 5m³ space: 125M cells worst case, ~1M actually-occupied (1% density typical)
- 5cm voxels in a 20m³ space: 64M cells, ~500K occupied
- Sparse storage is non-negotiable. Octree implementation = ~1 day of code per implementation.

## Decisions made

- **2026-05-16:** Method 0 (1:1 no depth) ships first as `/atelier/voxel-image`. The depth-aware methods are queued.
- **2026-05-16:** Method 1 (cubemap + DepthAnythingV2) is the next depth-aware build. Reuses existing infrastructure.
- **2026-05-16:** Method 4 (360 gsplat) is the long-arc goal — slots into the existing splat ladder.

## Open decisions

- Voxel storage format: roll-our-own octree or vendor a JS OpenVDB?
- Where the bench-side depth work runs: Vercel Functions are too constrained; bench-only Python service or Tailscale-funneled MCP server?
- Whether to ship method 3 (dual-lens stereo) at all — depends on whether the raw format wrangling is worth the depth-quality win
