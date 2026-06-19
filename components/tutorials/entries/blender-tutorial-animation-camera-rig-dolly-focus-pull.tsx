import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function AnimationCameraRigDollyFocusPullBody() {
  return (
    <>
      <p>
        A cinematic camera shot has two independent dimensions: <em>where</em>{" "}
        the camera moves and <em>what</em> it focuses on. Blender&apos;s
        constraint system handles the first with a single animatable float —{" "}
        <code>offset_factor</code> on a Follow Path constraint — and the second
        with keyframed <code>dof.focus_distance</code> on the camera data
        block. Keep them separate and you can re-shape the dolly arc without
        touching the focus pull, or change the focus timing without re-drawing
        the path. That independence is why this rig stays editable long after
        the first render.
      </p>
      <p className="mt-3">
        The rig here delivers a 120-frame shot: an 85 mm lens dollies along a
        150° Bezier arc around a standing stone, always looking at a target
        empty at scene origin. At frame 80 the camera rests and the focus
        distance transitions from 4.5 m (subject sharp) to 2.0 m — pulling
        focus to a foreground crystal that was blurred throughout the dolly.
        The focus pull uses SINE EASE_IN_OUT so the optics shift feels like a
        lens breathing, not a linear interpolation of a float.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Why a Bezier arc rather than a Bezier Circle
      </h2>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-animation-constraints-follow-path-track-to"
          className={lk}
        >
          orbital camera tutorial
        </Link>{" "}
        uses a Bezier Circle for a closed 360° orbit. A three-point open arc is
        better for a linear dolly: you define a start mark, a midpoint that
        pulls the path around the subject, and an end mark. The camera travels
        A → B without looping. Changing the apex handle position reshapes the
        swing without altering the start or end position.
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`# Build a 3-point Bezier arc via the data API (no ops, no context dependency)
cdata = bpy.data.curves.new("DollyArc", 'CURVE')
cdata.dimensions    = '3D'
cdata.use_path      = True           # arc-length parameterisation — mandatory
cdata.path_duration = 80             # maps offset_factor 1.0 to frame 80

spline = cdata.splines.new('BEZIER')
spline.bezier_points.add(2)          # default 1 point → add 2 → 3 total

control_pts = [
    (-4.0, -3.0, 2.0),  # start mark
    ( 0.0,  6.5, 1.8),  # apex: sweeps in front of subject
    ( 4.0, -3.0, 2.0),  # end mark (rack-focus position)
]
for bp, co in zip(spline.bezier_points, control_pts):
    bp.co                = mathutils.Vector(co)
    bp.handle_left_type  = 'AUTO'    # smooth tangents, no manual handle work
    bp.handle_right_type = 'AUTO'`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        use_path and arc-length parameterisation
      </h2>
      <p>
        Without <code>use_path = True</code> Blender uses the geometric
        t-parameter of the spline, which assigns equal parameter space to each
        segment regardless of its length. On an uneven arc the camera
        accelerates through tight bends and crawls on straight stretches —
        immediately visible as uneven motion. Arc-length parameterisation
        re-maps the 0→1 range so equal parameter steps correspond to equal
        distances. Set <code>path_duration</code> to the number of frames the
        dolly spans and the mapping is frame-accurate.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Constraint stacking: Follow Path then Track To
      </h2>
      <p>
        Blender evaluates object constraints top-to-bottom, accumulating
        transforms. Follow Path writes position <em>and</em> an initial
        rotation based on the curve tangent. Track To then discards that
        rotation entirely and computes a fresh one from the target direction.
        The order must be Follow Path first, Track To second. Setting{" "}
        <code>use_curve_follow = False</code> on Follow Path is also important:
        it tells Blender not to rotate the camera to follow the curve tangent,
        avoiding a conflict that would show up as subtle frame-by-frame
        jitter.
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`fp = cam_obj.constraints.new('FOLLOW_PATH')
fp.target            = path_obj
fp.use_fixed_location = False
fp.use_curve_follow  = False      # Track To owns rotation — don't fight it
fp.forward_axis      = 'FORWARD_Y'
fp.up_axis           = 'UP_Z'

tt = cam_obj.constraints.new('TRACK_TO')
tt.target     = target_obj
tt.track_axis = 'TRACK_NEGATIVE_Z'  # camera lens looks along -Z
tt.up_axis    = 'UP_Y'              # keep horizon level`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Animating offset_factor with SINE easing
      </h2>
      <p>
        <code>offset_factor</code> lives on the constraint, not the object, so
        it must be keyed via{" "}
        <code>fp.keyframe_insert(data_path=&apos;offset_factor&apos;)</code>.
        Attempting to key it through the object&apos;s own{" "}
        <code>keyframe_insert</code> will silently fail. After insertion,
        override the interpolation to{" "}
        <code>&apos;SINE&apos;</code> with <code>easing = &apos;EASE_IN_OUT&apos;</code>
        — this produces a velocity curve that starts at zero, peaks at the arc
        midpoint, and decelerates into the end mark. LINEAR interpolation on a
        dolly always reads as mechanical; SINE reads as physical. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-animation-fcurve-modifiers-noise-cycles-stepped"
          className={lk}
        >
          F-Curve Modifiers tutorial
        </Link>{" "}
        for adding procedural noise on top of base keyframes.
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`fp.offset_factor = 0.0
fp.keyframe_insert(data_path='offset_factor', frame=1)
fp.offset_factor = 1.0
fp.keyframe_insert(data_path='offset_factor', frame=80)

for fc in cam_obj.animation_data.action.fcurves:
    if 'offset_factor' in fc.data_path:
        for kp in fc.keyframe_points:
            kp.interpolation = 'SINE'
            kp.easing        = 'EASE_IN_OUT'`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Rack focus: keyframing dof.focus_distance
      </h2>
      <p>
        The alternative to keyed <code>focus_distance</code> is setting{" "}
        <code>focus_object</code> to an empty — the camera then computes
        distance automatically. That approach works well when the subject is
        always in shot, but it cannot be keyframed (
        <code>focus_object</code> is a PointerProperty, not a float). For a
        rack focus — changing which object is sharp — you must set{" "}
        <code>focus_object = None</code> and animate <code>focus_distance</code>{" "}
        explicitly. Pre-calculate the distances (camera→subject,
        camera→foreground object) using <code>mathutils.Vector</code> or by
        measuring in the viewport with the ruler tool. The DOF response is
        real lens physics: halving the f-stop doubles the blur radius, so
        f/1.8 at 85 mm gives strong bokeh separation at the 2.5 m distance
        difference used here.
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`FOCUS_SUBJ_M = 4.5  # camera→subject at arc end
FOCUS_NEAR_M = 2.0  # camera→foreground crystal

cam_data.dof.focus_distance = FOCUS_SUBJ_M
cam_data.keyframe_insert(data_path='dof.focus_distance', frame=1)
cam_data.keyframe_insert(data_path='dof.focus_distance', frame=80)  # hold

cam_data.dof.focus_distance = FOCUS_NEAR_M
cam_data.keyframe_insert(data_path='dof.focus_distance', frame=120)

# SINE ease makes the focus shift feel optical rather than mechanical
for fc in cam_data.animation_data.action.fcurves:
    if 'dof.focus_distance' in fc.data_path:
        for kp in fc.keyframe_points:
            kp.interpolation = 'SINE'
            kp.easing        = 'EASE_IN_OUT'`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Lens choice: 85 mm / f 1.8
      </h2>
      <p>
        The 85 mm focal length is a deliberate choice for two reasons. First,
        portrait compression: longer lenses foreshorten depth, so the
        background arch appears closer to the subject than it physically is —
        the scene reads as more composed, less sprawling. Second, at f/1.8 the
        depth of field at 4.5 m working distance is roughly ±35 cm, which
        means the subject (monolith) sits comfortably inside the sharp zone
        while objects closer than 2 m and further than 6 m fall into bokeh.
        Compare to the{" "}
        <Link
          href="/tutorials/blender-tutorial-render-cycles-dof-motion-blur-bokeh"
          className={lk}
        >
          DoF + Motion Blur tutorial
        </Link>
        , which covers the Cycles path-traced bokeh shape node — EEVEE Next
        uses a screen-space approximation that is fast and visually convincing
        but cannot reproduce lens aberrations (coma, astigmatism) the way
        Cycles can.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        NLA baking for GLB export
      </h2>
      <p>
        The glTF 2.0 format has no concept of Blender constraints. If you need
        to export the animated camera path as a GLB (for a WebXR scene or a
        spatial asset in the{" "}
        <Link href="/atelier" className={lk}>
          Atelier
        </Link>
        ), bake the constraint result to explicit keyframes first:{" "}
        <strong>Object ▸ Animation ▸ Bake Action</strong> with{" "}
        <em>Visual Keying</em> on and <em>Clear Constraints</em> off. The
        baked action carries every frame&apos;s evaluated world transform. Push
        it to the NLA Editor (see the{" "}
        <Link
          href="/tutorials/blender-tutorial-nla-action-clips-vrm"
          className={lk}
        >
          NLA Action Clips tutorial
        </Link>
        ) and export via <code>bpy.ops.export_scene.gltf</code> with{" "}
        <code>export_cameras=True</code>.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Troubleshooting</h2>
      <ul className="list-disc pl-5 space-y-1 mt-2 text-sm">
        <li>
          <strong>Camera does not move along arc</strong> — check that{" "}
          <code>use_path = True</code> is set on the curve data, not just the
          object. The option lives in Properties ▸ Curve Data ▸ Path Animation.
        </li>
        <li>
          <strong>Camera faces wrong direction</strong> — ensure Track To has{" "}
          <code>track_axis = TRACK_NEGATIVE_Z</code>. Cameras look along -Z;
          switching to positive Z points the back of the camera at the target.
        </li>
        <li>
          <strong>offset_factor keyframes have no effect</strong> — the
          keyframe must be on the <em>constraint</em>, keyed via{" "}
          <code>fp.keyframe_insert(data_path=&apos;offset_factor&apos;)</code>.
          Keying it on the object produces a no-op.
        </li>
        <li>
          <strong>DOF not visible in EEVEE viewport</strong> — open the
          viewport overlay dropdown and enable Depth of Field. The render will
          always show it; the interactive viewport requires the toggle.
        </li>
        <li>
          <strong>Camera rolls on tight arcs</strong> — Track To can produce
          up-axis flips when the look vector passes through the up axis. If it
          happens, add a Child Of constraint to the camera pointing at a
          world-space up vector, or switch to Damped Track (which allows roll
          but never flips).
        </li>
        <li>
          <strong>focus_distance keyframes lost after script re-run</strong> —
          the script clears all objects including camera data. Run the script
          once, save as a .blend file, then adjust keyframes manually in the
          Graph Editor from the saved file.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Sources</h2>
      <ul className="list-disc pl-5 space-y-1 mt-2 text-sm">
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/animation/constraints/relationship/follow_path.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Follow Path Constraint — Blender Manual
          </a>{" "}
          (CC-BY-SA 4.0, Blender Documentation Team) — offset_factor,
          use_path, arc-length parameterisation, use_curve_follow behaviour.
          Related:{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/animation/constraints/index.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Object Constraints index
          </a>
          .
        </li>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/render/cameras.html#depth-of-field"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Camera Depth of Field — Blender Manual
          </a>{" "}
          (CC-BY-SA 4.0, Blender Documentation Team) — aperture_fstop,
          focus_distance, focus_object, EEVEE vs Cycles DOF rendering.
        </li>
        <li>
          <a
            href="https://github.com/njanakiev/blender-scripting"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            njanakiev/blender-scripting
          </a>{" "}
          (MIT, Nicolas Janakiev) — bpy constraint and camera animation
          patterns. Related:{" "}
          <a
            href="https://github.com/njanakiev/blender-scripting/blob/master/scripts/camera_animation.py"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            camera_animation.py
          </a>{" "}
          in the same repo.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    time: "one evening",
    difficulty: "intermediate",
    cost: "free",
    supplies: {
      materials: ["Blender 5.1"],
      tools: [
        "Scripting workspace",
        "Graph Editor",
        "Object Constraints panel",
        "Properties ▸ Camera ▸ Depth of Field",
      ],
    },
    steps: [
      {
        title: "Run blueprint.py to build the rig",
        body: "Open a new Blender 5.1 file. In the Scripting workspace, open blueprint.py and press Run Script. The scene populates with a Bezier arc, monolith, foreground crystal, and camera. Save as camera_dolly_rig.blend.",
      },
      {
        title: "Inspect the Bezier dolly arc",
        body: "Select DollyArc and check Properties ▸ Curve Data: Use Path = On, Path Duration = 80. Tab into Edit Mode — three bezier points form a 150° arc around the subject. The middle point's Y position controls how far the camera sweeps in front.",
      },
      {
        title: "Inspect the Follow Path constraint",
        body: "Select Cam_Main. Open Properties ▸ Object Constraints. Follow Path target = DollyArc, Use Curve Follow = Off. Open the Graph Editor and find the offset_factor curve: 0 at frame 1, 1.0 at frame 80, SINE EASE_IN_OUT interpolation.",
      },
      {
        title: "Inspect the Track To constraint",
        body: "Below Follow Path in the stack: Track To, target = LookTarget empty, Track Axis = -Z, Up = Y. Press Numpad 0 to enter camera view and press Play — the camera dollies along the arc while always pointing at the empty.",
      },
      {
        title: "Inspect the rack-focus F-Curve",
        body: "With Cam_Main selected, switch to Camera data Properties (camera icon). Depth of Field is enabled, f/1.8, 85 mm. Open Graph Editor and filter by 'dof.focus_distance': holds at 4.5 m through frame 80, then eases to 2.0 m by frame 120.",
      },
      {
        title: "Scrub the rack-focus transition",
        body: "Press Numpad 0, scrub frames 80–120. The foreground crystal (right-of-frame) transitions from bokeh to sharp as the monolith softens behind it. Adjust FOCUS_NEAR_M in blueprint.py if the crystal is not in the camera view at your settings.",
      },
      {
        title: "Render preview via record.py",
        body: "From a terminal: blender camera_dolly_rig.blend --background --python record.py. The 120-frame EEVEE Next render outputs viewport.mp4 to public/library/videos/animation/animation-camera-rig-dolly-focus-pull/.",
      },
    ],
  },
  {
    slug: "blender-tutorial-animation-camera-rig-dolly-focus-pull",
    title:
      "Animation — Camera Rig: Bezier Dolly Path + Animated Rack-Focus Pull (Blender 5.1)",
    date: "2026-06-19",
    kind: "tutorial",
    excerpt:
      "Build a live cinematic camera rig in Python: a three-point Bezier arc drives a dolly via Follow Path offset_factor, Track To keeps the lens on target, and a keyframed dof.focus_distance performs a rack focus from subject to foreground crystal at the end mark.",
    Body: AnimationCameraRigDollyFocusPullBody,
  },
);
