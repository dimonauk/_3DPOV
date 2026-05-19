# AmbientField

A pointer-events-none particle backdrop. Sits behind page chrome,
runs on WebGPU + TSL where the browser supports it, falls back to
plain WebGL2 where it doesn't, and falls back again to a static
gradient if the user prefers reduced motion.

## When to use it

- A hero plate that's already on a dark warm-black ground and wants
  a bit of life behind the type.
- A magazine root page where you want the surface to breathe without
  competing with the imagery.
- A surface where a static gradient would feel a bit flat but a
  Three.js scene would feel like too much.

## When NOT to use it

- Pages that are already running another WebGPU / WebGL scene (the
  AR pages, the splat viewers, the 3D editors). One GPU context per
  surface is the budget.
- The atelier chambers. Each chamber is its own generative piece —
  another particle layer would muddy the read.
- Anything print-bureau or checkout. Quiet content, no decoration.
- Mobile-first pages where the bundle weight matters more than the
  decoration. The component is dynamic-imported, but the worker +
  fallback renderer still cost a few tens of KB.

## Usage

```tsx
import { AmbientField } from "components/ambient/AmbientField";

<AmbientField
  density="low"        // "low" | "medium" | "high"  (5k / 8k / 15k particles)
  palette="pink"       // "pink" | "mint" | "lavender" | "chrome"
  intensity={0.4}      // 0..1, controls per-particle alpha
  interactive={true}   // mouse attractor on/off
/>
```

It positions itself: `position: fixed; inset: 0; pointer-events:
none; z-index: -1`. Drop it anywhere inside the page tree and it'll
sit behind everything else on that viewport.

## Performance budget

- **Particles**: 5k (low) / 8k (medium) / 15k (high). Above 15k the
  per-frame CPU step starts costing more than the GPU draw, and the
  field reads as fuzz rather than ambience anyway.
- **GPU buffers**: ~240 KB at high density. Well under the 16 MB
  target — most of the budget is left for the page's other scenes.
- **Frame rate**: 60 fps by default. Drops to 30 fps when
  `navigator.connection.effectiveType` reports 3g or worse. The
  WebGL fallback also runs the same cap.
- **CPU**: ~1.5-3 ms per frame at 15k particles on a 2024 laptop.
  Brownian step + integrator + wrap, no branches.
- **Bundle**: zero on pages that don't render it. The three/webgpu
  module weighs in north of 1 MB gzipped — keep it dynamic.

## Hard rules

1. The Three.js + TSL bundle is only loaded inside the component's
   `useEffect`. Never re-export the renderer modules from any
   always-loaded barrel.
2. `prefers-reduced-motion: reduce` → static gradient, no canvas.
3. `document.hidden` → loop paused. Resumes on visibility change.
4. Canvas off-screen (IntersectionObserver) → loop paused.
5. `pointer-events: none` on the wrapper. The field never blocks a
   click, ever.

## Files

- `components/ambient/AmbientField.tsx` — the React component
- `lib/ambient/config.ts` — palette tokens + density presets +
  shared `AmbientRenderer` interface
- `lib/ambient/renderer-webgpu.ts` — WebGPU + TSL implementation
- `lib/ambient/renderer-webgl.ts` — WebGL2 fallback (plain GL,
  no Three.js dep)
- `lib/workers/particle-init.worker.ts` — initial-state worker
- `lib/workers/particle-init.ts` — host-side wrapper for the worker
