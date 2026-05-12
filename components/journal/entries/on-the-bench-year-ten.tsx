import Link from "next/link";

export default function OnTheBenchYearTen() {
  return (
    <>
      <p>
        Year ten. The pixel pois had been working for four years. Most
        of the people who&rsquo;d started with them had quit them,
        moved to staff or to standard LED. I&rsquo;d kept them because
        they were the only commercially available rigs that read image
        files. The drift was the problem.
      </p>
      <p>
        The drift looks small at the body. The angular speed of a
        spin is not constant &mdash; the rig accelerates and
        decelerates through the cycle, faster at the bottom of the
        arc than at the top, faster on the dominant side than the
        other. The commercial rigs clock to time. They write columns
        at fixed millisecond intervals. The body provides the
        non-constant rotation. The image stretches and compresses by
        a few pixels per column. Over twelve revolutions, that&rsquo;s
        not a blur; it&rsquo;s a smear.
      </p>
      <p>
        I built the first replacement on a desk in the spare room. A
        Teensy 3.1 I&rsquo;d bought for a different project, a strip
        of WS2812Bs I&rsquo;d had for nine months without knowing what
        to do with, a Hall-effect sensor and a neodymium magnet that
        I&rsquo;d ordered together and forgotten the original use of.
        The chassis was 5mm acrylic, hand-sawn, drilled by eye.
      </p>
      <p>
        The first photograph the new rig took was a vertical white
        line. It was a vertical white line. Not a wavy ghost &mdash;
        a vertical white line. I took fifteen more of the same line
        to make sure it wasn&rsquo;t a fluke. None of them were a
        fluke.
      </p>
      <p>
        I rebuilt the chassis properly the next month. Two months
        later it was a polished aluminium one. Six months later it
        was a balanced pair. The principle hasn&rsquo;t changed since
        that vertical white line on the spare-room desk: sync to
        angle, not to time. Everything else is{" "}
        <Link
          href="/articles/why-i-build-my-own-rigs"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          the article
        </Link>
        .
      </p>
    </>
  );
}
