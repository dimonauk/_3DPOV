/**
 * lib/admin/targeting.ts — Score rolodex people against a piece of
 * studio content.
 *
 * "I have content X with tags + scenes. Who in the rolodex is most
 * likely to care about it?" Output: a sorted list of people with an
 * overlap score and the reason they were surfaced.
 *
 * Score model (deliberately simple — tweak as the data fills in):
 *
 *   +3 per shared scene
 *   +1 per shared free-form tag (lowercased, deduped)
 *   +1 if the content's "primary scene" matches one of the
 *     person's scenes (extra weight, since primary > secondary)
 *
 * Returns top N profiles sorted by score, with a why-it-matched
 * trail.
 */

import "server-only";

import { allProfiles } from "../people/registry";
import type { Profile, ProfileScene } from "../people/types";

export type TargetingInput = {
  /** Content title, just for echoing back. */
  title: string;
  /** The content's primary scene. */
  primaryScene: ProfileScene;
  /** All scenes the content touches (including primary). */
  scenes: ProfileScene[];
  /** Free-form tags from the content. */
  tags: string[];
};

export type TargetingHit = {
  profile: Profile;
  score: number;
  reasons: string[];
};

export function scoreOverlap(
  profile: Profile,
  input: TargetingInput,
  profileTags: Set<string> = new Set(),
): TargetingHit {
  const reasons: string[] = [];
  let score = 0;

  for (const s of input.scenes) {
    if (profile.scenes.includes(s)) {
      score += 3;
      reasons.push(`shared scene · ${s}`);
    }
  }
  if (profile.scenes.includes(input.primaryScene)) {
    score += 1;
    reasons.push(`primary scene match · ${input.primaryScene}`);
  }
  for (const tag of input.tags.map((t) => t.toLowerCase())) {
    if (profileTags.has(tag)) {
      score += 1;
      reasons.push(`shared tag · ${tag}`);
    }
  }

  return { profile, score, reasons };
}

export function target(
  input: TargetingInput,
  limit = 25,
): TargetingHit[] {
  return allProfiles()
    .map((p) =>
      scoreOverlap(p, input, new Set([] /* tags TODO when shipped */)),
    )
    .filter((h) => h.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.profile.name.localeCompare(b.profile.name);
    })
    .slice(0, limit);
}
