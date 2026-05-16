# 360 model + 360 chamber stack — project plan

> Status: planning, 2026-05-16. The corpus-curation pipeline (print-check + Drive filter + reframe-360 + silk-360) is the immediate build. The model training (DiT360 fine-tune + endpoint adapter) is the destination.

## The headline goal

A model that takes one of the operator's own equirectangular 360 shots and returns a flat ("pancake") image in her published art style — her reframe choices, her colour grading, her recompositional moves, automated. Image-to-image, paired training data from her existing work.

## The three-stage source pipeline

Every shot moves through three stages. Each transition is its own training opportunity.

| Stage | What it is | Used for |
|---|---|---|
| 1 — Raw equirectangular | Straight from camera (DJI Osmo 360, Insta360 X3/X4) | Archive, base capture |
| 2 — Clean VR sphere | Equirectangular with nadir patched, watermarks removed, exposure tuned, still viewable in VR | HoloWalk anchors, VR exhibits |
| 3 — The art | Final published piece — reframed flat OR heavily-edited 360 | Print pipeline, photographs page, published work |

Three transitions exist between four states (camera → 1 → 2 → 3), so three image-to-image models are possible:

- (1 → 2) Cleanup model
- (2 → 3) Art-style model — **the primary endpoint**
- (1 → 3) End-to-end model — convenience layer over the first two

## Training plan — the base 360 generator

This is the supporting model the conditional adapter sits on top of. Full reference in `[[reference-dit360-finetune-plan]]` memory; summary:

