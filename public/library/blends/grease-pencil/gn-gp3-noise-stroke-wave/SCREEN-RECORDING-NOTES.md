# Screen Recording Notes — GN for GP3: Noise-Wave Stroke

**OBS / Windows Game Bar target:** Blender 5.1 window  
**Output:** `public/library/videos/grease-pencil/gn-gp3-noise-stroke-wave/screen.mp4`  
**Settings:** 1920 × 1080 · 30 fps · audio off · MP4/H.264

---

## Takes to capture

### Take 1 — GP3 data model walkthrough (≈ 90 s)
1. Open the `.blend` built by `blueprint.py`.
2. In the Properties panel → Data tab, show the **Grease Pencil** data block:
   - Expand **Layers** → point out `Ink` layer.
   - Expand **Frames** → hover frame 1; note it holds the drawing.
3. Switch to **Spreadsheet** editor, set domain to **Point** — show 184 rows
   (40 + 64 + 80 pts) with Position, Radius, Opacity columns.
4. Switch domain to **Curve** — show 3 rows (one per stroke), Cyclic = true.
5. Narrate: *"This is the same domain model as curve GN — POINT gives us
   individual samples, CURVE gives us individual strokes."*

### Take 2 — GN modifier node tree (≈ 60 s)
1. Select `wave_rings`, open **Geometry Nodes** editor.
2. Walk each node left-to-right, naming it aloud:
   - Scene Time → CombineXYZ (packs seconds into X)
   - InputPosition → VectorMath ADD (shift by time)
   - Noise Texture (scale, detail settings visible)
   - Math SUBTRACT 0.5 → Math MULTIPLY (centre + scale)
   - CombineXYZ (Y only displacement)
   - SetPosition → Output
3. Hover each link to confirm domain (tooltip shows POINT in 5.1 spreadsheet sync).

### Take 3 — Live parameter drag (≈ 45 s)
1. In the **Properties → Modifier** panel, find `WaveDisplace`.
2. Drag **Noise Scale** 1.0 → 8.0 — show transition from broad slow wave to
   tight rapid ripple.
3. Drag **Noise Strength** 0.0 → 0.30 — show amplitude from flat to extreme
   distortion.
4. Reset both to blueprint defaults (Scale 3.5, Strength 0.12).

### Take 4 — Timeline playback (≈ 30 s)
1. Press **Space** to play from frame 1.
2. Let the 60-frame loop run twice so the wave sweep is clear.
3. Scrub manually to frame 30 — show mid-cycle distortion.
4. Narrate: *"The noise field slides along X at one unit per second — the
   strokes appear to breathe without a simulation cache."*

### Take 5 — Render one frame (≈ 30 s)
1. Press **F12** — show the rendered frame with transparent background and
   wavering navy rings.
2. Return to viewport.

---

## Post-production
- Trim black frames at start/end.
- No colour grade needed — navy-on-dark reads clearly.
- Export as H.264 at CRF 20 for archive, CRF 26 for web delivery.
