# lib/state/atelier.ts — PURPOSE

## What this slice owns

Cross-chamber state for `/atelier/*` tools. Three pieces:

1. **`lastParamsByChamber`** — a map from chamber slug to the params
   object that chamber was last using. **Persisted to localStorage**
   via Zustand's `persist` middleware so visitor settings survive
   reloads + return visits.

2. **`recentOutputs`** — a session-only ring of the last 12 outputs
   any chamber produced. Each entry carries an object URL pointing at
   the artefact (image, STL bytes, JSON probe response), a label, and
   a `chamberSlug` back-pointer. The `<RecentOutputsDrawer>` reads
   this slice to render a "stuff you made today" surface that
   survives across-chamber navigation.

3. **`activeChamberId`** — which chamber the visitor is currently in.
   Set on mount, cleared on unmount. Surfaces want this for "Aura
   knows what you're looking at" and for nav highlights.

## What this slice deliberately does NOT own

Per-chamber UI state — current source image being dragged in,
in-flight fetch promise, error banner, the actual `<canvas>` ref.
That's local to each chamber's component and dies with it. Lifting
those into Zustand would add boilerplate without enabling anything;
visitors expect a fresh chamber on revisit, not their old upload
still loaded.

The discipline: if a piece of state is only read by the component
that wrote it, it stays on `useState`. If it crosses the chamber
boundary — read by another chamber, by Aura, by the nav, by the
drawer, by a layout — it belongs here.

## Param-shape opacity

Each chamber stores its own params object under its slug. This
slice doesn't enforce a schema; chambers read with `getParams(slug)`
and narrow client-side. Avoids a discriminated union of every
chamber's params living in this file (which would couple the slice
to every chamber's evolution).

A chamber's narrowing pattern:

```ts
type LithophaneParams = { scale: number; layerHeight: number; ... };
const saved = useAtelierStore.getState().getParams("lithophane");
const parsed = saved && typeof saved === "object"
  ? (saved as Partial<LithophaneParams>)
  : null;
// Fall back to chamber defaults on any field that's missing or NaN.
```

## What gets persisted

Only `lastParamsByChamber`. The `partialize` config in `atelier.ts`
strips `recentOutputs` and `activeChamberId` from the localStorage
snapshot. Reason:

- Recent outputs hold object URLs created by `URL.createObjectURL()`.
  Those URLs die when the page reloads; persisting them would write
  dangling pointers.
- Active chamber is session-scoped by definition.

If a chamber wants its params NOT remembered (e.g. one-shot tools
like `/atelier/probe` where the source image varies every time),
just don't call `setParams`. Reading is opt-in too — `getParams`
returns `null` for unrecognised slugs.

## Schema migrations

`name: "holoflow-atelier-v1"`. When a chamber's param shape changes
in a way that would break readers of the v1 snapshot, bump to v2:
either rename the storage key (forces a clean slate) or wire
Zustand's `migrate` option to upgrade in place. Don't reuse v1's
key with a new shape — old visitors will get garbage initial state.

## Wins this enables

- "Remember my settings" across reloads, in every chamber that opts in.
- A `<RecentOutputsDrawer>` floating on every chamber that shows the
  last N things any chamber produced, with thumbnails + re-download.
- Chamber-to-chamber piping: e.g. `/atelier/remove-bg` push to
  recent → operator opens `/atelier/pixelify` and the drawer offers a
  "use this as source" affordance.
- Aura ("I see you've got an image loaded — want me to suggest a palette?")
  can read `activeChamberId` and the active chamber's last params via a
  selector without owning the chamber itself.

## Migrations from `useState`

Each chamber's mount effect:

```ts
useEffect(() => {
  useAtelierStore.getState().setActiveChamber("lithophane");
  return () => useAtelierStore.getState().setActiveChamber(null);
}, []);
```

Each chamber's param-change handler additionally calls `setParams`.
Each chamber's success path additionally calls `pushOutput`.

Local UI state (`useState`) stays exactly as it was.
