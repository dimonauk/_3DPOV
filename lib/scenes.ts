/**
 * lib/scenes.ts — Scene registry.
 *
 * A "scene" is one of the UK creative communities the studio touches.
 * The canonical set lives here so /people, /whoswho, and /scenes all
 * read the same labels and order without duplicating literal strings.
 *
 * Scene slugs match `ProfileScene` (lib/people/types.ts) exactly. The
 * who's-who article mapping is explicit because article slugs don't
 * 1:1 with scene slugs (e.g. `whos-who-uk-fire-art-photographers` →
 * `fire-art`; `whos-who-uk-drone-people` → `drones`).
 */

import { articles } from "./articles";
import {
  allProfiles,
  profilesByScene,
} from "./people/registry";
import type { Profile, ProfileScene } from "./people/types";
import type { Entry } from "./writing";

export type SceneSlug = ProfileScene;

export type Scene = {
  slug: SceneSlug;
  /** Display label used on /people, /scenes, and /whoswho chips. */
  label: string;
  /** One- or two-sentence framing. Reader's-eye, not pitch. */
  blurb: string;
  /**
   * Slug of the scene's who's-who article, if one exists in
   * `lib/articles.tsx`. When `undefined`, the scene shows on /scenes
   * with a "Forthcoming" badge instead of a "Read the who's-who" link.
   */
  whosWho?: string;
};

/**
 * Canonical scene order. Matches the existing /people grouping so
 * readers landing on either /scenes or /people see the same shape.
 */
export const scenes: Scene[] = [
  {
    slug: "fire-art",
    label: "Fire art + flow",
    blurb:
      "Spin, flame, and the bodies that move them. The UK's fire-art photography scene and the practitioners who shape it.",
    whosWho: "whos-who-uk-fire-art-photographers",
  },
  {
    slug: "light-painting",
    label: "Light painting + long exposure",
    blurb:
      "The slow shutter as collaborator. Light painters whose work the studio reads as kin.",
    whosWho: "whos-who-uk-light-painters",
  },
  {
    slug: "vr",
    label: "VR",
    blurb:
      "Virtual-reality practitioners across the UK — research, art, performance, education. Headsets first, then the people inside them.",
  },
  {
    slug: "ar",
    label: "AR",
    blurb:
      "Augmented-reality practitioners. The thin glass layer between the world and the work; UK studios and individual makers building it.",
    whosWho: "whos-who-uk-ar-people",
  },
  {
    slug: "motion-capture",
    label: "Motion capture",
    blurb:
      "From optical to inertial to markerless — the UK mocap scene and the studios that hold it together.",
    whosWho: "whos-who-uk-motion-capture",
  },
  {
    slug: "pixel-art",
    label: "Pixel art",
    blurb:
      "Constraint as discipline. UK pixel-artists working in tile-grids and limited palettes.",
    whosWho: "whos-who-uk-pixel-artists",
  },
  {
    slug: "splat-360",
    label: "Splat + 360 capture",
    blurb:
      "Gaussian splats, equirectangular, photogrammetry, the volumetric working layer. UK practitioners capturing space.",
  },
  {
    slug: "3d-printing",
    label: "3D printing",
    blurb:
      "Resin, filament, belt. UK makers using additive manufacturing as fine-art and architectural finish.",
  },
  {
    slug: "pov",
    label: "POV + spinning LED",
    blurb:
      "Persistence-of-vision rigs, pixel poi, programmable arms. UK practitioners writing images in air.",
  },
  {
    slug: "led-programming",
    label: "LED programming",
    blurb:
      "Firmware, drivers, frame-by-frame. The UK community writing the software that paints with light.",
  },
  {
    slug: "projection",
    label: "Projection + VJ",
    blurb:
      "Mapped surfaces, live-cued light, club rigs and concert rigs. UK VJs and projection artists.",
    whosWho: "whos-who-uk-projection-vj-people",
  },
  {
    slug: "holography",
    label: "Holography",
    blurb:
      "Real holograms — the optical kind. UK practitioners working with coherent light, fringe patterns, recording films.",
  },
  {
    slug: "jewellery",
    label: "Jewellery",
    blurb:
      "Wearable, editioned, made-to-the-body. UK jewellers using parametric, generative, and traditional techniques.",
    whosWho: "whos-who-uk-jewellery-people",
  },
  {
    slug: "drones",
    label: "Drones",
    blurb:
      "Airborne practice — editorial, FPV, light-painting, surveying. UK drone practitioners on the right side of CAA.",
    whosWho: "whos-who-uk-drone-people",
  },
  {
    slug: "generative-ai",
    label: "Generative AI",
    blurb:
      "Diffusion, transformers, the open-source toolchain. UK practitioners using generative models as collaborator.",
    whosWho: "whos-who-uk-ai-people",
  },
  {
    slug: "vrm",
    label: "VRM + avatars",
    blurb:
      "Virtual bodies, wardrobes, rigs. UK VRM avatar makers, riggers, and the streamers using them.",
  },
  {
    slug: "performance",
    label: "Live performance",
    blurb:
      "Circus, dance, narrative-fiction theatre, club nights. The UK performance scenes the studio overlaps with.",
  },
];

/** Lookup by slug. Returns undefined for unknown scenes. */
export function getScene(slug: string): Scene | undefined {
  return scenes.find((s) => s.slug === slug);
}

/** All scene slugs, in canonical order. */
export function allSceneSlugs(): SceneSlug[] {
  return scenes.map((s) => s.slug);
}

/**
 * Aggregate the people and articles relevant to a scene. Used by
 * the /scenes/[slug] detail page.
 *
 * Articles surfaced:
 *   - the scene's own who's-who article (if one exists)
 *   - any other article that names a profile in this scene via
 *     `profile.appearsIn`. Deduped against the who's-who itself.
 */
export function aggregateScene(slug: SceneSlug): {
  scene: Scene | undefined;
  profiles: Profile[];
  whosWhoArticle: Entry | undefined;
  relatedArticles: Entry[];
} {
  const scene = getScene(slug);
  if (!scene) {
    return {
      scene: undefined,
      profiles: [],
      whosWhoArticle: undefined,
      relatedArticles: [],
    };
  }

  const profiles = profilesByScene(slug).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const whosWhoArticle = scene.whosWho
    ? articles.find((a) => a.slug === scene.whosWho)
    : undefined;

  // Union of every articleSlug each profile appearsIn, minus the
  // who's-who itself (which is already surfaced as a primary link).
  const referencedSlugs = new Set<string>();
  for (const p of profiles) {
    for (const articleSlug of p.appearsIn) {
      if (articleSlug !== scene.whosWho) referencedSlugs.add(articleSlug);
    }
  }
  const relatedArticles = articles.filter((a) => referencedSlugs.has(a.slug));

  return { scene, profiles, whosWhoArticle, relatedArticles };
}

/** Per-scene counts for the /scenes index. Single pass over registries. */
export function sceneCounts(): Array<{
  scene: Scene;
  profileCount: number;
  hasWhosWho: boolean;
}> {
  const all = allProfiles();
  return scenes.map((scene) => ({
    scene,
    profileCount: all.filter((p) => p.scenes.includes(scene.slug)).length,
    hasWhosWho: Boolean(
      scene.whosWho && articles.some((a) => a.slug === scene.whosWho),
    ),
  }));
}
