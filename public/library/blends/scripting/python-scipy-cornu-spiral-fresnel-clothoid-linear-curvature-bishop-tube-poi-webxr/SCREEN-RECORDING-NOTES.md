# Screen Recording Notes — Cornu Spiral Poi Head

**Target file:** `public/library/videos/scripting/python-scipy-cornu-spiral-fresnel-clothoid-linear-curvature-bishop-tube-poi-webxr/screen.mp4`

---

## OBS / Game Bar settings

| Setting | Value |
|---------|-------|
| Window source | Blender 5.1 (not display capture) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (or mute Blender audio) |
| Output format | MP4 / H.264 |
| Bit rate | ≥ 8 Mbps |

---

## Session flow

1. **Open Blender 5.1** → new General file.
2. In the **Scripting** workspace, open `blueprint.py`. Run it with the ▶ button. Wait for the terminal to print `[cornu] ✓ Exported`.
3. Switch to the **Layout** workspace. The S-shaped Cornu spiral tube appears, lit by cobalt-to-amber emission. The flat 2D shape (Basis) is visible from front.
4. **Show the Fresnel integrals briefly** — open the Python Interactive Console and type:
   ```python
   from scipy.special import fresnel
   print(fresnel(3.0))  # prints (S(3), C(3)) ≈ (0.496, 0.607)
   ```
   This shows the limiting-point approach numerically.
5. In the **Properties → Object Data → Shape Keys** panel, slowly drag `SK_Helix` value from 0 → 1 while orbiting the viewport. The flat spiral lifts into a 3-D helical clothoid.
6. Return SK_Helix to 0. Drag `SK_Tight` to 1 (T_MAX halved — fewer coils). Then `SK_Fat` to 1 (thicker tube cross-section).
7. Open the `record.py` in the Scripting workspace and run it. This renders 300 frames automatically to `viewport.mp4`.
8. Stop OBS recording once the render finishes.

---

## Tips

- Use **NUMPAD 1** for front orthographic view to show the full S-shape flat.
- Use **NUMPAD 5** to toggle orthographic / perspective before orbit.
- The Cobalt-to-Amber gradient reads best in **EEVEE Next** with Bloom enabled (Properties → Render → Bloom, threshold 0.30).
- If the spiral looks dim, check that the **Emission Strength** in the material is 3.2 (set in `blueprint.py`).
- When recording the interactive shape-key drag, go slowly — the morphing from flat to helix is the centrepiece shot.

---

## Expected output files

After recording:

```
public/library/videos/scripting/
  python-scipy-cornu-spiral-fresnel-clothoid-linear-curvature-bishop-tube-poi-webxr/
    viewport.mp4    ← rendered by record.py
    screen.mp4      ← your OBS capture from this session
```
