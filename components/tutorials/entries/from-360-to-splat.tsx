import Link from "next/link";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;
const code = "mx-0.5 rounded-sm bg-warm-black-800 px-1 py-0.5 font-mono text-xs";

export default function From360ToSplatTutorial() {
  return (
    <>
      <p>
        A 360 photograph is a sphere flattened to a rectangle for
        storage. The sphere is the real thing &mdash; it knows the
        volume around the lens, which is volumetric data the moment
        you choose to read it that way. For ten years the studio
        treated those equirectangulars as flat deliverables; reframe
        in post, crop a 16:9 out of the sphere, print. The reframe
        was honest but it threw away the volume. This tutorial is
        about not throwing it away.
      </p>
      <p>
        <strong>What this pipeline builds.</strong> A single
        equirectangular still becomes a navigable 3D scene by way of
        Apple SHARP &mdash; the single-image gaussian splat model
        Apple open-sourced in December 2025. The output is a{" "}
        <code className={code}>.ply</code> gaussian-splat file you
        can fly a camera through in a web viewer or land as a pin on{" "}
        <Link href="/play/neo-london" className={ext}>
          /play/neo-london
        </Link>
        . Ten seconds of inference, one frame in, one walkable scene
        out. The bench has been waiting for this model. It shipped.
      </p>
      <p>
        Companion reading on the user-facing side is at{" "}
        <Link href="/articles/london-360-walking" className={ext}>
          ten years of 360 cameras, one pole
        </Link>
        ; the architectural framing of the move off the plane is at{" "}
        <Link href="/articles/ungrounded" className={ext}>
          ungrounded
        </Link>
        . The canonical runbook is{" "}
        <code className={code}>docs/SHARP_PIPELINE.md</code>; this
        page is the same material with the bench commentary the
        runbook does not carry.
      </p>

      <p>
        <strong>What you need.</strong>
      </p>
      <ol className="mt-2 list-decimal space-y-2 pl-5 text-chrome-300">
        <li>
          <strong>A 360 camera.</strong> The studio is shooting on a{" "}
          <a
            href="https://www.dji.com/360"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            DJI Osmo 360{arrow}
          </a>{" "}
          now &mdash; two 1/1.1&Prime; square CMOS sensors, glass
          before software, the argument is at{" "}
          <Link href="/articles/london-360-walking" className={ext}>
            ten years of 360 cameras
          </Link>
          . Earlier Insta360 X3 and X4 frames out of the archive
          render fine too; the sensor matters less than the
          resolution. Anything that puts ~1024 px across the forward
          face after cube-projection is enough.
        </li>
        <li>
          <strong>A tripod or selfie stick.</strong> A static tripod
          is preferable for SHARP &mdash; movement during exposure
          adds parallax the single-image model is not built to
          resolve.
        </li>
        <li>
          <strong>ffmpeg.</strong> One frame extraction, one cube
          projection. Free, ubiquitous.
        </li>
        <li>
          <strong>Apple SHARP, December 2025 release.</strong> Code
          at{" "}
          <a
            href="https://github.com/apple/ml-sharp"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            github.com/apple/ml-sharp{arrow}
          </a>
          ; weights at{" "}
          <a
            href="https://huggingface.co/apple/Sharp"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            huggingface.co/apple/Sharp{arrow}
          </a>
          . Python 3.12 &mdash; not 3.14, which is too new for the
          PyTorch wheels SHARP depends on. A workstation GPU with
          roughly 8&nbsp;GB of VRAM will run it; Apple report ten
          seconds per frame on a MacBook Pro.
        </li>
        <li>
          <strong>The studio scripts.</strong>{" "}
          <code className={code}>scripts/sharp-runner.py</code> and{" "}
          <code className={code}>scripts/register-splat.ts</code>{" "}
          live in this repository. The first batches inference, the
          second drops the result into{" "}
          <code className={code}>public/splats/</code> and updates
          the zone JSON. The underlying SHARP CLI works fine on its
          own; the wrappers are there for the day you have a hundred
          frames to feed through.
        </li>
      </ol>

      <p>
        <strong>Step 1: Shoot the still.</strong>
      </p>
      <p>
        SHARP is a single-image model, which means everything you
        normally rely on in 360 walking work &mdash; reframe in post,
        stabilise the column, recover from a wobble &mdash; is
        irrelevant. The model takes one frame and infers depth from
        what it sees. Pick the frame as you would pick a still
        photograph, not as you would pick a clip.
      </p>
      <p>
        Tripod height matters. The studio shoots the splat source at
        roughly eye-level on the pole &mdash; about 1.6 m &mdash;
        because that is the height the resulting scene reads as
        natural when you fly a virtual camera through it. Floor-low
        or above-head-high splats render fine but the perspective
        feels uncanny. Eye-level is the boring answer and it is the
        right one.
      </p>
      <p>
        Light: late afternoon or early morning. Hard light from
        directly overhead flattens the depth cues SHARP triangulates
        on. A long shadow direction across the scene is what you
        want; the model uses the shadow geometry as a depth hint the
        same way the eye does.
      </p>
      <p>
        Avoid people in the bubble. A single-image splat assumes the
        scene is static. A pedestrian halfway through a stride
        becomes a half-formed gaussian smear in the output; the
        model does not know they were going to move. The studio
        shoots empty corners, towpath stretches between groups, the
        South Bank at the dead minute between two coachloads. If you
        cannot avoid people, accept the smear and call it part of
        the work.
      </p>

      <p>
        <strong>Step 2: Extract and cube-project.</strong>
      </p>
      <p>
        SHARP expects a perspective image, not an equirectangular.
        The forward-facing cube face is the one the model wants.
        ffmpeg does the projection in a single pass.
      </p>
      <pre className="mt-2 overflow-x-auto rounded-sm bg-warm-black-900 p-3 font-mono text-xs text-chrome-200">
{`# One still from a 360 walk video
ffmpeg -ss 00:01:24 -i walk_bankside.mp4 -frames:v 1 bankside_equi.png

# Project the equirectangular to a 1024x1024 forward-facing flat
ffmpeg -i bankside_equi.png \\
  -vf "v360=input=e:output=flat:h_fov=90:v_fov=90:w=1024:h=1024" \\
  bankside_front.png`}
      </pre>
      <p>
        If you shot a still rather than a clip, skip the first
        command and feed the equirectangular straight to the second.
        The other five cube faces are worth keeping in a sidecar
        folder &mdash; the renderer does not stitch multi-view yet,
        but the runbook flags that as the next pass.
      </p>

      <p>
        <strong>Step 3: Run SHARP.</strong>
      </p>
      <p>
        Set up the SHARP environment once and reuse it. Python 3.12,
        a virtualenv, the upstream requirements file, the Hugging
        Face weights pulled to a checkpoints folder.
      </p>
      <pre className="mt-2 overflow-x-auto rounded-sm bg-warm-black-900 p-3 font-mono text-xs text-chrome-200">
{`# One-time
git clone https://github.com/apple/ml-sharp && cd ml-sharp
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
huggingface-cli download apple/Sharp --local-dir ./checkpoints

# Batch inference via the studio wrapper
python scripts/sharp-runner.py \\
  --staging ./tmp/staging --output ./tmp/splats \\
  --sharp-repo ../ml-sharp --model apple/Sharp`}
      </pre>
      <p>
        The wrapper watches the staging folder, runs SHARP over each
        unprocessed image, and writes a{" "}
        <code className={code}>.ply</code> plus a{" "}
        <code className={code}>.meta.json</code> sidecar holding
        runtime, point count, and SHARP version. It is idempotent
        &mdash; re-running skips frames that already have a{" "}
        <code className={code}>.ply</code> unless you pass{" "}
        <code className={code}>--force</code>.
      </p>
      <p>
        Expect roughly ten seconds per frame on a recent GPU. The
        output is a few megabytes per scene &mdash; small enough to
        commit to <code className={code}>public/</code> without
        thinking about it. If a frame returns an empty point cloud
        the input is probably too uniform or too low-resolution; try
        a different cube face from the same sphere.
      </p>

      <p>
        <strong>Step 4: Register and publish.</strong>
      </p>
      <p>
        The splat now exists at{" "}
        <code className={code}>tmp/splats/bankside.ply</code>. One
        more script lands it on the map.
      </p>
      <pre className="mt-2 overflow-x-auto rounded-sm bg-warm-black-900 p-3 font-mono text-xs text-chrome-200">
{`pnpm exec tsx scripts/register-splat.ts \\
  --output ./tmp/splats --ply bankside.ply \\
  --slug bankside --name "Bankside" \\
  --source archive-360 \\
  --notes "South Bank strip in front of Tate Modern."`}
      </pre>
      <p>
        The script copies the <code className={code}>.ply</code>{" "}
        into <code className={code}>public/splats/{`{slug}`}.ply</code>{" "}
        and adds a zone entry to{" "}
        <code className={code}>data/neo-london/zones.json</code>{" "}
        with{" "}
        <code className={code}>status: &quot;splat-rendered&quot;</code>.
        The lat/lng will default to 0,0 if the source frame has no
        EXIF GPS &mdash; open the JSON and write the real
        coordinates in. Latitude is ~51 in London; longitude is ~0.
        It is easy to swap them and end up pinned in the North Sea.
      </p>
      <p>
        The script does not commit. The studio reviews the zone
        entry, sense-checks the coordinates, and only then runs the{" "}
        <code className={code}>git add / commit / push</code> lines
        the script prints at the end. A push triggers a Vercel
        deploy and the splat is live. The future{" "}
        <code className={code}>viz.splat</code> capability stubbed
        in <code className={code}>docs/BOX_3_INVENTORY.md</code> is
        what will eventually mount these files as a first-class
        scene; until then, the placeholder spin in{" "}
        <code className={code}>components/neo-london/zone-scene.tsx</code>{" "}
        is what renders.
      </p>

      <p>
        <strong>What you see.</strong>
      </p>
      <p>
        Open{" "}
        <Link href="/play/neo-london" className={ext}>
          /play/neo-london
        </Link>{" "}
        and the pin turns pink. Click through to the zone page and
        the scene mounts &mdash; placeholder spin today, full splat
        renderer once <code className={code}>viz.splat</code> ships.
        The pay-off on the user side is the same pay-off the article
        at{" "}
        <Link href="/articles/london-360-walking" className={ext}>
          ten years of 360 cameras
        </Link>{" "}
        was always pointing at: a photograph that was a sphere is
        now a volume the visitor walks through, and the slice the
        studio used to ship is one camera angle inside a scene the
        visitor can choose for themselves.
      </p>
      <p>
        The shift the tutorial enacts is the shift the article at{" "}
        <Link href="/articles/ungrounded" className={ext}>
          ungrounded
        </Link>{" "}
        names: 2D survives as a useful slice; everything else is
        volume. Now go pick a frame off the bench and render the
        first one.
      </p>
    </>
  );
}
