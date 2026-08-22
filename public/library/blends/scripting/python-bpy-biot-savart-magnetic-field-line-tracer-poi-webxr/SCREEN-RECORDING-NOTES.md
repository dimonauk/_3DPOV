# Screen Recording Notes
## Biot-Savart Field-Line Tracer — Blender 5.1

**Target file:** `public/library/videos/scripting/python-bpy-biot-savart-magnetic-field-line-tracer-poi-webxr/screen.mp4`

---

### OBS / Game Bar setup

| Setting | Value |
|---------|-------|
| Source | Window capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no commentary needed for screen.mp4) |
| Output format | MP4, H.264, Medium quality |

---

### What to capture (in order)

1. **Open script editor** — split viewport: 3D View on left, Script Editor on right.
2. **Paste blueprint.py** — copy from `public/library/blends/scripting/…/blueprint.py`.
3. **Walk the constants block** (0:00–0:30) — hover over each constant, show the tooltip
   that appears from Blender's auto-complete; explain WIRE_TURNS, SEED_RADIUS, RK4_STEPS.
4. **Run the script** (0:30–1:30) — click Run Script. Switch to the 3D View and orbit to
   see the field lines appearing. At 256 wire points × 24 seeds × 400 RK4 steps, the
   script takes 15–45 s depending on CPU.
5. **Viewport play** (1:30–2:00) — press Space to play the bevel_factor_end reveal
   animation. All 24 trails draw on over 120 frames.
6. **Material panel** (2:00–2:30) — in Properties → Material, show one trail material;
   click Emission, show the colour and strength values.
7. **GLB export** (2:30–3:00) — the script auto-exports `hf_biot_savart.glb`. Open a file
   browser, navigate to the blend directory, show the .glb file was created.
8. **Close on orbit view** (3:00–3:10) — orbit the viewport 360° to show field lines
   wrapping the helical coil.

---

### Tips

- Run Blender as **Solid + EEVEE Preview** (not Material Preview) until the script
  finishes; EEVEE bloom only appears in Rendered mode.
- For a cleaner recording, hide the N-panel (N key) and the toolbar (T key) first.
- If the script takes > 60 s, reduce `N_WIRE_PTS` to 128 in the Script Editor before
  pressing Run — the field topology is visually similar at half resolution.
- Field lines near the coil axis loop tightly (short path); far seeds produce long open
  arcs — both are interesting to show.
