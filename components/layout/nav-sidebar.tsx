"use client";

/**
 * components/layout/nav-sidebar.tsx
 *
 * Vertical left-rail navigation — replaces the old top <Navbar>.
 *
 * Desktop: fixed 180px sidebar with accordion group sections + theme
 * toggle + auth slot in the footer. Width is controlled by --nav-sidebar-w
 * in globals.css; content is offset with .nav-sidebar-offset on the
 * wrapper in layout.tsx.
 *
 * Mobile: thin 48px top bar (logo + theme toggle + burger), plus a
 * full-height overlay drawer that slides in from the left.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bars3Icon,
  ChevronRightIcon,
  MoonIcon,
  SunIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import LogoSquare from "components/logo-square";
import { useTheme } from "components/theme/theme-context";
import { AuthSlot } from "./navbar-auth-slot";
import { GROUPS, isGroupActive, isLinkActive } from "./navbar-config";

// ---------------------------------------------------------------------------
// GroupSection — collapsible accordion section for one nav group
// ---------------------------------------------------------------------------

type Group = (typeof GROUPS)[number];

function GroupSection({
  group,
  pathname,
  onLinkClick,
}: {
  group: Group;
  pathname: string | null;
  onLinkClick?: () => void;
}) {
  const active = isGroupActive(pathname, group);
  // Auto-open the group containing the current page; otherwise start closed.
  const [open, setOpen] = useState(active);

  // Keep open if the route changes to one of this group's children.
  useEffect(() => {
    if (active) setOpen(true);
  }, [active]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={[
          "flex w-full items-center justify-between px-3 py-2 transition-colors",
          active
            ? "text-pink-300"
            : "text-chrome-400 hover:text-warm-black-50",
        ].join(" ")}
      >
        <span className="chrome-label text-[0.58rem] tracking-widest">
          {group.label}
        </span>
        <ChevronRightIcon
          className={[
            "h-3 w-3 shrink-0 transition-transform duration-200",
            open ? "rotate-90" : "",
          ].join(" ")}
        />
      </button>

      {open && (
        <ul className="pb-1">
          {group.links.map((link) => {
            const linkActive = isLinkActive(pathname, link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  prefetch={true}
                  title={link.label}
                  onClick={onLinkClick}
                  className={[
                    "block truncate px-5 py-[0.3rem] text-[0.72rem] leading-snug transition-colors",
                    linkActive
                      ? "text-pink-200 font-medium bg-pink-500/5"
                      : "text-chrome-300 hover:text-warm-black-50 hover:bg-warm-black-700/30",
                  ].join(" ")}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SidebarContent — the shared nav body rendered in sidebar + mobile drawer
// ---------------------------------------------------------------------------

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const stackActive = isLinkActive(pathname, "/stack");

  return (
    <div className="flex h-full flex-col">
      {/* ── Logo ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-warm-black-800 px-3 py-3 shrink-0">
        <Link
          href="/"
          prefetch={true}
          aria-label="Holo-Flow Studio — home"
          onClick={onClose}
          className="flex items-center gap-2"
        >
          <LogoSquare size="sm" />
          <div className="flex flex-col leading-none">
            <span className="chrome-label text-[0.5rem] tracking-widest">
              Holo-Flow
            </span>
            <span
              className="font-display text-[0.95rem] chrome-sheen"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Studio
            </span>
          </div>
        </Link>

        {/* Close button — only shown inside the mobile drawer */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="text-chrome-400 hover:text-warm-black-50 transition-colors ml-2"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Groups ──────────────────────────────────────────────── */}
      <nav
        aria-label="Primary"
        className="flex-1 overflow-y-auto py-1"
        style={{ scrollbarWidth: "none" }}
      >
        {GROUPS.map((group) => (
          <GroupSection
            key={group.label}
            group={group}
            pathname={pathname}
            onLinkClick={onClose}
          />
        ))}

        {/* The Stack — standalone link below the groups */}
        <div className="mt-1 border-t border-warm-black-800/50 px-3 pt-2 pb-1">
          <Link
            href="/stack"
            prefetch={true}
            onClick={onClose}
            className={[
              "chrome-label text-[0.58rem] transition-colors",
              stackActive
                ? "text-pink-300"
                : "text-chrome-400 hover:text-warm-black-50",
            ].join(" ")}
          >
            The Stack
          </Link>
        </div>
      </nav>

      {/* ── Footer: theme toggle + auth ─────────────────────────── */}
      <div className="shrink-0 border-t border-warm-black-800 px-3 py-3 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={toggle}
          aria-label={
            theme === "day" ? "Switch to night mode" : "Switch to day mode"
          }
          className="flex items-center gap-2 text-chrome-400 hover:text-warm-black-50 transition-colors chrome-label text-[0.58rem]"
        >
          {theme === "day" ? (
            <MoonIcon className="h-3.5 w-3.5" />
          ) : (
            <SunIcon className="h-3.5 w-3.5" />
          )}
          <span>{theme === "day" ? "Night mode" : "Day mode"}</span>
        </button>

        <AuthSlot />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// NavSidebar — the public export wired into layout.tsx
// ---------------------------------------------------------------------------

export function NavSidebar() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Close drawer if viewport widens to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setDrawerOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────── */}
      <aside
        aria-label="Site navigation"
        className={[
          "hidden md:flex fixed inset-y-0 left-0 z-40 flex-col",
          "bg-warm-black-950/92 backdrop-blur-sm border-r border-warm-black-800",
        ].join(" ")}
        style={{ width: "var(--nav-sidebar-w)" }}
      >
        <SidebarContent />
      </aside>

      {/* ── Mobile: thin top bar ────────────────────────────────── */}
      <div
        className={[
          "md:hidden fixed top-0 inset-x-0 z-40 flex h-12 items-center justify-between",
          "bg-warm-black-950/92 backdrop-blur-sm border-b border-warm-black-800 px-4",
        ].join(" ")}
      >
        <Link
          href="/"
          aria-label="Holo-Flow Studio — home"
          className="flex items-center gap-2"
        >
          <LogoSquare size="sm" />
          <span
            className="font-display text-sm chrome-sheen"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Studio
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Theme toggle in the top bar on mobile */}
          <button
            type="button"
            onClick={toggle}
            aria-label={theme === "day" ? "Switch to night" : "Switch to day"}
            className="flex h-8 w-8 items-center justify-center text-chrome-300 hover:text-pink-200 transition-colors"
          >
            {theme === "day" ? (
              <MoonIcon className="h-4 w-4" />
            ) : (
              <SunIcon className="h-4 w-4" />
            )}
          </button>

          {/* Burger */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            aria-expanded={drawerOpen}
            className="flex h-8 w-8 items-center justify-center rounded border border-warm-black-700 text-chrome-200 hover:border-pink-200/60 hover:text-pink-200 transition-colors"
          >
            <Bars3Icon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Mobile drawer overlay ────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          {/* Semi-transparent backdrop — click to close */}
          <button
            type="button"
            className="flex-1 bg-warm-black-950/70 backdrop-blur-sm"
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer panel */}
          <div className="absolute inset-y-0 left-0 w-[75%] max-w-xs flex flex-col bg-warm-black-950 border-r border-warm-black-800 overflow-hidden">
            <SidebarContent onClose={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}

export default NavSidebar;
