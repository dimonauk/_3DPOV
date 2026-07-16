import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>bpy.types.ArrayModifier</code> tiles a source mesh along an
        accumulating per-step transform. Three <em>additive</em> offset modes
        define what that transform is: a bounding-box fraction
        (<code>use_relative_offset</code>, the default), a fixed-metre delta
        (<code>use_constant_offset</code>), or the local matrix of a nominated
        Empty (<code>use_object_offset</code>). The object-offset mode is the
        least documented and most powerful: placing the Empty at the source
        object&apos;s world origin with only a Z rotation produces a perfect
        N-fold radial crown; adding a Z translation to that same Empty turns
        the crown into a rising helix — no curve object required.
      </p>

      <h2>Offset mode reference</h2>
      <pre><code>{`mod = obj.modifiers.new("My_Array", 'ARRAY')

# ── Fit type ─────────────────────────────────────────────────────────────────
mod.fit_type  = 'FIXED_COUNT'    # mod.count copies
mod.fit_type  = 'FIT_LENGTH'     # fill mod.fit_length metres (last may overflow)
mod.fit_type  = 'FIT_CURVE'      # fill arc-length of mod.curve object

# ── Offset types (additive — can combine all three) ───────────────────────────
mod.use_relative_offset        = True   # default ON; stride = bbox × factor
mod.relative_offset_displace   = (1.0, 0.0, 0.0)  # X-axis: one bbox-width apart

mod.use_constant_offset        = True
mod.constant_offset_displace   = (0.0, 0.0, 0.5)  # 0.5 m up per step

mod.use_object_offset          = True
mod.offset_object              = bpy.data.objects["my_empty"]

# ── Merge at junctions ────────────────────────────────────────────────────────
mod.use_merge_vertices         = True
mod.use_merge_vertices_cap     = True   # also merge start/end caps
mod.merge_threshold            = 0.001  # metres

# ── End caps ─────────────────────────────────────────────────────────────────
mod.start_cap = bpy.data.objects["cap_start"]
mod.end_cap   = bpy.data.objects["cap_end"]`}</code></pre>

      <h2>The object-offset transform formula</h2>
      <p>
        Understanding the per-step maths prevents every common mistake with
        this mode. For each copy <em>k</em>, Blender evaluates:
      </p>
      <pre><code>{`# Per-step transform applied k times to produce copy k
T_step = inv(T_src_world) @ T_empty_world

# If the Empty is AT the source object's world origin (same location):
#   T_src_world == T_empty_world for location component
#   → translation cancels out; only rotation/scale of the Empty survives.
# That is why a rotation-only Empty at the source origin gives pure radial.

# If the Empty has BOTH rotation and translation:
#   Translation is evaluated in the source object's local space.
#   A Z translation of 0.05 m in the Empty shifts each copy 0.05 m in
#   world Z — independently of how much the source has already rotated.
#   → helix: rotation compounds around Z; translation accumulates in Z.`}</code></pre>

      <h2>The critical rule: disable relative offset for radial patterns</h2>
      <pre><code>{`# WRONG — default relative_offset is still active:
mod.use_object_offset   = True
mod.offset_object       = empty   # empty has 45° Z rotation
# Result: every copy rotates 45° AND steps one bbox-width in +X.
# The ring expands outward into a spiral, not a circle.

# CORRECT:
mod.use_relative_offset = False   # ← disable explicitly
mod.use_constant_offset = False   # ← also disable if it was on
mod.use_object_offset   = True
mod.offset_object       = empty
# Result: pure rotation — perfect radial symmetry.`}</code></pre>

      <h2>Pattern A: radial crown (N-fold symmetry)</h2>
      <p>
        Position the source gem at the ring radius from the scene origin,
        then assign an Empty at <code>(0,0,0)</code> with
        Z rotation = <code>360°/N</code>. Every copy rotates one step around
        the origin.
      </p>
      <pre><code>{`import bpy, math

CROWN_N      = 8
CROWN_RING_R = 0.44   # m — gem sits this far from origin

gem = bpy.data.objects["hf_gem"]
gem.location.x = CROWN_RING_R   # position ON the ring before array

empty = bpy.data.objects.new("hf_crown_pivot", None)
bpy.context.collection.objects.link(empty)
empty.location         = (0.0, 0.0, 0.0)   # must match array object origin
empty.rotation_euler.z = math.tau / CROWN_N

mod = gem.modifiers.new("Crown_Array", 'ARRAY')
mod.fit_type            = 'FIXED_COUNT'
mod.count               = CROWN_N
mod.use_relative_offset = False   # mandatory for pure radial
mod.use_object_offset   = True
mod.offset_object       = empty`}</code></pre>

      <h2>Pattern B: helix chain (rotation + translation Empty)</h2>
      <p>
        Extend the crown pattern: set the Empty&apos;s
        <code>location.z</code> to the per-step rise. The modifier accumulates
        both transforms together — rotation spirals around Z while translation
        lifts each bead. For a closed helix loop, choose angles where
        <code>N × angle = 360°</code>.
      </p>
      <pre><code>{`HELIX_N        = 20     # 20 × 18° = 360° → one closed loop
HELIX_RING_R   = 0.30
HELIX_ROT_DEG  = 18.0
HELIX_RISE_Z   = 0.065  # m; total height = 20 × 0.065 = 1.30 m

bead = bpy.data.objects["hf_bead"]
bead.location.x = HELIX_RING_R

h_empty = bpy.data.objects.new("hf_helix_pivot", None)
bpy.context.collection.objects.link(h_empty)
h_empty.location         = (0.0, 0.0, HELIX_RISE_Z)
h_empty.rotation_euler.z = math.radians(HELIX_ROT_DEG)

mod = bead.modifiers.new("Helix_Array", 'ARRAY')
mod.fit_type            = 'FIXED_COUNT'
mod.count               = HELIX_N
mod.use_relative_offset = False
mod.use_object_offset   = True
mod.offset_object       = h_empty

# Closed loop: first and last bead share the same XY position at z=HELIX_N×RISE.
# use_merge_vertices joins them if their centres are within merge_threshold.
mod.use_merge_vertices = True
mod.merge_threshold    = 0.005`}</code></pre>

      <h2>FIT_CURVE mode — filling a bezier path</h2>
      <p>
        <code>FIT_CURVE</code> computes the curve&apos;s arc length and places
        as many copies as needed to fill it. The last instance <em>always
        overflows</em> — Blender does not clip the final copy to the remaining
        length — so build your source mesh at the exact repeat pitch you want,
        not the total length. Pair with a{" "}
        <code>CurveModifier</code> on the same object to both fill the length
        and conform to the path.
      </p>
      <pre><code>{`# Curve must exist as a bpy.types.Object with curve data
curve_ob = bpy.data.objects["hf_necklace_path"]

mod_arr          = chain.modifiers.new("Path_Array", 'ARRAY')
mod_arr.fit_type = 'FIT_CURVE'
mod_arr.curve    = curve_ob
mod_arr.use_relative_offset = True
mod_arr.relative_offset_displace = (1.0, 0.0, 0.0)  # step = 1 bbox width

# Add CurveModifier AFTER ArrayModifier in the stack so instances exist before deform
mod_cur         = chain.modifiers.new("Path_Deform", 'CURVE')
mod_cur.object  = curve_ob
mod_cur.deform_axis = 'POS_X'   # source chain extends along +X before deform

# Stack order matters: Array must appear before Curve in the modifier list.
# Move modifiers with obj.modifiers.move(src_index, dst_index) if needed.`}</code></pre>

      <h2>Merge vertices and cap objects</h2>
      <pre><code>{`# Cap objects are prepended/appended ONCE, not per-step:
mod.start_cap = bpy.data.objects["cap_clasp_start"]
mod.end_cap   = bpy.data.objects["cap_clasp_end"]

# Merge is applied between copies AND between caps and adjacent instances.
mod.use_merge_vertices     = True
mod.use_merge_vertices_cap = True    # merge cap→first and cap→last copy
mod.merge_threshold        = 0.001   # m; raise if geometry is coarse`}</code></pre>

      <h2>Evaluating the modifier stack without bpy.ops</h2>
      <p>
        <code>bpy.data.meshes.new_from_object()</code> snapshots the evaluated
        mesh without touching the modifier stack or requiring a UI context —
        the correct headless-safe approach in Blender 4.0+.
      </p>
      <pre><code>{`dg = bpy.context.evaluated_depsgraph_get()

def realise(src):
    ev   = src.evaluated_get(dg)
    # new_from_object builds a Mesh from evaluated state (Blender 4.0+)
    mesh = bpy.data.meshes.new_from_object(ev, depsgraph=dg)
    out  = bpy.data.objects.new(src.name + "_out", mesh)
    bpy.context.collection.objects.link(out)
    out.matrix_world = src.matrix_world.copy()
    return out

# bpy.ops.object.modifier_apply is NOT used here because it requires an
# active object in 3D Viewport context. new_from_object() is context-free.`}</code></pre>

      <h2>Troubleshooting</h2>
      <pre><code>{`# Problem: radial copies fan outward instead of staying on a ring.
# Cause: use_relative_offset is True (the default).
# Fix: mod.use_relative_offset = False before enabling use_object_offset.

# Problem: all copies stack on top of each other at the source location.
# Cause: Empty is not linked to the scene (objects.link() missing), so
#        mod.offset_object is silently treated as None → no offset applied.
# Fix: bpy.context.collection.objects.link(empty)

# Problem: FIT_CURVE count is 0 (no copies appear).
# Cause: curve_ob has no evaluated length (e.g. curve.data.bevel_depth=0
#        makes the curve invisible in viewport but arc length is still valid;
#        however a NURBS surface with zero spans reports length=0).
# Fix: ensure curve_ob.data is type CURVE (not SURFACE), segments > 0.

# Problem: bpy.data.meshes.new_from_object() raises AttributeError in Blender 3.x.
# Cause: new_from_object(depsgraph=) keyword was added in Blender 4.0.
# Fix: in Blender 3.x use ev.to_mesh() + mesh.copy() + ev.to_mesh_clear() instead.`}</code></pre>

      <h2>Studio cross-references</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bpy-curve-spline-bezier-motion-path-camera-rail-webxr"
            className={lk}
          >
            Bezier Spline Camera Rail (bpy.types.Curve)
          </Link>{" "}
          — authors the curve object that{" "}
          <code>FIT_CURVE</code> mode reads for arc length; the necklace-path
          pattern pairs directly with the curve-creation workflow there.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bpy-boolean-weld-modifier-union-clean-mesh-glb-webxr"
            className={lk}
          >
            BooleanModifier + WeldModifier Compound Prop
          </Link>{" "}
          — uses the same <code>new_from_object()</code> depsgraph snapshot and
          GLB export pipeline; read that tutorial before attempting headless
          modifier-apply patterns.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bmesh-ops-limited-dissolve-poke-faceted-ornament-webxr"
            className={lk}
          >
            Faceted Ornament (limited_dissolve + poke)
          </Link>{" "}
          — the crown gem built here feeds directly into that faceting pipeline;
          run limited_dissolve on the applied crown mesh to get a unified
          faceted shell suitable for WebXR.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bpy-mesh-edge-sharp-crease-seam-attribute-webxr"
            className={lk}
          >
            Sharp Edge, Crease &amp; Seam Attribute Pipeline
          </Link>{" "}
          — after applying the crown array, mark sharp edges on the gem–base
          boundary to preserve faceted silhouettes in the exported GLB.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Blender Foundation —{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/array.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Array Modifier — Blender Manual
          </a>{" "}
          (CC-BY-SA 4.0). Canonical documentation for all three fit types,
          offset modes, cap objects, and merge settings. Related:{" "}
          <a
            href="https://docs.blender.org/api/5.1/bpy.types.ArrayModifier.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy.types.ArrayModifier API reference
          </a>
          ,{" "}
          <a
            href="https://projects.blender.org/blender/blender"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender source (projects.blender.org)
          </a>
          .
        </li>
        <li>
          KhronosGroup —{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Blender-IO
          </a>{" "}
          (Apache-2.0). The exporter bundled with Blender;{" "}
          <code>export_apply=False</code> is safe here because the modifier
          stack is realised manually via{" "}
          <code>new_from_object()</code> before the export call. Related:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF specification
          </a>
          ,{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Sample-Models"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF Sample Models
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-python-bpy-array-modifier-object-offset-radial-helix-webxr",
    title:
      "Python bpy.types.ArrayModifier — Object-Offset Radial Crown & Helix Stack: FIT_CURVE, Merge Vertices & GLB Export for WebXR (Blender 5.1)",
    blurb:
      "ArrayModifier's object-offset mode is the key to radial crowns and helix chains — yet it silently fails when use_relative_offset is left on. This tutorial explains the per-step transform formula (inv(T_src) @ T_empty), shows why the rotation-only Empty must sit at the source origin, extends it to a rising helix by adding Z translation, covers FIT_CURVE for necklace-path arrays, and closes with a headless-safe new_from_object() apply + Draco GLB export.",
    Body,
    createdAt: new Date("2026-07-16"),
    tags: [
      "blender",
      "python",
      "scripting",
      "array-modifier",
      "radial",
      "helix",
      "object-offset",
      "modifier",
      "glb",
      "webxr",
    ],
    difficulty: "intermediate",
  }
);
