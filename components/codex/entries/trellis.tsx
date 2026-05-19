export default function Trellis() {
  return (
    <>
      <p>
        TRELLIS is a 2024 image-to-3D model from Microsoft Research and
        Tsinghua University. It takes a single 2D image of an object
        and produces a textured 3D mesh in around fifteen seconds on a
        24 GB GPU.<sup>1</sup> Unlike depth-warp pipelines (which keep
        the object pinned to the camera viewpoint), TRELLIS produces a
        full 360&deg; reconstruction: the result can be orbited,
        re-lit, and 3D-printed.
      </p>
      <p>
        The studio uses TRELLIS as one of the back-ends for the{" "}
        <strong>print-bar commission path</strong> &mdash; the
        commercial-safe route by which a buyer&rsquo;s photograph
        becomes a physical printed object. The architectural reason
        TRELLIS is picked over{" "}
        <strong>
          <a
            href="/codex/apple-sharp"
            className="text-pink-200 underline underline-offset-4"
          >
            SHARP
          </a>
        </strong>{" "}
        for this surface is the licence: TRELLIS ships under
        MIT licence, which is commercial-safe. SHARP is research-only.
      </p>
      <p>
        How the studio wraps it:
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          The bench runs TRELLIS behind a FastAPI service at{" "}
          <code className="font-mono text-chrome-200">
            python-services/mesh_service.py
          </code>{" "}
          on port 7844, exposed to the public site via Tailscale
          Funnel + a shared bearer token. (Same pattern as the SHARP
          service, different licence posture.)
        </li>
        <li>
          The output is a textured GLB suitable for orbit viewing,
          plus a watertight STL suitable for resin printing once the
          studio&rsquo;s printability gate has signed off on it
          (see{" "}
          <strong>
            <a
              href="/codex/marching-cubes"
              className="text-pink-200 underline underline-offset-4"
            >
              marching cubes
            </a>
          </strong>
          ).
        </li>
        <li>
          For commissions where the buyer wants the file rather than
          the printed object, the studio releases the GLB but{" "}
          <em>not</em> the STL. STL release is studio-only fabrication
          policy &mdash; the print is the deliverable.
        </li>
      </ul>
      <p>
        Two alternatives the studio also has wired but defaults away
        from:
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>InstantMesh</strong> (TencentARC) &mdash; same
          architectural family, faster on a smaller GPU, slightly
          lower mesh quality. Falls back here on the 3080 Ti when
          TRELLIS&rsquo;s VRAM budget gets tight (e.g. queue
          contention with a SHARP job).
        </li>
        <li>
          <strong>TripoSR</strong> (Stability AI) &mdash; sketch-grade
          quality, ten times faster, occasional preview tool not
          deliverable quality.
        </li>
      </ul>
      <p>
        TRELLIS is the default. Operator picks the fallback when
        circumstances justify it.<sup>2</sup>
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          Microsoft Research &amp; Tsinghua,{" "}
          <em>TRELLIS: Structured 3D Latents for Scalable High-Quality 3D Generation</em>
          , 2024. Repository at{" "}
          <a
            href="https://github.com/microsoft/TRELLIS"
            className="text-pink-200 underline underline-offset-4"
          >
            microsoft/TRELLIS
          </a>
          .
        </li>
        <li>
          The choice is a runtime decision encoded in the{" "}
          <code className="font-mono text-chrome-200">
            commerce.sharp-job
          </code>{" "}
          vs{" "}
          <code className="font-mono text-chrome-200">
            media.image-to-mesh
          </code>{" "}
          capabilities: which one the customer reaches determines the
          licence posture, which determines which model runs.
        </li>
      </ol>
    </>
  );
}
