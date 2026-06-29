# Screen-Recording Notes
## Python — depsgraph.object_instances: Harvest GN Scatter GLB Export

### Software
- OBS Studio (free) or Windows Game Bar (Win+G) / macOS Screenshot (Shift+Cmd+5)
- Blender 5.1

### OBS Setup
1. **Source**: Window Capture → select the Blender window
2. **Resolution**: 1920×1080
3. **FPS**: 30
4. **Audio**: disabled (no commentary needed for screen.mp4)
5. **Output file**: `public/library/videos/scripting/python-depsgraph-object-instances-gn-scatter-glb-export/screen.mp4`

### Recording sequence (≈ 8 minutes total)

| Clip | Action |
|------|--------|
| 0:00 | Open Blender 5.1 → Scripting workspace |
| 0:20 | Open `blueprint.py` in the Text Editor |
| 0:40 | Run `build_scene()` — show crystals appearing in viewport off to the side |
| 1:10 | Run `build_gn_tree()` — GN modifier tab appears on ground object |
| 1:40 | Switch to Geometry Nodes editor — show the tree: Distribute Points → Instance on Points |
| 2:20 | Back to Scripting. Call `bpy.context.view_layer.update()` in console |
| 2:40 | Call `depsgraph = bpy.context.evaluated_depsgraph_get()` |
| 3:00 | Run `list(depsgraph.object_instances)` — print the list to show real vs. instances |
| 3:30 | Filter to `is_instance=True` — show `.matrix_world`, `.parent.name`, `.random_id` |
| 4:10 | Call `harvest_instances(EMITTER_NAME, OUTPUT_DIR, radius=HARVEST_RADIUS)` |
| 5:00 | Show the terminal output: "Harvested N instances" |
| 5:20 | Navigate file browser to the output directory — show .glb files |
| 5:50 | Drag one .glb onto viewport — confirm mesh appears at world-space position |
| 6:40 | Modify `HARVEST_RADIUS` to 3.0 and re-harvest — fewer GLBs in output |
| 7:30 | Wrap-up: show the output directory with files at different radii |

### Notes
- Keep the System Console open (Window > Toggle System Console) to show print output live
- Zoom the Text Editor to 14pt for readability on 1080p
- Pause between steps so viewers can read the console output before moving on
