# app/atelier/dollhouse

Doll-character prompt composer over Imagen. Ported from
`D:/The_Hangar/apps/prototypes/dollhouse-1/` (a Vite + Gemini
synthwave-CRT cockpit prototype called "Dolly_OS // ArrayMaster").

## What this is

A structured prompt builder for a small fictional universe. The
visitor picks six fields out of a built-in bible — character, outfit,
action, room, aesthetic mode, shot framing — plus an aspect ratio.
The chamber composes a single cinematic miniature-photography prompt
(mode-base + subject descriptor + room-lighting + a fixed ARRI
style block) and POSTs it to the existing
`/api/ai/google/generate-image` route. The image returns; the
chamber drops it into the atelier recent-outputs drawer.

The fiction is "The Peterson Enclosure" — a 1:6-scale dollhouse
photographed as if it were a real-world set. Three characters
(Dolly the iron-butterfly housewife, Mayor Theo the teddy bear,
K-17 the porcelain robot kitten), each with their own wardrobe;
five canonical actions; four rooms across three floors; three
aesthetic modes (toycore / real-world / noir).

## Why a chamber and not the whole cockpit

The bench prototype is a sprawling synthwave shell — left/right/
bottom panels, a Gemini terminal with persona-switching, a chronicles
reader, an inventory grid, an assembly guide, a physics visualiser,
a theme mixer. None of that fits the chamber pattern (one room, one
input, one output). The spine of the bench app — the production tab
that actually generates frames — is what's portable, and that is
what this chamber is.

The cockpit shell, the terminal, the bible reader and the physics
visualiser stayed in the bench prototype.

## Files

- `page.tsx` — server-only. Exports metadata, renders the chrome,
  mounts the client child.
- `dollhouse-client.tsx` — everything else. Inlines the bible
  (~90 lines of data: characters, actions, rooms, modes, shots,
  the fixed cinematic style block); inlines the prompt composer;
  posts to `/api/ai/google/generate-image`; pushes the resulting
  PNG into `pushAtelierOutput`. Single file by design — the bench
  spread these across `data/dollData.ts`, `services/geminiService.ts`,
  `components/ProductionInterface.tsx`, but that decomposition only
  paid for itself in a multi-tab cockpit.

## Wiring

- `lib/log` → `createLogger("atelier:dollhouse")`. No `console.*` calls.
- `lib/state/atelier-hooks` → `useActiveChamber` +
  `pushAtelierOutput` (drops the generated PNG into the
  recent-outputs drawer as `image/*`).
- `lib/state/google-ai-key` → reads the visitor's BYO AI Studio
  key, falls back to studio quota (same shape as the imagen chamber).
- `components/atelier/google-ai-settings` — settings dialog already
  used by the imagen chamber.
- `components/layout/footer`.

## Dependencies

No new packages. Everything already in `package.json`:

- `@google/genai` (already there; reached via the existing
  `/api/ai/google/generate-image` route — the chamber doesn't
  import the SDK directly).
- React 19 / Next 15 / Tailwind 4.
- No `lucide-react` (not installed on the site). The bench used
  Lucide; this port uses none — the form is plain `<select>` and
  needs no icons.

## What the bench had that this does NOT

- **Video format.** The bench had image / video / text toggles and
  called Veo. Out of scope here — the existing `/atelier/veo` chamber
  covers that and the dollhouse spine is a stills composer.
- **Reference image.** The bench's "Texture Fidelity" mode could
  take a reference image and call `gemini-2.5-flash-image`. Out of
  scope — that's what `/atelier/image-edit` is for.
- **Persona terminal.** The bench's Gemini terminal had a "Matriarch"
  persona that ran googleSearch + googleMaps on the visitor's
  location to triangulate fascist activity. Politically charged,
  surveillance-shaped, and orthogonal to the chamber's job. Dropped.
- **Chronicles / inventory / scripts / assembly guide.** All bible-
  reader UI. Belongs in a content page (e.g. a `/journal` entry),
  not a chamber.
- **Firebase auth + theme mixer.** Cockpit-only.

## Voice

Holoflow: terse, lowercase BODY, sentence-case headings. Chamber
label `atelier · dollhouse`. The bench's "MATRIARCH PROTOCOL
INITIALIZED" framing stayed in the bench.

## Verification

- Files compiled by `next dev --turbopack` already running on port
  3001 (host process detected listening before the port was added).
- Route: `http://localhost:3001/atelier/dollhouse`.
- Did NOT add the chamber to the directory at `app/atelier/page.tsx`
  per the "DO NOT touch app/atelier/page.tsx" constraint. A follow-
  up commit should list it under chambers there.
