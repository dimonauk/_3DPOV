"use client";

/**
 * app/play/pixel-academy/pixel-academy-client.tsx
 *
 * The Pixel Academy chamber — a tile-based pixel-art office with the
 * Headmistress (Aura) seated at her desk on the right. Ports the Vite
 * bench app at `D:/The_Hangar/apps/pixel-academy/src/` (App.tsx +
 * OfficeCanvas.tsx + ToolOverlay.tsx). The engine lives under
 * `lib/pixel-academy/` (vendored from `@hanger/pixel-engine`).
 *
 * Notes vs the bench version:
 *
 *   - The Scribe Bridge socket (`useScribeLink`, ws://localhost:9001)
 *     is intentionally NOT wired in. The bridge ships with the
 *     desktop Hangar shell, not with the public site; on the site
 *     the room stands as a single-occupant tableau (the Headmistress
 *     at her desk). When the bridge is re-introduced as a Holoflow
 *     capability, this client re-mounts the hook.
 *   - The bench app rendered fullscreen (`100vw / 100vh`); the
 *     chamber renders inside a sized container so it composes with
 *     the article above it. The renderer is DPR-aware via a
 *     ResizeObserver.
 *   - All `console.*` calls go through `createLogger("play:pixel-academy")`
 *     per the holoflow-testing-logging convention.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { createLogger } from "lib/log";
import {
  OfficeState,
  TILE_SIZE,
  CharacterState,
  TOOL_OVERLAY_VERTICAL_OFFSET,
  CHARACTER_SITTING_OFFSET_PX,
  startGameLoop,
  renderFrame,
} from "lib/pixel-academy";

const log = createLogger("play:pixel-academy");

// ── Aura ──────────────────────────────────────────────────────────────────────
// Reserved character ID for the Headmistress. Scribe Bridge agents start at 1+.
// Negative IDs are sub-agents, so 0 is permanently hers.
const AURA_ID = 0;
// Palette 5 = the sixth skin. Regular agents round-robin 0-4 so she always
// looks distinct from whoever else is in the room.
const AURA_PALETTE = 5;
// Right-room top chair — head-of-table, facing the desk.
const AURA_SEAT = "chair-r-top";

// Camera + zoom tuning — copied from the bench app so the chamber
// behaves identically.
const CAMERA_FOLLOW_LERP = 0.1;
const CAMERA_FOLLOW_SNAP_THRESHOLD = 0.5;
const ZOOM_MIN = 1;
const ZOOM_MAX = 8;
const ZOOM_SCROLL_THRESHOLD = 50;
const PAN_MARGIN_FRACTION = 0.5;

// The chamber's standing height. Tall enough to read the room without
// dominating the article that frames it.
const CHAMBER_HEIGHT = "640px";

function createOfficeWithAura(): OfficeState {
  const state = new OfficeState();
  // skipSpawnEffect=true: she's just *there* from frame 1, no matrix-rain entry
  state.addAgent(
    AURA_ID,
    AURA_PALETTE,
    0,
    AURA_SEAT,
    /* skipSpawnEffect */ true,
  );
  // Active from the start so she sits typing, not wandering the room
  state.setAgentActive(AURA_ID, true);
  return state;
}

interface SubagentCharacter {
  id: number;
  label: string;
}

