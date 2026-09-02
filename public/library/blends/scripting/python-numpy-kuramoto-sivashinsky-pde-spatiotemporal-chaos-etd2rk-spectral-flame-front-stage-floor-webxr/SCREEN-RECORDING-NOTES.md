# Screen Recording Notes — Kuramoto–Sivashinsky PDE Stage Floor

Target file: `public/library/videos/scripting/python-numpy-kuramoto-sivashinsky-pde-spatiotemporal-chaos-etd2rk-spectral-flame-front-stage-floor-webxr/screen.mp4`

---

## OBS / Windows Game Bar Settings

| Setting | Value |
|---|---|
| Source | Window capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Format | MP4 / H.264 |
| Bitrate | 8 000 kbps |

---

## What to Record (~90 s)

1. **Open `ks_flame_floor.blend`** in Blender 5.1 — viewport visible.
2. **Switch to EEVEE Next** (top-right header → Rendered view ⌥Z or ⌃Numpad0).
   - In the Properties panel → Render → enable Bloom (threshold 0.3, intensity 0.18).
3. **Rotate around the floor** in the viewport (middle-mouse drag) showing:
   - Cobalt troughs (negative u) and amber ridges (positive u).
   - The space (x) versus time (y) layout of the chaotic pattern.
4. **Scrub shape keys** (Properties → Object Data → Shape Keys):
   - **Basis** (L = 64): 8-cell worm chaos, rich turbulent ridges.
   - **SK_Onset** (L = 22): gentle 2-cell travelling wave, almost regular.
   - **SK_Short** (L = 32): 4-cell sparse chaos — compare with Basis.
   - **SK_Long** (L = 96): densely packed 12-cell turbulence, very rough.
5. **Open the Scripting workspace**, show `blueprint.py` briefly — highlight the
   `_solve_ks()` function and the `_phi1()` ETD2RK integrating factor.
6. Close the script editor and do a final slow orbit of the Basis floor.

---

## Trim Guide

| Segment | Start | End |
|---|---|---|
| Open + render view | 0:00 | 0:10 |
| Rotate Basis | 0:10 | 0:35 |
| Shape key scrub | 0:35 | 1:05 |
| Script highlight | 1:05 | 1:20 |
| Final orbit | 1:20 | 1:30 |

---

## Notes

- If the floor looks too dark, increase **Emission Strength** in the KS_Emit material (node editor) to 2.5 and re-render.
- The 128 × 64 grid is ~8 000 vertices — viewport should stay above 60 fps in Solid mode.
- Run `record.py` separately to produce `viewport.mp4`; this screen recording produces `screen.mp4`.