- **Fork:** [Insta360 Research Team's DiT360](https://github.com/Insta360-Research-Team/DiT360) (CVPR 2026). Flux.1-dev backbone. Circular padding + yaw loss + cube loss already in the training script.
- **Resolution v1:** 2048×1024 latent.
- **Compute:** 8× H100 80GB on RunPod, ~5–7 days wall time, ~$3.1k + $300 buffer.
- **Captions:** Florence-2 on extracted tangent views (not raw equirectangular — that's the silent killer), fused with a local LLM into a single 360-aware caption.
- **Eval:** TangentFID + seam-L1 + 200 held-out captions + 50-image human A/B.
- **Inference:** ComfyUI workflow on the 4090 with FP8 quantisation, Replicate endpoint via Cog for shared demos.

**Licence flag.** Flux.1-dev is non-commercial. Internal R&D is fine; commercial sale of generated images needs a Black Forest Labs licence or a fallback to SDXL via PanFusion.

## Training plan — the conditional adapter (the endpoint)

Sits on top of the base 360 generator. Architecture: ControlNet-style adapter.

- **Input:** Stage 2 equirectangular (clean VR sphere).
- **Output:** Stage 3 flat-art image in her style.
- **Training data:** (equirec, flat-art) pairs from her existing work. Structural rarity — most teams don't have this; she does, accidentally, because of how she works.
- **Pair detection:** filename suffix patterns + EXIF Software field + sibling folder convention ("originals/" + "art/") + same EXIF DateTimeOriginal across different DateTimeDigitized.
- **Compute:** materially cheaper than the base run because base stays mostly frozen. ~$500–1,000, 2–3 days on 4× H100.

## The chamber stack feeding all this

Every chamber listed here lives in `app/atelier/` and is built around a real personal-workflow need first, exposed publicly second.

### Built (this commit)

- **`/atelier/print-check`** — drop an image, get the print-size verdict. Tags `printable`, `needsReframe`, `isLikelyWebDownscale`, `isTrainingEligible`. Same verdict ships on Drive list responses so a Drive scan filters web-downscaled copies without downloading bytes.

### Next, in order

1. **`/atelier/reframe-360`** — clone of Reshoot 360. Drag-drop equirectangular → three.js sphere viewer → yaw/pitch/FOV + projection picker (rectilinear / cylindrical / Mercator / Pannini / stereographic) → render at print resolution (browser `WebGLRenderTarget` + readPixels for ≤8K, ffmpeg `v360` server-side for ≥8K). The output is BOTH a printable flat AND one training pair for the equirec→pancake adapter.
2. **`<FlagDisplay>` — the default image display primitive (WebGPU).** Every uploaded image in the chambers' display layer renders as a cloth "flag" by default. Verlet-integrator cloth physics on a triangular mesh, the image as a texture on the UV grid. Top edge pinned, gentle gravity + breeze animates it. Two presentation modes:
   - **Flag (default)** — for any image, including pre-display state, before the user has chosen what to do with it. Every uploaded image lives as a flag until it's reframed, printed, or sent to a model.
   - **Sphere wrap (360 only)** — for confirmed equirectangulars, optional alternative wrap.

   Manipulation primitives (the operator can grab any flag and reshape it):
   - Pin corners or arbitrary vertices to fixed points in space
   - Drag any vertex (mouse / touch)
   - Apply directional wind (slider; auto-animates)
   - Adjust gravity
   - Fold along a line (vertex constraint update)
   - Twist (rotate one edge)
   - Press flat (vertex projection onto a plane)
   - Drape over a target (sphere / torus / cube / her own meshes)

   The flag is both **display** and **interaction surface**. For 360s, deforming the silk is a tactile reframe — not "pick a virtual camera angle" but "physically reshape the surface the image lives on." For flat images, the flag display is the aesthetic default — every recent-outputs preview, every Drive scan thumbnail, every chamber's pre-action image renders this way.

   **Recenter primitive (the column wrap).** To recenter a 360 (yaw rotation — set what's front-and-centre on the sphere — distinct from reframing to a flat crop), the chamber takes the flag and wraps it around an invisible vertical column. Rotating the column rotates the image's centring on the eventual sphere. This is the tactile counterpart to a numeric "yaw degrees" slider: you don't type a number, you spin the column until the part of the panorama you want at "front" is at "front." Wrap → rotate → unwrap-to-sphere is the recenter flow; the column itself never displays.

   Belongs as a primitive in `components/atelier/flag-display.tsx` (used everywhere) + a dedicated chamber `/atelier/silk-loom` (deep manipulation sandbox).
3. **`<PrintabilityBadge>`** drop-in component for sibling chambers — anywhere an image is uploaded, this badge shows the verdict next to it. Reuses the same `/api/print-check` call.
4. **Drive admin UI filter** — toggle on the existing `/admin/import/google-drive/` page to hide web downscales (uses the `imageMediaMetadata` verdict already wired into the list response).

### Dataset prep step uses the chambers directly

Each chamber doubles as a dataset-prep tool:

- The Drive scan + print-check filter builds the **trainable corpus** for the base 360 model.
- Every reframe-360 use produces one **(equirec, flat) training pair** for the conditional adapter. Auto-saved into the corpus when the user is signed in.
- The silk-360 chamber, secondarily, generates **augmentation pairs** — same equirec, multiple silk deformations, multiple flat captures. Each captures a different reframe choice.

## Compute / cost ladder

| Stage | Cost | Wall time |
|---|---|---|
| Print-check chamber + route | $0 | shipped |
| Drive scan filter | $0 | next session |
| Reframe-360 chamber | $0 | ~1 day build |
| Silk-360 chamber | $0 | ~2 day build |
| Corpus prep (Florence-2 captions, nadir patch, train/val split) | $0 on 4090 | 2–3 days |
| DiT360 dry-run on 1× H100 | ~$65 | 1 day |
| DiT360 main run on 8× H100 | ~$2,700 | 5–7 days |
| Conditional adapter training | ~$500–1,000 | 2–3 days |
| Total to first working adapter | **~$3.5k** | **~3 weeks total** |

## Risks + mitigations

- **Seam tearing** despite training. Stack all three techniques: circular padding (DiT360) + yaw loss (DiT360) + VAE-decoder circular blending at inference (Diffusion360). Don't rely on one.
- **Caption noise** from ERP-direct captioning. Tangent-view captioning + LLM fusion + 5% manual audit.
- **Mode collapse** onto dominant biome ("Manchester grey overcast everywhere"). Caption variety + a small synthetic-from-base counter-set.
- **Pair detection** drift. The (original, edit) pairing depends on filename / folder / EXIF conventions the operator uses; document them in `docs/360-CORPUS-CONVENTIONS.md` and add a "promote to pair" button in the Drive admin UI for ambiguous cases.
- **Licence on commercial output.** Flag with Black Forest Labs before any print bureau sale of generated images. Fallback path: SDXL via PanFusion, less good but commercially open.

## Decisions made

- **2026-05-16:** Full fine-tune (not LoRA) on Flux.1-dev via DiT360 fork.
- **2026-05-16:** Endpoint architecture is conditional adapter (ControlNet-style), not text-to-image with style tokens.
- **2026-05-16:** Default display mode for ANY uploaded image is silk-cloth ("flag") in WebGPU, not a thumbnail. Spheres are an alternative wrap for confirmed 360s.
- **2026-05-16:** Flag display + manipulation built in **WebGPU TSL** (Three.js Shading Language). The website's display layer is WebGPU/TSL-first; this is the engine for all chamber display.
- **2026-05-16:** Manipulation is controllable in **both 2D (mouse/touch) and VR (WebXR hand tracking + controllers)**. The cloth physics runs identically in both; only the input layer differs.
- **2026-05-16:** Recenter is a separate primitive from reframe: column-wrap of the flag, rotate the column, unwrap onto sphere. Distinct from yaw-pitch-FOV virtual camera (which is the reframe-to-flat path).

## Open decisions

- Commercial-licence path: pay Black Forest Labs or fall back to SDXL?
- Cleanup model (Stage 1 → Stage 2) — train concurrently with the art-style adapter, or after?
- Storage for the curated corpus: Firebase Storage, Cloudflare R2, or operator's own NAS?
- Do trainable Drive shots auto-mirror into a corpus bucket on first scan, or stay-by-reference?
