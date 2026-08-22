# Screen-Recording Notes — Chirikov Standard Map Stage Floor

**Expected output:** `public/library/videos/scripting/python-numpy-chirikov-standard-map-kam-tori-stochasticity-threshold-poincare-stage-floor-webxr/screen.mp4`

---

## Setup (do once)

1. Open **OBS Studio** (or Windows Game Bar: Win+G → Record).
2. Add a **Window Capture** source: `Blender 5.1 — [Chirikov_Standard_Map_Floor]`.
3. Set output to **1920 × 1080**, **30 fps**, audio **off**.
4. Encoder: H.264 / CRF 20 (quality preset).

## Blender workspace layout

| Area | Purpose |
|------|---------|
| 3D Viewport (main, shaded) | Show the floor mesh with Vertex Colour enabled |
| Properties → Object Data → Shape Keys | Live panel — drag sliders during recording |
| Scripting editor (sidebar) | Show blueprint.py open for context |

Enable **Viewport Shading → Vertex Colours** (icon row above viewport → Color → Vertex).
Enable **Overlays → Statistics** (shows vertex / face count: ~9 216 verts, ~9 025 quads).
Keymap: `Numpad 5` (orthographic), `Numpad 7` (top view) — shows the θ-p Poincaré plane.
Then `Numpad 4` (front 45°) — best for revealing height variation.

## Recording sequence (~90 seconds)

| Time | Action | What to show |
|------|--------|-------------|
| 0:00–0:10 | Top view (Numpad 7) | The floor reads as a 2D density map of T² |
| 0:10–0:25 | Rotate to 45° perspective | Height field emerges; KAM ridges visible |
| 0:25–0:40 | Properties panel: drag **SK_Integrable** slider from 0→1 | Floor goes flat with horizontal bands |
| 0:40–0:55 | Drag **SK_Partial** slider (0.5 sliders) | Island chains appear as oval bumps |
| 0:55–1:10 | Drag **SK_Chaotic** → 1 | Ridges dissolve into uniform chaotic sea |
| 1:10–1:25 | Drag **SK_Wild** → 1 | Stochastic web pattern; accelerator-mode channels |
| 1:25–1:30 | Return **Basis** → 1 | Threshold case: last KAM torus as bright ridge |

**Annotate live** (OBS Text source or Blender screen overlay):
- "K = 0.00 — integrable, horizontal lines"
- "K = 0.50 — KAM tori intact, island chains"
- "K = 0.97 — stochasticity threshold (Greene 1979)"
- "K = 2.00 — chaotic sea"
- "K = 5.00 — accelerator modes"

## After recording

```
ffmpeg -i raw.mp4 -vf scale=1920:1080 -c:v libx264 -crf 20 -an \
    public/library/videos/scripting/python-numpy-chirikov-standard-map-\
    kam-tori-stochasticity-threshold-poincare-stage-floor-webxr/screen.mp4
```
