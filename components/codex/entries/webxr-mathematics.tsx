export default function WebxrMathematics() {
  return (
    <>
      <p>
        A head-mounted display is, mathematically, three problems
        stacked on top of one another and pretending to be a single
        device. Underneath it is a stereo pair of pinhole cameras with
        their own intrinsics; in the middle is a six-degree-of-freedom
        pose estimator fusing a gyroscope, an accelerometer, a clutch
        of inside-out cameras, and (on the more expensive units) a
        magnetometer; on top of it sits a presentation pipeline that
        re-projects last frame&rsquo;s render to cover this
        frame&rsquo;s pose. The WebXR Device API is the seam that
        hands those three subsystems to a browser scene as a tidy
        stream of <code className="font-mono text-chrome-200">XRFrame</code>{" "}
        objects. This entry is the maths under the seam.<sup>1</sup>
      </p>

      <p>
        <strong>Per-eye camera intrinsics.</strong> Each lens-and-panel
        pairing inside a headset behaves, near enough, like a pinhole
        camera with intrinsics{" "}
        <code className="font-mono text-chrome-200">
          K = [[f_x, s, c_x], [0, f_y, c_y], [0, 0, 1]]
        </code>
        : focal lengths{" "}
        <code className="font-mono text-chrome-200">f_x, f_y</code>{" "}
        in pixel units, principal point{" "}
        <code className="font-mono text-chrome-200">(c_x, c_y)</code>{" "}
        where the optical axis pierces the panel, and a skew{" "}
        <code className="font-mono text-chrome-200">s</code> that is
        zero for any sensor that isn&rsquo;t parallelogram-shaped (in
        practice: always). On a Quest-class HMD the per-eye panel is
        2064&times;2208 pixels with roughly 110&deg; horizontal field
        of view, which gives a focal length of about{" "}
        <code className="font-mono text-chrome-200">f_x &asymp; 723</code>{" "}
        pixels &mdash; recoverable through the headset&rsquo;s
        factory calibration and surfaced to WebXR as the projection
        matrix on each{" "}
        <code className="font-mono text-chrome-200">XRView</code>. The
        application doesn&rsquo;t see the intrinsics as a 3&times;3
        matrix; it sees them already baked into a 4&times;4 projection
        matrix that takes view-space points to clip-space pixels in
        one multiply.<sup>2</sup>
      </p>

      <p>
        <strong>Head pose: 6-DoF in homogeneous form.</strong> The
        headset reports its pose as a position{" "}
        <code className="font-mono text-chrome-200">(x, y, z)</code>{" "}
        in metres and an orientation as a unit quaternion{" "}
        <code className="font-mono text-chrome-200">
          q = (w, x, y, z)
        </code>{" "}
        normalised so{" "}
        <code className="font-mono text-chrome-200">
          w&sup2; + x&sup2; + y&sup2; + z&sup2; = 1
        </code>
        . WebXR exposes this through{" "}
        <code className="font-mono text-chrome-200">
          XRFrame.getViewerPose(referenceSpace)
        </code>
        , which returns an{" "}
        <code className="font-mono text-chrome-200">XRViewerPose</code>{" "}
        whose <code className="font-mono text-chrome-200">transform</code>{" "}
        carries both a{" "}
        <code className="font-mono text-chrome-200">position</code>{" "}
        DOMPoint and an{" "}
        <code className="font-mono text-chrome-200">orientation</code>{" "}
        DOMPoint holding the quaternion. The pose composes with each
        eye&rsquo;s{" "}
        <code className="font-mono text-chrome-200">view.transform</code>{" "}
        (the inter-pupillary offset and any per-eye toe-in) to give
        the two view matrices the renderer needs, one per eye, both
        in the same world frame. Cross-reference{" "}
        <a
          href="/codex/quaternions-and-rotations"
          className="text-pink-200 underline underline-offset-4"
        >
          quaternions and rotations
        </a>{" "}
        for why the orientation is parameterised as four numbers
        rather than three Euler angles.
      </p>

      <p>
        <strong>IMU fusion: where the pose actually comes from.</strong>{" "}
        The inertial measurement unit inside an HMD is two
        sensor families running at kilohertz rates. The gyroscope
        reports angular velocity{" "}
        <code className="font-mono text-chrome-200">&omega;</code>{" "}
        in radians per second; integrating it gives orientation, but
        any bias in the gyro&rsquo;s zero-rate output drifts &mdash;
        a typical MEMS gyro accumulates a degree or two of error per
        minute if you trust it alone. The accelerometer reports the
        sum of gravity and linear acceleration; at rest the gravity
        vector points down in the world frame and gives an absolute
        reference for pitch and roll, but it&rsquo;s noisy and
        confused by any actual motion of the head. The headset
        combines them so the gyro carries the fast, smooth
        orientation changes and the accelerometer corrects the slow
        drift around the gravity axis. The two canonical recipes are
        the <em>complementary filter</em> &mdash;{" "}
        <code className="font-mono text-chrome-200">
          q&#7596; = &alpha; &middot; integrate(q&#7595;, &omega;, &Delta;t) + (1 &minus; &alpha;) &middot; accelOrientation
        </code>{" "}
        with{" "}
        <code className="font-mono text-chrome-200">&alpha; &asymp; 0.98</code>{" "}
        &mdash; and the <em>extended Kalman filter</em>, which
        maintains a covariance of the pose state and lets the maths
        decide how much to trust each sensor at each tick. Sebastian
        Madgwick&rsquo;s 2010 IMU paper sits between the two: an
        analytic gradient-descent step that&rsquo;s cheaper than an
        EKF and more correct than a naive complementary filter, and
        is what most consumer headsets actually run on the IMU
        thread.<sup>3</sup>
      </p>

      <p>
        <strong>Yaw drift and the visual fix.</strong> The gravity
        vector pins pitch and roll, but it tells you nothing about
        heading: yaw around the gravity axis drifts freely. Three
        ways to correct it. A magnetometer reads the Earth&rsquo;s
        field and gives an absolute compass heading, although it
        wobbles inside buildings and dies near speakers and motors.
        A camera looking at the world recovers heading from the
        scene itself &mdash; track a feature, see how its bearing
        changes between frames, and the yaw rate falls out of the
        geometry. Modern HMDs use the second route: <em>visual-
        inertial odometry</em> (VIO), where the inside-out tracking
        cameras feed a feature tracker that locks the world frame
        and the IMU handles everything in between camera frames.
        Quest 3 has four passthrough cameras; Vision Pro has six;
        Steam Frame has four. The number of cameras goes up when
        the manufacturer wants robust tracking in dim or
        feature-poor environments, because more cameras means more
        chances of seeing enough texture to lock onto. The maths
        of feature tracking is{" "}
        <a
          href="/codex/projective-geometry-essentials"
          className="text-pink-200 underline underline-offset-4"
        >
          projective geometry
        </a>
        ; the maths of fusing the camera result with the IMU is
        an EKF whose state grows to include feature positions and
        camera-to-IMU calibration. The shape of the algorithm is
        what people mean by &ldquo;SLAM&rdquo;.<sup>4</sup>
      </p>

      <p>
        <strong>Stereoscopy and the inter-pupillary distance.</strong>{" "}
        Adult IPDs run from about 54 mm at the small end to 74 mm at
        the large; the modal figure is somewhere near 63 mm. Each
        eye sees a view from its own optical centre, shifted
        sideways from the head pose by{" "}
        <code className="font-mono text-chrome-200">&plusmn;IPD/2</code>
        . That shift is what makes the rendered scene have depth: a
        point at infinity projects identically in both eyes, and a
        point one metre away projects to slightly different pixels
        in the two panels &mdash; the <em>disparity</em> &mdash; and
        the brain reads disparity as depth. WebXR carries the
        per-eye offset in the{" "}
        <code className="font-mono text-chrome-200">XRView.transform</code>{" "}
        of each view returned by{" "}
        <code className="font-mono text-chrome-200">
          viewerPose.views
        </code>
        ; the application never has to know the user&rsquo;s actual
        IPD, only that it must respect each view&rsquo;s transform
        when rendering.<sup>5</sup>
      </p>

      <p>
        <strong>A worked example.</strong> Take a world point one
        metre directly in front of the user at height equal to the
        eyes: in head-local coordinates{" "}
        <code className="font-mono text-chrome-200">X = (0, 0, &minus;1)</code>{" "}
        (right-handed, &minus;z forward). IPD is 63 mm so each eye
        sits at{" "}
        <code className="font-mono text-chrome-200">
          (&plusmn;0.0315, 0, 0)
        </code>{" "}
        in the same frame. The left-eye view of the point is{" "}
        <code className="font-mono text-chrome-200">
          X &minus; (&minus;0.0315, 0, 0) = (0.0315, 0, &minus;1)
        </code>
        ; the right-eye view is{" "}
        <code className="font-mono text-chrome-200">
          (&minus;0.0315, 0, &minus;1)
        </code>
        . With a focal length{" "}
        <code className="font-mono text-chrome-200">f = 1 m</code> (in
        the same units as the scene) and the principal point at the
        panel centre, the projection by similar triangles is{" "}
        <code className="font-mono text-chrome-200">u = f &middot; x / |z|</code>
        : the left eye projects the point to{" "}
        <code className="font-mono text-chrome-200">
          u_L = 1 &middot; 0.0315 / 1 = +0.0315 m
        </code>{" "}
        of horizontal offset from its principal point, and the right
        eye to{" "}
        <code className="font-mono text-chrome-200">
          u_R = &minus;0.0315 m
        </code>
        . The disparity is{" "}
        <code className="font-mono text-chrome-200">
          u_L &minus; u_R = 0.063 m = IPD
        </code>
        , which is exactly the geometry one expects: at one focal
        length distance, the disparity equals the baseline. Push the
        point to two metres and the disparity halves; push it to
        infinity and the disparity goes to zero. The brain reads
        disparity through the optics as a depth cue, calibrated
        against its own IPD, and that&rsquo;s the headline trick of
        the whole stereoscopic enterprise.
      </p>

      <p>
        <strong>Vergence-accommodation conflict.</strong> Two
        oculomotor systems normally co-vary in the real world: the
        eyes <em>converge</em> on a near object (rotate inwards) and
        simultaneously <em>accommodate</em> to it (the crystalline
        lens thickens to focus light from that distance onto the
        retina). In an HMD the convergence cue is correct &mdash;
        the disparity tells the eyes to converge on the virtual
        depth &mdash; but the accommodation cue is wrong, because
        the physical light is coming from the panel a few
        centimetres in front of the eye and the lens has to
        accommodate to <em>that</em> distance. The two cues
        disagree, the visual system burns extra effort trying to
        reconcile them, and the user gets the headache and nausea
        that the literature politely calls &ldquo;visual fatigue&rdquo;
        and Cobb &amp; Hoffman name as the canonical eye-strain
        culprit. Light-field displays and varifocal HMDs are the
        long-term fix; for everything shipping today, the studio
        designs around it by keeping reading-distance content at
        comfortable virtual depths (no closer than about 0.5 m) and
        avoiding rapid depth changes that force the eyes to
        re-converge against a fixed accommodation.<sup>6</sup>
      </p>

      <p>
        <strong>Foveated rendering, in numbers.</strong> The retina
        is wildly non-uniform. The fovea covers about &plusmn;1&deg;
        of arc at the centre of gaze and resolves around 60 cycles
        per degree of grating; at 10&deg; eccentricity the acuity
        has dropped to perhaps a quarter of that, and at 30&deg;
        less than a tenth. The fall-off is roughly linear with
        eccentricity if you measure in <em>cortical magnification
        units</em> &mdash; how much primary visual cortex an arcmin
        of retina gets &mdash; and it&rsquo;s the load-bearing
        result behind every foveated renderer. A practical falloff
        is{" "}
        <code className="font-mono text-chrome-200">
          PPD(e) = PPD_0 / (1 + k &middot; e)
        </code>{" "}
        with{" "}
        <code className="font-mono text-chrome-200">k &asymp; 0.3</code>
        : at 0&deg; the foveation region renders at full
        pixels-per-degree, at 10&deg; it&rsquo;s at a quarter, at
        30&deg; at a tenth. Variable-rate shading exploits this by
        running one fragment shader per N&times;N tile in the
        periphery and one per pixel in the centre. The Vision Pro
        compositor runs at 5 PPD in the periphery and 40 PPD in the
        centre with the foveation region moving as the eyes do; the
        Quest 3 picks a fixed centre region instead. See the{" "}
        <a
          href="/codex/foveated-rendering"
          className="text-pink-200 underline underline-offset-4"
        >
          foveated rendering
        </a>{" "}
        entry for the shipping-hardware story.<sup>7</sup>
      </p>

      <p>
        <strong>Reprojection &mdash; timewarp and spacewarp.</strong>{" "}
        The render takes finite time. If the application asks for
        90 Hz the budget per frame is 11.1 ms; if it misses, the
        compositor still has to put pixels on the panel at the
        scan-out deadline. The fix is to render once into a wider
        buffer and, at the last moment before scan-out, sample
        from that buffer using the <em>current</em> head pose
        rather than the pose the frame was rendered against. The
        mathematical operation is a 2D image warp parameterised by
        the orientation delta between &ldquo;pose at render
        start&rdquo; and &ldquo;pose at scan-out&rdquo;; for small
        deltas it&rsquo;s a homography. That&rsquo;s <em>asynchronous
        timewarp</em> (ATW). <em>Asynchronous spacewarp</em> (ASW)
        extends it with a motion-vector pass that lets the
        compositor extrapolate translation as well as rotation,
        which lets a 45 Hz render look like a 90 Hz one on a
        budget-constrained scene. The application doesn&rsquo;t
        wire this directly &mdash; the WebXR runtime handles it on
        the compositor side &mdash; but the application should
        respect that any depth or motion the renderer draws on top
        of the warped buffer must be drawn consistently, because
        the warp will sample from it.<sup>8</sup>
      </p>

      <p>
        <strong>Where this lives in Holoflow.</strong> The headpose
        driver and the IMU-fusion shape live at{" "}
        <code className="font-mono text-chrome-200">lib/tracking/</code>{" "}
        as the WebXR-side adapter to the broader tracking registry
        in <code className="font-mono text-chrome-200">docs/TRACKING.md</code>
        ; the head-pose capability surfaces through{" "}
        <code className="font-mono text-chrome-200">
          lib/capabilities/input/headpose.ts
        </code>{" "}
        as a source the renderer subscribes to. The scene composition
        itself &mdash; the two-view render, the eye-transform respect,
        the per-device foveation request &mdash; lives in{" "}
        <code className="font-mono text-chrome-200">
          components/xr-scene/
        </code>{" "}
        and is the SceneStage the rest of the Holoflow surfaces
        bind to. The per-device parameters (IPD, refresh rate,
        framebuffer scale, foveation policy) come from the device
        targets doc at{" "}
        <code className="font-mono text-chrome-200">
          docs/WEBXR-DEVICE-TARGETS.md
        </code>
        , which is the binding reference the renderer reads at
        session start.
      </p>

      <p>
        <strong>Cross-references:</strong>{" "}
        <a
          href="/codex/linear-algebra-essentials"
          className="text-pink-200 underline underline-offset-4"
        >
          linear algebra essentials
        </a>
        ,{" "}
        <a
          href="/codex/projective-geometry-essentials"
          className="text-pink-200 underline underline-offset-4"
        >
          projective geometry essentials
        </a>
        ,{" "}
        <a
          href="/codex/quaternions-and-rotations"
          className="text-pink-200 underline underline-offset-4"
        >
          quaternions and rotations
        </a>
        ,{" "}
        <a
          href="/codex/signal-processing-essentials"
          className="text-pink-200 underline underline-offset-4"
        >
          signal processing essentials
        </a>
        ,{" "}
        <a
          href="/codex/webxr"
          className="text-pink-200 underline underline-offset-4"
        >
          WebXR
        </a>
        ,{" "}
        <a
          href="/codex/foveated-rendering"
          className="text-pink-200 underline underline-offset-4"
        >
          foveated rendering
        </a>
        , and the forthcoming{" "}
        <em>drone control mathematics</em>. The long-form companion
        lives at{" "}
        <code className="font-mono text-chrome-200">
          docs/MATH-WEBXR.md
        </code>
        .
      </p>

      <p>
        <strong>Further reading:</strong>
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <a
            href="https://www.w3.org/TR/webxr/"
            className="text-pink-200 underline underline-offset-4"
          >
            WebXR Device API specification
          </a>{" "}
          (W3C Immersive Web WG) &mdash; the binding reference for
          session lifecycle,{" "}
          <code className="font-mono text-chrome-200">XRFrame</code>,{" "}
          <code className="font-mono text-chrome-200">XRViewerPose</code>
          , reference spaces, and the projection-matrix shape each
          view exposes.
        </li>
        <li>
          <a
            href="https://developer.apple.com/documentation/visionos"
            className="text-pink-200 underline underline-offset-4"
          >
            Apple visionOS developer documentation
          </a>{" "}
          &mdash; particularly the WebXR-on-Vision-Pro notes on
          gaze-pinch input, the{" "}
          <code className="font-mono text-chrome-200">transient-pointer</code>{" "}
          source, and the visionOS compositor&rsquo;s foveation
          treatment.
        </li>
        <li>
          Hartley &amp; Zisserman,{" "}
          <em>Multiple View Geometry in Computer Vision</em>{" "}
          (Cambridge University Press, 2nd edition, 2004). Chapter 6
          on camera models and Chapter 7 on calibration are the
          canonical treatment of intrinsics, distortion, and the
          algebraic structure of the pinhole-plus-radial model the
          HMD&rsquo;s factory calibration ultimately fits.
        </li>
        <li>
          Sebastian O. H. Madgwick,{" "}
          <em>
            An efficient orientation filter for inertial and
            inertial/magnetic sensor arrays
          </em>{" "}
          (Bristol, 2010). The IMU paper consumer-electronics
          firmware quietly leans on; the gradient-descent step is
          the middle path between the complementary filter and the
          full EKF.
        </li>
        <li>
          David M. Hoffman, Ahna R. Girshick, Kurt Akeley, Martin S.
          Banks,{" "}
          <em>
            Vergence-accommodation conflicts hinder visual
            performance and cause visual fatigue
          </em>
          , Journal of Vision (2008) &mdash; the canonical paper on
          why the headset gives one a headache, often informally
          called &ldquo;Cobb &amp; Hoffman&rdquo; after the earlier
          1999 review by Sue Cobb on virtual-environment side
          effects. Both belong on the shelf.
        </li>
        <li>
          The studio&rsquo;s per-device foveation policy and IPD
          handling live in{" "}
          <code className="font-mono text-chrome-200">
            docs/WEBXR-DEVICE-TARGETS.md
          </code>
          .
        </li>
      </ul>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The application&rsquo;s view of the maths is intentionally
          partial. WebXR hides the intrinsics behind a projection
          matrix, hides the IMU fusion behind a quaternion, and hides
          the reprojection behind the compositor; the scene gets a
          stable per-frame{" "}
          <code className="font-mono text-chrome-200">XRViewerPose</code>{" "}
          and two ready-to-use{" "}
          <code className="font-mono text-chrome-200">XRView</code>{" "}
          objects. The maths in this entry is what makes those
          objects honest &mdash; useful when one is debugging a
          headset that&rsquo;s reporting nonsense, or designing a
          scene that has to behave well across six different display
          stacks.
        </li>
        <li>
          Real headset lenses are radially distorted, not pinhole;
          the factory calibration absorbs the distortion as a
          polynomial in radius and the runtime applies it as part
          of the projection. The pinhole approximation is honest
          inside the foveation region and gets meaningfully wrong
          near the edges, which is one reason why eye-tracked
          foveation also tends to come with edge-distortion
          correction baked into the compositor.
        </li>
        <li>
          The Madgwick filter is the one most worth understanding
          on a first reading because the derivation is small enough
          to keep in one&rsquo;s head: parameterise the orientation
          as a quaternion, compute the gradient of the error between
          the accelerometer reading and the rotated gravity vector,
          take a step along the negative gradient at a rate that
          trades convergence speed against noise, and fold the gyro
          integration in on top. The Kalman filter generalises the
          same idea with a full covariance of the state, which
          earns it tighter behaviour at the cost of one matrix
          inversion per tick.
        </li>
        <li>
          SLAM stands for Simultaneous Localisation and Mapping
          &mdash; the head and the world co-evolve in the filter,
          because one cannot reliably estimate the head&rsquo;s
          motion without knowing where the features are and one
          cannot reliably place the features without knowing the
          head&rsquo;s motion. Modern HMDs solve it by bootstrapping
          off the IMU during the first few seconds of a session and
          letting the visual side catch up as the user looks around.
          The literature trail runs from Davison&rsquo;s MonoSLAM
          (2003) through ORB-SLAM and VINS-Mono to the present-day
          tightly-coupled visual-inertial systems shipping in every
          standalone headset on the market.
        </li>
        <li>
          The IPD assumption matters when the user is a child, an
          adult with unusually narrow or wide IPD, or wearing
          prescription inserts. Quest 3 has three discrete IPD
          settings (58, 63, 68 mm) selected mechanically; Vision Pro
          measures IPD optically during the initial setup and
          adjusts continuously. WebXR doesn&rsquo;t expose the
          user&rsquo;s IPD as a number; the application reads the
          per-eye transforms and trusts that the runtime got them
          right.
        </li>
        <li>
          Cobb (Sue V. G. Cobb et al., 1999,{" "}
          <em>Virtual reality-induced symptoms and effects</em>) is
          the older review article that named the problem; Hoffman
          et al. (2008) is the experimental paper that quantified
          it and gave the field the term &ldquo;vergence-
          accommodation conflict&rdquo; in its modern usage. Both
          are commonly cited together; either is acceptable
          shorthand.
        </li>
        <li>
          Cortical magnification is the reason the falloff curve
          looks the way it does: the fovea gets a wildly
          disproportionate share of V1 cortex per unit retinal area,
          and the peripheral retina&rsquo;s contribution shrinks
          faster than the geometry of the eye alone would predict.
          The renderer that wants to be honest measures its
          peripheral quality budget against cortical units, not
          retinal ones; the literature on this goes back to
          Daniel &amp; Whitteridge (1961).
        </li>
        <li>
          Timewarp was first publicly described by John Carmack in
          the Oculus DK2 era and is now ubiquitous; the maths is
          a homography in the orientation-only case and a
          full per-pixel re-projection (with motion vectors) in the
          spacewarp case. The OpenXR compositor extensions
          standardise the runtime side; WebXR doesn&rsquo;t expose
          the warp directly to the application, but the per-eye
          framebuffer scale and the depth buffer one chooses to
          submit both feed into how good the warp looks.
        </li>
      </ol>
    </>
  );
}
