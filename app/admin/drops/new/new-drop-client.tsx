"use client";

/**
 * app/admin/drops/new/new-drop-client.tsx — Drop publish form.
 *
 * One-line role: the client form that collects a `DropPublishInput`,
 * POSTs it to `/api/admin/drops/publish`, and surfaces gate failures
 * inline.
 *
 * # Fields
 *
 *   - title                       text
 *   - summary                     textarea
 *   - genomeId                    text (richer picker is v2; see canon)
 *   - parentageChain (readonly)   free-text override for now, will be
 *                                 auto-populated from the genome lookup
 *                                 once the picker lands.
 *   - edition.limitedSize         number (default 25)
 *   - edition.openEnabled         checkbox
 *   - tierIncluded.{m,p,a}        three checkboxes
 *   - firstRefusalRadius          select (3 options)
 *   - passkitEnabled              checkbox
 *
 * # Auth
 *
 * The outer `/admin` layout has already gated on Firebase auth + the
 * operator allow-list. We grab the current user's idToken via the
 * existing `useAuth()` hook + `getIdToken()` to attach as the bearer
 * on the publish request — same pattern as `app/admin/upload`.
 *
 * # Voice
 *
 * Catalogue / archival — no Princess, no marketing copy. This is the
 * studio's back-of-house and the operator's only ally is clarity.
 */

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "components/auth/auth-provider";
import {
  ALL_FIRST_REFUSAL_RADII,
  DEFAULT_EDITION_CONFIG,
  DEFAULT_FIRST_REFUSAL_RADIUS,
  DEFAULT_TIER_INCLUDED,
  type DropPublishInput,
  type FirstRefusalRadius,
  type GateVerdict,
} from "lib/drops/types";

// ---------------------------------------------------------------------------
// Local UI state shape — mirrors DropPublishInput with form-friendly fields
// (limitedSize as string so the input behaves; coerced on submit).
// ---------------------------------------------------------------------------

type FormState = {
  title: string;
  summary: string;
  genomeId: string;
  parentageChainText: string;
  limitedSizeText: string;
  openEnabled: boolean;
  tierIncludedMember: boolean;
  tierIncludedPatron: boolean;
  tierIncludedAtelier: boolean;
  firstRefusalRadius: FirstRefusalRadius;
  passkitEnabled: boolean;
};

const INITIAL_STATE: FormState = {
  title: "",
  summary: "",
  genomeId: "",
  parentageChainText: "",
  limitedSizeText: String(DEFAULT_EDITION_CONFIG.limitedSize),
  openEnabled: DEFAULT_EDITION_CONFIG.openEnabled,
  tierIncludedMember: DEFAULT_TIER_INCLUDED.member,
  tierIncludedPatron: DEFAULT_TIER_INCLUDED.patron,
  tierIncludedAtelier: DEFAULT_TIER_INCLUDED.atelier,
  firstRefusalRadius: DEFAULT_FIRST_REFUSAL_RADIUS,
  passkitEnabled: true,
};

// ---------------------------------------------------------------------------
// Status — `idle` / `submitting` / `error` / `done`.
// ---------------------------------------------------------------------------

