import Link from "next/link";

import FooterMenu from "components/layout/footer-menu";
import LogoSquare from "components/logo-square";
import { getMenu } from "lib/shopify/cached";
import { Suspense } from "react";
import { NewsletterForm } from "./newsletter-form";

const { COMPANY_NAME, SITE_NAME } = process.env;

export default async function Footer() {
  const currentYear = new Date().getFullYear();
  const skeleton = "w-full h-5 animate-pulse rounded-sm bg-warm-black-800";
  const menu = await getMenu("next-js-frontend-footer-menu");
  const copyrightName = COMPANY_NAME || SITE_NAME || "Holo-Flow Studio";

  return (
    <footer className="border-t border-warm-black-800 bg-warm-black-950 text-sm text-chrome-300">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-6 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <Link className="flex items-center gap-3 text-chrome-100" href="/">
            <LogoSquare size="sm" />
            <div className="flex flex-col leading-tight">
              <span className="chrome-label text-[0.65rem]">Holo-Flow</span>
              <span
                className="font-display text-base chrome-sheen"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Studio
              </span>
            </div>
          </Link>
          <p className="mt-4 max-w-xs text-xs leading-relaxed text-chrome-400">
            Editioned objects out of twelve years of poi. Salford.
          </p>
        </div>

        <div>
          <div className="chrome-label mb-4">Studio</div>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/about" className="hover:text-pink-200">About</Link>
            </li>
            <li>
              <Link href="/the-loop" className="hover:text-pink-200">The Loop</Link>
            </li>
            <li>
              <Link href="/sphere" className="hover:text-pink-200">The sphere</Link>
            </li>
            <li>
              <Link href="/play" className="hover:text-pink-200">Play</Link>
            </li>
            <li>
              <Link href="/play/neo-london" className="hover:text-pink-200">Neo-London</Link>
            </li>
            <li>
              <Link href="/chrono-protocol" className="hover:text-pink-200">Chrono-Protocol</Link>
            </li>
            <li>
              <Link href="/photographs" className="hover:text-pink-200">Photographs</Link>
            </li>
            <li>
              <Link href="/search" className="hover:text-pink-200">Catalogue</Link>
            </li>
            <li>
              <Link href="/services" className="hover:text-pink-200">Services</Link>
            </li>
            <li>
              <Link href="/aerial" className="hover:text-pink-200">Aerial</Link>
            </li>
            <li>
              <Link href="/bureau" className="hover:text-pink-200">Print bureau</Link>
            </li>
            <li>
              <Link href="/bezel" className="hover:text-pink-200">Bezel (interest list)</Link>
            </li>
            <li>
              <Link href="/practice" className="hover:text-pink-200">Practice</Link>
            </li>
            <li>
              <Link href="/journal" className="hover:text-pink-200">Journal</Link>
            </li>
            <li>
              <Link href="/articles" className="hover:text-pink-200">Articles</Link>
            </li>
            <li>
              <Link href="/tutorials" className="hover:text-pink-200">Tutorials</Link>
            </li>
            <li>
              <Link href="/codex" className="hover:text-pink-200">Codex</Link>
            </li>
            <li>
              <Link href="/learn" className="hover:text-pink-200">Learn (curriculum)</Link>
            </li>
            <li>
              <Link href="/stack" className="hover:text-pink-200">The stack</Link>
            </li>
            <li>
              <Link href="/atelier" className="hover:text-pink-200">The atelier</Link>
            </li>
            <li>
              <Link href="/atelier/algorithms" className="hover:text-pink-200">Atelier &mdash; Algorithms</Link>
            </li>
            <li>
              <Link href="/atelier/evolution" className="hover:text-pink-200">Atelier &mdash; Evolution</Link>
            </li>
            <li>
              <Link href="/visualiser" className="hover:text-pink-200">Visualisers &mdash; series</Link>
            </li>
            <li>
              <Link href="/rookery" className="hover:text-pink-200">The Rookery</Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-pink-200">Contact</Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="chrome-label mb-4">Policies</div>
          <Suspense
            fallback={
              <div className="flex flex-col gap-2">
                <div className={skeleton} />
                <div className={skeleton} />
                <div className={skeleton} />
              </div>
            }
          >
            <FooterMenu menu={menu} />
          </Suspense>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/policies/privacy-policy" className="hover:text-pink-200">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/policies/terms-of-service" className="hover:text-pink-200">
                Terms
              </Link>
            </li>
            <li>
              <Link href="/policies/refund-policy" className="hover:text-pink-200">
                Returns
              </Link>
            </li>
            <li>
              <Link href="/policies/shipping-policy" className="hover:text-pink-200">
                Shipping
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="chrome-label mb-4">Dispatch notes</div>
          <p className="mb-3 text-xs leading-relaxed text-chrome-400">
            New releases, field records, studio notes. Roughly monthly.
            Never advertising; I don&rsquo;t have the temperament for it.
          </p>
          <NewsletterForm />
        </div>
      </div>

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
