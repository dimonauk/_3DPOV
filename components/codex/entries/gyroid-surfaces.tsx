export default function GyroidSurfaces() {
  return (
    <>
      <p>
        The gyroid is a triply periodic minimal surface &mdash; an
        infinite, self-intersecting-free surface with zero mean
        curvature and three-dimensional translational symmetry. Alan
        Schoen, working at NASA&rsquo;s Electronics Research Center in
        1970, discovered the surface as part of a search for new
        triply-periodic minimal surfaces with applications to
        lightweight aerospace structures. The defining implicit
        equation is approximately{" "}
        <code className="font-mono text-chrome-200">
          sin(x)&middot;cos(y) + sin(y)&middot;cos(z) + sin(z)&middot;cos(x) = 0
        </code>
        , which is computationally cheap enough to evaluate on a fine
        grid in real time.<sup>1</sup>
      </p>
      <p>
        The gyroid&rsquo;s natural occurrence was confirmed
        experimentally before its mathematical significance was widely
        appreciated. Saranathan et al. (2010) demonstrated that the
        iridescent blue scales of the butterfly{" "}
        <em>Callophrys rubi</em> are formed of chitin arranged on a
        gyroid lattice at the nanometre scale, producing structural
        colour by photonic-bandgap effects rather than pigment.
        Subsequent work has found gyroid arrangements in beetle exoskeletons,
        block-copolymer self-assembly, and certain mesoporous materials.
        The natural mechanism is the same one Schoen identified by
        minimising surface energy under periodic boundary conditions.
      </p>
      <p>
        In contemporary fabrication, the gyroid sits alongside the
        Schwarz P and Schwarz D surfaces as the workhorse{" "}
        <strong>triply periodic minimal surfaces (TPMS)</strong> for
        lightweight, stiff, isotropic geometry. The surface is
        rendered to a printable mesh by evaluating the implicit on a
        regular grid and running marching cubes against a chosen
        threshold. Wall thickness, cell size, and offset are the three
        parameters that move between hairnet-light and structural.
      </p>
      <p>
        For the studio, the gyroid is a recurring substrate: jewellery
        algorithms thread polished metal along the surface; the
        breeding pipeline lists gyroid as one of its parametric
        families; the macro-gyroid wall reliefs printed on the belt
        printer are gyroid at centimetre scale rather than nanometre.
        The same family of surfaces operates across nine orders of
        magnitude in this studio&rsquo;s output, from butterfly-scale
        photonic structures rendered in resin to wall-sized lattices in
        PLA.<sup>2</sup>
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          Schoen identified seventeen new triply-periodic minimal
          surfaces in the 1970 NASA technical report (TN D-5541),
          including the gyroid (G), the I-WP, the F-RD, and others. The
          gyroid is the only one of the seventeen that contains no
          straight lines and no plane symmetries &mdash; a property that
          went unappreciated outside the differential-geometry community
          until the late 1990s, when industrial 3D printing made the
          surface practically buildable.
        </li>
        <li>
          The studio prefers the gyroid to the Schwarz P for visible
          structural work because the gyroid&rsquo;s lack of straight
          lines reads as &ldquo;organic&rdquo; under most lighting,
          whereas the Schwarz P reads as &ldquo;engineered&rdquo;. This
          is an aesthetic preference; for unseen internal infill the
          two are interchangeable.
        </li>
      </ol>
    </>
  );
}
