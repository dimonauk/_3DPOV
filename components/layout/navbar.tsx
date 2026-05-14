"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { useAuth } from "components/auth/auth-provider";
import LogoSquare from "components/logo-square";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

// ──────────────────────────────────────────────────────────────────────
// Navigation structure
//
// Five groups, then The Stack as a direct link, then the sign-in slot.
// Labels are Aura-register: named, not pitched. The order inside each
// group is the order a reader would scan it (overview first where one
// exists; then specifics).
// ──────────────────────────────────────────────────────────────────────

type NavLink = {
  label: string;
  href: string;
};

type NavGroup = {
  label: string;
  links: NavLink[];
};

const GROUPS: NavGroup[] = [
  {
    label: "Studio",
    links: [
      { label: "About", href: "/about" },
      { label: "The Loop", href: "/the-loop" },
      { label: "Practice", href: "/practice" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    label: "Read",
    links: [
      { label: "Articles", href: "/articles" },
      { label: "Journal", href: "/journal" },
      { label: "Tutorials", href: "/tutorials" },
      { label: "Codex", href: "/codex" },
      { label: "Learn", href: "/learn" },
    ],
  },
  {
    label: "Work",
    links: [
      { label: "Photographs", href: "/photographs" },
      { label: "Aerial", href: "/aerial" },
      { label: "Print bureau", href: "/bureau" },
      { label: "Bezel", href: "/bezel" },
      { label: "Services", href: "/services" },
    ],
  },
  {
    label: "Play",
    links: [
      { label: "Play", href: "/play" },
      { label: "Neo-London", href: "/play/neo-london" },
      { label: "The Sphere", href: "/sphere" },
      { label: "CCTV cross-ref", href: "/atelier/cctv-cross-reference" },
      { label: "Rig simulator", href: "/atelier/rig-simulator" },
      // The visualiser index doesn't exist yet — point to the only one
      // shipped. When a /visualiser index lands, change this to /visualiser.
      { label: "Visualisers", href: "/visualiser/total-internal-reflection" },
      { label: "Watch", href: "/watch" },
    ],
  },
  {
    label: "Community",
    links: [
      { label: "The Rookery", href: "/rookery" },
      { label: "About the Rookery", href: "/rookery/about" },
      { label: "Tiers", href: "/rookery/tiers" },
      { label: "Sign in", href: "/signin" },
    ],
  },
];

// Helper: does a given pathname fall inside a group? (used to mark the
// group button "active" when the reader is on one of its children).
function isGroupActive(pathname: string | null, group: NavGroup): boolean {
  if (!pathname) return false;
  return group.links.some((link) => {
    if (link.href === "/") return pathname === "/";
    return pathname === link.href || pathname.startsWith(`${link.href}/`);
  });
}

function isLinkActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

// ──────────────────────────────────────────────────────────────────────
// Desktop dropdown — hover + keyboard. Headless UI's Menu is click-only,
// so this is a small manual primitive that keeps focus management clean.
// ──────────────────────────────────────────────────────────────────────

function DesktopGroup({
  group,
  active,
}: {
  group: NavGroup;
  active: boolean;
}) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelId = useId();

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 90);
  }, [cancelClose]);

  // Close on click outside.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // Close on Escape; return focus to the trigger.
  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
      onKeyDown={onKeyDown}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        onFocus={() => {
          cancelClose();
          setOpen(true);
        }}
        className={`chrome-label flex items-center gap-1 py-2 text-[0.7rem] transition-colors ${
          active || open
            ? "text-pink-200"
            : "text-chrome-300 hover:text-pink-200"
        }`}
      >
        <span
          className={`relative pb-1 ${
            open
              ? "after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-pink-200/70"
              : active
                ? "after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-pink-200/40"
                : ""
          }`}
        >
          {group.label}
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 10 6"
          className={`h-1.5 w-2.5 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M1 1l4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div
        id={panelId}
        role="menu"
        aria-label={group.label}
        className={`absolute left-1/2 top-full z-50 mt-2 w-56 -translate-x-1/2 origin-top transition-all duration-150 ${
          open
            ? "pointer-events-auto opacity-100 translate-y-0"
            : "pointer-events-none opacity-0 -translate-y-1"
        }`}
      >
        <div className="overflow-hidden rounded-md border border-warm-black-700 bg-warm-black-950/95 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.7)] backdrop-blur-sm">
          <div className="chrome-label border-b border-warm-black-800 px-4 py-2 text-[0.6rem] text-chrome-400">
            {group.label}
          </div>
          <ul className="py-2">
            {group.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  role="menuitem"
                  prefetch={true}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-1.5 text-sm text-chrome-300 transition-colors hover:bg-warm-black-900 hover:text-pink-200 focus-visible:bg-warm-black-900 focus-visible:text-pink-200"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Auth slot — "Sign in" when out, the user's display name (or email
// fragment) when in. Firebase may be unconfigured in dev; in that case
// fall back to the static "Sign in" link.
// ──────────────────────────────────────────────────────────────────────

function AuthSlot() {
  const { user, loading, configured } = useAuth();

  if (!configured) {
    return (
      <Link
        href="/signin"
        className="chrome-label text-[0.7rem] text-chrome-300 transition-colors hover:text-pink-200"
      >
        Sign in
      </Link>
    );
  }

  if (loading) {
    return <span className="chrome-label text-[0.7rem] text-chrome-500">…</span>;
  }

  if (!user) {
    return (
      <Link
        href="/signin"
        className="chrome-label text-[0.7rem] text-chrome-300 transition-colors hover:text-pink-200"
      >
        Sign in
      </Link>
    );
  }

  const display =
    user.displayName ||
    (user.email ? user.email.split("@")[0] : null) ||
    "Member";

  return (
    <Link
      href="/rookery"
      aria-label="Your Rookery account"
      className="chrome-label max-w-[10rem] truncate text-[0.7rem] text-pink-200 transition-colors hover:text-pink-100"
    >
      {display}
    </Link>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Mobile drawer — Headless UI Dialog, same animation grammar as the
// existing mobile menu so the studio feels consistent.
// ──────────────────────────────────────────────────────────────────────

function MobileDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <Transition show={isOpen}>
      <Dialog onClose={onClose} className="relative z-50 md:hidden">
        <Transition.Child
          as={Fragment}
          enter="transition-all ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-all ease-in-out duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed inset-0 bg-warm-black-950/70 backdrop-blur-sm"
            aria-hidden="true"
          />
        </Transition.Child>
        <Transition.Child
          as={Fragment}
          enter="transition-all ease-in-out duration-300"
          enterFrom="translate-x-[-100%]"
          enterTo="translate-x-0"
          leave="transition-all ease-in-out duration-200"
          leaveFrom="translate-x-0"
          leaveTo="translate-x-[-100%]"
        >
          <Dialog.Panel className="fixed inset-y-0 left-0 flex w-full max-w-sm flex-col overflow-y-auto border-r border-warm-black-800 bg-warm-black-950 px-4 pb-8 pt-4">
            <div className="mb-6 flex items-center justify-between">
              <Link
                href="/"
                onClick={onClose}
                className="flex items-center gap-3 text-chrome-100"
                aria-label="Holo-Flow Studio — home"
              >
                <LogoSquare size="sm" />
                <div className="flex flex-col leading-tight">
                  <span className="chrome-label text-[0.6rem]">Holo-Flow</span>
                  <span
                    className="font-display text-base chrome-sheen"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Studio
                  </span>
                </div>
              </Link>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center rounded-md border border-warm-black-700 text-chrome-200 transition-colors hover:border-pink-200/60 hover:text-pink-200"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <nav aria-label="Site" className="flex flex-col gap-8">
              {GROUPS.map((group) => (
                <section key={group.label}>
                  <div className="chrome-label mb-3 text-[0.65rem] text-chrome-400">
                    {group.label}
                  </div>
                  <ul className="flex flex-col">
                    {group.links.map((link) => {
                      const active = isLinkActive(pathname, link.href);
                      return (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            onClick={onClose}
                            className={`block py-2 text-base transition-colors ${
                              active
                                ? "text-pink-200"
                                : "text-chrome-200 hover:text-pink-200"
                            }`}
                          >
                            {link.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}

              <section>
                <div className="chrome-label mb-3 text-[0.65rem] text-chrome-400">
                  The bench
                </div>
                <Link
                  href="/stack"
                  onClick={onClose}
                  className={`block py-2 text-base transition-colors ${
                    isLinkActive(pathname, "/stack")
                      ? "text-pink-200"
                      : "text-chrome-200 hover:text-pink-200"
                  }`}
                >
                  The Stack
                </Link>
              </section>
            </nav>
          </Dialog.Panel>
        </Transition.Child>
      </Dialog>
    </Transition>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Navbar
// ──────────────────────────────────────────────────────────────────────

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile drawer on route change.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close the mobile drawer if the viewport grows past md.
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
        {/* Brand block */}
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

        {/* Center — group dropdowns (desktop only) */}
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

        {/* Right — The Stack + auth */}
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
