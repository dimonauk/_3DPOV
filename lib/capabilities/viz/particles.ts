/**
 * lib/capabilities/viz/particles.ts — Capability `viz.particles`: logical particle-field registration with bone-anchored / free / emitted sources.
 *
 * One-line role: own the registry of running particle fields on the viz slice — Aura's 50k bone-emitted cloud, atomised.
 * Full purpose in particles.PURPOSE.md.
 *
 * The capability writes only to `viz.particleFields` via the slice's
 * `upsertParticleField` / `removeParticleField` actions. It does not
 * render — a future `components/three/ParticleField.tsx` subscribes
 * to the slice and produces geometry.
 */

import { vizStore, type ParticleField } from "lib/state/viz";

/** Bone-anchored emitter — references a VRM handle + a bone name on it. */
export type BoneAnchorSource = {
  readonly boneAnchor: {
    readonly vrmHandleId: string;
    readonly boneName: string;
  };
};

/** Explicit point cloud emitter — a ReadonlyArray of [x,y,z] anchor points. */
export type EmittedSource = {
  readonly emitted: ReadonlyArray<readonly [number, number, number]>;
};

/** Free-floating field — no anchor, drifts in world space. */
export type FreeSource = "free";

export type ParticleFieldSource = FreeSource | BoneAnchorSource | EmittedSource;

export type ParticleFieldOptions = {
  readonly id: string;
  readonly count: number;
  readonly source: ParticleFieldSource;
};

/**
 * Encode a structured source into the slice's string form.
 *
 * Format:
 *  - free                                 → "free"
 *  - boneAnchor { vrmHandleId, boneName } → "bone-anchored:<vrmHandleId>:<boneName>"
 *  - emitted [pts...]                     → "emitted:<N>pts"
 *
 * The emitted form is deliberately count-only: the actual point
 * coordinates live with the caller / future component layer. The
 * slice string is just enough to identify the kind of source.
 */
function encodeSource(source: ParticleFieldSource): string {
  if (source === "free") return "free";
  if ("boneAnchor" in source) {
    const { vrmHandleId, boneName } = source.boneAnchor;
    return `bone-anchored:${vrmHandleId}:${boneName}`;
  }
  return `emitted:${source.emitted.length}pts`;
}

/**
 * Register (or re-register) a particle field on the viz slice.
 *
 * Idempotent on `id`: calling twice with the same id replaces the
 * existing entry. Returns the id so callers can chain.
 */
export function startParticleField(options: ParticleFieldOptions): string {
  const field: ParticleField = {
    id: options.id,
    count: options.count,
    source: encodeSource(options.source),
  };
  vizStore.getState().upsertParticleField(field);
  return options.id;
}

/**
 * Deregister a particle field. No-op if the id is unknown.
 *
 * Caller is responsible for any GPU disposal in the component layer;
 * this capability only owns the logical entry on the slice.
 */
export function stopParticleField(id: string): void {
  vizStore.getState().removeParticleField(id);
}

/**
 * Update the count of an already-registered field. No-op if unknown
 * (we don't conjure fields out of an updateCount call — that's
 * `startParticleField`'s job).
 */
export function updateParticleCount(id: string, count: number): void {
  const existing = vizStore.getState().particleFields[id];
  if (!existing) return;
  vizStore.getState().upsertParticleField({ ...existing, count });
}

/** Snapshot of every currently-registered particle field. */
export function listFields(): ParticleField[] {
  return Object.values(vizStore.getState().particleFields);
}

/**
 * Aura canon convenience: register the 50k-particle cloud as three
 * bone-anchored fields on `head`, `leftHand`, `rightHand`.
 *
 * Distribution choice: 20k on the head, 15k on each hand
 *  (20_000 + 15_000 + 15_000 = 50_000). The head carries the larger
 *  share because it's the focal point of attention; the hands
 *  carry equal shares so neither dominates when Aura gestures
 *  asymmetrically.
 *
 * Ids are deterministic: `aura:${vrmHandleId}:head|leftHand|rightHand`.
 * Calling twice on the same handle re-upserts (idempotent on the slice).
 *
 * Returns the array of field ids registered, in head/left/right order.
 */
export function auraParticleFields(vrmHandleId: string): string[] {
  const emitters: ReadonlyArray<{ bone: string; count: number; slot: string }> = [
    { bone: "head", count: 20_000, slot: "head" },
    { bone: "leftHand", count: 15_000, slot: "leftHand" },
    { bone: "rightHand", count: 15_000, slot: "rightHand" },
  ];

  const ids: string[] = [];
  for (const e of emitters) {
    const id = `aura:${vrmHandleId}:${e.slot}`;
    startParticleField({
      id,
      count: e.count,
      source: { boneAnchor: { vrmHandleId, boneName: e.bone } },
    });
    ids.push(id);
  }
  return ids;
}
