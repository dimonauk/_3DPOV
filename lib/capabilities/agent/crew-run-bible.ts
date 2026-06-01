/**
 * crew-run-bible.ts — Resolve a crew agent to a CharacterBible.
 */
import { getMember } from "./cast-roster";
import type { CharacterBible } from "lib/cast/aura";
import type { CrewAgentDefinition } from "./crew-run-types";

function synthesiseBible(agent: CrewAgentDefinition): CharacterBible {
  const draws = agent.task_boundaries
    ? agent.task_boundaries.split(/[.\n]/).map((s) => s.trim()).filter(Boolean)
    : ["the task at hand", "their stated goal", "their backstory"];
  return {
    name: agent.id, role: agent.role, voice: agent.backstory,
    posture: agent.goal, draws,
    refusals: ["ignoring the task description", "refusing the assigned work without good reason"],
    catchphrases: [], forbidden: [], defaultMode: "azure",
    pronouns: "they/them", aspects: [], relationships: [],
    bio: agent.backstory, age: null, gender: null, location: null,
    avatarStyle: "minimal",
    color: { primary: "#888888", secondary: "#cccccc" },
    sigil: "", house: null,
  } as unknown as CharacterBible;
}

export function resolveBible(
  agent: CrewAgentDefinition,
): { bible: CharacterBible; from: "cast" | "synthesised" } {
  try {
    const member = getMember(agent.id as never);
    return { bible: member.bible, from: "cast" };
  } catch {
    return { bible: synthesiseBible(agent), from: "synthesised" };
  }
}
