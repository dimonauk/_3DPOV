import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

const codeBlock =
  "mt-4 mb-6 overflow-x-auto rounded-md border border-chrome-700/40 bg-black/40 p-4 text-xs leading-relaxed text-chrome-100";

export default function LowPolyHighFacetShading() {
  return (
    <>
      <p>
        Two meshes can carry the same triangle count and read as
        opposite objects. One is a faceted jewel, every plane
        catching the light at its own angle. The other is a
        smooth-shaded blob that announces, plainly, that the
        modeller ran out of triangles. The geometry is identical.
        The shading is the entire difference.
      </p>

      <p>
        The faceted look is not a budget compromise. It is a
        positive aesthetic choice with its own canon, its own
        legibility argument, and a small set of authoring habits
        that distinguish the work that survives from the work that
        looks accidentally crude. This article sets out the
        aesthetic, walks the canon, names the perceptual reason the
        eye reads facets so cleanly, and then &mdash; in the
        workshop register the studio uses when the editor steps
        away &mdash; lays out the shading recipe in Three.js and
        TSL.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The aesthetic, defined
      </h2>

      <p>
        Low-poly is a geometry choice. Faceted shading is a normals
        choice. The two travel together in the canon but they are
        independent decisions and confusing them is the first
        mistake.
      </p>

      <p>
        A low-poly mesh with smoothed normals &mdash; where every
        triangle averages its corner normals with its neighbours
        &mdash; reads as crude. The brain sees a soft-shaded
        surface and asks for the texture detail it associates with
        soft shading. There is none, because there are not enough
        triangles for the texture frequency the soft shading
        implied. The eye reports back: this is a low-resolution
        model trying to look smooth. It fails.
      </p>

      <p>
        The same mesh with flat normals &mdash; where every
        triangle carries its own face normal and ignores its
        neighbours &mdash; reads as a faceted jewel. The brain
        sees explicit planes. The brain has no expectation of
        texture detail across an obviously flat plane. The eye
        reports back: this is a solid carved object made of
        triangular facets, exactly as drawn. The geometry passes
        the perceptual test it failed with smooth shading. The
        faceted look <em>is</em> the style. The flat normals are
        what make it work.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The canon
      </h2>

      <p>
        The faceted-mesh school has a clear lineage. The studios
        below are the entries the princess hands a reader who
        wants to understand the register.
      </p>

      <p>
        <strong>
          <a
            href="https://www.monumentvalleygame.com/mv1"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Monument Valley{arrow}
          </a>{" "}
          (ustwo, London)
        </strong>{" "}
        is the canonical faceted-architecture project. Every
        impossible staircase, every Escher landing, every pastel
        block is a low-poly faceted solid. The art direction
        leans into the facets rather than apologising for them.
        The studio's process notes &mdash; published on{" "}
        <a
          href="https://www.ustwo.com/blog/category/monument-valley"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          ustwo.com{arrow}
        </a>{" "}
        &mdash; are worth reading for the colour-palette
        discipline that makes the facets read as architecture
        rather than as polygons.
      </p>

      <p>
        <strong>
          <a
            href="https://thatgamecompany.com/journey/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Journey{arrow}
          </a>{" "}
          (thatgamecompany)
        </strong>{" "}
        carries the faceted look across vast dunes. The trick is
        that the dunes use flat normals plus a per-facet baked
        texture &mdash; a sub-style the studio calls
        textured-flat below. The texture adds a slow gradient of
        sand colour across each facet, the flat normals keep
        the facet boundaries crisp, and the cumulative effect
        is a landscape that reads as wind-sculpted sand rather
        than as a polygonal mesh.
      </p>

      <p>
        <strong>
          <a
            href="https://www.firewatchgame.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Firewatch{arrow}
          </a>{" "}
          (Campo Santo)
        </strong>{" "}
        commits to flat-shaded foliage in stylised-tessellated
        form. The tree canopies are higher tri count than
        Monument Valley would use, but the polygons are
        deliberately flat-shaded so the tessellation reads as a
        designed texture. The sky uses a cel ramp; the trees
        use flat normals; the combination produces the
        instantly recognisable Firewatch silhouette.
      </p>

      <p>
        <strong>
          <a
            href="https://playdead.com/games/inside/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            INSIDE{arrow}
          </a>{" "}
          (Playdead, Denmark)
        </strong>{" "}
        uses faceted shadow shapes in otherwise stylised
        environments. The famous custom volumetric fog and the
        crushed colour palette work because the underlying
        geometry is faceted enough to let shadows fall as
        clean wedges. Playdead's technical breakdown by
        S&oslash;nderga&aring;rd Pedersen at SIGGRAPH 2016 (
        <em>Low Complexity, High Fidelity: The Rendering of
        INSIDE</em>
        ) is the canonical reference.
      </p>

      <p>
        <strong>
          <a
            href="https://en.wikipedia.org/wiki/Antichamber"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Antichamber{arrow}
          </a>{" "}
          (Demruth, Australia)
        </strong>{" "}
        weaponises facets for non-Euclidean spaces. The flat
        shading on the white walls is what allows the player to
        register the impossible geometry &mdash; soft shading
        would have blurred the corners the puzzle depends on.
        A counter-example that proves the rule: the puzzles
        only work because the facets give the brain
        unambiguous edges to track.
      </p>

      <p>
        <strong>The Polyhedrons school.</strong> A loose
        community of low-poly artists who established the
        contemporary look on Tumblr, Twitter and Sketchfab from
        roughly 2013 onwards.{" "}
        <a
          href="https://timothyjreynolds.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Timothy J. Reynolds{arrow}
        </a>{" "}
        (also published under{" "}
        <em>turnislefthome</em>) produced the small,
        precious-feeling low-poly dioramas that defined a
        decade of the look.{" "}
        <a
          href="https://www.andreaswannerstedt.se/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Andreas Wannerstedt{arrow}
        </a>{" "}
        carries the lineage forward into looped 3D animation
        with the same faceted vocabulary.
      </p>

      <p>
        <strong>
          <a
            href="http://the-witness.net/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            The Witness{arrow}
          </a>{" "}
          (Thekla, Inc)
        </strong>{" "}
        sits at the edge of the canon. Most of the island is
        smooth-shaded, but the rocks and many of the landscape
        elements are deliberately faceted. The contrast between
        smooth foliage and faceted geology is the visual
        signature of the game's outdoor scenes.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Why the eye reads faceted-as-3D
      </h2>

      <p>
        The visual system is solving a hard problem in real
        time: convert a 2D retinal image back into a 3D scene.
        It does this with a set of cues. Stereoscopy is one.
        Parallax under head motion is another. Shading
        gradients across a surface are a third &mdash; the
        brain knows that smooth lighting falloff implies a
        curved surface, and a sharp lighting discontinuity
        implies an edge.
      </p>

      <p>
        Flat-shaded triangular facets feed that third cue
        unusually cleanly. Every facet boundary is a sharp
        lighting discontinuity. Every facet interior is
        perfectly uniform. The brain receives an unambiguous
        signal: there are N planes meeting at edges; the planes
        are oriented thus; the object is therefore a solid of
        these dimensions. The interpretation is fast and
        confident because no part of the lighting is
        contradicting any other part.
      </p>

      <p>
        Contrast this with a low-poly smooth-shaded mesh. The
        shading varies continuously across the surface, implying
        a smooth curve, while the silhouette stays angular,
        implying flat planes. The two cues disagree. The brain
        spends extra cycles trying to reconcile them and the
        object reads as wrong. The SIGGRAPH 2010 NPR course
        (Spencer, B. et al.,{" "}
        <em>Non-Photorealistic Rendering</em>) covers this
        cue-conflict argument at depth.
      </p>

      <p>
        The takeaway: faceted shading is not an absence of
        sophistication. It is a deliberate alignment of every
        available lighting cue with the geometry. The look
        reads as solid because the cues all agree.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Three sub-styles
      </h2>

      <p>
        The canon falls into three groups. The vocabulary is
        the studio's; the distinction is useful when planning
        a piece.
      </p>

      <p>
        <strong>Crystalline.</strong> Every facet a clean flat
        plane. No texture, no per-facet jitter, just colour and
        normal. Monument Valley is the reference. Works for
        architecture, hard-surface props, jewellery, anything
        that should read as carved or cast.
      </p>

      <p>
        <strong>Textured-flat.</strong> Flat normals plus a
        per-facet baked texture giving subtle variation in
        colour or value across each plane. Journey's dunes are
        the reference. Works for organic surfaces &mdash;
        sand, grass, rock, water &mdash; that need the
        large-scale geometric clarity of facets but also need
        some surface noise to avoid reading as plastic.
      </p>

      <p>
        <strong>Stylised-tessellated.</strong> High tri count,
        deliberately flat-shaded so the tessellation itself
        becomes the texture. Firewatch foliage is the
        reference. Works when the artist wants the facets to
        register as a designed pattern rather than as
        individual planes &mdash; cumulus clouds, tree
        canopies, foam.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The shading recipe
      </h2>

      <p>
        Workshop register from here. The princess steps out;
        Dimona takes over. The remainder of the article is a
        working Three.js / TSL recipe with code pulled from
        the studio bench. Open the snippets in a tab next to
        an editor.
      </p>

      <h3 className="mt-8 text-xl text-chrome-100">
        Step 1: the one-line answer
      </h3>

      <p>
        Three.js has shipped a flat-shading flag on every
        standard material since r70. For most of the
        crystalline sub-style, this is the entire shader.
      </p>

      <pre className={codeBlock}>
{`// crystalline.ts — the one-line answer
import { MeshStandardMaterial } from "three";

export const crystallineMat = new MeshStandardMaterial({
  color: 0xb5d8c4,
  flatShading: true,   // <-- this is the whole technique
  roughness: 0.85,
  metalness: 0.0,
});`}
      </pre>

      <p>
        The flag swaps the vertex-normal interpolation for a
        per-fragment recomputation using <code>dFdx</code> /
        <code>dFdy</code> on the world position; every fragment
        ends up with the face normal of the triangle it
        belongs to. The trade-off is that you lose smooth
        normals everywhere &mdash; the flag is mesh-wide. If
        you need a mix of smooth and faceted on one mesh, split
        the mesh by material, or pre-bake hard-edge normals in
        Blender (covered below).
      </p>

      <h3 className="mt-8 text-xl text-chrome-100">
        Step 2: shader-side edge accentuation
      </h3>

      <p>
        When the basic flag isn't doing enough &mdash; the
        facets are reading but the edges aren't crisp enough
        for the look you want &mdash; reach for the same{" "}
        <code>dFdx</code> / <code>dFdy</code> trick directly in
        a custom shader. The derivative of the world normal
        across a fragment quad is high at facet boundaries and
        zero across a flat plane. Use it as an edge mask.
      </p>

      <pre className={codeBlock}>
{`// edge-accent.frag — pattern from three.js examples (MIT)
varying vec3 vWorldNormal;
varying vec3 vWorldPos;
uniform vec3 baseColor;
uniform vec3 edgeColor;

void main() {
  // Re-derive a flat normal from screen-space derivatives.
  vec3 dx = dFdx(vWorldPos);
  vec3 dy = dFdy(vWorldPos);
  vec3 flatN = normalize(cross(dx, dy));

  // Compare against the interpolated vertex normal — the
  // disagreement is the facet boundary.
  float edge = 1.0 - clamp(dot(flatN, normalize(vWorldNormal)), 0.0, 1.0);
  edge = smoothstep(0.05, 0.15, edge);

  vec3 col = mix(baseColor, edgeColor, edge);
  gl_FragColor = vec4(col, 1.0);
}`}
      </pre>

      <p>
        Pair the fragment with a vertex shader that passes{" "}
        <code>vWorldNormal</code> and <code>vWorldPos</code>{" "}
        through unchanged. The derivative pattern is lifted
        from the{" "}
        <a
          href="https://github.com/mrdoob/three.js/blob/dev/examples/jsm/shaders/EdgeShader.js"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          three.js EdgeShader{arrow}
        </a>{" "}
        and the same approach is used inside three's
        <code>flatShading</code> implementation.
      </p>

      <h3 className="mt-8 text-xl text-chrome-100">
        Step 3: per-facet random colour for the textured-flat
        look
      </h3>

      <p>
        The Journey dunes effect &mdash; every facet a slightly
        different shade of the base colour &mdash; needs a hash
        keyed off something stable per triangle. The cheapest
        stable key is the integer triangle ID, available in
        WebGL2 via <code>gl_PrimitiveID</code> and in three.js
        as <code>vertexID / 3</code> when the geometry is
        non-indexed.
      </p>

      <pre className={codeBlock}>
{`// per-facet-jitter.frag — pattern from
// stylized-water-shader (MIT) by ErikSom on GitHub
varying vec3 vWorldPos;
uniform vec3 baseColor;

// Cheap deterministic hash → [0, 1]
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec3 dx = dFdx(vWorldPos);
  vec3 dy = dFdy(vWorldPos);
  vec3 flatN = normalize(cross(dx, dy));

  // Use the face normal as the hash seed — every facet of
  // the mesh gets a stable, distinct random value.
  float h = hash21(flatN.xy + flatN.z);
  vec3 jitter = mix(0.85, 1.15, h) * baseColor;

  // Standard lambert against a fixed light direction.
  float l = max(dot(flatN, normalize(vec3(0.5, 1.0, 0.5))), 0.0);
  gl_FragColor = vec4(jitter * (0.4 + 0.6 * l), 1.0);
}`}
      </pre>

      <p>
        Keep the jitter range tight &mdash; the studio's rule
        is &plusmn;15% of the base value. Anything wider
        crosses into the ANT-vision failure mode described
        below.
      </p>

      <h3 className="mt-8 text-xl text-chrome-100">
        Step 4: the TSL equivalent
      </h3>

      <p>
        Three's WebGPU renderer ships a TSL node graph that
        replaces the GLSL pipeline. The flat-shading flag
        carries across to <code>MeshStandardNodeMaterial</code>{" "}
        unchanged. For custom flat-normal work, use{" "}
        <code>normalView</code> and the <code>dFdx</code> /
        <code>dFdy</code> nodes directly.
      </p>

      <pre className={codeBlock}>
{`// tsl-faceted.ts — TSL node-graph version
import {
  MeshStandardNodeMaterial,
  cross, dFdx, dFdy, normalize,
  positionWorld, mix, dot, max, vec3,
} from "three/tsl";

const dx = dFdx(positionWorld);
const dy = dFdy(positionWorld);
const flatN = normalize(cross(dx, dy));

const lightDir = vec3(0.5, 1.0, 0.5).normalize();
const lambert = max(dot(flatN, lightDir), 0.0);

const baseColor = vec3(0.71, 0.85, 0.77);
const shaded = mix(baseColor.mul(0.4), baseColor, lambert);

export const facetedNodeMat = new MeshStandardNodeMaterial();
facetedNodeMat.colorNode = shaded;
facetedNodeMat.flatShading = true;`}
      </pre>

      <p>
        TSL's vocabulary is close enough to GLSL that the port
        is mechanical. The single notable difference: TSL's{" "}
        <code>positionWorld</code> is automatically derived per
        fragment, so the <code>dFdx</code> / <code>dFdy</code>{" "}
        calls give you the right derivative without manual
        varying setup.
      </p>

      <h3 className="mt-8 text-xl text-chrome-100">
        Step 5: authoring meshes for this look
      </h3>

      <p>
        Blender side, three keystroke patterns cover ninety
        percent of the work:
      </p>

      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>Whole-mesh flat shade.</strong> Object Mode,
          select the object, <code>Object &gt; Shade Flat</code>.
          Every face carries its own face normal on export.
        </li>
        <li>
          <strong>Per-face flat shade.</strong> Edit Mode,
          select the faces you want faceted, right-click,{" "}
          <code>Shade Flat</code>. Useful when you want a
          mostly-smooth mesh with deliberately faceted regions.
        </li>
        <li>
          <strong>Disable auto-smooth weighted normals.</strong>{" "}
          Object Data Properties &gt; Normals &gt; turn off{" "}
          <em>Auto Smooth</em>. The auto-smooth pass averages
          normals across edges below a threshold angle and
          quietly destroys the faceted look.
        </li>
      </ul>

      <p>
        On glTF export, tick{" "}
        <code>Geometry &gt; Apply Modifiers</code> and leave{" "}
        <code>Geometry &gt; Use Smooth Normals</code> off. The
        exporter writes per-face normals into the vertex
        attributes; three.js picks them up without further
        intervention.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        OSS implementations worth studying
      </h2>

      <p>
        The repositories the studio opens when working in this
        register, with the specific file or pattern worth
        reading first:
      </p>

      <ul className="ml-6 list-disc space-y-2">
        <li>
          <a
            href="https://github.com/mrdoob/three.js/tree/dev/examples"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            three.js examples{arrow}
          </a>{" "}
          &mdash; <code>webgl_materials_standard.html</code>{" "}
          toggles flat-shading at runtime and is the cleanest
          demo of the flag's effect.
        </li>
        <li>
          <a
            href="https://github.com/mrdoob/three.js/blob/dev/src/materials/MeshStandardMaterial.js"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            MeshStandardMaterial source{arrow}
          </a>{" "}
          &mdash; the <code>flatShading</code> property and its
          shader-side handling.
        </li>
        <li>
          <a
            href="https://github.com/pmndrs/drei"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            pmndrs/drei{arrow}
          </a>{" "}
          &mdash;{" "}
          <code>&lt;MeshTransmissionMaterial&gt;</code> for the
          crystalline jewel-glass sub-variant.
        </li>
        <li>
          <a
            href="https://github.com/godotengine/godot-demo-projects"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            godot-demo-projects{arrow}
          </a>{" "}
          &mdash; the <code>3d/material_testers</code> set has
          flat-shaded standard-material demos that port cleanly
          to three.
        </li>
        <li>
          <a
            href="https://sketchfab.com/tags/lowpoly"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Sketchfab low-poly tag{arrow}
          </a>{" "}
          &mdash; catalogue, not OSS, but useful for studying
          mesh density and silhouette discipline across
          thousands of pieces.
        </li>
        <li>
          <a
            href="https://github.com/IceCreamYou/THREE.Terrain"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            THREE.Terrain{arrow}
          </a>{" "}
          &mdash; procedural terrain generator that defaults to
          flat-shaded output; useful study for the
          textured-flat sub-style at scale.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The trap
      </h2>

      <p>
        Princess back. The faceted look fails in four
        characteristic ways. The studio has hit each of them.
      </p>

      <p>
        <strong>Too few triangles.</strong> A faceted sphere at
        twenty triangles reads as broken. The same sphere at
        sixty triangles reads as a faceted jewel. There is no
        universal threshold &mdash; it depends on the silhouette
        complexity and the viewing distance &mdash; but the
        rule of thumb is that any facet bigger than a few
        degrees of arc at the closest expected camera distance
        will read as a polygon rather than as a plane.
      </p>

      <p>
        <strong>Lighting from the wrong angle.</strong> Facets
        are read by the lighting differential across their
        boundaries. If the main light hits the mesh
        perpendicular to the dominant facet direction, the
        boundaries disappear into uniform shadow and the
        faceted character collapses. Position the key light so
        it grazes the dominant axis &mdash; the studio's
        default is a directional light at roughly
        forty-five degrees above and forty-five degrees to one
        side of the camera.
      </p>

      <p>
        <strong>Mixed shading models in one scene.</strong> A
        flat-shaded foreground prop sitting in a smooth-shaded
        background environment reads as a render bug. The eye
        catches the boundary instantly. The fix is the cohesive
        principle covered in the studio's piece on{" "}
        <Link
          href="/articles/cohesive-low-poly-cell-shaded-vrm-worlds"
          className={ext}
        >
          cohesive low-poly cell-shaded worlds
        </Link>{" "}
        &mdash; commit to one shading model across the scene,
        or design the boundary as a deliberate art direction
        choice (Witness-style).
      </p>

      <p>
        <strong>Too much per-facet colour jitter.</strong> The
        textured-flat sub-style has a knob and the knob has a
        narrow operating range. Push the per-facet colour
        variation past about &plusmn;15% of the base value and
        the mesh starts to look like the surface of a compound
        insect eye. The studio calls this ANT vision. The fix
        is to clamp the jitter range and accept that subtle
        variation is the brief.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        VR caveats
      </h2>

      <p>
        The faceted look survives stereo unusually well. Flat
        planes do not have the normal-aliasing problems
        high-frequency normal maps suffer at parallax &mdash; a
        plane is the same plane from both eyes, and the
        lighting falls the same way across it. The studio's
        longer treatment in{" "}
        <Link href="/articles/low-poly-graphics-in-vr" className={ext}>
          low-poly graphics in VR
        </Link>{" "}
        covers the geometry-side argument.
      </p>

      <p>
        Two caveats. First, the stylised-tessellated sub-style
        at very high tri counts can spike draw calls in VR
        &mdash; the headset is rendering twice per frame at
        ninety hertz and a per-eye budget of eleven
        milliseconds disappears quickly when the foliage
        canopy is forty thousand triangles. Use instancing for
        repeated elements and aggressive frustum culling.
        Second, post-process outline passes (covered in the
        cohesive worlds article) can shimmer at facet
        boundaries under stereo because the two eyes see the
        edge at slightly different depths. The fix is to skip
        the post-process and rely on the natural visual edge
        that flat normals already provide.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Where to look next
      </h2>

      <p>
        On-site companions:
      </p>

      <ul className="ml-6 list-disc space-y-2">
        <li>
          <Link href="/articles/low-poly-graphics-in-vr" className={ext}>
            Low-poly graphics in VR
          </Link>{" "}
          &mdash; the longer treatment of the geometry-side
          constraints.
        </li>
        <li>
          <Link href="/articles/cell-shaded-graphics-in-vr" className={ext}>
            Cell-shaded graphics in VR
          </Link>{" "}
          &mdash; the cel-shading neighbour to this article.
        </li>
        <li>
          <Link
            href="/articles/cohesive-low-poly-cell-shaded-vrm-worlds"
            className={ext}
          >
            Cohesive low-poly cell-shaded VRM worlds
          </Link>{" "}
          &mdash; how to keep a faceted environment and a
          cel-shaded avatar reading as the same scene.
        </li>
        <li>
          <Link
            href="/tutorials/tutorial-dragon-scale-wall-relief"
            className={ext}
          >
            Dragon-scale wall relief
          </Link>{" "}
          &mdash; an applied piece where the high-facet look
          carries the surface character.
        </li>
      </ul>

      <p>
        The faceted look is one of the few aesthetic decisions
        that pays its way in budget terms <em>and</em> arrives
        with a century of art-direction precedent (every cut
        gem, every origami fold, every faceted brutalist
        concrete panel). It is not a retro move. It is the
        oldest move there is.
      </p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry = {
  slug: "low-poly-high-facet-shading",
  title:
    "Low-poly high-facet — the faceted-mesh look, and how to shade it",
  date: "2026-05-19",
  kind: "article",
  excerpt:
    "Low-poly is a geometry choice; faceted shading is a normals choice. Together they form a positive aesthetic with its own canon (Monument Valley, Journey, Firewatch, INSIDE, Antichamber, the Polyhedrons school) and a perceptual argument (flat planes feed every available lighting cue to the brain unambiguously). The article walks the canon, names the three sub-styles (crystalline, textured-flat, stylised-tessellated), and lays out a working Three.js / TSL recipe with code from the studio bench — flatShading flag, dFdx/dFdy edge accentuation, per-facet hash jitter, the TSL node-graph version, and the Blender authoring habits that don't accidentally destroy the look.",
  Body: LowPolyHighFacetShading,
  related: [
    {
      href: "/articles/low-poly-graphics-in-vr",
      label: "Low-poly graphics in VR",
      note: "The geometry-side argument in longer form.",
    },
    {
      href: "/articles/cell-shaded-graphics-in-vr",
      label: "Cell-shaded graphics in VR",
      note: "The cel-shading sister article — the other half of stylised-3D.",
    },
    {
      href: "/articles/cohesive-low-poly-cell-shaded-vrm-worlds",
      label: "Cohesive low-poly cell-shaded VRM worlds",
      note: "How to keep faceted environments and cel-shaded avatars reading as the same scene.",
    },
    {
      href: "/tutorials/tutorial-dragon-scale-wall-relief",
      label: "Dragon-scale wall relief",
      note: "An applied piece where the high-facet look carries the surface character.",
    },
    {
      href: "/articles/from-picasso-forward",
      label: "From Picasso Forward",
      note: "The constraint-as-aesthetic argument the studio keeps coming back to.",
    },
  ],
  furtherReading: [
    {
      href: "https://www.monumentvalleygame.com/mv1",
      label: "Monument Valley (ustwo)",
      note: "Canonical faceted-architecture project; the look most people picture when they hear low-poly.",
    },
    {
      href: "https://www.ustwo.com/blog/category/monument-valley",
      label: "ustwo Monument Valley dev blog",
      note: "Process posts on the colour and shape discipline that makes the facets read as architecture.",
    },
    {
      href: "https://thatgamecompany.com/journey/",
      label: "Journey (thatgamecompany)",
      note: "The textured-flat sub-style at landscape scale.",
    },
    {
      href: "https://www.firewatchgame.com/",
      label: "Firewatch (Campo Santo)",
      note: "Stylised-tessellated flat-shaded foliage; the design-pattern variant of the look.",
    },
    {
      href: "https://playdead.com/games/inside/",
      label: "INSIDE (Playdead)",
      note: "Faceted shadow shapes under crushed colour; see also SIGGRAPH 2016 talk on the rendering pipeline.",
    },
    {
      href: "https://timothyjreynolds.com/",
      label: "Timothy J. Reynolds (turnislefthome)",
      note: "Foundational figure in the contemporary low-poly diorama school.",
    },
    {
      href: "https://www.andreaswannerstedt.se/",
      label: "Andreas Wannerstedt",
      note: "Looped 3D animation in the faceted vocabulary; carries the lineage forward.",
    },
    {
      href: "https://threejs.org/docs/#api/en/materials/MeshStandardMaterial.flatShading",
      label: "three.js flatShading docs",
      note: "The one-line answer — the official documentation for the flag this article rests on.",
    },
    {
      href: "https://github.com/mrdoob/three.js/tree/dev/examples",
      label: "three.js examples",
      note: "The single most-referenced asset bank for working Three.js patterns; flat-shading demos throughout.",
    },
    {
      href: "https://github.com/pmndrs/drei",
      label: "pmndrs/drei",
      note: "MeshTransmissionMaterial for the crystalline jewel-glass variant.",
    },
    {
      href: "https://github.com/IceCreamYou/THREE.Terrain",
      label: "THREE.Terrain",
      note: "Procedural terrain generator that defaults to flat-shaded output; study for textured-flat at scale.",
    },
    {
      href: "https://sketchfab.com/tags/lowpoly",
      label: "Sketchfab low-poly tag",
      note: "Catalogue, not OSS, but invaluable for studying mesh density and silhouette across the field.",
    },
  ],
};
