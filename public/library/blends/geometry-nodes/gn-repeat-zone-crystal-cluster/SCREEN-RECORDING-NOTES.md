# Screen Recording Notes — GN Repeat Zone Crystal Cluster

OBS Studio or Windows Game Bar. Window source = Blender 5.1.
Resolution: 1920 × 1080. Frame rate: 30 fps. Audio: off.
Output: `public/library/videos/geometry-nodes/gn-repeat-zone-crystal-cluster/screen.mp4`

---

## Shot list (target ~10 minutes total)

### Shot 1 — Introduction (30 s)
Open Blender 5.1 to a fresh general scene. Briefly show the default cube.
Explain in voiceover: "We're going to build a crystal cluster using the Repeat Zone.
Unlike Instance on Points, which scatters one geometry across many positions, the
Repeat Zone runs arbitrary node logic N times — perfect for accumulating geometry
that changes with each iteration."

### Shot 2 — Create base object (1 min)
- Add > Mesh > Plane, then immediately delete it (we need an empty object).
- Instead: Add > Empty > Plain Axes, rename to `crystal_cluster`.
- Switch to the Geometry Nodes workspace.
- Add a Geometry Nodes modifier → New.

### Shot 3 — Declare sockets (1 min)
In the node editor, open the Group panel (N-panel > Group).
Add sockets: Crystal Count (Int), Spiral Radius, Base Scale, Tip Scale,
Cone Vertices (Int), Base Height. Show the min/max clamps in the Modifier panel.

### Shot 4 — Add Repeat Zone (2 min)
- Shift+A > Geometry Nodes > Repeat Zone. Two nodes appear: Repeat Input + Repeat Output.
- In the Repeat Input header, click + to add a body channel named `Accumulated`, type Geometry.
- Wire Crystal Count → Repeat Input.Iterations.
- Show that the `Iteration` output (loop index, 0-based) is the only data coming out of the Repeat Input until you add body channels.

### Shot 5 — Build the math inside the zone (3 min)
Add Math nodes for:
- `t = Iteration ÷ (Count − 1)`
- `angle = Iteration × 2.4` (golden angle ≈ 2.399963 rad — show why this irrational number gives the best spread)
- `radius = √t × Spiral Radius`
- `x = cos(angle) × radius`, `y = sin(angle) × radius`
- Map Range: Base Scale → Tip Scale over t → scale_factor
- `depth = scale_factor × Base Height`
- `z = depth ÷ 2`
- Combine XYZ.

### Shot 6 — Add Cone + Transform + Join (2 min)
- Add a Mesh Cone node. Set Fill = NGON. Wire Cone Vertices, Radius Bottom = scale_factor, Depth = depth.
- Add Transform Geometry. Wire Translation = Combine XYZ.
- Add Join Geometry. Wire Repeat Input.Accumulated + Transform output into Join.
- Wire Join output → Repeat Output.Accumulated.
- Show the viewport: twelve crystals appear in a Fermat spiral pattern.

### Shot 7 — Set Shade Smooth = False (30 s)
After the Repeat Output, add Set Shade Smooth. Set domain = Face, Shade Smooth = off.
Toggle Smooth vs Flat in real time so the faceted crystal read is clear.

### Shot 8 — Modifier sliders live demo (1 min)
Back in the Properties panel > Modifier. Drag Crystal Count 1 → 12 slowly.
Show crystals appearing in Fermat-spiral order (no two in a straight line from centre).
Drag Spiral Radius and Base Scale to show the cluster contracting / expanding.

### Shot 9 — Export GLB (30 s)
File > Export > glTF 2.0. Tick Apply Modifiers. Show file in explorer.
Briefly open in Don McCurdy's glTF Viewer online to confirm correct geometry.

---

## OBS settings reminder
- Scene: Blender window capture (not desktop capture)
- Hotkey: Start/stop recording set to F9 so hands are visible
- Microphone: close-field, gain −12 dB, noise gate on
