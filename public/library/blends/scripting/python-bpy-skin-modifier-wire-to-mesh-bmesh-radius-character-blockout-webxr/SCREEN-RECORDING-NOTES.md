# Screen Recording Notes — SkinModifier Tutorial

## OBS setup

| Setting | Value |
|---|---|
| Window source | Blender 5.1 (application capture) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output | `screen.mp4` (H.264, CRF 18) |

## Recording sequence

1. **Open Blender 5.1.** Delete the default cube. Switch to the Scripting workspace.
2. **Open `blueprint.py`** in the text editor. Walk the viewer through it:
   - `PARAMETERS` block — point out the `R_*` radius constants and explain that
     `(rx, ry)` means X and Y radii of the tube cross-section at that vertex.
   - `build_wire_and_skin()` — show that the mesh has **no faces**; only `bm.edges.new()`.
     Highlight `bm.verts.layers.skin.verify()` and the `use_root=True` on the pelvis.
   - `add_modifier_stack()` — show the two modifiers: `SKIN` then `SUBSURF`.
     Explain `branch_smoothing` briefly.
   - `export_glb()` — point out `export_apply=True`.
3. **Run `blueprint.py`** (Alt+R or the Run Script button).
4. **Switch to 3D Viewport.** Show the modifier stack in the Properties panel.
   - Tab into **Edit Mode** — the bare wire (verts + edges, no faces) is visible.
     Note the absence of any face normal overlay.
   - Tab back to **Object Mode**.
5. **Toggle modifiers** in Properties → Modifiers:
   - Hide the **SubsurfModifier** (eye icon) to show the raw Skin quads.
   - Re-enable Subsurf. Hide the **SkinModifier** to show the bare wire.
   - Re-enable Skin.
6. **Show the root vertex** — in Edit Mode, select the pelvis vertex. Show that
   the Skin modifier header displays it as the root via the Object Data Properties
   → Skin Vertices section (if visible in your build).
7. **Open `record.py`.** Run it. Let the Eevee render complete (4 s at 1280×720
   takes ~30 s with BLENDER_EEVEE_NEXT).
8. Show the output in the File Browser or OS file manager.
9. Stop recording.

## File placement

Save `screen.mp4` to:
```
public/library/videos/scripting/python-bpy-skin-modifier-wire-to-mesh-bmesh-radius-character-blockout-webxr/screen.mp4
```
