import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        A poi staff thrown into the air and released experiences no torque — the
        only forces act through its centre of mass and cancel. Yet its angular
        velocity does not stay constant. Euler showed in 1758 that in the body-fixed
        principal-axis frame, the three components ω₁, ω₂, ω₃ are mutually coupled
        through the differences of the principal moments (I₂−I₃), (I₃−I₁),
        (I₁−I₂). The angular velocity traces a closed orbit called the
        <em> polhode</em> — the intersection of the energy ellipsoid and the
        angular-momentum sphere (Poinsot, 1834). We integrate Euler&apos;s equations
        with RK4 at 480 Hz, couple them with quaternion kinematics to track the
        lab-frame orientation, and bake 241 LINEAR quaternion keyframes onto a
        Blender cylinder that is the poi staff.
      </p>
      <p>
        Compare the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-lorenz-attractor-poi-light-painting"
          className={lk}
        >
          Lorenz attractor
        </Link>{" "}
        — there the coupling terms are nonlinear products of state variables,
        and the system is dissipative (energy leaks away). Euler&apos;s equations
        are conservative: two exact integrals of motion (T and L²) are preserved
        forever. The polhode is a <em>closed</em> algebraic curve, not a fractal
        attractor. The RK4 integrator must preserve these integrals to machine
        precision, or the quaternion orientation will drift and the animation will
        look wrong.
      </p>

      <h2>Euler&apos;s rigid body equations</h2>
      <pre>{`I₁ ω̇₁ = (I₂ − I₃) ω₂ ω₃
I₂ ω̇₂ = (I₃ − I₁) ω₃ ω₁
I₃ ω̇₃ = (I₁ − I₂) ω₁ ω₂

Conserved quantities:
  T   = ½(I₁ω₁² + I₂ω₂² + I₃ω₃²)   [kinetic energy]
  L²  = (I₁ω₁)² + (I₂ω₂)² + (I₃ω₃)²  [angular momentum squared]`}</pre>
      <p>
        Each right-hand side is a product of two angular velocities modulated by
        a moment difference. If the body is symmetric (I₁=I₂), the first two
        equations become ω̇₁ = (I₂−I₃)ω₂ω₃/I₁ and ω̇₂ = 0, and the third gives
        ω̇₃ = 0 — so ω₃ is constant and (ω₁, ω₂) precess as a circle at rate
        Ω_body = ω₃(I₃−I₁)/I₁. This is the <em>symmetric top</em>: a closed
        circular polhode, solvable in closed form using Euler angles.
      </p>
      <p>
        For the asymmetric top (all Iᵢ distinct), the polhode is a banana-shaped
        closed curve expressible via Jacobi elliptic functions — but we use RK4
        numerically for generality. Set PRESET to{" "}
        <code>"ASYMMETRIC"</code> (I₁=0.90, I₂=0.30, I₃=0.10) and the staff
        nutates visibly as it precesses.
      </p>

      <h2>The intermediate-axis instability (tennis-racket effect)</h2>
      <p>
        When I₁ &gt; I₂ &gt; I₃, rotation about the I₂ axis is unstable. Any tiny
        perturbation to ω — even rounding error — seeds an exponential departure.
        The angular velocity executes a heteroclinic orbit on the momentum sphere,
        swinging all the way to the opposite pole: the body flips 180° about its
        spin axis. Set PRESET to <code>"INTERMEDIATE"</code> (ω₀ = (0.02, 5.80,
        0.02)) to see the staff rotating smoothly, then abruptly tumbling, then
        recovering — repeatedly. Russian cosmonaut Dzhanibekov observed exactly
        this on a wing nut in orbital free-fall in 1985.
      </p>
      <p>
        This is a different kind of instability from the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-lorenz-attractor-poi-light-painting"
          className={lk}
        >
          Lorenz butterfly
        </Link>
        : the Lorenz instability is chaotic (sensitive to initial conditions,
        positive Lyapunov exponent). The intermediate-axis flip is
        <em> topologically deterministic</em> — every trajectory starting near
        the I₂ axis makes exactly the same flip sequence, just at a different
        phase.
      </p>

      <h2>Quaternion kinematics and why Euler angles break here</h2>
      <pre>{`dq/dt = ½ · q ⊗ [0, ω₁, ω₂, ω₃]

q = [qw, qx, qy, qz] (unit quaternion — lab-frame orientation)
ω in body frame

Expanded:
  dqw/dt = −½(qx·ω₁ + qy·ω₂ + qz·ω₃)
  dqx/dt = +½(qw·ω₁ − qz·ω₂ + qy·ω₃)
  dqy/dt = +½(qw·ω₂ + qz·ω₁ − qx·ω₃)
  dqz/dt = +½(qw·ω₃ − qy·ω₁ + qx·ω₂)`}</pre>
      <p>
        Euler angles (φ, θ, ψ) become singular at θ = 0° or 90° — gimbal lock.
        The intermediate-axis flip drives nutation θ through exactly these
        singular values: a gimbal-based integration would produce NaN quaternions
        and broken keyframes. The quaternion formulation avoids this entirely.
        The constraint ‖q‖ = 1 must be re-enforced after every RK4 substep; we
        divide by <code>np.linalg.norm(q)</code> at each k₂, k₃, k₄ correction
        and again at the end of each step. See how the same constraint appears in
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mathutils-quaternion-slerp-squad-vrm-retarget"
          className={lk}
        >
          quaternion SLERP/SQUAD retarget tutorial
        </Link>
        .
      </p>

      <h2>Blender keyframe mechanics</h2>
      <p>
        We set <code>staff.rotation_mode = &quot;QUATERNION&quot;</code> and call{" "}
        <code>staff.keyframe_insert(&quot;rotation_quaternion&quot;, frame=fi+1)</code>
        for each of the 241 stored orientations. The default BEZIER interpolation
        mode on quaternion FCurves is dangerous: BEZIER handles are computed
        independently per component, so the interpolated quaternion at
        intermediate frames may leave the unit sphere — producing shuddering,
        directional drift, or scale artefacts as Blender decomposes a non-unit
        quaternion into a rotation + scale. We force LINEAR interpolation
        immediately after baking:
      </p>
      <pre>{`if staff.animation_data and staff.animation_data.action:
    for fc in staff.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"`}</pre>
      <p>
        The same pattern appears in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-bvh-import-vrm-bone-remap-nla-bake-retarget"
          className={lk}
        >
          BVH → VRM bone remap tutorial
        </Link>
        , where imported BVH Euler angles are converted to quaternion keyframes
        to avoid gimbal lock at shoulder and wrist joints.
      </p>

      <h2>Poinsot&apos;s geometric construction</h2>
      <p>
        Poinsot (1834) proved that torque-free rotation is geometrically
        equivalent to the <em>inertia ellipsoid</em> (axes √I₁, √I₂, √I₃)
        rolling without slipping on the <em>invariable plane</em> perpendicular
        to the fixed angular momentum vector L. The contact point traces the
        polhode on the ellipsoid surface. Our amber POLY curve is the ω-space
        polhode: the trajectory of ω in the body principal-axis frame, scaled by
        POLHODE_SCALE = 0.10 m/(rad/s). For the symmetric preset it is a
        perfect circle; for asymmetric it is a closed banana.
      </p>
      <p>
        The polhode lives on the intersection of two quadric surfaces:
      </p>
      <pre>{`Energy ellipsoid:  I₁ω₁² + I₂ω₂² + I₃ω₃² = 2T  (constant)
Momentum sphere:   (I₁ω₁)² + (I₂ω₂)² + (I₃ω₃)² = L²  (constant)`}</pre>
      <p>
        Both T and L² must drift less than 10⁻⁵ relative across all integration
        steps, or the polhode drifts off its true algebraic curve. The console
        output of blueprint.py shows these values for validation. If either
        exceeds 10⁻⁴, reduce DT or increase N_SUB.
      </p>

      <h2>Connection to poi dynamics and the light-painting archive</h2>
      <p>
        A poi staff in free flight between throws is exactly a torque-free rigid
        body — there is no string tension, no air drag (at low ω), only the
        inertia tensor. Understanding the precession frequency helps the studio
        predict the orientation of the glowing tip when a camera shutter fires:
        for the asymmetric preset (ω₃ = 5.8 rad/s, I₁=0.90, I₃=0.10) the
        body-frame precession rate is Ω_body ≈ 5.8 × (0.10 − 0.90)/0.90 ≈
        −5.15 rad/s — the tip nods at ~0.82 Hz relative to the precessing axis.
        Compare the parametric Lissajous orbit in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-spring-pendulum-poi-lissajous-light-painting"
          className={lk}
        >
          Spring-Pendulum Poi tutorial
        </Link>{" "}
        — there the frequency ratio arises from ω₀ and ωₛ of the pendulum, here
        from the moment-of-inertia ratio.
      </p>
      <p>
        The action and NLA baking pattern (keyframe_insert → LINEAR → push to
        NLA) matches the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-action-nla-fcurve-keyframe-poi-performance-webxr"
          className={lk}
        >
          Poi Performance FCurve tutorial
        </Link>
        . Push the baked action to the NLA editor and layer multiple throws on
        separate NLA strips for a full choreography sequence.
      </p>
    </>
  );
}

