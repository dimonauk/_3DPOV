# Commit-to-main runbook

How a contributor — Claude session, another agent, or a human — gets
a change onto `main` and into production at `holoflow.co.uk`.

Read **`AGENTS.md`** first if you haven't (orientation). This doc is
the operational mechanics that go alongside it.

---

## TL;DR

1. **Branch off latest `main`** as `claude/<short-slug>`. Never push
   directly to `main` — open a PR.
2. **Make your change.** Keep the diff minimal; one logical commit per
   PR; keep orchestrator files under 300 lines.
3. **Typecheck**: `pnpm exec tsc --noEmit` must exit 0.
4. **Build (for non-trivial changes)**: `pnpm run build` must reach
   "Generating static pages" without errors.
5. **Commit + push** the branch. Open a PR against `main`. Wait for
   the Vercel preview to go ✅ READY.
6. **Merge** when reviewed (`gh pr merge` or the GitHub UI). Don't
   squash unless the branch had churn worth flattening — `--no-ff`
   merges preserve the branch context.
7. **Watch the production deploy** reach READY. Smoke-test the page
   you touched at `https://holoflow.co.uk/<path>`.

---

## Repo facts

| Field | Value |
|---|---|
| Production branch | **`main`** (flipped from `holoflow-commerce` on 2026-05-20 in commit `7c0bb41`) |
| Production URL | `https://holoflow.co.uk` |
| Vercel project | `prj_OL8EhE56VIv8tu88mbNReC4rzy19` (team `team_RTNI5Ycn7A2676LZJi1xJCZG`, slug `dimonauk-9379s-projects`) |
| Package manager | **`pnpm`** — never `npm`. Lockfile is `pnpm-lock.yaml`. |
| Node | 24 LTS (Vercel default; matches the build sandbox) |
| Next.js | 15.6.0-canary.60 with **Turbopack**, PPR + useCache experiments **enabled** |
| Healthz | `https://holoflow.co.uk/api/healthz` — returns the deployed sha + branch + rate-limit backend |

`holoflow-commerce` is **stale** — the old production branch. Don't
push to it; the Vercel project no longer deploys from there.

---

## The workflow, step by step

### 1. Sync `main`

```powershell
cd D:\.github\_3DPOV
git checkout main
git pull --ff-only origin main
```

If `--ff-only` fails, you have local commits on `main` — investigate.
Don't merge upstream into a dirty main; rebase your work onto a
fresh branch instead.

### 2. Branch off

Naming convention: `claude/<short-kebab-slug>`. The slug should
describe the change, not the agent:

```powershell
git checkout -b claude/<short-slug>
```

Good slugs: `agents-md-main-as-production`, `footer-suspense-fix`,
`stack-drop-arrow`, `watchers-store-upstash-timeout`.

Bad slugs: `update-1`, `claude-fix`, `2026-05-22-changes`.

### 3. Make the change

