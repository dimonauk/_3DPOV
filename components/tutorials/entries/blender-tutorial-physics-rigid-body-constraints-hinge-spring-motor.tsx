import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function PhysicsRigidBodyConstraintsHingeSpringMotorBody() {
  return (
    <>
      <p>
        Rigid body constraints in Blender 5.1 are Bullet PGS equations added
        to every solver pass alongside contact forces.  Rather than restricting
        individual body velocity, they act on{" "}
        <em>pairs</em> of bodies and enforce a relative-motion limit defined in
        the local frame of a scene Empty — the constraint pivot.  This is why
        pivot placement is everything: if the Empty is positioned at the wrong
        point, the solver must exert compensating impulses to satisfy an
        impossible constraint, and the result is the notorious{" "}
        <em>constraint explosion</em> where bodies fly off to infinity on
        frame&nbsp;1.  The seven built-in types differ only in which of the
        six DOF (three translational, three rotational) they restrict and how
        they restrict them: FIXED locks all six, POINT frees the three
        rotational, HINGE frees exactly one rotational (around the Empty&apos;s
        local&nbsp;Z), SLIDER frees one translational, and GENERIC/GENERIC_SPRING
        let you configure limits per-axis.  The same Bullet solver that handles
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-physics-rigid-body-domino-chain"
          className={lk}
        >
          domino chain
        </Link>{" "}
        drives these constraints; the difference is that dominos only experience
        contact forces between independent bodies, whereas constraints introduce
        explicit bilateral equations that the PGS loop must satisfy simultaneously
        with all contacts.  This is why the recommended{" "}
        <code>solver_iterations</code> for constraint-heavy scenes is 40 rather
        than the 20 that suffices for simple stacking.
      </p>

      <p>
        The single most confusing part of the Blender Python API for rigid body
        constraints is that{" "}
        <code>obj.rigid_body_constraint</code> does not exist until you call{" "}
        <code>bpy.ops.rigidbody.constraint_add(type=&apos;HINGE&apos;)</code>.
        Unlike the modifier stack — where <code>obj.modifiers.new()</code> is a
        pure data-path operation — the constraint subsystem registers the object
        in the rigid body world&apos;s constraint collection as a side-effect of
        the operator.  There is no <code>bpy.data</code> shortcut.  The pattern
        is therefore: deselect all, select the Empty, make it the active object,
        then call the operator.  Every property on the returned{" "}
        <code>RigidBodyConstraint</code> (type, object1, object2, limits,
        motor settings) is writable directly after that.  Compare this with the
        broader question of when to prefer operators versus the direct data path,
        covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-geonodes-tree-build-bpy"
          className={lk}
        >
          programmatic Geometry Nodes tree tutorial
        </Link>
        : the rule is that operators are required when they perform world-level
        registration that cannot be replicated by writing to bpy.data alone.
      </p>

      <p>
        The <strong>HINGE</strong> constraint for the door uses{" "}
        <code>use_limit_ang_z = True</code> with{" "}
        <code>limit_ang_z_lower = 0.0</code> and{" "}
        <code>limit_ang_z_upper = math.radians(90.0)</code> — the limits are in
        radians, not degrees, and values outside [−π, π] destabilise the solver.
        Critically, the door object&apos;s origin must sit at the hinge edge, not
        at the door&apos;s geometric centre.  Bullet computes rotational inertia
        about the origin, and a door that pivots about its centre has 4× the
        inertia of one pivoting about its edge (parallel-axis theorem:{" "}
        <code>I = I_cm + m × d²</code>); the angular impulse needed to open the
        door is proportional to this inertia, so a centre-origin door will respond
        dramatically differently from a real door.  Origin placement via{" "}
        <code>object.origin_set(type=&apos;ORIGIN_CURSOR&apos;)</code> after
        moving the 3D cursor to the hinge axis is the reliable scripted approach.
      </p>

      <p>
        The <strong>MOTOR</strong> mode on the pendulum HINGE constraint
        demonstrates how Bullet&apos;s angular motor works: instead of enforcing
        a position target it enforces a velocity target (<code>motor_ang_target_velocity</code>
        in rad/s) up to a per-sub-step impulse cap (<code>motor_ang_max_impulse</code>).
        The impulse cap is the torque limiter: if the hanging mass requires more
        torque than the cap permits, the motor stalls.  A useful starting value is{" "}
        <code>5 × mass × radius</code>; this gives enough authority to accelerate
        from rest but not so much that it snaps the pendulum to full speed
        instantaneously on frame&nbsp;1, which would register as an inter-frame
        velocity discontinuity and introduce a constraint error spike.  Note that
        there is no angle limit when the motor is enabled — if you add limits the
        motor will drive the pendulum into the limit and hold it there rather than
        rotating continuously.  Compare this with the keyframe-free gear rotation
        in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-scene-time-rotation-mechanical-clockwork"
          className={lk}
        >
          GN mechanical clockwork tutorial
        </Link>
        : that approach uses Geometry Nodes with the Scene Time node to drive
        rotation deterministically, which is reproducible and GLB-exportable
        without baking; the motor approach produces physically responsive rotation
        that reacts to collisions and mass distribution but requires bake-to-keyframes
        for animation export.
      </p>

      <p>
        The <strong>GENERIC_SPRING</strong> constraint for the suspension chassis
        has a frequently misread property: <code>spring_damping_z</code> is a
        dimensionless ratio, not a force in N·s/m.  The physical critical damping
        coefficient for this system is{" "}
        <code>2 × √(k × m) = 2 × √(300 × 10) ≈ 110 N·s/m</code>; Bullet&apos;s
        ratio of 1.0 corresponds to that critical value.  Setting it above 1 gives
        over-damped behaviour (exponential decay, no oscillation); below 1 gives
        under-damped (oscillates, eventually settles); exactly 1 gives critical
        damping (fastest settle without overshoot).  For a suspension spring you
        want 0.2–0.4 to see the chassis bob before settling.  The DOF locking on
        this constraint — all axes except Z translation are locked to zero —
        illustrates the general GENERIC_SPRING pattern: lock what should be rigid,
        spring what should flex.  Using{" "}
        <code>use_limit_lin_z = False</code> is essential: if Z is also limited
        (even to a wide range), Bullet treats the spring as an additional force
        within that range rather than a free-travel restoring force, and the
        chassis will not oscillate correctly.
      </p>

      <p>
        For GLB export of a simulated constraint scene, the critical step is{" "}
        <code>Object → Rigid Body → Bake to Keyframes</code> (API:{" "}
        <code>bpy.ops.rigidbody.bake_to_keyframes(frame_start=1, frame_end=120)</code>
        with all target objects selected).  The Bullet point cache is a binary
        side-channel that only Blender reads during playback; the{" "}
        <a
          href="https://github.com/KhronosGroup/glTF-Blender-IO"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          glTF-Blender-IO exporter
        </a>{" "}
        (Apache-2.0, Khronos Group) reads location/rotation keyframes on the
        animation tracks — not the cache.  After baking, each rigid body has a
        standard NLA action with per-frame location and quaternion rotation keys
        that export as <code>KHR_animation_pointer</code> channels in the GLB.
        WebXR runtimes can play this animation exactly as you baked it, making
        precomputed physics sequences a viable alternative to real-time physics
        in constrained WebXR targets.  See the{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/physics/rigid_body/constraints/index.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender rigid body constraints manual
        </a>{" "}
        (CC-BY-SA-4.0, Blender Foundation) for the complete constraint type
        reference, and the{" "}
        <a
          href="https://github.com/bulletphysics/bullet3"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Bullet Physics SDK
        </a>{" "}
        (zlib licence, Erwin Coumans / Google) for the underlying{" "}
        <code>btGeneric6DofSpring2Constraint</code> implementation that backs
        Blender&apos;s GENERIC_SPRING type.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-physics-rigid-body-constraints-hinge-spring-motor",
  title:
    "Physics — Rigid Body Constraints: Hinge, Motor & Generic Spring for Mechanical Joints (Blender 5.1)",
  tags: [
    "blender",
    "physics",
    "rigid-body",
    "constraints",
    "hinge",
    "spring",
    "motor",
    "bullet",
    "simulation",
    "mechanical",
    "python",
    "glb",
    "webxr",
  ],
  category: "tutorial",
  publishedOn: "2026-06-22",
  summary:
    "Bullet rigid body constraints in Blender 5.1: three setpieces covering HINGE " +
    "(door with 90° angular limit, origin at hinge edge), HINGE+MOTOR (pendulum at " +
    "3 rad/s with impulse-capped torque), and GENERIC_SPRING (chassis suspension, " +
    "spring_damping_z=0.3 under-damped ratio, Z-only free axis). API notes on why " +
    "bpy.ops.rigidbody.constraint_add() is mandatory, and how to bake to keyframes " +
    "for animated GLB / WebXR export.",
  body: PhysicsRigidBodyConstraintsHingeSpringMotorBody,
  libraryPath:
    "blends/physics/physics-rigid-body-constraints-hinge-spring-motor",
});
