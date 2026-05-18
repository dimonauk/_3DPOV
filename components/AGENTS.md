# components/ — signpost

React components reused across multiple pages. Per-route components
live next to their page (in `app/<route>/`), not here.

## Layout

```
components/
  ar/                       AR card primitives — MindARScene, VRMViewer,
                            SplatViewer, ModelViewerNative, ShareCardButtons
  articles/ journal/        MDX-style article components (entries/*.tsx)
    tutorials/
  atelier/                  Cross-chamber shared UI (flag-display,
                            chamber-header, google-ai-settings, etc.)
  aura/                     Aura-companion UI — chat panel, voice hooks
  aura-tron/                Aura-tron chamber backgrounds + landscape
  auth/                     auth-provider (Firebase + admin gate)
  cards/                    Card chrome (CardScanner, ShareCard, etc.)
  cart/                     Shopify cart UI primitives
  chrono-protocol/          Game-loop runner + mode-pie
  holo-walk/                Map client + location banter + splat-ar-layer
  holofoil-dice.tsx         Standalone novelty surface (Aura's debug toy)
  hooks/                    Cross-route React hooks (useHeadPose etc.)
  layout/                   header + footer + nav (each route's layout
                            composes these)
  pipelines/                Lipsync + mood-face demo UIs
  product/                  Shopify product card + grid (commerce)
  prose.tsx                 Long-form text styles (used by articles)
  stage/                    Studio stage UI (StageProps, StageXRBar)
  studio/                   Web 360 editor — DropZone, EquirectViewer,
                            KeyframeStrip
  three/                    Three.js / R3F primitives — VRMAvatar etc.
  visualiser/               Per-visualiser scene + controls (TIR,
                            marching cubes, reaction-diffusion, etc.)
  writing/                  Article + journal + tutorial registries
```

## Conventions

1. **`"use client"` on every interactive component.** No SSR-on-by-
   default tricks; if it touches DOM/window/document, it's a client
   component.

2. **300-line cap.** Same rule as routes — split when over.

3. **Hooks live in `components/hooks/` or `components/<area>/use-*.ts`.**
   Cross-route hooks (`useHeadPose`) go in `components/hooks/`. Route-
   specific hooks live next to their consumer.

4. **No business logic.** A component renders + accepts callbacks +
   wires events; the actual mutation lives in a `lib/` module that
   the component imports. Components should be easy to swap.

5. **`useAuth` for Firebase user.** Don't read `getAuth()` directly
   in components; use the provider.

6. **Memory-leak hygiene.** Three.js geometry/material/texture +
   `MediaStream` + `AudioContext` all need explicit `dispose()` on
   unmount. See the `dollyos-memory-leaks` skill for examples — same
   rules apply here.

## When to add a component

If it's used on more than one page, lift it here. If it's only used
by one page, leave it under `app/<route>/`. The threshold for moving
is usage, not size.
