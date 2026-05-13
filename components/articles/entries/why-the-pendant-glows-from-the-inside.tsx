import Link from "next/link";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function WhyThePendantGlowsFromTheInside() {
  return (
    <>
      <p>
        Pick up one of the small resin pendants the studio prints.
        Hold it under an ordinary lamp. You will see a soft glow
        running along its inside &mdash; not a reflection on the
        outer surface, not a coating, but light that seems to live
        inside the form and leak gently outward. People ask, fairly,
        how the trick is done. The honest answer is that it is not a
        trick. It is geometry, and once you know the geometry the
        sculpture is doing what it could not avoid doing.
      </p>
      <p>
        This piece is the practical tutorial for that geometry. The
        physics is&nbsp;
        <a
          href="https://en.wikipedia.org/wiki/Total_internal_reflection"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          total internal reflection{arrow}
        </a>
        ; the engineering is waveguide design; the upshot is a
        sculpture that holds its own light. Companion to{" "}
        <Link href="/articles/colour-without-pigment" className={ext}>
          Colour Without Pigment
        </Link>{" "}
        &mdash; that piece is about how the spectrum gets steered;
        this one is about how the light gets in, stays in, and only
        leaves where the geometry tells it to.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Why light gets trapped
      </h2>
      <p>
        Light travels through a transparent material in straight
        lines until it hits a boundary. At the boundary between
        denser material (like resin) and less dense material (like
        air), one of three things happens. It can pass through with
        a bend &mdash; refraction. It can reflect back &mdash; the
        same effect that makes a window slightly mirror-like at
        night. Or, at steep enough angles, all of it can reflect
        back and none escape. That last case is total internal
        reflection, and it is the load-bearing principle behind
        every waveguide sculpture on the bench.
      </p>
      <p>
        The angle at which this happens has a name &mdash;{" "}
        <a
          href="https://en.wikipedia.org/wiki/Total_internal_reflection#Critical_angle"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          the critical angle{arrow}
        </a>{" "}
        &mdash; and a formula:{" "}
        <code className="rounded-sm bg-warm-black-800 px-1.5 py-0.5 font-mono text-[0.78em] text-chrome-100">
          theta_c = arcsin(n_2 / n_1)
        </code>
        . Plug in the numbers. Resin has a refractive index of
        about 1.50. Air is 1.00. The critical angle works out to
        41.8 degrees from the surface normal. Any light ray hitting
        the inside of a resin surface at a steeper angle than that
        cannot get out. It bounces back into the resin and keeps
        going until it finds a surface it CAN escape from, which
        is to say a surface it hits more head-on.
      </p>
      <p>
        Geometrically, this means roughly 70% of the angles a ray
        can hit the inside of a resin surface from result in TIR.
        About 70% of all the light entering a resin tube cannot
        escape through the sides; it has to leave through the ends,
        or through whatever escape features the studio designed
        into the surface, or through scattering at imperfections.
        The default is trapping. The light wants to stay inside
        the resin. The geometry of the sculpture is the instruction
        set telling it where it is allowed to leave.
      </p>
      <p>
        If you would rather drag the angle than read about it, the{" "}
        <Link
          href="/visualiser/total-internal-reflection"
          className={ext}
        >
          TIR visualiser
        </Link>{" "}
        runs the same boundary live &mdash; sweep the incident
        angle, watch the refracted ray dim and vanish the moment
        you cross 41.8&deg;, swap the materials and see the
        threshold move.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Where the trick comes from &mdash; fibre optic, diamond,
        fish
      </h2>
      <p>
        Total internal reflection is not a new trick. It is the
        principle behind&nbsp;
        <a
          href="https://en.wikipedia.org/wiki/Optical_fiber"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          optical fibre{arrow}
        </a>
        , which carries the internet across the seabed in glass
        threads thinner than a human hair. A laser pulse goes in at
        one end of the fibre, hits the cladding at a shallow angle
        the engineers picked specifically to be above the critical
        angle, bounces back into the core, hits the cladding on
        the other side, bounces back again, and continues bouncing
        all the way to the receiver hours of distance later. The
        whole submarine cable industry rests on TIR working
        reliably across thousands of kilometres of slightly
        imperfect glass.
      </p>
      <p>
        It is what makes a&nbsp;
        <a
          href="https://en.wikipedia.org/wiki/Material_properties_of_diamond#Optical_properties"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          diamond sparkle{arrow}
        </a>
        . Diamond has a refractive index of 2.42 &mdash; very high
        &mdash; which gives it a critical angle of only 24 degrees.
        Most rays of light entering a properly cut diamond cannot
        escape through the sides. They bounce around the inside,
        reflecting at every facet, and only exit through the table
        (the flat top). The brilliant-cut shape is an engineering
        decision designed specifically to maximise this trapping
        and then channel all the trapped light upward toward the
        eye of someone looking at the stone.
      </p>
      <p>
        And it is what makes some fish and squid able to lure prey
        in deep water using internal light. The bioluminescent
        organ emits inside a gelatinous body that has a higher
        refractive index than the seawater around it, so the
        light gets guided through channels in the body to specific
        emission points on the skin. The sculpture pipeline is, in
        that sense, borrowing a trick biology has been using for
        millions of years longer than any glass fibre.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The maths, in three lines you actually need
      </h2>
      <p>
        I do not love putting equations in the middle of a piece
        about art objects, but the three following lines are
        load-bearing for anyone trying to design their own
        waveguide work, so they earn their place.
      </p>
      <p>
        <strong>Critical angle.</strong> The angle above which all
        light is trapped:
      </p>
      <p>
        <code className="rounded-sm bg-warm-black-800 px-1.5 py-0.5 font-mono text-[0.78em] text-chrome-100">
          theta_c = arcsin(n_2 / n_1)
        </code>
      </p>
      <p>
        For resin in air, that is 41.8 degrees. For high-IOR
        optical resin (n = 1.60) in air, it is 38.7 degrees. The
        higher the resin&rsquo;s refractive index, the smaller the
        critical angle, the more light gets trapped. Going from
        standard resin to high-IOR resin gets the studio about
        seven percent more trapped light, which compounds along
        the length of a waveguide; over a 50 mm tube, high-IOR
        delivers roughly twice as much light to the far end.
        Material choice matters.
      </p>
      <p>
        <strong>Minimum bend radius.</strong>{" "}
        <a
          href="https://en.wikipedia.org/wiki/Snell%27s_law"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Snell&rsquo;s Law{arrow}
        </a>{" "}
        gives you the angles; what the designer wants is how
        sharply a tube can bend without leaking. A useful
        approximation:
      </p>
      <p>
        <code className="rounded-sm bg-warm-black-800 px-1.5 py-0.5 font-mono text-[0.78em] text-chrome-100">
          R_min = r / (1 - sin(theta_c))
        </code>
      </p>
      <p>
        For a 1 mm-radius resin tube (so a 2 mm-diameter tube,
        which is comfortable to print and to wear), the minimum
        bend radius is about 3 mm. The tube can curve around a
        circle of radius 3 mm and still keep the light trapped
        inside. That is tight enough for almost every poi-arc
        shape the studio captures.
      </p>
      <p>
        <strong>Normal-incidence reflection.</strong> Most of the
        light at every interface gets through, but not all. At
        normal incidence (light hitting head-on):
      </p>
      <p>
        <code className="rounded-sm bg-warm-black-800 px-1.5 py-0.5 font-mono text-[0.78em] text-chrome-100">
          R = ((n_1 - n_2) / (n_1 + n_2))^2
        </code>
      </p>
      <p>
        For resin to air, that is 4% reflection at every surface.
        It compounds with multiple surfaces: ten internal
        boundaries leaves 66% of the original light. Twenty leaves
        44%. This is why a solid resin tube is a better waveguide
        than a hollow channel &mdash; fewer interfaces, less
        compounded loss. The slime-mould network sculptures use
        solid tubes for exactly this reason.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        How a pendant actually glows
      </h2>
      <p>
        Take all of the above and turn it on a waveguide pendant.
        A single warm-white LED at the base of the resin form
        (about 3 mm diameter, surface-mount, drawing 20 mA off the
        small lithium-polymer cell in the bezel). The LED is
        coupled to the resin with a drop of index-matching optical
        gel; that drop is doing real work, because without it
        there is a 4% loss at the LED-air boundary that the gel
        eliminates. Every percent of light entering the pendant
        matters.
      </p>
      <p>
        Light enters the resin and starts travelling. Most of it
        hits the inside of the outer surface at an angle steeper
        than 41.8 degrees and bounces back into the resin. It
        then travels until it hits another surface and either
        bounces again (if the angle is steep) or escapes (if the
        angle is shallow). This bouncing happens millions of times
        per second across millions of rays at once; what the
        viewer sees is the statistical aggregate &mdash; a
        sculpture that holds light in its interior and leaks it
        gently from wherever the geometry presents a shallow
        enough surface for escape.
      </p>
      <p>
        Where the geometry forms thin walls or rough patches or
        designed escape features &mdash; deliberately frosted
        regions, thinned sections under 100 micrometres, small
        notches or bevels &mdash; the trapped light comes out.
        Where the geometry is smooth and thick and curved, the
        light stays. The waveguide pendant&rsquo;s glow is not
        uniform: it is brighter where the design wants it
        brighter, dimmer where the design wants it dimmer, and
        because the design was generated from a captured poi
        movement, the brightness map IS the gesture. The fast
        parts of the arc glow differently from the reversals
        because the geometry encodes the velocity.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The evanescent field &mdash; why it glows at all
      </h2>
      <p>
        Strict TIR sounds like the surface should be completely
        dark, with all the light trapped inside. It is not. The
        electromagnetic field does not stop abruptly at the
        resin-air interface; it leaks out a short distance as an{" "}
        <em>evanescent wave</em> &mdash; an exponentially decaying
        field that extends roughly one wavelength of light (about
        500 nanometres) beyond the surface. The energy stays
        attached to the resin, but the field reaches a tiny
        distance into the air.
      </p>
      <p>
        That field is what produces the soft surface glow. The
        light is technically trapped inside the resin, but the
        near-field leakage makes the surface luminous. This is the
        difference between a waveguide sculpture and a glass
        marble &mdash; both can carry light inside, but the
        waveguide has been designed so that the evanescent field
        is visible, controlled, and modulated by the surface
        roughness. Smooth surfaces give a soft even glow. Rougher
        surfaces, or surfaces with intentional micro-texture from
        the print process, scatter more light out and create
        brighter spots. The Turing reaction-diffusion sculptures
        use this deliberately &mdash; the labyrinthine surface
        texture becomes a brightness map.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        What this means in practice
      </h2>
      <p>
        Three rules govern every waveguide piece the bench
        produces.
      </p>
      <p>
        <strong>Polish the entry surface.</strong> The flat surface
        where the LED couples into the resin has to be optically
        smooth. Raw SLA prints are matte, which scatters the LED
        light and loses 30 to 50% of it before it even enters the
        body. The bench polishes that one surface specifically:
        wet sanding 400-800-1500-2000-3000 grit, then a polish
        with Novus 3 / 2 / 1. The other surfaces stay matte by
        choice, because the matte surface IS the brightness map.
      </p>
      <p>
        <strong>Use index-matching gel at the LED interface.</strong>{" "}
        4% lost at every air gap, compounded. A drop of optical
        gel between the LED dome and the resin entry surface
        eliminates the gap. The studio uses a small bottle of
        Norland NOA-65; it lasts for hundreds of pendants. Worth
        every penny.
      </p>
      <p>
        <strong>Design the escape features in.</strong> Without
        deliberate escape geometry, the pendant traps all the
        light and looks dim from outside. The studio uses three
        techniques, often in combination: frosted patches
        (deliberately roughened surface at the print stage, around
        50 micrometres of texture), thinned sections (under 100
        micrometres of wall, the evanescent field reaches all the
        way through), and small geometric breaks (notches or
        bevels that interrupt TIR at a controlled point). Where
        these features sit on the sculpture is where the gesture
        comes through &mdash; the captured movement&rsquo;s
        high-velocity arcs map to bright escape features, the
        reversals map to dim ones. The poi performance becomes
        the lighting design.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Where to read on
      </h2>
      <p>
        The companion piece is{" "}
        <Link href="/articles/colour-without-pigment" className={ext}>
          Colour Without Pigment
        </Link>{" "}
        &mdash; that piece is about the wavelength side; this one
        is the geometry side. Together they are layers one and two
        of{" "}
        <Link href="/articles/art-as-door-five-layers" className={ext}>
          the five-layer architecture
        </Link>
        : what you see on the shelf, and how it does what it does.
        The practical step-by-step on lighting a finished
        sculpture is in the{" "}
        <Link href="/tutorials/lighting-a-waveguide-object" className={ext}>
          waveguide tutorial
        </Link>
        , which covers LED choice, bezel design, and the optical
        gel workflow. The wearable side is{" "}
        <Link href="/articles/jewellery-the-same-trace-wearable" className={ext}>
          Jewellery &mdash; the Same Trace, Wearable
        </Link>{" "}
        &mdash; the same waveguide pieces scaled to the wrist and
        neck.
      </p>
      <p>
        For the deep version of the physics, the textbook is&nbsp;
        <em>Optics</em> by Eugene Hecht (any edition from the
        fourth onward). For the friendly version, Walter Lewin&rsquo;s
        MIT lectures on YouTube cover Snell&rsquo;s Law and TIR
        with chalk and a tank of water and are genuinely
        delightful. For the engineering version, the&nbsp;
        <em>Handbook of Optical Fibers</em> by Peng (Springer,
        2019) is heavier than you would want but covers every edge
        case a waveguide designer might run into.
      </p>
      <p>
        Or pick up a glass paperweight, shine a torch in one end,
        and watch the light come out at unexpected places.
        That&rsquo;s the entire principle, already in your hand.
      </p>
    </>
  );
}
