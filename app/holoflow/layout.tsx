/**
 * app/holoflow/layout.tsx — wraps every page under /holoflow with the
 * shared studio chrome (nav, dynamic background, theme behaviors, footer).
 *
 * Mounts the theme-controlled Background and ThemeBehaviors here so they
 * apply across the entire holoflow section without each page re-mounting
 * them.
 */

import type { ReactNode } from "react";

import {
  Background,
  HoloflowNav,
  HoloflowFooter,
  ThemeBehaviors,
} from "components/holoflow";

const NAV_LINKS = [
  { label: "Work", href: "/holoflow#work" },
  { label: "Splatter", href: "/splatter" },
  { label: "Aura", href: "/holoflow/aura" },
  { label: "Hangar", href: "/holoflow/hangar" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const FOOTER_COLUMNS = [
  {
    title: "Studio",
    links: [
      { label: "Work", href: "/holoflow#work" },
      { label: "About", href: "/about" },
      { label: "Press kit", href: "/holoflow/press" },
    ],
  },
  {
    title: "Verticals",
    links: [
      { label: "Splatter", href: "/splatter" },
      { label: "Aura", href: "/holoflow/aura" },
      { label: "Heritage", href: "/holoflow/heritage" },
      { label: "Poi & Light", href: "/holoflow/poi" },
    ],
  },
  {
    title: "Engine",
    links: [
      { label: "BY-GEN", href: "/holoflow/bygen" },
      { label: "Jewel Array", href: "/holoflow/jewel" },
      { label: "Neo-London", href: "/holoflow/neo" },
      { label: "Skill Web", href: "/holoflow/skills" },
    ],
  },
  {
    title: "Studio",
    links: [
      { label: "The Hangar", href: "/holoflow/hangar" },
      { label: "Pricing", href: "/pricing" },
      { label: "Commission", href: "/contact" },
    ],
  },
  {
    title: "Settings",
    links: [
      { label: "Theme", href: "/theme" },
      { label: "Bench status", href: "/splatter/bench" },
    ],
  },
];

export default function HoloflowLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Background />
      <ThemeBehaviors />
      <HoloflowNav
        logo="Holo-Flow Studio"
        superscript="TM"
        links={NAV_LINKS}
        ctaLabel="Commission"
        ctaHref="/contact"
        keyHint="↑↑↓↓←→←→BA"
      />
      <div className="relative">{children}</div>
      <HoloflowFooter
        columns={FOOTER_COLUMNS}
        mark="Holo-Flow Studio"
        copyright="© Dimona Dougherty · holoflow.co.uk"
      />
    </>
  );
}
