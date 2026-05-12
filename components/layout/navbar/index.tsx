import CartModal from "components/cart/modal";
import LogoSquare from "components/logo-square";
import { getMenu } from "lib/shopify";
import { Menu } from "lib/shopify/types";
import Link from "next/link";
import { Suspense } from "react";
import MobileMenu from "./mobile-menu";
import Search, { SearchSkeleton } from "./search";

const { SITE_NAME } = process.env;
const SITE_LABEL = SITE_NAME ?? "Holo-Flow Studio";

// Fallback nav shown when the Shopify "next-js-frontend-header-menu"
// menu isn't configured yet. Once Shopify's menu has entries they take
// over — this list is only displayed when the remote fetch returns [].
const FALLBACK_MENU: Menu[] = [
  { title: "Photographs", path: "/photographs" },
  { title: "Objects", path: "/search" },
  { title: "Aerial", path: "/aerial" },
  { title: "Bureau", path: "/bureau" },
  { title: "Practice", path: "/practice" },
  { title: "About", path: "/about" },
  { title: "Journal", path: "/journal" },
  { title: "Articles", path: "/articles" },
  { title: "Tutorials", path: "/tutorials" },
];

export async function Navbar() {
  const remote = await getMenu("next-js-frontend-header-menu");
  const menu = remote.length ? remote : FALLBACK_MENU;

  return (
    <nav className="sticky top-0 z-40 border-b border-warm-black-800 bg-warm-black-950/85 backdrop-blur supports-[backdrop-filter]:bg-warm-black-950/60">
      <div className="relative flex items-center justify-between px-4 py-3 lg:px-8">
        <div className="block flex-none md:hidden">
          <Suspense fallback={null}>
            <MobileMenu menu={menu} />
          </Suspense>
        </div>

        <div className="flex w-full items-center">
          <div className="flex w-full md:w-1/3">
            <Link
              href="/"
              prefetch={true}
              className="mr-2 flex w-full items-center justify-center md:w-auto lg:mr-8"
              aria-label={SITE_LABEL}
            >
              <LogoSquare size="sm" />
              <div className="ml-3 hidden flex-col leading-tight md:flex">
                <span className="chrome-label text-[0.65rem]">Holo-Flow</span>
                <span
                  className="font-display text-base chrome-sheen"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Studio
                </span>
              </div>
            </Link>

            <ul className="hidden items-center gap-6 text-sm md:flex">
              {menu.map((item: Menu) => (
                <li key={item.title}>
                  <Link
                    href={item.path}
                    prefetch={true}
                    className="text-chrome-300 underline-offset-4 transition-colors hover:text-pink-200 hover:underline"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden justify-center md:flex md:w-1/3">
            <Suspense fallback={<SearchSkeleton />}>
              <Search />
            </Suspense>
          </div>

          <div className="flex justify-end md:w-1/3">
            <CartModal />
          </div>
        </div>
      </div>
    </nav>
  );
}
