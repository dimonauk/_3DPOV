# Screen Recording Notes
## Cycles Panoramic Equirectangular Camera — 360° HDR Environment Map for WebXR

### Setup
- **Software**: OBS Studio (recommended) or Windows Game Bar (Win+G)
- **Window source**: Blender 5.1 — set to `[WindowCapture]` mode, select Blender window
- **Resolution**: 1920 × 1080
- **Frame rate**: 30 fps
- **Audio**: disabled (no narration needed for library recording)
- **Output**: MP4, H.264, CRF 18

### Recording sequence (approx. 12 minutes total)

#### Part 1 — Camera setup (2 min)
1. Open Blender 5.1, default scene.
2. Select the default camera → Properties → Object Data (camera icon).
3. Change **Type** to `Panoramic`.
4. Change **Panorama Type** to `Equirectangular`.
5. Verify `Latitude Min/Max`: −90° to 90°, `Longitude Min/Max`: −180° to 180°.
6. Show the camera viewport overlay (Numpad 0) — the viewport will look unusual (all-directional view is not displayed correctly in EEVEE viewport for PANO cameras; this is expected).

#### Part 2 — Render settings (3 min)
1. Open Properties → Render (camera icon at top).
2. Set **Engine** → Cycles.
3. Set **Resolution** → 4096 × 2048, percentage 100%.
4. Set **Samples** → 128.
5. Under **Denoising**, enable **Use Denoising**, set Denoiser → **OpenImageDenoise**.
6. Open **View Layer** properties → enable **Diffuse Color** and **Normal** render passes.
7. Output: set file path to `//renders/pano_360.exr`, format → **OpenEXR**, 32-bit, ZIP.

#### Part 3 — Compositor (3 min)
1. Switch workspace to **Compositing** (top menu bar).
2. Enable **Use Nodes**.
3. Add → **Denoise** node. Wire: `Render Layers → Image` → `Denoise → Image`; `Render Layers → DiffCol` → `Denoise → Albedo`; `Render Layers → Normal` → `Denoise → Normal`.
4. Enable `HDR` checkbox on Denoise node.
5. Add **File Output** node. Set base path to `//renders/`, slot path to `pano_360_#####`.

#### Part 4 — Render and inspect (4 min)
1. Press F12 to render (or Render → Render Image). Alternatively use the low-sample preview: set samples to 16 for a quick test.
2. When render completes, switch to **UV Editor** → **Open** the rendered EXR file — you should see the full 360° scene wrapped in the 2:1 equirectangular projection.
3. Run `blueprint.py` to show the automated Python version.

### Output file
Save as: `public/library/videos/rendering/cycles-panoramic-equirectangular-360-webxr-hdri/screen.mp4`
