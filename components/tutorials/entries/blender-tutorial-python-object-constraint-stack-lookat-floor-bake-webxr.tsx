import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender&apos;s constraint system is a <em>procedural relationship layer</em>{" "}
        on top of keyframe data. A <code>TRACK_TO</code> constraint computes rotation at
        depsgraph evaluation time — not at keyframe-write time — so repositioning the
        target updates every frame automatically. The catch: GLB export expects plain
        keyframes, not live constraints. The bridge is a <strong>manual bake</strong>:
        step each frame, read the post-constraint <code>matrix_world</code> from{" "}
        <code>obj.evaluated_get(depsgraph)</code>, decompose it, write the values back
        onto the source object, insert keyframes, then call{" "}
        <code>obj.constraints.clear()</code>. This runs from the Script Editor or
        headlessly — unlike <code>bpy.ops.nla.bake()</code>, which polls for a VIEW_3D
        context. The same idiom applies to armature bones (see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-posebone-matrix-world-space-ik-bake-vrm"
          className={lk}
        >
          PoseBone IK bake tutorial
        </Link>
        ); the FCurve data API used for the target path is detailed in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-fcurve-keyframe-insert-procedural-animation-turntable"
          className={lk}
        >
          FCurve keyframe authoring tutorial
        </Link>
        .
      </p>
      <p>
        <strong>Constraint stack order</strong> — constraints evaluate in list order
        (index 0 first). TRACK_TO at index 0 orients the sphere; FLOOR at index 1
        then lifts it above the ground. Reversing the order causes FLOOR to reposition
        the sphere before the rotation has been applied for that frame, producing
        single-frame penetration artefacts. The baked action can be pushed into the NLA
        for multi-clip VRM export (see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-nla-track-strip-action-library-vrm-pose-blend"
          className={lk}
        >
          NLA track and strip tutorial
        </Link>
        ) and combined with the collection batch-export pattern in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-collection-link-visibility-override-batch-glb-webxr"
          className={lk}
        >
          collection batch GLB tutorial
        </Link>
        . Outside sources: Blender Foundation{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.Constraint.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bpy.types.Constraint API
        </a>{" "}
        (CC-BY-SA 4.0); Nikolai Janakiev&apos;s{" "}
        <a
          href="https://github.com/njanakiev/blender-scripting"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          blender-scripting (MIT)
        </a>
        , sibling repos at{" "}
        <a
          href="https://github.com/njanakiev"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/njanakiev
        </a>
        .
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    supplies: { materials: [], tools: [] },
    steps: [
      {
        title: "Build scene: ground, head sphere, target Empty",
        body: `import bpy, bmesh, math
SPHERE_R = 0.4; GROUND_HALF = 3.0
HEAD_NAME = "hf_head"; GROUND_NAME = "hf_ground"; TARGET_NAME = "hf_target"

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.frame_start, scene.frame_end, scene.render.fps = 1, 60, 24

# Ground plane
mesh_g = bpy.data.meshes.new(GROUND_NAME)
obj_g  = bpy.data.objects.new(GROUND_NAME, mesh_g)
scene.collection.objects.link(obj_g)
bm = bmesh.new()
bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=GROUND_HALF)
bm.to_mesh(mesh_g); bm.free()

# Head sphere — origin at centre, resting height = radius
mesh_h = bpy.data.meshes.new(HEAD_NAME)
obj_h  = bpy.data.objects.new(HEAD_NAME, mesh_h)
scene.collection.objects.link(obj_h)
bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=8, radius=SPHERE_R)
for f in bm.faces: f.smooth = True
bm.to_mesh(mesh_h); bm.free()
obj_h.location = (0, 0, SPHERE_R)

# Target Empty — bpy.data.objects.new(name, None) → no mesh data, pure Empty
obj_t = bpy.data.objects.new(TARGET_NAME, None)
obj_t.empty_display_type = 'ARROWS'; obj_t.empty_display_size = 0.2
scene.collection.objects.link(obj_t)
print("[holoflow] Scene objects created.")`,
      },
      {
        title: "Drive the target on a circular path via FCurves",
        body: `"""
Parametric circle built with action.fcurves.new() — no operator context.
LINEAR interpolation on 60 densely-sampled points produces a smooth arc
without BEZIER overshoot at tangent handles.
"""
import bpy, math
TARGET_RADIUS = 1.6; TARGET_HEIGHT = 0.5; FRAME_START = 1; FRAME_END = 60
obj_t = bpy.data.objects["hf_target"]
obj_t.animation_data_create()
action = bpy.data.actions.new("TargetCircle")
obj_t.animation_data.action = action

for axis_idx, trig_fn in enumerate([math.cos, math.sin]):
    fc = action.fcurves.new(data_path='location', index=axis_idx)
    fc.keyframe_points.add(count=FRAME_END - FRAME_START + 1)
    for i, frame in enumerate(range(FRAME_START, FRAME_END + 1)):
        t     = (frame - FRAME_START) / (FRAME_END - FRAME_START)
        kp    = fc.keyframe_points[i]
        kp.co = (float(frame), TARGET_RADIUS * trig_fn(t * 2 * math.pi))
        kp.interpolation = 'LINEAR'
    fc.update()

fc_z = action.fcurves.new(data_path='location', index=2)
fc_z.keyframe_points.add(count=2)
fc_z.keyframe_points[0].co = (float(FRAME_START), TARGET_HEIGHT)
fc_z.keyframe_points[1].co = (float(FRAME_END),   TARGET_HEIGHT)
for kp in fc_z.keyframe_points: kp.interpolation = 'LINEAR'
fc_z.update()
print("[holoflow] Target FCurves written.")`,
      },
      {
        title: "Add TRACK_TO + FLOOR constraints (order matters)",
        body: `"""
constraints.new(type) appends to the list — call order = evaluation order.

TRACK_TO track_axis='TRACK_NEGATIVE_Z': Blender cameras/eyes use local -Z as
their forward direction; Three.js Object3D.lookAt() maps to the same axis
after GLB export_yup=True.  Mismatch here causes 180° flips in WebXR.

FLOOR floor_location='FLOOR_Z': pushes the sphere up so its local minimum Z
(= sphere bottom) rests on the target surface.
Offset=0 for flush contact; positive offset for a gap (shoe soles, hover).

STACK ORDER: TRACK_TO (index 0) runs before FLOOR (index 1).
If reversed, FLOOR repositions the sphere before the rotation is resolved →
single-frame Z-penetration on large rotation deltas.
"""
import bpy
obj_h = bpy.data.objects["hf_head"]
obj_g = bpy.data.objects["hf_ground"]
obj_t = bpy.data.objects["hf_target"]

ct = obj_h.constraints.new('TRACK_TO')
ct.name = "LookAt_Target"; ct.target = obj_t
ct.track_axis = 'TRACK_NEGATIVE_Z'; ct.up_axis = 'UP_Y'

cf = obj_h.constraints.new('FLOOR')
cf.name = "FloorContact"; cf.target = obj_g
cf.floor_location = 'FLOOR_Z'; cf.offset = 0.0

print(f"[holoflow] Stack: {[c.name for c in obj_h.constraints]}")`,
      },
      {
        title: "Manual bake: evaluated_get(depsgraph) → keyframe_insert",
        body: `"""
WHY manual instead of bpy.ops.nla.bake()?
nla.bake polls for context.space_data.type == 'VIEW_3D' — unavailable headlessly.

Manual pattern (context-free):
  scene.frame_set(n)          advance timeline
  view_layer.update()         force full depsgraph re-evaluation
  evaluated_depsgraph_get()   get current evaluated state
  obj.evaluated_get(depsgraph) evaluated COPY — post-constraint, read-only
  obj_eval.matrix_world.decompose() → (loc, rot, scale)
  write loc/rot to SOURCE obj → keyframe_insert

constraints.clear() after the loop: keyframes are now self-contained.
"""
import bpy
obj_h = bpy.data.objects["hf_head"]
obj_h.animation_data_create()
bake_action = bpy.data.actions.new("hf_head_baked")
obj_h.animation_data.action = bake_action
obj_h.rotation_mode = 'QUATERNION'

for frame in range(1, 61):
    bpy.context.scene.frame_set(frame)
    bpy.context.view_layer.update()
    depsgraph = bpy.context.evaluated_depsgraph_get()
    obj_eval  = obj_h.evaluated_get(depsgraph)
    loc, rot, _ = obj_eval.matrix_world.decompose()
    obj_h.location = loc; obj_h.rotation_quaternion = rot
    obj_h.keyframe_insert('location',            frame=frame)
    obj_h.keyframe_insert('rotation_quaternion', frame=frame)

obj_h.constraints.clear()
print(f"[holoflow] Baked. Constraints remaining: {len(obj_h.constraints)}")`,
      },
      {
        title: "Export GLB; replay in Three.js",
        body: `"""
export_bake_animation=False is critical — True would re-bake the already-baked
keyframes, applying a second interpolation pass that over-smooths sharp corrections.
"""
import bpy
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(
    filepath     = bpy.path.abspath("//constraint_baked.glb"),
    use_selection = True,
    export_format = 'GLB',
    export_yup   = True,
    export_apply = False,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format   = 'WEBP',
    export_animations     = True,
    export_bake_animation = False,
)
print("[holoflow] constraint_baked.glb exported.")
# Three.js replay:
# const mixer = new THREE.AnimationMixer(gltf.scene)
# gltf.animations.forEach(clip => mixer.clipAction(clip).play())
# // render loop: mixer.update(delta)`,
      },
    ],
  },
  {
    slug: "blender-tutorial-python-object-constraint-stack-lookat-floor-bake-webxr",
    title:
      "Python bpy.types.ObjectConstraint — TRACK_TO Look-At, FLOOR Contact & Manual Bake for WebXR (Blender 5.1)",
    date: "2026-07-10",
    kind: "tutorial",
    excerpt:
      "Script Blender 5.1's constraint system via Python: allocate TRACK_TO and FLOOR with constraints.new(), build a circular target path via the FCurve data API, then bake constraint effects context-free — evaluated_get(depsgraph) → matrix_world.decompose() → keyframe_insert — before clearing constraints and exporting a clean GLB for Three.js AnimationMixer replay in WebXR.",
    Body,
  }
);
