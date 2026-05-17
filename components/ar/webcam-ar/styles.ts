/**
 * components/ar/webcam-ar/styles.ts — Scoped CSS for WebcamARScene.
 *
 * Extracted from the inline `<style jsx>` block in WebcamARScene.tsx
 * per ARCHITECTURE.md Rule 1 (keeps the orchestrator readable; the
 * 180-line CSS block had no logic and was crowding out the React
 * code). Returns the CSS string for the host to embed in a styled-jsx
 * tagged template — interpolations stay live because the host
 * passes `card` into the function.
 */

import type { Card } from "lib/ar/types";

export function webcamARStyles(card: Card): string {
  return `
    .wc-root {
      width: 100%;
      padding: 0 1rem;
      position: relative;
    }
    .wc-prompt {
      width: 100%;
      height: 70vh;
      min-height: 400px;
      border-radius: 1rem;
      background: linear-gradient(
        135deg,
        ${card.brand.primary}22,
        ${card.brand.secondary}22
      );
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1.25rem;
      padding: 2rem;
      text-align: center;
    }
    .wc-xr-hint {
      background: transparent;
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .wc-xr-hint > * {
      pointer-events: auto;
    }
    .wc-hint {
      font-size: 1rem;
      line-height: 1.5;
      max-width: 32rem;
    }
    .wc-fine {
      font-size: 0.75rem;
      opacity: 0.6;
      max-width: 28rem;
    }
    .wc-error {
      color: #ff6b6b;
      font-size: 0.85rem;
      max-width: 30rem;
    }
    .wc-error-floating {
      position: absolute;
      top: 1rem;
      left: 1rem;
      right: 1rem;
      background: rgba(0, 0, 0, 0.7);
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      z-index: 5;
    }
    .wc-btn {
      background: ${card.brand.primary};
      color: ${card.brand.textOnBrand};
      border: none;
      padding: 1rem 1.75rem;
      border-radius: 999px;
      font-weight: 700;
      font-size: 1rem;
      cursor: pointer;
      box-shadow: 0 4px 24px ${card.brand.primary}66;
      transition: transform 0.1s ease;
    }
    .wc-btn-secondary {
      background: transparent;
      color: inherit;
      border: 1px solid currentColor;
      padding: 0.75rem 1.5rem;
      border-radius: 999px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      opacity: 0.8;
    }
    .wc-btn:active,
    .wc-btn-secondary:active {
      transform: scale(0.97);
    }
    .wc-btn-small {
      background: transparent;
      color: inherit;
      border: 1px solid currentColor;
      padding: 0.5rem 1rem;
      border-radius: 999px;
      font-size: 0.85rem;
      cursor: pointer;
      opacity: 0.7;
    }
    .wc-video {
      display: none;
      position: absolute;
      top: 0;
      left: 1rem;
      right: 1rem;
      width: calc(100% - 2rem);
      height: 70vh;
      min-height: 400px;
      object-fit: cover;
      border-radius: 1rem;
      z-index: 1;
    }
    .wc-video-on {
      display: block;
    }
    .wc-canvas {
      display: none;
      position: absolute;
      top: 0;
      left: 1rem;
      right: 1rem;
      width: calc(100% - 2rem);
      height: 70vh;
      min-height: 400px;
      border-radius: 1rem;
      z-index: 2;
      pointer-events: auto;
    }
    .wc-canvas-on {
      display: block;
    }
    .wc-overlay {
      position: absolute;
      bottom: 1.5rem;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 0.5rem;
      z-index: 3;
      flex-wrap: wrap;
      justify-content: center;
    }
    .wc-toggle {
      background: rgba(0, 0, 0, 0.55);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 0.65rem 1.1rem;
      border-radius: 999px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      backdrop-filter: blur(8px);
      transition: all 0.15s ease;
    }
    .wc-toggle:active {
      transform: scale(0.97);
    }
    .wc-toggle-on {
      background: ${card.brand.primary};
      color: ${card.brand.textOnBrand};
      border-color: ${card.brand.primary};
    }
    .wc-toggle-rec {
      background: #d92626;
      color: white;
      border-color: #d92626;
      animation: rec-pulse 1.4s ease-in-out infinite;
    }
    @keyframes rec-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(217, 38, 38, 0.55); }
      50%      { box-shadow: 0 0 0 8px rgba(217, 38, 38, 0); }
    }
    .wc-stop {
      position: absolute;
      top: 1rem;
      right: 2rem;
      z-index: 3;
      background: rgba(0, 0, 0, 0.6);
      color: white;
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      font-size: 1.2rem;
      cursor: pointer;
      backdrop-filter: blur(8px);
    }
  `;
}
