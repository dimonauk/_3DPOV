# Screen Recording Notes
## GN Sample Grid — Volume Field Probe

### Software
- **OBS Studio** (v30+) or Windows Game Bar (`Win + G`)

### Setup
1. Open Blender 5.1.  Load `field_probe.blend` (run `blueprint.py` first if starting fresh).
2. Set workspace to **Geometry Nodes** editor so the node tree is visible alongside the 3D viewport.
3. Split the 3D viewport so the left pane shows the `SG_Probe` object selected and the right pane
   shows a close-up of the sensor constellation in **Solid + Vertex Colour** shading mode.
4. In OBS: Source → Window Capture → select the Blender window.  Set output to **1920 × 1080**, 30 fps.

### What to capture (4-6 minutes)

| Segment | Action |
|---------|--------|
| **0:00 – 0:45** | Overview: show both objects in the viewport.  Explain Volume Cube → SampleGrid pipeline in voice-over. |
| **0:45 – 2:00** | Walk the GN tree for `SG_Volume`: Noise Texture → Map Range → Volume Cube.  Adjust `NOISE_SCALE` live and show the constellation change. |
| **2:00 – 3:30** | Walk the GN tree for `SG_Probe`: Object Info → Distribute Points in Volume → Sample Grid → Compare → Delete → Store Attribute → Instance on Points. |
| **3:30 – 4:30** | Tweak `THRESHOLD` (expose as GN socket): raise it from 0.38 to 0.7 and watch sensors vanish in sparse areas, revealing only the cloud peaks. |
| **4:30 – 5:30** | Export: `File → Export → glTF 2.0 (.glb)`, show the `export_colors=True` option, drag-drop into Three.js viewer or Holoflow atelier. |

### Output
- Save as `screen.mp4` → place at `public/library/videos/geometry-nodes/gn-sample-grid-volume-field-probe-lattice/screen.mp4`
- Audio: capture voice-over or add narration in DaVinci Resolve post.
