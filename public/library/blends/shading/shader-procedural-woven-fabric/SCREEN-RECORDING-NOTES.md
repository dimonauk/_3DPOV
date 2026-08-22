# Screen Recording Notes — Procedural Woven Fabric

## Setup

**Software:** OBS Studio (free) or Windows Game Bar (`Win + G`)  
**Source:** Window Capture → select the Blender 5.1 window  
**Resolution:** 1920 × 1080  
**Frame rate:** 30 fps  
**Audio:** Off (no mic needed unless narrating)

---

## What to record

### Part 1 — Running the blueprint (2–3 min)

1. Open Blender 5.1. Close the splash screen.
2. Switch to the **Scripting** workspace (top menu bar).
3. Create a new text block, paste `blueprint.py`, click **Run Script**.
4. Switch to the **3D Viewport**, set shading to **Material Preview** (press `Z` → Material Preview).
5. You should see a draped cloth panel with a visible linen weave.

### Part 2 — Demonstrating the sheen effect (3–4 min)

The crucial demonstration is angle-dependence:

6. With the camera at **45° overhead**, notice the weave pattern is clear but the cloth
   looks somewhat flat.
7. Using **numpad 1** (front view), then manually **tilt the viewport** so you are looking
   nearly parallel to the cloth surface (just a few degrees above it).
8. The fabric should visibly **brighten across the whole surface** — this is the Sheen lobe
   simulating micro-fibre retroreflection.  Describe that without Sheen this would look like
   textured plastic.
9. Return to 45° and **orbit slowly** (middle-mouse drag) to show the warp/weft interlace
   pattern shifting perspective.

### Part 3 — Shader Editor walkthrough (4–5 min)

10. Open the **Shader Editor** alongside the 3D viewport (drag the viewport border
    or use the editor type menu).
11. Walk through the node graph left to right:
    - **TexCoord → SeparateXYZ** — raw UV coordinates split into U and V channels.
    - **Wave_warp (BANDS X)** and **Wave_weft (BANDS Y)** — the thread cross-section profiles.
      Explain that BANDS X means "bands whose faces are perpendicular to X",
      so the pattern repeats along the X axis = warp threads.
    - **Math chain (×N → FLOOR → ADD → MODULO 2)** — the interlace gate.
      Explain: even cells (gate=0) → weft on top; odd cells (gate=1) → warp on top.
    - **Multiply + Add** producing the combined bump height.
    - **MixRGB** selecting warp or weft yarn colour per cell.
    - **Bump node** — thread relief height → perturbed normals.
    - **Principled BSDF** — highlight `Sheen Weight = 0.88` and `Sheen Roughness = 0.28`.
      Reduce Sheen Weight to 0.0 live → cloth instantly looks plastic.  Restore it.
12. Adjust `THREAD_COUNT` in the parameters at the top of `blueprint.py`, re-run script.
    Show how 10 threads vs 30 threads changes the fabric density.

### Part 4 — Optional: parameter variations (2 min)

13. Change `WARP_COLOUR` and `WEFT_COLOUR` to red/white for a tablecloth look.
14. Change `wave_profile` from `'SIN'` to `'TRI'` on both Wave nodes — shows flatter
    thread tops (less rounded cross-section, more like a woven cotton flat-weave).

---

## File naming

```
public/library/videos/shading/shader-procedural-woven-fabric/screen.mp4
```

---

## Duration target

10–14 minutes.  The shader walkthrough and the sheen demonstration are the
most valuable sections — do not rush them.  Viewers will pause and scrub back
repeatedly when studying the node graph.
