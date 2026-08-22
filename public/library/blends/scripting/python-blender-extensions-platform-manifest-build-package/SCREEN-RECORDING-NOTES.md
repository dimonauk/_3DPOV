# Screen Recording Notes — Blender Extensions Platform

**Target file:** `public/library/videos/scripting/python-blender-extensions-platform-manifest-build-package/screen.mp4`

## OBS / Game Bar setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 / H.264 |
| Target length | 3–5 minutes |

## Scene to record

### Part 1 — Manifest creation (60–90 s)

1. Open the **Text Editor** (top of the default layout, or open a second window).
2. Create a new text block: click **New** in the header.
3. Name it `blender_manifest.toml` (click the name field, type, Enter).
4. Paste the manifest content from `blueprint.py` → `MANIFEST_TOML`.
5. Scroll slowly through each section so the viewer can read the comments.

### Part 2 — Extension directory in a file manager (30 s)

Switch to your OS file manager and show:
```
holoflow_exporter_ext/
├── blender_manifest.toml
├── __init__.py
├── operators.py
├── panels.py
└── preferences.py
```
Briefly open `__init__.py` in a code editor to show the relative imports.

### Part 3 — CLI validate + build (90 s)

Open a terminal **next to Blender** (split OBS scene if you like):

```bash
# Validate — should print "ok" with no errors
blender --command extension validate ./holoflow_exporter_ext/

# Build
blender --command extension build \
    --source-dir ./holoflow_exporter_ext/ \
    --output-dir ./dist/

ls -lh dist/
# shows: holoflow_webxr_exporter-1.2.0.zip
```

Zoom in so the terminal text is readable at 1080p.

### Part 4 — Install from disk (60 s)

1. Back in Blender: **Edit → Preferences → Get Extensions**.
2. Top-right corner: click the **↓ Install** icon → **Install from Disk**.
3. Navigate to `dist/holoflow_webxr_exporter-1.2.0.zip` and install.
4. The extension appears in the list with its manifest name and tagline.
5. Click it to expand and show the enabled checkbox and Preferences link.

### Part 5 — Runtime check in Python Console (30 s)

Open the **Python Console** (Scripting workspace or separate editor):

```python
import bpy
info = bpy.utils.extension_info("user_default", "holoflow_webxr_exporter")
print(info)
# {'id': 'holoflow_webxr_exporter', 'version': '1.2.0', ...}
```

## Edit notes

- Cut between scenes; no need to show full build output unless it's short.
- Add a title card at the start: "Blender 5.1 — Extensions Platform".
- End with the Preferences panel open showing the extension installed.
- No music needed; silence is fine for a coding tutorial.
