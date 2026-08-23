# Screen-Recording Notes — Three-Body Figure-8 Choreography

**Target file**: `public/library/videos/scripting/python-numpy-three-body-figure-8-choreography-chenciner-montgomery-bishop-tube-poi-webxr/screen.mp4`

---

## OBS Studio setup

| Setting | Value |
|---------|-------|
| Source type | Window capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 (H.264) |
| CRF | 18 (visually lossless) |

---

## What to capture (~5 minutes)

### 1 — Open a new Blender file (0:00–0:30)
- Launch Blender 5.1 → General template
- Delete the default cube, camera, and light

### 2 — Run blueprint.py (0:30–2:00)
- Switch to the Scripting workspace
- Open `blueprint.py` from the library directory
- Read aloud the initial conditions block:
  - "Body 1 starts at (0.97, −0.24, 0) — near the right lobe of the figure-8"
  - "Body 3 starts at the origin — at the crossing point"
  - "All three have zero total momentum"
- Run the script (▶)
- While running: "RK4 at dt = T/6 000 — energy error less than 5×10⁻⁹ over the period"
- When finished, point out the cobalt–amber–white tricolour gradient

### 3 — Inspect the figure-8 from above (2:00–3:00)
- Numpad 7 → top view (orthographic)
- Zoom in to show the self-intersection at the origin
- Explain: "This is where all three bodies pass through on their way from one lobe to the other — each offset by T/3 ≈ 2.1 seconds"
- Numpad 1 → front view — shows the tube as a true figure-8

### 4 — Shape keys (3:00–4:00)
- Properties panel → Object Data → Shape Keys
- Slide SK_Wide to 1.0 — the fat tube shows the orbit's volume
- Slide SK_Thin to 1.0 — the thin wire highlights the orbit path clearly
- Return both to 0.0
- Note: "Same Bishop frame, only radius changes — so holonomy closure is exact at every scale"

### 5 — Run record.py (4:00–5:00)
- Open `record.py` in the Scripting workspace
- Run it to generate viewport.mp4
- Show the 300-frame render queue starting up

---

## Tip: highlight the three body positions

After the blueprint runs, add three UV Spheres (radius 0.04 m each) positioned at:
- Body 1 at t = 0: (0.97 × 0.29, −0.24 × 0.29, 0) ≈ (0.281, −0.071, 0)
- Body 2 at t = 0: (−0.281, 0.071, 0)
- Body 3 at t = 0: (0, 0, 0)

Assign Cobalt, Amber, and White emission materials. The three glowing spheres resting on the tube illustrate the D₆ phase symmetry: each is separated by exactly 120° of orbital phase.
