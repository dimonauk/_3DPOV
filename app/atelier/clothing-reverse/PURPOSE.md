# app/atelier/clothing-reverse

Clothing reverse-engineer chamber. Ported from
`D:/The_Hangar/apps/clothing-reverse-engineer/` (Vite + React 18 +
`@google/genai`, "Clothing Reverse Engineer" v1.0.0).

## What this is

Upload a clothing photograph. Gemini Vision (`gemini-2.0-flash`) reads
the garment back as a structured spec: type, style, measurements at a
typical M, the pattern pieces you'd need to recreate it, materials and
notions, construction details (seams / closures / difficulty), and a
sewing sequence with stitch settings derived from the analysis.

The chamber writes nothing back to the server: the photo goes up once,
the spec comes down, the route forgets. The visitor can export the
full spec as a JSON file (also dropped into the atelier recent-outputs
drawer).

## Pair with

- `atelier/lithophane` — proves the photo → printable artefact pattern.
- Fabric calculator (future) — would consume the pattern-pieces array
  to compute total fabric area + a layout for a given bolt width.
- Print bureau (future) — could ingest the JSON, charge for a printed
  + sized PDF pattern delivered to door.

## Wiring

- Server `page.tsx` — metadata + heading + Footer + mounts the
  client.
- Client `clothing-reverse-client.tsx` — drop zone, analyse button,
  result panel with sections for garment summary, measurements,
  materials, pattern pieces (each rendered as a small SVG thumb with
  grainline marker), construction list, stitch settings, sequence,
  colours, and a JSON export.
- Server route `app/api/clothing-reverse/analyze/route.ts` — wraps
  the Gemini call so the studio's `GOOGLE_AI_API_KEY_GEN` never
  reaches the browser. Same auth + rate-limit posture as the
  edit-image route (BYO header beats studio env; studio is capped at
  5/hr per IP in-memory).

## Dependencies on the host site

- `@google/genai` — already in `package.json` (used by the imagen +
  image-edit routes).
- `lib/log` → `createLogger("atelier:clothing-reverse")` (client) and
  `createLogger("api:clothing-reverse")` (route).
- `lib/env` → `googleGenApiKey()` + `envOrUndefined`.
- `lib/state/atelier-hooks` → `useActiveChamber` +
  `pushAtelierOutput` (drops the exported JSON spec into the
  recent-outputs drawer as `application/json`).
- `lib/state/google-ai-key` → reads the visitor's BYO AI Studio key.
- `components/atelier/google-ai-settings` — the settings dialog
  already shared with the imagen + image-edit chambers.
- `components/layout/footer`.

No new dependencies installed.

## Differences from the source

- **Tabs collapsed.** The original Vite app split the result into
  four tabs (Analysis / Pattern / Instructions / Export). Holoflow's
  editorial register reads better as one stacked page, so the tabs are
  gone — the result is rendered as sequential sections in
  `AnalysisResult`.
- **Key moved server-side.** The original called `@google/genai`
  directly from the browser with `VITE_GEMINI_API_KEY`. The chamber
  here calls `/api/clothing-reverse/analyze` instead so the studio's
  key stays on the server. Visitors can still bring their own via the
  GoogleAiSettings dialog (passed as `X-Visitor-Google-Key`).
- **Mock-fallback dropped.** The source returned a hard-coded A-line
  dress when no key was set. The route returns 503 `no_key` and the
  client surfaces an "open settings" button.
- **No new icons / no `lucide-react`.** Used inline labels.
- **`processingTime` is server-measured** (route-side) rather than
  client-clock + 1500ms fudge.

## Configuration

- `GOOGLE_AI_API_KEY_GEN` — preferred studio key (separate billing
  scope). Falls back to `GOOGLE_AI_API_KEY` if absent. Without either
  set, the chamber refuses unless the visitor pastes their own AI
  Studio key.
- `GOOGLE_AI_MODEL` — optional model override; defaults to
  `gemini-2.0-flash` (the model the source used).

## Open questions / what it does NOT do

- **PDF / SVG / DXF export.** The source had four export buttons but
  only JSON was actually implemented (the others wrote the same JSON
  to a `.pdf.json` file). The chamber here ships JSON only — adding
  real PDF export needs a server route with a PDF library; SVG /DXF
  would need a tiler that lays out the pieces. Out of scope for the
  port.
- **Size scaling.** The source had a size selector (XS / S / M / L /
  XL / XXL) that didn't actually scale anything — it was wired but
  unused. Dropped from the port. When the fabric calculator lands, the
  size-grade hook goes there.
- **Per-piece SVG of the actual cut.** The pieces are shown as
  bounding-box rectangles with a grainline marker. Real curved pieces
  (princess seams, sleeves) need either a model that returns SVG path
  data or a parametric pattern engine (FreeSewing style — see the
  pattern-prototype chamber).
- **Confidence per-measurement.** Hard-coded to 0.85 in the
  transformer because Gemini's schema-constrained response doesn't
  expose per-field confidence. Same compromise the source made.

## Verification

- Compiled and served at
  `http://localhost:3001/atelier/clothing-reverse` (200).
- No new dependencies installed.
- Without `GOOGLE_AI_API_KEY_GEN` / `GOOGLE_AI_API_KEY` set and no
  BYO key, the route returns 503 `no_key` and the client offers the
  "open settings" button.
