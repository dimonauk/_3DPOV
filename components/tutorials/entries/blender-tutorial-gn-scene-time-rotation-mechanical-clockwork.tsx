import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Every animation system in Blender has a time source:{" "}
        <code>Frame</code> and <code>Seconds</code> are baked into keyframes,
        NLA tracks, and driver expressions. Geometry Nodes adds a third option
        that the other systems cannot match — the{" "}
        <code>GeometryNodeInputSceneTime</code> node, which exposes the current
        frame and elapsed seconds as plain float fields inside a GN tree. The
        consequence is that any mesh with a GN modifier can become a
        self-contained animation: no Action, no NLA strip, no driver, no
        dependency graph complication. This tutorial builds a two-gear clockwork
        and pendulum using exactly that pattern, and in doing so introduces the{" "}
        <strong>Rotation socket</strong> — the first-class socket type added to
        Geometry Nodes in Blender 4.3 and stabilised in 5.1 — which carries an
        Euler triple with explicit intent rather than the ambiguous{" "}
        <code>VECTOR</code> socket that earlier GN setups were forced to use.
      </p>

      <p>
        The gear ratio is the single physical law that holds the assembly
        together. If the driver gear has{" "}
        <code>T_big = 20</code> teeth at root radius{" "}
        <code>R_big = 1.0 m</code>, and the follower has{" "}
        <code>T_small = 12</code> teeth, then external meshing (pitch circles
        tangent, axes parallel) requires the follower to sit at{" "}
        <code>x = R_big + R_small = R_big × (1 + T_small / T_big) = 1.6 m</code>{" "}
        and to spin at{" "}
        <code>ω_small = −ω_big × (T_big / T_small)</code> — opposite direction,
        faster by the tooth-count ratio. In the GN modifier, this means the
        follower's <code>angle_per_frame</code> constant is computed once at
        Python build time and hard-baked into the multiply node's{" "}
        <code>inputs[1].default_value</code>. Compare this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-animation-drivers-parametric-shader"
          className={lk}
        >
          Drivers + Parametric Shader tutorial
        </Link>
        , where the same kind of ratio lives in a Python expression string on a
        driver — both approaches eliminate keyframes, but GN is preferred when
        the animated property is a mesh transformation rather than a material
        parameter, because the GN route avoids the driver system's
        update-on-depsgraph-flush overhead for high-frequency transformations.
      </p>

      <p>
        The <code>FunctionNodeEulerToRotation</code> node is the key upgrade
        over older GN rotation workflows. Before the Rotation socket type
        existed, you would construct a <code>(0, 0, angle)</code> vector and
        connect it directly to <code>Transform Geometry.Rotation</code>, which
        accepted a VECTOR and interpreted it as Euler XYZ radians. That
        still works in Blender 5.1, but it is fragile: if the socket type
        changes, or you pipe the vector into a node that expects a direction
        rather than an angle-triplet, the result is silently wrong. The
        Rotation socket prevents that. Downstream nodes —{" "}
        <code>FunctionNodeRotateRotation</code> to compose two rotations,{" "}
        <code>GeometryNodeRotateInstances</code> for instanced geometry — all
        carry explicit type tags and will type-error rather than silently misread
        a vector as a rotation. The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-rotate-instances-phyllotaxis-sunflower"
          className={lk}
        >
          Rotate Instances + Phyllotaxis tutorial
        </Link>{" "}
        uses the older VECTOR path; after completing this tutorial you will have
        a clear before/after picture of why the typed Rotation socket is
        preferable.
      </p>

      <p>
        The pendulum uses <code>SceneTime.Seconds</code> rather than{" "}
        <code>Frame</code>, which is a deliberate choice. The isochronism of a
        pendulum — equal period regardless of amplitude, within the small-angle
        approximation — holds in real time, not frame-count time. If the project
        is later changed from 24 fps to 30 fps, the pendulum period (set in
        seconds) stays constant without any parameter adjustment, whereas a
        frame-based swing angle would speed up by 25%. The{" "}
        <code>Math(SINE)</code> node takes the scaled seconds and returns a
        value between −1 and +1, which the amplitude multiplier converts to
        radians. A full oscillation means the pendulum traces from
        +26° → 0° → −26° → 0° → +26° in one period. The{" "}
        <code>CombineXYZ(x=angle, y=0, z=0)</code> node feeds only the X slot
        because the pendulum hangs in the Y-Z plane of the world — X rotation
        produces the characteristic forward-back sweep when viewed from the
        side. Compare the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-gizmo-nodes-interactive-viewport-controls"
          className={lk}
        >
          GN Gizmo Nodes tutorial
        </Link>
        , which puts interactive handles on GN parameters — if you add a Gizmo
        node for the swing amplitude, you can drag the pendulum arc live in the
        viewport while it oscillates.
      </p>

      <p>
        The animation export to GLB deserves a note. Blender&apos;s glTF exporter
        does not understand Geometry Nodes procedural animation. It reads the
        keyframe/driver/NLA stack, not the GN evaluation. To get animated GLB
        output you must set{" "}
        <code>export_bake_animation=True</code> and{" "}
        <code>export_force_sampling=True</code>. The first instructs the
        exporter to bake every animated object over the frame range; the second
        forces per-frame TRS sampling even for channels that appear static
        between keyframes — which GN-driven rotation is, from the exporter&apos;s
        perspective, because GN writes no keyframes to the data-block. Without{" "}
        <code>export_force_sampling</code>, the glTF file contains zero
        animation data and the gears appear frozen in Three.js / WebXR. The same
        pattern applies to any GN-animated mesh, including the simulation-based
        approaches in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-boid-flock"
          className={lk}
        >
          Boid Flocking tutorial
        </Link>{" "}
        — bake first, force-sample second, then export.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-scene-time-rotation-mechanical-clockwork",
  title:
    "GN Scene Time + Rotation Socket — Procedural Mechanical Clockwork: Keyframe-Free Gear & Pendulum Animation",
  date: "2026-06-20",
  kind: "tutorial",
  excerpt:
    "Animate two meshing gears and a pendulum inside Geometry Nodes using only the Scene Time node and the Blender 5.1 Rotation socket — no keyframes, no drivers, no NLA tracks.",
  summary:
    "Builds a driver gear (20 teeth, R=1m), a follower gear (12 teeth, R=0.6m), and a sinusoidal pendulum as separate objects each carrying a single Geometry Nodes modifier. Scene Time.Frame feeds a Math(MUL) node to compute the current rotation angle; FunctionNodeEulerToRotation converts the Euler triplet to the typed Rotation socket (formalised in Blender 4.3, stable in 5.1); GeometryNodeTransform applies it. The pendulum uses Scene Time.Seconds through Math(SINE) for FPS-independent isochronous swing. GLB export requires export_bake_animation=True plus export_force_sampling=True because GN writes no keyframe data that the exporter can read directly.",
  tags: [
    "blender",
    "geometry-nodes",
    "animation",
    "procedural",
    "rotation-socket",
    "scene-time",
    "gears",
    "mechanical",
    "glb",
    "blender-5",
  ],
  Body,
  related: [
    {
      href: "/tutorials/blender-tutorial-gn-gizmo-nodes-interactive-viewport-controls",
      label: "GN Gizmo Nodes — Interactive Viewport Controls",
      note: "Extend Scene Time parameters with draggable viewport handles",
    },
    {
      href: "/tutorials/blender-tutorial-gn-rotate-instances-phyllotaxis-sunflower",
      label: "GN Rotate Instances — Phyllotaxis Sunflower",
      note: "Before/after: VECTOR vs typed Rotation socket on RotateInstances",
    },
    {
      href: "/tutorials/blender-tutorial-animation-drivers-parametric-shader",
      label: "Animation Drivers + Parametric Shader",
      note: "Alternative keyframe-free approach via Python expression drivers",
    },
    {
      href: "/tutorials/blender-tutorial-gn-simulation-zone-boid-flock",
      label: "GN Simulation Zone — Boid Flocking",
      note: "The same export_force_sampling requirement for GN-animated GLB",
    },
  ],
  furtherReading: [
    {
      href: "https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/input/scene/scene_time.html",
      label: "Scene Time — Blender Manual",
      note: "CC-BY-SA 4.0 · Blender Foundation · related: all GN Input/Scene nodes at docs.blender.org/manual/en/latest/modeling/geometry_nodes/input/scene/",
    },
    {
      href: "https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/utilities/rotation/euler_to_rotation.html",
      label: "Euler to Rotation — Blender Manual",
      note: "CC-BY-SA 4.0 · Blender Foundation · related: Rotate Rotation, Axis Angle to Rotation, Invert Rotation at docs.blender.org/manual/en/latest/modeling/geometry_nodes/utilities/rotation/",
    },
  ],
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    difficulty: "intermediate",
    time: "1–2 hours",
    overview:
      "The Rotation socket (Blender 4.3+) separates an Euler angle-triplet from a direction vector at the type level, preventing silent misreads when composing rotations across nodes. This tutorial wires Scene Time directly into Transform Geometry via the Rotation socket on three mesh objects — a driver gear, a follower gear, and a pendulum — producing a self-animating clockwork with no keyframes, no NLA, and no dependency-graph drivers.",
    goal: "Three mesh objects (gear_big, gear_small, pendulum), each with a GN modifier that reads Scene Time and drives Transform Geometry rotation. Scene plays 120 frames at 24 fps showing correct gear meshing and pendulum swing. GLB exported with baked animation ready for WebXR.",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "FunctionNodeEulerToRotation introduced in Blender 4.3. GeometryNodeInputSceneTime available from 3.6. Both are stable in 5.1.",
      },
    ],
    prerequisites: [
      "Can add and link GN nodes via the Python API (bpy.data.node_groups.new, nodes.new, links.new)",
      "Knows what Transform Geometry does and what its Rotation socket expects",
      "Has used Math nodes inside a GN tree at least once",
      "Understands that bmesh produces raw mesh data that bpy.data.meshes can adopt",
    ],
    steps: [
      {
        title: "Build the gear profile mesh with bmesh",
        body: "Run `make_gear('gear_big', teeth=20, r_root=1.0, r_tip=1.14, width=0.20)`. The function iterates `teeth` times, computing four profile vertices per tooth: a root-entry point, two tip points (at `r_tip`), and a root-exit point. The angular spacing between successive tooth bases is `2π / teeth`. `TOOTH_FRACTION = 0.46` controls what fraction of that arc is occupied by the tip plateau versus the root gap.\n\nThe bmesh builds a top face (all profile vertices in order), a bottom face (reversed winding for correct normals), and side quads between consecutive edge pairs. `bm.normal_update()` followed by `bm.to_mesh(mesh)` then `bm.free()` is the canonical pattern — free the bmesh immediately after transferring to avoid memory leaks on repeated runs.\n\nVerify: in Edit Mode the gear outline is visible as a closed polygon with alternating inner and outer radii, 80 edges total (4 × 20).",
      },
      {
        title: "Position the follower gear at pitch-circle tangency",
        body: "After `make_gear('gear_small', teeth=12, r_root=0.60, r_tip=0.74, ...)`, set `gear_small.location.x = R_BIG + R_SMALL = 1.60`. This places the two pitch circles exactly tangent — the root radius, not the tip radius, is the pitch circle. The 0.14 m tooth height on each gear gives 0.28 m total clearance at the mesh point, which means tooth tips interdigitate when both gears are correctly phased.\n\nThe phase offset matters: if both gears start at angle 0.0 and frame 1, the tooth tips of both gears point at each other along the X axis — an interpenetrating start position. The small gear's GN modifier therefore includes `phase_rad = π / T_small = π / 12` to offset it by half a tooth, placing a gap at the mesh point at frame 1.",
      },
      {
        title: "Build the GN rotation modifier (build_rotation_gn)",
        body: "This is the core of the tutorial. `tree.interface.new_socket(...)` creates the Geometry input and output sockets (Blender 5.1 uses `tree.interface`, not the deprecated `tree.inputs`/`tree.outputs`).\n\nNode chain:\n1. `GeometryNodeInputSceneTime` — outputs `Frame` (float) and `Seconds` (float).\n2. `ShaderNodeMath(MULTIPLY)` — `Frame × angle_per_frame_rad`. For the driver gear: `2π / 20 ≈ 0.3142 rad·frame⁻¹`.\n3. `ShaderNodeMath(ADD)` — adds `phase_rad` for the follower. Can be 0.0 for the driver.\n4. `ShaderNodeCombineXYZ` — connect the angle to the Z input only. X and Y remain 0.0.\n5. `FunctionNodeEulerToRotation` — converts the (0, 0, angle) Euler vector to a Rotation socket. This is the type-system boundary.\n6. `GeometryNodeTransform` — the Rotation input accepts the typed Rotation socket directly. Translation and Scale left at defaults.\n\nWire: `GroupInput.Geometry → Transform.Geometry → GroupOutput.Geometry`. The rotation chain feeds only `Transform.Rotation`.",
      },
      {
        title: "Build the pendulum GN modifier (build_pendulum_gn)",
        body: "The pendulum modifier replaces the `Frame × constant` chain with:\n1. `SceneTime.Seconds` (not Frame).\n2. `Math(MULTIPLY, 2π / SWING_PERIOD_S)` — converts seconds to angular frequency.\n3. `Math(SINE)` — produces a value in [−1, +1] that oscillates once per `SWING_PERIOD_S` seconds.\n4. `Math(MULTIPLY, SWING_AMP_RAD)` — scales to the desired ±26° amplitude.\n5. `CombineXYZ(x=angle, y=0, z=0)` — put the angle on X (pendulum swings in the YZ plane).\n6. `FunctionNodeEulerToRotation` → `GeometryNodeTransform.Rotation`.\n\nThe pendulum mesh pivot is at the origin; `make_pendulum` generates the rod downward along −Y from (0, 0, 0). The object's `location.z = −GEAR_WIDTH × 0.5` hangs it flush with the underside of the driver gear hub.",
      },
      {
        title: "Add the Fresnel emission material",
        body: "Each gear gets a Principled BSDF (metallic=0.9, roughness=0.25, base colour deep indigo) mixed with an Emission node (cool cyan, strength=2.5) via a Mix Shader blended by a Fresnel node.\n\nThe Fresnel node provides grazing-angle emphasis — at near-perpendicular incidence the BSDF dominates; at grazing angles the emission overwhelms. This produces a rim-glow that highlights the tooth edges without full emission on the face, which would wash out tooth depth cues. The pendulum uses a solid warm-brass colour with no emission so it reads as a visually distinct object type.",
      },
      {
        title: "Play the animation and verify gear meshing",
        body: "Press Space. In the first 10–15 frames confirm:\n- `gear_big` rotates CCW (from +Z view).\n- `gear_small` rotates CW at 20/12 × the speed of the driver.\n- `pendulum` swings smoothly between +26° and −26°.\n\nIf the follower gear rotates in the same direction as the driver, `angle_per_frame` sign is wrong — negate `APF_SMALL` in the blueprint. If teeth interpenetrate at the mesh point at frame 1, adjust `phase_rad` by ±π/TEETH_SMALL steps until the gap aligns correctly.",
      },
      {
        title: "Export animated GLB",
        body: "Run `bpy.ops.export_scene.gltf(export_bake_animation=True, export_force_sampling=True, export_frame_range=True, export_animations=True)`.\n\n`export_force_sampling=True` is mandatory. Without it the exporter reads the keyframe stack — which is empty for GN-driven objects — and writes zero animation data. With it, the exporter samples the object TRS at every frame in the range and writes a stepped animation curve to the glTF binary. File size increases linearly with frame count; at 120 frames and 3 objects the animation data adds roughly 50 KB.\n\nVerify in a WebXR viewer (or drag the GLB into `https://gltf.report`) that the Animation tab shows a single clip `Take 001` lasting 5 seconds, and that scrubbing it shows correct gear rotation.",
      },
    ],
    finalResult:
      "Three animated mesh objects — gear_big, gear_small, pendulum — each driven purely by a Geometry Nodes Scene Time modifier. The assembly plays 120 frames (5 s at 24 fps) with correct gear-ratio meshing and a sinusoidal pendulum swing. The EEVEE Next render shows cyan rim-glow on the gear tooth edges. clockwork.glb includes the baked animation and loads correctly in Three.js/WebXR without any post-processing.",
    variations: [
      "Add a third gear (idler) between the two existing ones using a third make_gear + build_rotation_gn call. The idler reverses direction again so the output gear turns the same way as the driver — a classic three-gear reversal chain.",
      "Expose the swing amplitude as a GN group input by wiring it through a Float socket instead of hard-coding it in the multiply node. Then use the GN Gizmo Node (see the Gizmo Nodes tutorial) to make it draggable in the viewport.",
      "Replace the sinusoidal pendulum swing with a ratchet escapement simulation: use Math(FLOOR) on the frame count divided by the tooth period to create a stepped-rotation output. The pendulum then snaps between tooth positions like a real clock escapement.",
      "Drive a third gear's rotation from a custom property on an Empty, feeding that property into the GN tree via an Object Info node — creating a hybrid between GN-driven and driver-driven animation for interactive control during animation.",
    ],
    troubleshooting: [
      {
        symptom: "Gears do not move — the viewport shows static meshes at all frames",
        cause:
          "The GN modifier node group does not include GeometryNodeInputSceneTime correctly wired, or the tree has no output connection. A common mistake is creating the tree but forgetting to connect GroupInput.Geometry to Transform.Geometry — the Transform receives no geometry and outputs nothing.",
        fix:
          "In the GN editor, confirm: GroupInput.Geometry → GeometryNodeTransform.Geometry → GroupOutput.Geometry. Confirm SceneTime.Frame connects through the Math chain to Transform.Rotation. Scrub the Frame counter in the timeline header manually and watch whether any node values change — if they do, the wiring is correct but playback caching is the issue; if they do not, a link is missing.",
      },
      {
        symptom: "FunctionNodeEulerToRotation not found — AttributeError on nodes.new()",
        cause:
          "Running on Blender 4.2 or earlier. The EulerToRotation node was introduced in Blender 4.3 alongside the Rotation socket type formalisation.",
        fix:
          "Confirm `bpy.app.version >= (4, 3, 0)`. On older builds, use CombineXYZ directly connected to Transform.Rotation — Blender will accept a VECTOR socket there and interpret it as XYZ Euler radians. Note that this bypasses the type-safety benefit but produces the same visual result.",
      },
      {
        symptom: "GLB loads in Three.js but gears are frozen at frame 1",
        cause:
          "The gltf export was run without export_force_sampling=True. The exporter found no keyframes on the GN-driven objects and wrote an empty animation clip.",
        fix:
          "Re-export with `export_force_sampling=True` and `export_bake_animation=True`. Check the output GLB size — an empty animation adds ~0 KB, a correctly baked 120-frame 3-object animation adds ~50 KB. If the file size is suspiciously small, the sampling did not occur.",
      },
      {
        symptom: "Gear teeth visually interpenetrate at the mesh point on frame 1",
        cause:
          "The phase offset for the follower gear is wrong or missing. At frame 1 both gears are at angle 0 radians, which places a tooth tip of each gear at the tangent point simultaneously — interpenetration.",
        fix:
          "Increase `phase_rad` on the follower's build_rotation_gn call in steps of `π / TEETH_SMALL ≈ 0.26 rad` until the tip of the driver gear's tooth aligns with the gap (root) of the follower gear at frame 1. The correct phase value is half a tooth arc on the follower.",
      },
    ],
  },
  base,
);
