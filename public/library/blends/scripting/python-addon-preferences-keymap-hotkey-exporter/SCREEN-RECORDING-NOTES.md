# Screen Recording Notes
## python-addon-preferences-keymap-hotkey-exporter

Target: `public/library/videos/scripting/python-addon-preferences-keymap-hotkey-exporter/screen.mp4`
Resolution: 1920×1080 | FPS: 30 | Audio: off

---

## OBS Setup

1. Sources → Add → Window Capture → select "Blender 5.1"
2. Video: 1920×1080, 30 fps
3. Output: MKV → remux to MP4 after session
4. Audio: disable all tracks (content is silent / captioned)

---

## Takes

### Take 1 — Install and inspect the preferences panel (90 s)

- Open Scripting workspace, paste `blueprint.py`, click Run Script
- Switch to Edit > Preferences > Add-ons, search "Holoflow"
- Expand the add-on entry; show the Preferences sub-panel:
  Export Root, Draco Compression slider, WebP Textures toggle, Verbose toggle
- Change Export Root to `//my_exports` — narrate: "this survives .blend reloads"
- Narrate: "`bl_idname` must exactly match the Python module name"

### Take 2 — Reading prefs at runtime in the Python console (60 s)

- Open Python Console (Shift+F4 or Info > Python Console)
- Type and run:
  ```python
  prefs = bpy.context.preferences.addons[__name__].preferences
  print(prefs.export_root)
  print(prefs.draco_level)
  ```
- Show output matches what was set in the preferences panel
- Change the slider in Prefs, re-run — show value updates live

### Take 3 — Keymap registration walkthrough (75 s)

- Edit > Preferences > Keymap, search bar: type "Holoflow"
- Show "Holoflow: Quick WebXR Export" bound to Ctrl+Shift+E (3D View)
  and Ctrl+Alt+Shift+E (Window)
- Click the binding, press a new key, then revert to default
- Narrate: "because we registered to `kc.keymaps.addon`, users can rebind
  without breaking the factory mapping"

### Take 4 — Triggering the hotkey (45 s)

- Return to 3D View with the demo scene loaded
- Press Ctrl+Shift+E — show the export progress in the status bar
- Open the Info editor to see `bpy.ops.holoflow.quick_webxr_export()` in the log
- Show `/tmp/` (or configured root) now contains `untitled.glb`

### Take 5 — Verbose logging (30 s)

- In Preferences toggle Verbose on
- Press Ctrl+Shift+E again
- Switch to the System Console (Window > Toggle System Console)
- Show per-object log lines prefixed with `[Holoflow]`

### Take 6 — record.py render (30 s)

- Open `record.py` in Text Editor → Run Script
- Show render progress; show first frame (idle cubes)
- Skip ahead in preview to frame 51 to show the teal export-flash

---

## Post-processing

```bash
ffmpeg -y -i screen_raw.mkv -c:v libx264 -crf 18 -pix_fmt yuv420p \
  public/library/videos/scripting/python-addon-preferences-keymap-hotkey-exporter/screen.mp4
```
