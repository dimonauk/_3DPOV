export default function WaveguideOpticsDeepDive() {
  return (
    <>
      <p>
        A waveguide is, at heart, a polite agreement between light and a
        material: <em>stay inside, take the long way round, come out
        where I tell you.</em> The agreement is enforced by three
        equations and a small handful of named angles, and once one
        understands those, the whole family of glowing-from-within
        objects on the studio shelves stops being magic and becomes
        bookkeeping &mdash; albeit bookkeeping with a flair for
        drama.<sup>1</sup>
      </p>

      <p>
        The bookkeeping begins with the <strong>refractive index</strong>{" "}
        <em>n</em>, defined as the ratio of the vacuum speed of light to
        its phase speed in a medium. For clear UV photopolymer resin
        <em>n</em>&nbsp;&approx;&nbsp;1.49&ndash;1.51; for ordinary
        crown glass, 1.52; for the dense flint glass of antique
        chandelier drops, 1.62. The number controls everything that
        follows. Bend an index gradient into a tube and one has an
        optical fibre; bend the angle of incidence past a critical
        threshold and the light cannot leave; bend the geometry of an
        emerging wave around a polished curve and one has a whispering
        gallery. Every sculpture in the waveguide line is an exercise
        in choosing which of those bends to commit to.
      </p>

      <h2>Snell&rsquo;s law from least time</h2>

      <p>
        Snell&rsquo;s law &mdash;{" "}
        <em>n</em><sub>1</sub>&nbsp;sin&nbsp;<em>θ</em><sub>1</sub>
        &nbsp;=&nbsp;<em>n</em><sub>2</sub>&nbsp;sin&nbsp;<em>θ</em><sub>2</sub>{" "}
        &mdash; usually arrives in textbooks as a fait accompli. It is
        more satisfying as a consequence of Fermat&rsquo;s principle of
        least time: light, given a choice of paths between two points
        that pass through media of different indices, takes the path
        for which the total optical length{" "}
        <em>n</em>&nbsp;&middot;&nbsp;<em>L</em> is stationary.
        Differentiate the path-time functional with respect to the
        crossing point on the interface, set the derivative to zero,
        and Snell&rsquo;s law falls out as the Euler&ndash;Lagrange
        equation. The light is not being clever; it is the unique path
        that does not change to first order under small
        perturbations.<sup>2</sup>
      </p>

      <h2>The critical angle and total internal reflection</h2>

      <p>
        Solve Snell&rsquo;s law for the case in which light tries to
        leave the denser medium and one finds the refraction angle{" "}
        <em>θ</em><sub>2</sub> increases faster than{" "}
        <em>θ</em><sub>1</sub>. At a particular angle &mdash; the{" "}
        <strong>critical angle</strong>{" "}
        <em>θ</em><sub>c</sub>&nbsp;=&nbsp;arcsin(<em>n</em><sub>2</sub>/<em>n</em><sub>1</sub>) &mdash;
        the refracted ray lies flat along the interface. Beyond that,
        the equation has no real solution: all the energy reflects back
        into the dense medium. This is{" "}
        <strong>total internal reflection</strong>, and it is the
        mechanism that lets a glass fibre carry a phone call across an
        ocean, that lets a resin pendant glow from within, and that
        gives the studio its waveguide line a reason to exist. For
        clear resin in air, <em>θ</em><sub>c</sub>&nbsp;&approx;&nbsp;41.8&deg;;
        about seventy per cent of the hemisphere of internal ray
        directions is trapped.
      </p>

      <h2>Fresnel reflectance below the critical angle</h2>

      <p>
        Below <em>θ</em><sub>c</sub>, light is not all-or-nothing. Some
        reflects, some transmits, and the split depends on polarisation.
        The <strong>Fresnel equations</strong>, derived by
        Augustin-Jean Fresnel in 1821 from the boundary conditions on
        the electric and magnetic fields, give two reflectance
        coefficients: <em>r</em><sub>s</sub> for light polarised
        perpendicular to the plane of incidence, and{" "}
        <em>r</em><sub>p</sub> for light polarised parallel to it. The
        two curves diverge at oblique angles. At
        <strong> Brewster&rsquo;s angle</strong>{" "}
        <em>θ</em><sub>B</sub>&nbsp;=&nbsp;arctan(<em>n</em><sub>2</sub>/<em>n</em><sub>1</sub>),{" "}
        <em>r</em><sub>p</sub> vanishes entirely: light polarised in
        the plane of incidence transmits without reflection. This is
        why polarising sunglasses work &mdash; horizontal road glare is
        Fresnel-reflected at near-Brewster angles and is therefore
        almost wholly horizontally polarised, which a vertical analyser
        rejects. It is also the reason a sculpture lit at oblique
        angles shows a polarisation signature that a flat-on photograph
        loses.
      </p>

      <h2>GRIN waveguides &mdash; gradients instead of walls</h2>

      <p>
        Total internal reflection assumes a sharp interface between
        index <em>n</em><sub>1</sub> and index <em>n</em><sub>2</sub>.
        Smooth the interface into a gradient and the maths becomes
        prettier and the engineering harder. In a{" "}
        <strong>graded-index (GRIN) medium</strong>, the refractive
        index varies continuously through space, and rays curve
        continuously rather than reflecting discretely. The ray
        equation in such a medium &mdash; d/d<em>s</em>(<em>n</em>&nbsp;d<strong>r</strong>/d<em>s</em>)
        &nbsp;=&nbsp;&nabla;<em>n</em> &mdash; is the optical analogue
        of Newton&rsquo;s second law, with the index gradient playing
        the role of a force. Inside a parabolic GRIN profile, rays
        oscillate sinusoidally about the axis; the medium acts as a
        lens with no curved surface. Selfoc lenses, gradient-index
        endoscope rods, and the eye lenses of certain fish all exploit
        this trick.
      </p>

      <h2>Whispering gallery modes</h2>

      <p>
        Curve the interface tightly enough and a third regime opens.
        Light can be trapped not by an angular threshold but by the
        geometry of the boundary itself, circulating around the inside
        of a polished curve as a <strong>whispering gallery mode
        (WGM)</strong>. The resonance condition is straightforward: an
        integer number of wavelengths must fit around the perimeter,
        <em>m</em>&nbsp;<em>&lambda;</em>&nbsp;=&nbsp;2&pi;<em>R</em>&nbsp;<em>n</em>,{" "}
        for mode order <em>m</em> and radius <em>R</em>. The
        consequence is extraordinary: a clean fused-silica microsphere
        can sustain optical Q-factors above 10<sup>10</sup>, meaning a
        photon trapped in the surface mode survives some ten billion
        orbits before being lost to absorption or scattering. The
        acoustic analogue &mdash; voices skimming the curved wall of
        the dome at St Paul&rsquo;s in London &mdash; gave the
        phenomenon its name, by way of Lord Rayleigh&rsquo;s 1910
        analysis.<sup>3</sup>
      </p>

      <h2>Bend-radius constraints</h2>

      <p>
        The bookkeeping has a price: total internal reflection only
        survives if the ray angle relative to the local surface normal
        stays above the critical angle. Curve a waveguide too sharply
        and the geometry tips rays past <em>θ</em><sub>c</sub>; light
        spills out into the cladding (the air, in the studio&rsquo;s
        case) and the waveguide darkens beyond the bend. For a tube of
        cross-section radius <em>r</em>, the minimum bend radius that
        preserves TIR is approximately{" "}
        <em>R</em><sub>min</sub>&nbsp;&approx;&nbsp;<em>r</em>&nbsp;/&nbsp;(1&nbsp;&minus;&nbsp;sin&nbsp;<em>θ</em><sub>c</sub>).
        At <em>r</em>&nbsp;=&nbsp;1&nbsp;mm and the resin-air critical
        angle, that gives roughly 3&nbsp;mm &mdash; the constraint that
        every internal channel in the gyroid line lives inside.
      </p>

      <h2>Caustic surfaces and the inverse problem</h2>

      <p>
        Light leaving a curved refracting surface does not spread
        uniformly. Rays accumulate on an envelope &mdash; the{" "}
        <strong>caustic</strong> &mdash; on which the intensity becomes
        formally infinite in the geometric-optics limit. The shimmering
        net at the bottom of a swimming pool is the caustic of the
        wavy water surface above. The bright crescent inside a tea cup
        is the caustic of the cylindrical wall. For sculpture work, the
        useful question is the inverse one: given a desired pattern of
        light on a wall, find the refracting surface that produces it
        as its caustic. Schwartzburg, Testuz, Tagliasacchi and Pauly
        (SIGGRAPH 2014) solved this in production form as an
        optimal-transport problem &mdash; a Monge&ndash;Kantorovich
        mapping from a uniform source illumination to the target
        intensity distribution, followed by height-field integration to
        produce a millable acrylic blank. The image is not on the
        disc; the image is the caustic the disc throws. See{" "}
        <em>caustics</em> for the full treatment of the algorithm.
      </p>

      <h2>Antireflection coatings</h2>

      <p>
        Every entry face of every waveguide pays a Fresnel tax. At
        normal incidence into clear resin, four per cent of incident
        light reflects back at the front surface before it can do any
        useful guiding. A <strong>quarter-wave antireflection
        coating</strong> recovers most of that. A thin film of index{" "}
        <em>n</em><sub>film</sub>&nbsp;=&nbsp;&radic;(<em>n</em><sub>air</sub>&nbsp;<em>n</em><sub>resin</sub>) and
        optical thickness <em>&lambda;</em>/4 produces two reflected
        wavefronts &mdash; one from the air-film interface, one from
        the film-resin interface &mdash; that are exactly &pi; out of
        phase and cancel by destructive interference. Magnesium
        fluoride (<em>n</em>&nbsp;&approx;&nbsp;1.38) is the textbook
        single-layer coating; modern multi-layer stacks bring
        broadband reflectance below half a per cent. The principle is
        the same that gives soap films their iridescent rims and
        butterfly wings their structural blues, run in reverse for
        suppression rather than colour.
      </p>

      <h2>Resin indices the studio actually works with</h2>

      <p>
        Workshop-Dimona reasserts herself here, because the catalogue
        rounds and the bench measurements diverge. The standard clear
        UV resins the studio runs &mdash; Elegoo Standard, Anycubic
        Basic, Phrozen Aqua-Gray after polish &mdash; sit at{" "}
        <em>n</em>&nbsp;&approx;&nbsp;1.49 at 589&nbsp;nm. The
        Formlabs Clear v4 control I use for known-good waveguide
        coupons measures 1.51. Tinted variants creep up to about 1.56
        depending on dye loading. For comparison, ordinary soda-lime
        crown glass is 1.52 &mdash; sitting cleanly in the middle of
        the resin range, which is why a resin and a glass bead held
        side-by-side in a beam look almost indistinguishable. Dense
        flint glass (the stuff old chandelier drops are cut from) is
        1.62, and that extra index buys it a critical angle of
        38.1&deg; against air and the visible sparkle one expects from
        cut crystal. Diamond, for the record, is 2.42 &mdash; the
        highest practical index of any common transparent solid and
        the reason a brilliant cut traps almost every ray that enters
        the table facet.
      </p>

      <p>
        The headline numbers, then:
      </p>

      <table className="my-6 w-full border-collapse text-sm text-chrome-300">
        <thead>
          <tr className="border-b border-warm-black-700">
            <th className="py-2 text-left">Material</th>
            <th className="py-2 text-left">n at 589 nm</th>
            <th className="py-2 text-left"><em>θ</em><sub>c</sub> against air</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-warm-black-800">
            <td className="py-2">Clear photopolymer resin</td>
            <td className="py-2">1.49&ndash;1.51</td>
            <td className="py-2">41.8&deg;</td>
          </tr>
          <tr className="border-b border-warm-black-800">
            <td className="py-2">Tinted photopolymer resin</td>
            <td className="py-2">1.51&ndash;1.56</td>
            <td className="py-2">39.9&ndash;41.1&deg;</td>
          </tr>
          <tr className="border-b border-warm-black-800">
            <td className="py-2">Soda-lime crown glass</td>
            <td className="py-2">1.52</td>
            <td className="py-2">41.1&deg;</td>
          </tr>
          <tr className="border-b border-warm-black-800">
            <td className="py-2">Flint glass</td>
            <td className="py-2">1.62</td>
            <td className="py-2">38.1&deg;</td>
          </tr>
          <tr>
            <td className="py-2">Diamond</td>
            <td className="py-2">2.42</td>
            <td className="py-2">24.4&deg;</td>
          </tr>
        </tbody>
      </table>

      <h2>Where this lives in Holoflow</h2>

      <p>
        Three product families in the studio depend on the equations
        above being load-bearing rather than ornamental. The{" "}
        <em>waveguide-object</em> sculpture line is the direct
        application: clear-resin pieces whose internal geometry traps
        light by TIR and releases it at chosen extraction features.
        The <em>gyroid-surfaces</em> line uses triply-periodic minimal
        surfaces as substrate &mdash; long internal paths with
        well-conditioned curvature, well above the bend-radius
        threshold &mdash; for wall-scale luminous reliefs. The planned
        <strong> caustic-projector chamber</strong> &mdash; a small
        dark-walled box with a milled acrylic lens at its mouth and a
        point LED behind it &mdash; will throw a chosen image as a
        caustic onto its facing wall, computed by the inverse-transport
        algorithm and milled rather than printed. The same paragraph of
        physics underwrites all three.
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          Hecht, <em>Optics</em> (5th edition) is the working reference
          on the bench. Born &amp; Wolf, <em>Principles of Optics</em>{" "}
          (7th edition) is the longer-walked text when a derivation
          must be checked against first principles rather than against
          a remembered formula.
        </li>
        <li>
          Fermat&rsquo;s principle, formulated in 1662, predates Snell
          by two decades and Newton&rsquo;s corpuscular theory by
          three. It survives quantum mechanics: the path-integral
          formulation reduces to Fermat&rsquo;s principle in the
          short-wavelength limit, with the stationary-action paths
          dominating the contribution to the propagator.
        </li>
        <li>
          Whispering gallery modes were given their theoretical
          treatment in the same 1923 wave of work in which Gustav Mie
          completed the analysis of light scattering by dielectric
          spheres &mdash; the foundation that lets a present-day
          microsphere resonator be characterised at all. The original
          Mie paper is 1908; the mature WGM treatment Debye and others
          developed in the early 1920s is what the studio reaches for
          when checking a polished bead&rsquo;s expected Q.
        </li>
      </ol>
    </>
  );
}
