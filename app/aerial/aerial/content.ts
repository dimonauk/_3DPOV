/**
 * app/aerial/aerial/content.ts — Static-data tables for the aerial
 * landing page: use-when cards, fleet roster, how-it-works steps,
 * FAQ entries, further-reading links, plus the canonical absolute
 * URL used by metadata + JSON-LD.
 *
 * Extracted from page.tsx per ARCHITECTURE.md Rule 1.
 */

export const ABSOLUTE_URL = "https://holoflow.co.uk/aerial";

export const USE_WHEN = [
  {
    label: "Editorial",
    title: "Stills + motion",
    body: "Editorial aerial photograph or short motion piece, graded for print or web.",
  },
  {
    label: "Immersive",
    title: "360° fly-through",
    body: "Venue, procession, or interior — captured equirectangular, reframed in post.",
  },
  {
    label: "Indoor",
    title: "Follow-cam",
    body: "Rehearsal, gig, or studio shoot — close-quarters work without losing line of sight.",
  },
] as const;

export type FleetEntry = {
  name: string;
  role: string;
  body: string;
  tag?: string;
};

export const FLEET: FleetEntry[] = [
  {
    name: "DJI Mavic 2 Pro",
    role: "Photography platform",
    body: "Hasselblad L1D-20c, 1″ sensor, adjustable aperture. Editorial stills and motion at print quality.",
  },
  {
    name: "DJI Neo + Neo 2",
    role: "Indoor + proximity",
    body: "Lightweight follow-cam, sized for interiors and proximity to people.",
  },
  {
    name: "DJI Avata 360",
    role: "FPV cinewhoop + 360",
    body: "Twin 64MP 1/1.1″ sensors, 200° lenses. Single-lens at 4K, dual-lens for 8K omnidirectional.",
  },
  {
    name: "DJI Mini 5 Pro",
    role: "Sub-250g travel",
    body: "1″ sensor, sub-250g. Carries Bluetooth LED bars for unsynced-swarm light-painting work.",
  },
  {
    name: "LED-modified airframes",
    role: "Aerial light painting",
    body: "Programmable POV LED arrays mounted to drone bodies for the light-painting kata.",
    tag: "first-flight",
  },
];

export const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Brief via the contact form",
    body: "Location, intent, deliverables, dates. Pick “Aerial / drone work” from the form’s intent dropdown.",
  },
  {
    step: "2",
    title: "Quote and recce",
    body: "The studio replies with a quote, a recommended airframe, and a proposed shoot window. Sometimes a recce visit; sometimes a satellite read.",
  },
  {
    step: "3",
    title: "Fly",
    body: "Salford base, willing to travel. All flights operated to UK CAA rules and local site conditions.",
  },
  {
    step: "4",
    title: "Deliver",
    body: "Graded stills as TIFF/JPEG, edited motion as ProRes/H.265, 360° clips as equirectangular. Light-painting commissions deliver as signed editioned prints.",
  },
] as const;
