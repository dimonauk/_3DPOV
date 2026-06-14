# Screen Recording Notes — Lattice + Shrinkwrap: Non-Destructive Prop Cage

## OBS Setup

- **Source**: Window Capture → Blender 5.1
- **Resolution**: 1920 × 1080
- **Frame rate**: 30 fps
- **Audio**: Off (add voiceover / music in post)
- **Output**: `screen.mp4` → move to
  `public/library/videos/modifiers/modifier-lattice-shrinkwrap-prop-cage/`

---

## Suggested Recording Flow

### 0:00 – 0:40  Before: empty viewport
Open a fresh Blender 5.1 session.
Point at the modifier Properties panel (wrench icon) — it is empty.
Narrate: "We are going to fit a shoulder pauldron to this torso without touching
a single vertex on the prop mesh."

### 0:40 – 1:30  Run blueprint.py
Scripting workspace → load `blueprint.py` → Run Script.
The viewport should show:
  - A wireframe ellipsoid torso (body_reference)
  - A dark metallic half-dome prop sitting on the left shoulder
  - A wire-frame lattice cage surrounding the prop

### 1:30 – 3:00  Demonstrate the Lattice modifier live
Select `lattice_pauldron`.  Switch to Edit Mode (Tab).
Select the eight top-row CVs (Box Select, top half of lattice).
Press G → Z → type 0.08 → Enter: the dome rises.
Press G → Y → type 0.06 → Enter: the dome arches backward.
Tab back to Object Mode — note how the pauldron silhouette changed with zero
topology edits.

### 3:00 – 4:30  Show the Shrinkwrap snapping
Select `prop_pauldron`.  Open the Properties panel → Modifier (wrench).
Show the two modifiers: Lattice_Cage (top) and Shrinkwrap_Body (below).
Click the Vertex Group field on Shrinkwrap_Body — it says "inner_contact".
In the viewport switch to Vertex Paint overlay (Overlay → Vertex Group Weights):
  the equatorial ring verts glow red; the dome interior is blue (weight = 0).
Narrate: "The Shrinkwrap only touches the red boundary ring.  The dome stays
exactly where the lattice put it."

### 4:30 – 5:30  Modifier order swap (destructive demo — Ctrl+Z after)
In the Modifier panel, drag Shrinkwrap_Body ABOVE Lattice_Cage using the ≡ handle.
Grab a lattice CV and move it — watch the prop detach from the body surface.
Press Ctrl+Z to undo the reorder.
Narrate: "Wrong order — the Lattice overrides the surface snap.  Correct order:
Lattice on top, Shrinkwrap below."

### 5:30 – 6:30  Swap the body reference
Duplicate `body_reference` (Shift+D, Escape to keep in place).
Scale it wider (S → X → 1.3) to simulate a broader character.
In the Shrinkwrap modifier on `prop_pauldron`, click the Target dropdown and
select the duplicate.  Watch the pauldron instantly refit to the larger torso.
Narrate: "One modifier field change refits the prop for a different body size."

### 6:30 – 7:00  Closing shot
Delete the duplicate body.  Return the lattice to its blueprint state.
Orbit the viewport to a three-quarter hero angle.
End recording.

---

## Talking Points

- "A lattice is a control cage — you are editing the cage, not the mesh.  The
  mesh topology is untouched; you can always remove the modifier and the original
  geometry is intact."
- "KEY_BSPLINE interpolation means a single CV movement produces a smooth wave
  across the mesh.  KEY_LINEAR would produce kinks — fine for hard-surface work,
  wrong for an organic shoulder."
- "The OUTSIDE wrap mode is what keeps the prop from sinking into the body.
  Set the offset to your fabric or armour thickness — 4–12 mm is typical."
- "For a clothing layer, duplicate the body, apply a Solidify modifier at the
  fabric thickness, and use THAT as the Shrinkwrap target.  The cloth then wraps
  the fabric shell, not the bare body — correct silhouette at all times."