export default function PixelAcademyClient() {
  // Lazy-init: OfficeState mutates internal sprite caches via canvas
  // pre-render, which is browser-only. The lazy initial value keeps
  // construction off the server.
  const [officeState] = useState<OfficeState | null>(() =>
    typeof window === "undefined" ? null : createOfficeWithAura(),
  );
  const [zoom, setZoom] = useState(2);
  const panRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  if (!officeState) {
    return (
      <div
        style={{
          height: CHAMBER_HEIGHT,
          background: "#1a1a1a",
        }}
      />
    );
  }

  const agents: number[] = [AURA_ID];
  const agentTools: Record<number, never[]> = {};
  const subagentCharacters: SubagentCharacter[] = [
    { id: AURA_ID, label: "Headmistress" },
  ];

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: CHAMBER_HEIGHT,
        background: "#1a1a1a",
        overflow: "hidden",
      }}
    >
      <OfficeCanvas
        officeState={officeState}
        zoom={zoom}
        onZoomChange={setZoom}
        panRef={panRef}
        onClick={(id) => log.info("agent clicked", { id })}
      />
      <ToolOverlay
        officeState={officeState}
        agents={agents}
        agentTools={agentTools}
        subagentCharacters={subagentCharacters}
        containerRef={containerRef}
        zoom={zoom}
        panRef={panRef}
        onCloseAgent={(id) => {
          // Aura is permanent — she cannot be dismissed.
          if (id === AURA_ID) return;
          log.info("close agent", { id });
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          color: "white",
          fontFamily: "monospace",
          pointerEvents: "none",
          textShadow: "0 0 5px cyan",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "22px", letterSpacing: "0.12em" }}>
          PIXEL ACADEMY
        </h2>
        <p style={{ margin: "4px 0 0", opacity: 0.7, fontSize: "12px" }}>
          headmistress aura is watching
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// OfficeCanvas — the tile-based renderer + interaction surface.
//
// Ported verbatim from `D:/The_Hangar/apps/pixel-academy/src/OfficeCanvas.tsx`,
// minus the Scribe Bridge hook. Edit-mode props are inlined as no-ops
// because the chamber does not surface the editor.
// ============================================================================

interface OfficeCanvasProps {
  officeState: OfficeState;
  onClick: (agentId: number) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  panRef: React.MutableRefObject<{ x: number; y: number }>;
}

