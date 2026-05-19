# Authoring your first level

You have forked the WebXR Game Starter and renamed it. Now you want
to put your own level inside it. This is the two-page tour.

## 1. Replace the floor mesh

Open `scene.tsx`. Find the `FacetedFloor` component near the bottom
of the file. The default is a 4&times;4 m plane with flat shading;
swap the geometry for whatever your level needs.

A useful pattern for a tiled industrial floor:

```tsx
function FacetedFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[8, 8, 24, 24]} />
      <meshStandardMaterial
        color="#1f1a2a"
        flatShading
        metalness={0.15}
        roughness={0.8}
      />
    </mesh>
  );
}
```

Bigger plane, more segments so flat-shading lighting reads across the
surface, a touch of metalness so direct lights catch on the facets.

If you want a heightfield, swap `planeGeometry` for a custom
`BufferGeometry`. The starter does not ship a terrain helper &mdash;
that lives downstream as a level-authoring primitive.

## 2. Add a new pickup target

Pickups live in the `PICKUPS` array at the top of `scene.tsx`:

```ts
const PICKUPS: Pickup[] = [
  { id: "alpha", position: [-1.4, 0.6, -0.8] },
  { id: "beta", position: [1.3, 0.6, 0.9] },
  { id: "gamma", position: [0.2, 0.6, 1.6] },
];
```

Add a fourth. Give it a unique `id` (the proximity check de-dupes by
id, so a clashing string would mean you can collect the same pickup
twice):

```ts
{ id: "delta", position: [0.0, 1.4, -1.8] },
```

Then bump the `total` in `state.ts`:

```ts
export const INITIAL_GAME_STATE: GameState = {
  pickups: { collected: 0, total: 4 },
  startedAt: null,
  finishedAt: null,
};
```

The HUD reads the total from the store, so the on-screen counter
updates automatically.

## 3. Wire a new game-state field

Say you want a "best time" that persists across runs in
localStorage. Add the field to `GameState` and the initial state:

```ts
export type GameState = {
  pickups: { collected: number; total: number };
  startedAt: number | null;
  finishedAt: number | null;
  bestTimeMs: number | null;
};
```

Add a setter to `state.ts` that reads the previous best from
localStorage at module load and writes back when a run finishes:

```ts
const BEST_KEY = "holoflow.game-starter.bestTime";

function loadBest(): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(BEST_KEY);
  return raw ? Number.parseInt(raw, 10) : null;
}

export function recordRunComplete(elapsedMs: number): void {
  gameStore.set((prev) => {
    const best =
      prev.bestTimeMs === null || elapsedMs < prev.bestTimeMs
        ? elapsedMs
        : prev.bestTimeMs;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(BEST_KEY, String(best));
    }
    return { ...prev, bestTimeMs: best };
  });
}
```

Call `recordRunComplete(elapsedMs)` from `client-shell.tsx`'s
`onPickup` handler when `done` is true. Render the best time
underneath the live timer.

## 4. Add a sound effect via the audio bus

The framework primitive lives at `lib/game/audio-bus.ts` (landing in
the parallel framework-doc agent's commit; until then the audio bus
is documented in `docs/WEBXR-GAME-FRAMEWORK.md`).

Once the bus is in the tree, the wiring is one line in `scene.tsx`'s
pickup-collected branch:

```ts
import { audioBus } from "lib/game/audio-bus";

// inside the `for (const p of PICKUPS)` collection block:
audioBus.play("pickup", { volume: 0.7 });
```

Load `pickup.mp3` into the bus at scene mount:

```ts
useEffect(() => {
  audioBus.load("pickup", "/audio/pickup.mp3");
}, []);
```

The bus routes through a single `AudioContext` so multiple overlapping
plays do not stack-allocate decoders. In a WebXR session, audio routes
through the headset speakers without extra wiring &mdash; the bus
respects the session's audio destination.

## 5. Deploy to Vercel

The fork lives inside the main monorepo today, so there is no
separate deploy &mdash; pushing the branch deploys the whole site.
Your route lands at `<your-deployment>.vercel.app/<your-slug>`.

When the starter is cut as a standalone `pnpm create` scaffolder,
each fork will be its own Vercel project. Until then:

1. `git push` to your feature branch.
2. Vercel preview lands in a minute or two; check the build log for
   any `Module not found` errors against `lib/game/*` if the
   framework-primitive commit has not landed on `main` yet.
3. Open the preview URL, navigate to your route, hit Enter VR on a
   headset to test the session path.

That is the loop. Replace the floor, add pickups, wire state, add
sound, deploy. Once you have done it once you can do it in a
weekend.
