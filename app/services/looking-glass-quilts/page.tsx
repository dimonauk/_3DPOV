import Footer from "components/layout/footer";
import Link from "next/link";

// NOTE: The /services landing page and lib/services.ts are being created
// in parallel. This page is intentionally self-contained and does not
// import from lib/services.ts. When the canonical services data file
// lands, the service entry for "looking-glass-quilts" should have
// `href: "/services/looking-glass-quilts"` set to match this route.

export const metadata = {
  title:
    "Looking Glass quilts — volumetric keepsakes from a light-trail video",
  description:
    "Send a video of a gesture; the studio produces a Looking Glass quilt file, optionally bundled with a Looking Glass Portrait. File-only from £120; Portrait bundle from £580. Holo-Flow Studio, Salford.",
};

export default function LookingGlassQuiltsPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">Services &middot; Looking Glass quilts</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          The kept gesture,
          <br />
          <span className="chrome-sheen">in three dimensions.</span>
        </h1>

        {/* Hero block — Aura voice */}
        <p className="mt-8 max-w-xl text-chrome-200">
          The offer is small and specific. You send the studio a short
          video of a light-trail &mdash; your own, or a performer&rsquo;s,
          or a recording of someone&rsquo;s gesture you want held in
          three dimensions &mdash; and the studio returns a Looking
          Glass quilt: a multi-view volumetric file the Looking Glass
          Portrait reads as depth without a headset. The bench already
          turns long-exposure light into objects you can hold, and
          casts the same gesture into resin you can wear &mdash;
          architectural cousins of this service, both. The quilt is
          the third surface in the same family. Optionally, the
          studio ships the Portrait with the file, set up and
          calibrated, so the keepsake arrives ready to look into.
        </p>
        <p className="mt-4 max-w-xl text-chrome-400 text-sm italic">
          What this is: a video-to-volumetric service. You send a
          clip, the studio returns a quilt file, optional Portrait
          bundled.
        </p>

        {/* The honest paragraph — Dimona voice */}
        <section className="mt-12 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">From the bench</div>
          <p>
            What I actually do, when a clip lands: I extract frames at
            the cadence the source allows, run a depth-estimation pass
            (the bench is currently sitting on the Apple SHARP-adjacent
            monocular-depth line; the choice of model is per-clip), and
            synthesise a 48-view quilt from the recovered geometry. The
            quilt is finished in the AliceLG Blender pipeline &mdash;
            colour-pass, parallax-pass, the small repairs the
            depth-pass always needs &mdash; and then tested on the
            studio&rsquo;s own Looking Glass Portrait before it ships.
            Timing, honestly: two to three weeks from receipt of the
            video to delivery, longer if the source needs work.
            Resolution: the Portrait runs at roughly 420&times;560
            quilt-pixels per view, which is the ceiling the file has
            to live inside; 4K source is comfortable, 1080p is
            workable, anything below 1080p is a stretch and I&rsquo;ll
            tell you before any work begins. What I won&rsquo;t do: I
            won&rsquo;t synthesise a quilt from a single still
            photograph (a clip is what lets the depth-pass actually
            recover depth, not guess it); I won&rsquo;t render a
            recognisable person without a signed consent form from
            them; and I won&rsquo;t touch anything that&rsquo;s
            clearly someone else&rsquo;s IP without rights
            documentation. That last one is non-negotiable.
          </p>
        </section>

        {/* Use this when */}
        <section className="mt-12 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">Use this when&hellip;</div>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
            <li>
              A performer wants a volumetric keepsake of a kata, a
              routine, or a single gesture they performed &mdash; the
              kind of recording a flat video can&rsquo;t hold.
            </li>
            <li>
              A collector wants a piece of light-painting work as a
              <em> gift</em> the recipient can encounter, not just
              hang &mdash; a small object on a shelf that resolves
              into depth when they look into it.
            </li>
            <li>
              A musician wants a volumetric album cover for one of
              their tracks &mdash; the trail of a hand performing the
              song, set against the song itself.
            </li>
            <li>
              A family wants a volumetric record of a parent&rsquo;s
              gesture &mdash; a wave, a dance, a hand-sign &mdash;
              preserved in three dimensions while the person who made
              it can still consent to it being kept.
            </li>
          </ul>
        </section>

        {/* Price block */}
        <section className="mt-12 rounded-sm border border-warm-black-800 bg-warm-black-900/50 p-8">
          <div className="chrome-label">Pricing and bundles</div>
          <h2 className="mt-3 text-2xl text-chrome-100">
            File-only, or file plus Portrait.
          </h2>
          <p className="mt-4 text-chrome-300" data-pricing="proposed">
            File-only delivery, from <strong>&pound;120</strong>{" "}
            &mdash; a 48-view quilt PNG plus the AliceLG project file,
            delivered as a download, viewable on any Looking Glass
            device you already own.
          </p>
          <p className="mt-3 text-chrome-300" data-pricing="proposed">
            With a Looking Glass Portrait bundled, from{" "}
            <strong>&pound;580</strong> &mdash; the Portrait itself
            sits at around &pound;350&ndash;&pound;430 at retail; the
            bundle is the file, the Portrait shipped to you set up
            and calibrated, and a brief one-on-one setup call to make
            sure it&rsquo;s reading the way the studio sent it.
          </p>
          <p className="mt-3 text-chrome-300" data-pricing="proposed">
            Larger Looking Glass devices &mdash; the 32&Prime; Looking
            Glass, in particular &mdash; are available on commission
            for installations: contact for a quote.
          </p>
          <div className="mt-6 flex gap-4">
            <Link
              href="/contact?intent=quilt"
              className="rounded-full border border-pink-200/40 bg-pink-200/10 px-6 py-3 chrome-label text-pink-100 transition-colors hover:border-pink-200 hover:bg-pink-200/20"
            >
              Send a clip &rarr;
            </Link>
          </div>
        </section>

        {/* Workflow — Dimona voice */}
        <section className="mt-12 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">How it works</div>
          <ol className="mt-2 list-decimal pl-5 space-y-3 text-chrome-300">
            <li>
              Send the video via{" "}
              <Link
                href="/contact?intent=quilt"
                className="text-pink-200 underline underline-offset-4"
              >
                /contact?intent=quilt
              </Link>
              &mdash; a short clip is enough at this stage; the studio
              doesn&rsquo;t need the final cut to tell you whether
              this will work.
            </li>
            <li>
              The studio acknowledges within two days with a
              feasibility note &mdash; honest about whether the source
              will hold up at quilt-resolution &mdash; and a confirmed
              price.
            </li>
            <li>
              A draft quilt is produced for your review on the
              studio&rsquo;s own Portrait, screen-recorded so you can
              see what the depth-pass found before sign-off. Roughly
              seven to ten days.
            </li>
            <li>
              Final file is delivered as a download, and the Portrait
              ships if it&rsquo;s bundled. Total clock: fourteen to
              twenty-one days from start.
            </li>
          </ol>
        </section>

        {/* FAQ */}
        <section className="mt-12 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">FAQ</div>
          <dl className="mt-2 space-y-6 text-chrome-300">
            <div>
              <dt className="text-chrome-100">
                Can you do this from a still photograph?
              </dt>
              <dd className="mt-1">
                Not really, and I&rsquo;d rather say so than take the
                job and disappoint you. A single image can be pushed
                through a monocular-depth model and a parallax fake
                synthesised from it &mdash; SHARP-style approaches
                can produce a quilt from one frame &mdash; but the
                quality is markedly lower than what a short clip
                gives. With a clip the depth-pass has actual
                cross-frame geometry to recover; with one image
                it&rsquo;s guessing. If the still is the only thing
                that exists and the subject is non-negotiable, I will
                quote on the lower-quality version separately and be
                honest about what it&rsquo;ll look like in the
                Portrait. Default position: send a clip.
              </dd>
            </div>
            <div>
              <dt className="text-chrome-100">
                What if my video is just my phone&rsquo;s camera?
              </dt>
              <dd className="mt-1">
                Often workable. An iPhone 13 Pro and later shoots 4K
                at bit-depth the depth-pass can use; recent Pixel and
                Samsung flagships are comparable; consumer drone
                footage and 360 cameras are excellent sources because
                they tend to be stabilised and well-exposed. Send the
                source first and I&rsquo;ll tell you what the
                Portrait will make of it before any money moves.
                Low-light handheld phone footage at 1080p is the
                edge case where I&rsquo;m most likely to say no
                politely.
              </dd>
            </div>
            <div>
              <dt className="text-chrome-100">
                What rights do I keep?
              </dt>
              <dd className="mt-1">
                All rights to your source video remain with you; the
                studio doesn&rsquo;t take an interest in the footage
                you send. The delivered quilt file ships with a
                personal-use licence &mdash; you can display it on
                any Looking Glass device you own, lend the device,
                show it in your home or studio. You can&rsquo;t
                resell the file or sublicence it. Commercial
                licensing (gallery installation, music video,
                broadcast, sublicensing to another party) is
                available on a separate quote &mdash; tell me the
                use, I&rsquo;ll quote the licence.
              </dd>
            </div>
          </dl>
        </section>

        {/* Cross-references */}
        <section className="mt-16 prose-gallery text-chrome-200">
          <div className="chrome-label mb-3">Further reading</div>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
            <li>
              <Link
                href="/tutorials/from-photograph-to-object"
                className="text-pink-200 underline underline-offset-4"
              >
                From Photograph to 3D Object
              </Link>{" "}
              &mdash; the architectural cousin: the existing pipeline
              that takes a light-trail and turns it into a held
              object.
            </li>
            <li>
              <Link
                href="/articles/why-the-pendant-glows-from-the-inside"
                className="text-pink-200 underline underline-offset-4"
              >
                Why the Pendant Glows From the Inside
              </Link>{" "}
              &mdash; the volumetric-output cousin: the gesture cast
              as a wearable, lit from within.
            </li>
            <li>
              <Link
                href="/stack#display"
                className="text-pink-200 underline underline-offset-4"
              >
                The stack &mdash; display surfaces
              </Link>{" "}
              &mdash; the Looking Glass Portrait and AliceLG named
              in full as part of the bench.
            </li>
            <li>
              <Link
                href="/atelier#meshes"
                className="text-pink-200 underline underline-offset-4"
              >
                The atelier &mdash; meshes
              </Link>{" "}
              &mdash; the studio&rsquo;s published meshes are
              browsable here; what feeds a quilt commission is a .glb
              from this catalogue or a clip the studio quilts on the
              client&rsquo;s behalf.
            </li>
            <li>
              <Link
                href="/services"
                className="text-pink-200 underline underline-offset-4"
              >
                All services
              </Link>{" "}
              &mdash; back to the catalogue.
            </li>
            <li>
              <Link
                href="/contact?intent=quilt"
                className="text-pink-200 underline underline-offset-4"
              >
                /contact?intent=quilt
              </Link>{" "}
              &mdash; send a clip.
            </li>
          </ul>
        </section>
      </article>
      <Footer />
    </>
  );
}
