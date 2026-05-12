import Footer from "components/layout/footer";
import { ContactForm } from "components/layout/contact-form";

export const metadata = {
  title: "Contact",
  description:
    "Reach the Holo-Flow studio — commissions, press, print bureau, or anything else.",
};

export default function ContactPage() {
  return (
    <>
      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <div className="chrome-label">Write to the studio</div>
        <h1 className="mt-4 text-5xl md:text-6xl leading-[0.95]">
          Contact.
        </h1>
        <p className="mt-6 max-w-xl text-chrome-200">
          For commissions, press, print-bureau enquiries, aerial work,
          or just to say something about the work. I read every one.
          Replies typically within a day or two; sometimes faster if
          I&rsquo;m at the bench and the kettle is on.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3">
          <div className="md:col-span-2">
            <ContactForm />
          </div>

          <aside className="space-y-6 text-sm text-chrome-300">
            <div>
              <div className="chrome-label mb-2">Direct</div>
              <a
                href="mailto:contact@holoflow.co.uk"
                className="text-pink-200 underline underline-offset-4"
              >
                contact@holoflow.co.uk
              </a>
            </div>

            <div>
              <div className="chrome-label mb-2">Studio</div>
              <p>
                Salford, in Greater Manchester.
                <br />
                Trading address available upon request.
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
                Writing only, for now. It gives the work the time it
                needs, and it leaves a thread I can come back to without
                losing the plot. If something is genuinely urgent, put
                &ldquo;urgent&rdquo; in the subject line and I&rsquo;ll
                find it.
              </p>
            </div>
          </aside>
        </div>
      </article>
      <Footer />
    </>
  );
}
