/**
 * templates/webxr-game-starter/page.tsx — Server component for the
 * WebXR Game Starter template.
 *
 * Renders the 3D scene full-width inside a `<SceneStage>` wrapper,
 * with an HTML HUD overlay on top showing pickup count + game time,
 * and a Restart button that resets game state.
 *
 * Most of the actual mount work happens in `./client-shell.tsx` —
 * SceneStage is client-only (it depends on R3F + WebGPU detection),
 * so the page server-renders the chrome and hands the canvas to the
 * client shell.
 *
 * Fork-and-edit. Replace the metadata, swap the `<GameScene>` import
 * for your own scene, and the rest of this file is a stable harness.
 */

import ClientShell from "./client-shell";

export const metadata = {
  title: "WebXR Game Starter — Holoflow Studio",
  description:
    "Minimal WebXR game scaffold built on the studio's framework primitives.",
};

export default function GameStarterPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12 md:py-16">
      <header className="mb-8">
        <div className="chrome-label">Templates &middot; WebXR Game</div>
        <h1 className="mt-3 text-4xl leading-tight md:text-5xl">
          Game starter.
        </h1>
        <p className="mt-4 max-w-2xl text-chrome-200">
          A 4&times;4 m room, two low-poly props, three pickups. Walk
          near a pickup and press <kbd>Space</kbd> (or the controller
          trigger in VR) to collect it. When all three are in, the run
          finishes and the HUD freezes the timer.
        </p>
      </header>

      <ClientShell />

      <section className="mt-10 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-6 text-sm text-chrome-300">
        <div className="chrome-label">Fork this</div>
        <p className="mt-3">
          Copy <code className="font-mono text-chrome-100">
            templates/webxr-game-starter/
          </code>{" "}
          out of the repo, rename, and start replacing files in the
          order the in-template README lays out. The framework
          primitives live under{" "}
          <code className="font-mono text-chrome-100">lib/game/</code>;
          the scene wrapper is{" "}
          <code className="font-mono text-chrome-100">
            components/xr-scene/SceneStage.tsx
          </code>
          .
        </p>
      </section>
    </main>
  );
}
