# Screen Recording Notes — Kelvin–Helmholtz Instability

Target file: `public/library/videos/scripting/python-numpy-kelvin-helmholtz-shear-instability-spectral-vorticity-height-field-stage-floor-webxr/screen.mp4`

---

## OBS / Windows Game Bar setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled (no mic) |
| Output format | MP4 / H.264 |
| Bitrate | 8 000 kbps |

---

## Recording flow (≈ 10 minutes total)

### 1  Open Blender and run the blueprint (≈ 2 min)

1. Open a fresh Blender 5.1 scene.
2. Switch to the **Scripting** workspace.
3. Open `blueprint.py` (Text Editor ▸ Open).
4. Press **Run Script**.  Watch the Info log — you should see:
   - `KH blueprint: gathering simulation snapshots…`
   - `KH blueprint: building mesh in Blender…`
   - `KH blueprint: complete — 'KH_StageFloor' ready for export.`
5. Switch to the **3D Viewport** workspace.

### 2  Viewport tour (≈ 3 min)

1. Press **Numpad 5** to toggle orthographic mode.
2. Press **Numpad 7** for a top-down view.
3. Set viewport shading to **Material Preview** (Z → Material Preview).
4. Slowly orbit the camera (middle-mouse drag) to show the height profile
   from a 45-degree angle — the cobalt–amber colour gradient should be
   clearly visible.
5. Open the **Object Data Properties** panel (green icon, right side panel).
6. Under **Shape Keys**, step through each key manually:
   - **Basis**: flat-ish sinusoidal seed.
   - **SK_t20**: gentle corrugation of the shear layer.
   - **SK_t40**: cat's-eye billows with clear vortex cores.
   - **SK_t60**: rolled-up, merged cores; secondary instabilities on the
     braid regions.
   Linger 5–10 seconds on each key so viewers can read the caption.

### 3  Code walkthrough (≈ 4 min)

Return to the Scripting workspace.  Highlight and narrate these sections:

1. **Named constants** (lines 36–48) — emphasise DT = 0.025 and Z_SCALE = 0.35.
2. **`make_wavenumbers()`** — explain why K2[0,0] = 1.0 (guard against division
   by zero for the DC Poisson mode, which is always zero anyway).
3. **`spectral_rhs()`** — trace the three operations: Poisson solve, velocity
   recovery, dealiased advection.
4. **`build_scene()`** — show the row-major vertex indexing (vi = i·NY + j) and
   why FLOAT_COLOR is used instead of BYTE_COLOR (HDR range for emission).
5. **`setup_shader()`** — show the Attribute node wiring inside the node tree.

### 4  Export as GLB (≈ 1 min)

1. File ▸ Export ▸ glTF 2.0.
2. Tick **Draco Mesh Compression** (level 6) and **WebP Textures**.
3. Set the filename to `kelvin_helmholtz_kh.glb`.
4. Click Export.

---

## Post-production (optional)

- Trim 2 seconds from start and end.
- Add chapter markers at each shape-key transition.
- Overlay text captions at each shape-key change with the simulation time.

---

## Checklist before uploading

- [ ] `viewport.mp4` present in the videos subfolder (from `record.py`).
- [ ] `screen.mp4` recorded at 1920×1080, ≤ 15 minutes.
- [ ] No microphone audio on final export (tutorial is text-captioned).
- [ ] GLB file exported and verified in the Holoflow WebXR preview.
