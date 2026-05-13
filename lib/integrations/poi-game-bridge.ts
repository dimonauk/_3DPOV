/**
 * lib/integrations/poi-game-bridge.ts — Typed client for the Hangar's poi-game-bridge.
 *
 * One-line role: surface the local fabrication-chain bridge (finger-sweep -> Wyvill
 * meld -> Blender -> 3MF) to the site as a typed WebSocket client with degraded-mode
 * handling. Headless. No React. The bridge itself lives in the Hangar and must be
 * started separately — see poi-game-bridge.PURPOSE.md for the why.
 */

/** Discriminated union of every message the bridge accepts or emits. */
export type PoiGameBridgeMessage =
  | { kind: "start-session" }
  | { kind: "sample"; t: number; xyz: [number, number, number] }
  | { kind: "end-session" }
  | {
      kind: "stage";
      stage: "fingerSweep" | "meld" | "blender" | "3mf";
      status: "started" | "complete" | "error";
      detail?: string;
    };

/** The four conceptual stages of Pipeline Delta the bridge orchestrates. */
export type PoiGameBridgeStage = "fingerSweep" | "meld" | "blender" | "3mf";

/** Status of a stage as the bridge reports it. */
export type PoiGameBridgeStageStatus = "started" | "complete" | "error";

/** A stage event narrowed from the message union for handler ergonomics. */
export type PoiGameBridgeStageEvent = {
  stage: PoiGameBridgeStage;
  status: PoiGameBridgeStageStatus;
  detail?: string;
};

/** Default URL — matches `dolly-app.json` + `brush-engine.html` in the Hangar. */
export const POI_GAME_BRIDGE_DEFAULT_URL = "ws://localhost:8211";

/** The error message thrown when connect() cannot reach the bridge. */
export function poiGameBridgeMissingMessage(url: string): string {
  return (
    `poi-game-bridge: not running at ${url}. ` +
    `Start it from the Hangar with: ` +
    `python -m uvicorn poi_game_bridge:app --host 0.0.0.0 --port 8211 ` +
    `(from D:\\The_Hangar\\apps\\prototypes\\poi-sculptor). ` +
    `Until then, the fabrication-chain capabilities sit in their degraded path.`
  );
}

type StageHandler = (event: PoiGameBridgeStageEvent) => void;

/**
 * Type guard — narrows an unknown parsed payload to a PoiGameBridgeMessage.
 * Anything that does not match is dropped silently so the bridge can evolve
 * its protocol without crashing the site.
 */
function isBridgeMessage(value: unknown): value is PoiGameBridgeMessage {
  if (typeof value !== "object" || value === null) return false;
  const v = value as { kind?: unknown };
  if (typeof v.kind !== "string") return false;
  if (v.kind === "start-session") return true;
  if (v.kind === "end-session") return true;
  if (v.kind === "sample") {
    const s = value as { t?: unknown; xyz?: unknown };
    if (typeof s.t !== "number") return false;
    if (!Array.isArray(s.xyz) || s.xyz.length !== 3) return false;
    return s.xyz.every((n) => typeof n === "number");
  }
  if (v.kind === "stage") {
    const s = value as { stage?: unknown; status?: unknown };
    const stages: ReadonlyArray<PoiGameBridgeStage> = [
      "fingerSweep",
      "meld",
      "blender",
      "3mf",
    ];
    const statuses: ReadonlyArray<PoiGameBridgeStageStatus> = [
      "started",
      "complete",
      "error",
    ];
    if (typeof s.stage !== "string") return false;
    if (typeof s.status !== "string") return false;
    if (!stages.includes(s.stage as PoiGameBridgeStage)) return false;
    if (!statuses.includes(s.status as PoiGameBridgeStageStatus)) return false;
    return true;
  }
  return false;
}

/**
 * Headless WebSocket client for poi-game-bridge. One instance per session;
 * call connect() before send(), disconnect() when done. Multiple stage handlers
 * are supported; each returns its own unsubscribe.
 */
export class BridgeClient {
  private readonly url: string;
  private ws: WebSocket | null = null;
  private readonly stageHandlers = new Set<StageHandler>();

  constructor(url: string = POI_GAME_BRIDGE_DEFAULT_URL) {
    this.url = url;
  }

  /**
   * Open the WebSocket. Resolves on `open`, rejects with a help-text error
   * if the bridge is not reachable. Idempotent: a second connect() on an
   * already-open socket resolves immediately.
   */
  connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }
    if (typeof WebSocket === "undefined") {
      return Promise.reject(
        new Error("poi-game-bridge: WebSocket is not available in this runtime"),
      );
    }
    return new Promise<void>((resolve, reject) => {
      let settled = false;
      let ws: WebSocket;
      try {
        ws = new WebSocket(this.url);
      } catch (err) {
        reject(
          new Error(
            poiGameBridgeMissingMessage(this.url) +
              ` (constructor threw: ${(err as Error).message})`,
          ),
        );
        return;
      }
      this.ws = ws;
      ws.onopen = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      ws.onerror = () => {
        if (settled) return;
        settled = true;
        this.ws = null;
        reject(new Error(poiGameBridgeMissingMessage(this.url)));
      };
      ws.onclose = () => {
        if (this.ws === ws) this.ws = null;
        if (settled) return;
        settled = true;
        reject(new Error(poiGameBridgeMissingMessage(this.url)));
      };
      ws.onmessage = (event) => {
        this.onMessage(event);
      };
    });
  }

  /** Close the socket and clear handlers. Safe to call when not connected. */
  disconnect(): void {
    const ws = this.ws;
    this.ws = null;
    if (!ws) return;
    try {
      ws.close();
    } catch {
      // Some browsers throw if close() races with a never-opened socket;
      // the reference is already cleared so the next connect() is clean.
    }
  }

  /**
   * Send a message to the bridge. Throws if the socket is not open — the
   * caller is expected to await connect() first, or to gate sends on
   * isConnected() in degraded-mode flows.
   */
  send(message: PoiGameBridgeMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("poi-game-bridge: send() called before connect() resolved");
    }
    this.ws.send(JSON.stringify(message));
  }

  /**
   * Subscribe to stage events emitted by the bridge. Returns an unsubscribe
   * function. Handlers fire in registration order; a handler throwing is
   * caught so one bad handler cannot starve the others.
   */
  onStage(handler: StageHandler): () => void {
    this.stageHandlers.add(handler);
    return () => {
      this.stageHandlers.delete(handler);
    };
  }

  /** True only when the socket is open and ready for send(). */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  private onMessage(event: MessageEvent): void {
    const raw = event.data;
    if (typeof raw !== "string") return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }
    if (!isBridgeMessage(parsed)) return;
    if (parsed.kind !== "stage") return;
    const stageEvent: PoiGameBridgeStageEvent = {
      stage: parsed.stage,
      status: parsed.status,
      ...(parsed.detail !== undefined ? { detail: parsed.detail } : {}),
    };
    for (const handler of this.stageHandlers) {
      try {
        handler(stageEvent);
      } catch {
        // Swallow — a misbehaving handler must not stop the others or
        // tear down the socket.
      }
    }
  }
}
