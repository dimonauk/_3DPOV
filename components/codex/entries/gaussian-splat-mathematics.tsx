export default function GaussianSplatMathematics() {
  return (
    <>
      <p>
        The companion mathematics entry to{" "}
        <a
          href="/codex/gaussian-splatting"
          className="text-pink-200 underline underline-offset-4"
        >
          gaussian splatting (studio practice)
        </a>{" "}
        and{" "}
        <a
          href="/codex/gaussian-splatting-3d"
          className="text-pink-200 underline underline-offset-4"
        >
          3D gaussian splatting (format landscape)
        </a>
        . Those entries describe what a splat scene is and how the
        studio captures one. This one describes the maths underneath
        &mdash; the primitive, the projection, the rasteriser, the loss
        &mdash; in enough detail that a reader who has done a first
        course in linear algebra and a first course in differentiable
        programming can follow the original Inria paper without
        getting lost.<sup>1</sup>
      </p>
      <p>
        The deep-dive document lives at{" "}
        <code className="font-mono text-chrome-200">
          docs/MATH-GAUSSIAN-SPLATS.md
        </code>{" "}
        and walks the full pipeline: the 3D gaussian primitive (centre,
        covariance, opacity, view-dependent colour); the{" "}
        <em>RSS&#7488;R&#7488;</em> covariance decomposition that keeps
        the optimiser well-conditioned; the Jacobian-based 3D-to-2D
        projection that gives the screen-space ellipse; the
        spherical-harmonic basis used to fake view-dependent shading on
        a budget; the tile-based EWA rasteriser; and the densify /
        prune heuristics that decide where the optimiser allocates more
        capacity. It cites Kerbl et al. (SIGGRAPH 2023), Zwicker et al.
        (EWA splatting, 2002), Wu et al. (4D gaussians, CVPR 2024), and
        the Apple SHARP paper.<sup>2</sup>
      </p>
      <p>
        Why the studio cares about the maths and not just the file
        format: when SHARP outputs a{" "}
        <code className="font-mono text-chrome-200">.ply</code> that
        looks wrong on a viewer, the failure modes are almost always
        downstream of one of three numerical decisions &mdash; covariance
        scale clamps, harmonic-degree truncation, or the alpha-blend
        depth ordering. Knowing which knob to turn is the difference
        between &ldquo;the splat is broken&rdquo; and &ldquo;the splat
        needs three more densification passes at iteration 7,000&rdquo;.
        The maths entry is the troubleshooting reference for the bench.
      </p>
      <p>
        <strong>Where it lives in Holoflow.</strong> The capability that
        embeds a splat in a viewport is{" "}
        <code className="font-mono text-chrome-200">
          lib/capabilities/viz/splat-render.ts
        </code>{" "}
        (renderer-agnostic, currently fronts Spark and the
        mkkellogg three.js viewer). The commission path that runs SHARP
        on the studio bench is the{" "}
        <strong>
          <a
            href="/spatial"
            className="text-pink-200 underline underline-offset-4"
          >
            /spatial
          </a>
        </strong>{" "}
        premium route, fed by the FastAPI service at{" "}
        <code className="font-mono text-chrome-200">
          python-services/sharp_service.py
        </code>
        . The runbook for end-to-end capture-to-map is{" "}
        <code className="font-mono text-chrome-200">
          docs/SHARP_PIPELINE.md
        </code>
        .
      </p>
      <p>
        <strong>Forward references for the maths foundations.</strong>{" "}
        The companion documents under{" "}
        <code className="font-mono text-chrome-200">docs/</code>{" "}
        cover the prerequisites: linear-algebra essentials (vectors,
        matrices, eigendecomposition), numerical-optimization essentials
        (Adam, gradient flow, convergence), projective-geometry
        essentials (the perspective transform and its Jacobian), and
        quaternions-and-rotations (the four-component parameterisation
        used for the rotation factor of the splat covariance). Each is
        cross-referenced from{" "}
        <code className="font-mono text-chrome-200">
          docs/MATH-GAUSSIAN-SPLATS.md
        </code>{" "}
        where it first appears.
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          Kerbl, Kopanas, Leimk&uuml;hler &amp; Drettakis,{" "}
          <a
            href="https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/"
            className="text-pink-200 underline underline-offset-4"
          >
            3D Gaussian Splatting for Real-Time Radiance Field
            Rendering
          </a>{" "}
          (SIGGRAPH 2023, Inria). The paper is short, dense, and worth
          reading after the maths doc rather than before.
        </li>
        <li>
          Zwicker, Pfister, van Baar &amp; Gross,{" "}
          <em>EWA splatting</em>, IEEE TVCG 2002 &mdash; the elliptical
          weighted average filter that the Inria rasteriser inherits.
          The 2002 paper is the reason the 2023 paper&rsquo;s
          screen-space ellipse looks correct under aggressive minification;
          without the EWA prefilter the splat aliases.
        </li>
      </ol>
    </>
  );
}
