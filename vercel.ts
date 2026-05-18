/**
 * vercel.ts — Typed Vercel project configuration.
 *
 * Mirrors `vercel.json` 1-for-1; the .json file stays in place as a
 * fallback. Vercel picks `vercel.ts` first when both are present, but
 * keeping the .json around makes the migration reversible — delete
 * this file and Vercel falls back to the .json without any further
 * change.
 *
 * # Why migrate
 *
 * `vercel.ts` is the current recommendation: it gives TypeScript-typed
 * config (auto-complete + compile-time validation of header/redirect
 * shapes), allows environment-conditional logic (different headers per
 * `deploymentEnv`), and reuses the same `HeaderRule` / `Redirect`
 * shapes the platform's OpenAPI schema defines.
 *
 * # When to delete vercel.json
 *
 * After this file ships through one full preview-deploy + production
 * promotion without surprises, the .json fallback can be deleted. Until
 * then it's the rollback safety net.
 */

import type { VercelConfig } from "@vercel/config/v1";

// NOTE: must be `export default`, NOT `export const config`. The
// @vercel/config@0.5.0 CLI's auto-collect path wraps every named
// export under its own key (so `export const config = {...}` compiles
// to `{ "config": {...} }`, which Vercel rejects at config-load with
// no build events). The CLI's default-export path spreads correctly.
// `satisfies` keeps the type check without forcing a named const.
export default {
  framework: "nextjs",
  buildCommand: "pnpm run build",
  installCommand: "pnpm install --frozen-lockfile",
  crons: [
    {
      // Daily sweep of pending Rookery nurture emails (Day 3 + Day 7).
      // The handler at /api/cron/rookery-pending-emails is gated by
      // CRON_SECRET; Vercel auto-injects the bearer header on cron-
      // triggered invocations. Cadence 00:00 UTC = ~1am EU / ~7pm
      // previous-day US, which lands the orient email morning EU /
      // evening US on the actual delivery day.
      path: "/api/cron/rookery-pending-emails",
      schedule: "0 0 * * *",
    },
  ],
  headers: [
    // .mind files — long-lived, immutable. They're content-addressable
    // by slug so a re-publish gets a new path.
    {
      source: "/cards/:slug/target.mind",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
        { key: "Content-Type", value: "application/octet-stream" },
        { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
      ],
    },
    // GLB models — same immutability posture.
    {
      source: "/cards/:slug/model.glb",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
        { key: "Content-Type", value: "model/gltf-binary" },
      ],
    },
    // USDZ models — iOS AR Quick Look path.
    {
      source: "/cards/:slug/model.usdz",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
        { key: "Content-Type", value: "model/vnd.usdz+zip" },
      ],
    },
    // Card-front + QR images — shorter TTL because they can be
    // re-rendered when card metadata changes.
    {
      source: "/cards/:slug/(card-front|qr).(png|svg)",
      headers: [{ key: "Cache-Control", value: "public, max-age=604800" }],
    },
    // The /c/<slug> AR card landing needs camera + motion-sensor
    // permissions for the AR scene; Permissions-Policy gates them
    // explicitly to "self" so embeds in third-party iframes don't
    // silently inherit them.
    {
      source: "/c/:slug",
      headers: [
        {
          key: "Permissions-Policy",
          value:
            "camera=(self), gyroscope=(self), accelerometer=(self), magnetometer=(self)",
        },
      ],
    },
    // Global safety headers — apply to every route.
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ],
    },
  ],
} satisfies VercelConfig;
