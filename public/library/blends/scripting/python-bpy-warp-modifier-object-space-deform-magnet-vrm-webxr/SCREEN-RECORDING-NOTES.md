# Screen-Recording Notes
## WarpModifier — VRM Sleeve Cuff Drape (Blender 5.1)

### Software
- **Blender 5.1** (window source)
- **OBS Studio** ≥ 30 or Windows Game Bar (Win+G)

### Capture settings
| Setting | Value |
|---------|-------|
| Window source | Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (narration dubbed separately) |
| Output | `screen.mp4` (H.264, CRF 18) |

### What to capture — shot list

**Segment 1 — Theory intro (0:00–0:45)**
1. Open a new Blender file. In the Viewport, press `N` → Object Properties → note the
   empty Object Data fields.
2. Add Cube (Shift+A → Mesh → Cube). In Properties → Modifier → Add Modifier, scroll
   to **Warp** under Deform. Show the From/To Object sockets while explaining the
   transform concept.
3. Add two Empties (Shift+A → Empty → Plain Axes). Assign one to From, one to To.
   Move the To empty — show the cube deforming live. This is the "aha" shot.

**Segment 2 — Blueprint execution (0:45–2:30)**
1. Open `blueprint.py` in the Script Editor (Shift+F11).
2. Hit **Run Script** (Alt+P or the triangle button).
3. Cut to Viewport in Solid mode — show the octagonal sleeve has appeared.
4. In Object Data Properties → Vertex Groups, show `cuff_zone` and
   **Weight Paint** mode — the colour gradient at the cuff end.
5. Switch to Properties → Modifier Properties — show the two WarpModifiers
   (Drape + Twist) stacked. Click eyeballs on/off to show each contribution in
   isolation.

**Segment 3 — Live parameter tweaking (2:30–3:30)**
1. With the Drape modifier selected, scrub `Strength` slider from 0 → 1 → 0.82.
   Watch the cuff swing in the viewport.
2. Scrub `Falloff Radius` — show how a small radius produces a sharp pinch vs
   a large radius smoothly pulling most of the cuff.
3. Switch to Twist modifier. Scrub `Strength`. Point out the spiral in the cuff
   edge — contrast with the drape direction.

**Segment 4 — Falloff type comparison (3:30–4:15)**
1. In the Drape modifier, cycle `Falloff Type`:
   - **SMOOTH** (default): gradual cubic taper, no hard edge
   - **SPHERE**: steeper, starts bolder then drops off quickly at the boundary
   - **SHARP**: almost all deformation near From, very little at the boundary
   - **LINEAR**: constant rate of decrease
   Show each with a brief pause so the difference reads clearly.

**Segment 5 — GLB export & Three.js preview (4:15–5:00)**
1. Back to blueprint.py — show the `bpy.ops.export_scene.gltf(...)` call.
2. Re-run the script to produce the exported `.glb`.
3. Open the output path in the system file manager to confirm the file exists.
4. (Optional) Drag the GLB into the Three.js 3D Viewer connector to show it
   renders correctly as a single mesh node.

### Editing notes
- Cut between Segment 2 and 3 on the moment the viewport pops with the sleeve geometry.
- Use Blender's built-in screen capture (Window → Save Screenshot) for still thumbnails.
- The weight-paint gradient shot (blue → red at cuff) is the thumbnail frame.
- Target runtime: **4–5 minutes** at normal pace.
