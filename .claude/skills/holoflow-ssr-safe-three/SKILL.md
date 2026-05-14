---
name: holoflow-ssr-safe-three
description: >
  The SSR-safe pattern for Three.js + WebGPU + TSL inside the Holoflow Studio
  Next.js App Router site. Load when touching anything that imports
  `three/webgpu`, `three/tsl`, `@react-three/fiber`, `@react-three/drei`,
  `@react-three/xr`, or any client component that mounts a Canvas inside an
  /atelier, /spatial, /visualiser, /play, /sphere, or /watch route. Triggers
  on: "self is not defined", "ReferenceError: self", "WebGPURenderer",
  "three/webgpu", "three/tsl", "PPR", "prerender error", "SSR Three.js",
  "navigator is not defined", "build failed self", "vercel prerender Three".
---

# Holoflow Studio — SSR-safe Three.js / WebGPU / TSL

## The bug, in one paragraph

`three/webgpu` (and to a lesser extent `three/tsl`, `three/examples/jsm/*`,
`@react-three/xr`) touches browser globals — `self`, `navigator.gpu`, the
WebGPU API itself — **at module load**, not inside a function. The Holoflow
site has PPR enabled (`experimental.ppr`), so Next prerenders client
components server-side to produce a static HTML shell. The "use client"
directive only flips hydration to the client; the server still evaluates
the client component's import graph to render once. A static import of
`three/webgpu` (directly or via a sibling module) therefore crashes the
prerender with `ReferenceError: self is not defined`.

This is what took down 9 production deployments in a row in May 2026
before being fixed in commit `6d53c32` on `holoflow-commerce`.

## The fix, in one paragraph

Turn the static import into a **type-only import** for compile-time, and a
**dynamic import inside a useEffect** for runtime. The module then never
appears in the server bundle and only loads after hydration, when the
browser globals it touches actually exist.

## The pattern, copy-paste

`<your-feature>-client.tsx` — a `"use client"` component:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

// Type-only — erased at compile time, never touches the server bundle.
import type { Simulator } from "./simulator";

export default function YourFeatureClient() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simRef = useRef<Simulator | null>(null);
  const [supported, setSupported] = useState<"probing" | "yes" | "no">("probing");

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    if (!("gpu" in navigator)) {
      setSupported("no");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;
        // Dynamic import — `./simulator` pulls in `three/webgpu`, which
        // touches browser globals at module load. Keep it off the server
        // bundle so PPR prerender doesn't crash with
        // "ReferenceError: self is not defined".
        const { Simulator } = await import("./simulator");
        const sim = await Simulator.create(canvas);
        if (cancelled) {
          sim.dispose();
          return;
        }
        simRef.current = sim;
        setSupported("yes");
      } catch (err) {
        console.error("[your-feature] init failed", err);
        if (!cancelled) setSupported("no");
      }
    })();
    return () => {
      cancelled = true;
      simRef.current?.dispose();
      simRef.current = null;
    };
  }, []);

  // ...rest of the component
}
```

`./simulator.ts` — the WebGPU-touching module, **kept out of the SSR graph**:

```ts
// This file is the SSR landmine. Only load it from a dynamic import
// inside a useEffect (or another browser-only entry point).
import * as THREE from "three/webgpu";
import { Fn, smoothstep, vec4 } from "three/tsl";

export class Simulator {
  static async create(canvas: HTMLCanvasElement) { /* ... */ }
  dispose() { /* ... */ }
}
```

## When you need the pattern

Apply it whenever **any module on the import path** touches a browser
global at module top level. Common offenders:

| Module | Why it crashes SSR |
|--------|-------------------|
| `three/webgpu` | References `navigator.gpu`, `self`, WebGPU device classes |
| `three/tsl` (some entry points) | Builds shader graph that touches `self` |
| `three/examples/jsm/objects/MarchingCubes` | Mostly safe — but check on each version bump |
| `@react-three/xr` (older versions) | Touches `navigator.xr` at load |
| `onnxruntime-web` | WASM bootstrap reads `self` |
| `@huggingface/transformers` | Pulls onnxruntime-web at top level |

`@react-three/fiber` + `@react-three/drei` are **fine** to import statically
from client components — they don't touch WebGPU globals at module load.

## When the pattern is overkill

`/play/*`, `/visualiser/*`, `/spatial/*` (the WebGL2 variant) — these run
through R3F + drei + the standard `WebGLRenderer`, all of which are SSR-safe.
Don't dynamic-import them; you'll just slow down hydration for no reason.

The pattern is specifically for the **WebGPU / TSL / heavy-WASM** edge.

## Where the reference fix lives

`app/atelier/rig-simulator/rig-simulator-client.tsx` — commit `6d53c32`.
Type-only import of `Simulator`, dynamic-imported inside the existing
WebGPU-init useEffect. Compare to `simulator.ts` in the same directory,
which holds the `three/webgpu` + `three/tsl` imports.

## Verification

Local: `pnpm tsc --noEmit` should pass (type-only import keeps types live).
Build: `pnpm build` should complete; the page in question prerenders ◐ in
the Next output, not ƒ (so PPR is still producing the static shell).
Prod: `vercel inspect <url> --logs` after deploy should NOT contain
`ReferenceError: self is not defined` or `Error occurred prerendering page`.

## Anti-pattern: do NOT

- Add `export const dynamic = "force-dynamic"` to the page to "fix" SSR.
  That works but throws away PPR's static shell for the whole route.
- Wrap the page in `next/dynamic({ ssr: false })`. Same problem, plus the
  ssr:false option is only allowed in Client Components in Next 15+.
- Put `"use client"` on the WebGPU module file. The directive marks
  client *components*, not arbitrary modules; the import graph still gets
  evaluated server-side.
- Globally suppress: don't reach for `if (typeof window !== "undefined")`
  guards inside the WebGPU module. The fix belongs at the import boundary,
  not strewn through the heavy module.
