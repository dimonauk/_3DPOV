# Screen Recording Notes
## python-gltf-user-extension-export-extras-hook

Target file: `public/library/videos/scripting/python-gltf-user-extension-export-extras-hook/screen.mp4`
Resolution: 1920×1080 | FPS: 30 | Audio: off

---

## OBS Setup

1. Sources → Add → Window Capture → select "Blender 5.1"
2. Video: 1920×1080, 30 fps
3. Output: MKV → remux to MP4 after session
4. Audio: disable all tracks (content is silent / captioned)

---

## Takes

### Take 1 — Extension discovery explained (90 s)

- Open Scripting workspace, paste the `blueprint.py` header comment
- Open Python console, run:
  ```python
  import bpy
  print(bpy.types.glTF2ExportUserExtension.__subclasses__())
  ```
- Show that list is empty before `register()`, then register and run again
- Narrate: "io_scene_gltf2 calls this at export time — registering your
  subclass puts it in the list"

### Take 2 — N-panel tagging walkthrough (60 s)

- Split viewport: 3D view left, N-panel right (Holoflow tab)
- Select `Facet_Prop_A` — panel shows "Untagged", extras preview absent
- Click "Mark as Facet" — panel switches to "Tagged", shows `"holoflow:facet": 1`
- Select `Regular_Prop` — stays "Untagged"

### Take 3 — Export and JSON inspection (90 s)

- File > Export > glTF 2.0 → set format Binary (.glb), check Include > Custom Properties
- Export to `/tmp/holoflow_test.glb`
- Open a terminal, run `python3 -c "import json,struct,sys; ..."`
  or use a GLB inspector: drag into `gltf.report` (glTF validator)
- Scroll to `nodes[0].extras` — show `"holoflow:facet": 1`
- Scroll to `asset.extras` — show `"holoflow:studio": "Holoflow Studio"`
- Show `nodes[2].extras` is absent for the untagged cube

### Take 4 — Three.js side (45 s)

- Open browser devtools, paste the three.js traverse snippet from README
- Show `userData` populated for tagged meshes, absent for untagged

### Take 5 — Hook method table (45 s)

- Show the README hook table in a text editor
- Briefly describe each hook: node, mesh, gltf (asset), joint, animation

### Take 6 — record.py render run (30 s)

- Open `record.py` in Text Editor, click Run Script
- Show render progress in the console; wait for first frames to appear

---

## Post-processing

```bash
ffmpeg -y -i screen_raw.mkv -c:v libx264 -crf 18 -pix_fmt yuv420p \
  public/library/videos/scripting/python-gltf-user-extension-export-extras-hook/screen.mp4
```
