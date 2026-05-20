export default function DifferentialGeometryEssentials() {
  return (
    <>
      <p>
        Differential geometry is the calculus of curved things. It is
        the language in which the studio explains why a gyroid lattice
        soap-films into existence rather than buckling, why a Gaussian
        splat in a scene has three radii rather than one, why a caustic
        lens throws a sharp image only along certain ridges, and why a
        smooth-shaded mesh looks rounded when its underlying triangles
        are not. The objects are curves and surfaces; the verbs are{" "}
        <em>differentiate, parameterise, measure</em>; the invariants
        that fall out &mdash; curvature, the metric, geodesics, genus
        &mdash; are what the studio actually cares about.<sup>1</sup>
      </p>

      <p>
        <strong>Curves.</strong> A smooth curve in space is a map{" "}
        <code className="font-mono text-chrome-200">
          &gamma;(s) : &#8477; &rarr; &#8477;&sup3;
        </code>
        , and if{" "}
        <code className="font-mono text-chrome-200">s</code> is chosen
        to be{" "}
        <em>arc length</em> the picture is at its cleanest. The unit
        tangent is{" "}
        <code className="font-mono text-chrome-200">
          T(s) = &gamma;&apos;(s)
        </code>
        . The rate at which{" "}
        <code className="font-mono text-chrome-200">T</code> turns is the{" "}
        <strong>curvature</strong>{" "}
        <code className="font-mono text-chrome-200">
          &kappa; = |T&apos;(s)|
        </code>
        ; the direction it turns toward is the principal normal{" "}
        <code className="font-mono text-chrome-200">N</code>; the third
        leg of the moving frame is the binormal{" "}
        <code className="font-mono text-chrome-200">
          B = T &times; N
        </code>
        . The rate at which the curve leans out of its osculating plane
        is the{" "}
        <strong>torsion</strong>{" "}
        <code className="font-mono text-chrome-200">&tau;</code>. The
        Frenet-Serret formulas pack the lot into one matrix system:{" "}
        <code className="font-mono text-chrome-200">
          T&apos; = &kappa; N
        </code>
        ,{" "}
        <code className="font-mono text-chrome-200">
          N&apos; = &minus;&kappa; T + &tau; B
        </code>
        ,{" "}
        <code className="font-mono text-chrome-200">
          B&apos; = &minus;&tau; N
        </code>
        . A straight line has{" "}
        <code className="font-mono text-chrome-200">&kappa; = 0</code>{" "}
        everywhere; a plane curve has{" "}
        <code className="font-mono text-chrome-200">&tau; = 0</code>{" "}
        everywhere; a circular helix has both constants. The fundamental
        theorem of curves says these two scalar functions of arc length
        determine the curve up to rigid motion &mdash; if{" "}
        <code className="font-mono text-chrome-200">&kappa;</code> and{" "}
        <code className="font-mono text-chrome-200">&tau;</code> match,
        the curves are congruent.<sup>2</sup>
      </p>

      <p>
        <strong>Surfaces.</strong> A smooth surface is a map{" "}
        <code className="font-mono text-chrome-200">
          X(u, v) : &#8477;&sup2; &rarr; &#8477;&sup3;
        </code>
        . At each point the two partial derivatives{" "}
        <code className="font-mono text-chrome-200">X_u</code>{" "}
        and{" "}
        <code className="font-mono text-chrome-200">X_v</code>{" "}
        span the{" "}
        <em>tangent plane</em>; their cross product, normalised, is the
        unit{" "}
        <strong>surface normal</strong>{" "}
        <code className="font-mono text-chrome-200">n</code>. The
        studio&rsquo;s mesh shaders sample this object constantly; flat
        shading uses one normal per face, smooth (Gouraud / Phong)
        shading interpolates vertex normals across the face. The
        difference is whether the renderer pretends the surface is
        planar over each triangle or smooth across them. Same triangles,
        different normals, different result.
      </p>

      <p>
        <strong>The first fundamental form.</strong> Length and angle on
        the surface are recorded by the metric tensor{" "}
        <code className="font-mono text-chrome-200">
          I = [[E, F], [F, G]]
        </code>{" "}
        with{" "}
        <code className="font-mono text-chrome-200">
          E = X_u &middot; X_u
        </code>
        ,{" "}
        <code className="font-mono text-chrome-200">
          F = X_u &middot; X_v
        </code>
        ,{" "}
        <code className="font-mono text-chrome-200">
          G = X_v &middot; X_v
        </code>
        . The squared length of an infinitesimal step{" "}
        <code className="font-mono text-chrome-200">
          (du, dv)
        </code>{" "}
        is{" "}
        <code className="font-mono text-chrome-200">
          ds&sup2; = E du&sup2; + 2 F du dv + G dv&sup2;
        </code>
        . The first fundamental form is the surface&rsquo;s own ruler:
        it lets a creature living on the surface measure lengths and
        angles without ever leaving home. Everything you can compute
        from{" "}
        <code className="font-mono text-chrome-200">I</code> alone is{" "}
        <strong>intrinsic</strong>.
      </p>

      <p>
        <strong>The second fundamental form.</strong> How the surface
        bends inside the ambient space is recorded by{" "}
        <code className="font-mono text-chrome-200">
          II = [[L, M], [M, N]]
        </code>{" "}
        with{" "}
        <code className="font-mono text-chrome-200">
          L = X_uu &middot; n
        </code>
        ,{" "}
        <code className="font-mono text-chrome-200">
          M = X_uv &middot; n
        </code>
        ,{" "}
        <code className="font-mono text-chrome-200">
          N = X_vv &middot; n
        </code>
        . This is{" "}
        <strong>extrinsic</strong> &mdash; you cannot compute it without
        knowing which way the surface sits in the ambient three-space.
        The eigenvalues of the shape operator{" "}
        <code className="font-mono text-chrome-200">
          S = I&#8315;&sup1; II
        </code>{" "}
        are the{" "}
        <strong>principal curvatures</strong>{" "}
        <code className="font-mono text-chrome-200">&kappa;&#8321;</code>{" "}
        and{" "}
        <code className="font-mono text-chrome-200">
          &kappa;&#8322;
        </code>{" "}
        &mdash; the maximum and minimum normal curvatures at that point,
        attained along orthogonal directions in the tangent plane. From
        them, two scalars matter enormously:
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>Mean curvature</strong>{" "}
          <code className="font-mono text-chrome-200">
            H = (&kappa;&#8321; + &kappa;&#8322;) / 2
          </code>
          . The average of the two principal curvatures. Extrinsic. A
          soap film stretched across a wire loop minimises area, and the
          Euler-Lagrange equation of that variational problem is{" "}
          <code className="font-mono text-chrome-200">H = 0</code>{" "}
          everywhere. Minimal surfaces are mean-curvature-zero
          surfaces.
        </li>
        <li>
          <strong>Gaussian curvature</strong>{" "}
          <code className="font-mono text-chrome-200">
            K = &kappa;&#8321; &middot; &kappa;&#8322;
          </code>
          . The product. The miracle (Gauss&rsquo;s{" "}
          <em>Theorema Egregium</em>, 1827) is that{" "}
          <code className="font-mono text-chrome-200">K</code> is{" "}
          <em>intrinsic</em> &mdash; it depends only on the metric{" "}
          <code className="font-mono text-chrome-200">I</code>, not on
          how the surface is embedded. A creature on the surface can
          measure{" "}
          <code className="font-mono text-chrome-200">K</code> with
          string and a protractor; it does not need to step outside.
          That is why a flat piece of paper cannot be wrapped around a
          sphere without tearing: the paper has{" "}
          <code className="font-mono text-chrome-200">K = 0</code> and
          the sphere has{" "}
          <code className="font-mono text-chrome-200">K &gt; 0</code>, and
          intrinsic quantities must agree.<sup>3</sup>
        </li>
      </ul>

      <p>
        <strong>Worked example: the sphere of radius R.</strong>{" "}
        Parameterise by latitude{" "}
        <code className="font-mono text-chrome-200">&theta;</code> and
        longitude{" "}
        <code className="font-mono text-chrome-200">&phi;</code>:{" "}
        <code className="font-mono text-chrome-200">
          X = (R sin&theta; cos&phi;, R sin&theta; sin&phi;, R cos&theta;)
        </code>
        . The first fundamental form works out to{" "}
        <code className="font-mono text-chrome-200">
          E = R&sup2;, F = 0, G = R&sup2; sin&sup2;&theta;
        </code>
        ; the second fundamental form to{" "}
        <code className="font-mono text-chrome-200">
          L = R, M = 0, N = R sin&sup2;&theta;
        </code>{" "}
        (with the outward normal). Both principal curvatures equal{" "}
        <code className="font-mono text-chrome-200">1/R</code>{" "}
        everywhere &mdash; the sphere bends the same amount in every
        direction at every point. So{" "}
        <code className="font-mono text-chrome-200">
          H = 1/R
        </code>{" "}
        and{" "}
        <code className="font-mono text-chrome-200">
          K = 1/R&sup2;
        </code>
        . A small sphere is more curved than a large one in both
        senses; the Earth feels flat for the same reason a sufficiently
        large sphere has{" "}
        <code className="font-mono text-chrome-200">K</code> close to
        zero.
      </p>

      <p>
        <strong>Worked example: the plane.</strong> A plane is{" "}
        <code className="font-mono text-chrome-200">X(u, v) = (u, v, 0)</code>
        . The second fundamental form is identically zero, so both
        principal curvatures vanish, and{" "}
        <code className="font-mono text-chrome-200">H = K = 0</code>{" "}
        everywhere. The plane is the trivial minimal surface; it is
        also the trivial flat surface. Cylinders and cones are
        less obvious examples of surfaces with{" "}
        <code className="font-mono text-chrome-200">K = 0</code>{" "}
        but{" "}
        <code className="font-mono text-chrome-200">H &ne; 0</code>{" "}
        &mdash; they bend in one direction and not the other, and that
        is why they unroll flat without distortion.
      </p>

      <p>
        <strong>Why TPMS have H = 0 everywhere.</strong> A{" "}
        <em>triply periodic minimal surface</em> &mdash; the gyroid,
        the Schwarz P, the Schwarz D &mdash; is a non-self-intersecting
        surface that fills space periodically and minimises area
        subject to its topology. The calculus-of-variations setup is:
        among all surfaces in the periodic cell with a given topology,
        find the one of least area. The Euler-Lagrange equation of that
        variational problem is{" "}
        <code className="font-mono text-chrome-200">H = 0</code> at
        every point. So a TPMS is, by construction, a soap film on a
        periodic frame. The principal curvatures are non-zero
        everywhere (the surface is genuinely curved) but they come in
        opposite signs that cancel:{" "}
        <code className="font-mono text-chrome-200">
          &kappa;&#8321; = &minus;&kappa;&#8322;
        </code>
        , which means{" "}
        <code className="font-mono text-chrome-200">
          K &le; 0
        </code>{" "}
        everywhere &mdash; the surface is everywhere saddle-shaped, like
        a Pringle. That saddle-everywhere character is what gives the
        gyroid its uncanny look: there is no convex face to grab onto,
        nowhere the surface settles into a bowl.
      </p>

      <p>
        <strong>One TPMS evaluation.</strong> The gyroid&rsquo;s
        implicit defining function is{" "}
        <code className="font-mono text-chrome-200">
          f(x, y, z) = sin x cos y + sin y cos z + sin z cos x
        </code>
        , with the surface at{" "}
        <code className="font-mono text-chrome-200">f = 0</code>. Pick
        the point{" "}
        <code className="font-mono text-chrome-200">
          (&pi;/4, &pi;/4, &pi;/4)
        </code>
        : every term is{" "}
        <code className="font-mono text-chrome-200">
          (&radic;2/2)(&radic;2/2) = 1/2
        </code>
        , and three of them sum to{" "}
        <code className="font-mono text-chrome-200">3/2</code>{" "}
        &mdash; not zero, so this point is not on the surface. Pick
        instead{" "}
        <code className="font-mono text-chrome-200">
          (0, 0, 0)
        </code>
        : each term is zero, the sum is zero, the origin is on the
        surface. The gradient{" "}
        <code className="font-mono text-chrome-200">&nabla;f</code> at
        the origin is{" "}
        <code className="font-mono text-chrome-200">
          (1, 1, 1)
        </code>{" "}
        &mdash; the surface normal there points along the cube
        diagonal. The studio&rsquo;s gyroid mesher at{" "}
        <code className="font-mono text-chrome-200">
          lib/algorithms/gyroid.ts
        </code>{" "}
        evaluates exactly this function on a regular grid, then runs{" "}
        <a
          href="/codex/marching-cubes"
          className="text-pink-200 underline underline-offset-4"
        >
          marching cubes
        </a>{" "}
        against the zero level set to produce a triangle mesh.
      </p>

      <p>
        <strong>Geodesics.</strong> A geodesic is a curve on the
        surface that is{" "}
        <em>locally length-minimising</em> &mdash; the surface&rsquo;s
        version of a straight line. The defining condition is that the
        curve&rsquo;s acceleration has no tangential component; all of
        it lives along the surface normal. On a sphere the geodesics
        are the great circles; on a plane they are ordinary straight
        lines; on a cylinder they are helices (which unroll to straight
        lines on the flat plane the cylinder unwraps to). On a cone with
        the apex removed they are likewise straight lines on the
        unrolled fan. WebXR&rsquo;s teleportation locomotion uses a
        ballistic-arc approximation in flat-ground regions and a
        geodesic step on uneven terrain; the underlying maths is the
        same equation either way.
      </p>

      <p>
        <strong>Manifolds, charts, and atlases.</strong> A{" "}
        <em>manifold</em> is a space that looks locally like{" "}
        <code className="font-mono text-chrome-200">
          &#8477;&#8319;
        </code>{" "}
        even if globally it does not. A{" "}
        <em>chart</em> is a parameterisation of a patch of the manifold
        by a piece of{" "}
        <code className="font-mono text-chrome-200">
          &#8477;&#8319;
        </code>
        ; an{" "}
        <em>atlas</em> is a collection of charts that cover the whole
        manifold, with smooth transitions on the overlaps. The sphere
        needs at least two charts (stereographic projection from the
        north and south poles); the torus needs four; the plane needs
        only one. Anything you do on the manifold has to behave the
        same under any chart you use to describe it &mdash;{" "}
        <em>coordinate independence</em> is the working principle.
        Tensors are objects that transform the right way under chart
        changes; this is why the metric{" "}
        <code className="font-mono text-chrome-200">I</code> is a
        tensor and why partial derivatives by themselves are not.
      </p>

      <p>
        <strong>Intrinsic versus extrinsic.</strong> Intrinsic geometry
        is everything a creature living on the surface can measure
        without leaving home: lengths, angles, Gaussian curvature,
        geodesic distance.{" "}
        Extrinsic geometry is everything else &mdash; mean curvature,
        the surface normal, how the surface sits inside its ambient
        space. The cylinder is intrinsically flat (same as a plane) but
        extrinsically curved (it has a normal that swings around). The
        sphere is curved both ways. The distinction matters in
        practice: a developable surface (one with{" "}
        <code className="font-mono text-chrome-200">K = 0</code>) can
        be cut and laid flat without distortion &mdash; sheet-metal
        bending, leather patterning, the unwrapping of a 360
        equirectangular projection all live or die by this property.
      </p>

      <p>
        <strong>The Riemann curvature tensor (briefly).</strong> For
        higher-dimensional manifolds the Gaussian curvature
        generalises to the{" "}
        <em>Riemann curvature tensor</em>{" "}
        <code className="font-mono text-chrome-200">
          R&#8315;&#7522;&#8342;&#8343;
        </code>{" "}
        &mdash; four-index, measures how much parallel transport
        around a small loop fails to return to its starting vector.
        On a 2D surface it has only one independent component, which
        turns out to be{" "}
        <code className="font-mono text-chrome-200">K</code>{" "}
        itself. On a 4D Lorentzian manifold it is the object Einstein
        contracts to write{" "}
        <code className="font-mono text-chrome-200">
          G&#8342;&#8343; = 8&pi; T&#8342;&#8343;
        </code>
        &mdash; general relativity is differential geometry put to
        work on spacetime. The studio doesn&rsquo;t solve Einstein
        equations on the bench, but the framework is the same one.
      </p>

      <p>
        <strong>Gauss-Bonnet (intuition only).</strong> Integrate the
        Gaussian curvature over a closed surface and you get a
        topological invariant:{" "}
        <code className="font-mono text-chrome-200">
          &int;&int; K dA = 2&pi; &chi;
        </code>
        , where{" "}
        <code className="font-mono text-chrome-200">&chi;</code> is the
        Euler characteristic and equals{" "}
        <code className="font-mono text-chrome-200">2 &minus; 2g</code>{" "}
        for a closed orientable surface of genus{" "}
        <code className="font-mono text-chrome-200">g</code>. The
        sphere has{" "}
        <code className="font-mono text-chrome-200">g = 0</code>,{" "}
        <code className="font-mono text-chrome-200">&chi; = 2</code>,
        and the integral of{" "}
        <code className="font-mono text-chrome-200">1/R&sup2;</code>{" "}
        over the sphere&rsquo;s area{" "}
        <code className="font-mono text-chrome-200">
          4&pi; R&sup2;
        </code>{" "}
        gives{" "}
        <code className="font-mono text-chrome-200">4&pi;</code>{" "}
        &mdash; exactly{" "}
        <code className="font-mono text-chrome-200">2&pi; &middot; 2</code>
        , which checks. The torus has{" "}
        <code className="font-mono text-chrome-200">g = 1</code>,{" "}
        <code className="font-mono text-chrome-200">&chi; = 0</code>,
        and the total curvature is zero &mdash; the positive curvature
        on the outer ring exactly cancels the negative curvature on the
        inner. You cannot make a globally positively curved torus, or a
        globally flat sphere, without breaking the equation. Topology
        sets a budget that geometry must spend.
      </p>

      <p>
        <strong>Where this appears in the studio&rsquo;s verticals.</strong>
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>TPMS surfaces.</strong> The{" "}
          <a
            href="/codex/gyroid-surfaces"
            className="text-pink-200 underline underline-offset-4"
          >
            gyroid
          </a>
          , Schwarz P, and Schwarz D in{" "}
          <code className="font-mono text-chrome-200">
            lib/algorithms/gyroid.ts
          </code>{" "}
          are{" "}
          <code className="font-mono text-chrome-200">H = 0</code>{" "}
          minimal surfaces; their saddle-everywhere{" "}
          <code className="font-mono text-chrome-200">K &lt; 0</code>{" "}
          character is what gives lattice prints their look and their
          isotropic stiffness.
        </li>
        <li>
          <strong>Mesh shading.</strong> Flat shading uses the face
          normal{" "}
          <code className="font-mono text-chrome-200">
            n = (X_u &times; X_v) / |X_u &times; X_v|
          </code>{" "}
          computed once per triangle; smooth shading interpolates
          per-vertex normals across the face. The studio&rsquo;s WebGPU
          ramp-shader paths choose between them per material.
        </li>
        <li>
          <strong>Splat covariance.</strong> Each splat in a{" "}
          <a
            href="/codex/gaussian-splatting"
            className="text-pink-200 underline underline-offset-4"
          >
            3D Gaussian splatting
          </a>{" "}
          scene carries a 3&times;3 covariance whose eigenvectors and
          eigenvalues are a local approximation to the surface&rsquo;s
          principal directions and principal radii. Where neighbouring
          splats agree, the implied surface is smooth; where they
          disagree, the rasteriser draws an anisotropic blur.
        </li>
        <li>
          <strong>Caustic surfaces.</strong> A{" "}
          <a
            href="/codex/caustics"
            className="text-pink-200 underline underline-offset-4"
          >
            caustic
          </a>{" "}
          is the singular set where the Jacobian of the
          source-to-image mapping degenerates &mdash; locally rank-1
          instead of rank-2 in 2D, the geometric counterpart of a fold
          catastrophe. The studio&rsquo;s caustic-lens pipeline
          formulates the design problem as an optimal-transport map
          and then integrates a height field whose surface normals
          deflect light to taste.
        </li>
        <li>
          <strong>WebXR teleport on uneven ground.</strong> A geodesic
          step on the local terrain mesh keeps the player&rsquo;s feet
          on the surface rather than ballistic-arcing through a hill.
          The terrain is treated as a Riemannian manifold; the locomotion
          solver shoots a geodesic from the toe.
        </li>
      </ul>

      <p>
        <strong>Cross-references:</strong>{" "}
        <a
          href="/codex/linear-algebra-essentials"
          className="text-pink-200 underline underline-offset-4"
        >
          linear algebra
        </a>{" "}
        (the metric and shape operator are linear-algebra objects on
        the tangent plane);{" "}
        <a
          href="/codex/gyroid-surfaces"
          className="text-pink-200 underline underline-offset-4"
        >
          gyroid surfaces
        </a>{" "}
        (the studio&rsquo;s canonical TPMS);{" "}
        <a
          href="/codex/reaction-diffusion-and-tpms"
          className="text-pink-200 underline underline-offset-4"
        >
          reaction-diffusion and TPMS
        </a>{" "}
        (where minimal surfaces meet Turing patterns on the bench);{" "}
        <a
          href="/codex/waveguide-optics-deep-dive"
          className="text-pink-200 underline underline-offset-4"
        >
          waveguide optics
        </a>{" "}
        (geodesic ray paths through a curved index field);{" "}
        <a
          href="/codex/gaussian-splat-mathematics"
          className="text-pink-200 underline underline-offset-4"
        >
          gaussian splat mathematics
        </a>{" "}
        (covariance as a local metric proxy). The long-form companion
        lives at{" "}
        <code className="font-mono text-chrome-200">
          docs/MATH-DIFFERENTIAL-GEOMETRY.md
        </code>
        .
      </p>

      <p>
        <strong>Further reading:</strong>
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          Manfredo do Carmo,{" "}
          <em>Differential Geometry of Curves and Surfaces</em>{" "}
          (Prentice-Hall, 1976; revised Dover edition 2016). The
          gold-standard first text. The Frenet frame, both fundamental
          forms, the Theorema Egregium, and Gauss-Bonnet are all
          presented with the precise mixture of rigour and geometric
          intuition the studio reaches for.
        </li>
        <li>
          Andrew Pressley,{" "}
          <em>Elementary Differential Geometry</em>{" "}
          (Springer Undergraduate Mathematics Series, 2nd edition,
          2010). The gentler companion to do Carmo &mdash; same
          material, more worked examples, fewer aristocratic
          assumptions about the reader&rsquo;s prior calculus.
        </li>
        <li>
          Hermann Karcher and Konrad Polthier,{" "}
          <em>
            Construction of Triply Periodic Minimal Surfaces
          </em>{" "}
          (Philosophical Transactions of the Royal Society A 354,
          1996). The paper that gave the modern numerical recipes for
          building the gyroid, Schwarz P, Schwarz D, and the rest of
          the TPMS zoo; written by two of the architects of the
          field.
        </li>
        <li>
          Michael Spivak,{" "}
          <em>A Comprehensive Introduction to Differential Geometry</em>
          , five volumes (Publish or Perish, 3rd edition, 1999). The
          deep dive. Volume 1 covers the foundations, volume 2 covers
          curvature, volumes 3-5 head into the modern machinery
          (connections, characteristic classes, Lie groups). Not the
          place to start; the place to end up.
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Differential_geometry_of_surfaces"
            className="text-pink-200 underline underline-offset-4"
          >
            Wikipedia: Differential geometry of surfaces
          </a>{" "}
          &mdash; the canonical quick-lookup page; usable for the
          identity-and-formula bits when the textbook is across the
          room.
        </li>
      </ul>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The subject is roughly two hundred years old in its modern
          form: Gauss&rsquo;s 1827{" "}
          <em>Disquisitiones generales circa superficies curvas</em>{" "}
          is the founding text, Riemann&rsquo;s 1854 habilitation
          lecture generalised the framework to arbitrary dimensions,
          and the early twentieth century (Levi-Civita, Cartan, Weyl)
          gave the calculus its modern coordinate-free form. The
          studio uses about the first half of the field; the rest
          waits for a question to demand it.
        </li>
        <li>
          A subtle caveat: torsion is only defined where{" "}
          <code className="font-mono text-chrome-200">&kappa; &ne; 0</code>
          , because the principal normal{" "}
          <code className="font-mono text-chrome-200">N</code> is
          undefined when the curve is locally straight. Straight
          segments embedded in an otherwise smooth curve are a small
          but real pain in implementations; the studio&rsquo;s spline
          tools handle them by carrying a parallel-transported frame
          rather than the Frenet frame, which has no such singularity.
        </li>
        <li>
          Gauss&rsquo;s own demonstration of the Theorema Egregium
          was a calculational tour-de-force in coordinates; the
          modern proofs via the Riemann tensor or moving frames are
          tidier but no more illuminating. The result is the reason
          map-makers cannot draw a flat map of the Earth without
          distorting either area or angle, and the reason a paper
          cone unrolls cleanly but a paper sphere does not.
        </li>
      </ol>
    </>
  );
}
