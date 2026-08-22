# Screen Recording Notes — Principled Hair BSDF

## Setup

**Software:** OBS Studio (free) or Windows Game Bar (`Win + G`)
**Source:** Window Capture → select the Blender 5.1 window
**Resolution:** 1920 × 1080
**Frame rate:** 30 fps
**Audio:** Off unless narrating

---

## What to record

### Part 1 — Running the blueprint (2–3 min)

1. Open Blender 5.1. Close the splash screen.
2. Switch to the **Scripting** workspace.
3. Open `blueprint.py`, click **Run Script**.
4. Switch to the **3D Viewport**, press `Z` → **Rendered** (Cycles preview).
5. You should see a blue hair cap on a pale head sphere with a bright back rim.

### Part 2 — Demonstrating the three lobes (5–6 min)

The session's core demonstration — show each lobe in isolation:

6. **R lobe (front view):** With the camera at the front (Numpad 1), orbit slowly
   left and right. Describe the bright specular band tracking across the hair.
   Explain that it sits slightly below the top of the strands because Offset = −3°
   simulates real cuticle tilt.
7. **TRT glint (rear view):** Orbit to the back of the head (Numpad 3 + Ctrl for
   rear). The back light should produce a sharp bright rim — the TRT lobe.
   Describe: "light entered from behind, bounced off the inner cortex wall, and
   exited toward us — that's the glint you see in real hair back-lit by sunlight."
8. **TT translucency (side view):** From the flank, individual strands show a soft
   glow where back-light transmits through the cortex. Describe the TT lobe.
9. **Live parameter edit:** In the Material Properties panel, expand the Hair BSDF
   node properties. Increase Coat from 0.35 to 0.9 — the hair gains a wet-product
   shine. Reduce it back. Then reduce Roughness from 0.12 to 0.02 — the R
   specular tightens to a razor-thin band (mirror-finish). Restore.

### Part 3 — Shader Editor walkthrough (4–5 min)

10. Open the **Shader Editor** alongside the viewport.
11. Walk through the single-node setup:
    - **ShaderNodeBsdfHairPrincipled**: point out that this is a DIFFERENT node
      from `Principled BSDF` — it implements a hair-specific lobe model.
    - **Parametrization = MELANIN**: explain the physical model — Melanin 0 =
      bleached. The Tint colour then acts as the only pigment override.
    - **IOR = 1.55**: refractive index of the hair cortex. Higher IOR = brighter
      highlights. Real human hair is 1.55; bleached hair trends slightly lower.
    - **Offset = −3°**: the cuticle tilt correction. Live-change to +3° to show
      the highlight shift upward (un-natural, above the specular peak).
12. Mention the WebXR limitation: this BSDF doesn't export to GLB. Show the
    README section on hair cards as the production path.

### Part 4 — Optional: colour variations (2 min)

13. Change `TINT` in `blueprint.py` to `(0.92, 0.15, 0.48, 1.0)` (pink), re-run.
14. Set `MELANIN = 0.6` to show warm brown natural hair (no Tint needed).
15. Show `COAT = 0.8` for K-pop wet-hair shine.

---

## File naming

```
public/library/videos/shading/shader-principled-hair-bsdf-vrm/screen.mp4
```

---

## Duration target

12–16 minutes. The lobe demonstration and shader editor walkthrough are the
most valuable sections. Do not rush the TRT glint explanation — it surprises
viewers who have only used the Principled BSDF before.
