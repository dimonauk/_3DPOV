export default function LightPaintingMathematics() {
  return (
    <>
      <p>
        Light painting looks like magic and is, almost entirely, two
        sums and a clock. The eye integrates over roughly the width of
        a heartbeat; the camera integrates over whatever the shutter
        feels like; an addressable LED ticks at whatever frequency its
        constant-current driver agrees to. The image on the sensor is
        the cross-section where those three rhythms briefly agree.
        Everything in this entry is the bookkeeping for that
        agreement.<sup>1</sup>
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        The integration window of the eye
      </h2>
      <p>
        Persistence of vision, as the popular name has it, is not a
        single neural latch but a family of overlapping mechanisms with
        timescales between roughly 16 and 50 milliseconds. The
        psychophysics literature &mdash; Stuart Anstis&rsquo;s 1986
        chapter on motion perception in <em>Handbook of Perception</em>{" "}
        is the standard reference, alongside the older Bloch&rsquo;s law
        on temporal summation &mdash; gives the working figure: stimuli
        separated by less than about 20 ms tend to fuse into a single
        percept, while those separated by 50 ms or more read as
        discrete events.<sup>2</sup>
      </p>
      <p>
        For a moving point of light the consequence is the famous
        luminous trail. For a moving line of points &mdash; a{" "}
        <strong>
          <a
            href="/codex/pov-led-array"
            className="text-pink-200 underline underline-offset-4"
          >
            POV LED array
          </a>
        </strong>{" "}
        &mdash; the consequence is that the eye stitches successive
        positions into a continuous image, provided each position is
        held for less than the fusion window. A bar of 200 LEDs
        completing one revolution in a second presents each angular
        column for 1/200 s = 5 ms; comfortably under the threshold.
        The Princess is delighted to report that the maths works out.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        The rotation-rate / LED-count equation
      </h2>
      <p>
        Let &omega; be the rig&rsquo;s angular velocity in revolutions
        per second, N the number of LEDs in the array, and &Delta;t the
        time each angular column is held visible. Then:
      </p>
      <p className="text-center font-mono text-chrome-200">
        &Delta;t = 1 / (N &middot; &omega;)
      </p>
      <p>
        Working example. At &omega; = 1 rev/s and N = 200 LEDs &mdash;
        the studio&rsquo;s default handheld rotational rig &mdash; each
        column holds for &Delta;t = 5 ms, giving an angular resolution
        of 360&deg; / 200 = 1.8&deg; per LED column. The fusion budget
        is comfortable; the geometric resolution is fine for a
        camera-facing print but coarse for a viewer standing close to
        the rig with their eyes adapted.
      </p>
      <p>
        Push &omega; to 5 rev/s and &Delta;t falls to 1 ms, well below
        the eye&rsquo;s flicker-fusion threshold. The LED protocol
        becomes the bottleneck: a WS2812 strip at 800 kHz needs (200
        LEDs &times; 24 bits) / 800 kHz = 6 ms to push a frame, which
        no longer fits inside one column. APA102 at an 8 MHz SPI clock
        manages the same payload in 0.6 ms and the rig stays
        synchronous. This is why the studio defaults to APA102 the
        moment rotation enters the equation. See{" "}
        <strong>
          <a
            href="/codex/addressable-leds"
            className="text-pink-200 underline underline-offset-4"
          >
            addressable LEDs
          </a>
        </strong>{" "}
        for protocol specifics.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        Camera sensor integration time T
      </h2>
      <p>
        A long-exposure photograph is the time integral of irradiance
        over the open-shutter interval T. For a moving emissive source
        of intensity I(t) sweeping through pixel coordinate p(t), the
        pixel value at coordinate x is, ignoring constants:
      </p>
      <p className="text-center font-mono text-chrome-200">
        S(x) &prop; &int;<sub>0</sub>
        <sup>T</sup> I(t) &middot; &delta;(x &minus; p(t)) dt
      </p>
      <p>
        Read in English: each pixel accumulates whatever passed through
        it during T, weighted by how long the source stayed and how
        bright it was. The sensor is an honest integrator. The
        photograph is the integration. This is the formal statement of
        what{" "}
        <strong>
          <a
            href="/codex/long-exposure-photography"
            className="text-pink-200 underline underline-offset-4"
          >
            long-exposure photography
          </a>
        </strong>{" "}
        is, and it is the same operation the eye performs at much
        shorter T.
      </p>
      <p>
        Reciprocity follows: equivalent exposures are those that
        deliver the same total photon count to each photosite.
        Halving T while doubling aperture area (one stop) leaves the
        integral unchanged; f/8 at 1 s = f/5.6 at 0.5 s = f/4 at 0.25 s
        for the same scene. The studio&rsquo;s working aperture for
        light-painting is f/8 to f/11 (small enough that depth of field
        forgives small focus errors, wide enough that diffraction
        hasn&rsquo;t blurred the trace yet).
      </p>
      <p>
        Reciprocity failure &mdash; the breakdown of the relationship
        on film at very long T &mdash; is essentially absent on digital
        sensors below a few minutes; CCD and CMOS imagers respond
        linearly across the range light-painters care about. The dark
        current that does accumulate is mostly thermal and shows up as
        long-exposure noise rather than as response non-linearity. The
        Princess therefore declines to recite the Schwarzschild
        exponent.<sup>3</sup>
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        Bayer pattern and the integration that recovers colour
      </h2>
      <p>
        A consumer sensor doesn&rsquo;t measure colour at each
        photosite; it measures one of red, green, or blue through a
        Bayer-mosaic filter, and reconstructs the missing two channels
        per pixel in the demosaicing pass. The mosaic has twice as many
        green photosites as red or blue, mirroring the human luminance
        channel&rsquo;s green-weighted response. Bryce Bayer&rsquo;s
        1976 Eastman Kodak patent (US 3,971,065) is the foundation; the
        practical consequence for light-painters is that a saturated
        red LED falls on only a quarter of the photosites and a
        saturated blue LED on another quarter, so the noise floor of
        the trace is colour-dependent. Pure-cyan and pure-magenta
        traces are quietest; pure-red and pure-blue traces are
        noisiest.<sup>4</sup>
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        PWM, duty cycle, and rolling-shutter banding
      </h2>
      <p>
        An addressable LED does not analogue-dim. It pulses on and off
        at a high frequency, with the ratio of on-time to off-time &mdash;
        the duty cycle &mdash; setting the perceived brightness. WS2812
        runs internal PWM at roughly 400 Hz; APA102 at roughly 20 kHz
        natively, programmable higher. The eye fuses both. The camera
        often does not.<sup>5</sup>
      </p>
      <p>
        Most consumer CMOS sensors read out row by row from top to
        bottom over a small but non-zero interval &mdash; the{" "}
        <strong>rolling shutter</strong>. Each row is therefore
        integrating over a slightly different sub-window of T. If a
        scene-wide light source pulses at a frequency commensurate with
        the row-readout rate, different rows catch the source at
        different phases of its duty cycle and the image records visible
        horizontal bands of brightness and colour. The classic
        manifestation: an LED practice space photographed under cheap
        cinema lights shows pink-and-green stripes across the frame.
      </p>
      <p>
        For long-exposure light-painting at T &ge; 1 s the banding
        averages out across many PWM cycles and the problem effectively
        vanishes. For shorter exposures the working fixes are: raise
        the LED PWM frequency above the sensor&rsquo;s row-readout rate
        (APA102 with custom drivers can reach 50 kHz+), choose a
        shutter speed that is an integer multiple of the LED PWM
        period, or shoot with a global-shutter camera (industrial
        machine-vision sensors, the Sony &alpha;9-series electronic
        global shutter, a few cinema bodies). The Princess prefers the
        first option; the studio uses the third when the budget
        permits.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        Rotation aliasing
      </h2>
      <p>
        When the studio composites a sequence of frames &mdash; for a
        video of a rig, not a single light-painting still &mdash;
        rotational aliasing returns from the same place wagon wheels
        come from in westerns. If the rig&rsquo;s LED-update rate
        (N &middot; &omega;) is commensurate with the camera&rsquo;s
        frame rate f<sub>frame</sub>, the same LED column lands at the
        same camera-frame phase repeatedly and the image appears
        stationary, drifts backwards, or strobes. The condition is the
        usual sampling-theorem statement: trouble whenever
      </p>
      <p className="text-center font-mono text-chrome-200">
        (N &middot; &omega;) mod f<sub>frame</sub> &asymp; 0
      </p>
      <p>
        For a still long-exposure capture this never matters; the
        integration window is much longer than any rig period. For
        video work the fix is to break commensurability deliberately:
        either pick &omega; off the rational fractions of
        f<sub>frame</sub>, or jitter the LED column rate at the
        microsecond level so any aliasing pattern decorrelates across
        the recording.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        Centripetal forces on a fast rig
      </h2>
      <p>
        The other rotational consequence is mechanical. An LED at
        radius r on a rig spinning at angular velocity &omega;<sub>r</sub>{" "}
        (in radians per second &mdash; <em>not</em> revolutions per
        second; mind the 2&pi;) experiences a centripetal acceleration of:
      </p>
      <p className="text-center font-mono text-chrome-200">
        a = &omega;<sub>r</sub><sup>2</sup> &middot; r
      </p>
      <p>
        At r = 0.5 m and &omega; = 5 rev/s
        (&omega;<sub>r</sub> = 10&pi; rad/s &asymp; 31.4 rad/s), this
        is roughly 493 m/s<sup>2</sup>, or ~50 g. A 30 g LED unit at
        the rig tip therefore pulls 1.5 kg through the structure. At
        10 rev/s the acceleration is 200 g and the LED pulls 6 kg. The
        studio&rsquo;s aluminium-tubing rigs are built for this; the
        rule of thumb is that any wire, screw, battery, or LED on the
        rig must be retained against four times the worst-case
        centripetal load with appropriate margin.<sup>6</sup>
      </p>
      <p>
        The other thing that bends is the rig itself. Long carbon-fibre
        or aluminium booms deflect under load, and the deflection is
        radial &mdash; the LED tip moves outward and trails. The
        deflection is also speed-dependent, so the geometry the camera
        records changes with &omega;. The studio&rsquo;s fix is to
        keep r short (under 30 cm for handheld rotational work),
        cross-brace where r demands it, and calibrate for any residual
        deflection by photographing a known target at each operating
        speed before each session.
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        Colour stability under battery sag
      </h2>
      <p>
        An LED&rsquo;s emission spectrum depends on the current through
        it, and the current depends on the forward voltage drop across
        the junction, and the forward voltage depends on temperature
        and on the supply rail. As a LiPo pack discharges from 4.2 V
        to 3.3 V over a five-minute exposure, an unregulated rail
        drops by 20%+; the LED&rsquo;s red channel falls faster than
        the blue, and the trace recorded by the camera drifts warm
        across the exposure. The eye doesn&rsquo;t notice. The sensor
        does.
      </p>
      <p>
        The fix is a constant-current driver between rail and LED. The
        TLC5927 (Texas Instruments, 16-channel 16-bit current-sink
        driver) regulates each channel to a programmable current
        reference with around 1% tolerance, holding LED current
        constant regardless of supply voltage within its compliance
        range. APA102 ships its own internal current regulation per
        channel, which is one of the reasons it&rsquo;s the studio
        default. The result on a five-minute exposure: highlights stay
        saturated, shadows stay neutral, and the colour temperature
        of a white LED is the same in frame ten as in frame one.<sup>7</sup>
      </p>

      <h2 className="mt-12 mb-4 text-2xl text-chrome-100">
        Where this lives at the studio
      </h2>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>The bench&rsquo;s POV LED rigs.</strong> Teensy 3.1 +
          APA102 + TLC5927 + Hall-effect rotation reference + SD-card
          frame data. See{" "}
          <strong>
            <a
              href="/codex/pov-led-array"
              className="text-pink-200 underline underline-offset-4"
            >
              POV LED array
            </a>
          </strong>{" "}
          and{" "}
          <strong>
            <a
              href="/codex/teensy"
              className="text-pink-200 underline underline-offset-4"
            >
              Teensy
            </a>
          </strong>
          .
        </li>
        <li>
          <strong>The /aerial light-painting line.</strong> Drone-mounted
          LED arrays running the same maths on a longer baseline; the
          rig becomes a flying line and the kata becomes a flight path.
        </li>
        <li>
          <strong>The bezel-clip controllers.</strong> The hand-held
          rotational triggers that hand the operator instantaneous
          control of the rig&rsquo;s frame index without breaking the
          gesture.
        </li>
        <li>
          <strong>The Pixelstick.</strong> The commercial reference for
          a 200-LED hand-walked bar; the studio&rsquo;s own rigs were
          designed in dialogue with it. See{" "}
          <strong>
            <a
              href="/codex/pixelstick"
              className="text-pink-200 underline underline-offset-4"
            >
              Pixelstick
            </a>
          </strong>
          .
        </li>
      </ul>
      <p>
        The longer companion doc at{" "}
        <code className="font-mono text-chrome-200">
          docs/PHYSICS-LIGHT-PAINTING.md
        </code>{" "}
        works the photometric integral through with units, walks the
        Bayer demosaicing pipeline, and tabulates the centripetal
        budget for each of the studio&rsquo;s rig sizes. See also{" "}
        <em>persistence-of-vision</em> for the optical foundation,{" "}
        <em>signal-processing-essentials</em> for the sampling-theorem
        view of rotational aliasing, and the planned{" "}
        <em>aerial-light-painting</em> entry for the drone-rig
        derivation.
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The studio builds these rigs by hand. Every figure in this
          entry has been measured at the bench at least once, usually
          with the camera that subsequently photographed the result.
        </li>
        <li>
          Stuart Anstis, &ldquo;Motion Perception in the Frontal
          Plane: Sensory Aspects,&rdquo; in K. R. Boff, L. Kaufman,
          and J. P. Thomas (eds.),{" "}
          <em>Handbook of Perception and Human Performance</em>{" "}
          (Wiley, 1986), Ch. 16. Bloch&rsquo;s law of temporal
          summation (A.-M. Bloch, 1885) is the older statement that
          for brief stimuli, perceived brightness depends only on the
          product of intensity and duration up to a critical duration
          of roughly 100 ms.
        </li>
        <li>
          The Schwarzschild reciprocity-failure exponent applied to
          silver-halide film; Karl Schwarzschild proposed it in 1899.
          Digital sensors are linear integrators of photon count
          across the exposures the studio works at; the relevant
          deviations are read noise and dark current, not reciprocity
          failure.
        </li>
        <li>
          Bryce E. Bayer, &ldquo;Color Imaging Array,&rdquo; US Patent
          3,971,065, filed 1975, granted 1976, assigned to Eastman
          Kodak. The 2:1:1 green-heavy mosaic remains the dominant
          consumer-sensor colour filter, with Fuji&rsquo;s X-Trans the
          notable variant. The colour-noise asymmetry holds across
          both.
        </li>
        <li>
          WS2812B datasheet, Worldsemi Co. Ltd., specifies a single-
          wire 800 kHz protocol with internal PWM around 400 Hz.
          APA102 / SK9822 reference, two-wire SPI, internal PWM
          nominally 20 kHz, programmable higher via the protocol&rsquo;s
          5-bit global brightness field.
        </li>
        <li>
          A 30 g LED unit at r = 0.5 m, &omega; = 5 rev/s, holds
          itself against ~14.8 N. Multiply by four for the working
          retention figure. Wire strain-relief, screw torque, and
          battery-cradle design all flow from this calculation.
        </li>
        <li>
          TLC5927 datasheet, Texas Instruments, SLVS841 (2008). The
          driver provides 16 constant-current sinks programmable from
          5 to 90 mA with 1% channel-to-channel matching; the global
          dot-correction register lets the studio compensate for
          per-LED brightness variation alongside the per-LED colour
          correction described in the{" "}
          <strong>
            <a
              href="/codex/addressable-leds"
              className="text-pink-200 underline underline-offset-4"
            >
              addressable LEDs
            </a>
          </strong>{" "}
          entry.
        </li>
      </ol>
    </>
  );
}
