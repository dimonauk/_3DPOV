import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>bpy.types.HookModifier</code> is the lightest-weight deformation
        tool in Blender&rsquo;s modifier stack. It binds a named vertex group
        to an Empty (or any object) so that the object&rsquo;s world transform
        directly displaces those vertices. No armature, no shape keys, no
        Geometry Nodes tree — just a <em>pivot–weight–falloff</em> triple
        evaluated per frame by the depsgraph. The result exports as a
        per-frame GLB animation with zero rig overhead in the viewer.
      </p>
      <p>
        This tutorial builds a faceted pentagon drop-earring (12 verts, gold
        PBR) with two hooks. The upper ring (5 verts) follows a tight pivot,
        the spike tip trails with wider amplitude — producing classic pendulum
        physics in 72 frames of keyframed SINE interpolation.
      </p>

      <h2>The headless bind gotcha: matrix_inverse</h2>
      <p>
        In the UI, the operator <code>object.hook_add_selob</code> writes{" "}
        <code>mod.matrix_inverse</code> automatically. In a background script
        the operator is unavailable, so you must set it yourself:
      </p>
      <pre><code>{`bpy.context.view_layer.update()           # flush matrix_world on new objects
mod.matrix_inverse = empty.matrix_world.inverted()`}</code></pre>
      <p>
        Without that line, Blender treats the modifier as if the Empty was at
        world origin at bind time. Frame 0 shows phantom deformation even when
        the Empty has not moved. The <code>view_layer.update()</code> call is
        also essential: newly linked objects have a stale{" "}
        <code>matrix_world</code> until the depsgraph evaluates them. The
        analogous flush pattern applies to depsgraph reads — see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-depsgraph-object-instances-gn-scatter-webxr-export"
          className={lk}
        >
          depsgraph instance export tutorial
        </Link>{" "}
        for the full evaluation pipeline.
      </p>

      <h2>center: object-local pivot</h2>
      <pre><code>{`local_inv   = ob.matrix_world.inverted()
mod.center  = local_inv @ empty.matrix_world.translation`}</code></pre>
      <p>
        <code>mod.center</code> is the falloff pivot in{" "}
        <strong>object-local space</strong>, not world space. If your object
        has a non-identity transform you must convert the Empty&rsquo;s world
        position into the object&rsquo;s local frame. Forgetting this shifts
        the falloff sphere when the earring object is not at origin.
      </p>

      <h2>force, falloff_type, and use_falloff_uniform</h2>
      <pre><code>{`mod.force          = 0.90    # weighting scalar — NOT .strength (no such attr)
mod.falloff_type   = "SPHERE"     # SPHERE | LINEAR | CONSTANT | SMOOTH
mod.falloff_radius = 0.22         # sphere radius in world units
mod.use_falloff_uniform = True    # compensates non-uniform ob scale`}</code></pre>
      <p>
        <code>mod.force</code> (0.0–1.0) scales how strongly the modifier
        pulls affected vertices toward the Empty. It is a simple linear
        coefficient — not a per-vertex weight. The per-vertex contribution is
        the product of the vertex-group weight and <code>force</code>.{" "}
        <code>SPHERE</code> falloff is quadratic; <code>SMOOTH</code> is a
        Hermite C² curve that gives a natural soft edge without the sharp
        inflection of <code>LINEAR</code>.
      </p>
      <p>
        Two hooks on the same mesh sum their vertex deltas{" "}
        <em>additively from the original vertex position</em>. They do not
        chain — each hook displaces from the undeformed mesh position, and the
        results add. This means overlapping vertex groups produce additive
        deformation, not sequential. For VRM accessories where multiple hooks
        must compose cleanly, keep vertex groups disjoint or accept the
        additive behaviour by design. See the vertex-group weight assignment
        pipeline in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-vertex-group-weight-assign-vrm-deform-envelope"
          className={lk}
        >
          vertex-group weight-assign tutorial
        </Link>
        .
      </p>

      <h2>Pendulum animation with F-Curve modifiers</h2>
      <pre><code>{`fc = action.fcurves.new("location", index=0)
kp = fc.keyframe_points.insert(frame, value)
kp.interpolation = "SINE"
kp.easing        = "EASE_IN_OUT"

cyc = fc.modifiers.new("CYCLES")
cyc.mode_before = "REPEAT_OFFSET"
cyc.mode_after  = "REPEAT_OFFSET"`}</code></pre>
      <p>
        The <code>SINE</code> + <code>EASE_IN_OUT</code> combination produces
        the characteristic swing deceleration at the apex. Adding a{" "}
        <code>CYCLES</code> F-Curve modifier with <code>REPEAT_OFFSET</code>{" "}
        loops the animation indefinitely — the viewer sees a continuous
        pendulum. The lower pivot&rsquo;s X values are phase-inverted so the
        spike trails the upper ring: when the upper ring swings right the
        spike swings left. For organic noise on top of this base motion, layer
        a <code>NOISE</code> modifier as shown in the{" "}
        <Link
          href="/tutorials/blender-tutorial-animation-fcurve-modifiers-noise-cycles-stepped"
          className={lk}
        >
          F-Curve modifiers tutorial
        </Link>
        .
      </p>

      <h2>GLB export: keep the modifier live</h2>
      <pre><code>{`bpy.ops.export_scene.gltf(
    filepath=path,
    export_format="GLB",
    export_apply=False,         # do NOT apply — let depsgraph bake per-frame
    export_animations=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format="WEBP",
)`}</code></pre>
      <p>
        <code>export_apply=False</code> is intentional: the glTF exporter
        evaluates the depsgraph at each animation frame, sampling the
        deformed mesh position from the evaluated copy. Setting{" "}
        <code>export_apply=True</code> would bake a single rest-pose mesh and
        discard the hook animation entirely. The modifier stays &ldquo;live&rdquo;
        in the .blend and is correctly baked to morph targets or vertex
        animation at export time. For the full batch-export pattern that writes
        one GLB per object, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-asset-metadata-mark-tag-batch-glb-webxr"
          className={lk}
        >
          asset metadata batch-export tutorial
        </Link>
        .
      </p>

      <h2>Sources</h2>
      <p>
        Blender Manual — Hook Modifier (CC-BY-SA 4.0, Blender Foundation):{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/hooks.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          docs.blender.org / Hook Modifier
        </a>
        . bpy.types.HookModifier API reference (CC-BY-SA 4.0, Blender
        Foundation):{" "}
        <a
          href="https://docs.blender.org/api/current/bpy.types.HookModifier.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          docs.blender.org / bpy.types.HookModifier
        </a>
        .
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    time: "one session",
    difficulty: "intermediate",
    cost: "free",
    supplies: {
      tools: [
        { name: "Blender 5.1", url: "https://www.blender.org/download/" },
      ],
    },
    code: [
      {
        filename: "blueprint.py",
        language: "python",
        content: `import math, bpy, bmesh
from mathutils import Vector

SLUG = "hf_hook_earring"
FPS, DURATION = 24, 72
R1, R2 = 0.18, 0.10
Z0, Z1, Z2, Z3 = 0.0, -0.30, -0.65, -1.10
SWING_UPPER, SWING_LOWER = 0.08, 0.22

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.render.fps = FPS
    bpy.context.scene.frame_end  = DURATION

def _ring(r, z, n=5):
    return [(r*math.cos(2*math.pi*i/n), r*math.sin(2*math.pi*i/n), z)
            for i in range(n)]

def build_earring_mesh():
    verts = [(0,0,Z0)] + _ring(R1,Z1) + _ring(R2,Z2) + [(0,0,Z3)]
    faces = []
    for i in range(5): faces.append((0, 1+i, 1+(i+1)%5))
    for i in range(5):
        a,b = 1+i, 1+(i+1)%5
        c,d = 6+(i+1)%5, 6+i
        faces.append((a,b,c,d))
    for i in range(5): faces.append((6+i, 6+(i+1)%5, 11))
    me = bpy.data.meshes.new(SLUG)
    me.from_pydata(verts, [], faces)
    bm = bmesh.new(); bm.from_mesh(me)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me); bm.free(); me.update()
    ob = bpy.data.objects.new(SLUG, me)
    bpy.context.collection.objects.link(ob)
    return ob

def assign_groups(ob):
    g = ob.vertex_groups.new(name="hk_upper"); g.add(list(range(1,6)),1.0,"REPLACE")
    g = ob.vertex_groups.new(name="hk_lower"); g.add([11],1.0,"REPLACE")

def _make_empty(name, loc):
    e = bpy.data.objects.new(name, None)
    e.empty_display_type = "ARROWS"; e.empty_display_size = 0.04
    e.location = loc; bpy.context.collection.objects.link(e)
    return e

def bind_hook(ob, empty, group, radius, force=0.90):
    bpy.context.view_layer.update()          # flush matrix_world
    mod = ob.modifiers.new(f"HK_{group}", "HOOK")
    mod.object = empty; mod.vertex_group = group
    mod.falloff_type = "SPHERE"; mod.falloff_radius = radius
    mod.use_falloff_uniform = True; mod.force = force
    li = ob.matrix_world.inverted()
    mod.center = li @ Vector(empty.matrix_world.translation)
    mod.matrix_inverse = empty.matrix_world.inverted()  # critical

def _keyed_x(ob, frames, values):
    ob.animation_data_create()
    act = bpy.data.actions.new(ob.name + "_Action")
    ob.animation_data.action = act
    fc = act.fcurves.new("location", index=0)
    for f,v in zip(frames, values):
        kp = fc.keyframe_points.insert(f,v)
        kp.interpolation = "SINE"; kp.easing = "EASE_IN_OUT"
    cyc = fc.modifiers.new("CYCLES")
    cyc.mode_before = cyc.mode_after = "REPEAT_OFFSET"

def animate(eu, el):
    q = DURATION // 4
    _keyed_x(eu, [1,1+q,1+2*q], [-SWING_UPPER, SWING_UPPER, -SWING_UPPER])
    _keyed_x(el, [1,1+q,1+2*q], [ SWING_LOWER,-SWING_LOWER,  SWING_LOWER])

def main():
    reset_scene()
    ob = build_earring_mesh(); assign_groups(ob)
    mat = bpy.data.materials.new("Mat_Earring"); mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (0.88,0.72,0.30,1.0)
        bsdf.inputs["Metallic"].default_value   = 1.0
        bsdf.inputs["Roughness"].default_value  = 0.15
    ob.data.materials.append(mat)
    eu = _make_empty("hk_upper_pivot",(0,0,Z1))
    el = _make_empty("hk_lower_pivot",(0,0,Z3))
    bind_hook(ob, eu, "hk_upper", 0.22); bind_hook(ob, el, "hk_lower", 0.14)
    animate(eu, el)
    bpy.ops.wm.save_as_mainfile(filepath=f"//{SLUG}.blend")
    bpy.ops.export_scene.gltf(
        filepath=f"//{SLUG}.glb", export_format="GLB",
        export_apply=False, export_animations=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6, export_image_format="WEBP",
    )

main()`,
      },
    ],
  },
  {
    slug: "blender-tutorial-python-bpy-hook-modifier-vertex-bind-empty-deform-vrm-webxr",
    title:
      "Python bpy.types.HookModifier — Vertex-Group Bind to Empty: Headless matrix_inverse, Falloff, Force & Pendulum Animation for WebXR (Blender 5.1)",
    blurb:
      "bpy.types.HookModifier binds a named vertex group to an Empty so its world transform deforms those vertices each frame — no armature, no shape keys. The critical headless trap is matrix_inverse: without setting it to empty.matrix_world.inverted() after view_layer.update(), frame-0 shows phantom deformation even at rest. This tutorial builds a faceted pentagon drop-earring with two hooks, SINE pendulum animation, and a live-modifier GLB export.",
    Body,
    createdAt: new Date("2026-07-16"),
    tags: [
      "blender",
      "python",
      "scripting",
      "hook-modifier",
      "vertex-group",
      "animation",
      "deformation",
      "webxr",
      "vrm",
      "glb",
    ],
    difficulty: "intermediate",
  }
);
