import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender&apos;s <code>CURVE</code> object stores geometry as parametric
        splines rather than triangulated meshes; a <code>BezierSpline</code>{" "}
        exposes <code>BezierSplinePoint</code> objects with <code>.co</code>{" "}
        (world position), <code>.handle_left</code> /{" "}
        <code>.handle_right</code> (tangent handles), and{" "}
        <code>handle_left_type</code> / <code>handle_right_type</code> (
        <code>VECTOR</code> / <code>AUTO</code> / <code>ALIGNED</code> /{" "}
        <code>FREE</code>). Mixing handle types on the same spline is how you
        combine smooth elliptical arcs (<code>AUTO</code>) with crisp
        directional pivots (<code>VECTOR</code>) in a single closed loop —
        the precise blend needed for a cinematic drone path that reads clearly
        in a viewport recording. Note that <code>sp.bezier_points.add(N)</code>{" "}
        appends N points to the <em>existing</em> one that{" "}
        <code>splines.new()</code> creates; calling <code>.add(4)</code> when
        you want 4 total will produce 5 control points and silently distort the
        path.
      </p>
      <p>
        Rail speed is controlled by animating{" "}
        <code>FOLLOW_PATH.offset_factor</code> from 0 to 1 over the desired
        frame range with <code>LINEAR</code> interpolation on that single
        fcurve, which guarantees constant velocity regardless of segment
        length. The critical production step is constraint baking: the GLB
        format carries no Blender constraint data, so{" "}
        <code>
          bpy.ops.nla.bake(visual_keying=True, clear_constraints=True)
        </code>{" "}
        samples the depsgraph-evaluated post-constraint world transform at
        every frame and writes explicit <code>location</code> /{" "}
        <code>rotation_euler</code> keyframes into a fresh action, then
        removes the <code>FOLLOW_PATH</code> and <code>TRACK_TO</code>{" "}
        constraints. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-context-temp-override-ops-headless-scripting"
          className={lk}
        >
          context override tutorial
        </Link>{" "}
        explains why <code>temp_override()</code> is required for headless
        bake calls; the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-object-constraint-stack-lookat-floor-bake-webxr"
          className={lk}
        >
          constraint stack tutorial
        </Link>{" "}
        covers the <code>TRACK_TO</code> axis conventions in detail.
      </p>
      <p>
        The resulting action exports to GLB as a standard camera animation —
        Three.js and Babylon.js consume it directly as an{" "}
        <code>AnimationClip</code> on a <code>PerspectiveCamera</code>, and
        the clip length maps cleanly to an XR session loop. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-camera-data-webxr-frustum-fov-calibration"
          className={lk}
        >
          camera data tutorial
        </Link>{" "}
        covers calibrating the sensor intrinsics to match a specific WebXR
        projection matrix once the rail is in place. Outside reference:{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.Curve.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bpy.types.Curve (Blender Foundation, CC-BY-SA-4.0)
        </a>
        ; siblings{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.Spline.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bpy.types.Spline
        </a>{" "}
        and{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.BezierSplinePoint.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bpy.types.BezierSplinePoint
        </a>
        . Follow Path manual:{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/animation/constraints/relationship/follow_path.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Manual — Follow Path (Blender Foundation, CC-BY-SA-4.0)
        </a>
        ; upstream repo:{" "}
        <a
          href="https://projects.blender.org/blender/blender"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          projects.blender.org/blender/blender
        </a>
        . NLA action library pattern:{" "}
        <Link
          href="/tutorials/blender-tutorial-python-nla-track-strip-action-library-vrm-pose-blend"
          className={lk}
        >
          NLA track tutorial
        </Link>
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
        title: "Scene reset and Bezier oval rail construction",
        body: `"""
splines.new('BEZIER') initialises the spline with exactly 1 BezierSplinePoint.
bezier_points.add(3) appends 3 more → 4 total.  Adding 4 would give 5 and
silently shift the oval.

cu.use_path = True is not set by default; it enables FOLLOW_PATH evaluation.
Without it the constraint snaps the camera to the curve origin regardless of
offset_factor.

resolution_u affects viewport display only; the actual path position is
evaluated analytically from the Bezier polynomial.
"""
import bpy, math
from mathutils import Vector

SLUG            = "python-bpy-curve-spline-bezier-motion-path-camera-rail-webxr"
CURVE_NAME      = "cam_rail"
DURATION_FRAMES = 120
RAIL_RADIUS_X   = 4.0
RAIL_RADIUS_Z   = 2.5
RAIL_HEIGHT     = 1.8

bpy.ops.wm.read_factory_settings(use_empty=True)
sc             = bpy.context.scene
sc.name        = "HoloflowCameraRail"
sc.frame_start = 1
sc.frame_end   = DURATION_FRAMES
sc.render.fps  = 30

cu              = bpy.data.curves.new(CURVE_NAME, type='CURVE')
cu.dimensions   = '3D'
cu.resolution_u = 12
cu.use_path     = True        # required for FOLLOW_PATH to locate along curve

sp              = cu.splines.new('BEZIER')  # 1 point already exists
sp.use_cyclic_u = True                      # closed loop
sp.bezier_points.add(3)                     # total = 4

rail_ob = bpy.data.objects.new(CURVE_NAME, cu)
sc.collection.objects.link(rail_ob)
print(f"[{SLUG}] curve created — {len(sp.bezier_points)} bezier points")`,
      },
      {
        title: "Set control point positions and handle types",
        body: `"""
Oval in XZ plane at constant Y=RAIL_HEIGHT.
Four cardinal positions: front (+Z), right (+X), back (-Z), left (-X).

handle_left_type must be assigned BEFORE writing handle_left / handle_right
positions.  Setting type after position causes Blender to recalculate and
overwrite the positions you just set.

AUTO:   Blender calculates tangent direction and magnitude automatically.
        Produces a smooth, even arc.  Best for top/bottom of the oval.

VECTOR: Blender sets direction from the adjacent control point, magnitude
        one-third of the segment length by default — but we override the
        position explicitly here so the tangent is exactly ±Z (axis-aligned),
        producing a crisp lateral pivot rather than a curve-derived tangent.
"""
oval_pts = [
    (Vector(( 0,              RAIL_HEIGHT,  RAIL_RADIUS_Z)), 'AUTO'),   # front
    (Vector(( RAIL_RADIUS_X,  RAIL_HEIGHT,  0            )), 'VECTOR'), # right
    (Vector(( 0,              RAIL_HEIGHT, -RAIL_RADIUS_Z)), 'AUTO'),   # back
    (Vector((-RAIL_RADIUS_X,  RAIL_HEIGHT,  0            )), 'VECTOR'), # left
]

for i, (co, htype) in enumerate(oval_pts):
    bp                   = sp.bezier_points[i]
    bp.co                = co
    bp.handle_left_type  = htype   # set type first
    bp.handle_right_type = htype
    if htype == 'VECTOR':
        offset = Vector((0, 0, RAIL_RADIUS_Z * 0.36))
        if co.x > 0:               # right cardinal → tangent runs -Z → +Z
            bp.handle_left  = co + offset
            bp.handle_right = co - offset
        else:                       # left cardinal → reversed
            bp.handle_left  = co - offset
            bp.handle_right = co + offset

print(f"[{SLUG}] control points set")`,
      },
      {
        title: "Create camera, add FOLLOW_PATH + TRACK_TO, animate offset_factor",
        body: `"""
FOLLOW_PATH constraint:
  use_fixed_location=True  → use offset_factor ∈ [0,1] for progress
                              (False uses an integer frame offset instead)
  use_curve_follow=True    → align forward_axis to the curve tangent
  forward_axis='FORWARD_Y' → camera +Y points along the path direction
  up_axis='UP_Z'           → camera Z stays world-up

TRACK_TO constraint:
  track_axis='TRACK_NEGATIVE_Z' → camera optical axis is its local -Z
  up_axis='UP_Y'                → keep camera Y world-up

Keyframe data_path uses the constraint .name property in square brackets.
The name is set automatically from the constraint type; verify with
cam_ob.constraints["Follow Path"].name before inserting if renamed.

LINEAR interpolation on the offset_factor fcurve → constant speed.
Default BEZIER would ease in and out at the keyframe endpoints.
"""
CAMERA_NAME = "cam_fly"
TARGET_NAME = "look_target"

bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
target_ob      = bpy.context.active_object
target_ob.name = TARGET_NAME

cam_data           = bpy.data.cameras.new(CAMERA_NAME)
cam_data.lens_unit = 'FOV'
cam_data.angle     = math.radians(60.0)
cam_ob             = bpy.data.objects.new(CAMERA_NAME, cam_data)
sc.collection.objects.link(cam_ob)
sc.camera = cam_ob

fp                    = cam_ob.constraints.new('FOLLOW_PATH')
fp.target             = rail_ob
fp.use_fixed_location = True
fp.use_curve_follow   = True
fp.forward_axis       = 'FORWARD_Y'
fp.up_axis            = 'UP_Z'

tt             = cam_ob.constraints.new('TRACK_TO')
tt.target      = target_ob
tt.track_axis  = 'TRACK_NEGATIVE_Z'
tt.up_axis     = 'UP_Y'

cam_ob.constraints["Follow Path"].offset_factor = 0.0
cam_ob.keyframe_insert(
    data_path='constraints["Follow Path"].offset_factor', frame=1
)
cam_ob.constraints["Follow Path"].offset_factor = 1.0
cam_ob.keyframe_insert(
    data_path='constraints["Follow Path"].offset_factor',
    frame=DURATION_FRAMES,
)

for fc in cam_ob.animation_data.action.fcurves:
    if 'offset_factor' in fc.data_path:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'

print(f"[{SLUG}] constraints added, offset_factor animated")`,
      },
      {
        title: "Bake constraints to loc/rot keyframes and export GLB",
        body: `"""
nla.bake() with visual_keying=True reads the depsgraph-evaluated
(post-constraint) world matrix at every frame and inserts explicit
location + rotation_euler keyframes.  clear_constraints=True removes
FOLLOW_PATH and TRACK_TO afterwards.

use_current_action=False creates a fresh action containing only loc/rot
fcurves.  The previous action (with offset_factor keys) is orphaned but
harmless; it does not survive GLB export.

export_cameras=True includes the camera node in the GLB scene graph.
export_animation_mode='ACTIONS' exports every named Action attached to any
object in the selection, so the 120-frame baked action is included.

After bake the GLB can be loaded in Three.js and the camera animation
played back via AnimationMixer — no Blender-specific constraint runtime needed.
"""
PROP_NAME   = "scene_prop"
EXPORT_PATH = "//holoflow_cam_rail.glb"
BLEND_PATH  = "//holoflow_cam_rail.blend"

bpy.ops.mesh.primitive_torus_add(major_radius=1.2, minor_radius=0.18,
                                 location=(0, 0, 0))
prop_ob = bpy.context.active_object
prop_ob.name = PROP_NAME
mat = bpy.data.materials.new("holoflow_rail_mat")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0.04, 0.18, 0.72, 1.0)
bsdf.inputs["Metallic"].default_value   = 0.90
bsdf.inputs["Roughness"].default_value  = 0.08
prop_ob.data.materials.append(mat)

sc.view_layer.objects.active = cam_ob
cam_ob.select_set(True)

with bpy.context.temp_override(
    scene=sc,
    view_layer=sc.view_layer,
    active_object=cam_ob,
    selected_objects=[cam_ob],
    selected_editable_objects=[cam_ob],
):
    bpy.ops.nla.bake(
        frame_start=sc.frame_start,
        frame_end=sc.frame_end,
        step=1,
        only_selected=True,
        visual_keying=True,
        clear_constraints=True,    # FOLLOW_PATH + TRACK_TO removed after bake
        clear_parents=False,
        use_current_action=False,
        bake_types={'OBJECT'},
    )

for o in sc.collection.objects:
    o.select_set(o.name in {CAMERA_NAME, PROP_NAME})
sc.view_layer.objects.active = prop_ob

bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath(EXPORT_PATH),
    export_format='GLB',
    use_selection=True,
    export_cameras=True,
    export_animations=True,
    export_animation_mode='ACTIONS',
    export_apply=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format='WEBP',
    export_yup=True,
)
bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(BLEND_PATH))
print(f"[{SLUG}] done — GLB → {EXPORT_PATH}")`,
      },
    ],
  },
  {
    slug: "blender-tutorial-python-bpy-curve-spline-bezier-motion-path-camera-rail-webxr",
    title:
      "Python bpy.types.Curve + BezierSpline — Motion-Path Camera Rail, Constraint Bake & Cinematic Fly-Through GLB for WebXR (Blender 5.1)",
    description:
      "Script an oval Bezier camera rail in Blender 5.1 Python: build a CURVE data block, set BezierSplinePoint positions and handle types, animate FOLLOW_PATH + TRACK_TO constraints, bake to explicit loc/rot keyframes, and export a camera-animation GLB for WebXR.",
    topic: "scripting",
    tags: [
      "blender",
      "python",
      "curve",
      "bezier",
      "spline",
      "bpy",
      "camera",
      "follow-path",
      "constraint",
      "animation",
      "webxr",
      "glb",
      "scripting",
    ],
    date: "2026-07-12",
    body: <Body />,
  }
);
