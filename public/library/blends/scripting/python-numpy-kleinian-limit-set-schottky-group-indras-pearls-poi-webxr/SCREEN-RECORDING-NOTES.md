# Screen Recording Notes — Kleinian Limit Set / Schottky Group

**Target file:** `public/library/videos/scripting/python-numpy-kleinian-limit-set-schottky-group-indras-pearls-poi-webxr/screen.mp4`

## OBS Studio setup

| Setting | Value |
|---|---|
| Window Source | Blender 5.1 (any version ≥ 5.1) |
| Resolution | 1920 × 1080 |
| Frame Rate | 30 fps |
| Audio | Off (no mic, no system audio) |
| Output Format | MP4 (H.264) |
| CRF | 18 (high quality) |

## What to record (4–5 minutes)

### Step 1 — Run blueprint.py (45 s)
- Open Blender → Scripting workspace
- Load `blueprint.py` from the library folder
- Check the **Console** panel is visible (toggle `Window → Toggle System Console` on Windows or watch the terminal on macOS/Linux)
- Press **Run Script** — watch the console print:
  ```
  DFS depth=8 → expected 8748 terminal pts
    8748 finite limit-set points collected
  GLB written → hf_kleinian.glb
  Blend saved → hf_kleinian.blend
  ```
- The viewport fills with a violet fractal cloud on a unit sphere + four cyan guide circles below

### Step 2 — Explore the fractal cloud (90 s)
- Press **Numpad 5** for orthographic view, then **Numpad 1** for front view
- Middle-mouse drag to tumble around the cloud — note the self-similar fractal structure
- Switch to **Rendered** shading (press **Z** → Rendered) to see EEVEE bloom around each limit-set triangle
- Select the `hf_kleinian_cloud` object → look at Properties → Object Data → confirm 26,244 vertices / 8,748 triangles
- Zoom into one dense cluster at one "corner" of the fractal — the self-similarity is visible as word depth increases

### Step 3 — Show the Schottky guide circles (60 s)
- Select one `hf_schottky_Ca` curve object (the cyan circles at z = −1.25)
- Explain verbally (or via on-screen title): *"These four circles define the generators. Each generator maps the exterior of its source circle onto the interior of its partner."*
- Camera angle: top-down (Numpad 7) to see all four circles arranged in a cross pattern
- Toggle visibility of the cloud to show the circles alone, then toggle back

### Step 4 — EEVEE bloom comparison (30 s)
- Render Properties → Bloom — toggle on/off to show the glow effect
- Short clip at two stops: no bloom (triangles visible as tiny shapes) vs. bloom on (glowing fractal dust)

### Step 5 — WebXR GLB preview (optional, 30 s)
- Drag `hf_kleinian.glb` into the Holoflow Three.js Viewer or any GLTF viewer (e.g. https://gltf-viewer.donmccurdy.com/) if network is available
- Show the fractal cloud from a 3-D orbit

## Tips
- Maximise Blender window before recording: **Preferences → Interface → Temp Preferences: Fullscreen** or F11 on Windows
- In Viewport Shading dropdown (top-right sphere), set **Render Preview** (rightmost icon) to activate EEVEE bloom in the viewport without opening Render Properties
- Set viewport background to black: **Viewport Shading** → **World Opacity = 0**, **Background Opacity = 0** in the Viewport Shading pop-over
- Frame rate: Blender viewport may display at 15–30 fps on a modest GPU; that is fine for recording since screen.mp4 is a tutorial demonstration, not a rendered output
