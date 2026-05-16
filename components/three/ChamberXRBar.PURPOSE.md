# `components/three/ChamberXRBar.tsx` — purpose twin

## What this is

A reusable HTML chrome strip that sits over an R3F `<Canvas>` and
gives the visitor "Enter VR" / "Enter AR" / "Exit XR" buttons,
backed by a `@react-three/xr` `XRStore`. The component is HTML, not
R3F — the caller positions it (typically `absolute right-3 top-3 z-20`)
over the canvas frame.

It is the generalised version of `components/stage/StageXRBar.tsx`.
The Stage room kept its own copy first because the Stage scene is
itself a generalised composer; the chambers were rolling their own
copies of the same code. This file is the one copy.

## What this is not

- **Not the XR session itself.** The caller still has to call
  `createXRStore()` once (memoised) and wrap the scene contents in
  `<XR store={xrStore}>` inside the Canvas. The bar only fires
  `store.enterVR()` / `store.enterAR()` / `store.getState().session?.end()`.
- **Not opinionated about layout.** The bar is a flex row of two
  buttons (or one Exit button when a session is active, or a single
  pill when WebXR is unavailable). The caller decides where to
  put it.
- **Not a post-processing gate.** That's `XRPostGate`, also
  exported from this file. It mounts inside the Canvas + inside
  `<XR>`, reads the session state, and returns `null` when an XR
  session is active so heavy `<EffectComposer>` chains don't run on
  90Hz headset framerates.

## Props

```ts
type ChamberXRBarProps = {
  store: XRStore;            // required — created with createXRStore()
  vrSupported?: boolean;     // override the internal probe
  arSupported?: boolean;     // override the internal probe
};
```

When both overrides are passed, the internal `navigator.xr.isSessionSupported`
probe is skipped — useful when the caller has already detected
support elsewhere. Otherwise the bar probes itself after mount.

## Labels (locked)

- **Enter VR** — sentence case, plain English.
- **Enter AR** — sentence case, plain English.
- **Exit XR** — sentence case, replaces both Enter buttons while a
  session is live.
- **XR · unavailable** — pill shown when neither mode is supported,
  tooltip reads
  *"WebXR not detected. Try Chrome on Android, Quest browser, or Edge with a headset."*

## Where it's wired in

- `app/stage/page.tsx` — via `components/stage/Stage.tsx` (the
  Stage still uses its own `StageXRBar` for now; both implementations
  are identical, the Stage copy stays as the canonical reference).
- `app/atelier/silk-brush/` — `silk-brush-client.tsx` replaced its
  inline `SilkBrushXRBar` with the shared component.
- `app/atelier/breeding-floor/` — `breeding-floor-client.tsx` gained
  a small R3F `<Floor3D>` Canvas above the genome card grid; the
  shared bar sits over it.
- `app/atelier/sculpture-gallery/` — `sculpture-gallery-client.tsx`
  wraps its marching-cubes preview Canvas in `<XR>` so the operator
  can inspect the mesh in a headset.
- `app/atelier/waveguide-forge/` — `waveguide-forge-client.tsx`
  wraps the GLSL caustic Canvas. The WebGPU photon-mapper backend
  is bare-renderer and can't enter WebXR via `@react-three/xr`, so
  the XR bar only appears in the default GLSL mode.

## Depends on

- `@react-three/xr` (already a dep) — `XRStore` type, `useXR` hook
  for `XRPostGate`.
- `lib/log` — namespaced logger `three:chamber-xr-bar`.

## Cross-references

- `components/stage/StageXRBar.tsx` — the original, kept verbatim
  because the Stage room is the reference XR-enabled scene.
- `components/stage/Stage.tsx` — the `PostGate` helper there is the
  pattern `XRPostGate` here generalises.