function OfficeCanvas({
  officeState,
  onClick,
  zoom,
  onZoomChange,
  panRef,
}: OfficeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({
    mouseX: 0,
    mouseY: 0,
    panX: 0,
    panY: 0,
  });
  const zoomAccumulatorRef = useRef(0);

  const clampPan = useCallback(
    (px: number, py: number): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: px, y: py };
      const layout = officeState.getLayout();
      const mapW = layout.cols * TILE_SIZE * zoom;
      const mapH = layout.rows * TILE_SIZE * zoom;
      const marginX = canvas.width * PAN_MARGIN_FRACTION;
      const marginY = canvas.height * PAN_MARGIN_FRACTION;
      const maxPanX = mapW / 2 + canvas.width / 2 - marginX;
      const maxPanY = mapH / 2 + canvas.height / 2 - marginY;
      return {
        x: Math.max(-maxPanX, Math.min(maxPanX, px)),
        y: Math.max(-maxPanY, Math.min(maxPanY, py)),
      };
    },
    [officeState, zoom],
  );

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    resizeCanvas();
    const observer = new ResizeObserver(() => resizeCanvas());
    if (containerRef.current) observer.observe(containerRef.current);

    const stop = startGameLoop(canvas, {
      update: (dt) => {
        officeState.update(dt);
      },
      render: (ctx) => {
        const w = canvas.width;
        const h = canvas.height;

        if (officeState.cameraFollowId !== null) {
          const followCh = officeState.characters.get(
            officeState.cameraFollowId,
          );
          if (followCh) {
            const layout = officeState.getLayout();
            const mapW = layout.cols * TILE_SIZE * zoom;
            const mapH = layout.rows * TILE_SIZE * zoom;
            const targetX = mapW / 2 - followCh.x * zoom;
            const targetY = mapH / 2 - followCh.y * zoom;
            const dx = targetX - panRef.current.x;
            const dy = targetY - panRef.current.y;
            if (
              Math.abs(dx) < CAMERA_FOLLOW_SNAP_THRESHOLD &&
              Math.abs(dy) < CAMERA_FOLLOW_SNAP_THRESHOLD
            ) {
              panRef.current = { x: targetX, y: targetY };
            } else {
              panRef.current = {
                x: panRef.current.x + dx * CAMERA_FOLLOW_LERP,
                y: panRef.current.y + dy * CAMERA_FOLLOW_LERP,
              };
            }
          }
        }

        const selectionRender = {
          selectedAgentId: officeState.selectedAgentId,
          hoveredAgentId: officeState.hoveredAgentId,
          hoveredTile: officeState.hoveredTile,
          seats: officeState.seats,
          characters: officeState.characters,
        };

        const { offsetX, offsetY } = renderFrame(
          ctx,
          w,
          h,
          officeState.tileMap,
          officeState.furniture,
          officeState.getCharacters(),
          zoom,
          panRef.current.x,
          panRef.current.y,
          selectionRender,
          undefined,
          officeState.getLayout().tileColors,
          officeState.getLayout().cols,
          officeState.getLayout().rows,
        );
        offsetRef.current = { x: offsetX, y: offsetY };
      },
    });

    return () => {
      stop();
      observer.disconnect();
    };
  }, [officeState, resizeCanvas, zoom, panRef]);

  const screenToWorld = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const cssX = clientX - rect.left;
      const cssY = clientY - rect.top;
      const deviceX = cssX * dpr;
      const deviceY = cssY * dpr;
      const worldX = (deviceX - offsetRef.current.x) / zoom;
      const worldY = (deviceY - offsetRef.current.y) / zoom;
      return { worldX, worldY, screenX: cssX, screenY: cssY, deviceX, deviceY };
    },
    [zoom],
  );

  const screenToTile = useCallback(
    (clientX: number, clientY: number) => {
      const pos = screenToWorld(clientX, clientY);
      if (!pos) return null;
      const col = Math.floor(pos.worldX / TILE_SIZE);
      const row = Math.floor(pos.worldY / TILE_SIZE);
      const layout = officeState.getLayout();
      if (col < 0 || col >= layout.cols || row < 0 || row >= layout.rows)
        return null;
      return { col, row };
    },
    [screenToWorld, officeState],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanningRef.current) {
        const dpr = window.devicePixelRatio || 1;
        const dx = (e.clientX - panStartRef.current.mouseX) * dpr;
        const dy = (e.clientY - panStartRef.current.mouseY) * dpr;
        panRef.current = clampPan(
          panStartRef.current.panX + dx,
          panStartRef.current.panY + dy,
        );
        return;
      }
      const pos = screenToWorld(e.clientX, e.clientY);
      if (!pos) return;
      const hitId = officeState.getCharacterAt(pos.worldX, pos.worldY);
      const tile = screenToTile(e.clientX, e.clientY);
      officeState.hoveredTile = tile;
      officeState.hoveredAgentId = hitId;
    },
    [officeState, screenToWorld, screenToTile, clampPan, panRef],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault();
        officeState.cameraFollowId = null;
        isPanningRef.current = true;
        panStartRef.current = {
          mouseX: e.clientX,
          mouseY: e.clientY,
          panX: panRef.current.x,
          panY: panRef.current.y,
        };
      }
    },
    [officeState, panRef],
  );

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (e.button === 1) isPanningRef.current = false;
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const pos = screenToWorld(e.clientX, e.clientY);
      if (!pos) return;
      const hitId = officeState.getCharacterAt(pos.worldX, pos.worldY);
      if (hitId !== null) {
        officeState.dismissBubble(hitId);
        if (officeState.selectedAgentId === hitId) {
          officeState.selectedAgentId = null;
          officeState.cameraFollowId = null;
        } else {
          officeState.selectedAgentId = hitId;
          officeState.cameraFollowId = hitId;
        }
        onClick(hitId);
        return;
      }

      if (officeState.selectedAgentId !== null) {
        const selectedCh = officeState.characters.get(
          officeState.selectedAgentId,
        );
        if (selectedCh && !selectedCh.isSubagent) {
          const tile = screenToTile(e.clientX, e.clientY);
          if (tile) {
            const seatId = officeState.getSeatAtTile(tile.col, tile.row);
            if (seatId) {
              const seat = officeState.seats.get(seatId);
              if (seat && selectedCh) {
                if (selectedCh.seatId === seatId) {
                  officeState.sendToSeat(officeState.selectedAgentId);
                  officeState.selectedAgentId = null;
                  officeState.cameraFollowId = null;
                  return;
                } else if (!seat.assigned) {
                  officeState.reassignSeat(
                    officeState.selectedAgentId,
                    seatId,
                  );
                  officeState.selectedAgentId = null;
                  officeState.cameraFollowId = null;
                  return;
                }
              }
            }
          }
        }
        officeState.selectedAgentId = null;
        officeState.cameraFollowId = null;
      }
    },
    [officeState, onClick, screenToWorld, screenToTile],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      // Default-prevent only the zoom case so we don't hijack page scroll.
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        zoomAccumulatorRef.current += e.deltaY;
        if (Math.abs(zoomAccumulatorRef.current) >= ZOOM_SCROLL_THRESHOLD) {
          const delta = zoomAccumulatorRef.current < 0 ? 1 : -1;
          zoomAccumulatorRef.current = 0;
          const newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom + delta));
          if (newZoom !== zoom) onZoomChange(newZoom);
        }
      }
    },
    [zoom, onZoomChange],
  );

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: "#1E1E2E",
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
        style={{ display: "block" }}
      />
    </div>
  );
}

