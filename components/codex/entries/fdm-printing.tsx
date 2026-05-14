export default function FdmPrinting() {
  return (
    <>
      <p>
        Fused deposition modelling (FDM) is the additive manufacturing
        process in which a thermoplastic filament is melted at the
        nozzle of a moving extruder and deposited in stacked layers
        onto a build plate. S. Scott Crump patented the technique in
        1989 and founded Stratasys to commercialise it; the original
        patent expired in 2009, which triggered the open-source RepRap
        movement and the consumer 3D printer industry that followed.
        The generic term <em>fused filament fabrication</em> (FFF)
        exists because Stratasys retains the FDM trademark.<sup>1</sup>
      </p>
      <p>
        The mechanical envelope is the defining constraint. Layer
        heights between 0.08&nbsp;mm and 0.32&nbsp;mm are routine; the
        nozzle is usually 0.4&nbsp;mm brass and prints lines around
        0.4&ndash;0.6&nbsp;mm wide. Print speed has climbed steeply
        since 2022 &mdash; CoreXY motion systems with input shaping
        (Klipper, Marlin&rsquo;s S-Curve) push 200&ndash;500&nbsp;mm/s
        comfortably on a well-tuned printer. The studio&rsquo;s working
        floor is a Bambu Lab X1 Carbon, which runs at around
        500&nbsp;mm/s with reliable results on standard PLA.
      </p>
      <p>
        Material economics make FDM the commodity layer of fabrication.
        Generic PLA filament sits around &pound;15&ndash;25 per
        kilogram in 2026; PETG is similar; ASA, PA-CF, and PC sit
        higher. A typical wall relief at 200 &times; 300&nbsp;mm in
        single-wall vase mode consumes 80&ndash;150&nbsp;g of filament,
        which is a material cost of two to three pounds against many
        hours of print time. The bottleneck for the studio is rarely
        material; it is the print bed or the print head.
      </p>
      <p>
        Failure modes are the working knowledge that does not appear in
        marketing copy. Warping (bottom-layer separation from the bed),
        layer adhesion failure (top print delaminates), stringing
        (oozed filament between travel moves), elephant&rsquo;s foot
        (bulging first layers from over-squish), and the spaghetti
        catastrophe (model detaches, extruder continues, head buried
        in tangled filament) each have their own diagnostic signature.
        A working printer is one whose operator has internalised that
        signature.
      </p>
      <p>
        The studio operates a small fleet of FDM machines as the
        baseline fabrication layer underneath the
        belt printer and the resin bench, used for prototypes,
        production prints of small editions, and the gyroid wall
        reliefs at scales the belt printer cannot fit.<sup>2</sup>
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The RepRap project &mdash; Adrian Bowyer at Bath, 2005 &mdash;
          set out to build a 3D printer that could print most of its
          own parts. It mostly succeeded. Everything from the Prusa i3
          to the Voron 2.4 is downstream of that pedagogy, which is
          why the open-source firmware (Marlin, Klipper) is still the
          quiet majority of running printers in 2026.
        </li>
        <li>
          The cheapest competent FDM printer in 2026 will outprint the
          most expensive printer of 2018, which is the kind of
          generational shift the industry rarely advertises because it
          tends to make last year&rsquo;s margin model look unwell.
        </li>
      </ol>
    </>
  );
}
