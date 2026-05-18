# Agent coordination log

Append-only log. Newest entries at the top. Add a line before doing any
structural change so other agents can see what's in flight.

Format: `## YYYY-MM-DD HH:MM — branch — agent/session note`

---

## 2026-05-18 ~17:50 UTC — holoflow-commerce — REPO SPLIT (services/ removed)

**Done:** Moved `services/` (304 files, 12.2 MB of vendored Python ML
projects) out of this Vercel-deployed Next.js repo to
`D:\The_Hangar\holoflow-services\` as a sibling working directory.

**Why:** Production builds were OOMing on Vercel's 4 GB build machines.
The previous session's flailing fix (`cb44e54`) disabled build-time
TypeScript and ESLint checks — that papers over the symptom but loses
type safety in prod. The real fix is to stop shipping 12 MB of Python
through the Next.js build trace.

**What other agents need to know:**

- No JS/TS imports point at `services/` (verified before the move with
  `git grep`). Safe.
- `functions/` stayed in place (only 0.1 MB and `firebase.json` references
  it directly).
- `.vercelignore` was added belt-and-braces in case `services/` ever
  reappears.
- `next.config.ts` `outputFileTracingExcludes` extended to include
  `services` and `functions` as a backup.
- `AGENTS.md` at the repo root has the durable rules — read it before
  making structural changes.

**Open follow-ups:**

- After the next successful build, revert `cb44e54` (re-enable build-time
  type checking + ESLint). The OOM should be gone.
- Watch the next 3-5 production builds. If they all turn green, the split
  worked. If they still OOM, the next target is `lib/holo-walk/data.ts`
  (1,847 lines) and any chamber pulling in heavy WebGPU + WASM.

## 2026-05-18 ~16:00 UTC — holoflow-commerce — Pro hardening session

Six commits landed: edge middleware (`middleware.ts`), security headers
in `vercel.json`, daily cron janitor for stranded scan-temp blobs,
distributed rate limiter (`lib/rate-limit/`, auto-detects Upstash), CSP
in report-only mode (`lib/security/csp.ts`, sink at `/api/csp-report`),
and the Pro-tier deferred items. See `docs/CHANGELOG.md` for the full
list. All from this Claude session.

## 2026-05-17 — claude-holo-83a937 — large WIP branch (now deleted)

Failing previews from a branch that imported `lib/shape-of-it/chambers`
and `lib/shape-of-it/labyrinth` before those modules existed. The
modules have since been added on `holoflow-commerce` (commits `cf8b542`
and later), so any revival of that work pattern should now build.

---

To add an entry: prepend to the top of the list above this line. Don't
edit existing entries — log is append-only.
