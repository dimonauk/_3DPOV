"use client";

/**
 * components/layout/footer-group.tsx — Subject-area group for the footer.
 *
 * Displayed as a collapsible accordion on mobile (closed by default for
 * compactness) and as an always-open column on desktop (md+). The
 * heading is a real <button> with aria-expanded so the keyboard /
 * screen-reader path matches what the eyes see.
 *
 * Grouping mirrors the navbar via lib/footer-groups.ts so the
 * taxonomy stays one source of truth.
 */

import Link from "next/link";
import { useState } from "react";

import type { FooterGroupDef } from "lib/footer-groups";

export function FooterGroup({ group }: { group: FooterGroupDef }) {
  const [open, setOpen] = useState(false);
  const panelId = `footer-group-${group.slug}`;

  return (
    <div className="border-b border-warm-black-800 md:border-b-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="chrome-label flex w-full items-center justify-between py-3 text-left text-chrome-200 transition-colors hover:text-pink-200 md:cursor-default md:py-0 md:pb-4 md:hover:text-chrome-200"
      >
        <span>{group.label}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 10 6"
          className={`h-1.5 w-2.5 transition-transform md:hidden ${open ? "rotate-180" : ""}`}
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

      <ul
        id={panelId}
        className={`space-y-2 text-sm overflow-hidden transition-all md:block md:max-h-none md:pb-0 md:opacity-100 ${
          open ? "max-h-[600px] pb-4 opacity-100" : "max-h-0 opacity-0 md:opacity-100"
        }`}
      >
        {group.links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="block text-chrome-300 hover:text-pink-200"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
