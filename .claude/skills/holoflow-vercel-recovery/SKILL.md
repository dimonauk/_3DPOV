---
name: holoflow-vercel-recovery
description: >
  Diagnose and recover from failed Vercel production deployments of
  Holoflow Studio. Holoflow-specific facts (project ID, team scope,
  production branch, deploy trigger), the diagnostic flow (vercel ls →
  vercel inspect --logs → classify the error → apply the fix → verify),
  and the catalogue of root-cause patterns we've actually seen. Load
  when: a prod deploy is failing or has failed, "vercel build error",
  "deployment failed", "site is down", "holoflow.co.uk is broken",
  "rollback", "production error", "Build failed", "ReferenceError"
  in a Vercel log, "Module not found" in a Vercel log, "type error"
  blocking deploy, or anything that smells like a prod incident on
  this repo. For generic Vercel guidance see the `vercel:*` skills.
---

# Holoflow Studio — Vercel Production Recovery

## The basics — never look these up again

| Thing | Value |
|---|---|
| Vercel project | `holo-flow-studio` |
| Project ID | `prj_OL8EhE56VIv8tu88mbNReC4rzy19` |
| Org / team ID | `team_RTNI5Ycn7A2676LZJi1xJCZG` (also seen as scope `dimonauk-9379s-projects`) |
| Source repo | `dimonauk/_3DPOV` on GitHub |
| Local repo | `D:\.github\_3DPOV` |
| Production branch | `holoflow-commerce` |
| Preview branch (env-var scope) | `master` |
| Deploy trigger | `git push` to `holoflow-commerce` |
| Project link file | `D:\.github\_3DPOV\.vercel\repo.json` |
| Domain | `holoflow.co.uk` |

The Vercel CLI is installed at `C:\Users\dimon\AppData\Local\pnpm\vercel`.
It auto-detects this repo's scope; no `--scope` flag needed.

The Vercel MCP server (`mcp__plugin_vercel_vercel__*`) is bound to a
different scope and currently 403s on this project — **use the CLI**, not
the MCP, for this codebase.

## The diagnostic flow

Always in this order. Don't skip steps.

**1. Confirm the failure**

```pwsh
vercel ls --yes
```

You're looking for the top row's status. `● Ready` = healthy. `● Error` =
build failed. `● Queued` / `● Building` = in flight; wait. Note how many
consecutive errors there are — a single error is a regression in the
latest commit; a streak means an older breakage that nothing has fixed.

**2. Pull the build logs**

```pwsh
vercel inspect <full-deployment-url> --logs 2>&1 | tail -100
```

Use `--wait` if the deployment is still in flight. Pipe to `tail -100`
because Vercel logs are long and the error is almost always near the end.

**3. Classify the error** (see the catalogue below).

**4. Apply the fix** as a commit on `holoflow-commerce`. Type-check
locally (`pnpm tsc --noEmit`) before pushing — Vercel runs TS, and a
build that fails type-check just adds another error to the streak.

**5. Push and verify**

```pwsh
git push origin holoflow-commerce
# Wait for the new deploy:
vercel inspect <new-url> --logs --wait 2>&1 | tail -50
```

Look for `Build Completed in <duration>` and `status\t● Ready`.

## The catalogue of root causes (Holoflow-specific)

### A. `ReferenceError: self is not defined` during prerender

**Cause**: a module on a "use client" component's import path touches
browser globals (`self`, `navigator.gpu`) at top level. PPR
(`experimental.ppr: true`) still server-renders the client component
once to produce the static HTML shell, which evaluates the module.

**Most likely culprit modules**: `three/webgpu`, `three/tsl`,
`onnxruntime-web`, `@huggingface/transformers`, older `@react-three/xr`.

**Fix**: type-only import + dynamic import inside a useEffect. The full
pattern lives in the `holoflow-ssr-safe-three` skill. Reference fix is
commit `6d53c32` on `app/atelier/rig-simulator/rig-simulator-client.tsx`.

### B. `Module not found` / `Cannot find module`

