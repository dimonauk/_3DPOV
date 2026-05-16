# app/atelier/pattern-prototype

AI surface-pattern designer. Ported from
`D:/The_Hangar/apps/prototypes/threadlogic-ai-pattern-prototyper/`
(a Vite + Gemini prototype, "ThreadLogic v2.0").

## What it does

Pick a 1950s garment block (skirt cut, jacket, embellishments), ask
the engine for an "Inverse Graph", and the engine drafts a
FreeSewing-style `draftPattern(measurements, options)` JavaScript
function. The page executes the function in a sandboxed `new
Function(...)` and renders the returned SVG path string in the
blueprint mode.

Four modes:

- `editorial` — Le Grand Salon. Soft-pink editorial mannequin.
- `playroom` — Petit Playroom. Paper-doll vibe with cut lines.
- `blueprint` — Logic Terminal. Slate-dark, the actual pattern view.
- `archive` — Historical Archive. Sepia mannequin, plate label.

A floating chat consultant (Atelier AI) is wired to the same engine
for design advice.

## Wiring

- Server `page.tsx` — metadata + heading + Footer + mounts the
  client.
- Client `pattern-prototype-client.tsx` — everything else, single
  file. Inlines what the original split into Sidebar / StudioView /
  GarmentLayer / PatternEditor / ChatBot — that decomposition only
  paid for itself in a standalone app.

## Dependencies on the host site

- `@google/genai` — already in `package.json` deps. Engine is
  `gemini-2.5-flash`.
- `lib/log` → `createLogger("atelier:pattern-prototype")`.
- `lib/state/atelier-hooks` → `useActiveChamber` +
  `pushAtelierOutput` (drops the generated SVG into the
  recent-outputs drawer as `image/svg+xml`).
- `lib/state/google-ai-key` → reads the visitor's BYO AI Studio
  key. Chamber refuses to draft if no key is set.
- `components/atelier/google-ai-settings` — settings dialog already
  used by the imagen chamber.
- `components/layout/footer`.

## What it does NOT do

- No studio fallback key. The chamber is BYO-only — calling `gemini-
  2.5-flash` direct from the browser using the visitor's key. The
  imagen chamber pairs studio fallback with a server-side route
  (`app/api/ai/google/generate-image/route.ts`). No equivalent
  text-gen route exists on the site, and the constraint was "don't
  install new deps" so we don't introduce one. If the studio wants a
  capped studio-quota fallback later, add a
  `/api/ai/google/generate-text` route mirroring the imagen one and
  switch the client to POST there when the visitor has no key.
- `lucide-react` is NOT installed on the site. Icons are inline SVG
  paths.

## Missing / open questions

- **Print bureau hook.** The chamber claims to "pair with the print
  bureau" — actual wiring (pick an SVG → seed a wall-art product
  draft) isn't here. The generated SVG IS pushed to the atelier
  recent-outputs drawer, so a print-bureau chamber consuming SVGs
  from the drawer would close the loop.
- **Fabric calculator hook.** Same shape — the measurements set is
  user-visible, but there's no "send to calculator" button yet.
- **Pattern repeat tiling.** The original generates a single garment
  draft, not a tileable surface pattern. To meet the "surface
  pattern / wall art" framing fully, a second pass that takes the
  SVG path and produces a tileable repeat unit (with offset
  controls) would be needed.
- **AI Studio key.** Visitor must paste their own AI Studio key in
  Settings. The chamber's "Engine" badge surfaces the current state.
- **`@google/genai` model name.** The original prototype referenced
  the non-existent `gemini-3-pro-preview` / `gemini-3-flash-preview`
  SKUs (private preview labels). Swapped to public `gemini-2.5-
  flash` for both the pattern draft and the chat consultant.

## Verification

- Compiled and served at `http://localhost:3001/atelier/pattern-
  prototype` (200).
- No new dependencies installed.
