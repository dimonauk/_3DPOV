export default function ColourScienceAndPerception() {
  return (
    <>
      <p>
        Colour is not a property of objects. It is a negotiation
        between a spectrum of photons, three flavours of retinal cone,
        a cortex that ruthlessly normalises its inputs, and whatever
        the room&rsquo;s light source happens to be doing. The
        Princess will tell you this is delightful; the studio&rsquo;s
        print bench will tell you it is the reason every paper-and-ink
        combination needs its own ICC profile. Both are correct.
        Everything in this entry is the bookkeeping for that
        negotiation &mdash; the wavelengths, the cones, the spaces, the
        gamuts, and the politics of who got to be the &ldquo;standard
        observer&rdquo; in 1931.<sup>1</sup>
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        Light as wavelength and spectrum
      </h2>
      <p>
        Visible light is the slice of the electromagnetic spectrum
        between roughly 380nm (deep violet) and 780nm (deep red). A
        physical light source is described by its{" "}
        <strong>spectral power distribution</strong> (SPD): a curve
        giving the radiant power emitted at each wavelength, measured
        in watts per nanometre per steradian per square metre. The sun
        at noon is a broad continuous SPD peaking in green; a
        tungsten lamp is a shallower curve weighted toward red; a
        532nm green laser is, to within instrument resolution, a
        single spike.
      </p>
      <p>
        A pure 532nm laser line and an &ldquo;equivalent green&rdquo;
        mixed from a display&rsquo;s red, green, and blue subpixels
        are not the same light. They produce the same response in the
        eye (this is the entire reason RGB displays work) but the SPD
        underneath them is wildly different. The laser is one
        wavelength; the RGB green is three narrowish wavelength peaks
        whose combined excitation of the cones happens to match.
        Photograph either through a prism and the deception becomes
        visible. This is called <em>metamerism</em>, and it is the
        first lesson the bench learns the moment it tries to colour-match
        a printed image to the screen it was edited on.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        The human visual system in one paragraph and three tables
      </h2>
      <p>
        The retina holds two populations of photoreceptor: rods, which
        dominate at low light and see in greyscale; and cones, which
        come in three varieties tuned to long, medium, and short
        wavelengths. The cones&rsquo; peak sensitivities, established
        by colour-matching experiments going back to Maxwell and
        codified by the CIE in 1931, sit at roughly:
      </p>
      <table className="my-6 ml-6 text-sm">
        <thead>
          <tr>
            <th className="pr-6 text-left text-chrome-100">Cone</th>
            <th className="pr-6 text-left text-chrome-100">Peak (nm)</th>
            <th className="text-left text-chrome-100">Colloquial name</th>
          </tr>
        </thead>
        <tbody className="text-chrome-300">
          <tr>
            <td className="pr-6">L</td>
            <td className="pr-6">~560</td>
            <td>red-ish (peak is actually yellow-green)</td>
          </tr>
          <tr>
            <td className="pr-6">M</td>
            <td className="pr-6">~530</td>
            <td>green</td>
          </tr>
          <tr>
            <td className="pr-6">S</td>
            <td className="pr-6">~420</td>
            <td>blue-violet</td>
          </tr>
        </tbody>
      </table>
      <p>
        The L cone&rsquo;s peak is not where most people think
        &ldquo;red&rdquo; lives; it is in yellow-green. The brain
        recovers redness by comparing L against M &mdash; the cones
        overlap heavily, and the visual system is in the difference
        business, not the absolute business. This is why colour
        perception is opponent (red&ndash;green, blue&ndash;yellow,
        light&ndash;dark) all the way up the optic nerve.
      </p>
      <p>
        Three regimes of vision sit on top of those receptors:{" "}
        <strong>photopic</strong> vision (cones, daylight, full
        colour), <strong>scotopic</strong> vision (rods only, below
        about 0.01 cd/m&sup2;, colourless), and the muddled in-between
        called <strong>mesopic</strong> vision where both contribute
        and colour identification gets unreliable. Long-exposure
        photography of light-painting performances lives in mesopic
        territory for the performer and squarely in photopic territory
        for the camera, which is one of the reasons{" "}
        <strong>
          <a
            href="/codex/long-exposure-photography"
            className="text-pink-200 underline underline-offset-4"
          >
            long-exposure photography
          </a>
        </strong>{" "}
        produces colours the eye on the bench never quite sees.
      </p>
      <p>
        Above the receptors, the cortex performs three feats the
        bench cannot ignore. <strong>Colour constancy</strong>: a
        white piece of paper looks white under tungsten, daylight, and
        fluorescent illumination despite its reflected SPD changing
        dramatically. <strong>Simultaneous contrast</strong>: a grey
        patch surrounded by red looks faintly green, and the same
        patch surrounded by green looks faintly red. <strong>
          Land&rsquo;s retinex theory
        </strong>{" "}
        (Edwin Land, 1977) proposes that the visual system computes
        lightness independently in three wavelength bands and then
        recombines them, which both explains the constancy result and
        suggests why edge-aware tone-mapping algorithms in image
        processing work as well as they do.<sup>2</sup>
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        The colour spaces &mdash; a small taxonomy
      </h2>
      <p>
        Every colour space is a coordinate system on the same
        underlying psychophysical territory. Some are device-independent
        (XYZ, LAB) and exist to describe colour absolutely; others
        are device-dependent (sRGB, DCI-P3, Adobe RGB) and exist to
        describe the gamut some particular display or printer can
        actually produce. Knowing which is which prevents about
        eighty percent of colour-management mistakes.
      </p>
      <table className="my-6 ml-6 text-sm">
        <thead>
          <tr>
            <th className="pr-6 text-left text-chrome-100">Space</th>
            <th className="pr-6 text-left text-chrome-100">Year</th>
            <th className="text-left text-chrome-100">What it is good for</th>
          </tr>
        </thead>
        <tbody className="text-chrome-300">
          <tr>
            <td className="pr-6">CIE XYZ</td>
            <td className="pr-6">1931</td>
            <td>universal device-independent reference; the ground truth</td>
          </tr>
          <tr>
            <td className="pr-6">CIE xyY</td>
            <td className="pr-6">1931</td>
            <td>chromaticity diagram; the horseshoe; gamut comparisons</td>
          </tr>
          <tr>
            <td className="pr-6">sRGB</td>
            <td className="pr-6">1996</td>
            <td>the web; most consumer monitors; gamma ~2.2</td>
          </tr>
          <tr>
            <td className="pr-6">Rec.709</td>
            <td className="pr-6">1990</td>
            <td>HDTV; same primaries as sRGB, different transfer</td>
          </tr>
          <tr>
            <td className="pr-6">Rec.2020</td>
            <td className="pr-6">2012</td>
            <td>UHD; wide gamut; PQ / HLG transfer for HDR</td>
          </tr>
          <tr>
            <td className="pr-6">DCI-P3</td>
            <td className="pr-6">2007</td>
            <td>cinema; modern Apple displays and iPhones; ~25% wider than sRGB</td>
          </tr>
          <tr>
            <td className="pr-6">Adobe RGB</td>
            <td className="pr-6">1998</td>
            <td>print-oriented; covers more saturated greens than sRGB</td>
          </tr>
          <tr>
            <td className="pr-6">ProPhoto RGB</td>
            <td className="pr-6">2000</td>
            <td>photographer working space; encloses most printable colours</td>
          </tr>
          <tr>
            <td className="pr-6">CIELAB / LCh</td>
            <td className="pr-6">1976</td>
            <td>perceptually uniform; &Delta;E distance ~ perceived difference</td>
          </tr>
        </tbody>
      </table>
      <p>
        <strong>CIE XYZ</strong> is the lingua franca. Every other
        colour space converts to it and back via a 3&times;3 matrix
        (and, for the non-linear spaces, a transfer function). Its X,
        Y, and Z primaries are not real colours; they are mathematical
        primaries chosen so that all visible colours have non-negative
        coordinates, and so that Y corresponds to luminance &mdash; how
        bright the colour appears irrespective of hue. The horseshoe
        chromaticity diagram of <strong>CIE xy</strong> is XYZ flattened
        to two dimensions by normalising out brightness; the gamut of
        any RGB space is a triangle inside that horseshoe with
        vertices at its three primaries.
      </p>
      <p>
        <strong>sRGB</strong> is the web&rsquo;s default and the
        space most photographs encountered on the public internet are
        encoded in. Its primaries are the Rec.709 HDTV primaries; its
        transfer function is the famous piecewise curve described
        below. <strong>DCI-P3</strong> moves the red primary further
        into saturated red and is the native space of every iPhone
        screen since the 7 Plus, every modern Mac display, and the
        Apple Vision Pro. The studio&rsquo;s site copy is encoded
        sRGB on the wire but tagged DCI-P3 for the Apple audience
        wherever the design language calls for saturated colour.
      </p>
      <p>
        <strong>CIELAB</strong> (and its cylindrical cousin LCh,
        which expresses chroma and hue as polar coordinates) deserves
        its own paragraph. It is engineered so that Euclidean distance
        in the space corresponds to perceived colour difference,
        measured as &Delta;E. A &Delta;E of 1 is the just-noticeable
        difference for a trained observer under standard viewing
        conditions; &Delta;E of 2&ndash;3 is noticeable on inspection;
        &Delta;E of 5 or more is obviously a different colour. The
        studio&rsquo;s soft-proofing workflow targets &Delta;E &lt; 2
        between screen and print for the gamut subset both can reach.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        Gamma and tone curves
      </h2>
      <p>
        Displays apply a power-law transfer function (gamma ~2.2)
        because the eye&rsquo;s sensitivity to luminance is itself
        non-linear &mdash; roughly logarithmic in the photopic regime &mdash;
        and because the cathode-ray tubes of 1960s broadcast TV
        happened to have a response close to 2.2. The historical
        accident and the perceptual fact lined up neatly enough that
        the convention stuck.
      </p>
      <p>
        The sRGB transfer function is not quite a pure power law. It
        is piecewise: linear for very dark values (avoiding the
        numerical pathology of a power function near zero) and then
        a 2.4-power curve with an offset for everything else. The
        overall effective gamma is approximately 2.2.
      </p>
      <p className="text-center font-mono text-chrome-200">
        V_linear = (V_srgb &le; 0.04045) ? V_srgb / 12.92 :
        ((V_srgb + 0.055) / 1.055)<sup>2.4</sup>
      </p>
      <p>
        The cardinal rule of colour-correct image processing:{" "}
        <strong>do the maths in linear-light space</strong>, then
        gamma-encode for display. Blending two pixels in gamma-encoded
        sRGB looks wrong (the midpoint of red and green is brown, not
        the mustard-yellow the eye expects) because the encoding
        compresses the dark end. The studio&rsquo;s WebGPU shaders
        decode incoming textures with <code>texture(srgb)</code>{" "}
        sampling, do all blending and lighting in linear, then encode
        on output. Three.js does the same when{" "}
        <code>renderer.outputColorSpace = SRGBColorSpace</code>.
      </p>
      <p>
        HDR raises the ceiling. The <strong>PQ</strong> transfer
        function (SMPTE ST 2084, used in HDR10 and Dolby Vision) and{" "}
        <strong>HLG</strong> (Hybrid Log-Gamma, used by BBC and NHK
        broadcasting) extend the encodable luminance range from
        sRGB&rsquo;s nominal 100 cd/m&sup2; up to 10,000 cd/m&sup2;
        for PQ and a relative range for HLG. The studio does not
        currently master HDR output &mdash; the print workflow is the
        bounding factor, and paper&rsquo;s dynamic range is what it
        is &mdash; but the holographic Looking Glass Portrait pipeline
        in The Hangar is HDR-aware on the WebGPU side.<sup>3</sup>
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        ICC profiles and the end-to-end colour pipeline
      </h2>
      <p>
        An ICC profile is a small file (typically a few hundred
        kilobytes) that describes how a particular device maps between
        its native colour space and CIE XYZ. Every monitor has one;
        every printer has one per paper-and-ink combination; every
        camera has one per RAW interpretation. The colour-management
        engine in the operating system chains those profiles together
        to translate colour values from where they were captured to
        where they will be displayed.
      </p>
      <p>
        The studio&rsquo;s pipeline, end to end:
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>Capture.</strong> Camera RAW file, encoded in the
          sensor&rsquo;s native linear space, demosaiced and
          white-balanced into a working space (the studio uses
          ProPhoto RGB linear in Lightroom) by the RAW converter
          using a camera profile.
        </li>
        <li>
          <strong>Edit.</strong> All retouching and tone work happens
          in 16-bit ProPhoto linear. ProPhoto&rsquo;s gamut is wider
          than any consumer monitor can show; the headroom matters
          for the heavy curve adjustments the studio&rsquo;s long-exposure
          work requires.
        </li>
        <li>
          <strong>Soft-proof.</strong> Before export, the image is
          converted (perceptual or relative-colourimetric intent) to
          the destination ICC profile &mdash; for prints, the
          Hahnem&uuml;hle-supplied profile for Photo Rag 308 on the
          PRO-1100. The screen previews the print&rsquo;s gamut by
          simulating which colours will fall outside it.
        </li>
        <li>
          <strong>Display.</strong> For the web, export sRGB; for the
          editioned print, the printer driver pulls the ICC profile
          and produces ink density values per channel.
        </li>
      </ul>
      <p>
        The studio runs a calibrated Eizo CG2700S as the working
        monitor, a{" "}
        <strong>
          <a
            href="/codex/canon-imageprograf-pro-1100"
            className="text-pink-200 underline underline-offset-4"
          >
            Canon imagePROGRAF PRO-1100
          </a>
        </strong>{" "}
        as the print engine on{" "}
        <strong>
          <a
            href="/codex/hahnemuhle-photo-rag-308"
            className="text-pink-200 underline underline-offset-4"
          >
            Hahnem&uuml;hle Photo Rag 308gsm
          </a>
        </strong>{" "}
        as the default substrate, and annual i1Studio calibration of
        the lot. The chain is one of the largest cost centres in the
        bureau service, and the reason editions ship at the colour
        the artist signed off on rather than the colour the inks
        felt like that morning.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        The studio&rsquo;s specific applications
      </h2>
      <p>
        <strong>Long-exposure photography under battery sag.</strong>{" "}
        The voltage drop across a long shutter shifts addressable-LED
        colour temperature noticeably &mdash; warmer reds, less blue &mdash;
        and a single piece begun on a fresh battery and finished on
        a flat one carries the temperature drift visibly in the
        trace. The studio&rsquo;s working notes for this are in{" "}
        <strong>
          <a
            href="/codex/long-exposure-photography"
            className="text-pink-200 underline underline-offset-4"
          >
            long-exposure photography
          </a>
        </strong>
        ; the gamut implication is that the print profile must hold
        for the warm end of the captured spectrum, which is why
        Photo Rag&rsquo;s natural-white substrate (no OBA) suits the
        work better than a brilliant-white competitor that would push
        the warm rim of every trace toward magenta.
      </p>
      <p>
        <strong>Print profiling for the PRO-1100.</strong> Canon
        ships profiles for every Hahnem&uuml;hle, Canson, and Awagami
        paper they endorse; Hahnem&uuml;hle ships their own profiles
        for every Lucia EX inkset printer; the studio uses the
        Hahnem&uuml;hle versions for the Photo Rag stack and the
        Canon versions for the satin and gloss tests. New paper
        batches get a fresh profile measured on the i1Studio &mdash; not
        because the paper has changed, but because the white point
        of a batch can drift by enough to push a print&rsquo;s
        midtones a couple of &Delta;E off target.
      </p>
      <p>
        <strong>sRGB versus DCI-P3 for the Holoflow site.</strong>{" "}
        The site ships sRGB on the wire and tags DCI-P3 for the
        Apple audience. The bulk of the user base is on iPhone or
        Mac; Apple browsers honour DCI-P3 tagging and the saturated
        pinks in the navigation, the deep violet hero accents, and
        the Aura nameplate gradients all benefit from the wider
        gamut. Windows browsers fall back to sRGB and the design
        still reads correctly; nothing critical lives outside the
        sRGB triangle.
      </p>
      <p>
        <strong>VRM materials and MToon calibration.</strong> The
        studio&rsquo;s VRoid-authored VRM avatars use{" "}
        <strong>
          <a
            href="/codex/mtoon"
            className="text-pink-200 underline underline-offset-4"
          >
            MToon
          </a>
        </strong>{" "}
        as their shading model. MToon&rsquo;s base colour, shade
        colour, and rim colour parameters are authored in sRGB but
        sampled in linear inside the shader; getting the boundary
        right is the difference between Aura&rsquo;s hair rendering
        as the intended saturated violet and rendering as a chalky
        lavender. The TSL implementation in the Crystal honours sRGB
        decode on texture sample by default; the legacy Three.js
        material code in the Holoflow site does the decode manually.
      </p>
      <p>
        <strong>Gaussian-splat radiance encoding.</strong> A 3DGS
        scene encodes per-Gaussian colour as zeroth-order spherical
        harmonics (a single RGB triple) plus, optionally, higher
        bands for view-dependent appearance. The colour gamut of
        the encoding is whatever the trainer wrote out &mdash; usually
        sRGB or linear-sRGB &mdash; and saturated colours outside that
        triangle simply do not exist in the splat. The studio&rsquo;s{" "}
        <strong>
          <a
            href="/codex/gaussian-splatting"
            className="text-pink-200 underline underline-offset-4"
          >
            gaussian splatting
          </a>
        </strong>{" "}
        pipeline trains in linear-sRGB and renders in DCI-P3 where
        the display permits; the wider primaries help the warm
        rim-light passes in particular.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        The politics of who counts as a standard observer
      </h2>
      <p>
        The CIE 1931 colour-matching functions were measured against
        seventeen observers, all British, all light-skinned, all
        viewing through a 2&deg; foveal aperture in a Wright &amp;
        Guild experiment under conditions that have not been
        meaningfully revisited at the foundational level since.
        Subsequent revisions (the 1964 10&deg; observer; the CIE
        170-2 cone fundamentals of 2006) extended the sampling but
        did not unseat the 1931 standard, which remains the
        coordinate system every other colour space is defined in
        terms of.
      </p>
      <p>
        The downstream effect, well documented in the film and
        photographic-industry literature, is that black and brown
        skin were not the implicit reference during the development
        of consumer colour film stocks (Kodak&rsquo;s Shirley cards
        through the 1990s), camera auto-exposure algorithms (the
        face-detection-into-skin-tone-correction pipeline well into
        the 2010s), or stage lighting design until comparatively
        recently. Lorna Roth&rsquo;s 2009{" "}
        <em>Looking at Shirley</em> paper is the standard reference
        on the film-stock history; Joy Buolamwini&rsquo;s 2018{" "}
        <em>Gender Shades</em> is the standard reference on the
        modern algorithmic case.<sup>4</sup>
      </p>
      <p>
        The studio&rsquo;s stance: name skin tones honestly when the
        image is of a person, in the catalogue copy and the alt text;
        do not average toward &ldquo;neutral&rdquo; in retouching
        unless the subject has asked for it; and when soft-proofing
        for print, eyeball the skin-tone region of the gamut against
        the print, not against the screen alone. Photo Rag holds
        warm brown midtones particularly well; the cheaper baryta
        substrates the studio also stocks have a tendency to push
        the warm midtones cool, and the bench notes the shift.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        What this entry connects to
      </h2>
      <p>
        For the substrate and printer that anchor the studio&rsquo;s
        print pipeline, see{" "}
        <strong>
          <a
            href="/codex/hahnemuhle-photo-rag-308"
            className="text-pink-200 underline underline-offset-4"
          >
            Hahnem&uuml;hle Photo Rag 308gsm
          </a>
        </strong>{" "}
        and{" "}
        <strong>
          <a
            href="/codex/canon-imageprograf-pro-1100"
            className="text-pink-200 underline underline-offset-4"
          >
            Canon imagePROGRAF PRO-1100
          </a>
        </strong>
        . For the capture side of the long-exposure pipeline, see{" "}
        <strong>
          <a
            href="/codex/long-exposure-photography"
            className="text-pink-200 underline underline-offset-4"
          >
            long-exposure photography
          </a>
        </strong>
        . For radiance encoding in 3D, see{" "}
        <strong>
          <a
            href="/codex/gaussian-splatting"
            className="text-pink-200 underline underline-offset-4"
          >
            gaussian splatting
          </a>
        </strong>
        . A forthcoming <em>printing-pipeline-mathematics</em> entry
        will pick up the ink-coverage, dot-gain, and screen-vs-print
        gamut-mapping detail this entry only gestures at.
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The canonical reference for the field is G&uuml;nter
          Wyszecki and W. S. Stiles, <em>Color Science: Concepts and
          Methods, Quantitative Data and Formulae</em>, second edition
          (Wiley, 1982 with the 2000 reprint corrections). It is
          imposing and dense; almost every figure in this entry can
          be traced to a table in it. Marc Levoy&rsquo;s Stanford
          CS178 lecture notes &mdash; freely available online &mdash; are a
          gentler entry point with worked examples.
        </li>
        <li>
          Edwin Land, &ldquo;The Retinex Theory of Color Vision,&rdquo;{" "}
          <em>Scientific American</em> 237 (December 1977),
          108&ndash;128. Land was also the inventor of the Polaroid
          camera, which gives the paper an authority the academic
          literature can&rsquo;t quite match.
        </li>
        <li>
          Charles Poynton&rsquo;s <em>Digital Video and HDTV
          Algorithms and Interfaces</em> (Morgan Kaufmann, 2003) is
          the indispensable reference for gamma, transfer functions,
          and the messy history of broadcast colour. The chapter on
          PQ and HLG in the 2012 second edition is the cleanest
          treatment available.
        </li>
        <li>
          Lorna Roth, &ldquo;Looking at Shirley, the Ultimate Norm:
          Colour Balance, Image Technologies, and Cognitive
          Equity,&rdquo; <em>Canadian Journal of Communication</em>{" "}
          34 (2009), 111&ndash;136. Joy Buolamwini and Timnit Gebru,
          &ldquo;Gender Shades: Intersectional Accuracy Disparities
          in Commercial Gender Classification,&rdquo;{" "}
          <em>Proceedings of Machine Learning Research</em> 81 (2018),
          1&ndash;15.
        </li>
      </ol>
    </>
  );
}
