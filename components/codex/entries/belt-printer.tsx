export default function BeltPrinter() {
  return (
    <>
      <p>
        A belt printer is a fused-deposition machine in which the build
        plate is a continuous conveyor belt rather than a fixed plate.
        The print head deposits at a fixed angle (typically 45 degrees)
        relative to the belt, which advances as printing proceeds. The
        resulting object has no theoretical maximum length along the
        belt axis &mdash; only along the two cross-axes, set by the
        machine&rsquo;s gantry. The technique was first commercialised
        by the Polish team behind Blackbelt 3D in 2017, and later in
        consumer form by Creality with the CR-30 3DPrintMill in
        2020.<sup>1</sup>
      </p>
      <p>
        The geometry is unusual enough to require its own slicer logic.
        Conventional Cartesian slicers assume a build axis perpendicular
        to the bed; belt printers require a slicer that re-projects the
        model onto the angled coordinate system of the belt. The
        community standard is BlackBelt Cura (a fork) or the dedicated
        Belt-Engine plugin for SuperSlicer. A model exported as if for
        a conventional printer will not print on a belt machine; the
        toolpath must be regenerated against the angled bed.
      </p>
      <p>
        Mechanical limitations are real and rarely advertised. The belt
        surface (PEI-coated nylon, or polycarbonate) wears at the
        contact line over hundreds of hours; belt tracking drifts on a
        long unattended print; layer adhesion across the belt seam can
        fail if the belt&rsquo;s joining tape ages. The cross-section
        of a belt-printed object is constrained by the gantry &mdash;
        typically around 200 &times; 200&nbsp;mm &mdash; even when its
        length runs to multiple metres.
      </p>
      <p>
        Speed and continuity are the two reasons to use a belt printer
        rather than a conventional one. A belt machine can run a single
        long print for days without operator intervention, and can run
        a queue of identical small prints back-to-back without manual
        ejection between them &mdash; finished pieces simply ride off
        the end of the belt as the next one begins. Production runs of
        editioned objects benefit from this; one-off long objects
        benefit even more obviously.
      </p>
      <p>
        The studio operates a single belt printer as the production
        path for long-axis wall reliefs &mdash; gyroid panels at
        200&nbsp;mm &times; 200&nbsp;mm &times; arbitrary length &mdash;
        which vomits out continuous fabric-like pieces over the course
        of a working week.<sup>2</sup>

      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The CR-30 was crowdfunded on Kickstarter at $499 in 2020,
          which was the price at which the technique stopped being
          exclusively industrial. Creality stopped manufacturing it in
          2023; the machine survives in workshops where its eccentricities
          are tolerated, and as a second-hand object on UK marketplaces.
        </li>
        <li>
          A belt printer is the answer to the question &ldquo;what if
          the build plate just kept going,&rdquo; which, like most
          good engineering questions, looks obvious in retrospect and
          turns out to be much harder than expected to implement
          reliably.
        </li>
      </ol>
    </>
  );
}
