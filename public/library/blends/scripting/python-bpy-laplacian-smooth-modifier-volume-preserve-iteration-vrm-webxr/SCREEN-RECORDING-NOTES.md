# Screen-Recording Notes
## LaplacianSmoothModifier — Volume-Preserve Iteration Tutorial

**Software**: Blender 5.1  |  **Resolution**: 1920 × 1080  |  **FPS**: 30  |  **Audio**: off

---

### OBS / Game Bar setup
- Source: Window Capture → Blender
- Output: `screen.mp4` — same folder as this file
- Framerate: 30 fps, encoder H.264 CRF ~18

---

### Shot list

| # | Duration | Action |
|---|----------|--------|
| 1 | 5 s | Open `.blend` (already loaded from `blueprint.py`). Show 3D viewport — jagged faceted cylinder with boolean-residue wavy equator visible. |
| 2 | 6 s | Properties → Modifier Properties. Expand **LapSmooth** modifier. Show all properties: Iterations=6, Lambda=0.5, Normalized✓, Volume Preserve✓. |
| 3 | 8 s | Drop Iterations to **0** — no smoothing, jagged mesh. Scrub to **1**, **3**, **6** — show geometry flowing. Hold on 6. |
| 4 | 6 s | Toggle **Normalized** off (uniform weights). Scrub iterations 0→6 — notice more aggressive corner collapse compared to normalised. Toggle back on. |
| 5 | 6 s | Toggle **Volume Preserve** off at 8 iterations — mesh noticeably shrinks (soap-bubble effect). Toggle back on — volume restored. |
| 6 | 8 s | Weight Paint mode — show SEAM_GROUP. Seam ring shows deep blue (0.0 = pinned). Body ring shows red (1.0 = full smooth). |
| 7 | 6 s | Back to Object mode, Solid shading. Rotate panel showing smooth body vs pinned seam edges. |
| 8 | 6 s | Open **blender-tutorial-python-bpy-laplacian-smooth-modifier-volume-preserve-iteration-vrm-webxr.tsx** tutorial page in browser alongside Blender. Briefly show code in `blueprint.py`. |
| 9 | 4 s | Show exported GLBs in file browser: `hf_lapsmooth_panel_raw.glb`, `hf_lapsmooth_panel_iter3.glb`, `hf_lapsmooth_panel_iter6.glb`. |

---

### Key moments to emphasise
- The **cotangent weight** difference (shot 4) — this is the hardest concept
- **Volume collapse** with use_volume_preserve off (shot 5) — dramatic visual
- Seam ring staying **pinned** while body flows (shot 7) — shows vertex group masking

---

### Post-processing
- Trim silence at start/end
- No colour grade needed — viewport captures are already clean
- Export as H.264 MP4, filename `screen.mp4`
