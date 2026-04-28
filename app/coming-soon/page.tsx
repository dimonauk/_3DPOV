import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Studio open — Holo-Flow Studio",
  description:
    "Holo-Flow Studio is open for commissions, editioned objects, and print bureau bookings. Get in touch at contact@holoflow.co.uk while the new site is built.",
  robots: { index: false, follow: false },
};

export default function ComingSoonPage() {
  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-warm-black-950 text-warm-black-50">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(900px 480px at 78% 18%, rgba(255,120,165,0.18), transparent 62%), radial-gradient(780px 520px at 8% 82%, rgba(154,109,255,0.18), transparent 62%), radial-gradient(600px 380px at 50% 100%, rgba(118,222,166,0.12), transparent 65%)",
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-9 px-6 py-20 text-center">
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.32em] text-chrome-400">
          Holo-Flow Studio · Field records
        </span>

        <h1
          className="font-display text-5xl leading-[1.02] md:text-7xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          The studio is open.
          <br />
          <span className="text-chrome-300">The website isn&rsquo;t.</span>
        </h1>

        <p className="max-w-xl text-base leading-relaxed text-chrome-200 md:text-lg">
          Holo-Flow Studio makes editioned waveguide sculptures and photographs
          drawn from a twelve-year poi practice. Light painted in the air,
          captured as long-exposure photographs, then translated into 3D-printed
          objects with embedded acrylic light-pipes that pull ambient light
          through the form. Manchester, UK.
        </p>

        <div className="flex w-full max-w-md flex-col items-center gap-4 border-t border-warm-black-800 pt-8">
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-chrome-500">
            Available now
          </span>
          <ul className="flex w-full flex-col gap-3 text-left text-sm leading-relaxed text-chrome-200 md:text-base">
            <li>
              <span className="font-display text-pink-200">
                Editioned objects
              </span>{" "}
              &mdash; signed, small batch waveguide sculptures and desktop
              pieces.
            </li>
            <li>
              <span className="font-display text-pink-200">Photographs</span>{" "}
              &mdash; limited editions on Hahnem&uuml;hle and Canson Baryta
              fine-art papers.
            </li>
            <li>
              <span className="font-display text-pink-200">Print bureau</span>{" "}
              &mdash; A2 archival prints from the studio&rsquo;s Canon imagePROGRAF
              PRO-1100, paper choice your call.
            </li>
            <li>
              <span className="font-display text-pink-200">Commissions</span>{" "}
              &mdash; one-off pieces, configurable wall arrays, brand and
              corporate work.
            </li>
          </ul>
        </div>

        <div className="mt-2 flex flex-col items-center gap-3">
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-chrome-500">
            Direct line &mdash; catalogue, pricing, commissions
          </span>
          <a
            href="mailto:contact@holoflow.co.uk"
            className="font-display text-2xl tracking-tight text-pink-200 underline-offset-[6px] hover:underline md:text-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            contact@holoflow.co.uk
          </a>
        </div>

        <div className="mt-6 text-center font-mono text-[0.6rem] uppercase tracking-[0.22em] text-chrome-500">
          Holoflow.co.uk &middot; Manchester, UK &middot; Open for business
        </div>
      </div>
    </div>
  );
}
