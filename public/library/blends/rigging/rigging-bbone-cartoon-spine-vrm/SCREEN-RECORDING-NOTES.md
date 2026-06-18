# Screen Recording Notes — B-Bones Cartoon Spine (Blender 5.1)

**Output target**: `public/library/videos/rigging/rigging-bbone-cartoon-spine-vrm/screen.mp4`

## OBS / Game Bar settings

| Setting | Value |
|---|---|
| Window source | Blender (fullscreen or maximised) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Format | MP4 / H.264 |

## Recording flow

### 1 — Build the rig (0:00)
Scripting workspace → open `blueprint.py` → Run Script.  The torso cylinder
and spine rig appear.  Point out the **BBONE** display type: the armature shows
as a 3-D ribbon rather than sticks.

### 2 — Pose Mode overview (0:20)
Press **Tab** or set mode to **Pose Mode**.  Select a mid-spine bone — the
Properties panel ▸ Bone ▸ Bendy Bones section shows Segments = 4 and the
handle assignments.  Pan the viewport to show the ribbon subdivisions clearly.

### 3 — 'C' forward lean (0:40)
Select all spine bones (A).  Press **R X**, drag to roughly 70° total.  Hold
**Ctrl** to snap at 10° increments.  The torso follows the spine curve with no
kinks.  Reset with **Alt+R**.

### 4 — 'S' curve (1:10)
Select spine_01 + spine_02, press **R X 15 Enter**.
Select spine_05 + spine_06, press **R X -15 Enter**.
The torso forms a full S-curve.  Scrub the viewport to see the mesh deforming.

### 5 — Handle bone tangent steering (1:45)
Select `bbone_handle_root`.  Press **R Y**, drag slowly.  The entry curve of
the spine changes direction without moving the spine bones themselves — the
Bézier tangent is being steered.  This is the key difference between
TANGENT handles and AUTO handles.

### 6 — Change segment count live (2:10)
With a spine bone selected, go to **Properties ▸ Bone ▸ Bendy Bones ▸ Segments**.
Change from 4 → 2: the kink appears.  Change to 8: ultra-smooth.  Return to 4.

### 7 — GLB export (optional, 2:40)
File ▸ Export ▸ glTF 2.0.  Show the Armature section — note
`Export Deformation Bones Only` option.  After export, open the exported file in
a text editor and search for `"name": "spine_"` — you'll see 24 spine bones
instead of 6, the B-Bone bake in action.

### 8 — Run record.py (3:00)
Scripting workspace → open `record.py` → Run Script.  The animation renders to
`public/library/videos/rigging/rigging-bbone-cartoon-spine-vrm/viewport.mp4`.

## Duration
Aim for 3–4 minutes.  Steps 1–6 are core; steps 7–8 are optional detail.
