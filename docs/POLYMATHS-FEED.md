# Polymaths Feed

One chronological view of the studio's working life: commits across Holoflow / Hangar / Dolly OS, GitHub releases of every wired dependency, plus AI/ML release news (Hugging Face, arXiv, GitHub-org atom feeds). Renders at `/news`. Atom at `/news/feed.xml`. Operator console at `/admin/watchers`.

The studio is a polymath — a workshop, a feed, a 3D pipeline, a printer-bed orchestrator, an AR card cottage industry. The feed is the place where those threads land in one column so the operator (and anyone reading) can see what shipped today across every surface.

## Sources

| Source | What | Cadence | Where the code lives |
| --- | --- | --- | --- |
| Holoflow commits | `dimonauk/_3DPOV` via GitHub API | hourly | `lib/watchers/sources/holoflow-git.ts` |
| Hangar commits | Bench-side `git log` POSTed to ingest route | every 15 min from the bench | `lib/watchers/sources/git-bench.ts` |
| Dolly OS commits | Same bench pipeline as Hangar | every 15 min from the bench | `lib/watchers/sources/git-bench.ts` |
| GitHub releases | Every repo in `OPEN-SOURCE-STACK.md` | hourly | `lib/watchers/sources/github-releases.ts` |
| Hugging Face models | Curated allow-list, recent-modified | hourly | `lib/watchers/sources/huggingface-models.ts` |
| arXiv papers | cs.GR / cs.CV / cs.LG, last-updated | hourly | `lib/watchers/sources/arxiv.ts` |
| GitHub org activity | `https://github.com/<org>.atom` for the orgs in `lib/watchers/config.ts` | hourly | `lib/watchers/sources/org-atom.ts` |

The repo list is read live from `docs/OPEN-SOURCE-STACK.md` — there is no second source of truth. Add a row to that doc, and the next watcher run picks it up. Allow-lists for Hugging Face authors, arXiv categories, and GitHub orgs live in `lib/watchers/config.ts` because they're not in the OSS doc.

## Cron

The hourly run lives at `/api/cron/refresh-watchers`, registered in `vercel.json` under `crons` on a `0 * * * *` schedule. It's gated by `CRON_SECRET` in the same way as `/api/cron/refresh-feeds`. The run is wrapped in per-source try/catch so a failing endpoint (a Hugging Face wobble, GitHub rate-limit) doesn't poison the rest.

After a successful run the route calls `revalidatePath("/news")` and `revalidatePath("/admin/watchers")` so the next page render sees the fresh entries without waiting on the static cache.

## Bench bridge for Hangar + Dolly OS

Hangar and Dolly OS don't have public GitHub remotes. The watcher can't reach them from a Vercel function. The bench-side script `scripts/bench/poll-git-activity.mjs` solves it:

1. Runs on Sovereign-PC every 15 minutes (Task Scheduler or a `pnpm dlx` wrapper).
2. Walks the three local clones, runs `git log` since the last seen SHA per repo.
3. POSTs the diff to `https://holoflow.co.uk/api/internal/feed-ingest` with a bearer token.
4. The ingest route validates with Zod, normalises into `FeedEntry`, and merges into the same store the cron writes to.

State (last-seen SHA per repo) is kept in `.bench/git-poller-state.json` next to the script. First run reports the most recent 50 commits per repo so the operator has a baseline.

### Env vars

| Var | Where | Why |
| --- | --- | --- |
| `CRON_SECRET` | Vercel | Gates `/api/cron/refresh-watchers`. Bearer token expected on the cron header. |
| `FEED_INGEST_TOKEN` | Vercel + bench `.env.bench` | Gates `/api/internal/feed-ingest`. Same token on both sides. |
| `GITHUB_TOKEN` (optional) | Vercel | Raises the GitHub API rate limit from 60/h to 5000/h. Public-repo read scope is enough. |
| `KV_REST_API_URL` + `KV_REST_API_TOKEN` (optional) | Vercel | If set, the feed snapshot is stored in Upstash. If not, the on-disk file at `data/polymaths-feed.json` is the only store — fine for dev. |
| `HOLOFLOW_FEED_INGEST_URL` | bench `.env.bench` | Where the poller POSTs. |
| `HOLOFLOW_REPO` / `HANGAR_REPO` / `DOLLYOS_REPO` (optional) | bench `.env.bench` | Override the default repo paths. |

## Store

Dual backend. If Upstash is configured the snapshot lives at key `polymaths:feed`. Otherwise it's `data/polymaths-feed.json`. Either way, the store is capped at 1000 entries newest-first, deduped by `FeedEntry.id`.

The store is read on every render of `/news` (`force-dynamic`). For a tiny snapshot like this the cost is negligible; if it ever grows past 10k entries we'd want a real DB. We're nowhere near that.

## Auto-install — manual fulfilment

When the watcher sees a release for a "lined up" dep from `OPEN-SOURCE-STACK.md`, it queues a suggestion in `data/polymaths-install-queue.json`. The operator sees it at `/admin/watchers` and runs the suggested `pnpm add` command locally.

The route is **not** autonomous. Vercel's runtime filesystem is read-only and even if it weren't, an automated `pnpm add` on every release is the kind of supply-chain hazard the studio doesn't need. The queue + the operator's hand is the right shape.

After running `pnpm add` locally, the operator clicks "Mark handled" in the console — that hits `/api/admin/watchers/install-ack`, which flips the suggestion's `acked` flag. Acked suggestions stay on disk for audit but don't show up in the active queue.

## Adding a new source

1. Drop a `lib/watchers/sources/<name>.ts` that exports a function returning `{ entries: FeedEntry[]; error?: string }`. Match the shape of the existing fetchers.
2. Add a call to it in `lib/watchers/refresh.ts` inside `runSource`.
3. If the source has a curated allow-list (orgs, categories), add it to `lib/watchers/config.ts`.
4. Add a row to the **Sources** table above.
5. Add a row to `OPEN-SOURCE-STACK.md` if the source depends on a new OSS library.

## Adding a new repo to watch

Add the row to `OPEN-SOURCE-STACK.md`. That's it. `parse-oss-stack.ts` reads the doc every refresh and surfaces every `github.com/<owner>/<repo>` link.

## Open questions

- The bench script runs on Sovereign-PC. The day Sovereign-PC is offline, Hangar + Dolly OS commits stop landing in the feed. A Gitea mirror on the bench (exposed over Tailscale Funnel like the other bench services — see `holoflow-bench-bridge` skill) would mean the website could pull directly. Worth doing once the feed proves itself.
- GitHub release notes can be long. We truncate to 600 chars; a future enhancement is to surface the full body on a dedicated `/news/<id>` page. Cheap to add when there's a reason.
- Hugging Face's `lastModified` includes weight reuploads and README touches, not just new model versions. The allow-list filtering keeps the noise tolerable; if it gets loud we can add a "min-likes" or "must-have-pipeline-tag" filter.
