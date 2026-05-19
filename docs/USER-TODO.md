# Dimona's step-by-step — the things only your hand can do

The autopilot + agents do most of the work; this list is the bits that
need your eye, your account access, or your bench. Tick off as you go.

---

## Critical (unblocks autopilot + prod deploys)

- [ ] **Flip GitHub default branch** to `main`
  - GitHub → `dimonauk/_3DPOV` → Settings → Branches → Default branch → switch from `holoflow-commerce` → `main`
  - Without this, the 24/7 Blender Content Mill routine clones the wrong branch on first run.

- [ ] **Flip Vercel production branch** to `main`
  - Vercel → `holo-flow-studio` project → Settings → Git → Production Branch → change from `holoflow-commerce` → `main`
  - Without this, `git push origin main` doesn't trigger a production deploy.

---

## Secrets to set in Vercel (one-time, copy from `.env.example`)

For features that already shipped but need their keys:

- [ ] `CRON_SECRET` — for `/api/cron/*` (refresh-feeds, refresh-watchers, discord-reconcile, patreon-reconcile)
- [ ] `FEED_INGEST_TOKEN` — for `/api/internal/feed-ingest` (the bench-bridge git activity ingestion)
- [ ] `FEDIVERSE_ACTOR_PUBLIC_KEY` + `FEDIVERSE_ACTOR_PRIVATE_KEY` — for ActivityPub. Generate via:
  ```bash
  openssl genpkey -algorithm RSA -out private.pem -pkeyopt rsa_keygen_bits:2048
  openssl rsa -pubout -in private.pem -out public.pem
  ```
  Paste both PEM contents into Vercel env vars (full multi-line including BEGIN/END markers).
- [ ] `OLLAMA_BASE_URL` + `OLLAMA_MODEL` — only if you want the per-person agent chat at `/agents/<slug>` to reach a remote Ollama (default is `http://localhost:11434` + `qwen3:8b`)
- [ ] `NEXT_PUBLIC_KINECT_BRIDGE_URL` + `NEXT_PUBLIC_KINECT_BRIDGE_TOKEN` — only if you want the Kinect tracking source live in production
- [ ] `GITHUB_TOKEN` — optional, raises the GitHub releases watcher rate-limit from 60/h → 5000/h. Personal-access-token, read-only `public_repo` scope is enough.

---

## Bench-side work (Sovereign-PC, Blender, OBS)

These are things only the bench can do — the remote autopilot can't reach Blender or run a screen recorder.

- [ ] **Set up the bench-side git-activity poller**
  - The polymaths feed routine expects this. Sketch shipped at `scripts/bench/poll-git-activity.mjs`.
  - On Sovereign-PC: schedule it to run every 15 min via Task Scheduler. It posts new commits from `D:\.github\_3DPOV` + `D:\The_Hangar` + `D:\The_Hangar\Dolly_OS` to `/api/internal/feed-ingest`.
  - Needs `FEED_INGEST_TOKEN` from above set as a local env var.

- [ ] **Install the holoflow_webxr_exporter Blender add-on**
  - On Sovereign-PC: zip up `tools/blender-addon/holoflow_webxr_exporter/`, install via Blender → Edit → Preferences → Add-ons → Install...
  - The studio's canonical glTF export with the Y-up + Draco-6 + WebP + snake-case + facet conventions.

- [ ] **Run the Blender-MCP tutorial blueprints to produce the binary artefacts**
  - Each `components/tutorials/entries/blender-mcp-*.tsx` has the .py inline; copy → Blender scripting tab → Run Script.
  - Expected outputs land under `public/library/blends/<topic>/<slug>/<name>.blend` + `<name>.glb` + `thumb.png`.
  - Then flip the matching `.expected-artefacts.json` `status: pending` → `status: present` and commit.
  - Currently pending: `faceted-sphere`, `parametric-torus`, `tetra-fractal`, `cube-walker` (4 entries from a7b0c50c's batch).

- [ ] **Download the OSS device GLBs**
  - 23 entries catalogued at `lib/devices/entries/*.ts` with sources in `public/models/devices/<category>/_attributions.json`.
  - Visit each Sketchfab/Poly Pizza URL, download the .glb (CC0 — no account needed), drop into `public/models/devices/<category>/<slug>.glb`.
  - Flip `modelPresent: false` → `true` in the entry file as you go.
  - Until done, the gallery + WebXR RetroArch room render category-tinted primitives instead.

- [ ] **Record viewport.mp4 + screen.mp4 for the Content Mill outputs**
  - Each new mill entry under `public/library/blends/<topic>/<slug>/` ships `record.py` + `SCREEN-RECORDING-NOTES.md`.
  - `record.py` is bpy-runnable → produces `viewport.mp4` automatically.
  - `screen.mp4` is OBS-driven (manual).
  - Commit both into `public/library/videos/<topic>/<slug>/` when ready.

---

## Routine + agent management

- [ ] **The 24/7 Blender Content Mill** is at https://claude.ai/code/routines/trig_01WHz2JCSPTWKqKGVKGDbepj
  - Fires every hour at the top of the hour, UTC.
  - Kill switch: flip `enabled` off on that page when you want it paused.
  - Currently producing one tutorial + library blueprint + record.py per hour. Commit messages start `feat(mill):`.

- [ ] **Consider whether to delete obsolete branches after the GitHub default flip**
  - `claude/skeleton-build` — superseded by `main`
  - `holoflow-commerce` — once Vercel prod branch is moved to `main`, this becomes legacy
  - Keep them around for ~a week in case anything needs git-archaeology, then delete.

---

## Optional / nice-to-have (no rush)

- [ ] **Cut the studio's first commercial Eden / Azahar bench-bridge**
  - The `docs/EMULATION-NATIVE.md` write-up recommends starting with Eden + Azahar + PPSSPP behind the Tailscale Funnel pattern.
  - This is the path to actually playing Switch / 3DS / PSP titles on the site (above the EmulatorJS PS2 ceiling).
  - Probably a weekend of work; not urgent.

- [ ] **Migrate from the ad-hoc agent specialists pattern to the lib/game/ primitives**
  - The framework's `lib/game/input-router.ts` + `audio-bus.ts` + `game-state.ts` are shipped + waiting for the rest of the framework to migrate to them.
  - The webxr-game-starter template at `/templates/webxr-game-starter` is the worked example.

- [ ] **Review the merge-staging deferred items** at `docs/MERGE-STAGING-FOLD-IN.md`
  - The 7 `docs/*-CANON.md` files + `lib/agents/` + `lib/cast/` modules were left out of the auto-fold-in because they'd conflict with the more recent `app/admin/agents/` shape.
  - Worth a 30-min review pass when you have a free Sunday.

---

## Where to look for status

- **Vercel deployments** — https://vercel.com/dimonauk-9379s-projects/holo-flow-studio/deployments
- **The branch** — `git log --oneline -20 origin/main` shows the last 20 commits
- **The 24/7 routine** — https://claude.ai/code/routines/trig_01WHz2JCSPTWKqKGVKGDbepj
- **Memory notes the agents share** — `C:\Users\dimon\.claude\projects\C--\memory\`
- **The framework skill** — `~/.claude/skills/holoflow-webxr-framework/SKILL.md` (auto-loads when future sessions touch the framework)

Last updated: 2026-05-19, after the great branch unification + 24/7 autopilot setup round.
