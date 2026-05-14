/**
 * components/layout/navbar-config.ts — Navigation registry.
 *
 * Five groups, then The Stack as a direct link, then the sign-in slot.
 * Labels are Aura-register: named, not pitched. Pure data + path-matching
 * helpers; no React.
 */

export type NavLink = {
  label: string;
  href: string;
};

export type NavGroup = {
  label: string;
  links: NavLink[];
};

export const GROUPS: NavGroup[] = [
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
      { label: "AR cards", href: "/cards" },
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
      // The visualiser index doesn't exist yet — point to the only one shipped.
      // When a /visualiser index lands, change this to /visualiser.
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
      { label: "My cards", href: "/cards/mine" },
      { label: "Sign in", href: "/signin" },
    ],
  },
];

/** Does the current pathname fall inside a group? Used to mark the group
 *  button "active" when the reader is on one of its children. */
export function isGroupActive(
  pathname: string | null,
  group: NavGroup,
): boolean {
  if (!pathname) return false;
  return group.links.some((link) => {
    if (link.href === "/") return pathname === "/";
    return pathname === link.href || pathname.startsWith(`${link.href}/`);
  });
}

export function isLinkActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
