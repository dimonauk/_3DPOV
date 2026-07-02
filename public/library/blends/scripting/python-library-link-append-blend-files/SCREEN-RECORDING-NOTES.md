# Screen Recording Notes
## Tutorial: Python — bpy.data.libraries.load: Linking & Appending Datablocks

**Target file:** `public/library/videos/scripting/python-library-link-append-blend-files/screen.mp4`

---

### OBS / Game Bar setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Output format | MP4 / H.264 |
| Bitrate | 8 000 kbps |

Start recording before step 1; stop after the final `bpy.ops.wm.save_as_mainfile()` call is confirmed in the Info header.

---

### Recording script

**Part 1 — Build the asset file (ASSETS_BLEND)**

1. Open Blender 5.1. File → New → General.
2. Switch to the **Scripting** workspace.
3. In the Text Editor press **New**. Paste the first section of `blueprint.py` (everything up to `def link_collection_from_file`). Save as `step1_build_assets.py`.
4. Press **Alt+P** to run. Watch the **Info header** — it should show `[library-link-append] wrote asset file: ~/holoflow_assets.blend`.
5. Open **File → Open** → `~/holoflow_assets.blend`. Show the Outliner: the collection `HF_PropKit` with three `CrystalProp_*` objects should be visible.
6. Close without saving; re-open the original blank scene.

**Part 2 — Link the collection**

7. Back in the Scripting workspace, create a new text block: paste `step2_link.py` (just `link_collection_from_file(ASSETS_BLEND, COLLECTION_NAME)`).
8. Run with **Alt+P**. Switch to the **3D Viewport**. The three crystals appear with an **orange outline** — the linked-data indicator.
9. Try to enter Edit Mode on one crystal (Tab). Blender shows: *"Cannot edit external library data."* — point this out as it demonstrates the link constraint.

**Part 3 — Append a material**

10. Run `append_material_from_file()` call. Open **Material Properties** on the default cube — drag the appended `HF_Faceted_Flat` onto the cube. Show in the Python console that `bpy.data.materials["HF_Faceted_Flat"].library` is `None` (local copy).

**Part 4 — Library Override**

11. Select the linked collection in the Outliner (right-click → **Library Override → Make**). Show the **purple override indicators** on the objects. Enter Edit Mode on one — now allowed. Show `ob.override_library` in the Python console.

**Part 5 — Save assembly + verify**

12. Run `bpy.ops.wm.save_as_mainfile(filepath="~/holoflow_assembly.blend")`.
13. Close Blender. Re-open `holoflow_assembly.blend`. Show that the linked objects are still connected to `holoflow_assets.blend` via **File → External Data → Report Missing Files** (should show zero missing).

---

### Key moments to highlight (on-screen annotation or zoom)

- The orange outline on linked objects
- The "Cannot edit external library data" message
- `ob.library` vs `None` in the Python console
- Purple override indicator after `make_override_library()`
- The external-data report showing a healthy link
