/**
 * lib/capabilities/_base.ts — Types and registration contract for the
 * capability registry.
 *
 * # The thesis
 *
 * A *capability* is a single, headless, typed function (or small set of
 * functions) that does one thing the studio can do. Capabilities are
 * never UI. They are never apps. They are the atoms that UIs and apps
 * compose to make features.
 *
 * Examples: `vrm.load`, `audio.tts`, `motion.idle`, `agent.dialogue`,
 * `input.headpose`, `viz.attractor`, `algo.spiral`. Each one is
 * registered here, identified by a stable `CapabilityId`, and callable
 * by any other module in the studio.
 *
 * # Why this exists
 *
 * - The Hangar (Box 1) contains working code locked inside monolithic
 *   demos and apps. The capability registry is the shape that frees it.
 * - Open-source quarry (Box 3) lifts only become useful if they
 *   atomise to this shape on entry. The migration discipline is:
 *   anything entering the studio gets shredded into capabilities and
 *   forgets it was ever a "library."
 * - The genome-everything thesis (Darwinian + Pokémon-stage cross-type
 *   evolution) only works if every breedable artifact reaches a common
 *   contract. CapabilityRecord is that contract.
 *
 * # State lives in zustand
 *
 * Capabilities are pure functions over typed inputs and typed outputs.
 * They do not own state. When they need shared state — Aura's OCEAN
 * vector, the current ChronoMode, the current head-pose, the cast's
 * memory — they read and write zustand slices from `lib/state/`. This
 * is what makes them composable: any capability can read any slice, and
 * any UI can render any slice, without prop-drilling or context
 * gymnastics.
 *
 * Border rule: a capability that reaches for a DOM ref, a React hook,
 * or a singleton outside zustand is a leak. Refactor or reject.
 *
 * # The lazy-load pattern
 *
 * Mirrors `lib/algorithms/`. The registry holds metadata + a `load()`
 * pointer; the actual capability module is dynamic-imported on first
 * use. Keeps the registry index light, keeps capabilities tree-shaken
 * out of bundles that don't reach them.
 */

export type CapabilityKind =
  | "vrm"
  | "audio"
  | "motion"
  | "agent"
  | "input"
  | "viz"
  | "algo"
  | "shell"
  | "world"
  | "geo"
  | "ar"
  | "media"
  | "commerce";

/**
 * Stable identifier. Convention: `<kind>.<verb-or-noun>`, kebab-case
 * inside each segment. The registry enforces uniqueness; renaming a
 * CapabilityId is a breaking change.
 */
export type CapabilityId =
  // Filled in as capabilities are registered. The string literal union
  // grows; the type system catches every wiring mismatch.
  | "vrm.load"
  | "vrm.bones.pose"
  | "vrm.expressions.blend"
  | "vrm.lookAt"
  | "audio.lipsync-analysis"
  | "audio.stt"
  | "audio.tts"
  | "audio.visemes"
  | "motion.idle"
  | "motion.gesture"
  | "motion.laban"
  | "agent.banter"
  | "agent.dialogue"
  | "agent.memory"
  | "input.headpose"
  | "viz.attractor"
  | "viz.depth-estimation"
  | "viz.light-sculpture"
  | "viz.particles"
  | "viz.spatial-export"
  | "viz.splat-generate"
  | "viz.splat-render"
  | "viz.stereo-pair"
  | "viz.usdz-export"
  | "geo.position"
  | "ar.window"
  | "media.capture"
  | "commerce.sharp-job"
  | "commerce.sharp-video-job"
  | "commerce.print-order";

export type CapabilityStatus =
  | "registered" // module present, callable
  | "stub" // metadata only, atomisation pending
  | "deprecated"; // replaced by another id; kept for one release

/**
 * The metadata + lazy loader the registry holds.
 *
 * `load()` returns the capability module. Each module's public shape is
 * specific to the capability — the registry does not narrow it. Callers
 * import the capability's type from its own file when they need the
 * full signature. The registry is for discovery, lifecycle, and the
 * `/capabilities` route — not for type-safe direct invocation.
 */
export type CapabilityRecord = {
  id: CapabilityId;
  kind: CapabilityKind;
  /** Human-readable display name for the /capabilities route. */
  name: string;
  /** One-line description — what this capability does, in our voice. */
  summary: string;
  status: CapabilityStatus;
  /** Where it ported from. Free text — see ATTRIBUTIONS.md for the ledger. */
  source: string;
  /** Lazy loader for the module. Returns `unknown` — callers narrow it. */
  load: () => Promise<unknown>;
  /** Zustand slice names this capability reads/writes, if any. */
  stateSlices?: string[];
  /** Other capability IDs this one depends on at runtime. */
  dependsOn?: CapabilityId[];
};

/**
 * Internal registry map. Populated by `register()` calls in the
 * registry index file. The order of registration is the order of
 * iteration for /capabilities listing.
 */
const registry = new Map<CapabilityId, CapabilityRecord>();

export function register(record: CapabilityRecord): void {
  if (registry.has(record.id)) {
    throw new Error(
      `Capability ${record.id} already registered. CapabilityIds must be unique.`,
    );
  }
  registry.set(record.id, record);
}

export function getCapability(id: CapabilityId): CapabilityRecord | undefined {
  return registry.get(id);
}

export function listCapabilities(): CapabilityRecord[] {
  return Array.from(registry.values());
}

export function listByKind(kind: CapabilityKind): CapabilityRecord[] {
  return listCapabilities().filter((c) => c.kind === kind);
}
