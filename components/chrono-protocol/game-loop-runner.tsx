"use client";

/**
 * components/chrono-protocol/game-loop-runner.tsx — Headless rAF orchestrator for the Chrono-Protocol runtime.
 *
 * # Purpose
 *
 * Mounts a `requestAnimationFrame` loop that drives the pure
 * game-loop functions in `lib/chrono-protocol/game-loop.ts` and
 * writes results back into the live `chrono-protocol` zustand slice.
 * Polls `agent.banter` on the 12-second Hangar canon cadence and
 * pushes returned turns into the `cast` slice's history.
 *
 * Renders nothing of its own — by design. The HUD, the wheel, the
 * tunnel, and the dialogue overlay each subscribe to the slice they
 * need and re-render independently. The runner's job is to keep
 * the slice fresh.
 *
 * # Why this shape
 *
 * - Headless component matches the "render-nothing orchestrator"
 *   pattern documented in `docs/ARCHITECTURE.md`. UI lives in
 *   sibling components.
 * - Subscribing to the slice for `phase` only keeps the rAF body
 *   stable while the consumer changes mode or zone elsewhere.
 * - The banter call is fire-and-forget; the slice keeps ticking
 *   while the Gemini round-trip resolves.
 *
 * Full purpose in game-loop-runner.PURPOSE.md.
 */

import { useEffect, useRef } from "react";

import {
  isAvailable as isBanterAvailable,
  respondBanter,
  type BanterTelemetry,
  type BanterTurn,
} from "lib/capabilities/agent/banter";
import {
  bibles as defaultBibles,
  type CastMemberId,
  type CharacterBible,
} from "lib/cast";
import { isLoopActive, tickTunnel } from "lib/chrono-protocol/game-loop";
import {
  chronoProtocolStore,
  toBanterPhase,
} from "lib/state/chrono-protocol";
import { castStore } from "lib/state/cast";

export type GameLoopRunnerProps = {
  /**
   * Speakers that should be on-mic this run. If omitted the runner
   * defaults to whichever subset of `["aura", "yow", "purp"]` has a
   * matching bible in `lib/cast`. Yow and Purp bibles will land in a
   * later wave; today the default resolves to `["aura"]`.
   */
  activeSpeakers?: CastMemberId[];
  /**
   * Bible map override. Tests + Storybook can pass a synthetic map;
   * production uses the cast registry by default.
   */
  bibles?: Record<CastMemberId, CharacterBible>;
  /**
   * Optional callback fired with each successful banter turn. Lets a
   * parent surface the line through `DialogueOverlay` without
   * subscribing to cast.history directly.
   */
  onBanterTurn?: (turn: BanterTurn) => void;
};

/**
 * Resolve the active-speaker list against available bibles. The
 * Chrono-Protocol prototype hard-codes AURA/YOW/PURP; the site
 * degrades gracefully when only AURA's bible is registered today.
 */
function resolveSpeakers(
  requested: CastMemberId[] | undefined,
  bibles: Record<CastMemberId, CharacterBible>,
): CastMemberId[] {
  const ask = requested ?? (["aura", "yow", "purp"] as CastMemberId[]);
  return ask.filter((id) => Boolean(bibles[id]));
}

export function GameLoopRunner({
  activeSpeakers,
  bibles,
  onBanterTurn,
}: GameLoopRunnerProps): null {
  const bibleMap = bibles ?? (defaultBibles as Record<CastMemberId, CharacterBible>);
  const speakers = resolveSpeakers(activeSpeakers, bibleMap);

  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const msSinceBanterRef = useRef<number>(0);
  const banterInFlightRef = useRef<boolean>(false);
  const onBanterTurnRef = useRef<GameLoopRunnerProps["onBanterTurn"]>(undefined);
  onBanterTurnRef.current = onBanterTurn;

  useEffect(() => {
    function fireBanter(deltaCarryMs: number): void {
      if (banterInFlightRef.current) return;
      if (!isBanterAvailable()) return;
      if (speakers.length === 0) return;

      const snap = chronoProtocolStore.getState();
      if (!isLoopActive(snap.phase)) return;

      banterInFlightRef.current = true;
      const telemetry: BanterTelemetry = {
        chronoMode: snap.activeMode,
        speed: snap.speedMultiplier,
        combo: snap.combo,
        health: snap.health,
        phase: toBanterPhase(snap.phase),
      };

      respondBanter({ activeSpeakers: speakers, telemetry }, bibleMap)
        .then((res) => {
          const at = new Date().toISOString();
          for (const turn of res.turns) {
            castStore.getState().appendTurn(turn.speaker, {
              at,
              speaker: turn.speaker,
              text: turn.text,
              intent: turn.emotion,
            });
            onBanterTurnRef.current?.(turn);
          }
        })
        .catch((err) => {
          console.error("game-loop-runner: banter call failed", err);
        })
        .finally(() => {
          banterInFlightRef.current = false;
        });

      msSinceBanterRef.current = deltaCarryMs;
    }

    function frame(now: number): void {
      const last = lastTickRef.current || now;
      const deltaMs = Math.max(0, now - last);
      lastTickRef.current = now;

      const snap = chronoProtocolStore.getState();
      if (isLoopActive(snap.phase)) {
        const result = tickTunnel(
          {
            phase: snap.phase,
            currentZone: snap.currentZone,
            activeMode: snap.activeMode,
            tunnelSpeed: snap.tunnelSpeed,
            speedMultiplier: snap.speedMultiplier,
            combo: snap.combo,
            health: snap.health,
            maxHealth: snap.maxHealth,
            score: snap.score,
            msSinceBanter: msSinceBanterRef.current,
            msSinceScoreTick: 0,
          },
          deltaMs,
        );
        msSinceBanterRef.current = result.context.msSinceBanter;
        if (result.scoreDelta > 0) {
          chronoProtocolStore.getState().addScore(result.scoreDelta);
        }
        if (
          result.context.speedMultiplier !== snap.speedMultiplier ||
          result.context.tunnelSpeed !== snap.tunnelSpeed
        ) {
          chronoProtocolStore.getState().setSpeed(result.context.speedMultiplier);
        }
        chronoProtocolStore.getState().setTickMs(deltaMs);
        if (result.shouldBanter) fireBanter(0);
      } else {
        msSinceBanterRef.current = 0;
      }

      rafRef.current = window.requestAnimationFrame(frame);
    }

    rafRef.current = window.requestAnimationFrame(frame);
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastTickRef.current = 0;
      msSinceBanterRef.current = 0;
    };
    // Speakers is recomputed every render but its identity is stable
    // for a given prop set; we re-derive inside the effect's closure
    // rather than depend on its array identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSpeakers?.join("|"), bibleMap]);

  return null;
}
