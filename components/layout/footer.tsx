import Link from "next/link";

import LogoSquare from "components/logo-square";
import { FooterGroup } from "components/layout/footer-group";
import { FOOTER_GROUPS } from "lib/footer-groups";
import { NewsletterForm } from "./newsletter-form";

const { COMPANY_NAME, SITE_NAME } = process.env;

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const copyrightName = COMPANY_NAME || SITE_NAME || "Holo-Flow Studio";

  return (
    <footer className="border-t border-warm-black-800 bg-warm-black-950 text-sm text-chrome-300">
      {/* Brand strip — left identity, right newsletter. */}
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-6 pt-14 pb-8 md:grid-cols-2 md:gap-12">
        <div>
          <Link className="flex items-center gap-3 text-chrome-100" href="/">
            <LogoSquare size="sm" />
            <div className="flex flex-col leading-tight">
              <span className="chrome-label text-[0.65rem]">Holo-Flow</span>
              <span className="font-display text-base chrome-sheen">
                Studio
              </span>
            </div>
          </Link>
          <p className="mt-4 max-w-md text-xs leading-relaxed text-chrome-400">
            Editioned objects out of twelve years of poi. Salford.
          </p>
        </div>

        <div className="md:justify-self-end md:max-w-sm">
          <div className="chrome-label mb-3 text-chrome-200">Dispatch notes</div>
          <p className="mb-3 text-xs leading-relaxed text-chrome-400">
            New releases, field records, studio notes. Roughly monthly.
            Never advertising; I don&rsquo;t have the temperament for it.
          </p>
          <NewsletterForm />
        </div>
      </div>

      {/* Subject-area groups. Accordion on mobile (tap to expand);
          six always-open columns on desktop (md+). */}
      <div className="mx-auto w-full max-w-7xl px-6 pb-12">
        <div className="grid grid-cols-1 gap-x-10 gap-y-0 md:grid-cols-3 lg:grid-cols-6 md:gap-y-12">
          {FOOTER_GROUPS.map((group) => (
            <FooterGroup key={group.slug} group={group} />
          ))}
        </div>
      </div>

      {/* Legal + trading address. */}
      <div className="border-t border-warm-black-800">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-6 py-5 text-xs text-chrome-400">
          <p className="text-[0.7rem] leading-relaxed">
            Holo-Flow Studio is a sole-trader business operated by Dimona
            Dougherty. Studio in Salford, Greater Manchester. Trading
            address available upon request &mdash;{" "}
            <a
              href="mailto:contact@holoflow.co.uk"
              className="underline underline-offset-4 hover:text-pink-200"
            >
              contact@holoflow.co.uk
            </a>
            .
          </p>
          <div className="mt-1 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p>
              &copy; {currentYear} {copyrightName}. All rights reserved.
            </p>
            <p className="font-mono tracking-[0.22em] uppercase">
              Holo-Flow / Field records
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
