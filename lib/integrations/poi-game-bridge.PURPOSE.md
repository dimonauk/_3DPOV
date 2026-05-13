# `poi-game-bridge.ts` — purpose twin

## Role

A typed WebSocket client for the Hangar's poi-game-bridge — the local
service that orchestrates the fabrication chain (finger-sweep capture
through Wyvill implicit-field meld, Blender waveguide carving, and 3MF
export). The site surfaces this as a thin, headless client; the service
itself stays bench-side. This file establishes the `lib/integrations/`
convention: the studio's first typed client for an external local
service that is not a capability brick.

## Public surface

- `BridgeClient` — class with `connect()`, `disconnect()`, `send()`,
  `onStage(handler) => unsubscribe`, and `isConnected()`.
- `PoiGameBridgeMessage` — discriminated union covering the four
  message shapes: `start-session`, `sample`, `end-session`, and the
  bridge-emitted `stage` event.
- `PoiGameBridgeStage` — the four pipeline-stage names (`fingerSweep`,
  `meld`, `blender`, `3mf`).
- `PoiGameBridgeStageStatus` — `"started" | "complete" | "error"`.
- `PoiGameBridgeStageEvent` — the narrowed shape passed to stage
  handlers.
- `POI_GAME_BRIDGE_DEFAULT_URL` — `ws://localhost:8211`.
- `poiGameBridgeMissingMessage(url)` — the canonical "bridge not
  running" error text, exported so callers can re-use the same wording
  in their own logging or UI.

## Internal

- `isBridgeMessage(value)` — type guard that drops anything not
  conforming to the union, so the bridge can evolve its protocol
  without crashing the site.
- `StageHandler` — internal alias for the handler signature.
- `BridgeClient.onMessage(event)` — private dispatcher that parses,
  narrows, and fans out to registered stage handlers.

## Depends on

- Browser globals only: `WebSocket`, `JSON`, `MessageEvent`. No npm
  packages. No React. No zustand slice — by design, this is an
  integration client, not a capability.

## Does not

- **Does not run the bridge.** This file is a client for a local
  service that lives in the Hangar at
  `D:\The_Hangar\apps\prototypes\poi-sculptor\poi_game_bridge.py`.
  The bridge must be started by the user before `connect()` will
  resolve. Canonical launch command (per `dolly-app.json` in the
  poi-sculptor folder):
  `python -m uvicorn poi_game_bridge:app --host 0.0.0.0 --port 8211`.
- **Does not register a capability.** `lib/integrations/` is the
  studio's first typed-client folder and is intentionally outside the
  capability registry. A capability is a typed function that the
  registry indexes, the genome breeds, and the pipeline slots; an
  integration is a typed client for an external service the studio
  reaches out to. Future siblings (Shopify webhooks, Vercel deploy
  API, Firebase admin, more local bridges) follow the same convention.
- **Does not write to a state slice.** Integrations are headless
  message ferries — the capability that wraps the client (when one
  is added later, e.g. `lib/capabilities/fabricate/sweep.ts`) is
  responsible for landing events on the right slice. Keeping that
  responsibility one layer up means the integration itself stays
  trivial to mock in tests.
- **Does not throw into React.** All connection errors are surfaced as
  rejected promises or a `false` from `isConnected()`. The site's
  degraded path is the contract: if the bridge is absent, the
  fabrication-chain UI sits cold and the article copy describes the
  pipeline rather than driving it.
- **Does not retry.** The first connect() either resolves or rejects;
  reconnection is a policy choice for the wrapping capability, not the
  client. A reconnect loop in here would prevent callers from showing
  an honest "bridge not running" state.

## Bordering files

- `D:\The_Hangar\apps\prototypes\poi-sculptor\poi_game_bridge.py` —
  the bridge implementation. Owns the HTTP `/session`, the per-job
  `/ws/session/{id}` log stream, and the MQTT `neo/poi/fabricate/{id}`
  topic. Site contract: ws://localhost:8211 with the message shapes
  named above.
- `D:\The_Hangar\PIPELINES.md` — Pipeline Delta canon (the
  fabrication chain this bridge orchestrates).
- `docs/LOCAL_SERVICES.md` — the local-services map. poi-game-bridge
  has been added to the service table and given its own per-service
  detail section.
- `lib/capabilities/audio/tts-providers/web-speech.ts` — the closest
  prior art for a typed "client of an external interface" pattern in
  this codebase. Note the distinction, though: web-speech is a
  **capability** (registered, breedable, slot-able), whereas
  poi-game-bridge is an **integration** (client only, deliberately
  outside the registry). Future capabilities that need fabrication
  events will import `BridgeClient` from here and stage the events
  onto the appropriate slice themselves.

## Future composition

When the fabrication slice is added (forecast path: `lib/state/fab.ts`
or a section of `lib/state/viz.ts`), a wrapping capability — for
example `lib/capabilities/fabricate/sweep.ts` — will own the
`BridgeClient` lifecycle, translate stage events into slice writes,
and expose a verb-noun surface to the registry. Until that capability
exists, the client is forward-looking infrastructure: typed, reachable,
documented, and ready for the first caller.
