# `load.ts` — purpose twin (capability `vrm.load`)

## Role

The first VRM atom — turns a URL into a registered, ID-tracked,
cleanup-passed VRM handle in the `vrm` state slice. Every
downstream VRM capability (`pose`, `expression`, `look-at`) depends
on a handle this capability produced.

## Public surface

- `loadVRM(options)` — async, returns `{ id, vrm }`. Side-effect:
  registers the handle in `vrmStore`.
- `unloadVRM(id)` — async, disposes geometries / materials, removes
  the handle. Idempotent.
- `getVRM(id)` — typed lookup; returns `null` if unloaded.
- Types: `LoadVRMOptions`, `LoadVRMResult`.

## Internal

- Uses `GLTFLoader` from `three/examples/jsm/loaders/GLTFLoader.js`
  with `VRMLoaderPlugin` registered.
- Runs `VRMUtils.removeUnnecessaryVertices` + `combineSkeletons` on
  every load — the canonical cleanup pass per `@pixiv/three-vrm`
  docs. Skipping this leaves wasted geometry in the rig.

## Depends on

- `three/examples/jsm/loaders/GLTFLoader.js` — npm `three`.
- `@pixiv/three-vrm` — npm dependency, `VRMLoaderPlugin` + `VRMUtils`
  + the `VRM` type.
- `lib/state/vrm` — the slice this capability writes to.

## Does not

- **Does not mount into a scene.** This capability owns the *logical*
  load (handle in the slice). Scene-graph mounting is the component
  layer's job — `components/three/VRMAvatar.tsx` (future) subscribes
  to `vrmStore.handles` and mounts what it finds.
- **Does not drive animation.** Pose/expression/look-at are separate
  capabilities. This one returns a clean rig and stops.
- **Does not stream-load.** The loader is `loadAsync` — full file
  fetch before parse. Streaming + progressive load can be added
  later as `vrm.load.stream` if needed.
- **Does not cache.** Re-calling `loadVRM` on the same URL parses
  again. Caching is a wrapper concern; can layer on top.
- **Does not authenticate.** Signed URLs / private VRMs are the
  fetch layer's problem; this capability assumes the URL resolves.

## Bordering files

- `lib/state/vrm.ts` — the slice we write to. Composition partner.
- `lib/capabilities/vrm/pose.ts` (future) — drives bones on a handle
  from this loader.
- `lib/capabilities/vrm/expression.ts` (future) — drives blendshapes
  on a handle from this loader.
- `lib/capabilities/vrm/look-at.ts` (future) — drives lookAt target
  on a handle from this loader.
- `lib/capabilities/index.ts` — registers `vrm.load` and points at
  this file via `load: () => import("./vrm/load")`.
- `components/three/VRMAvatar.tsx` (future) — the renderer that
  subscribes to the slice and mounts handles into the scene.

## Plug surface

- **State plug:** `vrm` slice (`addHandle`, `removeHandle`).
- **Type plugs:** input `LoadVRMOptions` (URL + optional ID),
  output `LoadVRMResult` (ID + VRM). The VRM type from
  `@pixiv/three-vrm` is the canonical handshake every downstream
  VRM capability expects.
- **Dependency plug:** none — `vrm.load` is the entry-point of the
  VRM brick family. Other VRM bricks `dependsOn: ["vrm.load"]` it.
