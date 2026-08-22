# Screen Recording Notes — Procedural Marble Vein Shader

## Setup

**Software:** OBS Studio (free) or Windows Game Bar (`Win + G`)
**Source:** Window Capture → select the Blender 5.1 window
**Resolution:** 1920 × 1080
**Frame rate:** 30 fps
**Audio:** Off (unless narrating)

---

## What to record

### Part 1 — Running the blueprint (2–3 min)

1. Open Blender 5.1. Close the splash screen.
2. Switch to the **Scripting** workspace.
3. Create a new text block, paste `blueprint.py`, click **Run Script**.
4. Switch to the **3D Viewport**, set shading to **Material Preview** (`Z` → Material Preview).
5. You should see a square tile with subtle vein lines running across it.
6. Orbit the viewport slowly — the **coat specular highlight** (a tight bright spot)
   should appear and sweep as you change the viewing angle.  This is the two-layer
   specular from `Coat Weight = 1.0`.

---

### Part 2 — Vein distortion demonstration (4–5 min)

The most important parameter to show is **VEIN_DISTORT**.

7. In the Shader Editor, select the **Wave Texture** node.
8. Change **Distortion** from `2.5` to `0.0` — the veins become perfectly straight
   parallel lines.  Explain: this is what the node produces without perturbation —
   mathematically precise, but no geological material looks like this.
9. Set Distortion to `1.0` — gentle irregularity, like a sandstone surface.
10. Set Distortion to `4.0` — chaotic folds, like highly metamorphosed marble.
    The veins loop back on themselves and form closed islands.
11. Return to `2.5` — the sweet spot for Carrara marble.

---

### Part 3 — Vein width via ColorRamp (3–4 min)

12. Select the **ColorRamp** node connected to the Wave Texture (the vein mask).
13. The ramp uses **CONSTANT** interpolation — note there are 4 stops:
    - Position 0.0: white (background)
    - Position 0.35: black (vein starts here)
    - Position 0.42: white (vein ends here)
    - Position 1.0: white (background)
14. Move the stop at **0.42** toward 0.35 — the vein narrows to a hairline.
15. Move it away from 0.35 toward 0.6 — the vein widens to a thick band.
16. Explain: the gap between stops 2 and 3 controls vein width as a fraction of the
    wave period.  With VEIN_FREQ=5, the period is 0.2 m per unit; a gap of 0.07
    gives 1.4 cm veins.
17. Change interpolation from **CONSTANT** to **LINEAR** — the veins fade gradually.
    Explain this is why CONSTANT was chosen: real marble veins have crisp edges, not
    gradients.  Return to CONSTANT.

---

### Part 4 — Z-axis compression (2–3 min)

18. Select the **VectorMath MULTIPLY** node connected to TexCoord.
19. The Z component of the multiply vector is `0.45`.  Change it to `1.0` —
    the veins become tight ellipses on the top face, like concentric growth rings
    on end-grain stone.
20. Change to `0.1` — the veins stretch into nearly horizontal bands across the face,
    like a highly compressed schist.
21. Return to `0.45`.  Explain: quarried marble slabs are typically cut perpendicular
    to the bedding planes; Z-compression mimics this cut angle relative to the vein
    orientation in the original rock mass.

---

### Part 5 — Cloud variation (2 min)

22. Select the **Noise Texture** node feeding the cloud ColorRamp.
23. Change **Scale** from `0.5` to `2.0` — finer cloud patches appear across the tile.
24. Change Scale to `0.1` — the whole tile is either warm white or cool grey, no local
    variation.  This is what very pure Statuario marble looks like.
25. Return to `0.5`.  Change **Detail** from `5` to `1` — the clouds become very soft
    and simple.  Explain: more octaves add smaller-scale variation on top of the large
    clouds, mimicking the texture of actual calcite crystal clusters.

---

### Part 6 — Subsurface translucency demonstration (3–4 min)

26. Switch shading to **Rendered** mode.  Select the **Principled BSDF** node.
27. Change **Subsurface Weight** from `0.12` to `0.0` — SSS disabled.  Notice the
    slab edges become hard white.
28. Return to `0.12`.  Now move the camera very close to the slab edge — you should
    see a faint amber glow where the tile is thinnest.  This is the SSS radius effect:
    R=0.05 m scatters further than B=0.03 m, so edges glow slightly warm.
29. Change **Subsurface Radius** to `(0.2, 0.15, 0.1)` — very thick SSS, the tile
    glows strongly amber.  This models onyx or alabaster, not marble.
30. Return to `(0.05, 0.04, 0.03)`.

---

### Part 7 — Clearcoat comparison (2 min)

31. Change **Coat Weight** from `1.0` to `0.0` — the coat specular disappears.  The
    tile still has a highlight from the Base Roughness (0.08), but it is broader and
    softer.  Explain: `Coat Weight = 0` is an un-polished honed tile; `Coat Weight = 1`
    is the mirror polish you see in hotel lobbies.
32. Return to `1.0`.  Change **Coat Roughness** from `0.04` to `0.20` — the coat sheen
    spreads and softens, like a water-washed outdoor paving stone.

---

### Part 8 — Colour variations (2–3 min)

33. In the MixRGB node (connected at the end), change **Color1** from near-black to
    `(0.42, 0.18, 0.10)` — terracotta-red Iron Oxide veins on white, like Rosso Levanto.
34. Change to `(0.55, 0.48, 0.12)` — golden pyrite veins, like Gold Portoro marble.
35. Return to near-black graphite.  Show the CLOUD colour ramp: change the dark stop to
    a pale green `(0.78, 0.82, 0.75)` — Verde Guatemala look.

---

## File naming

```
public/library/videos/shading/shader-procedural-marble-veins/screen.mp4
```

---

## Duration target

18–22 minutes.  The vein distortion demo (Part 2) and the ColorRamp width control
(Part 3) are the core pedagogical moments — spend at least 4 minutes on each.
The SSS glow (Part 6) is visually striking; do it in Rendered mode with a dark world
so the amber edge glow is clearly visible.
