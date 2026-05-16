# Co-Drawing — Atelier Chamber

Drawing alongside Gemini. Sketch on a canvas, type a one-line ask, Gemini redraws over the strokes in the same minimal-line style. The result replaces the canvas so the operator can sketch on top of it and run another pass.

## What it is

- 960 x 540 HTML5 canvas, white background, mouse + touch input.
- Brush is 5 px round; pen colour picker on the tool bar.
- Tool bar buttons: pen colour, **Clear**, **Save PNG**.
- Prompt bar at the bottom: one-line text input + **Suggest** button.
- The Suggest button composites the canvas to a base64 PNG, POSTs to `/api/co-drawing/suggest` with `{ prompt, drawingData }`, awaits the response, and blits the returned PNG back onto the canvas.
- Each generated image is also dropped into the atelier recent-outputs drawer.

## Files

- `page.tsx` — server component, exports metadata, renders the chrome + the client child.
- `co-drawing-client.tsx` — canvas + drawing state + fetch call.
- `app/api/co-drawing/suggest/route.ts` — server-side Gemini wrap (sibling, not in this folder).

## Ported from

`D:/The_Hangar/apps/gemini-co-drawing/Home.tsx` (Vite bench prototype by @trudypainter and @alexanderchen, from Google's AI Studio examples).

### Changes vs the bench

- `console.log` / `console.error` → `createLogger("atelier:co-drawing")` on the client, `createLogger("api:co-drawing-suggest")` on the route.
- Direct browser-side `new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })` → server route `/api/co-drawing/suggest`. The bench inlined the API key into the bundle; on a public Vercel deploy that leaks the key, so the call moves server-side and the key never leaves the runtime.
- `lucide-react` icons dropped — chamber uses plain text labels in the holoflow style.
- Tailwind classes rewritten against the holoflow palette (`warm-black-*`, `chrome-*`, `pink-200`); the notebook-paper background and `font-mega` heading dropped in favour of the standard chamber template.
- Model selector dropdown removed; the route is pinned to `gemini-2.5-flash-image` (override via env `GOOGLE_IMAGE_EDIT_MODEL`).
- BYO-key modal + `customApiKey` input dropped. The Atelier site has a shared visitor-key system (`components/atelier/google-ai-settings.tsx`) but it isn't wired here yet — the route uses the studio key only. Wiring it up follows the imagen / image-edit pattern if needed.
- Touch-event handling kept verbatim from the bench; `useId()` added for the prompt field for a11y.

## Env

The task spec named `GOOGLE_GENAI_API_KEY`, but the site already standardises on the `lib/env.ts` resolver `googleGenApiKey()` which reads:

1. `GOOGLE_AI_API_KEY_GEN` — preferred, separate AI-gen GCP project.
2. `GOOGLE_AI_API_KEY` — fallback, same key Aura's chat uses.

The route uses that resolver, so anywhere those vars are set the chamber works without extra config. If neither is set the route returns 503 `code: "no_key"`.

## Voice

Holoflow: terse, mechanical, lowercase body; sentence-case headings. Chamber label `Atelier · Co-Drawing`. No exclamation marks.
