# Screen-Recording Notes — CR3BP Hill Regions & Roche Lobe

Capture `screen.mp4` using OBS Studio (or Windows Game Bar).

---

## OBS settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** (no mic, no system audio) |
| Output format | MP4 (H.264, CRF 18) |

---

## Suggested recording sequence (~90 seconds)

1. **Open the .blend** — show the Basis shape (closed Roche lobe).  
   Pan slowly so the amber forbidden walls around the Moon are visible.

2. **Shape-key demo** — in the Properties panel › Object Data › Shape Keys,  
   drag SK_L1Open from 0 → 1 while narrating:  
   *"The L1 neck opens — mass can now flow between Earth and Moon."*

3. **SK_L2Open to 1** — narrate:  
   *"Raising the energy further, L2 breaks. The Moon is accessible from deep space."*

4. **SK_Wide to 1** — narrate:  
   *"Below the L4/L5 Jacobi constant, all forbidden zones collapse.  
   Tadpole and horseshoe orbits appear in the flat accessible regions."*

5. **Scripting workspace** — open `blueprint.py`, briefly scroll through the  
   `omega_grid` and `newton_quintic` functions.

6. **record.py playback** — press ▶ and let the 120-frame morph animation play.

---

## Post-production (optional)

- Add silent title card: `CR3BP Hill Regions & Roche Lobe | Blender 5.1 | holoflow.studio`  
- Trim to 60–75 s for tutorial embed.
- Deliver as `screen.mp4` alongside `viewport.mp4`.