- Touch the minimum number of files.
- Follow the rules in `AGENTS.md` ("Rules you should know before you
  touch code"): pnpm only, `createLogger("namespace")` not
  `console.*`, `isAdminEmail()` not inline lists,
  `createFixedWindowLimiter()` on visitor-facing AI routes, capability
  stubs return `service-unavailable` instead of throwing, the
  300-line cap on orchestrator files.
- For deploy-affecting changes, read the `holoflow-deploy-gotchas`
  skill before you push. Known traps:
  - Don't `export const dynamic = "force-dynamic"` on a page that's
    not strictly per-request. The canary + PPR combo currently returns
    200 + 0 bytes for those pages — see `app/page.tsx` for the right
    pattern (sync shell, async data in `<Suspense>` children).
  - Don't `export const runtime = "nodejs"` in route handlers. Next
    picks the runtime automatically.
  - Don't import from `services/` — it lives at
    `D:\The_Hangar\holoflow-services\` now (see AGENTS.md rule #1).
    Call bench services over HTTP.

### 4. Typecheck

```powershell
pnpm exec tsc --noEmit
```

Must exit 0. The Vercel build runs this and will fail the deploy on
any TS error.

If you're working in a webpack-fragile area (heavy native deps,
Three.js variants, Mediapipe, ONNX), also run the production build
locally before pushing:

```powershell
Remove-Item -Recurse -Force .next   # wipe stale validator
pnpm run build
```

Build target is `next build --turbopack`. Expect ~4-6 minutes.
Watch for the "Generating static pages (N/N)" line and any warnings
that mention modules you touched.

### 5. Commit

Conventional-commit style:

```
<type>(<scope>): <one-line summary>

<wrap at 72 cols; explain the why, not the what>
```

Types in active use: `feat`, `fix`, `docs`, `chore`, `refactor`,
`test`, `build`. Scopes are free-form but should map to a directory
or system (`footer`, `news`, `watchers`, `routes`, `infra`, etc.).

End the commit body with the Claude Code session URL:

```
https://claude.ai/code/session_<your-session-id>
```

(Replace with the real session id from your harness if you're a
Claude session; humans can omit.)

Stage explicitly — never `git add .` — so secrets / scratch files
don't sneak in:

```powershell
git add path/to/file1.tsx path/to/file2.ts
git commit -m "..."
```

### 6. Push + open the PR

```powershell
git push -u origin claude/<short-slug>
```

Then open a PR via the GitHub UI (the push output prints a
ready-made compare URL) or `gh pr create --base main`. Include:

- **Summary** (1-3 bullets) — what + why.
- **Test plan** (markdown checklist) — what you verified before
  pushing.
- **Out of scope** — anything you noticed but deliberately deferred.

If the change is genuinely **docs-only and operational** (e.g.,
fixing a stale reference in `AGENTS.md`), you may push direct to
main. Everything else — even small TS / TSX edits — goes through a
PR.

### 7. Watch the Vercel preview

The PR will trigger a Vercel preview deploy. Wait for it to go ●
Ready. If it errors:

- Open the build log via the inline Vercel comment on the PR.
- The `holoflow-deploy-debug` skill is the runbook; the
  `holoflow-deploy-gotchas` skill catalogues recurring failures
  (asset-module rules, two-parallel-pages-same-path, ssr=false +
  dynamic, @mediapipe/@sparkjsdev module-not-found, etc.).
- Fix on the same branch and push again.

### 8. Merge

Via GitHub UI: choose **"Create a merge commit"** (preserves the
branch context). Avoid "Squash and merge" unless the branch had
fixup commits worth flattening.

Via CLI (no `gh`):

```powershell
git checkout main
git pull --ff-only
git merge --no-ff claude/<short-slug> -m "Merge claude/<short-slug> into main"
git push origin main
git push origin --delete claude/<short-slug>
```

### 9. Watch the production deploy

After the merge, Vercel triggers a production deploy from `main`.
Watch it via the Vercel dashboard or `mcp__claude_ai_Vercel__list_deployments`
if you're an MCP-equipped agent. Typical build is ~4-6 minutes.

Once it goes ● Ready, confirm production picked it up:

```powershell
curl https://holoflow.co.uk/api/healthz
```

The `sha` field should match the merge commit's short hash.

Smoke-test the page you touched. If anything regresses, revert the
merge:

```powershell
git revert -m 1 <merge-commit-sha>
git push origin main
```

Don't delete-and-force-push to roll back — leave the history honest.

---

## Production-deploy environment variables

These are set on Vercel Production + Preview + Development. You
shouldn't need to touch them often, but knowing they exist:

| Env var | What it's for |
|---|---|
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob (public) — user uploads |
| `PRIVATE_BLOB_READ_WRITE_TOKEN` | Vercel Blob (private) — admin media |
| `FIREBASE_ADMIN_SERVICE_ACCOUNT` | Firestore Admin SDK JSON |
| `NEXT_PUBLIC_FIREBASE_*` × 7 | Firebase Auth client config |
| `CRON_SECRET` | Vercel Cron auth header |
| `ADMIN_EMAILS` + `NEXT_PUBLIC_ADMIN_EMAILS` | Admin gating |
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | Rate-limit + cache backend |

For the optional / capability-gated env vars (Stripe, Apple Wallet,
Google Wallet, Resend, AI Gateway, etc.), see
`docs/cards-infrastructure.md` and `docs/SHIP-PLAN.md`. Each surface
returns 503 with a friendly message when its env isn't set; nothing
crashes.

To add a new env var:

```powershell
vercel env add <NAME> production
vercel env add <NAME> preview
```

(Install the Vercel CLI first: `npm i -g vercel`. The agentic harness
doesn't ship it.)

---

## Parallel-agent etiquette

Multiple sessions may be working at once. Coordination lives in
`docs/AGENT-COORDINATION.md` — an append-only log. Before structural
changes (renames, large refactors, dep bumps, branch flips, env-var
shape changes), add a one-line entry at the top so other sessions
see what's in flight.

Format:

```markdown
## YYYY-MM-DD HH:MM UTC — <branch> — <short note>
```

If you see a `Dimona <dimonaauk@gmail.com>` commit land while you're
working, that's a parallel agent on the same branch. Stay on your
own feature branch; rebase or merge forward when ready to ship.

---

## Things to avoid

- `git push --force` to `main`. Anything on `main` is published. If
  you really need to rewind, revert with a new commit.
- `git commit --amend` after pushing. Same reason; rewrites history
  other sessions may have based work on.
- `git rebase` on `main`. Rebase your feature branch onto `main`
  before merging if you must, never the other way.
- `pnpm install --force` or skipping the lockfile. The lockfile is
  the contract; if a dep needs updating, update it deliberately and
  commit the lockfile change with the rest.
- `git push --no-verify`. Hooks are there for a reason.
- Re-adding `services/` to this repo. See AGENTS.md rule #1.

---

## When in doubt

- Read the relevant `**.PURPOSE.md` next to the file you're touching
  (if one exists).
- Read the `**/AGENTS.md` for the directory (e.g.,
  `app/AGENTS.md`, `app/api/AGENTS.md`).
- Search for prior commits touching the file —
  `git log --oneline <path>` — to see the recent conventions in
  practice.
- Ask before you delete or rename anything load-bearing
  (`AGENTS.md`, `.vercelignore`, `docs/CHANGELOG.md`,
  `docs/AGENT-COORDINATION.md`, the `lib/rate-limit/` interface).

---

## See also

- **`AGENTS.md`** — top-level orientation (don't-list, route map,
  rules-of-the-road)
- **`docs/SHIP-PLAN.md`** — what's done + what's left + phase
  ordering
- **`docs/AGENT-COORDINATION.md`** — append-only log of in-flight
  work
- **`docs/cards-infrastructure.md`** — env-var contract for the
  Cards / AR card stack
- **`docs/vercel-setup.md`** — the Vercel-side configuration
  (branch-to-deploy, env vars, branch-per-stage)
- **`docs/TERMIUS-SETUP.md`** — SSH into the bench machines over
  Tailscale
- **`holoflow-deploy-debug` skill** — when a deploy goes ● Error
- **`holoflow-deploy-gotchas` skill** — recurring build-time
  failures with exact symptom → fix mappings
