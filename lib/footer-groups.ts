/**
 * lib/footer-groups.ts — Subject-area registry for the footer columns.
 *
 * Mirrors the navbar taxonomy (components/layout/navbar-config.ts) but
 * makes footer-specific curation choices:
 *
 *   - Drops the navbar's "Sign in" / "My cards" / "My wallet" entries
 *     from the Community group — those are session-state surfaces that
 *     belong in the auth slot, not the site map.
 *   - Adds Policies as its own group (Privacy / Terms / Returns /
 *     Shipping) instead of relying on Shopify's footer menu.
 *
 * Anything that lives in both navbar + footer should be edited via the
 * navbar config; this file is only the deltas + Policies.
 */

export type FooterLink = { label: string; href: string };
export type FooterGroupDef = {
  slug: string;
  label: string;
  links: FooterLink[];
};

export const FOOTER_GROUPS: FooterGroupDef[] = [
  {
    slug: "studio",
    label: "Studio",
    links: [
      { label: "About", href: "/about" },
      { label: "The Loop", href: "/the-loop" },
      { label: "Practice", href: "/practice" },
      { label: "Research", href: "/research" },
      { label: "Cast", href: "/cast" },
      { label: "Academy", href: "/academy" },
      { label: "Capabilities", href: "/capabilities" },
      { label: "Pipelines", href: "/pipelines" },
      { label: "Apps", href: "/apps" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    slug: "read",
    label: "Read",
    links: [
      { label: "Articles", href: "/articles" },
      { label: "Journal", href: "/journal" },
      { label: "Tutorials", href: "/tutorials" },
      { label: "Codex", href: "/codex" },
      { label: "Learn", href: "/learn" },
      { label: "News", href: "/news" },
    ],
  },
  {
    slug: "work",
    label: "Work",
    links: [
      { label: "Atelier", href: "/atelier" },
      { label: "Photographs", href: "/photographs" },
      { label: "Aerial", href: "/aerial" },
      { label: "Holo-walk", href: "/holo-walk" },
      { label: "Spatial", href: "/spatial" },
      { label: "Print bureau", href: "/bureau" },
      { label: "Bezel", href: "/bezel" },
      { label: "AR cards", href: "/cards" },
      { label: "Services", href: "/services" },
      { label: "The stack", href: "/stack" },
    ],
  },
  {
    slug: "play",
    label: "Play",
    links: [
      { label: "Play", href: "/play" },
      { label: "Aura (chat)", href: "/aura" },
      { label: "Stage", href: "/stage" },
      { label: "Neo-London", href: "/play/neo-london" },
      { label: "Chrono-Protocol", href: "/chrono-protocol" },
      { label: "The Sphere", href: "/sphere" },
      { label: "Visualisers", href: "/visualiser" },
      { label: "Watch", href: "/watch" },
    ],
  },
  {
    slug: "community",
    label: "Community",
    links: [
      { label: "The Rookery", href: "/rookery" },
      { label: "About the Rookery", href: "/rookery/about" },
      { label: "Tiers", href: "/rookery/tiers" },
    ],
  },
  {
    slug: "policies",
    label: "Policies",
    links: [
      { label: "Privacy", href: "/policies/privacy-policy" },
      { label: "Terms", href: "/policies/terms-of-service" },
      { label: "Returns", href: "/policies/refund-policy" },
      { label: "Shipping", href: "/policies/shipping-policy" },
    ],
  },
];
