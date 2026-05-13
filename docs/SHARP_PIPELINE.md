# SHARP Pipeline &mdash; the runbook

A practical workflow for taking a single source frame and landing it
on the Neo-London map as a walkable gaussian splat. The pipeline runs
on the studio bench; this document is the runbook the next pair of
hands (or future-you, two months on) follows.

## Table of contents

1. [What this pipeline does](#what-this-pipeline-does)
2. [Source frame acquisition](#source-frame-acquisition)
   - [From the 360 archive](#from-the-360-archive)
   - [From CCTV feeds](#from-cctv-feeds)
3. [Running SHARP locally](#running-sharp-locally)
4. [Plotting on the Neo-London map](#plotting-on-the-neo-london-map)
5. [Generating a companion collision mesh](#generating-a-companion-collision-mesh)
6. [Rights and attribution](#rights-and-attribution)
7. [Troubleshooting](#troubleshooting)

---

## What this pipeline does

Apple SHARP, open-sourced in December 2025, converts a single image
into a 3D gaussian-splat reconstruction in about ten seconds on a
workstation GPU. The studio runs the model locally; this site is the
destination that catches the output. Each rendered splat ends up at
`public/splats/{slug}.ply` and gets surfaced on the map at
`/play/neo-london` as a pin coloured by status.

The two source pools the bench is feeding into the pipeline:

- The studio&rsquo;s own ten-year 360 walking archive &mdash; her
  walked routes, named in
  [/articles/london-360-walking](/articles/london-360-walking).
- London CCTV grabs &mdash; TFL JamCams, BBC London public feeds, and
  other authorised public sources. The studio handles the legal
  side; this runbook handles the data side.

---

## Source frame acquisition

### From the 360 archive

The archive is equirectangular &mdash; one frame is a single
two-dimensional image covering the full sphere. SHARP expects a
perspective image, not an equirectangular, so the panorama needs to
be projected to one of six cube faces first.

```sh
# Extract one frame from a 360 walk video
ffmpeg -ss 00:01:24 -i walk_bankside_2024-07-12.mp4 -frames:v 1 \
  bankside_equi.png

# Cube-project the equirectangular to six faces. The v360 filter
# does this in one pass; "c6x1" lays the faces out horizontally.
ffmpeg -i bankside_equi.png \
  -vf "v360=input=e:output=c6x1:w=6144:h=1024" \
  bankside_cube.png

# Or extract a single forward-looking face directly
ffmpeg -i bankside_equi.png \
  -vf "v360=input=e:output=flat:h_fov=90:v_fov=90:w=1024:h=1024" \
  bankside_front.png
```

The forward-looking flat projection is the one that feeds SHARP.
The other five faces are kept for the next pass when the renderer
supports multi-view stitching.

### From CCTV feeds

TFL publish their JamCam stills on a rolling refresh at well-known
URLs; the studio pulls one frame per camera per pass.

```sh
# Example JamCam grab (camera ID is the TFL identifier)
curl -o jamcam_00001.06440.jpg \
  https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/00001.06440.jpg
```

The frame is already a perspective image, no projection needed. The
JamCam terms require attribution; record the camera ID + capture
timestamp in the zone&rsquo;s `notes` field and credit TFL in the
zone-page metadata.

Other public CCTV feeds (BBC London traffic cams, Highways England
roadside cameras, etc.) work the same way but each has its own terms
of use; check before adding a frame to the pipeline.

---

## Running SHARP locally

Apple ship SHARP at
[github.com/apple/ml-sharp](https://github.com/apple/ml-sharp) with
weights on Hugging Face at
[huggingface.co/apple/Sharp](https://huggingface.co/apple/Sharp).

Studio environment is Python 3.12 (per the project memory notes &mdash;
Python 3.14 is too new for PyTorch wheels as of 2026).

```sh
# One-time setup
git clone https://github.com/apple/ml-sharp
cd ml-sharp
C:/Users/dimon/AppData/Local/Programs/Python/Python312/python.exe \
  -m venv .venv
.venv/Scripts/activate
pip install -r requirements.txt

# Pull the weights from Hugging Face
huggingface-cli download apple/Sharp --local-dir ./checkpoints

# Run inference on one frame
python -m sharp.infer \
  --image ../frames/bankside_front.png \
  --output ../splats/bankside.ply \
  --checkpoint ./checkpoints/sharp-base.pt
```

Approximate runtime is ten seconds per frame on a workstation GPU
(per Apple&rsquo;s published numbers on a MacBook Pro). The output is
a `.ply` file containing the gaussian-splat parameters.

---

## Plotting on the Neo-London map

Once `bankside.ply` exists, three small edits land it on the map.

1. **Determine lat/lng of the source frame.**

   - 360 archive: the camera&rsquo;s GPS tag is in the EXIF, or
     visible on the corresponding entry in the studio&rsquo;s walk
     log.
   - CCTV: TFL publish camera coordinates in their open dataset; BBC
     and other feeds usually publish them on the cam-listing page.

2. **Choose a slug.** Kebab-case, short, unique. The slug is the URL
   segment and the filename, so pick it once and keep it. Existing
   zones in `data/neo-london/zones.json` are the precedent.

3. **Drop the file at `public/splats/{slug}.ply`** and edit
   `data/neo-london/zones.json`. Either add a new entry or update an
   existing placeholder:

   ```json
   {
     "slug": "bankside",
     "name": "Bankside",
     "lat": 51.5074,
     "lng": -0.0972,
     "source": "archive-360",
     "sourceFrame": "/frames/bankside_front.png",
     "plyUrl": "/splats/bankside.ply",
     "capturedAt": "2024-07-12",
     "splatGeneratedAt": "2026-05-13",
     "sharpVersion": "1.0.0",
     "notes": "South Bank strip in front of Tate Modern; first splat off the bench.",
     "status": "splat-rendered"
   }
   ```

4. **Verify locally.**

   ```sh
   pnpm dev
   # then visit:
   # http://localhost:3000/play/neo-london
   # http://localhost:3000/play/neo-london/zone/bankside
   ```

   The pin should change colour to `pink-200` (splat-rendered) and
   the zone page should mount the `ZoneScene` component. The
   placeholder point-cloud spin renders until the splat renderer is
   wired in &mdash; see the integration spec in
   `components/neo-london/zone-scene.tsx` for the v0.2 contract.

---

## Generating a companion collision mesh

A splat is a renderable cloud; for any gameplay layer that needs
collision the studio also generates a low-poly GLB from the same
source frame.

The studio already runs TripoSR for this kind of job (see the
relevant section of [/stack](/stack)). Use the existing TripoSR
install with the PyMCubes fallback documented in the project memory
notes (`torchmcubes` fails to compile on Windows without CUDA
toolset).

```sh
python -m tsr.infer \
  --image ../frames/bankside_front.png \
  --output ../splats/bankside.glb \
  --use-pymcubes
```

Drop the result at `public/splats/{slug}.glb`, update the zone&rsquo;s
`meshUrl`, and bump the status to `mesh-added`. The pin turns gold.

---

## Rights and attribution

- **CCTV from TFL JamCams.** Public-facing, requires attribution
  per [TFL&rsquo;s open-data terms](https://tfl.gov.uk/info-for/open-data-users/).
  Credit TFL in the zone&rsquo;s `notes` field and include the
  camera ID + capture timestamp. The studio does not pretend the
  feed is hers.
- **Other public CCTV feeds.** Check the source&rsquo;s terms before
  ingest. BBC London traffic cams are explicit about non-commercial
  use; Highways England feeds are similar; private feeds (shop
  cameras, etc.) are off-limits.
- **The 360 archive.** Studio-owned, captured by Dimona on her own
  pole. No rights questions.
- **The political shape.** A neo-London being assembled from
  surveillance footage is a project with a political shape, named
  on the `/play/neo-london` page so it does not have to be named
  anywhere else. The studio sits with that openly; the runbook
  records it so the next pair of hands knows.

---

## Troubleshooting

- **SHARP runs but outputs an empty .ply.** The input is probably
  too uniform or too low-resolution. SHARP expects ~1024 on the long
  edge minimum with visible depth cues. Try a different frame from
  the same walk.
- **The pin renders in the wrong place.** Check lat/lng order in the
  JSON edit &mdash; `lat` is latitude (51-ish in London), `lng` is
  longitude (around 0 in London). It is easy to swap them and end up
  with a pin in the North Sea.
- **The zone page 404s after editing the JSON.** Restart `pnpm dev`
  &mdash; `generateStaticParams` re-runs at module load, not on every
  request. Turbopack usually catches the JSON change; sometimes a
  full restart is needed.
- **The placeholder scene renders even with a real plyUrl.** Status
  needs to be `splat-rendered`, `mesh-added`, or `playable` &mdash;
  the page only mounts `ZoneScene` for those three. A real .ply with
  `status: "placeholder"` is a no-op until the status field catches
  up.

---

Now go pick a frame and render the first one.
