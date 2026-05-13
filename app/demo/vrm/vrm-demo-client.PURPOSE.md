# `vrm-demo-client.tsx` — purpose twin

## Role

The client-side bridge for the `/demo/vrm` route. Mounts the R3F
`<Canvas>`, drops a `VRMAvatar` into it, and applies Aura's named
default pose the moment the avatar handle appears in the slice.

This is the *only* file in the demo that needs `"use client"` —
the page shell stays a Server Component for clean metadata + SEO.

## Public surface

- Default export `VRMDemoClient({ url })`.

## Internal

- `handleId` state — local mirror of the first VRM handle the slice
  contains. Updated via `vrmStore.subscribe`.
- The subscribe callback applies `setNamedPose(id, "auraDefault")`
  exactly once per handle, the moment it appears.

## Depends on

- `@react-three/fiber` — `<Canvas>`.
- `@react-three/drei` — `<OrbitControls>` for the demo viewer.
- `components/three/VRMAvatar` — the renderer.
- `lib/capabilities/vrm/pose` — `setNamedPose`.
- `lib/state/vrm` — `vrmStore` for subscription.

## Does not

- **Does not own VRM lifecycle.** That's `VRMAvatar`'s job. This
  file only orchestrates pose application after load.
- **Does not handle camera animation.** OrbitControls is the user's
  manipulation surface; no programmatic camera moves.
- **Does not show error UI yet.** Errors are logged. A
  user-visible error state will land when the demo gets a
  fallback / placeholder.

## Bordering files

- `app/demo/vrm/page.tsx` — the server-component shell that
  embeds this client.
- `components/three/VRMAvatar.tsx` — the avatar this Canvas
  contains.
- `lib/capabilities/vrm/pose.ts` — the named-pose source.
- `lib/state/vrm.ts` — the slice this client subscribes to.
