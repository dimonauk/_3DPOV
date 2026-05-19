/**
 * lib/people/types.ts — Public profile types.
 *
 * The studio's public-facing profile system. One entry per person
 * named in the who's-who articles. **Publishable fields only** — no
 * emails, no editorial ratings, no outreach state. The private
 * rolodex (at `D:/.github/holoflow-private/rolodex/`) holds the
 * fuller picture for Dimona and subscribers.
 *
 * Slugs match the private rolodex's `id` so the two systems
 * converge cleanly when the subscriber tier ships.
 */

export type ProfileScene =
  | "fire-art"
  | "light-painting"
  | "vr"
  | "ar"
  | "motion-capture"
  | "pixel-art"
  | "vrm"
  | "pov"
  | "led-programming"
  | "projection"
  | "holography"
  | "jewellery"
  | "drones"
  | "generative-ai"
  | "splat-360"
  | "3d-printing"
  | "performance";

export type ProfileRole =
  | "photographer"
  | "artist"
  | "studio"
  | "researcher"
  | "performer"
  | "venue"
  | "writer";

export type ProfileLocation =
  | "London"
  | "Manchester"
  | "Greater Manchester"
  | "Salford"
  | "Birmingham"
  | "Bristol"
  | "Brighton"
  | "Edinburgh"
  | "Glasgow"
  | "Leeds"
  | "Sheffield"
  | "Sunderland"
  | "Liverpool"
  | "Cambridge"
  | "Oxford"
  | "Other UK"
  | "Diaspora";

export type ProfileSocials = {
  instagram?: string;
  x?: string;
  bluesky?: string;
  mastodon?: string;
  flickr?: string;
  youtube?: string;
  tiktok?: string;
  facebook?: string;
  linkedin?: string;
  github?: string;
};

export type Profile = {
  /** Kebab-case slug. Matches the private rolodex `id`. */
  id: string;
  /** Real or public-brand name. */
  name: string;
  /** Optional secondary name (e.g. "trades as", "publishes as"). */
  publicBrand?: string;
  /** Where they're based. */
  location: ProfileLocation;
  /** All the scenes they touch. A person can be in many. */
  scenes: ProfileScene[];
  /** Primary role. */
  role: ProfileRole;
  /** Their own website / public URL. */
  publicUrl: string;
  /** Public social handles (no full URLs needed). */
  socials?: ProfileSocials;
  /** Short bio. 1-2 sentences. From their own self-description
   *  where quoted, otherwise lightly paraphrased from a who's-who
   *  article. */
  bioShort: string;
  /** Slugs of who's-who articles they appear in. */
  appearsIn: string[];
  /** Date this entry was last verified, ISO YYYY-MM-DD. */
  lastVerified: string;
};
