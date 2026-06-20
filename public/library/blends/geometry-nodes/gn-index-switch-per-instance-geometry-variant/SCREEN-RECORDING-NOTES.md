# Screen Recording Notes — GN Index Switch Per-Instance Geometry Variant

These instructions are for capturing `screen.mp4` using OBS Studio or Windows
Game Bar. The resulting file lands at:
`public/library/videos/geometry-nodes/gn-index-switch-per-instance-geometry-variant/screen.mp4`

---

## Software & settings

| Setting | Value |
|---------|-------|
| Capture source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Output format | MP4 / H.264 |
| Audio | Off (no microphone needed for this capture) |
| Bitrate | 6 000 kbps (or "High Quality" CRF preset) |

---

## What to record (approx. 8–12 minutes)

### 1. Scene setup (2 min)
- Open a fresh Blender 5.1 file.
- Delete the default cube.
- Add → Mesh → Plane, scale to 8 BU.
- Briefly show the four column variants being added to a hidden `_column_variants`
  collection (Add → Cylinder × 2, Add → Cone, Add → Cube; rename each).

### 2. Geometry Nodes tree (5 min)
Walk through the node tree built by `blueprint.py`, explaining each stage:

1. **Distribute Points on Faces** — set Distribute Method = Poisson Disk,
   Max Points = 40, Seed = 7.  Show the scattered points in the viewport.

2. **Position + maths for proximity** — add Position node → Separate XYZ →
   two Multiply nodes (X² and Y²) → Add → SQRT.  Result: horizontal distance
   from origin.  Connect to a Less Than node (threshold = Centre Radius).

3. **Random Value (INT)** — add the node, set Min=0, Max=3, Seed from Group
   Input.  Show how the Index input drives per-point variation (wire Index
   node → ID socket).

4. **Blend random with proximity** — SUBTRACT(1, LessThan) gives the
   inverse-near mask.  MULTIPLY(random, inverse_near) zeroes the index
   for near-centre points → FLOOR.

5. **Index Switch** — add node (Geometry type), extend to 4 inputs via the
   `+` button in the node header.  Wire integer field → Index socket.  Attach
   four Object Info nodes (one per column variant object) to inputs 0–3.
   Show the colonnade appear in the viewport with varied columns.

6. **Instance on Points** — wire Points from Distribute, Instance from Index
   Switch.  Add a random Z rotation (Random Value → Combine XYZ → Rotation).
   Realise Instances, Join Geometry with original ground, connect to output.

### 3. Live slider demo (2 min)
- Properties → Modifier → Colonnade Generator.
- Drag **Random Seed** from 42 → 100 → 200: show columns reshuffling across
  the scatter while near-centre columns always stay as variant A.
- Drag **Centre Radius** from 2.0 → 0.0: all columns go random.
  Drag back to 4.0: a wide ring of plain cylinders around the centre.
- Drag **Instance Count** from 40 → 80: denser scatter, all variants still
  represented.

### 4. Export GLB (1 min)
- File → Export → glTF 2.0.
- Tick: Apply Modifiers, Draco Compression Level 6, Y Up.
- Click Export and show the file size in the file browser.

---

## OBS scene setup

1. **Sources panel** → + → Window Capture → select Blender.
2. **Audio Mixer** → mute Desktop Audio and Mic/Aux.
3. **Settings → Output → Recording**:
   - Recording path: `<repo>/public/library/videos/geometry-nodes/gn-index-switch-per-instance-geometry-variant/`
   - Filename: `screen`
   - Format: mp4
4. Press **Start Recording** before step 1 above.
5. Press **Stop Recording** after the GLB export completes.
6. Rename the output file to `screen.mp4` if OBS appended a timestamp.

---

## Windows Game Bar alternative

Press `Win + G` → Capture → Start recording (`Win + Alt + R`).  The file
appears in `Videos/Captures/`.  Move it to the path above and rename to
`screen.mp4`.