const data = {
  date: "2026-07-25",
  title:
    "Python numpy — Euler Rigid Body: Torque-Free Spinning Top Precession, Nutation & Geometric Phase as Poi Staff Rotation (Blender 5.1)",
  lede: "Euler's body-frame equations for torque-free rotation are integrated with RK4 at 480 Hz alongside quaternion kinematics; 241 LINEAR quaternion keyframes are baked onto a poi staff cylinder, and the amber polhode trail (Poinsot's ω-space curve) is deposited as a POLY spline — three presets demonstrate the symmetric closed-form, asymmetric banana, and the intermediate-axis instability (tennis-racket effect).",
  body: Body,
  libraryPath:
    "blends/scripting/python-numpy-euler-rigid-body-spinning-top-precession-poi-staff/",
  steps: [
    {
      title: "Run blueprint.py — integration, staff, and polhode",
      body: "Open Blender 5.1 · Scripting workspace. Load `blueprint.py` and press **Run Script**.\n\nThe console prints:\n  `[blueprint] T_drift=<float>  L_drift=<float>`\n\nBoth must be < 1e-5. If either is > 1e-4, the polhode will drift off its algebraic curve. Fix: reduce DT to 1/960.0 or increase N_SUB to 40.\n\nThe scene builds: `HF_PoiStaff` cylinder + `HF_PoiHead` sphere child + `HF_Polhode` POLY curve. Select the staff and press Spacebar — you should see it spinning with correct precession.",
    },
    {
      title: "Verify conservation and quaternion health",
      body: "In the Python console after running blueprint.py:\n```python\nstaff = bpy.data.objects['HF_PoiStaff']\naction = staff.animation_data.action\nprint(len(action.fcurves))  # should be 4 (w, x, y, z)\nfc = action.fcurves[0]\nprint(fc.keyframe_points[0].co)  # (1.0, value_at_frame_1)\nprint(fc.keyframe_points[0].interpolation)  # LINEAR\n```\n\nAlso check quaternion unit-sphere at frame 120:\n```python\nscene = bpy.context.scene; scene.frame_set(120)\nq = staff.rotation_quaternion\nprint(q.magnitude)  # should be 1.0 to 6 decimal places\n```",
    },
    {
      title: "Switch to INTERMEDIATE preset — the tennis-racket flip",
      body: "Change `PRESET = \"INTERMEDIATE\"` at the top of blueprint.py and re-run. The initial ω is (0.02, 5.80, 0.02) — almost pure spin about the I₂ (intermediate) axis.\n\nPlay the animation. Around frame 60 the staff abruptly tumbles 180°, then recovers, then flips again. This is not a bug — it is the heteroclinic orbit on the momentum sphere, guaranteed by the topology of the Euler equations when I₁ > I₂ > I₃.\n\nThe flip period is T_flip ≈ π/Ω_body ≈ π × I₂/(I₁−I₃) × (1/ω₃_initial). For these parameters: T_flip ≈ 1.56 s = 37 frames. You should see 3–4 flips over 240 frames.",
    },
    {
      title: "Understand the polhode geometry",
      body: "Select `HF_Polhode` in the scene and enter Edit Mode. The POLY spline shows the trajectory of ω in the body-fixed principal-axis frame, scaled by 0.10 m/(rad/s).\n\nFor SYMMETRIC preset: a perfect circle in the ω₁-ω₂ plane. The circle radius is ω_transverse = |ω₀| × sin(θ_nutation) where θ_nutation is the angle between ω₀ and the I₃ spin axis.\n\nFor ASYMMETRIC preset: a closed banana curve with endpoints touching the momentum sphere at the ω₃ poles.\n\nFor INTERMEDIATE preset: a large looping curve that visits both hemispheres — the polhode crosses the equator of the momentum sphere, which is what the flip looks like in ω-space.",
    },
    {
      title: "Run record.py and make the screen recording",
      body: "Run `record.py` in the Scripting workspace. A camera is added, orbiting 40° around the staff over 240 frames, and the EEVEE viewport is rendered to `viewport.mp4`.\n\nFor the screen recording: follow `SCREEN-RECORDING-NOTES.md`. The key shot is the INTERMEDIATE preset showing the flip — a clean 10-second clip with three or four tumble-and-recover cycles makes a compelling standalone short.",
    },
  ],
  finalResult:
    "HF_PoiStaff: 241 LINEAR quaternion keyframes from RK4 integration of Euler rigid body equations at 480 Hz. HF_PoiHead: glowing cyan sphere child parented to staff tip. HF_Polhode: amber POLY curve showing the body-frame ω orbit (Poinsot polhode) at POLHODE_SCALE = 0.10 m/(rad/s). Three presets: SYMMETRIC (closed circle), ASYMMETRIC (banana, nutation visible), INTERMEDIATE (tennis-racket flip × 3–4 per 10 seconds). Conservation drift < 1e-5 in both T and L² validates RK4 accuracy.",
  variations: [
    "Set PRESET='SYMMETRIC' and add a second Euler integration with I3=0.40 (closer to I1). The body-frame precession rate Ω_body = ω₃(I₃−I₁)/I₁ changes sign — the polhode circle changes hand. Side-by-side comparison is a clear visual proof of the symmetric top precession formula.",
    "Add a NumPy-computed geometric (Hannay) phase: after each full polhode period, the body has rotated by an angle beyond the dynamical phase. Compute it as the solid angle subtended by the polhode loop on the momentum sphere (use numpy cross products to integrate the area). Insert an Empty and keyframe its Z-rotation by the accumulated geometric phase — the Empty's drift relative to a pure dynamical rotation visualises Berry's phase for classical mechanics.",
    "Export the staff animation as a GLB for WebXR: `bpy.ops.export_scene.gltf(filepath=..., export_animations=True, export_nla_strips=False, export_apply=False)`. In Three.js, load the GLB and play the AnimationClip — the quaternion stream transfers exactly. See the Poi Performance FCurve tutorial for the NLA strip pattern that combines multiple throws into one clip.",
    "Build a 2×2 grid of four simultaneous presets (two SYMMETRIC, one ASYMMETRIC, one INTERMEDIATE) using bpy.ops.object.duplicate() and offset each by (1.2, 0, 0). Give each its own quaternion action. A synchronized render shows all four dynamic regimes in one frame — a physics teaching tool.",
    "Replace the POLY polhode with a Geometry Nodes setup using GN Points to Curves from the poi trail tutorial — the nodes can colour the trail by ω magnitude (red=fast, blue=slow) using a Store Named Attribute + colour ramp, giving the polhode an energy-density visual.",
  ],
  troubleshooting: [
    {
      symptom: "T_drift or L_drift > 1e-3 — polhode visibly drifts from a closed curve",
      cause:
        "DT is too large or N_SUB is too small. Euler's equations have rapid variation near the intermediate-axis flip — small step error compounds over many orbits.",
      fix: "Reduce DT from 1/480 to 1/960 (halves error per step, quadruples cost). Alternatively increase N_SUB from 20 to 40. Re-check conservation diagnostics in the console — target < 1e-5.",
    },
    {
      symptom: "Staff shudders or scales unexpectedly during animation playback",
      cause:
        "BEZIER interpolation on quaternion FCurves was not forced to LINEAR. Blender's BEZIER handles decompose the interpolated quaternion as rotation × scale, causing visible artefacts when ‖q‖ ≠ 1.",
      fix: "In the Python console: `for fc in bpy.data.objects['HF_PoiStaff'].animation_data.action.fcurves:\\n    for kp in fc.keyframe_points:\\n        kp.interpolation = 'LINEAR'` then re-scrub the timeline.",
    },
    {
      symptom: "No intermediate-axis flips visible in INTERMEDIATE preset",
      cause:
        "The initial perturbation (ω₁=0.02, ω₃=0.02) may be smaller than floating-point rounding in some environments, or N_FRAMES is too short to reach the first flip.",
      fix: "Increase the perturbation to ω₁=0.05, ω₃=0.05. Or extend N_FRAMES to 480 to guarantee 6–8 flip cycles. Also verify I₁=0.90 > I₂=0.50 > I₃=0.10 — the instability requires strict inequality.",
    },
  ],
  externalLinks: [
    {
      label:
        "Euler 1758 — Du mouvement de rotation des corps solides autour d'un axe variable — Public Domain",
      href: "https://scholarlycommons.pacific.edu/euler-works/336/",
    },
    {
      label:
        "numpy — linear algebra and array operations — BSD-3-Clause — NumPy Developers",
      href: "https://github.com/numpy/numpy",
    },
    {
      label:
        "Blender Python API 5.1 — rotation_quaternion & keyframe_insert — CC-BY-SA-4.0 — Blender Foundation",
      href: "https://docs.blender.org/api/5.1/bpy.types.Object.html#bpy.types.Object.rotation_quaternion",
    },
  ],
  relatedTutorials: [
    {
      label:
        "Lorenz Strange Attractor — Butterfly Chaos & Sensitive Divergence for Poi Light-Painting",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-lorenz-attractor-poi-light-painting",
    },
    {
      label:
        "Spring-Pendulum Poi Tether — Elastic Orbit with Air Drag & Lissajous Light-Painting Path",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-spring-pendulum-poi-lissajous-light-painting",
    },
    {
      label:
        "Python bpy — BVH Import → VRM Bone Remap → NLA Bake: Dance & Poi Motion Capture Retargeting Pipeline",
      href: "/tutorials/blender-tutorial-python-bpy-bvh-import-vrm-bone-remap-nla-bake-retarget",
    },
    {
      label:
        "Python bpy — Action & NLA FCurve Keyframe Insertion: Poi Performance Animated GLB",
      href: "/tutorials/blender-tutorial-python-bpy-action-nla-fcurve-keyframe-poi-performance-webxr",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-python-numpy-euler-rigid-body-spinning-top-precession-poi-staff",
    title: data.title,
    lede: data.lede,
    date: data.date,
    tags: [
      "blender",
      "scripting",
      "simulation",
      "physics",
      "quaternion",
      "poi",
      "rigid-body",
      "animation",
    ],
    body: Body,
  },
  data,
);
