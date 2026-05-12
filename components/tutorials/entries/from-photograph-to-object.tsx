import Link from "next/link";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = (
  <span className="ml-0.5 text-chrome-500">&nearr;</span>
);

export default function FromPhotographToObject() {
  return (
    <>
      <p>
        A photograph is a two-dimensional record of a three-dimensional
        event. The flatness is a courtesy &mdash; it lets the photograph
        be printed, framed, hung, archived, posted, lost in the back of
        a drawer for forty years. It is not actually flat. The light
        that made it had volume. Every photograph the studio cares
        about began as a thing with depth and dimension, and we are
        about to put that thing back.
      </p>

      <p>
        <strong>What this pipeline does.</strong> Takes a long-exposure
        light-painting photograph, extracts the volumetric trace the
        moving light actually drew in space, refines that volume into
        a printable mesh, runs an acrylic{" "}
        <a
          href="https://en.wikipedia.org/wiki/Light_pipe"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          waveguide{arrow}
        </a>{" "}
        channel along the original trace, and prints the result. The
        output is a sculpture in resin that glows from inside, along
        the path the gesture took. It is, in the most literal sense
        possible, a photograph cast as an object.
      </p>

      <p>
        This is not a beginner tutorial. If you have not taken a
        long-exposure photograph yet, the studio&rsquo;s{" "}
        <Link
          href="/tutorials/your-first-long-exposure"
          className={ext}
        >
          beginner walkthrough
        </Link>{" "}
        is where to start. If you have not built a programmable rig
        yet, you can still follow this with hand-drawn or traditional
        light painting; the pipeline does not care what wrote the
        image, only that it was written.
      </p>

      <p>
        <strong>Step 1: Capture, properly.</strong>
      </p>
      <p>
        The pipeline works best on a single clean exposure with strong
        contrast. Dark background, sharp trace, minimal ambient light.
        The studio&rsquo;s{" "}
        <Link href="/practice" className={ext}>
          POV rigs
        </Link>{" "}
        are the easiest source because they hold the trace to the
        pixel, but a steady hand with a torch will do. Shoot in RAW.
        Sixteen-bit-per-channel processing matters once you start
        treating the image as data.
      </p>

      <p>
        <strong>Step 2: Voxelise the trace.</strong>
      </p>
      <p>
        This is where the photograph becomes geometry. You are
        extracting, from a 2D image, an estimate of where the light
        was in 3D space. The simplest version: treat the photograph
        as a depth-by-luminance map (brighter = closer to the camera)
        and stack the resulting heightfield into a{" "}
        <a
          href="https://en.wikipedia.org/wiki/Voxel"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          voxel grid{arrow}
        </a>
        . The Wikipedia article on voxels is short and useful.
      </p>
      <p>
        For richer reconstructions, the studio uses a custom pipeline
        that triangulates the trace using known camera intrinsics and
        the rig&rsquo;s flight path. For your purposes: an open-source
        voxeliser like binvox, or a hand-rolled NumPy script that walks
        the image&rsquo;s bright pixels and writes them to a sparse
        voxel grid, will do.
      </p>
      <p>Output: a binary or floating-point voxel volume.</p>

      <p>
        <strong>Step 3: Surface the volume.</strong>
      </p>
      <p>
        A voxel volume is not a printable shape. You need to extract
        its surface &mdash; the boundary between &ldquo;light was
        here&rdquo; and &ldquo;light was not.&rdquo; The standard
        algorithm is{" "}
        <a
          href="https://en.wikipedia.org/wiki/Marching_cubes"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          marching cubes{arrow}
        </a>
        , and it is implemented in nearly every 3D library. The Python
        <code className="mx-1 rounded-sm bg-warm-black-800 px-1 py-0.5 font-mono text-xs">
          scikit-image
        </code>
        marching cubes module is the gentlest entry point. ParaView and
        Open3D have higher-performance versions.
      </p>
      <p>
        You will get a mesh. It will be ugly. This is fine. The
        ugliness is data; you will sand it off in the next step.
      </p>

      <p>
        <strong>Step 4: Clean up in Blender.</strong>
      </p>
      <p>
        Open the mesh in{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/meshes/index.html"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Blender{arrow}
        </a>
        . Smooth it. Remove the artefacts at the boundaries of your
        voxel grid (which look like a stack of stair-stepped slabs
        because they are). Reduce the polygon count until the mesh
        prints; the studio&rsquo;s targets are around 200k&ndash;500k
        triangles for an object the size of a hand. Apply a subdivision
        surface modifier sparingly &mdash; too much and you lose the
        trace&rsquo;s character; too little and the print looks chunky.
      </p>
      <p>Save the cleaned mesh as STL.</p>

      <p>
        <strong>Step 5: Embed the waveguide.</strong>
      </p>
      <p>This is the bit that makes the object glow.</p>
      <p>
        A waveguide is a clear acrylic channel through the resin body,
        running along the original trace path of the photograph. Light
        enters one end, gets caught by total internal reflection at
        the channel walls, and travels through the channel until it
        scatters out wherever the channel surface is rough or kinked.
      </p>
      <p>
        In Blender (or in{" "}
        <a
          href="https://www.openscad.org/documentation.html"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          OpenSCAD{arrow}
        </a>
        , which the studio prefers for parametric channel design),
        boolean a 1.5&ndash;2mm cylindrical channel through your mesh
        along the trace&rsquo;s path. Leave a small pocket at one end
        for the LED. Export the modified body as STL.
      </p>

      <p>
        <strong>Step 6: Print, post-process, light.</strong>
      </p>
      <p>
        <a
          href="https://en.wikipedia.org/wiki/Stereolithography"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          SLA printing{arrow}
        </a>{" "}
        is the studio&rsquo;s choice &mdash; the resolution is high,
        the surface finish is glassy where the channel passes through,
        and the resin is broadly compatible with acrylic for the
        waveguide insert. Use a clear or translucent resin if you want
        the body itself to participate in the lighting; use a tinted
        opaque resin if you want the trace to be the only luminous
        element.
      </p>
      <p>
        Cure fully. Drill or ream the waveguide channel until the
        acrylic rod slides in cleanly (use the rod itself as the test
        gauge during design). Glue the rod with UV-cure optical
        adhesive if you can; cyanoacrylate works in a pinch but yellows
        over years.
      </p>
      <p>
        Seat a single warm-white 3mm LED in the channel pocket. Wire
        to a small driver. Power it up.
      </p>

      <p>
        The gesture that was drawn in air now lives in resin, and
        lights itself.
      </p>
    </>
  );
}
