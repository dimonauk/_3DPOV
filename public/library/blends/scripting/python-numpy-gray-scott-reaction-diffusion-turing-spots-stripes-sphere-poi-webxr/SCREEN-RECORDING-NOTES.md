# Screen Recording Notes — Gray-Scott Reaction-Diffusion Turing Patterns

Instructions for capturing `screen.mp4` with OBS Studio (or Windows Game Bar).

---

## Capture settings

| Setting | Value |
|---------|-------|
| Source | Window capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 / H.264 |
| Target file | `public/library/videos/scripting/python-numpy-gray-scott-reaction-diffusion-turing-spots-stripes-sphere-poi-webxr/screen.mp4` |

---

## Recommended takes

### Take 1 — "Blueprint run" (≈ 2 min)

1. Open Blender 5.1 to a default scene.
2. Switch to the **Scripting** workspace.
3. **Text → Open** → select `blueprint.py`.
4. Hit **▶ Run Script** and let the four Gray-Scott simulations complete.
   (Expect ≈ 20–40 s on a modern CPU — four runs × 3 000 steps each.)
5. The Python console prints `✓ Gray-Scott RD poi exported → hf_gray_scott_poi.glb`.
6. Switch to **Layout** workspace; select the poi disc; press `Numpad 7` for Top view.
7. Set viewport shading to **Material Preview** to reveal the cobalt/amber pattern.

### Take 2 — "Pattern morphing" (≈ 90 s)

With the poi disc selected and **Shape Keys** panel open (Properties → Object Data):

1. Scrub `SK_Stripes` slider from 0 → 1 slowly — watch leopard spots
   dissolve into zebra stripes.
2. Return to 0, then scrub `SK_Labyrinth` — the stripe field breaks into
   a winding labyrinthine maze.
3. Zoom into the disc surface in **Solid** mode to show the height-field
   relief (V-concentration raises the disc where inhibitor accumulates).

### Take 3 — "Parameter explanation" (≈ 75 s)

With a text editor or PDF alongside Blender showing the Gray-Scott equations:

1. Point to the `PARAM_SETS` dictionary in `blueprint.py`.
2. Explain: "Feed rate F controls how fast substrate U enters the system.
   Kill rate k controls how fast inhibitor V is removed. Moving diagonally
   through (F, k) space crosses Pearson class boundaries."
3. Show the `run_gray_scott()` function — the five-point Laplacian via
   `np.roll`, the autocatalytic term `U * V * V`, and the clamp to `[0,1]`.

### Take 4 — "WebXR export" (≈ 30 s)

1. The script has already exported `hf_gray_scott_poi.glb`.
2. File → Import → glTF 2.0 to re-import and inspect in a fresh scene.
3. Switch to **Rendered** view; vertex colour attribute `RD_Concentration`
   drives the emission — spots glow cobalt against an amber background.

---

## OBS scene setup

```
Sources:
  [Window Capture]  Blender 5.1
  [Text (GDI+)]     "Gray-Scott RD · Blender 5.1"   (top-left corner, 14pt)
Filters on Window Capture:
  Crop/Pad: remove Blender top menu bar if desired (crop top 28 px)
```

---

## Notes

- If the script takes > 60 s, increase Blender's **Script Timeout** under
  **Preferences → System → Python → Script Timeout** from 2 s to 120 s.
- On Apple Silicon the `np.roll`-based Laplacian runs faster than expected
  because NumPy uses Accelerate; the whole script typically finishes in 15 s.
- The four separate simulation runs (one per shape key) are independent —
  they all start from the same random seed so only the (F,k) parameters vary.
  This is deliberate: the viewer sees the same initial patch respond
  differently to different chemistry.
