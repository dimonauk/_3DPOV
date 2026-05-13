import Link from "next/link";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function CalibratingTheImageprografPro1100() {
  return (
    <>
      <p>
        A long-exposure light painting is a brutal thing to print. The
        camera held the shutter open for thirty seconds in a field at
        midnight; the rig wrote a cyan trail and a magenta trail
        through the dark; the file you brought home from the field has
        deep velvet shadows almost down to RAW black, and bright sharp
        filament highlights almost up to RAW white. Send the JPEG to a
        printer that doesn&rsquo;t know any of that and you&rsquo;ll
        get muddy blacks, blown highlights, and the cyan-magenta
        channels the studio works in will read as bruise-grey.
      </p>
      <p>
        This is the tutorial for the workflow the bureau actually
        runs. It assumes you have a Canon imagePROGRAF PRO-1100 on a
        bench, a monitor, and an interest in your prints looking like
        the file you started from.
      </p>

      <p>
        <strong>Credit where it is due.</strong> The bureau is set up
        the way it is because of{" "}
        <a
          href="https://www.northlight-images.co.uk/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Keith Cooper&rsquo;s
          <span className="ml-0.5 text-chrome-500">&nearr;</span>
        </a>{" "}
        Canon imagePROGRAF videos and writing at Northlight Images.
        Keith&rsquo;s walk-throughs of the PRO-1000 and PRO-1100 are
        the most thorough English-language reference for these
        printers anywhere on the open web; the studio&rsquo;s ICC
        workflow, the head-strike fix, the off-gas wait, and most of
        the Canon-driver muscle memory came directly out of his
        channel. Watch the lot if you&rsquo;re setting one of these
        up; this tutorial is the studio&rsquo;s own working notes on
        top of that foundation.
      </p>

      <p>
        <strong>Why long-exposure files are hard to print well.</strong>
      </p>
      <p>Three reasons, stacked.</p>
      <p>
        A RAW from a modern full-frame sensor records around fourteen
        stops of dynamic range. A fine-art print on cotton rag
        resolves maybe six and a half stops between deepest black and
        paper white &mdash; a baryta gloss gets you closer to eight.
        The print medium can&rsquo;t physically hold the range the
        camera captured. Something has to give, and the question is
        whether you choose what gives or the printer driver chooses
        for you. The naïve workflow lets the driver choose, and the
        driver is not on your side.
      </p>
      <p>
        Second: light-painting traces are often near-monochromatic
        saturated emission &mdash; a clean cyan LED, a 632 nm red, a
        deep magenta. Those colours live near the edge of the
        printer&rsquo;s gamut and outside the gamut of most papers.
        Without soft-proofing you don&rsquo;t see the clipping until
        the print comes out grey-green where the file was cyan.
      </p>
      <p>
        Third: the highlights of a light trail are <em>aliased</em>{" "}
        &mdash; a thin bright filament one or two pixels wide. Any
        halftoning pass that decides to put a single ink dot instead
        of three loses the trail. Print quality settings matter more
        than they do for a landscape.
      </p>

      <p>
        <strong>The kit.</strong>
      </p>
      <p>The bureau&rsquo;s rig:</p>
      <ol className="mt-2 list-decimal space-y-2 pl-5 text-chrome-300">
        <li>
          <strong>The printer.</strong> A{" "}
          <a
            href="https://www.usa.canon.com/shop/p/imageprograf-pro-1100"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Canon imagePROGRAF PRO-1100{arrow}
          </a>
          . Eleven LUCIA PRO II pigment inks plus a Chroma Optimiser
          (twelve channels through the head). Three densities of black
          handle the monochrome range. 17&Prime; max width,
          2400&nbsp;&times;&nbsp;1200&nbsp;dpi, A2+ output.
        </li>
        <li>
          <strong>A colorimeter for the monitor.</strong> The studio
          uses what used to be sold as the X-Rite i1Display Pro and is
          now sold as the{" "}
          <a
            href="https://calibrite.com/product/display-pro-hl/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Calibrite Display Pro HL{arrow}
          </a>{" "}
          (X-Rite spun the calibration product line out to Calibrite;
          same hardware lineage). A Datacolor SpyderX Pro is the
          obvious alternative at about the same price; both do the
          job.
        </li>
        <li>
          <strong>Paper ICC profiles.</strong> Either downloaded from
          the paper manufacturer, or built in-house with a
          spectrophotometer. The free downloads work; the in-house
          builds are slightly better. More on this below.
        </li>
        <li>
          <strong>A reference viewing light.</strong> 5000K, CRI 95+,
          at the print surface. The classic Solux 4700K halogen has
          been discontinued (the EU halogen ban took its supply chain
          out); the bureau now uses a{" "}
          <a
            href="https://www.gtilite.com/products/desktop-viewers/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            GTI PDV-2020e{arrow}
          </a>{" "}
          desktop viewer for sign-off and a pair of Yuji LED bulbs
          (5000K, CRI 98) over the bench for working.{" "}
          <em>Anything</em> you can verify is 5000K and CRI 95+ is
          fine; what isn&rsquo;t fine is sodium street-lamp through
          the window or a 3000K kitchen LED.
        </li>
      </ol>

      <p>
        <strong>Calibrate the monitor first.</strong>
      </p>
      <p>
        Nothing else works if this doesn&rsquo;t. The monitor is the
        only object in the loop that you can&rsquo;t see being wrong
        &mdash; the print, you can hold next to a reference. The
        screen, you trust on faith until it&rsquo;s wrong.
      </p>
      <p>
        Bureau targets: <strong>120 cd/m&sup2;</strong> brightness
        (this is dim by a games-monitor standard, but it&rsquo;s
        roughly the luminance a print on rag reflects under good
        viewing light; matching them is the whole point), white point{" "}
        <strong>D65</strong>, gamma <strong>2.2</strong>. The
        Calibrite software walks you through a fifteen-minute
        procedure that ends with an ICC profile written to the OS
        &mdash; macOS picks it up automatically, Windows registers it
        against the display in Colour Management. Re-calibrate
        monthly; backlights drift.
      </p>
      <p>
        A nicety: ambient light in the room matters too. The Calibrite
        software will measure it and complain if you&rsquo;re grading
        in a sunlit kitchen. Listen to it.
      </p>

      <p>
        <strong>Paper profiling.</strong>
      </p>
      <p>
        For the four papers the bureau stocks (see{" "}
        <Link href="/bureau" className={ext}>
          /bureau
        </Link>{" "}
        for the current list), manufacturer-supplied ICC profiles for
        the PRO-1100 are available as free downloads:
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-chrome-300">
        <li>
          <a
            href="https://www.hahnemuehle.com/en/digital-papers/icc-profile/download-center.html"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Hahnem&uuml;hle ICC download centre{arrow}
          </a>{" "}
          &mdash; Photo Rag 308 and German Etching 310 both have
          PRO-1100 profiles. Look for the &ldquo;MK&rdquo; suffix
          (Matte Black ink loaded).
        </li>
        <li>
          <a
            href="https://www.canson-infinity.com/en/icc-profiles"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Canson Infinity ICC selector{arrow}
          </a>{" "}
          &mdash; Baryta Prestige II for the PRO-1100 with PK (Photo
          Black) loaded.
        </li>
        <li>
          <a
            href="https://www.ilford.com/ilford-profiles/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Ilford profiles page{arrow}
          </a>{" "}
          &mdash; Smooth Cotton Rag for the PRO-1100, MK.
        </li>
      </ul>
      <p>
        For any paper without a manufacturer profile, the bureau
        builds its own with an X-Rite i1Pro 3 spectrophotometer: print
        the supplied 936-patch test chart, read it in two passes (the
        spectro averages), let the profiling software (ColorChecker
        Studio or i1Profiler) crunch for two minutes. Total cycle is
        about twenty minutes per paper. The difference between a
        manufacturer profile and an in-house one on the same paper is
        small but measurable &mdash; about a delta-E of one or two on
        average; visible in saturated blues and reds, invisible
        elsewhere.
      </p>

      <p>
        <strong>Soft-proofing.</strong>
      </p>
      <p>
        Open the light-painting file in Lightroom or Photoshop. Turn
        soft-proofing on (Cmd-Y in Photoshop). Set the proof profile
        to the paper&rsquo;s ICC. Set the rendering intent to{" "}
        <strong>
          Relative Colorimetric with Black Point Compensation
        </strong>{" "}
        for ninety per cent of light-painting work &mdash; it
        preserves the saturated trail colours and maps the deep blacks
        intelligently. The exception is images with a wide deep-shadow
        field where you need every step of tonal separation; for
        those, switch to <strong>Perceptual</strong> and accept a
        small overall desaturation as the cost of keeping shadow
        detail.
      </p>
      <p>
        Turn the gamut warning on (Shift-Cmd-Y). Light-painting
        photographs will light up across saturated highlights almost
        every time. The fix isn&rsquo;t to ignore the warning;
        it&rsquo;s to pull a Hue/Saturation layer onto just the
        out-of-gamut colours and desaturate them five to fifteen per
        cent until the warning clears. The print will then match what
        you can see in soft-proof, which is the whole game.
      </p>

      <p>
        <strong>The test-print discipline.</strong>
      </p>
      <p>
        Never print A2 first. Ever. The bureau&rsquo;s rule is: A4
        test strip, viewed under reference light, compared against
        monitor at calibration brightness, before any larger run.
      </p>
      <p>
        The A4 isn&rsquo;t a thumbnail of the A2 &mdash; it&rsquo;s a
        100% crop of the visually critical region (the brightest
        trail, the deepest shadow, any skin tone present if the
        kata-performer is in frame). The bureau&rsquo;s test crop is
        roughly 20&times;30 cm. The paper is the same paper, the
        media setting is the same, the ICC is the same, the rendering
        intent is the same. Only the page size changes.
      </p>
      <p>
        Print settings in the Canon driver, for the avoidance of
        doubt:
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-chrome-300">
        <li>
          Media Type: matched to the paper (the manufacturer&rsquo;s
          profile readme tells you which Canon media setting to use;
          for Hahnem&uuml;hle Photo Rag it&rsquo;s usually
          &ldquo;Heavyweight Fine Art Paper&rdquo;).
        </li>
        <li>
          Print Quality: <strong>Highest</strong>, every time.
        </li>
        <li>
          Colour Mode:{" "}
          <strong>None / No Colour Correction</strong> (the
          application is handling colour via the ICC profile; you do
          not want the driver doing it as well).
        </li>
        <li>
          Chroma Optimiser: <strong>Auto</strong>. For baryta glosses
          you can force it to Overall to suppress bronzing on large
          flat black areas; for matte papers it&rsquo;s off by
          default.
        </li>
        <li>Borderless: only if the file was prepared for it.</li>
      </ul>
      <p>
        Take the A4 to the viewing booth. Don&rsquo;t look at it under
        your kitchen light. Don&rsquo;t look at it under a warm-white
        LED bulb that thinks it&rsquo;s being helpful. 5000K, CRI 95+,
        that&rsquo;s the only verdict that counts. Walk over to the
        monitor (at calibration brightness, not your usual working
        brightness &mdash; the bureau keeps a keyboard shortcut to
        flip the display between &ldquo;work bright&rdquo; and
        &ldquo;120 nits review&rdquo;). Compare.
      </p>
      <p>
        Iterate. Two or three A4 cycles is normal. Five is fine for a
        tricky paper. Then commit the A2.
      </p>

      <p>
        <strong>The final run.</strong>
      </p>
      <p>
        Print the A2 on the same paper, same settings, same profile.
        Inspect under the same viewing light immediately. Look for
        head-strike marks at the top edge (a Canon-specific annoyance
        on heavy fine-art papers if the platen gap isn&rsquo;t set
        correctly; the driver has a manual setting for this).
      </p>
      <p>
        Then leave it alone for twenty-four hours. Pigment inks finish
        off-gassing during this window &mdash; the colour shifts very
        slightly toward its final state, mostly in the deepest blacks.
        Sign, number, and emboss only <em>after</em> the cure.
        Anything earlier and the embossing tool picks up wet ink and
        you have a print you can&rsquo;t sell.
      </p>
      <p>
        Photograph the finished print against a colour reference chart
        for the studio&rsquo;s archive. This is the record that
        travels with the certificate (see{" "}
        <Link href="/photographs" className={ext}>
          /photographs
        </Link>{" "}
        for the certificate convention). It&rsquo;s also the file you
        go back to in three years when the buyer&rsquo;s second print
        needs to match the first.
      </p>

      <p>
        <strong>The thing nobody tells you.</strong>
      </p>
      <p>
        Calibration is not a project. It&rsquo;s a maintenance rhythm.
        Monitor monthly, paper profiles annually (or when you open a
        new box and the batch differs), test strip on every new file.
        Skip a month on the monitor and your D65 drifts toward warm;
        skip a year on the profiles and the paper&rsquo;s receiving
        layer has moved underneath you without telling anyone. The
        trade isn&rsquo;t in being clever once. It&rsquo;s in being
        consistent forever.
      </p>
      <p>Now go print a test strip.</p>

      <p className="mt-12 border-t border-warm-black-800 pt-6 text-sm text-chrome-500">
        Particular thanks to Keith Cooper at{" "}
        <a
          href="https://www.northlight-images.co.uk/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Northlight Images
          <span className="ml-0.5 text-chrome-500">&nearr;</span>
        </a>{" "}
        and on his{" "}
        <a
          href="https://www.youtube.com/@KeithCooper"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          YouTube channel
          <span className="ml-0.5 text-chrome-500">&nearr;</span>
        </a>
        , whose video walk-throughs taught the bureau most of what
        works on the PRO-1100. The prints coming off this printer
        wouldn&rsquo;t look the way they do without his patient,
        unhurried reviews of the entire imagePROGRAF line. Read his
        site; watch the videos; thank him.
      </p>
    </>
  );
}
