# app/atelier/waveguide-forge/

TPMS / gyroid waveguide designer chamber. Ported from the bench prototype
at `D:/The_Hangar/apps/waveguide-forge/` (Vite + React + R3F).

## What it is

A triply-periodic minimal surface like the gyroid tiles space without
self-intersecting. Print one in clear resin and every facet refracts —
the object throws a caustic the way a real optical waveguide would.
This chamber lets a visitor tune the lattice and watch the projected
caustic shift in real time, before committing to a print.

## What it produces

- Live render only (no exported artefact yet). The geometry path —
  parametric gyroid → SDF → mesh → STL — runs bench-side in the
  `tools/mesh-to-sdf/` Python toolchain; the chamber consumes the
  resulting `.sdf.bin` to preview caustics.

## Two backends

- **GLSL (default)** — R3F `<Canvas>` + a single `<ShaderMaterial>`
  that pixel-back-marches the SDF. Runs on any WebGL2 browser. The
  default parametric gyroid is the placeholder when no SDF is loaded.
- **WebGPU TSL** — bare `WebGPURenderer` (not R3F-wrapped because R3F's
  WebGPU surface is experimental). Forward-traces photons through the
  SDF and atomic-splats them onto a photon-map storage buffer. Needs
  a WebGPU adapter and a loaded mesh-derived SDF.

## Operator prerequisites

- To use a real geometry instead of the parametric placeholder, run
  the bench tool: `python tools/mesh-to-sdf/build_sdf.py --input X.glb --output X.sdf.bin`
  and drop the `.sdf.bin` into the chamber's SDF picker.
- WebGPU mode is gated behind both `navigator.gpu` AND a loaded SDF.
  If either is missing the checkbox stays disabled.

## Known holes

- The site ships `three@^0.171.0`; the bench app was authored against
  `^0.183.2`. TSL method names shift between minors (atomicAdd
  spellings, `.toAtomic()` vs `.atomic()`, `MeshBasicNodeMaterial`
  location). If the WebGPU mode throws on init, the GLSL fallback
  stays usable and the error surfaces in `atelier:waveguide-forge`
  logs.
- No exported STL / GLB yet. That's the next chamber milestone:
  marching-cubes the lattice and route it through `pushAtelierOutput`
  the way lithophane and isosurface do.
