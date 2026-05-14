"use client";

/**
 * components/layout/navbar.tsx — Sticky primary navigation.
 *
 * Brand on the left, group dropdowns (desktop) or burger drawer (mobile)
 * in the middle, The Stack + auth slot on the right. The navigation tree
 * lives in `./navbar-config.ts`; sub-components in `./navbar-*`.
 */

import { Bars3Icon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import LogoSquare from "components/logo-square";

import { AuthSlot } from "./navbar-auth-slot";
import { GROUPS, isGroupActive, isLinkActive } from "./navbar-config";
import { DesktopGroup } from "./navbar-desktop-group";
import { MobileDrawer } from "./navbar-mobile-drawer";

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onResize = () => {
      if (typeof window !== "undefined" && window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const stackActive = isLinkActive(pathname, "/stack");

  return (
    <header
      className="sticky top-0 z-40 border-b border-warm-black-800 bg-warm-black-950/80 backdrop-blur-sm supports-[backdrop-filter]:bg-warm-black-950/70"
      role="banner"
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6 md:py-4"
      >
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-warm-black-700 text-chrome-200 transition-colors hover:border-pink-200/60 hover:text-pink-200 md:hidden"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>

          <Link
            href="/"
            prefetch={true}
            className="flex items-center gap-3 text-chrome-100"
            aria-label="Holo-Flow Studio — home"
          >
            <LogoSquare size="sm" />
            <div className="hidden flex-col leading-tight md:flex">
              <span className="chrome-label text-[0.6rem]">Holo-Flow</span>
              <span
                className="font-display text-base chrome-sheen"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Studio
              </span>
            </div>
          </Link>
        </div>

        <div className="hidden flex-1 items-center justify-center md:flex">
          <ul className="flex items-center gap-7 lg:gap-9">
            {GROUPS.map((group) => (
              <li key={group.label}>
                <DesktopGroup
                  group={group}
                  active={isGroupActive(pathname, group)}
                />
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-5">
          <Link
            href="/stack"
            prefetch={true}
            className={`chrome-label hidden text-[0.7rem] transition-colors md:inline-flex ${
              stackActive
                ? "text-pink-200"
                : "text-chrome-300 hover:text-pink-200"
            }`}
          >
            <span
              className={`relative pb-1 ${
                stackActive
                  ? "after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-pink-200/40"
                  : ""
              }`}
            >
              The Stack
            </span>
          </Link>
          <AuthSlot />
        </div>
      </nav>

      <MobileDrawer isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}

export default Navbar;
