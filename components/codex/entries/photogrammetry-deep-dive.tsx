export default function PhotogrammetryDeepDive() {
  return (
    <>
      <p>
        The companion mathematics entry to{" "}
        <a
          href="/codex/photogrammetry"
          className="text-pink-200 underline underline-offset-4"
        >
          photogrammetry (studio practice)
        </a>
        . That entry describes what photogrammetry is for, the capture
        recipes the studio uses, and which packages get reached for in
        which order. This one is the mathematics underneath &mdash; the
        feature detectors, the matchers, the epipolar geometry, the
        triangulation, the bundle adjustment, and the multi-view stereo
        &mdash; in enough detail that a reader who has done a first
        course in linear algebra and a first course in projective
        geometry can follow Hartley &amp; Zisserman without getting
        lost.<sup>1</sup>
      </p>

      <p>
        The full long-form document lives at{" "}
        <code className="font-mono text-chrome-200">
          docs/MATH-PHOTOGRAMMETRY.md
        </code>{" "}
        and walks the entire pipeline: scale-space feature detection
        (SIFT, AKAZE, ORB), descriptor matching with the ratio test, the
        fundamental and essential matrices and their estimation under
        RANSAC, linear and optimal triangulation, bundle adjustment with
        its Schur-complement-friendly sparsity, the COLMAP-style
        incremental Structure-from-Motion loop, and PatchMatch
        multi-view stereo. The worked example computes a fundamental
        matrix from eight point correspondences by hand.
      </p>

      <h3 className="mt-10 mb-3 font-display text-xl text-chrome-100">
        I. Features &mdash; the invariant landmarks
      </h3>
      <p>
        A feature is a pixel neighbourhood that survives viewpoint
        change. A photograph of a brick wall, rotated thirty degrees
        and shifted across the frame, ought to expose the same
        recognisable corners and blobs. The detector is the algorithm
        that finds them; the descriptor is the small vector that
        identifies one neighbourhood and lets it be matched against the
        same neighbourhood in another image.
      </p>
      <p>
        <strong>SIFT</strong> (Scale-Invariant Feature Transform, David
        Lowe, 1999; full treatment 2004) is the canonical detector.
        Build a Gaussian scale-space pyramid; take differences between
        adjacent scales to approximate the Laplacian; pick local extrema
        in space and scale; assign a dominant gradient orientation; emit
        a 128-dimensional descriptor built from gradient histograms in a
        4&times;4 grid around the keypoint. The result is invariant to
        scale and rotation and largely robust to small affine
        distortion. Twenty-seven years on, it is still the detector to
        beat for accuracy on photographic data.<sup>2</sup>
      </p>
      <p>
        <strong>ORB</strong> (Oriented FAST + Rotated BRIEF, Rublee et
        al., 2011) trades a little robustness for a great deal of speed
        and freedom from patent encumbrance. FAST finds corners by
        comparing a pixel to a ring of sixteen neighbours; orientation
        is recovered from the intensity centroid; the descriptor is
        BRIEF &mdash; 256 binary tests between rotated pairs of pixels.
        A binary descriptor with Hamming-distance matching runs roughly
        an order of magnitude faster than SIFT&rsquo;s float vectors.
      </p>
      <p>
        <strong>AKAZE</strong> (Accelerated KAZE, Alcantarilla et al.,
        2013) replaces the Gaussian scale-space with a non-linear
        diffusion scale-space (image edges are preserved through the
        pyramid rather than blurred away) and emits a binary descriptor
        (M-LDB). It is the current OpenCV default for general-purpose
        matching: faster than SIFT, more accurate than ORB on real
        photographs, and free to use.
      </p>
      <p>
        The studio&rsquo;s preference depends on the vertical. SIFT for
        archival photogrammetry where matching quality dominates and a
        few seconds per image is fine. ORB for AR card image-target
        compilation under{" "}
        <code className="font-mono text-chrome-200">mind-ar</code>{" "}
        (which derives a SIFT-like detector internally) and for any
        on-device tracking. AKAZE when the scene has strong edges and
        the Gaussian pyramid would smear them.
      </p>

      <h3 className="mt-10 mb-3 font-display text-xl text-chrome-100">
        II. Matching &mdash; turning two clouds of descriptors into
        correspondences
      </h3>
      <p>
        Once each image is a heap of (keypoint, descriptor) pairs, the
        next step is to pair them across images. Brute-force matching
        compares every descriptor in image A against every descriptor
        in image B. For 5,000 keypoints per image that is 25 million
        comparisons &mdash; tolerable for two images, ruinous for a
        thousand-image dataset. FLANN (Fast Library for Approximate
        Nearest Neighbours) and other k-d-tree / hashing schemes drop
        the cost to roughly{" "}
        <code className="font-mono text-chrome-200">O(n log n)</code>{" "}
        at the price of a small false-negative rate.
      </p>
      <p>
        Raw nearest-neighbour matches are full of garbage. Two filters
        cull most of it. Lowe&rsquo;s <strong>ratio test</strong>{" "}
        rejects any match whose nearest-neighbour distance is more than
        about 0.7&ndash;0.8 of the second-nearest-neighbour distance: if
        the best match is barely better than the second-best, the
        descriptor is not distinctive enough to trust.{" "}
        <strong>Mutual nearest neighbours</strong> demands that the
        match agree in both directions &mdash; descriptor{" "}
        <code className="font-mono text-chrome-200">a</code> in image A
        finds <code className="font-mono text-chrome-200">b</code> in
        image B as its nearest, and{" "}
        <code className="font-mono text-chrome-200">b</code> in image B
        finds <code className="font-mono text-chrome-200">a</code> in
        image A as its nearest. Either filter alone is useful; both
        together are the working default.
      </p>
      <p>
        Even after both filters, the surviving match rate is honest
        about itself: 10&ndash;30% of detected features on a good pair
        of overlapping photographs, sometimes much less on textureless
        scenes. The pipeline must assume outliers are present, which is
        why every downstream step is wrapped in RANSAC.
      </p>

      <h3 className="mt-10 mb-3 font-display text-xl text-chrome-100">
        III. The fundamental and essential matrices
      </h3>
      <p>
        Two images of the same scene are not unrelated. A point in
        image A constrains the same world point&rsquo;s appearance in
        image B to lie along a single line &mdash; the{" "}
        <em>epipolar line</em>. The matrix that encodes this constraint
        is the <strong>fundamental matrix</strong>{" "}
        <code className="font-mono text-chrome-200">F</code>: a
        3&times;3 matrix of rank 2 such that, for every correspondence{" "}
        <code className="font-mono text-chrome-200">(x, x&prime;)</code>
        ,
      </p>
      <p className="ml-6 font-mono text-chrome-200">
        x&prime;<sup>T</sup> F x = 0.
      </p>
      <p>
        When the camera intrinsics{" "}
        <code className="font-mono text-chrome-200">K</code> are known,
        the calibrated form is the <strong>essential matrix</strong>{" "}
        <code className="font-mono text-chrome-200">
          E = K&prime;<sup>T</sup> F K
        </code>
        . The essential matrix encodes only the relative pose
        (rotation + translation up to scale); the fundamental matrix
        also carries the intrinsics. For modern phone and drone
        cameras, EXIF metadata makes the calibrated case the default.
      </p>
      <p>
        <strong>RANSAC</strong> (Random Sample Consensus, Fischler &amp;
        Bolles, 1981) is how the matrix is estimated despite outliers.
        Sample a minimal subset of correspondences (eight for the
        8-point algorithm on{" "}
        <code className="font-mono text-chrome-200">F</code>, five for
        Nist&eacute;r&rsquo;s 5-point algorithm on{" "}
        <code className="font-mono text-chrome-200">E</code>), fit the
        matrix exactly to that sample, count how many of the remaining
        correspondences agree to within an epipolar-distance threshold,
        and keep the model with the largest consensus set. Repeat for
        as many iterations as the expected outlier rate demands. The
        winning model is then refined by re-fitting on the full inlier
        set in a non-linear step.
      </p>

      <h3 className="mt-10 mb-3 font-display text-xl text-chrome-100">
        IV. Triangulation &mdash; lifting 2D matches to 3D points
      </h3>
      <p>
        Given two camera matrices and a correspondence, the 3D point is
        the intersection of two rays. In a noise-free world those rays
        meet exactly; in any real dataset they pass each other in
        space, and the question becomes which 3D point to pick.
      </p>
      <p>
        Linear DLT (Direct Linear Transformation) writes the projection
        equations for both cameras as a homogeneous linear system{" "}
        <code className="font-mono text-chrome-200">A X = 0</code> in
        the unknown 4-vector{" "}
        <code className="font-mono text-chrome-200">X</code>, then
        solves by SVD. Fast, closed-form, and minimises algebraic error
        rather than the physically meaningful reprojection error. The
        optimal method of Hartley &amp; Sturm pre-corrects the matched
        pixels so the corrected points lie exactly on conjugate
        epipolar lines, then triangulates. The reprojection error is
        minimised by construction. For sparse SfM seeds the DLT is fine;
        for the points that go into bundle adjustment as initialisation,
        the optimal version pays for itself.
      </p>

      <h3 className="mt-10 mb-3 font-display text-xl text-chrome-100">
        V. Bundle adjustment &mdash; the joint refinement
      </h3>
      <p>
        Bundle adjustment is the simultaneous refinement of every
        camera pose and every 3D point in the reconstruction by
        minimising the total reprojection error:
      </p>
      <p className="ml-6 font-mono text-chrome-200">
        min<sub>{`{P, X}`}</sub> &Sigma;<sub>ij</sub> &rho;( ||
        x<sub>ij</sub> &minus; &pi;(P<sub>j</sub>, X<sub>i</sub>) ||
        <sup>2</sup> )
      </p>
      <p>
        where{" "}
        <code className="font-mono text-chrome-200">x<sub>ij</sub></code>{" "}
        is the observed pixel of 3D point{" "}
        <code className="font-mono text-chrome-200">X<sub>i</sub></code>{" "}
        in camera{" "}
        <code className="font-mono text-chrome-200">P<sub>j</sub></code>
        ,{" "}
        <code className="font-mono text-chrome-200">&pi;</code> is the
        projection, and{" "}
        <code className="font-mono text-chrome-200">&rho;</code> is a
        robust loss (Huber, Cauchy) to keep surviving outliers from
        dragging the solution. The minimisation is run by{" "}
        <strong>Levenberg-Marquardt</strong>, the damped Gauss-Newton
        method that blends gradient descent (when far from the optimum)
        with the Newton step (when close).
      </p>
      <p>
        The problem looks impossibly large &mdash; tens of thousands of
        cameras, millions of points, hundreds of millions of residuals
        &mdash; and would be, if the Hessian were dense. It is not. A
        residual depends only on one camera and one point, so the
        Hessian has a block-arrowhead structure that the{" "}
        <strong>Schur complement</strong> can exploit: solve the smaller
        camera-only system first, then back-substitute for the points.
        This is the reason bundle adjustment is tractable at all, and
        the architectural reason every SBA-lineage library (Lourakis
        and Argyros&rsquo;s SBA, Google&rsquo;s Ceres Solver,
        COLMAP&rsquo;s internal solver) is built around the sparsity
        pattern.
      </p>

      <h3 className="mt-10 mb-3 font-display text-xl text-chrome-100">
        VI. Structure from Motion &mdash; the orchestrating loop
      </h3>
      <p>
        Incremental SfM (COLMAP, OpenMVG) initialises from a carefully
        chosen two-view reconstruction, then adds cameras one at a time
        via PnP (Perspective-n-Point), triangulates new points,
        bundle-adjusts every few additions, and watches for loop
        closures. Global SfM (Theia, OpenMVG&rsquo;s global mode) tries
        to solve for all camera poses at once from pairwise rotations
        and translations. Incremental is more robust on awkward
        datasets, slower, and the workhorse for almost every package
        the studio uses; global is faster on well-behaved drone surveys
        and more sensitive to bad pairwise estimates.
      </p>

      <h3 className="mt-10 mb-3 font-display text-xl text-chrome-100">
        VII. Multi-View Stereo &mdash; the dense step
      </h3>
      <p>
        SfM produces a sparse point cloud &mdash; one 3D point per
        triangulated feature, perhaps tens of thousands of points for a
        building survey. Dense reconstruction estimates a depth per
        pixel. The current workhorse is{" "}
        <strong>PatchMatch</strong> (Bleyer, Rhemann &amp; Rother, 2011,
        adapted to multi-view stereo by Sch&ouml;nberger and others):
        guess random depths and normals, propagate good guesses to
        neighbours, and refine. The per-image depth maps are then fused
        into a single dense point cloud or mesh, with consistency
        checks that reject pixels seen by too few cameras.
      </p>

      <h3 className="mt-10 mb-3 font-display text-xl text-chrome-100">
        VIII. Where this lands in Holoflow
      </h3>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>Splat training input.</strong> COLMAP&rsquo;s SfM
          output &mdash; camera poses plus sparse cloud &mdash; is what
          the gaussian-splat trainer initialises from. See{" "}
          <a
            href="/codex/gaussian-splat-mathematics"
            className="text-pink-200 underline underline-offset-4"
          >
            gaussian splat mathematics
          </a>
          .
        </li>
        <li>
          <strong>Drone photogrammetry.</strong> Flight-path planning
          sets the baseline geometry that determines whether
          reconstruction is well-conditioned. A nadir grid alone gives
          poor vertical reconstruction; oblique passes restore the
          epipolar geometry on facades.
        </li>
        <li>
          <strong>AR card image-target compilation.</strong> The
          studio&rsquo;s{" "}
          <code className="font-mono text-chrome-200">.mind</code>{" "}
          binaries are produced by detecting scale-space features on the
          card artwork and packing them for on-device matching at
          runtime.
        </li>
        <li>
          <strong>360 stitching.</strong> Equirectangular projections
          break the pinhole model, but multi-view geometry survives in
          spherical form &mdash; matched features lie on great-circle
          epipolar curves rather than straight lines.
        </li>
      </ul>

      <p>
        <strong>Forward references for the maths foundations.</strong>{" "}
        The companion documents under{" "}
        <code className="font-mono text-chrome-200">docs/</code>{" "}
        cover the prerequisites:{" "}
        <a
          href="/codex/linear-algebra-essentials"
          className="text-pink-200 underline underline-offset-4"
        >
          linear-algebra essentials
        </a>{" "}
        for the SVDs and pseudoinverses,{" "}
        <a
          href="/codex/projective-geometry-essentials"
          className="text-pink-200 underline underline-offset-4"
        >
          projective-geometry essentials
        </a>{" "}
        for the pinhole camera and the homogeneous lift,{" "}
        <a
          href="/codex/numerical-optimization-essentials"
          className="text-pink-200 underline underline-offset-4"
        >
          numerical-optimisation essentials
        </a>{" "}
        for Levenberg-Marquardt and the Schur complement, and{" "}
        <a
          href="/codex/gaussian-splat-mathematics"
          className="text-pink-200 underline underline-offset-4"
        >
          gaussian splat mathematics
        </a>{" "}
        for what happens to the SfM output once the trainer takes it.
        Each is cross-referenced from{" "}
        <code className="font-mono text-chrome-200">
          docs/MATH-PHOTOGRAMMETRY.md
        </code>{" "}
        where it first appears.
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          Hartley &amp; Zisserman,{" "}
          <em>Multiple View Geometry in Computer Vision</em> (Cambridge
          University Press, 2nd edition, 2004) is the canonical
          textbook. Every claim in this entry that begins &ldquo;the
          fundamental matrix has rank two&rdquo; or &ldquo;the
          epipolar geometry is&hellip;&rdquo; has a proof there. Read
          chapters 9 through 11 alongside the long-form doc; the
          notation will line up.
        </li>
        <li>
          Lowe, <em>Distinctive Image Features from Scale-Invariant
          Keypoints</em> (IJCV 2004), is the paper to read for SIFT.
          The 1999 ICCV version introduces the detector; the 2004
          journal version is the canonical reference with the
          descriptor design fully worked out. SIFT was patented until
          2020; the patent expiry is the reason it is now back in
          mainline OpenCV rather than the contrib module.
        </li>
      </ol>
    </>
  );
}
