import Footer from "components/layout/footer";
import Link from "next/link";
import { ContactForm } from "components/layout/contact-form";

export const metadata = {
  title: "Contact — write to the studio",
  description:
    "Reach Holo-Flow Studio in Salford. Commissions, print bureau, speaking and workshops, editorial enquiries, collaboration. The studio's operator reads every one.",
};

type InquiryLine = {
  label: string;
  body: string;
  links?: { href: string; label: string }[];
};

const INQUIRY_LINES: InquiryLine[] = [
  {
    label: "Commissions",
    body: "Single-exposure light-painting photographs, waveguide objects bred from a recorded gesture, drone capture of heritage sites and worksites, and custom POV-rig builds. Quoted per brief; the conversation starts here.",
  },
  {
    label: "Print bureau",
    body: "Drop-shipped 3D-printed objects from the studio's bench. Paper, resin, and belt-printed work, posted from Salford. Terms and turnaround named on the bureau pages.",
    links: [
      { href: "/bureau", label: "The bureau" },
      { href: "/policies/print-bureau-terms", label: "Bureau terms" },
    ],
  },
  {
    label: "Speaking and workshops",
    body: "Flow arts, immersive systems as cognitive systems, AI agent orchestration, and parametric manufacturing. The studio teaches in the rooms it can stand up in; it doesn't ghost-write conference fluff.",
  },
  {
    label: "Editorial and press",
    body: "Photographs licensed for editorial use, interviews, and features. Single-exposure provenance is named on every photograph; press packs include the camera, the location, and the rig.",
  },
  {
    label: "Collaboration",
    body: "Open to AI, phygital pipelines, and immersive media. The studio is a one-person practice; collaborations work best when both sides bring a bench.",
  },
];

export default function ContactPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">Write to the studio</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          Contact.
        </h1>

        <p className="mt-8 max-w-xl text-chrome-200">
          The studio is a one-person practice in Salford, Greater
          Manchester &mdash; Dimona Dougherty, artistic engineer and
          drone pilot. She reads every message herself. This isn&rsquo;t
          a marketing list; nothing here generates a sales follow-up.
          Write about the work, and the reply will be about the work.
        </p>

        <p className="mt-4 max-w-xl text-chrome-300">
          Replies typically land within a day or two; sometimes faster
          if the kettle is on at the bench. If something is genuinely
          time-bound, put &ldquo;urgent&rdquo; in the subject line and
          it will surface to the top of the thread.
        </p>

        <section className="mt-16">
          <div className="chrome-label">What the studio takes on</div>
          <h2 className="mt-2 text-3xl text-chrome-100">
            Five lines of enquiry.
          </h2>
          <p className="mt-3 max-w-prose text-chrome-300">
            Pick the closest match in the dropdown below. If nothing
            fits, use &ldquo;General enquiry&rdquo; &mdash; the studio
            sorts the rest.
          </p>

          <dl className="mt-8 space-y-6 border-t border-warm-black-800 pt-6">
            {INQUIRY_LINES.map((line) => (
              <div
                key={line.label}
                className="grid grid-cols-1 gap-2 md:grid-cols-[10rem_1fr] md:gap-6"
              >
                <dt className="chrome-label text-pink-200">{line.label}</dt>
                <dd className="text-sm text-chrome-200">
                  {line.body}
                  {line.links && line.links.length > 0 ? (
                    <span className="mt-2 block text-xs text-chrome-400">
                      {line.links.map((l, i) => (
                        <span key={l.href}>
                          {i > 0 ? <span aria-hidden> &middot; </span> : null}
                          <Link
                            href={l.href}
                            className="text-pink-200 underline underline-offset-4"
                          >
                            {l.label}
                          </Link>
                        </span>
                      ))}
                    </span>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-20">
          <div className="chrome-label">The form</div>
          <h2 className="mt-2 text-3xl text-chrome-100">
            Tell the studio what the work is.
          </h2>
          <p className="mt-3 max-w-prose text-chrome-300">
            Three fields and a dropdown. The placeholder shifts to
            match the line of enquiry, in case it helps shape what
            to write.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-12 md:grid-cols-3">
            <div className="md:col-span-2">
              <ContactForm />
            </div>

            <aside className="space-y-8 text-sm text-chrome-300">
              <div>
                <div className="chrome-label mb-2">Direct</div>
                <a
                  href="mailto:contact@holoflow.co.uk"
                  className="text-pink-200 underline underline-offset-4"
                >
                  contact@holoflow.co.uk
                </a>
                <p className="mt-2 text-xs text-chrome-400">
                  Plain email is fine. The form just keeps the thread
                  tidy on this end.
                </p>
              </div>

              <div>
                <div className="chrome-label mb-2">Studio</div>
                <p>
                  Salford, in Greater Manchester.
                  <br />
                  Trading address available on request.
                </p>
              </div>

              <div>
                <div className="chrome-label mb-2">Operator</div>
                <p>
                  Dimona Dougherty &mdash; artistic engineer, drone
                  pilot, the one at the bench. She replies herself, and
                  she remembers what she said last time.
                </p>
              </div>

              <div>
                <div className="chrome-label mb-2">Elsewhere</div>
                <ul className="space-y-1">
                  <li>
                    <a
                      href="https://instagram.com/holoflow.studio"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-pink-200"
                    >
                      Instagram &rarr;
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <div className="chrome-label mb-2">Voicemail</div>
                <p className="text-xs leading-relaxed text-chrome-400">
                  Writing only, for now. It gives the work the time
                  it needs and it leaves a thread the studio can come
                  back to without losing the plot.
                </p>
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-24 rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-8">
          <div className="chrome-label">Where this fits</div>
          <p className="mt-3 text-chrome-300">
            Every commercial line on the bench is named on{" "}
            <Link
              href="/services"
              className="text-pink-200 underline underline-offset-4"
            >
              services
            </Link>
            ; the apparatus and software the work runs on is named on{" "}
            <Link
              href="/stack"
              className="text-pink-200 underline underline-offset-4"
            >
              the stack
            </Link>
            ; the bureau lives at{" "}
            <Link
              href="/bureau"
              className="text-pink-200 underline underline-offset-4"
            >
              /bureau
            </Link>
            . If a conversation outlives the inbox, it usually moves
            into{" "}
            <Link
              href="/rookery"
              className="text-pink-200 underline underline-offset-4"
            >
              the Rookery
            </Link>
            .
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}
