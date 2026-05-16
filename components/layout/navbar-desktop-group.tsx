"use client";

/**
 * components/layout/navbar-desktop-group.tsx — Hover-and-keyboard dropdown
 * for one navbar group. Headless UI's Menu is click-only; this small manual
 * primitive keeps focus management clean while allowing hover-open + Escape-
 * to-close + click-outside dismissal.
 */

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import type { NavGroup } from "./navbar-config";

// Deterministic, stable across SSR/CSR. Earlier we used useId(); under
// streaming SSR (PPR is on in next.config.ts) the React tree position of
// these dropdowns could shift between the prerendered shell and the
// hydrated tree, producing different useId outputs and a hydration warning
// on every navbar render. Group labels are already unique across the navbar
// (Studio, Read, Work, Play, Community) so derive the panel id from the
// label and skip the race entirely.
function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function DesktopGroup({
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
  const panelId = `nav-group-${slugify(group.label)}`;

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
