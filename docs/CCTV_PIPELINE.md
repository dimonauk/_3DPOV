# CCTV pipeline — runbook

This is the studio-side runbook for turning public CCTV stills (and
the studio's own 360 archive) into gaussian-splat `.ply` files that
land on the Holo-Flow Studio site under `/play/neo-london`. The site
itself is dumb here: Vercel serves whatever `.ply` files are in
`public/splats/` and whatever metadata is in
`data/neo-london/zones.json`. Everything before that runs on the
workstation.

For the SHARP model itself — how to clone Apple's repo, install the
weights, and run a single image through the CLI by hand — see
`docs/SHARP_PIPELINE.md`. This document is the sibling: the batch
orchestration around SHARP, end to end.

## What the pipeline does

```text
1. cctv-fetch.ts   — pulls JPGs from TFL JamCams (and friends) into tmp/staging/
2. sharp-runner.py — runs Apple SHARP on each staged image, writing .ply into tmp/splats/
3. register-splat  — copies .ply into public/splats/ and updates zones.json
4. (studio)        — git review, git commit, git push → Vercel rebuilds the site
```

Step 4 stays manual on purpose. The studio reviews `zones.json` and
the imagery before anything goes public.

## One-time setup

1. **Install Python 3.12 on the workstation.** Don't use 3.13/3.14 —
   PyTorch wheels aren't available there yet. The path the rest of the
   studio uses is
   `C:\Users\dimon\AppData\Local\Programs\Python\Python312\python.exe`.

2. **Clone Apple SHARP** somewhere outside this repo. We never vendor
   the model code:

   ```powershell
   git clone https://github.com/apple/ml-sharp D:\Models\ml-sharp
   ```

3. **Create a venv** for the pipeline and install the Python deps:

   ```powershell
   cd D:\.github\_3DPOV
   py -3.12 -m venv .venv-sharp
   .\.venv-sharp\Scripts\Activate.ps1
   pip install -r scripts\requirements.txt
   pip install -e D:\Models\ml-sharp   # or whatever the SHARP README says
   ```

   The SHARP weights pull from `huggingface.co/apple/Sharp` on first
   inference; cache them with `huggingface-cli download apple/Sharp`
   if you'd rather pre-warm.

4. **Copy the config template** and edit any per-machine bits:

   ```powershell
   Copy-Item scripts\cctv-fetch.config.example.json scripts\cctv-fetch.config.json
   ```

   The real `cctv-fetch.config.json` is in `.gitignore`. Keep API
   keys, private endpoints, and machine-specific paths there.

5. **Verify Node + pnpm work for the TS scripts.** From the project
   root: `pnpm exec tsx scripts/cctv-fetch.ts --help`. If that
   prints the usage, the TypeScript half is ready.

## The three steps, walked through

### 1. Fetch

```powershell
pnpm splat:fetch                                           # default config
pnpm splat:fetch -- --cameras JamCams_00001.01251          # filter to one camera
pnpm splat:fetch -- --dry-run                              # list, write nothing
```

`cctv-fetch.ts` hits the TFL JamCams JSON list, looks for the
`imageUrl` in each camera's `additionalProperties`, fetches the still,
hashes it, and writes both the JPG and a sidecar `.meta.json` (camera
id, source URL, lat/lng, fetched-at timestamp, SHA-256 content hash)
into `tmp/staging/`.

Idempotency: any image whose SHA-256 matches a sidecar already on disk
is skipped. Re-running the fetcher every hour costs almost nothing
when the cameras haven't refreshed.

### 2. SHARP

```powershell
python scripts\sharp-runner.py --staging .\tmp\staging --output .\tmp\splats
python scripts\sharp-runner.py --staging .\tmp\staging --output .\tmp\splats --sharp-repo D:\Models\ml-sharp --limit 4
```

`sharp-runner.py` scans `tmp/staging/`, skips any image that already
has a matching `.ply` in `tmp/splats/`, loads SHARP once, and runs
inference image-by-image. For each output it writes a sidecar
`.meta.json` recording the source image, the SHARP model version, the
runtime in seconds, the splat point count parsed from the PLY header,
and an ISO-8601 generation timestamp.

If your SHARP install diverges from the README signature the script
assumes (`SharpPipeline.from_pretrained(...).infer(image)`), edit
`run_sharp_inference` in `scripts/sharp-runner.py`. Everything else in
the script is stable.

### 3. Register

```powershell
pnpm splat:register -- --output ./tmp/splats --batch
pnpm splat:register -- --output ./tmp/splats --ply jamcam-2026-05-13.ply --slug camden-lock-jamcam --name "Camden Lock (TFL JamCam)" --notes "Traffic feed grab, 13 May 2026"
```

`register-splat.ts` walks the SHARP output, reads each PLY's sidecar
plus the upstream staged-image sidecar (so the lat/lng and source-URL
travel forward), copies the PLY into `public/splats/{slug}.ply`, and
adds or updates an entry in `data/neo-london/zones.json` conforming to
the `SplatZone` type from `lib/neo-london/types.ts`. Status flips to
`splat-rendered`.

`--batch` auto-slugs from `camera-id + capture-date` and stamps minimal
default metadata. The studio is expected to review `zones.json`
afterwards and edit before commit. The script prints the exact
`git add` / `git commit` / `git push` lines to run next; it does not
commit anything itself.

### 4. Git push

Studio runs:

```powershell
git add data/neo-london/zones.json public/splats/*.ply
git commit -m "splats: register <slugs>"
git push
```

Vercel sees the push, rebuilds, and the new splats are live under
`/play/neo-london/zone/<slug>`.

## Running the whole thing in one shot

```powershell
pwsh -File scripts\splat-pipeline.ps1
pwsh -File scripts\splat-pipeline.ps1 -SkipFetch          # SHARP a backlog
pwsh -File scripts\splat-pipeline.ps1 -DryRun             # no writes
```

`splat-pipeline.ps1` runs all three steps, tees a timestamped log
into `tmp/logs/`, counts the delta in registered splats before and
after, and prints `N new splats registered. Review zones.json and
commit.` at the end.

## Unattended overnight runs (Windows Task Scheduler)

1. **Task Scheduler -> Create Task.**
2. **General:** Run only when user is logged on; hide the window if
   you'd rather not look at it.
3. **Triggers:** Daily at 02:30 (or whatever cadence — the JamCams
   refresh every five minutes, so the limiting factor is SHARP's
   runtime per frame).
4. **Action:** Start a program.
   - Program/script: `pwsh.exe`
   - Add arguments: `-File "D:\.github\_3DPOV\scripts\splat-pipeline.ps1"`
   - Start in: `D:\.github\_3DPOV`
5. **Conditions:** Wake the computer if needed; only if on AC power.
6. **Settings:** Allow task to be run on demand; stop if it runs
   longer than 4 hours.

The git push still stays manual the next morning. We don't auto-push
imagery to the public site.

## Reviewing `zones.json` before commit — dignity check

The fetcher does not filter on people-in-frame. The studio decides
per-zone whether a frame is OK to publish: faces, licence plates, the
inside of someone's car, anyone identifiable. The review pass is the
moment for that judgement; if a registered splat doesn't pass the
dignity check, delete the `.ply` from `public/splats/`, drop the entry
back to `status: "placeholder"` in `zones.json` (or remove the entry
entirely), and don't commit it.

A useful rule of thumb: if you would not be comfortable explaining
the publication of a specific frame to the person in it, don't
publish it.

## Rights and attribution

TFL JamCams are released under the
[Transport for London Open Data terms](https://tfl.gov.uk/info-for/open-data-users/),
which require attribution. The registrar writes the camera ID into
the zone's `notes` field by default; keep that on. For the site's
`/play/neo-london` map and any per-zone page, render a
"Source: TFL JamCams, camera `<id>`" line near the splat. If you
disable a TFL camera in `cctv-fetch.config.json`, do not back-fill it
from a copy of the same camera's feed elsewhere — the attribution
rides with the original source URL recorded in the staged sidecar.

For BBC London or other public feeds, check the specific feed's
terms before enabling that source. Default-disabled in the example
config for that reason.

## Using the same pipeline for the studio's 360 archive

SHARP wants a flat 2D image, not an equirectangular. To feed the
studio's own 360 frames through the same pipeline, extract a cube
face first:

```powershell
ffmpeg -i bankside-2024-07-12.jpg `
       -vf "v360=e:c3x2:cube_edge_length=2048" `
       bankside-2024-07-12-cube.jpg
# or one face at a time:
ffmpeg -i bankside-2024-07-12.jpg `
       -vf "v360=e:flat:h_fov=90:v_fov=90:yaw=0:pitch=0" `
       bankside-2024-07-12-front.jpg
```

Add the resulting cube face to the `manual-archive-ingest` source in
`cctv-fetch.config.json`, with the lat/lng of the original 360
capture, and run the pipeline. The fetcher copies the local file into
staging, SHARP runs against the cube face, and the registrar pins the
resulting splat at the original capture's coordinates with
`source: "archive-360"`.

## Where things live

- `scripts/cctv-fetch.ts`, `scripts/cctv-fetch.config.example.json` — fetcher and template
- `scripts/cctv-fetch.config.json` — real config (gitignored)
- `scripts/sharp-runner.py`, `scripts/requirements.txt` — SHARP batcher and Python deps
- `scripts/register-splat.ts` — registrar
- `scripts/splat-pipeline.ps1` — orchestrator
- `tmp/staging/`, `tmp/splats/`, `tmp/logs/` — all gitignored
- `public/splats/`, `data/neo-london/zones.json` — committed; what Vercel serves
- `lib/neo-london/types.ts` — the `SplatZone` shape

The fetcher is a couple of HTTP GETs; the registrar is a file copy
and a JSON write. SHARP is the slow step. The orchestrator's job is
to make that one slow step unattended.
