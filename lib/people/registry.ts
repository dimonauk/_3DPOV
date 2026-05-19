/**
 * lib/people/registry.ts — Public profile lookup.
 *
 * Consumers go through this module instead of touching
 * `data/people.json` directly. The data file is the canonical
 * source of truth (operator-edited, redacted from the private
 * rolodex). Helpers here filter + sort.
 *
 * See `docs/ROADMAP.md` for the people/agents architecture.
 */

import peopleData from "../../data/people.json";

import type { Profile, ProfileScene } from "./types";

const REGISTRY: Profile[] = peopleData as Profile[];

export function getProfile(id: string): Profile | null {
  return REGISTRY.find((p) => p.id === id) ?? null;
}

export function allProfiles(): Profile[] {
  return REGISTRY;
}

export function profilesByScene(scene: ProfileScene): Profile[] {
  return REGISTRY.filter((p) => p.scenes.includes(scene));
}

export function profilesByLocation(location: string): Profile[] {
  return REGISTRY.filter((p) => p.location === location);
}

export function profilesInArticle(articleSlug: string): Profile[] {
  return REGISTRY.filter((p) => p.appearsIn.includes(articleSlug));
}