type SubmitStatus =
  | { kind: "idle" }
  | { kind: "submitting" }
  | {
      kind: "gate-failed";
      message: string;
      oracle?: GateVerdict;
      sieve?: GateVerdict;
    }
  | { kind: "validation-failed"; issues: ReadonlyArray<{ path: string; message: string }> }
  | { kind: "error"; message: string }
  | { kind: "done"; dropId: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const INPUT_CLASS =
  "w-full rounded-sm border border-warm-black-700 bg-warm-black-950 px-3 py-2 text-xs text-chrome-100 placeholder-chrome-600 focus:border-pink-200 focus:outline-none disabled:opacity-60";

const TEXTAREA_CLASS = `${INPUT_CLASS} min-h-[6rem] leading-relaxed`;

const LABEL_CLASS = "chrome-label text-chrome-500";

const RADIUS_LABEL: Record<FirstRefusalRadius, string> = {
  "parent-only": "Parent only",
  "parent+grandparent+siblings-of-parent":
    "Parent + grandparent + siblings of parent",
  "full-kingdom": "Full kingdom",
};

function parseChain(text: string): string[] {
  return text
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function toPublishInput(state: FormState): DropPublishInput {
  const limitedSize = Number.parseInt(state.limitedSizeText, 10);
  const safeLimited = Number.isFinite(limitedSize) && limitedSize >= 0 ? limitedSize : 0;
  const chain = parseChain(state.parentageChainText);
  const input: DropPublishInput = {
    title: state.title.trim(),
    summary: state.summary.trim(),
    genomeId: state.genomeId.trim(),
    edition: {
      unique: true,
      limitedSize: safeLimited,
      openEnabled: state.openEnabled,
    },
    tierIncluded: {
      member: state.tierIncludedMember,
      patron: state.tierIncludedPatron,
      atelier: state.tierIncludedAtelier,
    },
    firstRefusalRadius: state.firstRefusalRadius,
    passkitEnabled: state.passkitEnabled,
  };
  if (chain.length > 0) input.parentageChain = chain;
  return input;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NewDropClient() {
  const router = useRouter();
  const { user } = useAuth();
  const [state, setState] = useState<FormState>(INITIAL_STATE);
  const [status, setStatus] = useState<SubmitStatus>({ kind: "idle" });

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      setStatus({
        kind: "error",
        message: "No signed-in user — refresh and sign in again.",
      });
      return;
    }
    setStatus({ kind: "submitting" });
    let idToken: string;
    try {
      idToken = await user.getIdToken();
    } catch (err) {
      setStatus({
        kind: "error",
        message:
          err instanceof Error
            ? `Could not fetch id token: ${err.message}`
            : "Could not fetch id token.",
      });
      return;
    }

    const input = toPublishInput(state);

    let res: Response;
    try {
      res = await fetch("/api/admin/drops/publish", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(input),
      });
    } catch (err) {
      setStatus({
        kind: "error",
        message:
          err instanceof Error ? err.message : "Network error contacting publish endpoint.",
      });
      return;
    }

    let json: unknown;
    try {
      json = await res.json();
    } catch {
      setStatus({
        kind: "error",
        message: `Publish endpoint returned a non-JSON ${res.status} response.`,
      });
      return;
    }

    if (res.status === 201 && isDropResponse(json)) {
      setStatus({ kind: "done", dropId: json.drop.id });
      router.refresh();
      return;
    }
    if (res.status === 400 && isGateFailResponse(json)) {
      const next: SubmitStatus = {
        kind: "gate-failed",
        message: json.message,
      };
      if (json.oracle) next.oracle = json.oracle;
      if (json.sieve) next.sieve = json.sieve;
      setStatus(next);
      return;
    }
    if (res.status === 400 && isValidationFailResponse(json)) {
      setStatus({ kind: "validation-failed", issues: json.issues });
      return;
    }
    const message =
      typeof json === "object" && json !== null && "error" in json
        ? String((json as { error: unknown }).error)
        : `Publish failed (${res.status}).`;
    setStatus({ kind: "error", message });
  };

  const isSubmitting = status.kind === "submitting";

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-6 rounded-sm border border-warm-black-700 bg-warm-black-950 p-6"
    >
      {/* Title + summary -------------------------------------------------- */}
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

      {/* Genome ----------------------------------------------------------- */}
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

      {/* Edition ---------------------------------------------------------- */}
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

      {/* Tier inclusion --------------------------------------------------- */}
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

      {/* First-refusal radius -------------------------------------------- */}
      <Field
        label="First-refusal radius"
        hint="Who gets the first-refusal window when this drop opens."
      >
        <select
          value={state.firstRefusalRadius}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            setField("firstRefusalRadius", e.target.value as FirstRefusalRadius)
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

      {/* Status block ---------------------------------------------------- */}
      <StatusBlock status={status} />

      {/* Submit ---------------------------------------------------------- */}
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

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className={LABEL_CLASS}>{label}</span>
      {hint ? (
        <span className="text-[0.65rem] leading-relaxed text-chrome-500">
          {hint}
        </span>
      ) : null}
      {children}
    </label>
  );
}

