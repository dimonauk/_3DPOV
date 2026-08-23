# Screen Recording Notes — Foucault Pendulum Rosette

These notes describe how to capture `screen.mp4` for this tutorial
using OBS Studio or Blender's own viewport recording.

---

## Setup

| Setting | Value |
|---------|-------|
| Source | Window capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic, no system audio needed) |
| Output format | MP4 / H.264 |
| Target file | `public/library/videos/scripting/python-numpy-foucault-pendulum-berry-phase-hannay-angle-parallel-transport-poi-webxr/screen.mp4` |

---

## Recommended takes

### Take 1 — "Blueprint run" (≈ 90 s)
1. Open Blender 5.1 to a default scene.
2. Switch to the **Scripting** workspace.
3. Open `blueprint.py` via **Text → Open**.
4. Click **Run Script** (▶).
5. The console should print `✓ Exported → hf_foucault_poi.glb`.
6. Switch to the **Layout** workspace to show the finished disc.

### Take 2 — "Rosette reveal" (≈ 60 s)
1. With the disc selected, switch to **Top Orthographic** view (`Numpad 7`).
2. Set viewport shading to **Material Preview** (Sphere icon).
3. Press `G Z` and scrub slowly to show the disc edge-on (reveals tube depth).
4. Return to top view — describe the 7-petal rosette.
5. In the **Properties → Object Data → Shape Keys** panel, drag
   `SK_Arctic` to 1.0 to show the 5-petal Arctic version.
6. Drag back to 0, then `SK_Tropical` to 1.0 to show 12-petal tropical.

### Take 3 — "Physics blackboard" (≈ 45 s)
Open a second Blender window or Notepad alongside. Show the equations:
```
z(t) = A · cos(ω₀t) · exp(−iΩ_z t)
γ    = 2π · sin(λ)   [Berry / Hannay phase]
```
This segment is ideal for overlay text in final tutorial video editing.

---

## OBS scene layout

```
[OBS]
├─ Scene: "Blueprint run"
│   └─ Source: Window Capture (Blender)  — cropped to 1920×1080
└─ Scene: "Rosette reveal"
    ├─ Source: Window Capture (Blender)
    └─ Source: Text overlay "7-petal rosette · λ≈51° · T_prec ≈ 31.8 h"
               (bottom-left corner, 32pt, white, semi-transparent bg)
```

---

## Editing checklist

- [ ] Cut out any spinner/loading pauses during script run
- [ ] Add 1 s fade-in / fade-out
- [ ] Overlay caption at Take 3: "γ = 2π sin λ per sidereal day"
- [ ] Export final at H.264 CRF 22 for web delivery
- [ ] Place finished file at `public/library/videos/scripting/.../screen.mp4`
