import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function NineSecondsPromptToPrintable() {
  return (
    <>
      <blockquote className="my-4 border-l-2 border-pink-200/40 pl-4 italic text-chrome-300">
        I make spinny-glowy things for a living. Flow arts, light
        painting, the occasional wall full of belt-printed dragon
        scales. I also keep three Windows boxes in a network closet
        pretending to be a render farm. Last week I wired them
        together so I could type "witch on a broomstick" into a
        browser and have a watertight, print-ready STL file land on
        my desk nine seconds later. Here&rsquo;s how, and why it
        turned out to be less work than I expected.
      </blockquote>

      <h2 className="mt-12 text-2xl text-chrome-100">The thing</h2>
      <p>
        It&rsquo;s a web app. You open it in a browser. There&rsquo;s
        a magenta button that says <strong>🔮 Forge sculpture</strong>.
        You type a sentence into the box above it &mdash; anything
        from "cute fire elemental sprite" to "poi flow arts performer
        mid-spin" &mdash; and click the button.
      </p>
      <p>
        A little progress card lights up. <strong>SDXL</strong> flips
        from grey to amber to green. About eight seconds. Then{" "}
        <strong>SAM2</strong> does the same, much faster &mdash; under
        a second. Then <strong>STL</strong> lights up green almost
        instantly.
      </p>
      <p>
        A 3D model of the thing you described starts spinning in the
        lower half of the screen. It&rsquo;s a lavender bas-relief;
        you can change the colour to bubblegum or mint with a
        dropdown. You can drag to rotate it, scroll to zoom. The file
        is half a megabyte. You hit{" "}
        <strong>↓ Download .stl</strong> and it&rsquo;s on disk,
        ready to drop into a slicer.
      </p>
      <p>
        Total time from typing the prompt to having a printable file:
        about nine seconds when everything&rsquo;s warm.
      </p>
      <p>
        That&rsquo;s the whole product. The interesting stuff is what&rsquo;s
        underneath.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        What&rsquo;s actually happening
      </h2>
      <p>Three things, stacked.</p>
      <p>
        <strong>Step 1: An AI draws a pixel-art sprite of your
        subject.</strong> This is the part most people have heard of
        &mdash;{" "}
        <a
          href="https://en.wikipedia.org/wiki/Stable_Diffusion"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Stable Diffusion{arrow}
        </a>
        , basically. Specifically the XL version with a model called
        Juggernaut Lightning, which is tuned to produce decent images
        in only eight inference steps instead of the usual fifty.
        Eight steps on an RTX 3080 Ti takes about seven seconds. After
        the model generates a normal image, a plugin called{" "}
        <a
          href="https://github.com/dimtoneff/ComfyUI-PixelArt-Detector"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          PixelArt-Detector{arrow}
        </a>{" "}
        quantises the colours down to a chosen palette &mdash; Apollo,
        Pico-8, Dawnbringer-32, the usual suspects from indie game
        development &mdash; and snaps the pixels to a clean grid. You
        get something that looks like it came out of a SNES JRPG
        instead of a digital painting.
      </p>
      <p>
        <strong>Step 2: A different AI cuts the subject out from its
        background.</strong> This is Meta&rsquo;s{" "}
        <a
          href="https://github.com/facebookresearch/sam2"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          SAM2{arrow}
        </a>{" "}
        model &mdash; "Segment Anything Model 2" &mdash; which excels
        at one specific task: you give it an image and a point, and it
        tells you which pixels belong to whatever the point is on.
        Click the witch, get the witch. The model is a 856 MB file
        that runs on the GPU and processes a sprite in well under a
        second. The output is a binary mask: black where the witch is,
        transparent where she isn&rsquo;t.
      </p>
      <p>
        <strong>Step 3: Geometry math turns the 2D mask into a 3D
        printable object.</strong> This is where it stops being AI
        and starts being algorithms from a 1987 SIGGRAPH paper. The
        mask becomes a tall stack of identical layers, each one a
        binary "yes/no" grid. A 2 mm base plate is added underneath.
        Then{" "}
        <a
          href="https://en.wikipedia.org/wiki/Marching_cubes"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          marching cubes{arrow}
        </a>{" "}
        &mdash; the venerable algorithm that turns voxel grids into
        smooth surfaces &mdash; walks through the stack and traces
        the outer surface, producing a mesh of triangles. A smoothing
        filter takes the edge off the staircasing. A simplification
        pass takes the resulting 275,000-triangle mesh and reduces it
        to 10,000 triangles without visible quality loss. The result
        is a watertight STL &mdash; meaning the surface has no holes
        and a slicer can compute a solid interior &mdash; measuring
        80 × 80 × 7 mm and weighing in at under 500 kB.
      </p>
      <p>
        That&rsquo;s it. The whole pipeline is text → AI image → AI
        mask → algorithmic geometry → printable file.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">The clever bits</h2>
      <p>A few things make the pipeline feel native rather than experimental.</p>
      <p>
        <strong>Embedding cache for the segmentation model.</strong>{" "}
        SAM2&rsquo;s most expensive operation isn&rsquo;t the per-click
        prediction; it&rsquo;s <em>embedding</em> the image &mdash;
        running it through a vision transformer to produce the latent
        representation the model thinks in. The actual "what is at
        this point" prediction is fast once the embedding exists. The
        cache means the first click on a new image takes about a
        second, but every subsequent click &mdash; adding positive
        points to include more of the subject, or negative points to
        cut bits out &mdash; takes about 400 ms. You can iteratively
        refine a mask by clicking on it, which is the natural workflow
        this model was designed for, and the UI runs cached
        predictions automatically as you click.
      </p>
      <p>
        <strong>Mesh simplification without losing watertightness.</strong>{" "}
        Marching cubes is a champ at producing valid, closed surfaces,
        but its triangles are tiny &mdash; many of them are nearly
        flat redundant slivers. A 5 mm thick relief has no business
        being a 13 MB file. The simplification step uses{" "}
        <em>quadric error decimation</em>, which preserves the
        silhouette and important detail while throwing away triangles
        that contribute little. With a target of 10,000 faces, the
        resulting STL is 26× smaller, still watertight, and
        indistinguishable to the eye when sliced for printing.
      </p>
      <p>
        <strong>Inline 3D preview in the browser.</strong> No
        "download this file and open it in your slicer" friction. The
        STL renders in the same page where it was generated, using
        the same{" "}
        <a
          href="https://threejs.org/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Three.js{arrow}
        </a>{" "}
        library that powers most 3D-on-the-web. It auto-rotates so
        you can see the shape immediately, and you can drag-orbit it
        like a CAD model. Lighting was tuned with a warm pink rim
        light because I like how it looks &mdash; there&rsquo;s no
        functional reason for the choice, but it makes the output
        feel like a finished thing rather than a debug visualisation.
      </p>
      <p>
        <strong>Three GPU services sharing one card.</strong> The
        stack runs entirely locally on a single RTX 3080 Ti, which has
        12 GB of VRAM.{" "}
        <a
          href="https://github.com/comfyanonymous/ComfyUI"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          ComfyUI{arrow}
        </a>{" "}
        holds the SDXL model warm (~7 GB), SAM2 holds its weights warm
        (~2.4 GB), and the browser-side Three.js renderer takes its
        share when active. They politely time-share. There&rsquo;s no
        cloud round-trip and no API key &mdash; the whole thing works
        offline once the models are downloaded.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">What&rsquo;s running it</h2>
      <p>
        The full stack is six services on six TCP ports, all on one
        machine:
      </p>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
        <li>A React app served by Vite (the user-facing browser interface)</li>
        <li>
          A FastAPI Python server (the orchestrator that proxies
          between the browser and the model servers)
        </li>
        <li>
          ComfyUI (the image generation server, hosting the Juggernaut
          XL Lightning model)
        </li>
        <li>A small HTTP server hosting SAM2</li>
        <li>
          <a
            href="https://mosquitto.org/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Mosquitto{arrow}
          </a>{" "}
          (an MQTT message broker for event logging)
        </li>
        <li>
          <a
            href="https://ollama.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Ollama{arrow}
          </a>{" "}
          (a separate local LLM runtime, used by other parts of the
          studio app)
        </li>
      </ul>
      <p>
        They&rsquo;re glued together by a single Python file that
        mounts the various sub-APIs at sensible paths &mdash;{" "}
        <code className="rounded-sm bg-warm-black-800 px-1.5 py-0.5 font-mono text-[0.78em] text-chrome-100">
          /comfyui/*
        </code>{" "}
        for image generation,{" "}
        <code className="rounded-sm bg-warm-black-800 px-1.5 py-0.5 font-mono text-[0.78em] text-chrome-100">
          /sam2/*
        </code>{" "}
        for segmentation. The React app talks to one place; the
        Python server fans out behind it.
      </p>
      <p>
        The hardware costs about the same as a decent laptop. The
        software is all open source. The only commercial part is the
        time it took to wire everything together, which was a handful
        of evenings.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">Why</h2>
      <p>
        I run a small studio that does poi flow arts performance,
        light-painting photography, and 3D-printed wall art on a CR-30
        belt printer that vomits out continuous fabric-like reliefs of
        dragon-scale and chain-mail patterns. The wall art side is
        parametric &mdash; I write the patterns mathematically and the
        printer produces them at any length I want &mdash; but the{" "}
        <em>figurative</em> side has always been a manual sculpt-in-
        Blender chore.
      </p>
      <p>
        This pipeline removes that chore. I can prototype a sculpture
        concept by typing a phrase, and if I like the silhouette I
        can either print it as a 5 mm relief tile or feed the same
        mask into more involved 3D-reconstruction pipelines for full-
        round sculptural work. The relief case alone is enough to
        make the tool useful daily.
      </p>
      <p>
        The deeper plan involves replacing the AI image generation
        step with my own{" "}
        <Link href="/photographs" className={ext}>
          light-painting photography
        </Link>{" "}
        &mdash; pictures of poi trails captured at long exposure
        &mdash; and turning <em>those</em> into 3D sculptures. The
        pipeline already accepts arbitrary images; I just haven&rsquo;t
        pointed it at my camera feed yet. The witch-on-a-broomstick
        is the proof of concept; the actual goal is to sculpt my own
        movement.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">What&rsquo;s next</h2>
      <p>
        A few things are obvious additions. <strong>Iterative editing
        in 3D</strong>: the relief approach is fine for wall art but
        it can&rsquo;t reconstruct depth from a single view &mdash; a
        sphere comes out as a disk. Models like{" "}
        <a
          href="https://github.com/TencentARC/InstantMesh"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          InstantMesh{arrow}
        </a>{" "}
        and{" "}
        <a
          href="https://github.com/microsoft/TRELLIS"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          TRELLIS{arrow}
        </a>{" "}
        produce true 3D meshes from a single image; wiring them into
        the same UI is the next session&rsquo;s work.
      </p>
      <p>
        <strong>Multi-stage chaining.</strong> The current pipeline
        runs each step once. A more sophisticated version would use a
        small language model (running locally via Ollama) to expand a
        brief prompt into a richer one before sending it to the image
        generator, then have a critic model loop until the image
        meets quality criteria. The infrastructure for this is in
        place; the orchestration logic isn&rsquo;t.
      </p>
      <p>
        <strong>Belt-printer optimisation.</strong> My printer prints
        continuously on an inclined belt, which means STLs need their
        flat side down and their relief facing up. The pipeline
        produces meshes oriented correctly for this, but doesn&rsquo;t
        yet auto-tile them or chain multiple prints into a single belt
        run. That&rsquo;s a slicer-side problem more than a pipeline
        problem.
      </p>
      <p>
        <strong>Performance.</strong> Nine seconds is fine. Five
        seconds would be nicer. Most of the time is in the SDXL step,
        which means there&rsquo;s not much to squeeze without a better
        model or fewer steps. SAM2 and the geometry work are basically
        free.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The boring summary for people who skimmed
      </h2>
      <p>
        I built a local web app that turns text prompts into 3D-
        printable STL files in about nine seconds. It uses three open-
        source models running on a single consumer GPU, glued together
        by a small Python web server. The output is half a megabyte,
        watertight, and previewable in the browser. Total dev time was
        about a week of evenings. Cost: zero, beyond electricity.
        Source code: all on disk in a folder called{" "}
        <code className="rounded-sm bg-warm-black-800 px-1.5 py-0.5 font-mono text-[0.78em] text-chrome-100">
          The_Hangar
        </code>{" "}
        because everything in my life is named after aircraft.
      </p>
      <p>Now I&rsquo;m going to print one.</p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry =   {
    slug: "nine-seconds-prompt-to-printable",
    title: "Nine Seconds from Prompt to Printable",
    date: "2025-12-18",
    kind: "article",
    excerpt:
      "Building a browser pipeline that turns sentences into 3D-printable art. Three open-source AI models, one consumer GPU, a Python orchestrator, marching cubes, quadric error decimation, watertight STLs in about nine seconds.",
    Body: NineSecondsPromptToPrintable,
    related: [
      {
        href: "/visualiser/marching-cubes",
        label: "Visualiser — Marching cubes",
        note: "Interactive — drag the iso-value, step through the 256 cases. The load-bearing step of this pipeline, opened.",
      },
      {
        href: "/tutorials/from-photograph-to-object",
        label: "Tutorial — From Photograph to 3D Object",
        note: "The slower, photograph-driven cousin of this pipeline.",
      },
      {
        href: "/articles/wall-arrays-geometry-of-rooms",
        label: "Wall Arrays — the Geometry of Rooms",
        note: "Where the belt-printed wall art ends up.",
      },
      {
        href: "/articles/belt-printed-wall-reliefs",
        label: "Belt-Printed Wall Reliefs",
        note: "Where the parametric output of this pipeline lands on the belt printer.",
      },
      {
        href: "/articles/on-the-shoulders-of-open-source",
        label: "On the Shoulders of Open Source",
        note: "The open-source models this pipeline glues together.",
      },
      {
        href: "/articles/spiral-cognition",
        label: "Spiral Cognition",
        note: "The working method this pipeline is a single tight turn of.",
      },
      {
        href: "/play",
        label: "Play — the proving ground",
        note: "Solo level three (The Loop) closes the same circuit this pipeline does, in one session.",
      },
      {
        href: "/photographs",
        label: "Photographs",
        note: "Where the next iteration's image input is meant to come from.",
      },
    ],
    furtherReading: [
      {
        href: "https://github.com/comfyanonymous/ComfyUI",
        label: "ComfyUI",
        note: "The image-generation server hosting SDXL.",
      },
      {
        href: "https://github.com/facebookresearch/sam2",
        label: "SAM2 — Segment Anything Model 2",
        note: "Meta's segmentation model; the click-to-mask workhorse.",
      },
      {
        href: "https://en.wikipedia.org/wiki/Marching_cubes",
        label: "Marching cubes — Wikipedia",
        note: "The 1987 SIGGRAPH paper that does the voxel-to-mesh work.",
      },
      {
        href: "https://github.com/TencentARC/InstantMesh",
        label: "InstantMesh",
        note: "Single-image to true-3D mesh model; next iteration's depth fix.",
      },
      {
        href: "https://github.com/microsoft/TRELLIS",
        label: "TRELLIS",
        note: "Microsoft's image-to-3D model; the other half of next iteration.",
      },
      {
        href: "https://github.com/dimtoneff/ComfyUI-PixelArt-Detector",
        label: "PixelArt-Detector for ComfyUI",
        note: "The palette quantiser used in the pipeline.",
      },
      {
        href: "https://threejs.org/",
        label: "Three.js",
        note: "The in-browser 3D library the inline preview runs on.",
      },
    ],
  };
