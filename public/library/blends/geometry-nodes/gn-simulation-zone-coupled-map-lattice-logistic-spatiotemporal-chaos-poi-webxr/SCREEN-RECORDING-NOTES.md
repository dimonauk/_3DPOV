# Screen Recording Notes — CML Poi Ring

**Tool**: OBS Studio or Windows Game Bar (Win+G)  
**Window source**: Blender 5.1  
**Resolution**: 1920 × 1080  **FPS**: 30  **Audio**: off

## Setup steps

1. Run `blueprint.py` (Scripting workspace → Run Script).
2. Switch to the **3D Viewport** in **Rendered** shading mode (EEVEE Next).
3. Set frame range: 1–180 in the Timeline.
4. Start OBS capture **before** pressing Space.
5. Press **Space** — the Simulation Zone starts computing.
6. Narrate three phases aloud if recording voiceover (optional):
   - Frames 1–60: "Spatiotemporal chaos — 64 independent chaotic poi."
   - Frames 61–120: "ε=0.5 — travelling waves, kink–antikink pairs forming."
   - Frames 121–180: "ε=0.95 — synchronised chaos, the ring breathes as one."
7. Stop recording at frame 180.
8. Export file as `screen.mp4` to:
   `public/library/videos/geometry-nodes/gn-simulation-zone-coupled-map-lattice-logistic-spatiotemporal-chaos-poi-webxr/`

## Suggested viewport layout

- 3D Viewport fills most of the window.
- Timeline visible at bottom (shows frame counter).
- GN Modifier panel pinned on right (shows ε value changing via step function).
- Camera view OFF — use free viewport with ring centred.

## Render the `viewport.mp4` separately

Run `record.py` in the Scripting workspace for a clean EEVEE render without
the Blender UI visible — use this as the tutorial preview thumbnail.
