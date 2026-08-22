# Screen Recording Notes — Feigenbaum Bifurcation Disc

**Target file:** `public/library/videos/scripting/python-numpy-feigenbaum-logistic-map-period-doubling-universality-poi-disc-webxr/screen.mp4`

## OBS / Game Bar Setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Output format | MP4 / H.264 |
| Audio | Off (no mic, no desktop audio) |
| Bitrate | 6 Mbps |

## What to record (approx. 8–12 minutes)

### 1 — Open / run the blueprint (2 min)
- Open Blender 5.1, new General file.
- Open `blueprint.py` in the Text Editor panel.
- Briefly scroll through the script — pause on `compute_density()` to show the vectorised numpy loop, and on `WINDOWS` to show the five r-range windows.
- Click **Run Script**.  Wait for the disc to appear in the 3D Viewport.  The console should print the vertex / face count and the Feigenbaum constants.

### 2 — Inspect the Basis disc (2 min)
- Orbit around the disc in the 3D Viewport.  Tip slightly to reveal the height profile from the side.
- Show the Material Properties panel → the `Feigenbaum_Mat` with the Attribute node driving colour.
- In the Geometry Attributes panel show `Feigenbaum_Density` (FLOAT_COLOR, POINT domain).
- Switch Viewport Shading to **Material Preview** — the amber/cobalt pattern should be vivid.

### 3 — Shape key tour (3 min)
- Open Properties → Object Data Properties → Shape Keys.
- With the disc selected, set **Basis** value to 1.0, all others 0.0.
- Slowly drag `SK_FirstBifurc` from 0 → 1.  The outer rim (period-1 zone) simplifies to two sharp spikes — the first bifurcation at r ≈ 3.0 is now the widest feature.
- Return to Basis.  Drag `SK_Cascade` from 0 → 1.  Four-then-eight spike structure emerges.
- Drag `SK_Period3Win` from 0 → 1.  Three equidistant amber spikes appear — the famous period-3 window at r ≈ 3.833; the chaotic bands on either side are visible as smeared rings.

### 4 — Annotate the Feigenbaum constants (1 min)
- With `SK_Cascade` partially applied (value ≈ 0.6), switch to Top Orthographic view.
- Use the Annotate tool (N panel → Item → press A to annotate) to mark the bifurcation rings.
- Note that the gap between period-2 ring and period-4 ring is about 4.67 × the gap between period-4 and period-8 — this is δ.

### 5 — Export to GLB (1 min)
- File → Export → glTF 2.0 (.glb)
- Tick: Include → Shape Keys, Include → Vertex Colors, Transform → +Y Up.
- Draco compression level 6.
- Export as `hf_feigenbaum_poi.glb`.

### 6 — Save .blend (30 s)
- File → Save As → `hf_feigenbaum_poi.blend`.

## Tips
- Maximise the 3D Viewport (Ctrl-Space) when showing the disc.
- Keep the cursor over the Viewport during shape-key drag so the disc is always in frame.
- The period-3 window is most dramatic — spend 30–45 s on it.
- Add a text overlay (Video Sequencer later, or OBS text source) with "r ≈ 3.833 → period-3" for the period-3 section.
