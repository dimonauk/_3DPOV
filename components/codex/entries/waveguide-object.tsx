export default function WaveguideObject() {
  return (
    <>
      <p>
        A waveguide object is a printed three-dimensional structure
        whose internal geometry channels light through its volume
        rather than illuminating its surface. The general principle is
        the same as the silica optical fibres that carry the global
        internet: light enters a high-refractive-index medium, strikes
        the boundary with the surrounding lower-index medium at greater
        than the critical angle, and totally internally reflects.
        Repeated reflections carry the light along the structure to
        emergence points where the geometry releases it.<sup>1</sup>
      </p>
      <p>
        Total internal reflection was described by Johannes Kepler in
        1611 and quantified by Willebrord Snell shortly afterwards.
        The relevant maths reduces to one inequality: for light
        travelling inside a medium of refractive index{" "}
        <em>n</em><sub>1</sub> against a boundary with a medium of
        index <em>n</em><sub>2</sub>, total internal reflection occurs
        when the angle of incidence exceeds{" "}
        sin<sup>&minus;1</sup>(<em>n</em><sub>2</sub>/<em>n</em><sub>1</sub>).
        For a clear photopolymer resin (<em>n</em>&nbsp;&approx;&nbsp;1.50)
        in air (<em>n</em>&nbsp;&approx;&nbsp;1.00) the critical angle
        is about 41.8 degrees; for the same resin in water it is around
        62 degrees.
      </p>
      <p>
        Engineering a waveguide object means designing both the bulk
        geometry that conducts the light and the surface features that
        extract it. Smooth interior channels (printed in clear resin
        on a high-resolution SLA machine, then polished or vapour-
        smoothed) form the conducting paths; deliberate roughenings,
        kinks, or extraction features release light at chosen points.
        The output is an object that glows from within at specified
        locations when illuminated from a single entry face,
        producing a pattern that has no surface analogue and cannot
        be photographed flatly.
      </p>
      <p>
        The triply periodic minimal surfaces &mdash; gyroid, Schwarz,
        Neovius &mdash; are useful waveguide substrates because their
        continuous, self-connected geometry provides long internal
        light paths with predictable curvature. A gyroid wall section
        in clear resin, illuminated at one face, glows along its
        entire run of channels with diminishing intensity along the
        light path. The fall-off curve is the visible signature of the
        material&rsquo;s attenuation coefficient.
      </p>
      <p>
        The studio&rsquo;s signature pieces in this family are gyroid-
        based wall objects in clear photopolymer with deliberate
        extraction features at specified emergence points, fed from
        edge-mounted addressable LED arrays via short butt-coupled
        fibre runs.<sup>2</sup>
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          Kao &amp; Hockham, working at STC in Harlow in 1966, are the
          conventional candidates for the invention of practical
          optical fibre. Kao took a Nobel in 2009 for the same paper.
          What the resin-printed waveguide object shares with their
          fibre is the principle; what it does not share is the loss
          budget &mdash; a photopolymer waveguide at decimetre scale
          attenuates dramatically over its length, which is half the
          aesthetic point rather than a failure mode.
        </li>
        <li>
          The pieces fail interestingly: a microscopic surface defect
          becomes a bright dot, an internal void becomes a star, a
          poorly-cleaned channel becomes a dead branch. The studio
          has stopped treating these as defects and started treating
          them as the object&rsquo;s biography.
        </li>
      </ol>
    </>
  );
}
