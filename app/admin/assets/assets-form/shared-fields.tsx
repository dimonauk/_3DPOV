"use client";

/**
 * app/admin/assets/assets-form/shared-fields.tsx
 *
 * The seven fields common to all three modes: Name, Id, Kind,
 * Format, Licence, Attribution, Tags. Takes the slice of the form
 * state it touches as props so the orchestrator wires only what's
 * needed.
 */

import type { AssetKind } from "lib/assets/types";

import { slugify } from "./slug";
import { KINDS, LICENCES } from "./types";

export type SharedFieldsProps = {
  id: string;
  setId: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  kind: AssetKind;
  setKind: (v: AssetKind) => void;
  format: string;
  setFormat: (v: string) => void;
  licence: string;
  setLicence: (v: string) => void;
  attribution: string;
  setAttribution: (v: string) => void;
  tags: string;
  setTags: (v: string) => void;
  idValid: boolean;
};

export function SharedFields(p: SharedFieldsProps) {
  return (
    <section className="aa-form">
      <label className="aa-row">
        <span className="aa-label">Name</span>
        <input
          type="text"
          value={p.name}
          onChange={(e) => {
            p.setName(e.target.value);
            if (!p.id || p.id === slugify(p.name)) p.setId(slugify(e.target.value));
          }}
          placeholder="e.g. POI Rig Mk7 — printable"
        />
      </label>

      <label className="aa-row">
        <span className="aa-label">Id (slug)</span>
        <input
          type="text"
          value={p.id}
          onChange={(e) => p.setId(e.target.value)}
          placeholder="kebab-case"
          className={!p.idValid && p.id ? "aa-input-error" : ""}
        />
        {!p.idValid && p.id && (
          <span className="aa-hint aa-error-hint">
            lowercase, digits and hyphens only, 2-64 chars, starts with a letter
          </span>
        )}
      </label>

      <label className="aa-row">
        <span className="aa-label">Kind</span>
        <select
          title="Asset kind"
          value={p.kind}
          onChange={(e) => p.setKind(e.target.value as AssetKind)}
        >
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </label>

      <label className="aa-row">
        <span className="aa-label">Format (no dot)</span>
        <input
          type="text"
          value={p.format}
          onChange={(e) =>
            p.setFormat(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))
          }
          placeholder="glb / blend / mp4 / zip / album"
        />
      </label>

      <label className="aa-row">
        <span className="aa-label">Licence</span>
        <select
          title="Asset licence"
          value={p.licence}
          onChange={(e) => p.setLicence(e.target.value)}
        >
          {LICENCES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </label>

      <label className="aa-row">
        <span className="aa-label">Attribution (optional)</span>
        <input
          type="text"
          value={p.attribution}
          onChange={(e) => p.setAttribution(e.target.value)}
          placeholder="e.g. Photo by Jon"
        />
      </label>

      <label className="aa-row">
        <span className="aa-label">Tags (comma-sep)</span>
        <input
          type="text"
          value={p.tags}
          onChange={(e) => p.setTags(e.target.value)}
          placeholder="poi, rig, printable"
        />
      </label>
    </section>
  );
}
