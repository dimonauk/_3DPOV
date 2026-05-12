import Footer from "components/layout/footer";
import Link from "next/link";

export const metadata = {
  title: "Print bureau",
  description:
    "A2 fine-art print bureau on a Canon imagePROGRAF PRO-1100, operated from the Holo-Flow studio in Salford.",
};

export default function BureauPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">A secondary line</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          Print bureau.
          <br />
          <span className="chrome-sheen">
            A2, pigment, careful colour.
          </span>
        </h1>
        <p className="mt-8 max-w-xl text-chrome-200">
          The printer the studio uses for its own editions, open for
          other people&rsquo;s work. Photographs, illustration, prints
          of digital pieces. A2 and smaller, on pigment inks, on paper
          chosen from a short list of archival stocks. I&rsquo;ll
          match colour to your reference and I won&rsquo;t print on a
          paper I haven&rsquo;t tested myself.
        </p>

        <section className="mt-16 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">The machine</div>
          <h2 className="mb-4 text-2xl text-chrome-100">
            Canon imagePROGRAF PRO-1100
          </h2>
          <p>
            Twelve-ink pigment system. Monochrome range managed by three
            separate dilutions of black; colour gamut calibrated against
            the studio's standard viewing light. Maximum print width A2+
            (17&Prime;). Borderless optional.
          </p>
        </section>

        <section className="mt-12 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">Papers held in stock</div>
          <ul className="mt-2 list-disc pl-5 text-chrome-300">
            <li>Hahnem&uuml;hle Photo Rag 308 gsm &mdash; cotton, matte</li>
            <li>
              Hahnem&uuml;hle German Etching 310 gsm &mdash; textured, fine-art
            </li>
            <li>
              Canson Infinity Baryta Prestige II 340 gsm &mdash; barium-coated
              gloss
            </li>
            <li>Ilford Galerie Smooth Cotton Rag 310 gsm</li>
          </ul>
          <p className="mt-4 text-chrome-400 text-sm">
            Other papers available on request with lead time for sourcing.
          </p>
        </section>

        <section className="mt-12 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">How it works</div>
          <ol className="mt-2 list-decimal pl-5 space-y-3 text-chrome-300">
            <li>
              Send your file and notes via the contact form &mdash; select
              "Print bureau" from the subject dropdown. 300 DPI TIFF or
              high-quality JPEG / PSD, sRGB or AdobeRGB, no sharpening
              baked in.
            </li>
            <li>
              The studio will reply with a quote, a recommended paper, and
              an expected lead time. Typically within a day.
            </li>
            <li>
              On approval, a test print is made, photographed under
              reference light, and sent to you for sign-off before the
              final run.
            </li>
            <li>
              Final prints are rolled in archival tubes (or crated flat,
              by arrangement), shipped insured, anywhere.
            </li>
          </ol>
        </section>

        <section className="mt-12 rounded-sm border border-warm-black-800 bg-warm-black-900/50 p-8">
          <div className="chrome-label">Availability</div>
          <h2 className="mt-3 text-2xl text-chrome-100">
            Opening to external clients soon.
          </h2>
          <p className="mt-4 text-chrome-300">
            The bureau is being shaken down with friends of the studio
            first; nothing leaves the shop until I&rsquo;m sure the
            colour holds across the papers. Bookings open to the public
            shortly. To be on that list &mdash; and to get the early
            slots &mdash; write in now.
          </p>
          <div className="mt-6 flex gap-4">
            <Link
              href="/contact?intent=bureau"
              className="rounded-full border border-pink-200/40 bg-pink-200/10 px-6 py-3 chrome-label text-pink-100 transition-colors hover:border-pink-200 hover:bg-pink-200/20"
            >
              Request early access
            </Link>
          </div>
        </section>
      </article>
      <Footer />
    </>
  );
}
