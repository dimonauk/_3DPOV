# `google-ai-key.ts` — purpose twin

## Role

The visitor's bring-your-own Google AI Studio API key, persisted to
`localStorage` so each AI generation chamber (Imagen, image-edit,
future chambers) can choose to call Google on the visitor's quota
instead of the studio's.

## Why a slice and not a single useState?

Because the key + mode toggle has to be readable from every chamber
that talks to Google: today Imagen and image-edit, tomorrow whatever
comes next. Keeping it in zustand means a chamber doesn't have to
re-prompt the visitor for their key each time they open a different
generation room.

## Public surface

- `useGoogleAiKeyStore` — React hook for components.
- `googleAiKeyStore` — headless alias for non-React code.
- `defaultGoogleAiKeyState` — initial-state export for tests.
- `activeVisitorKey(state)` — small helper: returns the visitor's
  key when mode is "byo" and the key is non-empty; otherwise null.
  Chambers pass the result into an `X-Visitor-Google-Key` header
  when non-null.
- Types: `GoogleAiKeyMode`, `GoogleAiKeyState`, `GoogleAiKeyActions`.

## Internal

- `initial: GoogleAiKeyState` — empty key, mode "studio".
- `persist` config:
  - `name: "holoflow-google-ai-key-v1"` — localStorage key, versioned.
  - `storage` — SSR-safe wrapper matching the convention from
    `lib/state/shell.ts`.
  - `partialize` — persists both `key` and `mode`. The whole point of
    the slice is to remember the key, and the mode toggle should
    survive a reload.

## Honesty contract

- **The key stays in the visitor's browser.** When a chamber call is
  in flight, the client sends the key in the request header
  `X-Visitor-Google-Key`. The Next.js route forwards it to Google and
  forgets — it never logs the value, never persists it, never mirrors
  it anywhere on the studio's infrastructure. See
  `app/api/ai/google/generate-image/route.ts` and
  `app/api/ai/google/edit-image/route.ts` for the receiving side.
- **The studio cap exists to stop abuse, not to upsell.** The
  studio-quota mode is rate-limited in-process (per IP, per hour);
  the BYO mode is not. There is no payment surface in the BYO path.

## Plug surface

- **State plugs (write):** `localStorage["holoflow-google-ai-key-v1"]`.
- **Type plugs:** input `GoogleAiKeyMode`; no return.
- **Dependency plugs:** none.

## Bordering files

- `components/atelier/google-ai-settings.tsx` — the modal that lets
  the visitor enter / clear the key + flip the mode.
- `app/atelier/imagen/imagen-client.tsx` — first consumer; reads the
  slice to decide whether to send the visitor's key header.
- `app/atelier/image-edit/image-edit-client.tsx` — second consumer,
  same pattern.

## Does not

- **Does not validate the key shape.** We rely on Google's API to
  reject malformed keys. A regex would lull the visitor into a false
  sense of "yep that worked" — the actual signal is whether the
  generation call succeeds.
- **Does not roundtrip the key through the studio's server.** Even
  during normal operation. The header from the browser is the only
  place the key exists outside the visitor's localStorage.
- **Does not cap how often the visitor calls Google.** It's their
  quota; their problem to manage.
