import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function LatticeBody() {
  return (
    <>
      <p>
        The Lattice modifier is the understated workhorse of non-destructive
        prop-fitting.  Where Geometry Nodes or a sculpt pass would permanently
        change vertex positions, a lattice cage sits <em>around</em> the mesh
        and deforms it via a coarse grid of control vertices — CVs — without
        touching the underlying topology.  Remove the modifier and the original
        mesh snaps back, unchanged.
      </p>

      <p>
        Pairing it with the Shrinkwrap modifier, underneath in the stack, turns
        this into a contact-fitting rig: the Lattice controls the prop&rsquo;s
        gross silhouette and depth while the Shrinkwrap snaps only the inner
        boundary ring to whatever body surface is assigned as the target.  The
        result is an armour piece, clothing panel, or sticker decal that refits
        to a completely different character in seconds — no re-sculpting, no
        re-UV-unwrapping, no manual vertex sliding.
      </p>

      <p>
        Stack order is not optional here.  Lattice fires first — reshaping the
        dome — then Shrinkwrap fires on the already-shaped mesh.  Reversing
        them makes the Lattice override the surface snap every time you touch a
        CV.  This tutorial explains why, builds the modifier stack in Python,
        and walks the production workflow for GLB export.  If you need to
        weight-paint the influence zones by hand, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-armature-weight-paint"
          className={lk}
        >
          weight painting tutorial
        </Link>
        ; if the prop needs size morph targets for S/M/L body variants, the{" "}
        <Link
          href="/tutorials/blender-tutorial-shape-keys-morph-targets"
          className={lk}
        >
          shape keys tutorial
        </Link>{" "}
        covers baking modifiers into blend shapes before GLB export.  For an
        entirely node-based alternative that drives surface conforming through
        a geometry graph, the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-geometry-proximity-deform"
          className={lk}
        >
          GN Geometry Proximity deform tutorial
        </Link>{" "}
        is the comparison entry.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-modifier-lattice-shrinkwrap-prop-cage",
  title:
    "Modifier Stack — Lattice + Shrinkwrap: Non-Destructive Prop Deformation Cage (Blender 5.1)",
  date: "2026-06-14",
  kind: "tutorial",
  excerpt:
    "Fit a shoulder pauldron to a body reference without editing its topology: " +
    "Lattice modifier as a CV cage controls dome silhouette; Shrinkwrap (stack position 2) " +
    "snaps the contact ring to the body surface in OUTSIDE mode.",
  Body: LatticeBody,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/modifiers/modifier-lattice-shrinkwrap-prop-cage/",
    time: "one to two hours",
    difficulty: "intermediate",
    overview:
      "The Lattice modifier wraps a coarse CV cage around any mesh object and deforms it " +
      "via control-vertex edits — no topology changes required, fully reversible. " +
      "Stacked below a Lattice, the Shrinkwrap modifier projects a nominated vertex group " +
      "(the contact ring) onto a reference surface and keeps it there through every subsequent " +
      "lattice adjustment.  Together they build a prop-fitting rig that adapts to any body " +
      "shape by changing one target field in the Properties panel.",
    goal:
      "Build a shoulder pauldron prop with a 3×2×3 lattice cage and a vertex-group-limited " +
      "Shrinkwrap that keeps the contact ring flush with a torso reference, then export " +
      "the applied result as a Draco-compressed GLB.",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
        platforms: ["windows", "macos", "linux"],
      },
    ],
    prerequisites: [
      "Comfortable in Object Mode and Edit Mode — selecting, transforming, Tab to switch",
      "Familiar with the Modifier Properties panel — adding, reordering, and applying modifiers",
      "Understands vertex groups — creating, assigning weights, using as modifier masks",
      "Basic Python in Blender's Scripting workspace (running a script, reading the console)",
    ],
    steps: [
      {
        title: "What a lattice is and why it beats direct editing for props",
        body: `A Blender Lattice object is a volumetric grid of control vertices (CVs).
When the Lattice modifier is applied to a mesh and the mesh sits inside the lattice
volume, each mesh vertex is influenced by its surrounding CVs via trilinear (or
B-Spline) interpolation.  Moving a CV nudges every mesh vertex in its region.

Why not just edit the prop mesh directly?
  — The original topology is preserved: UV maps, vertex groups, normals, and any
    downstream modifiers all survive unchanged.
  — You can instance the same prop across ten characters and give each a different
    lattice, customising the fit without duplicating the base mesh.
  — Undoing a lattice edit is reversible at any time; undoing mesh edits after a
    GLB export means re-importing and re-fitting.

Lattice point count (LAT_U, LAT_V, LAT_W):
  The blueprint uses 3×2×3.  Three height layers (W=0,1,2) let you separately
  control base width, mid-height flare, and dome peak.  V=2 (front/back) is the
  minimum for depth — one layer at front, one at back.  Increasing U to 4 or 5
  adds lateral control without much benefit for a single pauldron; save the
  resolution for elongated props like belts or greaves.

Interpolation type — always KEY_BSPLINE for organic props:
  KEY_BSPLINE: deformation is C2-continuous through every CV.  Move one CV;
  the mesh curves smoothly in its neighbourhood.
  KEY_LINEAR: deformation is linear between CVs — produces kinks at cage
  boundaries.  Useful for hard-surface Boolean deformation, wrong for cloth.`,
      },
      {
        title: "Shrinkwrap wrap methods: choosing NEAREST_SURFACEPOINT",
        body: `Blender's Shrinkwrap modifier offers four wrap methods.  Choosing wrongly
produces either collapsed geometry or vertices that ignore the surface entirely.

NEAREST_SURFACEPOINT (used here):
  Moves each influenced vertex to the nearest point on the target surface,
  projected along the shortest path (not along a fixed axis).  Ideal for
  contact fitting where the contact ring has no single dominant approach direction.
  wrap_mode='OUTSIDE' + positive offset: vertices stop just outside the surface
  at the given offset distance, preventing interpenetration regardless of body pose.

PROJECT:
  Moves vertices along a chosen axis (X, Y, Z, or face normal) until they hit
  the target.  Useful for decal placement on a flat or gently curved surface
  (e.g. a logo sticker on a car bonnet), or for retopology snapping where you
  need directional control.  Fails if the projection ray misses the target.

NEAREST_VERTEX:
  Snaps to the nearest vertex of the target mesh rather than the nearest surface
  point.  Very fast but coarse — the output follows target vertex spacing, which
  is jarring on a low-poly reference body.  Reserve for cloth-sim initialisation
  where position accuracy matters less than speed.

TARGET_PROJECT (Blender 4.0+):
  Projects along the averaged face normals of the target mesh at each influenced
  vertex's location.  More stable than PROJECT for curved surfaces where the
  global axis projection would clip through overhangs.

For armour fitting: NEAREST_SURFACEPOINT + OUTSIDE is almost always correct.
For retopology snapping: PROJECT along Normal or NEAREST_SURFACEPOINT.
For cloth initialisation: NEAREST_VERTEX or NEAREST_SURFACEPOINT without offset.`,
      },
      {
        title: "Modifier stack order: Lattice on top, Shrinkwrap below",
        body: `Blender evaluates the modifier stack from index 0 (top of the list) downward.
The output of each modifier feeds into the next as input geometry.

Correct order for prop fitting:
  [0] Lattice_Cage    — reshapes dome silhouette via CV cage
  [1] Shrinkwrap_Body — receives already-shaped mesh; snaps contact ring

Failure mode — reversed order:
  [0] Shrinkwrap_Body — snaps contact ring to body surface ✓
  [1] Lattice_Cage    — overrides those positions based on CV influence ✗
  Result: adjusting a lattice CV moves contact verts away from the body surface.
  The prop lifts away from the torso whenever the dome is edited.

Python to reorder modifiers (if you need to correct the order programmatically):
  bpy.ops.object.modifier_move_to_index(
      modifier="Lattice_Cage", index=0
  )
  bpy.ops.object.modifier_move_to_index(
      modifier="Shrinkwrap_Body", index=1
  )

Or via the direct API (Blender 3.5+):
  ob.modifiers["Shrinkwrap_Body"].execution_position = 1

The modifier_move_to_index operator requires the object to be active and selected.
The execution_position property is available in Blender 4.x onwards.`,
      },
      {
        title: "Vertex groups: limiting Shrinkwrap to the contact ring",
        body: `Without a vertex group, Shrinkwrap moves EVERY vertex in the prop to the
body surface — collapsing the dome into a thin shell plastered to the torso.

The fix: create vertex group 'inner_contact' containing only the equatorial ring
vertices (the open bottom edge of the half-dome).  Assign those verts weight=1.0.
All other verts get weight=0.0 (the default when they are not in the group).

In Python:
  vg = ob.vertex_groups.new(name="inner_contact")
  equatorial = [v.index for v in me.vertices if abs(v.co.z) < 0.028]
  vg.add(equatorial, 1.0, 'REPLACE')

The threshold 0.028 m (2.8 cm for a 22 cm dome) captures exactly the bottom
ring of the half-sphere UV mesh.  Adjust if your dome radius or ring spacing
differs.

Then pass the group to the Shrinkwrap modifier:
  sw_mod.vertex_group = "inner_contact"

This keeps the Shrinkwrap from touching the dome exterior — the dome curvature
is entirely Lattice-driven.  The only Shrinkwrap influence is a clean, flush
contact edge that sits just outside the body surface.

Gradient weights (0.0 → 1.0 across a few rows of verts above the equator) soften
the transition between snapped and free verts, which helps when the Shrinkwrap
target is highly curved.  Add those via the Vertex Weight Proximity modifier
stacked above the Lattice, or paint them manually in Weight Paint mode.`,
      },
      {
        title: "OUTSIDE wrap mode and offset: preventing Z-fighting",
        body: `wrap_mode='OUTSIDE' changes the Shrinkwrap's direction constraint:

  OUTSIDE (used here): vertices are only moved if they would land INSIDE the target
  surface.  If a vertex is already outside (further from the origin than the nearest
  surface point), it is left alone.  The result: the contact ring can only move
  outward toward the surface, never through it.

  ON_SURFACE: vertices are moved to the surface regardless of which side they
  start on.  Use this for retopology where you explicitly want verts to stick.

  INSIDE: inverse of OUTSIDE — only moves verts that are outside the surface
  inward.  Rarely used in prop fitting.

The offset parameter is in Blender's internal unit (metres by default):
  SHRINKWRAP_OFFSET = 0.008  — 8 mm gap

Why does the gap matter?
  At render time, when two surfaces occupy nearly the same z-depth, the GPU
  alternates between them per pixel — the classic 'Z-fighting' shimmer.  An 8 mm
  gap is invisible at normal shot distances but eliminates Z-fighting completely.
  For thin fabric set offset to 0.003–0.005 (3–5 mm).
  For armour or structural panels: 0.008–0.015 (8–15 mm).
  For floating holographic displays: 0.02–0.05 (2–5 cm).`,
      },
      {
        title: "Scripting the lattice arch: _arch_lattice()",
        body: `Lattice control point positions are accessed via lat.data.points, an indexed
sequence of LatticePoint objects.  Each has a .co property (Vector in local space).

Index layout for a 3×2×3 (U×V×W) lattice:
  index = w*(U*V) + v*U + u
  U=3, V=2, W=3 → 18 total points
  W=0 (bottom row): indices  0–5
  W=1 (mid row):    indices  6–11
  W=2 (top row):    indices 12–17

To identify the top row:
  w_layer = index // (LAT_U * LAT_V)   →  2 for the top row

To identify left/right columns:
  u_col = index % LAT_U                →  0 = left, 1 = centre, 2 = right

The blueprint pushes top-row CVs backward (–Y) by 6 cm to arch the dome over
the shoulder, and flares left/right CVs outward (±X) by 4 cm for a wider cap:

  if w_layer == LAT_W - 1:
      pt.co.y -= ARCH_Y
  if u_col in (0, LAT_U - 1):
      pt.co.x += math.copysign(FLARE_X, pt.co.x)

math.copysign(FLARE_X, pt.co.x) ensures the left column moves left (–X) and
the right column moves right (+X) regardless of the sign of pt.co.x — a common
trap when indexing lattice CVs programmatically.`,
      },
      {
        title: "Applying modifiers for GLB export",
        body: `The glTF/GLB format has no modifier layer concept: the exporter sees the
evaluated mesh (all modifiers applied).  Two approaches:

A. Export with export_apply=True (bpy.ops.export_scene.gltf, export_apply=True):
   The exporter applies all modifiers on the fly without modifying the .blend file.
   The Lattice and body reference stay live in the scene; re-export refits
   automatically if you adjust the lattice.  Recommended for iterative workflows.

B. Apply modifiers destructively first (blueprint approach):
   bpy.ops.object.modifier_apply(modifier="Lattice_Cage")
   bpy.ops.object.modifier_apply(modifier="Shrinkwrap_Body")
   Then export with export_apply=False.

   Order matters: apply Lattice first (bakes the dome shape into vertex positions),
   then apply Shrinkwrap (bakes the contact snap on top of those positions).
   Reversing: Shrinkwrap applied first snaps the pre-lattice mesh, then Lattice
   bakes on top — identical to the reversed modifier stack failure.

   After applying, the lattice cage and body reference can be deleted; they carry
   no geometry data.  The exported GLB is a clean, self-contained static mesh.

Draco compression (level 6) is set in the blueprint export call.  Level 6 is
the Holoflow Studio standard: sub-5 % size regression versus level 10 with
acceptable decode overhead at WebXR frame rates.`,
      },
    ],
  },
  base
);
