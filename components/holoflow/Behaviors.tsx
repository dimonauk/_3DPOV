/**
 * Behaviors — page-wide interaction effects controlled by theme axes.
 *
 * Mount <ThemeBehaviors /> once near the root of any page that wants
 * the optional cursor effects. It reads useTheme() and mounts the
 * sub-effects only when their axis is "on":
 *
 *   mouseRipples=on    → faint expanding ring on every click
 *   keyboardKonami=on  → ↑↑↓↓←→←→BA fires the "logo" easter egg
 *
 * The effects themselves are tiny and unmount cleanly so they can be
 * flipped at runtime from /theme without a reload.
 */

"use client";

import { useEffect } from "react";

import { useTheme } from "lib/theme/store";
import { useEasterEgg } from "./EasterEgg";

export function ThemeBehaviors() {
  const ripples = useTheme((s) => s.selection.mouseRipples);
  const konami = useTheme((s) => s.selection.keyboardKonami);
  return (
    <>
      {ripples === "on" && <MouseRipples />}
      {konami === "on" && <KonamiListener />}
    </>
  );
}

function MouseRipples() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = document.createElement("div");
      el.style.cssText = `
        position: fixed;
        left: ${e.clientX}px;
        top: ${e.clientY}px;
        width: 14px;
        height: 14px;
        margin: -7px;
        border: 1px solid rgba(180, 144, 255, 0.5);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        animation: holoflow-ripple 0.6s ease-out forwards;
      `;
      document.body.appendChild(el);
      window.setTimeout(() => el.remove(), 700);
    };
    // Inject the keyframe lazily — it's not in globals to keep that file lean.
    const styleId = "holoflow-ripple-keyframe";
    if (!document.getElementById(styleId)) {
      const s = document.createElement("style");
      s.id = styleId;
      s.textContent = `@keyframes holoflow-ripple { to { transform: scale(5); opacity: 0; } }`;
      document.head.appendChild(s);
    }
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);
  return null;
}

const KONAMI = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
];

function KonamiListener() {
  const show = useEasterEgg((s) => s.show);
  useEffect(() => {
    let buf: string[] = [];
    const onKey = (e: KeyboardEvent) => {
      buf.push(e.key);
      if (buf.length > KONAMI.length) buf = buf.slice(-KONAMI.length);
      if (buf.length === KONAMI.length && buf.every((k, i) => k === KONAMI[i])) {
        show("logo");
        buf = [];
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show]);
  return null;
}