**Cause** (Holoflow-specific): tsconfig `moduleResolution` mismatch (we
use `"bundler"` — `"node"` breaks subpath exports like `three/webgpu`),
OR a sibling file was renamed / moved without updating its consumers,
OR a new package was added to `package.json` but `pnpm-lock.yaml` wasn't
committed.

**Fix**:
- For tsconfig: ensure `moduleResolution: "bundler"` in `tsconfig.json`.
- For renames: `git grep` the missing path, update the consumers.
- For lockfile: `pnpm install` locally, commit the lockfile update.

### C. TypeScript error blocks build

**Cause**: usually `noUncheckedIndexedAccess` (we have it on) — array /
record access without a fallback for `undefined`.

**Fix**: add the `?? fallback` or a narrowing guard. Don't downgrade
the tsconfig flag to make the error go away; the flag earns its keep.

### D. `Cannot set Production Branch ... for a Preview Environment Variable`

**Cause**: you ran `vercel env add ... preview holoflow-commerce`.
`holoflow-commerce` IS the production branch; preview env vars can't
target it.

**Fix**: scope preview env vars to `master`:
`vercel env add KEY preview master`.

### E. `vercel env add --value --yes` rejected (CLI v53 bug)

**Cause**: known regression in Vercel CLI v53.x for unattended preview
adds.

**Fix**: omit `--yes`, type the value into the prompt. Or upgrade the
CLI and retry.

### F. Stale Shopify Storefront token → preview 401s

**Cause**: prod deploy succeeds (token valid in prod env) but a preview
deploy fails or returns 401s on storefront calls because the preview
env var wasn't updated.

**Fix**:
```pwsh
vercel env rm SHOPIFY_STOREFRONT_ACCESS_TOKEN preview master --yes
vercel env add SHOPIFY_STOREFRONT_ACCESS_TOKEN preview master
```

### G. Firebase Auth: `auth/configuration-not-found`

**Not a deploy failure** — runtime auth fault. Listed here because it
looks like a deploy issue to a casual reader. Fix: enable Google +
Email Link providers in the Firebase Console and add `holoflow.co.uk`
to Authorised domains. The deploy was fine.

### H. Build cache poisoning (rare)

**Cause**: a successful build cached an artefact (e.g. `node_modules`
state) that a later commit can't reproduce, and every subsequent build
errors at the same point.

**Symptom**: identical error across many consecutive deploys, but the
error only mentions files you haven't touched.

**Fix**: in the Vercel dashboard, **Project Settings → General → Build
& Development Settings → Clear Build Cache**, then redeploy.

### I. Out-of-memory at build

**Cause**: 2-core / 8 GB build machine OOMs on a particularly heavy
turbopack compile.

**Symptom**: build aborts with no clear error, often around "Generating
static pages" stage.

**Fix**: bump the project to a larger build machine in Vercel project
settings, or chunk the static-generation set (e.g. reduce
`generateStaticParams` count for content-heavy routes).

## Anti-patterns

- **Don't rollback by force-pushing on top of HEAD.** Use Vercel's
  "Promote to Production" on a known-good deployment if you need to
  recover instantly, then fix forward on a new commit.
- **Don't silence type-check errors with `// @ts-expect-error` to ship
  a deploy.** It just kicks the can; the next person reading the code
  inherits a latent bug.
- **Don't bump `next` / `react` / `three` versions during an incident
  recovery.** Recover first with the smallest possible diff; do version
  bumps on their own commit after prod is green.
- **Don't drop `experimental.ppr` to "fix" SSR.** PPR is load-bearing
  for the site's static-shell-first rendering; turning it off makes
  every page dynamic and slows everything down. Fix the SSR-unsafe
  module instead (see catalogue entry A and the `holoflow-ssr-safe-three`
  skill).

## Recent history (so future me has receipts)

- **2026-05-14, ~7h–1h ago**: 9 consecutive prod deploys errored on
  `ReferenceError: self is not defined` while prerendering
  `/atelier/rig-simulator`. Root cause: `three/webgpu` imported at top
  of `simulator.ts`, which was statically imported from the client
  component. Fix commit `6d53c32` on `holoflow-commerce`. Deploy
  `k554kgoh9` came up Ready in 2m.

When a new pattern lands, add it to the catalogue.
