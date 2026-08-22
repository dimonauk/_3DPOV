import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function AnimationConstraintsFollowPathTrackToBody() {
  return (
    <>
      <p>
        Blender&apos;s object constraint system lets you compose motion from
        independent sources rather than keyframing every axis by hand. A{" "}
        <strong>Follow Path</strong> constraint binds an object&apos;s world
        position to a curve; a <strong>Track To</strong> stacked above it
        overrides the resulting rotation so the camera&apos;s lens always faces
        a live look-at target; a <strong>Damped Track</strong> on a separate
        object (an eye bone proxy) does the same without an enforced up-axis —
        avoiding the gimbal flips that plague traditional Track To on bones that
        swing past vertical. One animated scalar — <code>offset_factor</code>{" "}
        0→1 on the Follow Path constraint — drives a complete orbital dolly shot
        with zero rotation keyframes on the camera itself.
      </p>
      <p className="mt-3">
        This technique pre-dates Geometry Nodes and NLA strips, but it remains
        the fastest path to a cinematic orbit rig, WebXR orbital camera, or VRM
        eye-tracking setup because constraints evaluate live every frame without
        baking. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-armature-ik-robot-arm"
          className={lk}
        >
          IK Robot Arm tutorial
        </Link>{" "}
        for how constraint stacking applies to bone chains, or the{" "}
        <Link
          href="/tutorials/blender-tutorial-animation-drivers-parametric-shader"
          className={lk}
        >
          Animation Drivers tutorial
        </Link>{" "}
        for feeding constraint outputs back into shader parameters.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Constraint stacking order — position before rotation
      </h2>
      <p>
        Blender evaluates constraints top-to-bottom in the Properties ▸ Object
        Constraints panel, accumulating transforms. Follow Path sets position{" "}
        <em>and</em> an initial rotation (curve tangent). Track To then
        re-computes rotation from scratch using the target, discarding the
        tangent rotation entirely. The order must be Follow Path first, Track To
        second — reverse them and Track To&apos;s rotation gets overwritten by
        the tangent before it matters.
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`# Follow Path — drives position along the curve
fp = cam.constraints.new("FOLLOW_PATH")
fp.target           = orbit_path      # Bezier Circle object
fp.use_curve_follow = False           # Track To will handle rotation; don't fight it
fp.forward_axis     = "TRACK_NEGATIVE_Y"
fp.up_axis          = "UP_Z"

# Animate offset_factor 0→1 for one full orbit
fp.offset_factor = 0.0
fp.keyframe_insert(data_path="offset_factor", frame=1)
fp.offset_factor = 1.0
fp.keyframe_insert(data_path="offset_factor", frame=200)

# LINEAR interpolation — constant angular velocity (no ease-in/out)
for fc in cam.animation_data.action.fcurves:
    if "offset_factor" in fc.data_path:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"

# Track To — camera -Z toward target, +Y is screen-up
tt = cam.constraints.new("TRACK_TO")
tt.target     = look_target
tt.track_axis = "TRACK_NEGATIVE_Z"   # camera's view direction
tt.up_axis    = "UP_Y"`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        use_path and path_duration — the arc-length secret
      </h2>
      <p>
        Without <code>use_path = True</code> on the curve&apos;s data block,
        Blender parameterises the curve geometrically (0→1 = t-parameter of the
        spline) rather than by arc length. A Bezier Circle has uniform handle
        distribution, so the mismatch is invisible — but on any non-uniform
        path (like a hand-drawn S-curve), the camera would accelerate through
        tight bends and crawl through straight runs.{" "}
        <code>path_duration = ANIM_FRAMES</code> then calibrates the mapping so
        <code>offset_factor = 1.0</code> corresponds exactly to the last frame
        rather than some arbitrary time unit.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Track To vs Damped Track — choosing the right constraint for bones
      </h2>
      <p>
        Track To enforces a secondary <em>up</em> axis (screen-vertical stays
        locked). That is exactly what you want for a camera (the horizon stays
        level), but it causes violent gimbal flipping when the target passes
        directly above or below the tracked object — the up-axis constraint
        becomes indeterminate and Blender picks a discontinuous solution.
        Damped Track finds the shortest-arc rotation from the current
        orientation to the target direction and applies nothing else; the object
        can barrel-roll freely through any target position without singularity.
        For eye bones in a{" "}
        <Link
          href="/tutorials/blender-tutorial-nla-action-clips-vrm"
          className={lk}
        >
          VRM character rig
        </Link>
        , a 10–15° barrel roll is imperceptible, so Damped Track is always the
        safer choice on bones.
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`# Damped Track on an eye proxy (cone with tip along +Z)
dt = eye_cone.constraints.new("DAMPED_TRACK")
dt.target     = look_target
dt.track_axis = "TRACK_Z"   # tip of cone points toward target

# Contrast: Track To on same object would require:
# tt.track_axis = "TRACK_Z"
# tt.up_axis    = "UP_Y"    ← this is what can flip near vertical`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Baking constraints to keyframes for GLB export
      </h2>
      <p>
        The glTF 2.0 specification knows nothing of Blender constraints. To
        export animated constraint-driven motion you must bake it to explicit
        per-frame location/rotation keyframes first. Use{" "}
        <strong>Object ▸ Animation ▸ Bake Action…</strong> with{" "}
        <em>Visual Keying</em> enabled (captures the evaluated world transform
        after all constraints run) and <em>Clear Constraints</em> disabled
        (keeps the live rig intact in the .blend). The baked action can then be
        pushed to the NLA Editor — see the{" "}
        <Link
          href="/tutorials/blender-tutorial-nla-action-clips-vrm"
          className={lk}
        >
          NLA Action Clips
        </Link>{" "}
        tutorial — and exported via{" "}
        <code>bpy.ops.export_scene.gltf</code>. The constraint rig remains
        editable in the .blend; only the baked copy travels with the GLB.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Reshaping the orbit path live
      </h2>
      <p>
        The real power of a constraint-based rig is non-destructive editing.
        Tab into the Bezier Circle in Edit Mode and move control points to turn
        the circular orbit into an ellipse, figure-eight, or architectural
        walk-through path. The camera follows every change without a single
        re-keyframe. Combine this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-render-cycles-dof-motion-blur-bokeh"
          className={lk}
        >
          DoF + Motion Blur camera rig
        </Link>{" "}
        by driving <code>camera.dof.focus_object = look_target</code> — the
        focal plane then tracks the same empty the constraints are pointing at,
        keeping the subject sharp through the entire orbit without ever
        touching a depth-of-field keyframe.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Troubleshooting</h2>
      <ul className="list-disc pl-5 space-y-1 mt-2 text-sm">
        <li><strong>Camera points away</strong> — swap <code>track_axis</code> between <code>TRACK_NEGATIVE_Z</code> and <code>TRACK_Z</code>. Cameras look along -Z; meshes look along +Z.</li>
        <li><strong>Orbit starts wrong</strong> — the Bezier Circle&apos;s first control point is offset_factor=0. Rotate the curve <em>object</em> in Object Mode to reposition the start.</li>
        <li><strong>Camera rolls</strong> — ensure <code>use_curve_follow = False</code>; Track To should own all rotation.</li>
        <li><strong>Gimbal flip on eye bone</strong> — switch Track To → Damped Track, then add Limit Rotation after it if you need roll clamping.</li>
        <li><strong>offset_factor not animatable</strong> — keyframe it via <code>fp.keyframe_insert(data_path="offset_factor")</code>, not via the object&apos;s own keyframe_insert. In the UI: right-click the slider ▸ Insert Keyframe.</li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Sources</h2>
      <ul className="list-disc pl-5 space-y-1 mt-2 text-sm">
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/animation/constraints/index.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Object Constraints — Blender Manual
          </a>{" "}
          (CC-BY-SA 4.0, Blender Documentation Team)
        </li>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/animation/constraints/relationship/follow_path.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Follow Path Constraint — Blender Manual
          </a>{" "}
          (CC-BY-SA 4.0, Blender Documentation Team) — covers{" "}
          <code>use_path</code>, <code>offset_factor</code>, forward/up axes
          and the difference between fixed and animated offset.
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
          (MIT, Nicolas Janakiev) — bpy constraint and animation scripting
          patterns; related:{" "}
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
      tools: ["Object Constraints panel", "Graph Editor", "Bezier Circle path"],
    },
    steps: [
      {
        title: "Add a Bezier Circle path and enable use_path",
        body: "Add ▸ Curve ▸ Bezier Circle (radius 4 m). In Properties ▸ Curve Data, enable 'Use Path' and set Path Duration = 200 frames. This activates arc-length parameterisation.",
      },
      {
        title: "Add a look-at target Empty",
        body: "Add ▸ Empty ▸ Sphere at the world origin. Keyframe its Z location to bob up/down over 200 frames — this is what both the camera and the eye cone will track.",
      },
      {
        title: "Add camera; apply Follow Path constraint",
        body: "Add ▸ Camera. In Properties ▸ Object Constraints, add Follow Path. Set target = Bezier Circle, use_curve_follow = Off. Keyframe offset_factor: 0 at frame 1, 1.0 at frame 200. Set interpolation = LINEAR in Graph Editor.",
      },
      {
        title: "Stack Track To constraint above Follow Path",
        body: "Add Track To below Follow Path in the same panel. Target = Look-At Empty, track_axis = TRACK_NEGATIVE_Z, up_axis = UP_Y. The camera should now orbit while always facing the empty.",
      },
      {
        title: "Add EyeCone with Damped Track",
        body: "Add ▸ Mesh ▸ Cone (tip along +Z), position it anywhere in the scene. Add Damped Track constraint, target = same empty, track_axis = TRACK_Z. Press Play — it should smoothly follow the bobbing target without gimbal flip.",
      },
      {
        title: "Bake and export (optional)",
        body: "To export animated motion as GLB: Object ▸ Animation ▸ Bake Action, enable Visual Keying, disable Clear Constraints. The baked action is NLA-ready and glTF-exportable.",
      },
    ],
  },
  {
    slug: "blender-tutorial-animation-constraints-follow-path-track-to",
    title:
      "Object Constraints: Follow Path + Track To + Damped Track — Orbital Camera Rig (Blender 5.1)",
    date: "2026-06-13",
    kind: "tutorial",
    excerpt:
      "Stack Follow Path (position), Track To (rotation), and Damped Track (bone gaze) to build a live orbital camera rig driven by a single animated float — no rotation keyframes needed on the camera itself.",
    Body: AnimationConstraintsFollowPathTrackToBody,
  },
);
