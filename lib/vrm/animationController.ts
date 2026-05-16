"use client";

import * as THREE from "three";
import type { VRM } from "@pixiv/three-vrm";
import { loadVRMAnimation } from "./loadVRMAnimation";
import {
  type AnimationName,
  ANIMATION_URL,
  IDLE_URL,
} from "./animationMap";

/**
 * AnimationController — manages VRM body animations on top of a
 * THREE.AnimationMixer.
 *
 * Lifecycle:
 *   1. construct with (vrm, mixer)
 *   2. startIdle() — loads + starts idle loop, preloads all named clips
 *   3. playOneShot(name) — crossfade to one-shot, auto-return to idle
 *   4. dispose() — clear pending timers, optional but tidy
 *
 * Vendored from The Hangar's aura-vrm app
 * (D:\The_Hangar\apps\aura-vrm\src\features\emoteController\
 * animationController.ts). Path constants moved to the holoflow
 * animation map.
 */

const CROSSFADE_DURATION = 0.3; // seconds

const log = (...a: unknown[]) => {
  if (typeof window !== "undefined" && (window as { __auraDebug?: boolean }).__auraDebug) {
    console.log("🎭 [Anim]", ...a);
  }
};
const warn = (...a: unknown[]) => console.warn("🎭 [Anim]", ...a);

export class AnimationController {
  private _mixer: THREE.AnimationMixer;
  private _vrm: VRM;

  /** Loaded clips cache: url → AnimationClip */
  private _clips = new Map<string, THREE.AnimationClip>();

  /** Active actions */
  private _idleAction: THREE.AnimationAction | null = null;
  private _currentAction: THREE.AnimationAction | null = null;

  /** Prevent overlapping one-shots */
  private _oneShotTimeout: ReturnType<typeof setTimeout> | null = null;

  /** True once startIdle has fired (idle loop loaded). */
  public ready = false;

  constructor(vrm: VRM, mixer: THREE.AnimationMixer) {
    this._vrm = vrm;
    this._mixer = mixer;
  }

  /** Load + start the idle loop. Call once after the VRM is in the scene. */
  public async startIdle(): Promise<void> {
    const clip = await this._loadClip(IDLE_URL);
    if (!clip) {
      warn("idle_loop.vrma not found");
      return;
    }

    this._idleAction = this._mixer.clipAction(clip);
    this._idleAction.setLoop(THREE.LoopRepeat, Infinity);
    this._idleAction.play();
    this._currentAction = this._idleAction;
    this.ready = true;
    log("idle started");

    // Preload all named animations in the background — non-blocking.
    void this._preloadAll();
  }

  /** Preload all named animation clips. */
  private async _preloadAll(): Promise<void> {
    const names = Object.keys(ANIMATION_URL) as AnimationName[];
    await Promise.allSettled(
      names.map((name) => this._loadClip(ANIMATION_URL[name])),
    );
    log(`preloaded ${this._clips.size} clips`);
  }

  /** Load a clip from URL, cache it, return null on failure. */
  private async _loadClip(url: string): Promise<THREE.AnimationClip | null> {
    const cached = this._clips.get(url);
    if (cached) return cached;
    try {
      const vrma = await loadVRMAnimation(url);
      if (!vrma) return null;
      const clip = vrma.createAnimationClip(this._vrm);
      this._clips.set(url, clip);
      return clip;
    } catch (e) {
      warn(`failed to load ${url}:`, e);
      return null;
    }
  }

  /**
   * Play a named one-shot then crossfade back to idle. Safe to call
   * while another one-shot is playing — interrupts gracefully.
   */
  public async playOneShot(name: AnimationName): Promise<void> {
    const url = ANIMATION_URL[name];
    const clip = await this._loadClip(url);
    if (!clip) {
      warn("clip not loaded:", name);
      return;
    }

    // Cancel any pending return-to-idle.
    if (this._oneShotTimeout) {
      clearTimeout(this._oneShotTimeout);
      this._oneShotTimeout = null;
    }

    // Fade out current action if not idle.
    if (this._currentAction && this._currentAction !== this._idleAction) {
      this._currentAction.fadeOut(CROSSFADE_DURATION);
    }

    // Create + play the new action.
    const action = this._mixer.clipAction(clip);
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.reset();

    // Clapping wrist targets are authored for a different body scale —
    // blending at 0.85 keeps arms animated but prevents chest intersection.
    if (name === "Clapping") {
      action.setEffectiveWeight(0.85);
    }

    if (this._idleAction) {
      this._idleAction.fadeOut(CROSSFADE_DURATION);
      action.fadeIn(CROSSFADE_DURATION);
    }

    action.play();
    this._currentAction = action;
    log(`▶ ${name} (${clip.duration.toFixed(2)}s)`);

    // Schedule return to idle after clip finishes.
    const returnMs = (clip.duration - CROSSFADE_DURATION) * 1000;
    this._oneShotTimeout = setTimeout(() => {
      this._returnToIdle();
    }, Math.max(returnMs, 100));
  }

  /** Force return to idle (e.g. on hide / unmount). */
  public returnToIdle(): void {
    this._returnToIdle();
  }

  private _returnToIdle(): void {
    if (!this._idleAction) return;
    if (this._currentAction && this._currentAction !== this._idleAction) {
      this._currentAction.fadeOut(CROSSFADE_DURATION);
    }
    this._idleAction.reset();
    this._idleAction.fadeIn(CROSSFADE_DURATION);
    this._idleAction.play();
    this._currentAction = this._idleAction;
    log("↩ idle");
  }

  public dispose(): void {
    if (this._oneShotTimeout) {
      clearTimeout(this._oneShotTimeout);
      this._oneShotTimeout = null;
    }
    this._mixer.stopAllAction();
    this._clips.clear();
    this._idleAction = null;
    this._currentAction = null;
    this.ready = false;
  }
}