// ============================================================================
// ToolOverlay — the floating activity label above hovered/selected agents.
//
// Ported from `D:/The_Hangar/apps/pixel-academy/src/ToolOverlay.tsx`.
// The bench app drove this from CSS variables (`--pixel-bg` etc) that
// ship with the VS Code extension shell; on the site they aren't
// defined, so the overlay uses inline colors that match the chamber's
// dark palette.
// ============================================================================

interface ToolOverlayProps {
  officeState: OfficeState;
  agents: number[];
  agentTools: Record<number, never[]>;
  subagentCharacters: SubagentCharacter[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  zoom: number;
  panRef: React.RefObject<{ x: number; y: number }>;
  onCloseAgent: (id: number) => void;
}

function ToolOverlay({
  officeState,
  agents,
  subagentCharacters,
  containerRef,
  zoom,
  panRef,
  onCloseAgent,
}: ToolOverlayProps) {
  // The overlay needs to re-render every frame so its absolute-position
  // tracks the canvas character. requestAnimationFrame -> setState bump.
  const [, setTick] = useState(0);
  useEffect(() => {
    let rafId = 0;
    const tick = () => {
      setTick((n) => n + 1);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const el = containerRef.current;
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const canvasW = Math.round(rect.width * dpr);
  const canvasH = Math.round(rect.height * dpr);
  const layout = officeState.getLayout();
  const mapW = layout.cols * TILE_SIZE * zoom;
  const mapH = layout.rows * TILE_SIZE * zoom;
  const deviceOffsetX =
    Math.floor((canvasW - mapW) / 2) + Math.round(panRef.current.x);
  const deviceOffsetY =
    Math.floor((canvasH - mapH) / 2) + Math.round(panRef.current.y);

  const selectedId = officeState.selectedAgentId;
  const hoveredId = officeState.hoveredAgentId;
  const allIds = [...agents, ...subagentCharacters.map((s) => s.id)];

  return (
    <>
      {allIds.map((id) => {
        const ch = officeState.characters.get(id);
        if (!ch) return null;

        const isSelected = selectedId === id;
        const isHovered = hoveredId === id;
        if (!isSelected && !isHovered) return null;

        const isSub = ch.isSubagent;
        const sittingOffset =
          ch.state === CharacterState.TYPE ? CHARACTER_SITTING_OFFSET_PX : 0;
        const screenX = (deviceOffsetX + ch.x * zoom) / dpr;
        const screenY =
          (deviceOffsetY +
            (ch.y + sittingOffset - TOOL_OVERLAY_VERTICAL_OFFSET) * zoom) /
          dpr;

        let activityText: string;
        if (isSub) {
          const sub = subagentCharacters.find((s) => s.id === id);
          activityText = sub ? sub.label : "Subtask";
        } else {
          // No tool-activity stream in this chamber — fall back to the
          // role label so the headmistress is always identified.
          const sub = subagentCharacters.find((s) => s.id === id);
          activityText = sub ? sub.label : "Idle";
        }

        return (
          <div
            key={id}
            style={{
              position: "absolute",
              left: screenX,
              top: screenY - 24,
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              pointerEvents: isSelected ? "auto" : "none",
              zIndex: isSelected ? 20 : 10,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "#1f1f2e",
                border: isSelected
                  ? "2px solid #d0c4ff"
                  : "2px solid #4a4a6a",
                padding: isSelected ? "3px 6px 3px 8px" : "3px 8px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
                whiteSpace: "nowrap",
                maxWidth: 220,
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              }}
            >
              <span
                style={{
                  fontSize: isSub ? "14px" : "15px",
                  fontStyle: isSub ? "italic" : undefined,
                  color: "#e8e8f5",
                }}
              >
                {activityText}
              </span>
              {isSelected && !isSub ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseAgent(id);
                  }}
                  title="Close agent"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#8d8da8",
                    cursor: "pointer",
                    padding: "0 2px",
                    fontSize: "20px",
                    lineHeight: 1,
                    marginLeft: 2,
                  }}
                >
                  ×
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </>
  );
}
