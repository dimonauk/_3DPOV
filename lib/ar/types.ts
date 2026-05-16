/**
 * AR business card data model.
 *
 * One JSON file per card holder lives at `data/cards/<slug>.json`.
 * Build scripts read these to generate QR codes, .mind image targets,
 * and USDZ conversions of the GLB model.
 */

export type BrandFont = "display" | "serif" | "mono";

export interface CardContact {
  email?: string;
  phone?: string;
  website?: string;
  /** Social platform handles: { platform: "instagram", handle: "@dimona" } */
  handles?: Array<{ platform: string; handle: string; url?: string }>;
}

export interface CardBrand {
  /** Primary brand colour, used for background gradients and accents (hex with #) */
  primary: string;
  /** Secondary brand colour, used for gradient end-point (hex with #) */
  secondary: string;
  /** Accent colour for QR, highlights (hex with #) */
  accent: string;
  /** Font family preset */
  font: BrandFont;
  /** Text colour to use on the brand gradient (hex with #) */
  textOnBrand: string;
}

export interface CardARConfig {
  /** Path under public/ — the image used to compile the .mind target */
  targetImage: string;
  /** Compiled MindAR target file (one per card, lives under public/) */
  targetMind: string;
  /** GLB model path under public/ */
  model: string;
  /** USDZ path under public/ — generated from GLB for iOS Quick Look */
  modelUSDZ: string;
  /**
   * Gaussian Splat scene URL (.ply, .splat, or .ksplat). When set, the
   * card landing offers a "Splat" tab that renders the scene via
   * @mkkellogg/gaussian-splats-3d. Best for photoreal captures of
   * physical scenes (sculptures, performance documentation, heritage
   * spaces). Optional — leave undefined to skip the tab entirely.
   */
  splat?: string;
  /**
   * VRM 1.0 avatar URL. When set, the card landing offers an "Avatar"
   * tab that renders the rigged humanoid via @pixiv/three-vrm, with
   * subtle breathing + head-tracking idle. Use for Aura/companion
   * presenters or branded mascots. Optional.
   */
  vrm?: string;
  /** Uniform scale applied to model when mounted on tracked image */
  modelScale: number;
  /** Rotation in radians [x, y, z] */
  modelRotation: [number, number, number];
  /** Translation in model units [x, y, z] */
  modelPosition: [number, number, number];
  /** Caption shown beside AR experience */
  description: string;
  /** Auto-rotate the model when on the tracked card (default false) */
  autoRotate?: boolean;
  /** Optional ambient + directional lighting overrides */
  lighting?: {
    ambientIntensity?: number;
    directionalIntensity?: number;
    directionalAngle?: number; // degrees from vertical
  };
}

export interface CardCalendar {
  /** Booking URL (Cal.com, Calendly, SavvyCal, TidyCal, etc.). HTTPS only. */
  url: string;
  /** Optional display label, e.g. "Book a 30-min discovery call" */
  label?: string;
  /**
   * Whether to inline-embed via iframe (true) or just show a button
   * link (false). Some providers (Calendly) block iframes from domains
   * not on their allow-list; if embeds fail visually, set false.
   */
  embed?: boolean;
}

export interface CardPrintSpec {
  /** Width in mm — UK standard is 85 */
  width_mm: number;
  /** Height in mm — UK standard is 55 */
  height_mm: number;
  /** Bleed in mm — typically 3 */
  bleed_mm: number;
  /** Safe area inset in mm — typically 3-5 from trim */
  safe_mm: number;
}

export interface Card {
  /** URL slug — must be lowercase a-z, 0-9, hyphens. Used in /c/<slug> */
  slug: string;
  /** Display name */
  name: string;
  /** Role/title — short, one-line */
  role: string;
  /** Optional studio/company name */
  studio?: string;
  /** Optional tagline shown on landing page */
  tagline?: string;
  contact: CardContact;
  brand: CardBrand;
  ar: CardARConfig;
  /**
   * Optional booking integration. When set, the card landing shows a
   * "Book a meeting" embed pointing at the configured URL.
   */
  calendar?: CardCalendar;
  print: CardPrintSpec;
  /** ISO timestamp when card was created/issued */
  issuedAt: string;
  /** Set true if this card should appear on the public /cards index */
  public?: boolean;
}

/** Default print spec for UK business cards */
export const DEFAULT_PRINT_SPEC: CardPrintSpec = {
  width_mm: 85,
  height_mm: 55,
  bleed_mm: 3,
  safe_mm: 4,
};
