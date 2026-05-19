import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

const codeBlock =
  "mt-4 mb-6 overflow-x-auto rounded-md border border-chrome-700/40 bg-black/40 p-4 text-xs leading-relaxed text-chrome-100";

export default function CohesiveLowPolyCellShadedVrmWorlds() {
  return (
    <>
      <p>
        A pretty VRM avatar dropped into a pretty low-poly room
        rarely looks pretty together. The avatar is shaded by one
        algorithm and the room is shaded by another, and the eye
        catches the seam in the first second. The avatar reads as a
        decal pasted onto a diorama. The diorama reads as a stage
        the avatar is visiting rather than inhabiting. The shared
        intention &mdash; a cohesive cel-shaded world &mdash; has
        been undone before the first frame was rendered.
      </p>

      <p>
        This article is about the trap, the principle behind the
        fix, and the working architecture that makes the fix
        portable. The reader will leave with a defensible answer
        to a question that comes up the first time anyone tries to
        marry the VRM avatar standard to a hand-authored low-poly
        environment: which shading model wins?
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The trap, named plainly
      </h2>

      <p>
        VRM is a glTF extension authored by the VRM Consortium and
        the{" "}
        <a
          href="https://github.com/vrm-c/vrm-specification"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          vrm-specification{arrow}
        </a>{" "}
        repository documents it in full. Almost every VRM in the
        wild ships with{" "}
        <em>MToon</em>
        , a cel/toon material defined as part of the spec. MToon
        bakes in three opinions: a shade-toon ramp (a step
        function over the dot product of the normal and the main
        light direction), rim-light shaped by a Fresnel term, and
        an inverted-hull outline whose thickness is driven by
        per-vertex normals. The avatar arrives in your scene
        already toon-shaded, already outlined, already lit by a
        single dominant light it expects you to have placed
        somewhere sensible.
      </p>

      <p>
        Drop that avatar into a Three.js scene full of geometry
        shaded with `MeshStandardMaterial` and the seam is
        immediate. The room is physically based and the avatar is
        decidedly not. The avatar has outlines and the room does
        not. The avatar's shade-toon ramp steps at the half-angle
        and the room's PBR softens across the same angle. Two
        different worlds, one camera. The eye reports back: this
        is composite, not scene.
      </p>

      <p>
        Reverse the trap and the result is the same in the other
        direction. Build the room with `MeshToonMaterial`, hand
        the avatar to{" "}
        <a
          href="https://github.com/pixiv/three-vrm"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          @pixiv/three-vrm{arrow}
        </a>{" "}
        without telling MToon which light to listen to, and the
        avatar's rim term fights the room's rim term, the avatar's
        outline thickness scales by a different rule, and the
        ramps step at different intensities. The seam is still
        there. It has merely changed location.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The unifying principle
      </h2>

      <p>
        Pick one lighting model. Pick one outline strategy. Pick
        one colour palette. Bend everything to those three
        choices. Refuse the temptation to chain three different
        shader stacks and hope the user's eye does not notice; the
        user's eye always notices, because the noticing happens
        below conscious thought.
      </p>

      <p>
        The studio's working position is that the cheapest
        coherent scene is the one where the avatar arrives already
        shaded and the environment is built to match. MToon is
        already in the pipeline; MToon's algorithm is documented;
        MToon's source is readable. The environment becomes the
        thing that conforms. Everything in the rest of this
        article follows from that single decision.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        MToon as the anchor
      </h2>

      <p>
        MToon's shading is straightforward to describe. For each
        fragment, compute the lambertian term as the dot product
        of the world-space normal and the world-space main light
        direction, clamped to [0, 1]. Use that scalar as a UV into
        a 1D ramp texture (typically 2 to 5 steps). Multiply by
        the shade-tint and the lit-tint at the two ends of the
        ramp. Add a rim-light term shaped by `(1 - dot(N, V))^p`
        for view direction V and a falloff exponent p. Render an
        inverted-hull pass behind the main pass, vertex-extruded
        along the normal by a small distance, in solid outline
        colour, with the front face culled.
      </p>

      <p>
        Three.js's stock{" "}
        <a
          href="https://github.com/mrdoob/three.js/blob/dev/src/materials/MeshToonMaterial.js"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          MeshToonMaterial{arrow}
        </a>{" "}
        implements the ramp half of this and exposes a
        `gradientMap` slot. The Unity reference implementation by
        IronWarrior &mdash;{" "}
        <a
          href="https://github.com/IronWarrior/UnityToonShader"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          UnityToonShader{arrow}
        </a>{" "}
        &mdash; is the canonical place to read the full algorithm
        if you want to see ramp, rim, specular, and outline laid
        out side by side in well-commented HLSL. The Godot port
        at{" "}
        <a
          href="https://github.com/lordstefan/godot-cel-shader"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          godot-cel-shader{arrow}
        </a>{" "}
        translates the same algorithm into GLSL-flavoured shader
        code that maps cleanly onto Three's TSL node graph.
      </p>

      <p>
        Anchoring the environment to MToon means three concrete
        commitments: the environment uses the same ramp texture
        as the avatar (so the steps fall at the same intensities),
        the environment's main light is the same directional light
        the VRM was authored against (so the half-angle break sits
        at the same physical angle), and the environment's
        outlines obey the same world-space-thickness rule MToon's
        inverted hull does (so a chair leg and a forearm get
        outlines of the same visual weight at the same camera
        distance).
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Three approaches to environment shading
      </h2>

      <p>
        The studio has tried three. Each has a place, depending
        on how much shader-writing the project can afford and how
        much control over the final image the artist needs.
      </p>

      <p>
        <strong>One: stock `MeshToonMaterial` with a shared ramp.</strong>
        {" "}
        Fastest path. Three.js ships the material; you supply a
        small 1D gradient texture (the same one the avatar's MToon
        is sampling) and the environment falls into broadly the
        same key. Cheap to render, no custom shaders to maintain,
        roughly the right shape. The honest cost is that
        `MeshToonMaterial` does not expose MToon's rim or shade
        tints directly; the match is approximate.
      </p>

      <p>
        <strong>Two: a custom TSL node material modelled on the
        Godot cel-shader.</strong>{" "}
        Mid-effort. Three.js's TSL node system lets you compose
        the lambert term, the ramp lookup, the rim term, and the
        outline pass as named nodes that can be tweaked at
        runtime. The reference algorithm is the godot-cel-shader
        repo above; the port is mechanical because TSL's vocabulary
        (`dot`, `step`, `mix`, `Fn`) lines up almost word-for-word
        with GLSL. The benefit is a single shader graph the
        environment and the avatar can share rim and shade
        parameters with.
      </p>

      <p>
        <strong>Three: a fully custom `ShaderMaterial` ported
        from UnityToonShader.</strong>{" "}
        Most effort, most control. You hand-write GLSL, you wire
        every uniform, you handle the inverted-hull outline pass
        as a separate material on a back-face-only mesh. The
        upside is that you can match MToon byte-for-byte on the
        environment side, including the specular and the cel-step
        smoothing parameters MToon exposes but `MeshToonMaterial`
        ignores. The downside is the maintenance burden; the
        IronWarrior reference is ~400 lines of HLSL and the GLSL
        port is comparable.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Two outline strategies
      </h2>

      <p>
        <strong>Inverted-hull outlines.</strong> The technique
        Borderlands and Jet Set Radio and Guilty Gear Xrd and
        MToon itself all use. Render the mesh twice. The first
        pass extrudes every vertex along its normal by a small
        distance, draws the result in solid outline colour, and
        culls the front faces so only the back of the shell is
        visible. The second pass is the normal lit render.
        Wherever the silhouette of the inner mesh diverges from
        the outer shell, the outer shell shows through as a line.
      </p>

      <p>
        Cheap, works on dynamic meshes, parallelises well, exactly
        the technique MToon uses for VRM avatars. The trade-off
        is that on convex geometry the line can read thicker than
        intended, and on geometry with non-smoothed normals the
        line breaks at the seams (the fix: pre-process meshes
        with averaged smoothing-group normals stored in a
        secondary vertex attribute, then extrude along those
        rather than along the shading normal).
      </p>

      <p>
        <strong>Post-process edge detection.</strong> A second
        camera pass over the depth and normal buffers, running a
        Sobel or Roberts cross filter to find discontinuities,
        compositing the resulting edges over the colour buffer.
        The{" "}
        <a
          href="https://github.com/pmndrs/postprocessing"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          pmndrs/postprocessing{arrow}
        </a>{" "}
        library ships a clean `OutlineEffect` for this.
      </p>

      <p>
        Higher quality (the line is exactly one pixel wide, every
        time), more expensive, and the failure mode in VR is
        characteristic: the post-process pass runs per-eye, the
        eye buffers can have slightly different depth at the
        silhouette, and the line shimmers in stereo. The studio's
        rule of thumb is: post-process edges on flat screens,
        inverted hulls in VR.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The VR performance budget
      </h2>

      <p>
        VR's frame budget is the single load-bearing constraint
        for cel-shaded scenes. 90Hz per eye, two eyes, foveated
        rendering off the inner ring; 11 milliseconds per frame
        becomes more like 6 milliseconds at the periphery. Every
        decision above has to clear that bar.
      </p>

      <p>
        Inverted-hull outlines beat post-process outlines on the
        budget alone &mdash; the hull pass is one extra draw call
        per outlined mesh, against the post-process pass's
        per-pixel work over the entire framebuffer twice.
        Vertex-colour palettes beat texture lookups; cel-shaded
        worlds rarely need per-pixel texture detail and the
        bandwidth saving is significant. Baked lightmaps beat
        real-time lighting; the world is lit by one main light
        the artist already knows the angle of, the directional
        bake is fast and the runtime cost is a single texture
        fetch. Instanced meshes beat per-mesh draws; toytown
        scenes are repetitive by their nature and instancing
        collapses the draw-call count.
      </p>

      <p>
        The general shape: keep the shader cheap, keep the
        geometry simple, keep the texture sampling minimal,
        outline by inverted hull, light by single directional plus
        baked ambient occlusion, and the per-eye budget holds.
        See also the studio's separate articles on{" "}
        <Link href="/articles/low-poly-graphics-in-vr" className={ext}>
          low-poly graphics in VR
        </Link>{" "}
        and{" "}
        <Link href="/articles/cell-shaded-graphics-in-vr" className={ext}>
          cell-shaded graphics in VR
        </Link>{" "}
        for the longer treatment of each constraint.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        VRM-specific tricks
      </h2>

      <p>
        VRMs ship at 1 unit = 1 metre and are authored against
        Y-up world-space. Do not scale them. Build the room to
        match the avatar's scale rather than the reverse;
        MToon's outline thickness is computed in world units and
        scaling the avatar makes the outline scale with it,
        producing visibly different line weights on
        environment-vs-avatar geometry.
      </p>

      <p>
        Match the environment's directional light to the
        `mainLightDirection` the VRM was authored for. The
        VRM spec does not store an absolute light direction but
        most authoring tools assume a light roughly down-and-to-the-side
        (the studio uses `(0.5, -1.0, 0.5)`, normalised). Get this
        wrong and the avatar's shaded side and the room's shaded
        side will be on different sides of the geometry.
      </p>

      <p>
        Drive facial expression through the VRM blend-shape proxy
        rather than direct morph-target manipulation. The proxy is
        the layer the spec defines for VRM 0.x and VRM 1.0
        compatibility; `@pixiv/three-vrm` exposes it as
        `vrm.expressionManager`. Setting `"happy"` to 1.0 there
        triggers the avatar's authored expression rather than a
        single morph target the next avatar may not have.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        A worked walk-through
      </h2>

      <p>
        The minimum-viable cohesive scene: one VRM avatar, one
        low-poly environment, one shared ramp texture, one main
        directional light, inverted-hull outlines on both. The
        code below assembles it from `@pixiv/three-vrm`,
        `MeshToonMaterial`, and a custom outline material. The
        snippets are extracted from working pieces inside the
        studio bench &mdash; the avatar loader is the canonical
        pattern from{" "}
        <a
          href="https://github.com/pixiv/three-vrm/tree/dev/packages/three-vrm/examples"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          pixiv/three-vrm examples{arrow}
        </a>
        ; the outline material mirrors the inverted-hull pattern
        from{" "}
        <a
          href="https://github.com/IronWarrior/UnityToonShader"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          UnityToonShader{arrow}
        </a>
        .
      </p>

      <p>
        <strong>The shared ramp.</strong> A two-step gradient
        texture, used by both the avatar's MToon and the
        environment's MeshToonMaterial. This is the single most
        important shared asset in the scene.
      </p>

      <pre className={codeBlock}>
{`// shared-ramp.ts
import { DataTexture, RedFormat, NearestFilter, SRGBColorSpace } from "three";

// 4-step ramp — shadow, mid-shadow, mid-lit, lit.
const STEPS = new Uint8Array([60, 130, 200, 255]);

export const sharedRamp = new DataTexture(
  STEPS, STEPS.length, 1, RedFormat,
);
sharedRamp.magFilter = NearestFilter;   // hard steps, not interpolated
sharedRamp.minFilter = NearestFilter;
sharedRamp.colorSpace = SRGBColorSpace;
sharedRamp.needsUpdate = true;`}
      </pre>

      <p>
        <strong>The VRM avatar.</strong> Loaded via the official
        plugin. The light direction is wired immediately after
        load so MToon's shade computation uses the same vector
        as the environment.
      </p>

      <pre className={codeBlock}>
{`// avatar.ts — adapted from pixiv/three-vrm examples (MIT)
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { DirectionalLight, Vector3 } from "three";

const mainLight = new DirectionalLight(0xfff0e0, 1.0);
mainLight.position.set(0.5, 1.0, 0.5).normalize();
scene.add(mainLight);

const loader = new GLTFLoader();
loader.register((parser) => new VRMLoaderPlugin(parser));

const gltf = await loader.loadAsync("/avatars/aura.vrm");
const vrm = gltf.userData.vrm;
VRMUtils.rotateVRM0(vrm);                 // VRM 0.x ships rotated 180°
scene.add(vrm.scene);

// Tell MToon which light to listen to.
vrm.lookAt?.applier?.lookAt(new Vector3(0, 1.5, 1));`}
      </pre>

      <p>
        <strong>The environment material.</strong> Stock
        `MeshToonMaterial` with the shared ramp. Every prop in
        the scene reuses this material instance.
      </p>

      <pre className={codeBlock}>
{`// environment-material.ts
import { MeshToonMaterial } from "three";
import { sharedRamp } from "./shared-ramp";

export const toonMat = new MeshToonMaterial({
  color: 0xb5d8c4,           // pale mint — picked once for the world palette
  gradientMap: sharedRamp,    // same ramp the avatar's MToon samples
});`}
      </pre>

      <p>
        <strong>The outline pass.</strong> A back-face-culled
        inverted-hull material, applied to a cloned mesh. The
        offset is computed in world units so the line reads the
        same on a chair and on a forearm.
      </p>

      <pre className={codeBlock}>
{`// outline-material.ts — pattern from IronWarrior/UnityToonShader (MIT)
import { ShaderMaterial, BackSide, Color } from "three";

export const outlineMat = new ShaderMaterial({
  side: BackSide,
  uniforms: {
    outlineColor: { value: new Color(0x0b0a14) },
    outlineWidth: { value: 0.012 },   // ~12mm in world units
  },
  vertexShader: \`
    uniform float outlineWidth;
    void main() {
      vec3 inflated = position + normal * outlineWidth;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(inflated, 1.0);
    }
  \`,
  fragmentShader: \`
    uniform vec3 outlineColor;
    void main() { gl_FragColor = vec4(outlineColor, 1.0); }
  \`,
});

// applyOutline(mesh) — clone the mesh, swap material, add to parent.
export function applyOutline(mesh) {
  const shell = mesh.clone();
  shell.material = outlineMat;
  mesh.parent.add(shell);
}`}
      </pre>

      <p>
        That is the full scene. ~70 lines across four files, one
        shared ramp, one shared light direction, one outline
        strategy, one colour palette. The avatar and the
        environment now share an algorithm rather than just
        sharing a camera.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Honest limitations
      </h2>

      <p>
        Three things do not yet work cleanly and the reader
        should know about them up front.
      </p>

      <p>
        <strong>Foveated rendering plus cel-shading is rough.</strong>{" "}
        The cel ramp is a step function and the foveated edge is
        a resolution discontinuity; the human eye reports the
        step at the foveation boundary as a moving artefact even
        when the static frame looks fine. The mitigation is to
        widen the inner foveation ring beyond the default,
        accepting the GPU cost. The fundamental fix probably
        waits for adaptive ramps that smooth across the
        foveation transition; the studio is not aware of an OSS
        implementation as of writing.
      </p>

      <p>
        <strong>Outline thickness under stereo.</strong> The
        inverted-hull outline is computed in world units, which
        means the line has the same physical thickness from both
        eyes &mdash; which means the two eyes see a slightly
        different angular thickness, and the disparity is
        interpreted by the visual system as a depth cue. The
        line ends up reading as a thin object floating slightly
        in front of the silhouette. The fix is to scale the
        outline width by camera distance (so angular thickness
        is consistent) rather than holding world thickness
        constant; the cost is that the line gets perceptibly
        thinner in the distance.
      </p>

      <p>
        <strong>MToon's outline vs custom post-process.</strong>{" "}
        If you keep MToon's inverted-hull outlines on the avatar
        and also run a post-process edge pass over the whole
        scene, the avatar gets outlined twice &mdash; once by
        MToon's hull and once by the edge pass &mdash; and the
        two lines do not overlap perfectly. The cleanest fix is
        to choose one and disable the other. The studio's
        default is to keep MToon's outlines and skip the
        post-process pass; the alternative is to disable MToon's
        outlines (`mtoon.outlineWidthMode = "none"`) and let the
        post-process handle the whole scene uniformly.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Where to look next
      </h2>

      <p>
        The OSS code the studio reads when working in this
        register, in rough order of how often it gets opened:
      </p>

      <ul className="ml-6 list-disc space-y-2">
        <li>
          <a
            href="https://github.com/pixiv/three-vrm"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            @pixiv/three-vrm{arrow}
          </a>
          {" "}&mdash; particularly the MToon implementation under
          `packages/three-vrm-materials-mtoon`.
        </li>
        <li>
          <a
            href="https://github.com/vrm-c/vrm-specification"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            vrm-specification{arrow}
          </a>
          {" "}&mdash; the formal spec; the MToon section is the
          one to read in full.
        </li>
        <li>
          <a
            href="https://github.com/vrm-c/UniVRM"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            UniVRM{arrow}
          </a>
          {" "}&mdash; the Unity reference; the source of truth
          when the Three.js implementation diverges from the spec.
        </li>
        <li>
          <a
            href="https://github.com/IronWarrior/UnityToonShader"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            UnityToonShader (IronWarrior){arrow}
          </a>
          {" "}&mdash; the canonical readable cel-shader
          implementation, well-commented.
        </li>
        <li>
          <a
            href="https://github.com/lordstefan/godot-cel-shader"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            godot-cel-shader{arrow}
          </a>
          {" "}&mdash; the GLSL port worth reading alongside the
          Unity one.
        </li>
        <li>
          <a
            href="https://github.com/mrdoob/three.js/blob/dev/src/materials/MeshToonMaterial.js"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Three.js MeshToonMaterial source{arrow}
          </a>
          {" "}&mdash; the cheap-path material; useful to read
          for the gradient-map sampling pattern.
        </li>
        <li>
          <a
            href="https://github.com/pmndrs/postprocessing"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            pmndrs/postprocessing{arrow}
          </a>
          {" "}&mdash; for the post-process outline approach if
          the inverted-hull path doesn't fit the use case.
        </li>
        <li>
          <a
            href="https://github.com/przemyslawzaworski/Unity3D-CG-programming"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Unity3D-CG-programming{arrow}
          </a>
          {" "}&mdash; reference library of 200+ shaders;
          particularly useful for cel + Fresnel + posterise
          combinations.
        </li>
      </ul>

      <p>
        Also worth tracking: the studio's open-source catalogue at{" "}
        <Link href="/docs/open-source-stack" className={ext}>
          docs/OPEN-SOURCE-STACK.md
        </Link>{" "}
        lists every project named above alongside their licences
        and the role they play in the public site.
      </p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry = {
  slug: "cohesive-low-poly-cell-shaded-vrm-worlds",
  title:
    "Building a cohesive world — low-poly geometry, cell-shaded lighting, and VRM avatars that don't fight each other",
  date: "2026-05-19",
  kind: "article",
  excerpt:
    "VRMs ship pre-shaded by MToon. Low-poly cel environments have their own ramps and outline rules. Pick one lighting model, one outline strategy, one palette; bend everything to those three choices. MToon as the anchor, three environment-shading approaches, two outline strategies, a VR perf budget, a worked walk-through with code from the OSS repos, and the honest limitations.",
  Body: CohesiveLowPolyCellShadedVrmWorlds,
  related: [
    {
      href: "/articles/low-poly-graphics-in-vr",
      label: "Low-poly graphics in VR",
      note: "The longer treatment of the geometry-side constraints.",
    },
    {
      href: "/articles/cell-shaded-graphics-in-vr",
      label: "Cell-shaded graphics in VR",
      note: "The longer treatment of the shading-side constraints.",
    },
    {
      href: "/articles/aura-the-body",
      label: "Aura — The Body",
      note: "The architectural pieces this article assumes the reader has seen.",
    },
    {
      href: "/articles/vr-as-psychological-system",
      label: "VR as a psychological system",
      note: "Why presence — not photorealism — is the load-bearing variable.",
    },
    {
      href: "/articles/on-the-shoulders-of-open-source",
      label: "On the shoulders of open source",
      note: "The studio's working bibliography for the OSS the rigs run on.",
    },
  ],
  furtherReading: [
    {
      href: "https://github.com/pixiv/three-vrm",
      label: "@pixiv/three-vrm",
      note: "The VRM 0.x and 1.0 loader for Three.js, including MToon, blend-shape proxy, look-at and spring-bones.",
    },
    {
      href: "https://github.com/vrm-c/vrm-specification",
      label: "VRM specification",
      note: "The formal spec — read the MToon section in full.",
    },
    {
      href: "https://github.com/vrm-c/UniVRM",
      label: "UniVRM",
      note: "The Unity reference implementation; the source of truth when Three.js diverges.",
    },
    {
      href: "https://github.com/IronWarrior/UnityToonShader",
      label: "UnityToonShader",
      note: "Canonical, well-commented cel-shader implementation.",
    },
    {
      href: "https://github.com/lordstefan/godot-cel-shader",
      label: "godot-cel-shader",
      note: "GLSL port of the same algorithm; ports cleanly into Three.js TSL.",
    },
    {
      href: "https://github.com/mrdoob/three.js/blob/dev/src/materials/MeshToonMaterial.js",
      label: "Three.js MeshToonMaterial source",
      note: "Stock cel material — the cheap-path environment shader.",
    },
    {
      href: "https://github.com/pmndrs/postprocessing",
      label: "pmndrs/postprocessing",
      note: "Effect composer with OutlineEffect — the post-process alternative to inverted-hull outlines.",
    },
    {
      href: "https://github.com/przemyslawzaworski/Unity3D-CG-programming",
      label: "Unity3D-CG-programming",
      note: "200+ shader references; useful for cel + Fresnel + posterise patterns.",
    },
    {
      href: "https://github.com/mrdoob/three.js/tree/dev/examples",
      label: "Three.js examples",
      note: "The single most-referenced asset bank for working Three.js patterns.",
    },
  ],
};
