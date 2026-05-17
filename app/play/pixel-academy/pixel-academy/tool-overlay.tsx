"use client";

/**
 * app/play/pixel-academy/pixel-academy/tool-overlay.tsx — Floating
 * activity label above hovered/selected agents.
 *
 * Ported from `D:/The_Hangar/apps/pixel-academy/src/ToolOverlay.tsx`.
 * The bench app drove this from CSS variables (`--pixel-bg` etc) that
 * ship with the VS Code extension shell; on the site they aren't
 * defined, so the overlay uses inline colors that match the chamber's
 * dark palette.
 *
 * Extracted from pixel-academy-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

import { useEffect, useState } from "react";

import {
  CHARACTER_SITTING_OFFSET_PX,
  CharacterState,
  OfficeState,
  TILE_SIZE,
  TOOL_OVERLAY_VERTICAL_OFFSET,
} from "lib/pixel-academy";

import type { SubagentCharacter } from "./constants";

export interface ToolOverlayProps {
  officeState: OfficeState;
  agents: number[];
  agentTools: Record<number, never[]>;
  subagentCharacters: SubagentCharacter[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  zoom: number;
  panRef: React.RefObject<{ x: number; y: number }>;
  onCloseAgent: (id: number) => void;
}

export function ToolOverlay({
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
