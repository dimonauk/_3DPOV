import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>bpy.types.CorrectiveSmoothModifier</code> is the production fix
        for vertex pinching at elbow and knee joints in VRM characters. It sits
        immediately after the <code>Armature</code> modifier in the stack,
        reads the already-deformed geometry each frame, and Laplacian-smooths
        it back toward the mesh&apos;s rest shape. The result: a clean bend arc
        at the elbow with no secondary shape keys, no corrective blend shapes,
        and no extra rig bones required. A gradient vertex-group mask restricts
        the effect to the joint zone so the stable shoulder and wrist hulls are
        completely untouched.
      </p>

      <h2>ORCO vs BIND — choosing the rest source</h2>
      <p>
        The modifier needs a reference it calls the &ldquo;rest shape&rdquo; to
        know what the undistorted mesh looked like before the armature moved it.
        Two sources are available:
      </p>
      <pre><code>{`cs.rest_source = 'ORCO'
# Uses mesh.vertices[i].co — the vertex position in object space at rest.
# No operator call needed. Correct for any rig where T-pose == mesh rest.
# Standard VRM convention: always use ORCO.

cs.rest_source = 'BIND'
# Captures a custom pose via bpy.ops.object.correctivesmooth_bind().
# Use only when your mesh was modelled in a pose OTHER than T-pose, so
# ORCO would give wrong reference positions. Requires temp_override:
with bpy.context.temp_override(object=obj, active_object=obj):
    bpy.ops.object.correctivesmooth_bind(modifier=cs.name)`}</code></pre>

      <h2>Modifier properties in detail</h2>
      <pre><code>{`cs = obj.modifiers.new("CorrectiveSmooth", 'CORRECTIVE_SMOOTH')

# ── smooth_type ───────────────────────────────────────────────────────────────
cs.smooth_type = 'LENGTH_WEIGHTED'
# Neighbour weight = 1 / edge_length. Longer edges pull harder.
# Preserves volume on organics with varying topology density.
# Use SIMPLE (uniform weight) only on perfectly uniform grids.

# ── factor and iterations ─────────────────────────────────────────────────────
cs.factor     = 0.90   # [0, 1] influence strength; 0 = modifier off, 1 = full
cs.iterations = 14     # smoothing passes; 10–16 covers most anatomical joints

# ── scale ────────────────────────────────────────────────────────────────────
cs.scale = 1.0
# World-space multiplier for the ORCO reference. If the mesh has non-applied
# scale (obj.scale != (1,1,1)), the modifier's internal distance calculations
# diverge from the actual vertex motion. Fix: apply scale or set cs.scale
# to 1 / max(obj.scale) to compensate.

# ── use_only_smooth ────────────────────────────────────────────────────────────
cs.use_only_smooth = False
# True = skip verts whose displacement from rest is below a threshold.
# Sounds efficient but creates visible seams at the vertex-group boundary
# because boundary verts are randomly skipped. Keep False for smooth topology.

# ── use_pin_boundary ──────────────────────────────────────────────────────────
cs.use_pin_boundary = False
# True = freeze open-mesh boundary rings (e.g. sleeve cuffs on a sleeve-only
# mesh). Correct for cloth edges that must not drift; wrong for a full arm tube
# where there are no meaningful boundaries to pin.`}</code></pre>

      <h2>Stack order law</h2>
      <p>
        CorrectiveSmoothModifier <strong>must</strong> appear after
        the <code>Armature</code> modifier in the modifier list. Placed before
        it, the modifier reads the un-deformed rest mesh where no pinching
        exists yet and silently does nothing. In Python the modifier list is
        ordered by insertion time and does not auto-sort:
      </p>
      <pre><code>{`# Correct order (top → bottom, insertion order matches stack order)
arm_mod = obj.modifiers.new("Armature",        'ARMATURE')
cs      = obj.modifiers.new("CorrectiveSmooth", 'CORRECTIVE_SMOOTH')

# If you need to reorder after the fact:
# obj.modifiers.move(src_index, dst_index)  — available in Blender 4.0+
idx_arm = obj.modifiers.find("Armature")
idx_cs  = obj.modifiers.find("CorrectiveSmooth")
while idx_cs < idx_arm + 1:
    obj.modifiers.move(idx_cs, idx_cs + 1)
    idx_cs += 1`}</code></pre>

      <h2>Gradient vertex-group mask</h2>
      <p>
        Restricting the modifier to a vertex group is essential.
        Without a mask the modifier would soften the entire mesh — the
        intentionally crisp cap rings at shoulder and wrist would lose their
        hard silhouette. A <em>gradient</em> mask (weight 1.0 at the elbow
        centre, 0.0 at the zone boundary) prevents a hard seam between corrected
        and uncorrected regions:
      </p>
      <pre><code>{`ELBOW_Z    = 0.0    # pivot in local Z
ELBOW_HALF = 0.30   # half-height of the zone (m)

vg_el = obj.vertex_groups.new(name="elbow_zone")

for v in me.vertices:
    z  = v.co.z
    lo = ELBOW_Z - ELBOW_HALF
    hi = ELBOW_Z + ELBOW_HALF
    if lo < z < hi:
        # 1.0 at pivot, 0.0 at boundary
        w = 1.0 - abs(z - ELBOW_Z) / ELBOW_HALF
        vg_el.add([v.index], w, 'REPLACE')

cs.vertex_group        = vg_el.name
cs.invert_vertex_group = False`}</code></pre>

      <h2>Deform weights for the armature</h2>
      <p>
        The armature&apos;s vertex groups (<code>upper_arm</code>,{" "}
        <code>lower_arm</code>) must also blend across the elbow zone or the
        armature itself will pinch the mesh before CorrectiveSmooth can fix it.
        A linear blend is sufficient for most stylised VRM arms:
      </p>
      <pre><code>{`vg_up = obj.vertex_groups.new(name="upper_arm")
vg_lo = obj.vertex_groups.new(name="lower_arm")

for v in me.vertices:
    z  = v.co.z
    lo = ELBOW_Z - ELBOW_HALF
    hi = ELBOW_Z + ELBOW_HALF

    if z >= hi:
        wu, wl = 1.0, 0.0
    elif z <= lo:
        wu, wl = 0.0, 1.0
    else:
        t = (z - lo) / (2 * ELBOW_HALF)   # 0 at lower boundary, 1 at upper
        wu, wl = t, 1.0 - t

    vg_up.add([v.index], wu, 'REPLACE')
    vg_lo.add([v.index], wl, 'REPLACE')`}</code></pre>

      <h2>Full blueprint</h2>
      <p>
        Run headless with{" "}
        <code>blender --background --python blueprint.py</code>. The script
        builds the arm tube, rigs it, adds the corrective smooth modifier,
        animates the bend (frames 1→24→48), and exports GLB at rest pose.
      </p>
      <pre><code>{`import bpy, math
from mathutils import Vector

SLUG           = "hf_corrective_smooth_arm"
ARM_RADIUS     = 0.07
ARM_HEIGHT     = 1.6
SEGS_CIRC      = 16
SEGS_LONG      = 12
ELBOW_Z        = 0.0
ELBOW_HALF     = 0.30
CS_FACTOR      = 0.90
CS_ITERATIONS  = 14
BEND_ANGLE_DEG = -100
EXPORT_GLB     = "//hf_corrective_smooth_arm.glb"

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.frame_start, scene.frame_end = 1, 48
scene.render.fps = 24

# Open cylinder via from_pydata — explicit ring count, no bmesh needed
def build_tube(radius, height, circ, segs):
    verts, faces = [], []
    for r in range(segs + 1):
        z = -height * 0.5 + height * r / segs
        for s in range(circ):
            a = math.tau * s / circ
            verts.append((math.cos(a) * radius, math.sin(a) * radius, z))
    for r in range(segs):
        for s in range(circ):
            sn = (s + 1) % circ
            faces.append((r*circ+s, r*circ+sn, (r+1)*circ+sn, (r+1)*circ+s))
    return verts, faces

me = bpy.data.meshes.new(SLUG)
me.from_pydata(*build_tube(ARM_RADIUS, ARM_HEIGHT, SEGS_CIRC, SEGS_LONG), [])
me.update()
for p in me.polygons:
    p.use_smooth = False   # faceted silhouette

obj = bpy.data.objects.new(SLUG, me)
scene.collection.objects.link(obj)

# Vertex groups
vg_up = obj.vertex_groups.new(name="upper_arm")
vg_lo = obj.vertex_groups.new(name="lower_arm")
vg_el = obj.vertex_groups.new(name="elbow_zone")

for v in me.vertices:
    z  = v.co.z
    lo = ELBOW_Z - ELBOW_HALF
    hi = ELBOW_Z + ELBOW_HALF
    if z >= hi:
        wu, wl = 1.0, 0.0
    elif z <= lo:
        wu, wl = 0.0, 1.0
    else:
        t = (z - lo) / (2 * ELBOW_HALF)
        wu, wl = t, 1.0 - t
    vg_up.add([v.index], wu, 'REPLACE')
    vg_lo.add([v.index], wl, 'REPLACE')
    if lo < z < hi:
        w = 1.0 - abs(z - ELBOW_Z) / ELBOW_HALF
        vg_el.add([v.index], w, 'REPLACE')

# 2-bone armature
arm_data = bpy.data.armatures.new("ArmRig")
rig = bpy.data.objects.new("ArmRig", arm_data)
scene.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode='EDIT')
eb = arm_data.edit_bones
b_up = eb.new("upper_arm")
b_up.head = Vector((0, 0, -ARM_HEIGHT * 0.5))
b_up.tail = Vector((0, 0, ELBOW_Z))
b_lo = eb.new("lower_arm")
b_lo.head, b_lo.tail = Vector((0,0,ELBOW_Z)), Vector((0,0,ARM_HEIGHT*0.5))
b_lo.parent, b_lo.use_connect = b_up, True
bpy.ops.object.mode_set(mode='OBJECT')

# Modifiers — insertion order IS stack order
arm_mod = obj.modifiers.new("Armature", 'ARMATURE')
arm_mod.object = rig
arm_mod.use_vertex_groups = True

cs = obj.modifiers.new("CorrectiveSmooth", 'CORRECTIVE_SMOOTH')
cs.rest_source         = 'ORCO'
cs.smooth_type         = 'LENGTH_WEIGHTED'
cs.factor              = CS_FACTOR
cs.iterations          = CS_ITERATIONS
cs.vertex_group        = vg_el.name
cs.invert_vertex_group = False
cs.use_only_smooth     = False
cs.use_pin_boundary    = False
cs.scale               = 1.0
obj.parent = rig

# Pose animation
bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode='POSE')
pb = rig.pose.bones["lower_arm"]
pb.rotation_mode = 'XYZ'
for fr, deg in [(1, 0), (24, BEND_ANGLE_DEG), (48, 0)]:
    scene.frame_set(fr)
    pb.rotation_euler = (math.radians(deg), 0, 0)
    pb.keyframe_insert("rotation_euler", frame=fr)
bpy.ops.object.mode_set(mode='OBJECT')
scene.frame_set(1)

bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath(EXPORT_GLB),
    export_format='GLB', export_apply=True,
    export_normals=True, export_yup=True,
    export_materials='EXPORT', use_selection=False,
)`}</code></pre>

      <h2>from_pydata call convention (Blender 5.1)</h2>
      <p>
        The <code>from_pydata(verts, edges, faces)</code> signature expects
        three separate positional arguments. Unpacking a two-element tuple with{" "}
        <code>*build_tube(...), []</code> passes five arguments (two from the
        unpack plus the explicit empty list) and raises a{" "}
        <code>TypeError</code>. Always pass the three lists explicitly:
      </p>
      <pre><code>{`verts, faces = build_tube(ARM_RADIUS, ARM_HEIGHT, SEGS_CIRC, SEGS_LONG)
me.from_pydata(verts, [], faces)   # edges=[] for pure face mesh`}</code></pre>

      <h2>GLB export with an armature</h2>
      <p>
        When <code>export_apply=True</code>, the GLB exporter evaluates the
        full modifier stack at the current frame before writing geometry. At
        frame&nbsp;1 (rest pose) both the <code>Armature</code> modifier and{" "}
        <code>CorrectiveSmoothModifier</code> evaluate to a no-op — the output
        is the mesh in its original shape, suitable for a static hero prop or
        a WebXR avatar base mesh.
      </p>
      <p>
        For a <em>skeletal animated</em> GLB, do not apply the modifier at
        export (<code>export_apply=False</code>). The skeleton + skin weights
        travel into the file; CorrectiveSmoothModifier has no GLB equivalent
        and must be re-implemented client-side (e.g. using a secondary corrective
        blend-shape layer in Three.js or A-Frame if needed).
      </p>
      <pre><code>{`# Static hero-prop export (modifier baked at rest):
bpy.ops.export_scene.gltf(filepath=path, export_apply=True, export_yup=True)

# Skeletal animated export (live modifier stays in Blender, not in GLB):
bpy.ops.export_scene.gltf(filepath=path, export_apply=False, export_yup=True,
                           export_skins=True, export_morph=True)`}</code></pre>

      <h2>Failure modes and fixes</h2>
      <pre><code>{`# Symptom: modifier has no visible effect
# Cause A: placed BEFORE Armature in the stack
#   Fix: reorder via obj.modifiers.move()
# Cause B: rest_source='BIND' but bind was never called
#   Fix: switch to 'ORCO' or call correctivesmooth_bind with temp_override
# Cause C: factor=0 or iterations=0
#   Fix: check constants at top of script

# Symptom: hard seam at vertex-group boundary
# Cause: use_only_smooth=True skips borderline verts unevenly
#   Fix: cs.use_only_smooth = False (default)

# Symptom: elbow over-softened, loses its crease
# Cause: iterations too high or factor at 1.0
#   Fix: reduce CS_ITERATIONS to 6–8, lower CS_FACTOR to 0.6–0.7

# Symptom: cs.scale divergence artefact (twisting at elbow)
# Cause: non-applied object scale on the mesh
#   Fix: bpy.ops.object.transform_apply(scale=True) before adding modifier`}</code></pre>

      <h2>Studio cross-references</h2>
      <ul>
        <li>
          <Link href="/tutorials/blender-tutorial-python-bpy-vertex-group-weight-assign-vrm-deform-envelope" className={lk}>
            Vertex Group Weight Assignment for VRM Deformation Envelopes
          </Link>{" "}
          — full vertex-group API: <code>foreach_set</code>, bulk assignment,
          and group normalisation before GLB export.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-bpy-context-temp-override-ops-headless-scripting" className={lk}>
            bpy.context.temp_override() — Headless Operator Context Injection
          </Link>{" "}
          — required if you choose <code>rest_source=&apos;BIND&apos;</code>{" "}
          and need to call <code>correctivesmooth_bind</code> without a UI.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-bpy-smooth-by-angle-modifier-auto-smooth-migration-normals-webxr" className={lk}>
            SMOOTH_BY_ANGLE Modifier — Auto-Smooth Migration & Normal Stacking
          </Link>{" "}
          — complement to CorrectiveSmooth: SBA controls shading-boundary splits
          while CS controls deformation geometry.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-bpy-mesh-edge-sharp-crease-seam-attribute-webxr" className={lk}>
            Mesh Edge sharp_edge / crease_edge Attribute Pipeline
          </Link>{" "}
          — the full edge-attribute pipeline that CorrectiveSmooth interacts with
          when <code>use_pin_boundary=True</code> is set on open meshes.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-bpy-shrinkwrap-modifier-surface-project-decal-conform-webxr" className={lk}>
            ShrinkwrapModifier PROJECT Mode — Surface Conform & Decal Projection
          </Link>{" "}
          — adjacent technique; Shrinkwrap conforms statically while
          CorrectiveSmooth corrects dynamically each frame.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Blender Foundation —{" "}
          <a
            href="https://docs.blender.org/api/5.1/bpy.types.CorrectiveSmoothModifier.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy.types.CorrectiveSmoothModifier API 5.1
          </a>{" "}
          (CC-BY-SA-4.0). Full property reference. Related:{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/corrective_smooth.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Corrective Smooth Modifier
          </a>
          ,{" "}
          <a
            href="https://projects.blender.org/blender/blender"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            projects.blender.org
          </a>
          .
        </li>
        <li>
          Olga Sorkine-Hornung et al. —{" "}
          <a
            href="https://libigl.github.io/tutorial/#laplacian-smoothing"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            libigl: Laplacian Smoothing
          </a>{" "}
          (MIT). The undergraduate-friendly derivation of the cotangent-weighted
          Laplacian that underpins Blender&apos;s LENGTH_WEIGHTED smooth type.
          Related:{" "}
          <a
            href="https://github.com/libigl/libigl"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            libigl on GitHub
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-python-bpy-corrective-smooth-modifier-joint-pinch-vrm-glb-webxr",
    title:
      "Python bpy.types.CorrectiveSmoothModifier — Joint Pinch Mitigation: ORCO Rest Source, Gradient VG Mask & VRM Arm GLB Export (Blender 5.1)",
    blurb:
      "CorrectiveSmoothModifier eliminates vertex pinching at elbow and knee joints without shape keys or extra rig bones. Place it after the Armature modifier, set rest_source=ORCO for standard VRM T-pose rigs, and restrict the effect to the elbow zone via a gradient vertex group. Learn the ORCO-vs-BIND decision, LENGTH_WEIGHTED vs SIMPLE smooth types, use_only_smooth seam pitfall, and GLB export strategies for static vs skeletal animated characters.",
    Body,
    createdAt: new Date("2026-07-17"),
    tags: [
      "blender",
      "python",
      "scripting",
      "corrective-smooth",
      "modifier",
      "vrm",
      "armature",
      "joint",
      "deform",
      "glb",
      "webxr",
    ],
    difficulty: "intermediate",
  }
);
