/**
 * app/agents/crew/crew-runner/types.ts — Local types + constants for
 * the crew-runner client. Mirrors `lib/agents/crew/types.ts` shapes
 * structurally (the server-side module is server-only and can't be
 * imported from a client component).
 *
 * If the server types drift, the client `step.kind` switch in
 * `trail-view.tsx` fails loudly at the first unknown kind.
 */

export type ClientCrewStep =
  | { kind: "plan"; by: string; reasoning: string }
  | { kind: "delegate"; by: string; to: string; subtask: string }
  | {
      kind: "tool";
      by: string;
      tool: string;
      args: unknown;
      result?: unknown;
      error?: string;
    }
  | { kind: "answer"; by: string; text: string }
  | { kind: "stop"; reason: string };

export type ClientCrewRun = {
  taskId: string;
  trail: ClientCrewStep[];
  output: string;
  ok: boolean;
  iterations: number;
  totalUsage: { inputTokens: number; outputTokens: number };
};

/**
 * Available specialists — keep aligned with `lib/agents/cast.ts` and
 * the parallel `lib/agents/specialists` module. When new agents land,
 * add them here AND in the cast bible.
 */
export const SPECIALIST_OPTIONS = [
  { slug: "aura", displayName: "Aura" },
  { slug: "marcel", displayName: "Marcel" },
  { slug: "coco", displayName: "Coco" },
  { slug: "scribe", displayName: "The Scribe" },
  { slug: "penny", displayName: "Penny" },
] as const;

export const DEFAULT_ORCHESTRATOR = "aura";

export type FormState = {
  description: string;
  orchestrator: string;
  specialistSlugs: string[]; // empty array = "all"
  expectedOutput: string;
};

export const INITIAL_FORM: FormState = {
  description: "",
  orchestrator: DEFAULT_ORCHESTRATOR,
  specialistSlugs: SPECIALIST_OPTIONS.map((s) => s.slug),
  expectedOutput: "",
};

export type SubmitStatus =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "error"; message: string }
  | { kind: "done"; run: ClientCrewRun };

// Styling tokens — mirror /admin/drops/new for consistency.
export const INPUT_CLASS =
  "w-full rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-xs text-chrome-100 placeholder-chrome-600 focus:border-pink-200 focus:outline-none disabled:opacity-60";
export const TEXTAREA_CLASS = `${INPUT_CLASS} min-h-[8rem] leading-relaxed`;
export const LABEL_CLASS = "chrome-label text-chrome-500";
