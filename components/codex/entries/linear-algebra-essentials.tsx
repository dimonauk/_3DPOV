export default function LinearAlgebraEssentials() {
  return (
    <>
      <p>
        Linear algebra is the language every other maths doc in the
        codex speaks. Gaussian splats, drone IMU pose, HRTF spatial
        audio, projective camera geometry, optimisation under gradient
        descent &mdash; each begins with a vector, ends with a matrix,
        and somewhere in the middle does an eigendecomposition or a
        singular value decomposition without bothering to flag the
        fact. This entry is the foundation: the small handful of
        objects and operations the studio leans on, and the geometric
        intuition that makes them feel less like bookkeeping and more
        like the shape of the problem.<sup>1</sup>
      </p>

      <p>
        <strong>Vectors and matrices.</strong> A vector is an ordered
        list of numbers; for the studio&rsquo;s purposes it usually
        names a point in space, a direction, a colour, or a row of
        sensor readings. A matrix is a rectangular array of numbers
        and the most useful way to think about it is{" "}
        <em>as a linear transformation</em>: feed in a vector, get out
        another vector. The columns of the matrix are the images of
        the basis vectors under that transformation &mdash; which is
        why a 3&times;3 matrix that rotates 3D space has columns that
        are themselves the rotated x, y, z axes.
      </p>

      <p>
        <strong>Matrix multiplication.</strong> The product{" "}
        <code className="font-mono text-chrome-200">AB</code> is the
        composition of the two transformations: first apply{" "}
        <code className="font-mono text-chrome-200">B</code>, then
        apply <code className="font-mono text-chrome-200">A</code>.
        Non-commutative (
        <code className="font-mono text-chrome-200">AB &ne; BA</code>{" "}
        in general) because rotating then translating is not the same
        as translating then rotating. The studio&rsquo;s WebGPU and
        Three.js code stacks model-view-projection matrices in exactly
        this order &mdash; world transform, then camera transform,
        then projection &mdash; and the order is load-bearing.
      </p>

      <p>
        <strong>Eigenvalues and eigenvectors.</strong> An eigenvector
        of a square matrix{" "}
        <code className="font-mono text-chrome-200">A</code> is a
        vector{" "}
        <code className="font-mono text-chrome-200">v</code> that{" "}
        <em>doesn&rsquo;t change direction</em> when{" "}
        <code className="font-mono text-chrome-200">A</code> is applied
        to it; it only gets scaled. The scale factor is the
        eigenvalue:{" "}
        <code className="font-mono text-chrome-200">
          A v = &lambda; v
        </code>
        . The physical reading is{" "}
        <strong>principal axes</strong>: the directions in which the
        transformation acts as a pure stretch. For a rotation matrix
        in 3D, the eigenvector with eigenvalue 1 is the rotation axis.
        For a covariance matrix, the eigenvectors are the directions
        of greatest variance and the eigenvalues are how much variance
        in each.<sup>2</sup>
      </p>

      <p>
        <strong>A worked 3&times;3 example.</strong> Take the matrix
      </p>
      <p>
        <code className="font-mono text-chrome-200">
          A = [[4, 1, 0], [1, 4, 0], [0, 0, 2]]
        </code>
        .
      </p>
      <p>
        The characteristic polynomial is{" "}
        <code className="font-mono text-chrome-200">
          det(A &minus; &lambda;I) = 0
        </code>
        , which works out to{" "}
        <code className="font-mono text-chrome-200">
          (2 &minus; &lambda;)((4 &minus; &lambda;)&sup2; &minus; 1) = 0
        </code>
        . The roots are{" "}
        <code className="font-mono text-chrome-200">&lambda; = 5</code>
        ,{" "}
        <code className="font-mono text-chrome-200">&lambda; = 3</code>
        ,{" "}
        <code className="font-mono text-chrome-200">&lambda; = 2</code>
        . The corresponding eigenvectors are{" "}
        <code className="font-mono text-chrome-200">(1, 1, 0)</code>
        ,{" "}
        <code className="font-mono text-chrome-200">(1, &minus;1, 0)</code>
        , and{" "}
        <code className="font-mono text-chrome-200">(0, 0, 1)</code>{" "}
        respectively &mdash; three orthogonal axes along which{" "}
        <code className="font-mono text-chrome-200">A</code> stretches
        space by factors of 5, 3, and 2. The matrix factors as{" "}
        <code className="font-mono text-chrome-200">
          A = Q &Lambda; Q&#7531;
        </code>{" "}
        with{" "}
        <code className="font-mono text-chrome-200">Q</code> holding
        the eigenvectors as columns and{" "}
        <code className="font-mono text-chrome-200">&Lambda;</code>{" "}
        the diagonal matrix of eigenvalues. That factorisation is the
        eigendecomposition.
      </p>

      <p>
        <strong>Singular Value Decomposition (SVD).</strong>{" "}
        Eigendecomposition only works on square matrices, and not all
        of them. SVD is the generalisation that works on any matrix:
        any{" "}
        <code className="font-mono text-chrome-200">m&times;n</code>{" "}
        matrix{" "}
        <code className="font-mono text-chrome-200">M</code> factors as{" "}
        <code className="font-mono text-chrome-200">
          M = U &Sigma; V&#7531;
        </code>
        , where{" "}
        <code className="font-mono text-chrome-200">U</code> and{" "}
        <code className="font-mono text-chrome-200">V</code> are
        orthogonal matrices and{" "}
        <code className="font-mono text-chrome-200">&Sigma;</code>{" "}
        is diagonal with non-negative entries (the{" "}
        <em>singular values</em>) sorted largest first. Geometrically:
        any linear map is a rotation, then a scaling along axes, then
        another rotation. Three roles SVD plays in studio work:
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>Principal Component Analysis (PCA).</strong> Centre
          a data matrix; run SVD; the columns of{" "}
          <code className="font-mono text-chrome-200">V</code> are the
          principal axes and the singular values are the standard
          deviations along them. The first <em>k</em> columns are the
          best <em>k</em>-dimensional projection of the data in
          least-squares sense.
        </li>
        <li>
          <strong>Dimensionality reduction and compression.</strong>{" "}
          Truncating{" "}
          <code className="font-mono text-chrome-200">&Sigma;</code>{" "}
          to its top <em>k</em> singular values gives the best
          rank-<em>k</em> approximation of{" "}
          <code className="font-mono text-chrome-200">M</code>{" "}
          (Eckart-Young theorem). This is how splat compression, audio
          feature extraction, and the smaller end of LLM-weight
          quantisation all work.
        </li>
        <li>
          <strong>Moore-Penrose pseudoinverse.</strong>{" "}
          <code className="font-mono text-chrome-200">
            M&#8314; = V &Sigma;&#8314; U&#7531;
          </code>
          , where{" "}
          <code className="font-mono text-chrome-200">
            &Sigma;&#8314;
          </code>{" "}
          inverts the non-zero singular values and leaves zeros alone.
          The pseudoinverse is what solves least-squares problems when
          the matrix isn&rsquo;t square or isn&rsquo;t invertible
          &mdash; which is what calibrating a camera, fitting a plane
          to a point cloud, and the closed-form linear-regression
          solution all reduce to.<sup>3</sup>
        </li>
      </ul>

      <p>
        <strong>Covariance matrices.</strong> A covariance matrix
        summarises how a set of vectors varies and co-varies. For a
        cloud of 3D points{" "}
        <code className="font-mono text-chrome-200">x&#7522;</code>{" "}
        with mean{" "}
        <code className="font-mono text-chrome-200">&mu;</code>, the
        3&times;3 covariance is{" "}
        <code className="font-mono text-chrome-200">
          &Sigma; = (1/n) &Sigma;&#7522; (x&#7522; &minus; &mu;)(x&#7522; &minus; &mu;)&#7531;
        </code>
        . Always symmetric, always positive-semi-definite, which means
        its eigenvalues are real and non-negative and its eigenvectors
        are orthogonal. Where this appears in the studio:
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>Gaussian splats.</strong> Each splat in a{" "}
          <a
            href="/codex/gaussian-splatting"
            className="text-pink-200 underline underline-offset-4"
          >
            3D Gaussian Splatting
          </a>{" "}
          scene is parameterised by a 3D position and a 3&times;3
          covariance matrix that describes its anisotropic ellipsoidal
          extent. The eigendecomposition of that covariance gives the
          ellipsoid&rsquo;s principal axes and radii &mdash; which is
          exactly what the rasteriser needs to draw it.
        </li>
        <li>
          <strong>HRTF audio.</strong> Personalisation pipelines for{" "}
          <a
            href="/codex/hrtf-head-related-transfer-function"
            className="text-pink-200 underline underline-offset-4"
          >
            head-related transfer functions
          </a>{" "}
          model the variability across measured ears as a covariance
          over filter coefficients; the principal components are the
          handful of dimensions a personalisation slider actually has
          to move along.
        </li>
        <li>
          <strong>Point-cloud fitting.</strong> Fitting a plane to a
          neighbourhood of points: compute the local covariance, take
          its eigenvectors, and the one with the smallest eigenvalue
          is the surface normal. This is how normal estimation in
          photogrammetry pipelines and ICP alignment for LiDAR scans
          works under the bonnet.
        </li>
      </ul>

      <p>
        <strong>Rotation matrices and quaternions.</strong> A 3D
        rotation can be written as a 3&times;3 orthogonal matrix with
        determinant 1. The columns are the rotated basis vectors;
        composing rotations is just matrix multiplication. Three
        Euler angles (yaw, pitch, roll) parameterise the same rotation
        more compactly but suffer{" "}
        <strong>gimbal lock</strong>: at certain orientations two of
        the three rotation axes align and a degree of freedom is lost.
        Drone IMU code that integrates rate-gyro measurements in Euler
        angles fails the moment the craft pitches to 90&deg;.
        Quaternions &mdash; four numbers, a scalar and a 3-vector
        &mdash; parameterise rotations without the singularity, and
        the studio&rsquo;s VR pose-tracking, splat-viewer camera, and
        drone-pose pipelines all run on quaternions. The full story
        lives in the quaternions codex entry; this is the preview.
        <sup>4</sup>
      </p>

      <p>
        <strong>Where this appears in the studio&rsquo;s verticals.</strong>
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>Splat geometry.</strong> Per-splat 3&times;3
          covariance, eigendecomposed at render time for ellipsoid
          axes; SVD on the global splat cloud for compression and
          level-of-detail.
        </li>
        <li>
          <strong>Drone IMU and SfM.</strong> Rate-gyro integration in
          quaternion form; bundle adjustment as a vast non-linear
          least-squares problem solved by repeated pseudoinverses.
        </li>
        <li>
          <strong>Projective camera geometry.</strong> The pinhole
          camera is a 3&times;4 matrix; decomposing it recovers
          intrinsics, rotation, and translation via QR factorisation,
          a cousin of SVD.
        </li>
        <li>
          <strong>Optimisation.</strong> Gradient descent and its
          variants all rely on the gradient as a vector and (for
          second-order methods) the Hessian as a symmetric matrix
          whose eigenvalues describe the local curvature of the loss
          landscape.
        </li>
      </ul>

      <p>
        <strong>Cross-references:</strong>{" "}
        <a
          href="/codex/gaussian-splatting"
          className="text-pink-200 underline underline-offset-4"
        >
          gaussian splatting
        </a>
        ,{" "}
        <a
          href="/codex/hrtf-head-related-transfer-function"
          className="text-pink-200 underline underline-offset-4"
        >
          HRTF spatial audio
        </a>
        ,{" "}
        <a
          href="/codex/photogrammetry"
          className="text-pink-200 underline underline-offset-4"
        >
          photogrammetry
        </a>
        ,{" "}
        <a
          href="/codex/webgpu"
          className="text-pink-200 underline underline-offset-4"
        >
          WebGPU
        </a>
        . The long-form companion lives at{" "}
        <code className="font-mono text-chrome-200">
          docs/MATH-LINEAR-ALGEBRA.md
        </code>
        .
      </p>

      <p>
        <strong>Further reading:</strong>
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          Gilbert Strang,{" "}
          <em>Introduction to Linear Algebra</em> (Wellesley-Cambridge,
          6th edition, 2023). The textbook the studio reaches for
          first; the chapters on eigenvalues and SVD are the canonical
          treatment.
        </li>
        <li>
          <a
            href="https://www.3blue1brown.com/topics/linear-algebra"
            className="text-pink-200 underline underline-offset-4"
          >
            3Blue1Brown: Essence of Linear Algebra
          </a>
          {" "}&mdash; Grant Sanderson&rsquo;s sixteen-video series.
          The visual intuition for &ldquo;matrix as transformation&rdquo;
          comes from here for most working engineers under forty.
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Eigenvalues_and_eigenvectors"
            className="text-pink-200 underline underline-offset-4"
          >
            Wikipedia: Eigenvalues and eigenvectors
          </a>
          {" "}&mdash; the canonical reference page; usable as a quick
          lookup.
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Singular_value_decomposition"
            className="text-pink-200 underline underline-offset-4"
          >
            Wikipedia: Singular value decomposition
          </a>
          {" "}&mdash; geometric interpretation, applications, and the
          Eckart-Young low-rank-approximation theorem.
        </li>
        <li>
          Trefethen and Bau,{" "}
          <em>Numerical Linear Algebra</em> (SIAM, 1997). When the
          decompositions stop being theoretical and start being floats
          on a GPU, this is the book that explains why the algorithm
          behaves the way it does.
        </li>
      </ul>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The studio&rsquo;s working position is that the geometric
          reading is the load-bearing one. Index notation and the
          summation conventions are useful once a derivation is
          underway, but the picture &mdash; basis vectors landing in
          new positions, ellipsoids stretching along principal axes
          &mdash; is what survives between problems. The maths that
          turns out to matter is the maths that has a picture.
        </li>
        <li>
          Not every matrix has a full set of real eigenvectors. A
          pure 2D rotation matrix has complex eigenvalues
          (e&#7522;&theta; and its conjugate); the &ldquo;axis&rdquo;
          of a 2D rotation lives outside the real plane. In 3D every
          rotation has one real eigenvalue (1) whose eigenvector is
          the rotation axis, plus a complex-conjugate pair for the
          rotation in the perpendicular plane. The fact that 3D
          rotations always have an axis is Euler&rsquo;s rotation
          theorem.
        </li>
        <li>
          The pseudoinverse is the answer to the question
          &ldquo;solve{" "}
          <code className="font-mono text-chrome-200">Mx = b</code>{" "}
          when no exact solution exists, and pick the smallest-norm
          one if many do.&rdquo; That covers nearly every fitting
          problem in computer vision and most of classical machine
          learning. The studio&rsquo;s structure-from-motion path
          uses it inside every refinement iteration.
        </li>
        <li>
          Quaternions also have a multiplicative structure that mirrors
          rotation composition cleanly, which is why slerping (
          spherical linear interpolation) between two orientations
          feels right; lerping Euler angles can swing through
          intermediate orientations the artist never wanted. See the
          quaternions codex entry for the multiplication rules and
          the Hamilton convention vs the JPL convention that catches
          out drone-firmware authors.
        </li>
      </ol>
    </>
  );
}
