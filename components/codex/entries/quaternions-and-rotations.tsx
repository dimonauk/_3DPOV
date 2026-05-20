export default function QuaternionsAndRotations() {
  return (
    <>
      <p>
        A quaternion is a four-number bundle{" "}
        <code className="font-mono text-chrome-200">
          q = w + xi + yj + zk
        </code>{" "}
        that encodes a rotation in three dimensions without the
        ambiguities, singularities and interpolation pathologies of
        rotation matrices or Euler angles. Sir William Rowan Hamilton
        invented them on 16 October 1843 while walking along the Royal
        Canal in Dublin, scratching the defining relation{" "}
        <code className="font-mono text-chrome-200">
          i&sup2; = j&sup2; = k&sup2; = ijk = &minus;1
        </code>{" "}
        into the stonework of Brougham Bridge with a penknife.
        Computer graphics adopted them roughly a century and a half later,
        when Ken Shoemake&rsquo;s 1985 SIGGRAPH paper{" "}
        <em>Animating Rotation with Quaternion Curves</em> showed the
        animation community why every alternative parameterisation was
        worse.<sup>1</sup>
      </p>
      <p>
        There are four ways to describe a rotation in 3D, and each
        trades different things away:
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>Rotation matrices</strong> &mdash; a 3&times;3
          orthogonal matrix with determinant +1. Composes by matrix
          multiplication, applies to a vector by matrix multiplication,
          numerically stable for a single rotation, no singularities.
          Costs nine numbers to store a three-degree-of-freedom object,
          drifts off the manifold of valid rotations under repeated
          floating-point composition (requires periodic
          re-orthogonalisation), and offers no natural way to
          interpolate between two rotations.
        </li>
        <li>
          <strong>Euler angles</strong> &mdash; three angles
          (roll, pitch, yaw, or yaw-pitch-roll, or any of twelve other
          conventions) applied as a sequence of axis rotations.
          Three numbers, human-readable, trivial to type into a config
          file. Suffers from <strong>gimbal lock</strong> at certain
          orientations, depends entirely on the chosen axis ordering,
          and interpolates badly &mdash; linear blend of two Euler
          triples does not produce constant angular velocity and can
          do something visibly wrong en route.
        </li>
        <li>
          <strong>Axis-angle</strong> &mdash; a unit vector{" "}
          <code className="font-mono text-chrome-200">n&#770;</code>{" "}
          and an angle &theta;. Four numbers, conceptually the cleanest
          description (&ldquo;rotate by this much around this axis&rdquo;),
          and the natural form coming out of physics. Awkward to
          compose: rotating by axis-angle A then axis-angle B does not
          give a tidy axis-angle for the combined rotation without
          conversion. This is the form the matrix-exponential map
          consumes.
        </li>
        <li>
          <strong>Unit quaternions</strong> &mdash; four numbers, no
          gimbal lock, compose by quaternion multiplication, interpolate
          smoothly along the great-circle arc on the unit hypersphere,
          and double-cover the rotation group SO(3) so q and &minus;q
          describe the same rotation. The price is a small algebra to
          learn and the need to renormalise occasionally to keep the
          quaternion on the unit sphere.
        </li>
      </ul>
      <p>
        <strong>Gimbal lock</strong> is the Euler-angle pathology
        worth understanding before reaching for quaternions. The three
        Euler axes are applied in sequence; the second rotation moves
        the third axis along with it; at certain orientations the
        first and third axes align and the system loses one degree of
        freedom. A camera tilted ninety degrees down can no longer
        distinguish yaw from roll. The Apollo 11 inertial measurement
        unit famously came within a few degrees of locking on the way
        to the Moon. Quaternions sidestep this entirely because they
        do not encode rotation as a sequence of axis applications;
        they encode it as a single point on a four-dimensional
        hypersphere with no preferred axis ordering and no degenerate
        configurations.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">
        Quaternion algebra in three lines
      </h2>
      <p>
        A quaternion has a scalar part{" "}
        <code className="font-mono text-chrome-200">w</code> and a
        vector part{" "}
        <code className="font-mono text-chrome-200">
          (x, y, z)
        </code>
        . The basis elements satisfy Hamilton&rsquo;s relation{" "}
        <code className="font-mono text-chrome-200">
          i&sup2; = j&sup2; = k&sup2; = ijk = &minus;1
        </code>
        , from which the full multiplication table follows. The{" "}
        <strong>conjugate</strong> is{" "}
        <code className="font-mono text-chrome-200">
          q* = w &minus; xi &minus; yj &minus; zk
        </code>
        , the <strong>norm</strong> is{" "}
        <code className="font-mono text-chrome-200">
          |q| = &radic;(w&sup2; + x&sup2; + y&sup2; + z&sup2;)
        </code>
        , and a <strong>unit quaternion</strong>{" "}
        (|q| = 1) of the form{" "}
        <code className="font-mono text-chrome-200">
          q = cos(&theta;/2) + sin(&theta;/2)&middot;(n&#770;<sub>x</sub>i +
          n&#770;<sub>y</sub>j + n&#770;<sub>z</sub>k)
        </code>{" "}
        represents a rotation by &theta; around the unit axis{" "}
        <code className="font-mono text-chrome-200">n&#770;</code>.
        The half-angle is the bit that catches everyone the first
        time; it is also why quaternions double-cover SO(3).
      </p>
      <p>
        To rotate a vector{" "}
        <code className="font-mono text-chrome-200">v</code>, embed it
        as a pure quaternion{" "}
        <code className="font-mono text-chrome-200">
          p = 0 + v<sub>x</sub>i + v<sub>y</sub>j + v<sub>z</sub>k
        </code>{" "}
        and compute{" "}
        <code className="font-mono text-chrome-200">
          p&prime; = q &middot; p &middot; q*
        </code>
        . The vector part of{" "}
        <code className="font-mono text-chrome-200">p&prime;</code>{" "}
        is the rotated vector. Composing two rotations is a single
        quaternion multiplication{" "}
        <code className="font-mono text-chrome-200">
          q<sub>total</sub> = q<sub>2</sub> &middot; q<sub>1</sub>
        </code>
        , reading right-to-left.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">
        Worked example: rotating (1, 0, 0) by 90&deg; around y
      </h2>
      <p>
        Two routes, same answer. Take the vector{" "}
        <code className="font-mono text-chrome-200">v = (1, 0, 0)</code>
        , rotate by 90&deg; around the y-axis, expect to land on{" "}
        <code className="font-mono text-chrome-200">(0, 0, &minus;1)</code>{" "}
        under the right-handed convention that y points up and a
        positive rotation goes from +x toward &minus;z.
      </p>
      <p>
        <strong>Route one &mdash; the rotation matrix.</strong>{" "}
        The standard 3&times;3 y-axis rotation with &theta; = &pi;/2
        is:
      </p>
      <pre className="font-mono text-sm bg-warm-black-900 p-4 my-2 overflow-x-auto">
        {`R_y(90°) = ⎡ cos θ   0   sin θ ⎤   ⎡ 0   0   1 ⎤
           ⎢   0     1     0   ⎥ = ⎢ 0   1   0 ⎥
           ⎣ -sin θ  0   cos θ ⎦   ⎣ -1  0   0 ⎦

R_y · v  = ⎡ 0  0  1 ⎤ ⎡ 1 ⎤   ⎡  0 ⎤
           ⎢ 0  1  0 ⎥ ⎢ 0 ⎥ = ⎢  0 ⎥
           ⎣ -1 0  0 ⎦ ⎣ 0 ⎦   ⎣ -1 ⎦`}
      </pre>
      <p>
        <strong>Route two &mdash; the quaternion.</strong> Build{" "}
        <code className="font-mono text-chrome-200">
          q = cos(45&deg;) + sin(45&deg;)&middot;j = &radic;2/2 + &radic;2/2&middot;j
        </code>
        . Then{" "}
        <code className="font-mono text-chrome-200">
          q* = &radic;2/2 &minus; &radic;2/2&middot;j
        </code>
        . Embed the vector as{" "}
        <code className="font-mono text-chrome-200">p = i</code>{" "}
        (since v has only an x-component). Now compute{" "}
        <code className="font-mono text-chrome-200">q &middot; p</code>{" "}
        first, using{" "}
        <code className="font-mono text-chrome-200">ji = &minus;k</code>:
      </p>
      <pre className="font-mono text-sm bg-warm-black-900 p-4 my-2 overflow-x-auto">
        {`q · p = (√2/2 + √2/2 · j) · i
      = √2/2 · i + √2/2 · ji
      = √2/2 · i − √2/2 · k

(q · p) · q* = (√2/2 · i − √2/2 · k) · (√2/2 − √2/2 · j)
             = ½ · i − ½ · ij − ½ · k + ½ · kj
             = ½ · i − ½ · k − ½ · k − ½ · i      (ij = k, kj = -i)
             = −k

vector part = (0, 0, −1).`}
      </pre>
      <p>
        Both routes converge on{" "}
        <code className="font-mono text-chrome-200">(0, 0, &minus;1)</code>
        . The quaternion path took more written algebra than the
        matrix path, but the algebra was four multiplications and an
        addition, and the result drops out without ever needing to
        construct a 3&times;3 matrix or worry about which axis order
        Euler angles used.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">
        SLERP &mdash; constant angular velocity, free
      </h2>
      <p>
        Spherical linear interpolation, named and formalised in
        Shoemake&rsquo;s 1985 paper, blends two unit quaternions
        along the great-circle arc on the 4D unit hypersphere:
      </p>
      <pre className="font-mono text-sm bg-warm-black-900 p-4 my-2 overflow-x-auto">
        {`slerp(q₀, q₁, t) = (sin((1−t)·Ω) / sin Ω) · q₀
                 + (sin(t·Ω)     / sin Ω) · q₁

where  cos Ω = q₀ · q₁   (the 4D dot product).`}
      </pre>
      <p>
        SLERP produces <strong>constant angular velocity</strong>
        &mdash; the rotation sweeps through equal angles in equal
        time. A naive linear interpolation between two Euler triples
        produces nothing of the sort; the rotation speeds up,
        slows down, and may visibly wobble. A linear blend between
        two quaternions followed by a renormalisation (NLERP) is
        cheaper and usually close enough for short arcs, but SLERP
        is the canonical answer for camera moves, bone keyframes,
        and any rotation where the eye will notice the inconstancy.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">
        The exponential map &mdash; the Lie-algebra view
      </h2>
      <p>
        The deeper structure is this. The rotation group SO(3) is a
        Lie group; its tangent space at the identity is the Lie
        algebra so(3), consisting of 3&times;3 skew-symmetric
        matrices. The matrix exponential{" "}
        <code className="font-mono text-chrome-200">
          R = exp([&omega;]<sub>&times;</sub>)
        </code>{" "}
        maps an axis-angle vector{" "}
        <code className="font-mono text-chrome-200">&omega; = &theta;n&#770;</code>{" "}
        (encoded as the skew-symmetric matrix{" "}
        <code className="font-mono text-chrome-200">
          [&omega;]<sub>&times;</sub>
        </code>
        ) to its rotation matrix &mdash; the closed form is
        Rodrigues&rsquo; rotation formula. For quaternions the
        equivalent is{" "}
        <code className="font-mono text-chrome-200">
          q = exp(&theta;/2 &middot; n&#770;)
        </code>
        , the matching half-angle dropping out of the algebra. This
        view matters when integrating angular velocity over time
        (e.g. IMU dead-reckoning on the drone), composing many
        small rotations stably, and writing the optimiser updates
        that nudge a rotation on the manifold rather than in its
        ambient parameter space.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-2">
        Where rotations live in Holoflow&rsquo;s pipelines
      </h2>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>Drone gimbal control.</strong> The DJI Mini 5 Pro&rsquo;s
          three-axis gimbal is commanded in Euler-angle space at the
          flight controller, but the internal IMU fusion is
          quaternion-based to keep the horizon level through fast
          yaw without locking. See future entry{" "}
          <code className="font-mono text-chrome-200">
            drone-control-mathematics
          </code>
          .
        </li>
        <li>
          <strong>WebXR head tracking.</strong> The{" "}
          <code className="font-mono text-chrome-200">XRPose</code>{" "}
          object exposes orientation as a quaternion (
          <code className="font-mono text-chrome-200">DOMPointReadOnly</code>{" "}
          {`{x, y, z, w}`}) for exactly the no-gimbal-lock reason
          covered above. The headset rolls, pitches and yaws freely
          and the runtime never sees a singularity. Future entry{" "}
          <code className="font-mono text-chrome-200">
            webxr-pose-estimation
          </code>{" "}
          covers the prediction maths.
        </li>
        <li>
          <strong>Three.js camera moves.</strong>{" "}
          <code className="font-mono text-chrome-200">
            THREE.Quaternion.slerp()
          </code>{" "}
          is the standard tool for tweening a camera between two
          orientations on a cinematic dolly. The Three.js{" "}
          <code className="font-mono text-chrome-200">Object3D</code>{" "}
          stores rotation internally as a quaternion regardless of
          which setter (
          <code className="font-mono text-chrome-200">.rotation</code>
          ,{" "}
          <code className="font-mono text-chrome-200">.quaternion</code>
          ) you reach for first.
        </li>
        <li>
          <strong>Gaussian splat training.</strong> Each splat in a{" "}
          <code className="font-mono text-chrome-200">.ply</code>{" "}
          carries a rotation quaternion{" "}
          <code className="font-mono text-chrome-200">
            (rot_0, rot_1, rot_2, rot_3)
          </code>{" "}
          alongside its position, scale and spherical-harmonic
          colour. The differentiable rasteriser back-propagates
          gradients through the quaternion, and the optimiser
          renormalises after every step to keep it unit-length.
          Storing rotation as Euler triples would have made the
          gradients unusable near singular orientations &mdash; one
          of the quiet reasons the technique works at all. See{" "}
          <strong>
            <a
              href="/codex/gaussian-splatting"
              className="text-pink-200 underline underline-offset-4"
            >
              gaussian splatting
            </a>
          </strong>
          .
        </li>
        <li>
          <strong>VRM bone orientation.</strong> Every bone in a{" "}
          <strong>
            <a
              href="/codex/vrm-virtual-reality-model"
              className="text-pink-200 underline underline-offset-4"
            >
              VRM
            </a>
          </strong>{" "}
          humanoid armature stores its local rotation as a
          quaternion. SLERP between keyframe quaternions is what
          makes a VRChat avatar wave its hand smoothly instead of
          twitching through the singular wrist orientations. The
          studio&rsquo;s Aura puppet (
          <code className="font-mono text-chrome-200">nanny.vrm</code>
          ) is driven the same way.
        </li>
      </ul>
      <p>
        Forward reading: the matrix machinery sits in{" "}
        <strong>
          <a
            href="/codex/linear-algebra-essentials"
            className="text-pink-200 underline underline-offset-4"
          >
            linear-algebra-essentials
          </a>
        </strong>
        , the drone-control loop in{" "}
        <strong>
          <a
            href="/codex/drone-control-mathematics"
            className="text-pink-200 underline underline-offset-4"
          >
            drone-control-mathematics
          </a>
        </strong>
        , and the headset-tracking maths in{" "}
        <strong>
          <a
            href="/codex/webxr-pose-estimation"
            className="text-pink-200 underline underline-offset-4"
          >
            webxr-pose-estimation
          </a>
        </strong>
        .<sup>2</sup>
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          Hamilton spent the better part of a decade trying to make
          triples (three numbers) work as a 3D analogue of complex
          numbers, and could not get multiplication to behave. The
          1843 insight was that the algebra closed if you allowed a
          fourth dimension and gave up commutativity &mdash;{" "}
          <code className="font-mono text-chrome-200">ij = k</code>{" "}
          but{" "}
          <code className="font-mono text-chrome-200">
            ji = &minus;k
          </code>
          . He wrote the rest of his life on the subject; the
          graphics community got there in 1985 and has not looked
          back. 3Blue1Brown&rsquo;s 2018 interactive video{" "}
          <em>Visualizing quaternions</em> is the modern intuition
          aid.
        </li>
        <li>
          The double cover (q and &minus;q describing the same
          rotation) is occasionally a numerical trap. SLERP between
          a quaternion and its negation will sweep the long way
          around the sphere rather than the short way; every
          serious implementation flips one operand to the
          shorter-arc hemisphere before the interpolation. Three.js
          does this; Unity does this; the studio&rsquo;s own splat
          tools do this. It is the kind of detail that does not
          appear in the algebra but bites the first time a camera
          pans &ldquo;the wrong way round&rdquo; on a smooth move.
        </li>
      </ol>
    </>
  );
}
