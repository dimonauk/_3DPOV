# Screen Recording Notes
## GN Merge by Distance — Weld-Clean Tiled Module Assembly

**Target file:** `public/library/videos/geometry-nodes/gn-merge-by-distance-weld-tiled-module/screen.mp4`

---

### OBS Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled (or record commentary separately) |
| Output format | MP4 / H.264 |

---

### What to record (in order)

**Part 1 — Module mesh inspection (≈ 40 s)**

1. Open `tile_wall_welded.blend` (run `blueprint.py` first to generate it).
2. Select the `tile_module` object.
3. Tab into **Edit Mode**. Switch to **Vertex select**. 
4. Press **A** to select all. Check the mesh statistics header: note the vertex count (12 verts per single tile module).
5. Tab back to Object Mode.

**Part 2 — Node editor: before weld (≈ 60 s)**

1. Open the **Geometry Node Editor** (shift the bottom editor to node editor, set mode to Geometry Nodes, select the `GN_WeldTile` modifier).
2. Scroll to the **RealizeInstances** node. Disconnect the wire going to **MergeByDistance** and connect `RealizeInstances.Geometry` directly to `GroupOutput.Geometry`.
3. Tab the 3D viewport into **Edit Mode**. The duplicated seam vertices are now visible — you will see **overlapping edges** along all tile borders. The mesh statistics show 108 verts (= 9 tiles × 12).
4. Hold `Alt` and click a border edge to select the edge loop — notice TWO loops are selected (the duplicate pair). This is the problem MBD solves.
5. Tab back to Object Mode.

**Part 3 — Reconnect and demonstrate weld (≈ 60 s)**

1. In the Node Editor, reconnect `RealizeInstances.Geometry → MergeByDistance.Geometry → GroupOutput.Geometry`.
2. Tab into Edit Mode again. The mesh statistics now show the welded vertex count (fewer verts — exact number prints in the Blender console from `blueprint.py`).
3. `Alt`-click the same border edge — now only ONE loop selects. The seam is welded.
4. Open the **N Panel** (press N) → **Item** tab → note the face count under *Statistics* to confirm a clean, unified mesh.

**Part 4 — 3D Print Toolbox check (≈ 30 s)**

1. With the object selected, open **Edit Menu → 3D Print Toolbox** (or `N` panel → **3D Print** tab if the add-on is enabled).
2. Click **Check All**. Confirm: Non-Manifold Edges = 0, Intersecting Faces = 0.
3. Briefly show the GLB file in the file browser to confirm it exported.

**Part 5 — mode='CONNECTED' comparison (≈ 30 s)**

1. Select the MergeByDistance node. Change `mode` from **All** to **Connected**.
2. Tab into Edit Mode — the seam verts are NOT merged (count returns to 108) because CONNECTED only merges verts within an existing edge chain.
3. Change mode back to **All** to restore correct weld.

---

### Editing notes

- Cut between Part 2 and Part 3 with a short pause for clarity.
- Add a PiP (picture-in-picture) showing the mesh statistics counter in the top-left so viewers see the vertex count changing.
- Total target length: **3–4 minutes**.
