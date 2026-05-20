export default function ProjectiveGeometryEssentials() {
  return (
    <>
      <p>
        Projective geometry is the branch of mathematics that takes
        the rude collapse of three dimensions into two &mdash; the
        thing a camera does every time the shutter falls &mdash; and
        gives it an algebra one can actually compute with. It is the
        connective tissue running through every Holoflow vertical that
        touches a lens: 360 stitching, WebXR pose, AR card tracking,
        and the drone photogrammetry that feeds the studio&rsquo;s
        gaussian splat pipeline. If linear algebra is the alphabet,
        projective geometry is the grammar; one cannot really speak
        about cameras without it.<sup>1</sup>
      </p>
      <p>
        The first move is to lift a three-dimensional point{" "}
        <code className="font-mono text-chrome-200">(x, y, z)</code>{" "}
        into a four-component <em>homogeneous</em> coordinate{" "}
        <code className="font-mono text-chrome-200">(x, y, z, 1)</code>
        . The extra <code className="font-mono text-chrome-200">1</code>
        looks like padding and behaves like a miracle. Translation,
        rotation, scale, shear, and the projection itself all become
        single matrix multiplications &mdash; a thing you cannot do
        with plain Cartesian coordinates, where translation is an
        addition and rotation a multiplication and the two refuse to
        compose cleanly. The cost is one extra number per point. The
        reward is that every geometric operation a camera or renderer
        will ever do collapses into a stack of 4&times;4 matrices that
        a GPU eats in microseconds.
      </p>
      <p>
        The point one buys with the extra dimension is that scaling
        the whole 4-vector by any non-zero{" "}
        <code className="font-mono text-chrome-200">w</code> leaves
        the point it represents unchanged:{" "}
        <code className="font-mono text-chrome-200">
          (x, y, z, 1) ~ (2x, 2y, 2z, 2) ~ (kx, ky, kz, k)
        </code>
        . Two homogeneous vectors describe the same world point
        whenever they differ only by a scalar. Recovering the
        Cartesian point at the end is one division by{" "}
        <code className="font-mono text-chrome-200">w</code> &mdash;
        the <em>perspective division</em>. And when{" "}
        <code className="font-mono text-chrome-200">w = 0</code>, the
        coordinate names a point that has no Cartesian equivalent: a{" "}
        <em>point at infinity</em>, a direction-vector with no
        location, the place where parallel railway tracks finally
        meet. Vanishing points in a photograph are this idea showing
        up in the data.
      </p>
      <p>
        The pinhole camera, the workhorse model behind every
        non-fisheye lens, factors into{" "}
        <code className="font-mono text-chrome-200">P = K[R|t]</code>{" "}
        &mdash; the camera matrix. The{" "}
        <code className="font-mono text-chrome-200">K</code> piece
        (the <em>intrinsics</em>) is a 3&times;3 upper-triangular
        matrix carrying focal length{" "}
        <code className="font-mono text-chrome-200">(f_x, f_y)</code>{" "}
        in pixel units and principal point{" "}
        <code className="font-mono text-chrome-200">(c_x, c_y)</code>{" "}
        in pixel coordinates; it answers the question &ldquo;given a
        ray leaving the lens, where on the sensor does it land?&rdquo;.
        The <code className="font-mono text-chrome-200">[R|t]</code>{" "}
        piece (the <em>extrinsics</em>) is a 3&times;4 block holding a
        rotation and a translation; it answers &ldquo;where in the
        world is the camera, and which way is it pointing?&rdquo;.
        Stacked together,{" "}
        <code className="font-mono text-chrome-200">P</code> is the
        3&times;4 matrix that takes a homogeneous world point and
        emits a homogeneous pixel.<sup>2</sup>
      </p>
      <p>
        A concrete walk-through, because the algebra is small enough
        to do by hand. Take a world point{" "}
        <code className="font-mono text-chrome-200">X = (2, 1, 5, 1)</code>{" "}
        (in metres) and a camera with focal length{" "}
        <code className="font-mono text-chrome-200">f_x = f_y = 800</code>{" "}
        pixels, principal point{" "}
        <code className="font-mono text-chrome-200">(c_x, c_y) = (320, 240)</code>{" "}
        (i.e. a 640&times;480 sensor), oriented identically to the world
        and sitting at the origin, so{" "}
        <code className="font-mono text-chrome-200">R = I</code> and{" "}
        <code className="font-mono text-chrome-200">t = 0</code>. Then
        the bare camera-space projection is{" "}
        <code className="font-mono text-chrome-200">
          K &middot; (2, 1, 5) = (800&middot;2 + 320&middot;5, 800&middot;1 + 240&middot;5, 5) = (1600 + 1600, 800 + 1200, 5) = (3200, 2000, 5)
        </code>
        . Perspective division by the last component yields{" "}
        <code className="font-mono text-chrome-200">(u, v) = (3200/5, 2000/5) = (640, 400)</code>
        . Pixel (640, 400) sits on the right edge of the
        640&times;480 frame &mdash; the model is telling us this
        world point is at the very limit of the field of view.
        Honest geometric feedback, not a bug.
      </p>
      <p>
        The pinhole model is honest only inside a narrow corridor of
        lens behaviour: roughly, rectilinear lenses up to around
        85&deg; horizontal field of view. Beyond that, the geometry
        the model promises &mdash; straight lines in the world stay
        straight in the image &mdash; stops being true. Wide-angle
        lenses introduce a barrel distortion that the calibration
        pipeline absorbs as polynomial{" "}
        <code className="font-mono text-chrome-200">k1..k4</code> (and
        sometimes <code className="font-mono text-chrome-200">k5, k6</code>)
        radial terms layered on top of{" "}
        <code className="font-mono text-chrome-200">K</code>. Fisheye
        lenses break the model altogether and need their own family
        &mdash; equidistant, equisolid, stereographic &mdash; with
        their own four-parameter polynomial fit. Panoramic and
        360&deg; captures abandon pinhole entirely in favour of a
        spherical sampling scheme; see{" "}
        <strong>
          <a
            href="/codex/equirectangular-projection"
            className="text-pink-200 underline underline-offset-4"
          >
            equirectangular projection
          </a>
        </strong>{" "}
        for the geometry of that surrender.<sup>3</sup>
      </p>
      <p>
        A <em>homography</em> is the next step out from the camera
        matrix: a 3&times;3 invertible matrix{" "}
        <code className="font-mono text-chrome-200">H</code> that maps
        one plane onto another. Four point correspondences, eight
        degrees of freedom, one linear solve. Homographies are the
        engine behind whiteboard de-skewing, planar AR markers,
        document scanners that flatten a tilted page, and panorama
        stitchers that assume the photographer rotated in place
        without translating. The catch is what they cannot model:{" "}
        <em>parallax</em>. If the scene has depth and the camera
        translates between shots, the closer objects shift relative
        to the farther ones, and no single homography can register
        the two views. Homographies are honest only when the scene is
        planar or the camera is rotating about its optical centre.
        Get either of those wrong and you get ghosted stitches, and
        no amount of seam-blending hides the underlying geometric
        lie.
      </p>
      <p>
        When the scene is not planar and the camera does translate,
        one needs <em>epipolar geometry</em>. The headline result is
        the <em>fundamental matrix</em>{" "}
        <code className="font-mono text-chrome-200">F</code> &mdash;
        a 3&times;3 rank-2 matrix that captures everything the
        geometry of two cameras tells you about correspondences,
        without ever needing to recover either camera&rsquo;s
        intrinsics. For any pixel{" "}
        <code className="font-mono text-chrome-200">x</code> in the
        left image, its match in the right image must lie on a single
        straight line &mdash; the <em>epipolar line</em>{" "}
        <code className="font-mono text-chrome-200">l&rsquo; = F&middot;x</code>.
        Correspondence is therefore a one-dimensional search, not a
        two-dimensional one, and the consequence is roughly a thousand-
        fold reduction in the cost of matching features between views.
        Every modern stereo and structure-from-motion pipeline runs
        on this constraint.
      </p>
      <p>
        Structure-from-motion (SfM) is the technique that recovers
        both 3D structure and camera poses from a stack of overlapping
        photographs, and its hard constraint is geometric: at least
        two views, with non-zero translational baseline between them.
        A camera that only rotates &mdash; a perfect tripod pan, a
        VR headset on a swivel chair &mdash; gives no triangulation
        information; rays from a point pass through the same optical
        centre in every shot, and depth is unobservable. The
        photographer must <em>walk</em> for SfM to work. This is why
        drone photogrammetry orbits the subject rather than spinning
        in place, and why the studio&rsquo;s splat pipeline rejects
        a capture that doesn&rsquo;t show enough parallax across the
        image set. See{" "}
        <strong>
          <a
            href="/codex/gaussian-splatting"
            className="text-pink-200 underline underline-offset-4"
          >
            gaussian splatting
          </a>
        </strong>{" "}
        for what the studio does with the camera poses once SfM
        recovers them.<sup>4</sup>
      </p>
      <p>
        Where this shows up across the studio&rsquo;s verticals:
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>360 stitching.</strong> The two fisheye sensors on
          an Avata 360 or Osmo 360 share an optical centre by design;
          the per-pixel transform between them is a fisheye-to-
          equirect map, not a homography, but the rotational
          alignment that gets each lens into a common world frame is
          a 3&times;3 rotation matrix &mdash; the{" "}
          <code className="font-mono text-chrome-200">R</code> half
          of <code className="font-mono text-chrome-200">[R|t]</code>{" "}
          with translation pinned to zero.
        </li>
        <li>
          <strong>WebXR pose.</strong> A headset reports its head
          pose as a translation vector and a rotation (usually
          quaternion; see the forthcoming{" "}
          <em>quaternions essentials</em>). Internally the runtime is
          maintaining the same{" "}
          <code className="font-mono text-chrome-200">[R|t]</code>{" "}
          the camera matrix describes; the rendering side composes
          it with the eye intrinsics to draw the world. Every frame
          is a fresh{" "}
          <code className="font-mono text-chrome-200">P</code>.
        </li>
        <li>
          <strong>AR card tracking.</strong> The Holoflow AR cards
          are planar fiducials, and the runtime fits a homography
          from the four marker corners to the camera frame each
          tick. The homography then factors into a pinhole pose
          (rotation + translation in marker frame) by way of the
          known intrinsics &mdash; classic Zhang-style decomposition.
          See the forthcoming <em>AR tracking essentials</em>.
        </li>
        <li>
          <strong>Drone photogrammetry.</strong> The orbit path is
          chosen to maximise baseline and overlap. COLMAP recovers a
          camera matrix per shot, triangulates a sparse point cloud,
          and hands the lot to the splat trainer. The whole pipeline
          is projective geometry from end to end, and the parts that
          go wrong &mdash; failed pose recovery, degenerate
          reconstructions &mdash; almost always trace back to a
          violation of the baseline-and-correspondence constraints
          discussed above.
        </li>
      </ul>
      <p>
        Projective geometry is the smallest framework that makes all
        of this one subject rather than four. See also the
        forthcoming{" "}
        <em>linear algebra essentials</em> entry for the matrices,
        determinants, and SVDs that make the projective machinery go,
        and{" "}
        <strong>
          <a
            href="/codex/equirectangular-projection"
            className="text-pink-200 underline underline-offset-4"
          >
            equirectangular projection
          </a>
        </strong>{" "}
        for the spherical case the pinhole model can&rsquo;t reach.
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The canonical reference is Hartley &amp; Zisserman,{" "}
          <em>
            Multiple View Geometry in Computer Vision
          </em>{" "}
          (Cambridge University Press, 2nd ed., 2004). It is dense,
          rewards a second reading, and contains every proof one
          might want about the fundamental matrix, the essential
          matrix, and the algebraic structure of camera calibration.
          Szeliski,{" "}
          <em>
            Computer Vision: Algorithms and Applications
          </em>{" "}
          (Springer, 2nd ed., 2022) is the gentler entry point and
          the one to read first.
        </li>
        <li>
          The OpenCV camera calibration tutorial is the most
          frequently-consulted practical reference for working out
          what the entries of{" "}
          <code className="font-mono text-chrome-200">K</code> are
          on a real lens, including the radial and tangential
          distortion coefficients the pinhole model alone cannot
          carry. It also documents Zhang&rsquo;s chequerboard
          calibration method, which is what almost every studio
          actually runs.
        </li>
        <li>
          Fisheye lenses are not exotic; they are simply outside the
          domain where pinhole is honest. OpenCV ships a separate
          fisheye module (cv::fisheye) precisely because the
          radial-polynomial extension of pinhole cannot stretch far
          enough to cover them. For 360 capture the studio prefers
          the raw fisheye pair over the consumer-stitched equirect,
          because the lens model is recoverable and the seam isn&rsquo;t
          baked into the data.
        </li>
        <li>
          The pure-rotation degeneracy is the reason the splat
          pipeline rejects captures where the photographer pirouettes
          in place. The geometry is unforgiving: zero baseline
          means zero depth information, regardless of how many shots
          one takes. The fix is to step sideways between frames; a
          metre of baseline goes a long way.
        </li>
      </ol>
    </>
  );
}
