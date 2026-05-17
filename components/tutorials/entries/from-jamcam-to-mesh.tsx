import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;
const code = "mx-0.5 rounded-sm bg-warm-black-800 px-1 py-0.5 font-mono text-xs";

export default function FromJamcamToMesh() {
  return (
    <>
      <p>
        A three-dimensional archive of public space used to belong to
        whichever institution could afford the rig. Photogrammetry
        teams in matching jackets, a van full of laser scanners, a
        permit, a person whose job it was to wave traffic around the
        tripod. The street was archived if a budget cared about it.
        The street the studio walks home along, mostly, was not.
      </p>
      <p>
        This has quietly stopped being true. Transport for London
        operates roughly nine hundred low-resolution traffic cameras
        across the capital and publishes the stills as a public,
        anonymous, no-auth feed. Apple released a single-image
        gaussian-splat model in December 2025. InstantMesh, on the
        open path, will turn a frame into a printable surface mesh in
        under a minute. Put those three things in a folder and you
        have something the institutions can&rsquo;t quite call their
        own anymore: a continuously refreshing 3D record of London at
        street level, built from a camera the city has been pointing
        at itself for two decades.
      </p>

      <p>
        <strong>What this pipeline does.</strong> Cross-references the
        TfL JamCams roster against the studio&rsquo;s{" "}
        <Link href="/holo-walk" className={ext}>
          HoloWalk locations
        </Link>
        , downloads stills into per-location folders on a polling
        schedule, runs each frame through either Apple SHARP (the
        archival path) or InstantMesh (the print-safe path), and
        emits one mesh per camera with a metadata sidecar. The output
        is a growing volumetric archive the studio&rsquo;s print bar
        can draw from, and the runbook the same studio uses when a
        sculpture-on-a-corner needs the corner reconstructed around
        it. Two licences, one pipeline; the licence determines what
        comes out the far end.
      </p>

      <h2 className="mt-10 text-2xl">What you need</h2>

      <ol className="mt-2 list-decimal space-y-2 pl-5 text-chrome-300">
        <li>
          <strong>The JamCams endpoint.</strong>{" "}
          <a
            href="https://api.tfl.gov.uk/Place/Type/JamCam"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            api.tfl.gov.uk/Place/Type/JamCam{arrow}
          </a>{" "}
          returns the full roster as JSON &mdash; lat, lng, camera id,
          and the URL of the current still. No key, no rate limit
          worth worrying about, no terms of service that say anything
          interesting about archival. Refresh interval is roughly five
          minutes; the studio polls at ten because the cameras at
          night don&rsquo;t change much.
        </li>
        <li>
          <strong>A locations file.</strong> The studio works against{" "}
          <code className={code}>data/holo-walk/locations.json</code>,
          which carries the WGS84 lat/lng of each sculpture pin. Any
          point list with the same shape will do.
        </li>
        <li>
          <strong>A mesher.</strong> Either Apple SHARP for the
          archival path or{" "}
          <a
            href="https://github.com/TencentARC/InstantMesh"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            InstantMesh{arrow}
          </a>{" "}
          for the print-safe path. The studio runs both, on the same
          3080 Ti, behind two ports. More on the licence split below.
        </li>
        <li>
          <strong>The wrap script.</strong>{" "}
          <code className={code}>scripts/cctv-mesh-batch.ts</code>{" "}
          walks the staging tree, deduplicates frames against existing
          outputs, submits each unprocessed still to the chosen
          backend, and writes the result alongside its source. The
          script is small enough to read in one sitting and the
          studio recommends doing exactly that before pointing it at
          ninety cameras.
        </li>
      </ol>

      <h2 className="mt-10 text-2xl">The two model paths</h2>

      <p>
        SHARP is the better model in almost every respect that
        matters for an archive &mdash; depth cues from shadow
        geometry, a coherent global structure across the frame, point
        clouds that read as recognisably the scene rather than a
        guess at it. SHARP is also released under a research-only
        licence. The studio is comfortable using it for an archive
        the studio looks at internally; the studio is not comfortable
        selling a print from a SHARP output. The line is a licence
        line, not a quality line.
      </p>
      <p>
        InstantMesh is Apache-2.0. Anyone can sell a print from it,
        the studio included. The output is less clean &mdash; the
        model trades global coherence for a fast feed-forward
        triangle mesh, and the meshes have the slightly toothy
        silhouette of a model trained on synthetic data. The
        print-bar gets the InstantMesh path. The archive gets SHARP.
        Two folders, two licences, no awkward conversations.
      </p>
      <p>
        Both run on the studio&rsquo;s 3080 Ti at the bench. The
        mesh service is at <code className={code}>localhost:7844</code>;
        the splat service is at <code className={code}>localhost:7842</code>.
        Both are now reachable across the studio&rsquo;s tailnet as{" "}
        <code className={code}>mesh-bench</code> and{" "}
        <code className={code}>sharp-bench</code>, which means the
        wrap script can run from a laptop on a train and the bench
        will still chew through the queue.
      </p>

      <h2 className="mt-10 text-2xl">Step 1: Cross-reference cameras to locations</h2>

      <p>
        The roster from TfL is a flat list. The studio cares about
        the subset within a useful radius of each HoloWalk pin
        &mdash; 300 metres tends to be the right answer, because that
        is the distance a camera will still have something
        recognisable of the same street in frame. Run the roster
        through a haversine pass against{" "}
        <code className={code}>locations.json</code> and you end up
        with a per-location dictionary of nearby cameras. The studio
        currently tracks ninety cameras across thirteen HoloWalk
        pins; the number drifts as TfL adds and retires units.
      </p>
      <pre className="mt-2 overflow-x-auto rounded-sm bg-warm-black-900 p-3 font-mono text-xs text-chrome-200">
{`# scripts/match-cameras.ts
pnpm exec tsx scripts/match-cameras.ts \\
  --radius 300 \\
  --out data/cctv/camera-map.json`}
      </pre>
      <p>
        The output is a JSON map of{" "}
        <code className={code}>{`{ locationSlug: [{ id, url, lat, lng }] }`}</code>.
        Re-run it weekly. TfL retires the occasional camera and the
        studio&rsquo;s folder structure should know.
      </p>

      <h2 className="mt-10 text-2xl">Step 2: Poll and stage the stills</h2>

      <p>
        Each polling pass writes JPEGs into a deterministic tree.
        Filename convention:{" "}
        <code className={code}>&lt;YYYYMMDD&gt;_&lt;HHMMSS&gt;__&lt;camera-id-suffix&gt;.jpg</code>.
        Two underscores between the timestamp and the suffix, because
        single-underscore parsers will trip on the colons TfL puts in
        some camera ids. The studio learned this once and prefers not
        to learn it again.
      </p>
      <pre className="mt-2 overflow-x-auto rounded-sm bg-warm-black-900 p-3 font-mono text-xs text-chrome-200">
{`tmp/staging/cctv/
  bankside/
    20260514_071000__00001.07203.jpg
    20260514_072000__00001.07203.jpg
    20260514_071000__00001.07211.jpg
  leake-street/
    20260514_071000__00001.04102.jpg`}
      </pre>
      <p>
        The folder is the HoloWalk slug. The filename carries
        everything the wrap script needs to decide whether a frame
        has already been meshed and to reconstruct which camera saw
        what at when. The studio does not write a separate manifest;
        the tree is the manifest.
      </p>

      <h2 className="mt-10 text-2xl">Step 3: Run the wrap script</h2>

      <p>
        <code className={code}>scripts/cctv-mesh-batch.ts</code> takes
        a staging folder and a backend flag, walks every JPEG it
        finds, and submits the unprocessed ones to the chosen
        service. Idempotent &mdash; if a frame already has a sibling{" "}
        <code className={code}>.glb</code> (InstantMesh) or{" "}
        <code className={code}>.ply</code> (SHARP) on disk, it skips
        and moves on.
      </p>
      <pre className="mt-2 overflow-x-auto rounded-sm bg-warm-black-900 p-3 font-mono text-xs text-chrome-200">
{`# Print-safe path: InstantMesh -> .glb
pnpm exec tsx scripts/cctv-mesh-batch.ts \\
  --staging tmp/staging/cctv \\
  --output tmp/meshes/cctv \\
  --backend instantmesh \\
  --service http://mesh-bench:7844

# Archival path: SHARP -> .ply
pnpm exec tsx scripts/cctv-mesh-batch.ts \\
  --staging tmp/staging/cctv \\
  --output tmp/meshes/cctv-archive \\
  --backend sharp \\
  --service http://sharp-bench:7842`}
      </pre>
      <p>
        Each successful job writes the output mesh and a sidecar at{" "}
        <code className={code}>&lt;frame&gt;.mesh.meta.json</code>{" "}
        with{" "}
        <code className={code}>jobId</code>,{" "}
        <code className={code}>durationMs</code>,{" "}
        <code className={code}>backend</code>,{" "}
        <code className={code}>modelVersion</code>, and (on failure){" "}
        <code className={code}>error</code>. The failure case is the
        useful one; a frame that throws on InstantMesh tends to throw
        on a re-run too, and the sidecar tells the script not to
        bother trying again until the model is upgraded. Idempotency
        and graceful failure are the same problem wearing two
        different jumpers.
      </p>

      <h2 className="mt-10 text-2xl">Step 4: Land the mesh somewhere useful</h2>

      <p>
        For the archive path, that is the disk and a daily{" "}
        <code className={code}>rsync</code> to the studio&rsquo;s
        cold-storage NAS; the studio is not in a hurry to publish
        SHARP outputs and the licence prefers it that way. For the
        print-bar path, the <code className={code}>.glb</code> files
        are queued into the same pipeline that handles the
        sculpture-print stock: candidate review, a viewer-tweak pass
        in Blender for anything destined for paid download, then
        either dropship-print or wallet-priced download under the
        same edition discipline the studio uses everywhere else.
      </p>
      <p>
        The result is a stock of low-cost, low-stakes 3D
        miniatures of London streetscapes that the print bar can
        draw from. None of them pretend to be heirlooms. Several of
        them, for the price of a pint, are quite a nice thing to
        have on a shelf.
      </p>

      <h2 className="mt-10 text-2xl">Where the studio is taking this</h2>

      <p>
        Two passes are in the queue. The first is multi-frame fusion
        &mdash; the same camera, twenty minutes apart, fed through a
        consistency model so the pedestrians smear away and the
        building stays. The second is temporal versioning: the same
        camera, six months apart, two meshes, one diff. A street
        archived as a living thing rather than a still. The pipeline
        the tutorial walks through is the substrate for both. Now go
        run it against your nearest pin and see what your high street
        looks like as a volume.
      </p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry =   {
    slug: "from-jamcam-to-mesh",
    title: "From JamCam to mesh: building a 3D archive from public CCTV",
    date: "2026-05-14",
    kind: "tutorial",
    excerpt:
      "Cross-reference TfL JamCams against HoloWalk pins, poll the stills on a schedule, and feed each frame into Apple SHARP or InstantMesh on the bench. A continuously refreshing 3D archive of London at street level.",
    Body: FromJamcamToMesh,
    related: [
      {
        href: "/tutorials/from-360-to-splat",
        label: "Tutorial — From 360 to Splat",
        note: "The sibling pipeline. Different input camera, same mesh-from-image instinct.",
      },
      {
        href: "/tutorials/from-photograph-to-object",
        label: "Tutorial — From Photograph to 3D Object",
        note: "The earlier flat-to-volumetric pipeline. Different model class, same destination.",
      },
      {
        href: "/holo-walk",
        label: "HoloWalk",
        note: "The sculpture-pin geography the camera roster is matched against.",
      },
      {
        href: "/articles/ungrounded",
        label: "Ungrounded",
        note: "The architectural framing of the studio leaving the 2D plane.",
      },
    ],
    furtherReading: [
      {
        href: "https://api.tfl.gov.uk/Place/Type/JamCam",
        label: "TfL JamCams — Place API endpoint",
        note: "Live JSON roster of every JamCam in London, with lat/lng and current still URL. No auth, no key.",
      },
      {
        href: "https://api-portal.tfl.gov.uk/api-details#api=Place&operation=Place_PlacesByTypeByTypesQueryActiveOnly",
        label: "TfL Unified API portal — Place endpoint",
        note: "The official documentation for the endpoint above, including query parameters and response shape.",
      },
      {
        href: "https://github.com/apple/ml-sharp",
        label: "Apple ml-sharp — official repository",
        note: "Source code and weights link for the archival-path model. Research-only licence; check before publishing outputs.",
      },
      {
        href: "https://github.com/TencentARC/InstantMesh",
        label: "InstantMesh — official repository",
        note: "The print-safe path. Apache-2.0 licence, feed-forward mesh from a single image, ~30s per frame on a 3080 Ti.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Gaussian_splatting",
        label: "Gaussian splatting — Wikipedia",
        note: "The rendering technique SHARP produces. Read this if the .ply format does not feel familiar.",
      },
      {
        href: "https://tailscale.com/kb/1019/subnets",
        label: "Tailscale — subnet routing docs",
        note: "How the studio exposes the bench services across the tailnet as mesh-bench and sharp-bench.",
      },
    ],
  };
