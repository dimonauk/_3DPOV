# Screen Recording Notes — UV Atlas Pack Tutorial

**Target file**: `public/library/videos/scripting/python-bpy-mesh-uv-layer-atlas-pack-multi-object-webxr/screen.mp4`

## OBS / Game Bar setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (silent capture) |
| Format | MP4 / H.264 |

## What to capture (in order)

1. **Scripting workspace** — paste blueprint.py into the Text Editor, run it,
   show the Info bar confirming "Export scene.gltf" completed.
2. **Viewport — Rendered shading** — show the three props (body/pillar/cap)
   with the quadrant-coloured atlas texture visible.  Rotate the view to show
   all three objects clearly.
3. **UV Editor split** — drag a new editor pane, switch it to UV Editor.
   Select the body object → Edit Mode → A (Select All).  Show the UV islands
   sitting in the bottom-left quadrant (red tile region).  Repeat for pillar
   (bottom-right / green) and cap (top-left / blue).
4. **Console output** — switch to the Scripting workspace console and scroll
   to show the UV stats printout and the final JSON manifest.

## Suggested hotkeys to show on screen

| Key | Action |
|-----|--------|
| `Alt + T` | Toggle Info header to show operator feedback |
| `Z` (then Rendered) | Switch to Rendered viewport shading |
| `Tab` | Toggle Edit Mode to inspect UV islands |
| `A` | Select All in Edit/UV mode |

## Duration target

**60–90 seconds total.**  No narration needed — subtitle overlays added in
post via VSE (see `blender-tutorial-python-bpy-sequence-editor-vse-script-tutorial-assembly`).
