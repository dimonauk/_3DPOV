/**
 * app/templates/webxr-game-starter/page.tsx — Route stub for the
 * WebXR Game Starter template.
 *
 * This file exists so the in-repo template is reachable in dev at
 * `/templates/webxr-game-starter`. The real game shell — the client
 * component holding the SceneStage + HUD + Restart wiring — lives at
 * `templates/webxr-game-starter/page.tsx`. We import it from there
 * so the fork-and-edit path is a single directory, and the route
 * stub is just a server-side wrapper.
 *
 * When this template is cut into its own `pnpm create` scaffolder,
 * this file goes away; the client page becomes the only entry.
 */

import GameStarterPage from "templates/webxr-game-starter/page";

export const metadata = {
  title: "WebXR Game Starter — Holoflow Studio",
  description:
    "Minimal scaffold for a WebXR game built on the studio's framework primitives.",
};

export default function Page() {
  return <GameStarterPage />;
}
