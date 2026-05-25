"use client";

/**
 * app/admin/drops/new/new-drop-client.tsx — Drop publish form.
 *
 * Thin orchestrator: composes the publish hook with the field /
 * checkbox / status sub-components and lays out the form. No state,
 * no fetch, no narrowing — those live in `./new-drop/`.
 *
 * # Auth
 *
 * The outer `/admin` layout has already gated on Firebase auth + the
 * operator allow-list. We grab the current user's idToken via
 * `useAuth()` + `getIdToken()` inside the publish hook — same
 * pattern as `/admin/upload`.
 *
 * # Voice
 *
 * Catalogue / archival — no Princess, no marketing copy. This is the
 * studio's back-of-house and the operator's only ally is clarity.
 */

import { type ChangeEvent } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "components/auth/auth-provider";
import {
  ALL_FIRST_REFUSAL_RADII,
  type FirstRefusalRadius,
} from "lib/drops/types";

import { Checkbox, Field } from "./new-drop/form-fields";
import { StatusBlock } from "./new-drop/status-block";
import {
  INPUT_CLASS,
  LABEL_CLASS,
  RADIUS_LABEL,
  TEXTAREA_CLASS,
} from "./new-drop/types";
import { usePublishDrop } from "./new-drop/use-publish-drop";

export function NewDropClient() {
  const router = useRouter();
  const { user } = useAuth();
  const { state, status, isSubmitting, setField, submit } = usePublishDrop(
    user,
    router,
  );

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-6 rounded-sm border border-warm-black-700 bg-warm-black-950 p-6"
    >
      <Field label="Title">
        <input
          type="text"
          required
          value={state.title}
          onChange={(e) => setField("title", e.target.value)}
          disabled={isSubmitting}
          placeholder="What the rookery card calls this drop"
          className={INPUT_CLASS}
        />
      </Field>

      <Field label="Summary">
        <textarea
          required
          value={state.summary}
          onChange={(e) => setField("summary", e.target.value)}
          disabled={isSubmitting}
          placeholder="One paragraph. The feed card body + drop-detail hero copy."
          className={TEXTAREA_CLASS}
        />
      </Field>

      <Field
        label="Genome id"
        hint="The sequenceId from lib/evolution. A picker lands in v2; paste an id for now."
      >
        <input
          type="text"
          required
          value={state.genomeId}
          onChange={(e) => setField("genomeId", e.target.value)}
          disabled={isSubmitting}
          placeholder="g3-1-techno"
          className={INPUT_CLASS}
        />
      </Field>

      <Field
        label="Parentage chain (override)"
        hint="Comma- or newline-separated. Leave empty to read from the genome's Firestore record."
      >
        <textarea
          value={state.parentageChainText}
          onChange={(e) => setField("parentageChainText", e.target.value)}
          disabled={isSubmitting}
          placeholder="g0-tec-0, g1-1-g0tec0, g2-3-g1-1g0t"
          className={TEXTAREA_CLASS}
        />
      </Field>

      <fieldset className="flex flex-col gap-3 rounded-sm border border-warm-black-700 p-4">
        <legend className={`${LABEL_CLASS} px-2`}>Edition</legend>
        <p className="text-[0.7rem] leading-relaxed text-chrome-400">
          Every drop has one Unique (always). Limited and Open are
          configurable per drop.
        </p>

        <Field label="Limited edition size">
          <input
            type="number"
            min={0}
            max={10_000}
            step={1}
            value={state.limitedSizeText}
            onChange={(e) => setField("limitedSizeText", e.target.value)}
            disabled={isSubmitting}
            className={INPUT_CLASS}
          />
        </Field>

        <Checkbox
          label="Open edition enabled"
          checked={state.openEnabled}
          disabled={isSubmitting}
          onChange={(checked) => setField("openEnabled", checked)}
        />

        <Checkbox
          label="Mint Apple Wallet passes at claim time"
          checked={state.passkitEnabled}
          disabled={isSubmitting}
          onChange={(checked) => setField("passkitEnabled", checked)}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-3 rounded-sm border border-warm-black-700 p-4">
        <legend className={`${LABEL_CLASS} px-2`}>Tier inclusion</legend>
        <p className="text-[0.7rem] leading-relaxed text-chrome-400">
          When ticked, members at that tier get this drop counted as
          their included monthly drop. Multiple tiers may apply.
        </p>
        <Checkbox
          label="Included for Member tier"
          checked={state.tierIncludedMember}
          disabled={isSubmitting}
          onChange={(checked) => setField("tierIncludedMember", checked)}
        />
        <Checkbox
          label="Included for Patron tier"
          checked={state.tierIncludedPatron}
          disabled={isSubmitting}
          onChange={(checked) => setField("tierIncludedPatron", checked)}
        />
        <Checkbox
          label="Included for Atelier tier"
          checked={state.tierIncludedAtelier}
          disabled={isSubmitting}
          onChange={(checked) => setField("tierIncludedAtelier", checked)}
        />
      </fieldset>

      <Field
        label="First-refusal radius"
        hint="Who gets the first-refusal window when this drop opens."
      >
        <select
          title="First-refusal radius"
          value={state.firstRefusalRadius}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            setField(
              "firstRefusalRadius",
              e.target.value as FirstRefusalRadius,
            )
          }
          disabled={isSubmitting}
          className={INPUT_CLASS}
        >
          {ALL_FIRST_REFUSAL_RADII.map((r) => (
            <option key={r} value={r}>
              {RADIUS_LABEL[r]}
            </option>
          ))}
        </select>
      </Field>

      <StatusBlock status={status} />

      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-sm border border-pink-200/60 bg-pink-200/10 px-5 py-2 text-xs uppercase tracking-[0.2em] text-pink-200 transition-colors hover:bg-pink-200/20 disabled:opacity-60"
        >
          {isSubmitting ? "Publishing…" : "Publish drop"}
        </button>
      </div>
    </form>
  );
}
