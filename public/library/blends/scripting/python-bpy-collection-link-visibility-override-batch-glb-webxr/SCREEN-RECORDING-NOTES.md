# Screen Recording Notes

**Tutorial**: Python bpy.types.Collection — Batch GLB Export for WebXR  
**Target file**: `public/library/videos/scripting/python-bpy-collection-link-visibility-override-batch-glb-webxr/screen.mp4`

---

## OBS / Game Bar Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic needed) |
| Output format | MP4 / H.264 CRF 20 |

---

## What to Record

### Part 1 — Show the Outliner hierarchy (0:00–0:30)
1. Open the Outliner (top-right panel).  
2. Expand the Scene root to show `hf_env`, `hf_props`, `hf_lights` as child collections.  
3. Click each collection icon to highlight its members in the viewport.  
4. **Zoom the Outliner** so collection names and object counts are clearly legible.

### Part 2 — Visibility flag walkthrough (0:30–1:30)
1. Right-click `hf_lights` in the Outliner → **Visibility** — show the `Disable in Viewports`, `Disable in Renders`, `Holdout`, `Indirect Only` options.  
2. Toggle **Indirect Only** on and off; show how the lights disappear from the viewport but the scene still receives light (visible on the sphere surfaces).  
3. Toggle **Exclude from View Layer** on `hf_props` — show all three spheres vanishing instantly.  
4. Re-enable both — restore the full scene.

> **Camera tip**: Detach a panel to float the Outliner so it's visible alongside the 3D Viewport.

### Part 3 — Script execution (1:30–2:30)
1. Switch to the **Scripting** workspace.  
2. Open `blueprint.py` in the Text Editor.  
3. Show the file from the top (constants section) — pause for 3 seconds.  
4. Scroll to the `find_layer_collection` helper — pause, then scroll to `export_collection_glb`.  
5. Hit **Run Script** (Alt + P). Show the System Console output confirming each GLB was written.

### Part 4 — Artefact verification (2:30–3:00)
1. Open a File Browser panel.  
2. Navigate to `//batch_glb/` alongside the .blend file.  
3. Show `hf_env.glb`, `hf_props.glb`, `hf_lights.glb` and their file sizes.  
4. Open `collection_manifest.json` in a text editor — show the JSON structure.

---

## Editing Tips
- Trim any pause over 5 s.  
- Add a lower-third title card: **"bpy.types.Collection vs LayerCollection"** at 0:00.  
- Cut between Outliner and Script views with a 2-frame J-cut (audio-off equivalent: clean frame cut).  
- No music — the System Console output is the payoff.

---

## File Delivery
Place the finished file at:  
`public/library/videos/scripting/python-bpy-collection-link-visibility-override-batch-glb-webxr/screen.mp4`
