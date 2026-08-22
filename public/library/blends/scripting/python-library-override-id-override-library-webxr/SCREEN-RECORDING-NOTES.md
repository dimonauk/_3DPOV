# Screen Recording Notes
## python-library-override-id-override-library-webxr

**Software**: OBS Studio (Windows) or SimpleScreenRecorder (Linux)  
**Window**: Blender 5.1 — Scripting workspace, then 3D Viewport  
**Resolution**: 1920 × 1080 @ 30 fps  
**Audio**: off  
**Output**: `public/library/videos/scripting/python-library-override-id-override-library-webxr/screen.mp4`

---

### Take 1 — Running the blueprint (Scripting workspace)

1. Open Blender 5.1. Switch to the **Scripting** workspace.
2. In the Text Editor, open `blueprint.py` from this folder.
3. Start OBS recording.
4. Press **Run Script** (▶). Watch the Info header for progress prints.
5. When the console prints `[python-library-override-id-override-library-webxr] complete`, stop recording.

Capture these moments on screen:
- The `build_hero_library()` phase: info bar shows saves to `hero_library.blend`
- The `link_from_library()` phase: the Outliner shows the linked object with its chain-link icon
- After `create_override()`: the Outliner switches the chain icon to a local override icon (shield)
- After `apply_overrides()`: the Properties ▸ Object panel shows the overridden location in **blue** (override highlight)

---

### Take 2 — Outliner deep dive

1. In the Outliner, set display mode to **Blender File** (folder icon, top-right).
2. Expand **Object** → `gem_hero`. Show the **library** property (chain icon = linked).
3. Switch to **View Layer** mode. Show `gem_hero` with the override shield icon.
4. Click `gem_hero` → Properties ▸ Object Properties ▸ Transform.
   - **Location X** should show `1.400` with a blue background (property is overridden).
5. Click the blue dot next to Location X to show the **Override menu** (REPLACE operation).

---

### Take 3 — Viewport recording (use record.py)

1. Open `record.py` in the Text Editor. Run it to set up the animation scene.
2. Switch to **3D Viewport** — set display to **Material Preview** (sphere icon).
3. At frame 1: show the library-default gem (centre, default teal).
4. At frame 61: manually toggle **Overlay ▸ Wireframe** on, then off.
5. Press **Space** to play the camera orbit animation through frame 120.
6. Stop OBS at end of playback.

---

### Notes

- The Outliner **override shield** icon (🛡) distinguishes a library override from a linked ID.
- Blue property highlights in the Properties panel = overridden value.
- `bpy.ops.outliner.liboverride_resync_hierarchy_enforce()` can be demonstrated in a
  fourth take: run it, then show that Location stays blue (enforced) while non-overridden
  properties would have updated from the library.
