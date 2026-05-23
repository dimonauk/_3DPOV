/**
 * lib/pixel-academy/rendering/office-state/seats.ts
 *
 * Seat lookup + assignment + path-back-to-seat for office agents.
 * Extracted from `office-state.ts` to keep the orchestrator under
 * the 300-line cap.
 */

import {
  INACTIVE_SEAT_TIMER_MIN_SEC,
  INACTIVE_SEAT_TIMER_RANGE_SEC,
} from "../../constants";
import { CharacterState } from "../../types";
import type { Character } from "../../types";
import { findPath } from "../../layout/tile-map";
import type { OfficeState } from "../office-state";

/** First unassigned seat in iteration order, or null. */
export function findFreeSeat(state: OfficeState): string | null {
  for (const [uid, seat] of state.seats) {
    if (!seat.assigned) return uid;
  }
  return null;
}

/** Seat uid at a given tile position, or null. */
export function getSeatAtTile(
  state: OfficeState,
  col: number,
  row: number,
): string | null {
  for (const [uid, seat] of state.seats) {
    if (seat.seatCol === col && seat.seatRow === row) return uid;
  }
  return null;
}

/** Blocked-tile key for a character's own seat, or null. */
export function ownSeatKey(state: OfficeState, ch: Character): string | null {
  if (!ch.seatId) return null;
  const seat = state.seats.get(ch.seatId);
  if (!seat) return null;
  return `${seat.seatCol},${seat.seatRow}`;
}

/** Temporarily unblock a character's own seat, run fn, re-block. */
export function withOwnSeatUnblocked<T>(
  state: OfficeState,
  ch: Character,
  fn: () => T,
): T {
  const key = ownSeatKey(state, ch);
  if (key) state.blockedTiles.delete(key);
  const result = fn();
  if (key) state.blockedTiles.add(key);
  return result;
}

/** Reassign an agent from their current seat to a new seat. */
export function reassignSeat(
  state: OfficeState,
  agentId: number,
  seatId: string,
): void {
  const ch = state.characters.get(agentId);
  if (!ch) return;
  if (ch.seatId) {
    const old = state.seats.get(ch.seatId);
    if (old) old.assigned = false;
  }
  const seat = state.seats.get(seatId);
  if (!seat || seat.assigned) return;
  seat.assigned = true;
  ch.seatId = seatId;
  const path = withOwnSeatUnblocked(state, ch, () =>
    findPath(
      ch.tileCol,
      ch.tileRow,
      seat.seatCol,
      seat.seatRow,
      state.tileMap,
      state.blockedTiles,
    ),
  );
  if (path.length > 0) {
    ch.path = path;
    ch.moveProgress = 0;
    ch.state = CharacterState.WALK;
    ch.frame = 0;
    ch.frameTimer = 0;
  } else {
    ch.state = CharacterState.TYPE;
    ch.dir = seat.facingDir;
    ch.frame = 0;
    ch.frameTimer = 0;
    if (!ch.isActive) {
      ch.seatTimer =
        INACTIVE_SEAT_TIMER_MIN_SEC +
        Math.random() * INACTIVE_SEAT_TIMER_RANGE_SEC;
    }
  }
}

/** Send an agent back to their currently assigned seat. */
export function sendToSeat(state: OfficeState, agentId: number): void {
  const ch = state.characters.get(agentId);
  if (!ch || !ch.seatId) return;
  const seat = state.seats.get(ch.seatId);
  if (!seat) return;
  const path = withOwnSeatUnblocked(state, ch, () =>
    findPath(
      ch.tileCol,
      ch.tileRow,
      seat.seatCol,
      seat.seatRow,
      state.tileMap,
      state.blockedTiles,
    ),
  );
  if (path.length > 0) {
    ch.path = path;
    ch.moveProgress = 0;
    ch.state = CharacterState.WALK;
    ch.frame = 0;
    ch.frameTimer = 0;
  } else {
    ch.state = CharacterState.TYPE;
    ch.dir = seat.facingDir;
    ch.frame = 0;
    ch.frameTimer = 0;
    if (!ch.isActive) {
      ch.seatTimer =
        INACTIVE_SEAT_TIMER_MIN_SEC +
        Math.random() * INACTIVE_SEAT_TIMER_RANGE_SEC;
    }
  }
}