function Checkbox({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.18em] text-chrome-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="accent-pink-300"
      />
      {label}
    </label>
  );
}

function StatusBlock({ status }: { status: SubmitStatus }) {
  if (status.kind === "idle" || status.kind === "submitting") return null;
  if (status.kind === "done") {
    return (
      <div className="rounded-sm border border-mint-300/40 bg-mint-300/10 p-3 text-xs text-mint-200">
        Drop published. Id: <code className="text-mint-100">{status.dropId}</code>.
      </div>
    );
  }
  if (status.kind === "gate-failed") {
    return (
      <div className="flex flex-col gap-2 rounded-sm border border-pink-300/40 bg-pink-300/10 p-3 text-xs text-pink-200">
        <strong className="chrome-label text-pink-100">
          Publish blocked at gate
        </strong>
        <span className="leading-relaxed">{status.message}</span>
        {status.oracle && !status.oracle.pass ? (
          <GateReport title="Oracle" reasons={status.oracle.reasons} />
        ) : null}
        {status.sieve && !status.sieve.pass ? (
          <GateReport title="Sieve" reasons={status.sieve.reasons} />
        ) : null}
      </div>
    );
  }
  if (status.kind === "validation-failed") {
    return (
      <div className="flex flex-col gap-2 rounded-sm border border-pink-300/40 bg-pink-300/10 p-3 text-xs text-pink-200">
        <strong className="chrome-label text-pink-100">
          Validation failed
        </strong>
        <ul className="list-disc pl-4 leading-relaxed">
          {status.issues.map((i) => (
            <li key={`${i.path}-${i.message}`}>
              <code className="text-pink-100">{i.path || "(root)"}</code>:{" "}
              {i.message}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <div className="rounded-sm border border-pink-300/40 bg-pink-300/10 p-3 text-xs text-pink-200">
      <strong className="chrome-label text-pink-100">Error</strong>{" "}
      <span className="leading-relaxed">{status.message}</span>
    </div>
  );
}

function GateReport({
  title,
  reasons,
}: {
  title: string;
  reasons: ReadonlyArray<string>;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="chrome-label text-pink-100">{title}</span>
      <ul className="list-disc pl-4 leading-relaxed text-pink-200">
        {reasons.map((r, i) => (
          <li key={`${title}-${i}`}>{r}</li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Response narrowing (runtime guards)
// ---------------------------------------------------------------------------

function isDropResponse(value: unknown): value is { drop: { id: string } } {
  if (typeof value !== "object" || value === null) return false;
  const v = value as { drop?: unknown };
  if (typeof v.drop !== "object" || v.drop === null) return false;
  return typeof (v.drop as { id?: unknown }).id === "string";
}

function isGateFailResponse(value: unknown): value is {
  error: "gate_failed";
  message: string;
  oracle?: GateVerdict;
  sieve?: GateVerdict;
} {
  if (typeof value !== "object" || value === null) return false;
  const v = value as { error?: unknown; message?: unknown };
  return v.error === "gate_failed" && typeof v.message === "string";
}

function isValidationFailResponse(value: unknown): value is {
  error: "validation_failed";
  issues: ReadonlyArray<{ path: string; message: string }>;
} {
  if (typeof value !== "object" || value === null) return false;
  const v = value as { error?: unknown; issues?: unknown };
  if (v.error !== "validation_failed") return false;
  if (!Array.isArray(v.issues)) return false;
  return v.issues.every(
    (i) =>
      typeof i === "object" &&
      i !== null &&
      typeof (i as { path?: unknown }).path === "string" &&
      typeof (i as { message?: unknown }).message === "string",
  );
}
