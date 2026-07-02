# Screen Recording Notes — Python Cycles Batch Bake Pipeline

**Output target:** `public/library/videos/scripting/python-cycles-batch-bake-normal-ao-emission-webxr/screen.mp4`

## Software

| Tool | Setting |
|------|---------|
| OBS Studio 30+ (or Windows Game Bar Win+G) | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | OFF (tutorial is narration-over-edit) |
| Output | MP4 / H.264, CRF 18 |

## What to capture

### Scene 1 — Object naming convention (0:00–0:30)
1. Open Blender 5.1. New General scene.
2. Rename the default cube to `lo_test_prop` (F2 in Outliner or viewport).
3. Duplicate it (Shift+D, Enter), rename the duplicate `hi_test_prop`, scale it
   slightly larger (S → 1.05 → Enter).
4. Pan the Outliner to show both names clearly.

**Camera**: Outliner + 3D Viewport side by side.

### Scene 2 — UV map requirement (0:30–1:00)
1. Select `lo_test_prop`, Tab into Edit Mode.
2. A → select all. U → Smart UV Project → OK.
3. Open a UV Editor alongside the viewport to show the UV islands.
4. Tab back to Object Mode.

**Camera**: UV Editor centred, UV islands clearly visible.

### Scene 3 — Paste and run blueprint.py (1:00–2:30)
1. Switch to **Scripting** workspace (top bar).
2. Click **New** to create a blank text block.
3. Paste the full contents of `blueprint.py`.
4. Confirm OUTPUT_DIR, IMAGE_WIDTH, IMAGE_HEIGHT constants at the top.
5. Press **Run Script** (▶ button or Alt+P).
6. Watch the Info bar (top) for bake progress. Each pass prints to the console.

**Console visibility tip:** Edit → Preferences → Interface → Display → Console
(Windows: open a terminal and launch blender from it; progress prints there).

### Scene 4 — Inspect bake output (2:30–3:30)
1. In the UV/Image Editor, switch from "UV Grid" to one of the generated images
   (`lo_test_prop_nm`, `lo_test_prop_ao`, `lo_test_prop_em`).
2. Flip between the three to show the different map types.
3. Open a File Browser to `<blend folder>/bake_output/` and show the WebP files.

**Camera**: UV/Image Editor, image toggle clearly framed.

### Scene 5 — Apply baked normal to lo-poly material (3:30–4:30)
1. Select `lo_test_prop`, open the Shader Editor.
2. Add → Texture → Image Texture. Load `lo_test_prop_nm.webp`.
3. Change the Image Texture Color Space to **Non-Color**.
4. Add → Vector → Normal Map node. Connect: Image Texture Color → Normal Map
   Color → Principled BSDF Normal.
5. Toggle the Eevee viewport render (Z → Rendered) to show the normal map effect.

**Camera**: Shader editor + rendered viewport split.

### Scene 6 — Selected-to-Active normal bake (4:30–5:30)
1. In 3D Viewport, select `hi_test_prop` first (Shift-click), then `lo_test_prop`
   last so it is the Active object.
2. Open Properties → Render → Bake panel.
3. Tick **Selected to Active** and set Extrusion to 0.02 m.
4. In the Python script, confirm `hi_poly_map = {"lo_test_prop": "hi_test_prop"}`.
5. Re-run the script. Show the normal bake completing with S2A mode.

**Camera**: Properties panel + Bake settings, then switch to console for output.

## Edit cues

- Cut between scenes at natural pauses.
- Annotate each baked image in the UV editor with on-screen text overlay naming the pass (Normal, AO, Emission).
- Show a final 3-panel split: normal preview | AO preview | emission preview on the lo-poly sphere.
- End card: link to `/tutorials/blender-tutorial-python-cycles-batch-bake-normal-ao-emission-webxr`.
