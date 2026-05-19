import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

const codeBlock =
  "mt-4 mb-6 overflow-x-auto rounded-md border border-chrome-700/40 bg-black/40 p-4 text-xs leading-relaxed text-chrome-100";

const tableWrap =
  "mt-4 mb-6 overflow-x-auto rounded-md border border-chrome-700/40";

const tableCls =
  "w-full text-sm text-chrome-100 [&_th]:border-b [&_th]:border-chrome-700/40 [&_th]:bg-black/30 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-normal [&_th]:text-chrome-300 [&_td]:border-b [&_td]:border-chrome-700/30 [&_td]:px-3 [&_td]:py-2 [&_td]:align-top";

export default function AdvancedCellShadingTechniques() {
  return (
    <>
      <p>
        The princess will start with a small correction, because the
        confusion costs the field more than the practitioners realise.
        The popular tutorial-blog version of cel shading &mdash; the
        one that reads{" "}
        <code>if (dot(N, L) &gt; 0.5) bright else dark</code> and
        congratulates itself on the result &mdash; is the kindergarten
        version of the technique. It is the equivalent of teaching a
        painter that watercolour means &ldquo;mix water with paint and
        put it on paper.&rdquo; Technically true. Useless as a
        description of the craft.
      </p>

      <p>
        Cel shading as practised at the studios that built the canon
        &mdash; Arc System Works on Guilty Gear Xrd and Dragon Ball
        FighterZ, miHoYo on Genshin Impact, Tango Gameworks on Hi-Fi
        Rush, Gearbox on Borderlands, Smilebit on Jet Set Radio Future
        &mdash; is a composition of seven or eight named techniques
        layered on top of one another, each addressing a specific
        failure mode of the previous layer. This article catalogues
        them, gives the code where the code is short and clear, and
        names the trade-offs the principals at those studios have
        spoken about in their GDC talks and rendering retrospectives.
        The reader who has only met the if/else version of cel shading
        will leave with a working vocabulary for what real cel-shading
        practice is.
      </p>

      <p>
        Adjacent studio pieces:{" "}
        <Link href="/articles/cell-shaded-graphics-in-vr" className={ext}>
          Cell-shaded graphics in VR
        </Link>{" "}
        for the stereo-specific version of this conversation,{" "}
        <Link href="/articles/cohesive-low-poly-cell-shaded-vrm-worlds" className={ext}>
          Cohesive low-poly cell-shaded VRM worlds
        </Link>{" "}
        for how the techniques play with MToon avatars, and{" "}
        <Link href="/articles/low-poly-high-facet-shading" className={ext}>
          Low-poly high-facet shading
        </Link>{" "}
        on the geometry-side companion that is often paired with cel
        materials.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Why &ldquo;the toon shader&rdquo; is the wrong frame
      </h2>

      <p>
        Read the tutorial blogs and a single artefact emerges: the
        toon shader, singular, definite article. Sample the dot
        product, push it through a step function, write the result.
        The whole technique reduced to two lines of GLSL and a
        smug paragraph about how easy it all is. The trap is that the
        result, while recognisable as cel-shaded, is also recognisable
        as amateur. The hard step has no shape; the shadow has no
        warmth; the rim is missing entirely; the silhouette is a flat
        cutout; the eye reads the whole thing as &ldquo;the toon
        shader from a unity tutorial&rdquo; before it reads any of the
        artistic intent.
      </p>

      <p>
        Professional cel-shading is plural. It is a stack of
        techniques composed together, each addressing one failure
        mode of the naive version. The plate below names the
        techniques and the rest of the article walks each row.
      </p>

      <div className={tableWrap}>
        <table className={tableCls}>
          <thead>
            <tr>
              <th>Technique</th>
              <th>What it solves</th>
              <th>Cost</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Ramp-texture lookup</td>
              <td>Replaces the if/else step with an artist-authored gradient.</td>
              <td>One 1D texture fetch per fragment.</td>
            </tr>
            <tr>
              <td>Per-material ramp</td>
              <td>Skin, metal, fabric each get their own ramp shape.</td>
              <td>One extra texture per material kind.</td>
            </tr>
            <tr>
              <td>Edge-light / rim layered</td>
              <td>Adds depth back into the silhouette without breaking the flat read.</td>
              <td>One extra dot product + a Fresnel term.</td>
            </tr>
            <tr>
              <td>Hard-cut specular</td>
              <td>Makes the specular highlight read as a shape.</td>
              <td>One step or smoothstep against a threshold.</td>
            </tr>
            <tr>
              <td>Anisotropic specular (hair)</td>
              <td>Hair gets the band-of-bright that flat specular cannot produce.</td>
              <td>Tangent direction + one extra dot.</td>
            </tr>
            <tr>
              <td>Kuwahara post-pass</td>
              <td>Painterly block-of-colour read; edge-preserving smoothing.</td>
              <td>Expensive. 4&ndash;8 samples per quadrant per pixel.</td>
            </tr>
            <tr>
              <td>Inverted-hull outline</td>
              <td>The cheap, universal silhouette line.</td>
              <td>One extra draw call per outlined mesh.</td>
            </tr>
            <tr>
              <td>Post-process Sobel outline</td>
              <td>The best-looking silhouette + crease line.</td>
              <td>Full-screen pass; expensive in stereo.</td>
            </tr>
            <tr>
              <td>Custom authored normals</td>
              <td>Shading flows by artistic intent, not by mesh topology.</td>
              <td>Authoring time. Runtime free.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Ramp-texture shading
      </h2>

      <p>
        The first technique to learn, because everything else assumes
        it. The if/else step is replaced with a 1D texture lookup.
        The dot product of the world-space normal with the world-space
        light direction, clamped to [0, 1], becomes a UV coordinate
        into a thin gradient texture authored in Krita or Photoshop.
        The artist controls where the bands fall, how sharp the
        transitions are, what colour each band takes, and whether the
        bands tint warm or cool at the shadow end.
      </p>

      <p>
        The ramp texture is the single most important authored asset
        in a cel-shaded scene. A 256&times;1 RGBA image is enough; a
        4&times;1 image is enough if the bands are hard-edged. The
        crucial detail is the filter mode &mdash; <em>nearest</em> for
        a hard cel step, <em>linear</em> for a soft cel step. The
        ramp file should be authored with explicit band positions
        rather than smooth gradients; smooth gradients land you back
        in the photoreal-shaded look you were running from.
      </p>

      <p>
        The Arc System Works practice on Guilty Gear Xrd, documented
        in Junya Motomura&rsquo;s GDC 2015 talk{" "}
        <em>Guilty Gear Xrd&rsquo;s art style</em>, is to ship{" "}
        <em>multiple ramps per character</em>: a lit ramp, a mid ramp,
        a shadow ramp, and a deep-shadow ramp, each authored by hand
        with explicit band colours that match the character&rsquo;s
        wardrobe and skin tone. The shader picks the appropriate ramp
        based on which lighting zone the fragment falls into. The
        result is the difference between &ldquo;shaded model&rdquo;
        and &ldquo;animation cel&rdquo; &mdash; the cel can have
        warmer shadows in the face than in the costume, and the
        ramps make that local.
      </p>

      <p>
        MToon ships the same idea in a simpler form: one shade
        texture and one shade tint per material slot. The VRM avatar
        author paints the skin ramp once, the hair ramp once, the
        costume ramp once, and the runtime samples whichever matches
        the fragment&rsquo;s material binding. Read the implementation
        in{" "}
        <a
          href="https://github.com/pixiv/three-vrm/tree/dev/packages/three-vrm-materials-mtoon"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          three-vrm-materials-mtoon{arrow}
        </a>{" "}
        for the canonical pattern.
      </p>

      <p>
        The workshop-Dimona version of sampling a ramp in TSL is
        about as small as you would hope:
      </p>

      <pre className={codeBlock}>
{`// ramp-lookup.tsl.ts — TSL node fragment for Three.js WebGPU
import {
  Fn, vec2, dot, max,
  positionLocal, normalLocal, texture,
} from "three/tsl";

// rampTex: 256x1 sampler, NearestFilter for hard steps
export const rampLight = Fn(({ N, L, rampTex }) => {
  const ndl = max(dot(N, L), 0.0);          // half-Lambert if you prefer (ndl * 0.5 + 0.5)
  return texture(rampTex, vec2(ndl, 0.5));  // 1D lookup as a 2D fetch
});`}
      </pre>

      <p>
        And the GLSL it ports from, kept side-by-side because the
        vocabulary lines up almost word-for-word with TSL:
      </p>

      <pre className={codeBlock}>
{`// ramp-lookup.frag — classic GLSL
uniform sampler2D rampTex;
uniform vec3 lightDir;
in vec3 vNormal;

void main() {
  float ndl = max(dot(normalize(vNormal), lightDir), 0.0);
  vec3 lit = texture(rampTex, vec2(ndl, 0.5)).rgb;
  gl_FragColor = vec4(lit, 1.0);
}`}
      </pre>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Edge-light and rim layered NPR
      </h2>

      <p>
        The naive cel shader produces a silhouette that reads as a
        cutout. The fix is a rim-light term &mdash; a small bright
        contribution along the edge of the geometry where the
        surface normal turns away from the camera. The classic
        formulation is a Fresnel-like term:{" "}
        <code>pow(1.0 - max(dot(N, V), 0.0), p)</code> for view
        direction V and a falloff exponent p, typically between 2 and
        8. Multiply by a rim colour, add to the base lit colour, and
        the silhouette gets back the volumetric read the if/else
        version stripped away.
      </p>

      <p>
        Two refinements lift this from amateur to professional.
        First, the rim should be{" "}
        <strong>light-direction-aware</strong>. A rim that lights
        every silhouette equally regardless of where the key light is
        reads as a bloom or a glow rather than as light. The Arc
        System Works pattern is to weight the rim by{" "}
        <code>dot(N, -L)</code> &mdash; brighter on the back side of
        the object from the key light, dimmer on the front &mdash;
        which is consistent with how a rim works in real
        photography. Second, an{" "}
        <strong>inverse rim</strong> term darkens the interior
        cavities (the inside of the elbow, under the chin) by
        sampling the rim curve and inverting it. The two terms
        together give the silhouette its depth back without breaking
        the flat-band read.
      </p>

      <p>
        The TSL version:
      </p>

      <pre className={codeBlock}>
{`// rim-light.tsl.ts
import { Fn, pow, sub, max, dot, mul } from "three/tsl";

export const rimTerm = Fn(({ N, V, L, rimColor, rimPower }) => {
  const fresnel = pow(sub(1.0, max(dot(N, V), 0.0)), rimPower);
  const back   = max(dot(N, mul(L, -1.0)), 0.0);   // rim only on the shadow side
  return mul(rimColor, mul(fresnel, back));
});`}
      </pre>

      <p>
        Read the same in MToon at{" "}
        <a
          href="https://github.com/pixiv/three-vrm/blob/dev/packages/three-vrm-materials-mtoon/src/shaders/mtoon.frag.glsl.ts"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          mtoon.frag.glsl.ts{arrow}
        </a>{" "}
        &mdash; the MToon rim implementation includes a rim-lighting
        mix factor that controls how much the rim contribution
        respects the lit/shadow zones, which is the production
        version of the same idea.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Hard-cut specular
      </h2>

      <p>
        The specular term is the bright spot where the light reflects
        most strongly toward the camera. In photoreal shading it is a
        soft blob with a falloff exponent; in cel shading it has to
        become a <em>shape</em>, because everything else on the model
        is a shape. The naive fix is to threshold the specular term:
        anything above 0.9 becomes pure white, anything below becomes
        zero. The result is a hard-edged highlight that reads as part
        of the cel.
      </p>

      <p>
        For hair, the specular wants to be a band rather than a blob,
        because real hair scatters anisotropically along the strand
        direction. The Genshin Impact hair shader &mdash; reverse
        engineered by the community and documented in several breakdowns
        on cgtalk and the Honey Impact wiki &mdash; uses an
        anisotropic Kajiya-Kay specular with the tangent direction
        baked into the mesh UVs. The result is the bright horizontal
        band you see running across the top of every Genshin
        character&rsquo;s hair, faithfully tracking the hair-flow
        direction the artist authored.
      </p>

      <p>
        For stylised eyes &mdash; particularly anime-styled eyes
        &mdash; the canonical move is the{" "}
        <em>comma highlight</em>: a hand-painted catchlight shape
        baked into the eye texture rather than computed by the
        shader, often a single white comma in the upper quadrant of
        the iris. Combined with a parallax-mapped offset so the
        catchlight stays in the eye no matter the head angle, the
        comma highlight is what makes anime eyes read as alive.
      </p>

      <pre className={codeBlock}>
{`// hard-cut + anisotropic specular (hair)
import { Fn, dot, normalize, max, step, pow, cross, length } from "three/tsl";

// Hard-cut specular for general surfaces
export const hardSpec = Fn(({ N, L, V, threshold, power }) => {
  const H = normalize(L.add(V));
  const ndh = max(dot(N, H), 0.0);
  const raw = pow(ndh, power);
  return step(threshold, raw);            // 0 or 1, no gradient
});

// Anisotropic (hair) — tangent-aware Kajiya-Kay
export const aniSpec = Fn(({ T, L, V, power }) => {
  const H = normalize(L.add(V));
  const tdh = dot(normalize(T), H);
  const sinTH = length(cross(normalize(T), H));
  return pow(sinTH, power);               // band perpendicular to tangent
});`}
      </pre>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The Kuwahara filter
      </h2>

      <p>
        The princess will admit that this section is the one she
        gets the most excited about, because the Kuwahara filter is
        the rare image-processing trick that produces a recognisably
        painterly result without obviously looking like a filter.
        Named for Michiyoshi Kuwahara who proposed it in 1976 for
        cardio-angiographic image processing, the filter has since
        been picked up by the NPR community as the canonical
        edge-preserving smoothing operator for painterly
        stylisation.
      </p>

      <p>
        The math is approachable. For each pixel, sample N quadrants
        of a kernel around it (the original paper used four 5&times;5
        quadrants; later implementations use eight or more), compute
        the mean and variance of each quadrant, and write the mean of
        the quadrant with the lowest variance. The effect is that
        each pixel takes its colour from the most homogeneous
        neighbouring region, which preserves edges (the edge has high
        variance and gets avoided) while smoothing flat regions
        (flat regions have low variance and get picked).
      </p>

      <p>
        The naive Kuwahara has square-shaped quadrants and produces
        noticeably blocky output. Kyprianidis et al. proposed the{" "}
        <strong>anisotropic Kuwahara</strong> in 2009 (the canonical
        paper is &ldquo;Image and Video Abstraction by Anisotropic
        Kuwahara Filtering&rdquo;, available open-access from
        Kyprianidis&rsquo;s page), which shapes the quadrants along
        the local structure tensor of the image. The result is
        directional brush-stroke smoothing &mdash; the painterly
        blocks align with the underlying form rather than the screen
        axes. Anisotropic Kuwahara is what gets used in production
        NPR; the basic Kuwahara is mostly a teaching example now.
      </p>

      <p>
        Read open-source implementations at{" "}
        <a
          href="https://github.com/yamatoryouji/kuwahara_filter_for_image_inputs"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          yamatoryouji/kuwahara_filter_for_image_inputs{arrow}
        </a>{" "}
        (classic Python), and the GLSL implementation in the{" "}
        <a
          href="https://github.com/GarrettGunnell/Post-Processing"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          GarrettGunnell/Post-Processing{arrow}
        </a>{" "}
        Unity post-process pack, which ports cleanly to TSL. The
        Acerola YouTube series walks through both the basic and
        anisotropic versions with code if a video explanation helps.
      </p>

      <pre className={codeBlock}>
{`// anisotropic-kuwahara.frag — abbreviated GLSL post-pass
// after Kyprianidis 2009; the structure-tensor calc is omitted for brevity.
uniform sampler2D tColor;
uniform sampler2D tStructure;   // pre-computed structure tensor
uniform vec2 invResolution;
const int N = 8;                // 8 sectors

void main() {
  vec2 uv = gl_FragCoord.xy * invResolution;
  vec3 tensor = texture(tStructure, uv).rgb;  // (Sxx, Syy, Sxy)
  // Eigen-decompose tensor → anisotropy A, angle theta, kernel radius r
  // ... (Kyprianidis §3.2)
  float bestVar = 1e9;
  vec3 bestMean = vec3(0.0);
  for (int s = 0; s < N; ++s) {
    float a0 = float(s) * 2.0 * 3.14159 / float(N);
    // sample an ellipse sector at angle a0 with radius r and anisotropy A
    vec3 mean = vec3(0.0); vec3 var = vec3(0.0);
    // ... accumulate weighted mean + variance over the sector
    float v = length(var);
    if (v < bestVar) { bestVar = v; bestMean = mean; }
  }
  gl_FragColor = vec4(bestMean, 1.0);
}`}
      </pre>

      <p>
        The honest cost: Kuwahara is a full-screen post-pass with a
        large kernel and N variance computations per pixel. On a
        4K monitor it is comfortable. In stereo VR at 90Hz it is
        ruinous &mdash; the per-eye buffers each get their own
        Kuwahara pass, and the variance computation is the kind of
        per-pixel branching the GPU dislikes. Use Kuwahara for flat
        renders and for offline stylisation; skip it for VR. The
        cross-reference in{" "}
        <Link href="/articles/cell-shaded-graphics-in-vr" className={ext}>
          cell-shaded graphics in VR
        </Link>{" "}
        treats this trade-off in more detail.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Outlines done properly
      </h2>

      <p>
        Three approaches, in order of quality and cost.
      </p>

      <p>
        <strong>Inverted-hull outlines</strong> are the cheap classic
        and the technique MToon, Borderlands, Persona 5, Jet Set Radio
        Future and Guilty Gear Xrd all use. Render the mesh twice.
        The first pass extrudes every vertex along its normal by a
        small distance, draws the result in solid outline colour, and
        culls the front faces so only the back of the shell is
        visible. The second pass is the normal lit render. Wherever
        the silhouette of the inner mesh diverges from the outer
        shell, the outer shell shows through as a line.
      </p>

      <p>
        Cheap, parallelises well, works on dynamic meshes, no
        post-processing buffer required, stereo-safe in VR. The
        trade-off is that the line breaks at non-smoothed normal
        seams &mdash; the canonical fix is to pre-process meshes
        with averaged smoothing-group normals stored in a secondary
        vertex attribute, then extrude along those rather than along
        the shading normal. Read the implementation in{" "}
        <a
          href="https://github.com/IronWarrior/UnityToonShader"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          IronWarrior/UnityToonShader{arrow}
        </a>{" "}
        for the well-commented Unity reference and{" "}
        <a
          href="https://github.com/lordstefan/godot-cel-shader"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          lordstefan/godot-cel-shader{arrow}
        </a>{" "}
        for the GLSL port.
      </p>

      <pre className={codeBlock}>
{`// inverted-hull outline — vertex shader, GLSL
uniform float outlineWidth;       // world units; ~0.012 = 12mm
void main() {
  vec3 inflated = position + normal * outlineWidth;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(inflated, 1.0);
}
// + a flat-colour fragment shader, + side: BackSide, + a cloned mesh.`}
      </pre>

      <p>
        <strong>Geometric edge detection</strong> sits in the middle.
        The technique precomputes per-mesh edge data &mdash; which
        edges are silhouette candidates, which are crease edges
        &mdash; then renders edges separately as line primitives in a
        dedicated pass. Higher quality than inverted hulls because
        crease edges (the line where a flat plane meets another flat
        plane) get drawn even when they are not on the silhouette.
        Used by some of the older Studio Ghibli digital pipelines
        and by various Unity asset-store toon packs. The cost is
        authoring time: edge data has to be baked per mesh and
        invalidated whenever the mesh deforms.
      </p>

      <p>
        <strong>Post-process Sobel or Roberts on depth and
        normal</strong> is the highest quality and the most expensive.
        After the main scene has rendered, run a Sobel cross filter
        over the depth buffer and another over the world-space normal
        buffer; combine the two edge masks; composite the result over
        the colour buffer in the outline colour. Picks up silhouettes
        (depth discontinuities), creases (normal discontinuities),
        and contact shadows for free.
      </p>

      <p>
        Tango Gameworks&rsquo; Hi-Fi Rush uses a variant of this in
        Unreal 5 and the team has spoken about the implementation in
        the &ldquo;Behind the Scenes of Hi-Fi Rush&rdquo; GDC talk.
        Persona 5 Royal uses a similar pass for the UI-overlay
        sharpness. Read{" "}
        <a
          href="https://github.com/pmndrs/postprocessing"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          pmndrs/postprocessing{arrow}
        </a>{" "}
        for the Three.js-side reference, which ships a clean
        OutlineEffect that does exactly this. The trade-off matrix:
      </p>

      <div className={tableWrap}>
        <table className={tableCls}>
          <thead>
            <tr>
              <th>Approach</th>
              <th>Quality</th>
              <th>Cost</th>
              <th>VR-safe?</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Inverted hull</td>
              <td>Silhouette only; can break at normal seams.</td>
              <td>1 extra draw call per outlined mesh.</td>
              <td>Yes &mdash; stereo-safe by construction.</td>
            </tr>
            <tr>
              <td>Geometric edges</td>
              <td>Silhouette + crease, but baked per mesh.</td>
              <td>Authoring cost; line primitives at runtime.</td>
              <td>Yes if line widths are angular not world.</td>
            </tr>
            <tr>
              <td>Sobel post-process</td>
              <td>Best. Silhouette + crease + contact lines.</td>
              <td>Full-screen pass; two G-buffer reads.</td>
              <td>Risky &mdash; per-eye buffers shimmer at silhouettes.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Stylised shadow casters
      </h2>

      <p>
        A standard shadow map applied to a cel-shaded character looks
        wrong, and the wrongness comes from a register mismatch: the
        shadow map is photoreal-shaped (soft penumbra, gradient
        falloff, projected through a filter) while the cel material
        is hand-shaped (hard step, flat colour, no gradients
        anywhere). The shadow appears as a blurry photographic patch
        sitting on top of an otherwise stylised render.
      </p>

      <p>
        Three fixes, in increasing order of investment.
      </p>

      <p>
        <strong>Shadow-aware ramps.</strong> The ramp texture grows a
        dedicated &ldquo;shadow band&rdquo; at the low end &mdash;
        often a deeper, cooler version of the mid-shadow band &mdash;
        and the receiver lerps into that band when a shadow map
        reports occlusion. The ramp does the work; the shadow map
        just contributes a binary or near-binary mask. The result is
        a shadow that reads as part of the cel rather than as a
        photographic overlay.
      </p>

      <p>
        <strong>Cutout shadows for foliage.</strong> When a tree
        casts a shadow on a cel-shaded ground, the canonical move is
        to skip the shadow map entirely and use a hand-authored
        cutout sprite for the shadow shape &mdash; the same trick
        used by Studio Ghibli&rsquo;s digital backgrounds and by
        Animal Crossing on the Switch. The cutout has a discrete
        edge, a flat colour, and no penumbra. The wrongness goes
        away.
      </p>

      <p>
        <strong>Secondary-light trick.</strong> A constrained second
        directional light, with its own ramp and tint, is added just
        for the shadow direction. The first light handles the lit
        side at its full intensity; the second light is responsible
        for everything in the shadow zone and can be tinted, ramped,
        and falloff-controlled independently. The Arc System Works
        practice is to use this for the &ldquo;ambient
        bounce&rdquo; &mdash; a violet or warm-magenta tint on the
        shadow side that gives the cel character a chromatic depth
        a single-light setup cannot produce.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Hair, eyes, faces
      </h2>

      <p>
        Three sub-shaders that benefit from special-casing because
        the geometry alone cannot do their work.
      </p>

      <p>
        <strong>Anisotropic hair specular.</strong> Already named in
        the specular section, but it deserves a second look. The
        Kajiya-Kay specular model treats hair as a collection of
        infinitely thin cylinders and produces a specular band
        perpendicular to the tangent direction. In a cel pipeline,
        the band gets hard-stepped after the Kajiya-Kay calculation
        so the highlight reads as a shape. Genshin Impact, Honkai
        Star Rail, Zenless Zone Zero and most recent Arc System Works
        titles all use a variant of this. Bake the tangent direction
        into the mesh UVs at authoring time; do not try to compute it
        from screen-space derivatives.
      </p>

      <p>
        <strong>Parallax-mapped eye highlights.</strong> The
        catchlight in the eye is the difference between an alive
        character and a doll. The cel trick is to author the
        catchlight (often the comma-highlight shape) as a separate
        layer in the eye texture, then parallax-sample it with an
        offset proportional to the view direction relative to the
        eyeball normal. The catchlight stays in roughly the same
        position relative to the iris no matter where the head turns,
        which is what real eyes do because the catchlight is a
        reflection of the key light off the cornea.
      </p>

      <p>
        <strong>Face SSS-faked.</strong> Subsurface scattering is the
        photoreal trick that gives skin its warm, slightly translucent
        quality &mdash; light enters the skin, bounces around under
        the surface, and exits a few millimetres away tinted by the
        haemoglobin and melanin it passed through. Real SSS is
        expensive. The cel trick is to bake the SSS effect into the
        ramp&rsquo;s low band: rather than transitioning from lit to
        shadow through a neutral grey, the ramp transitions through
        a warm peach or rust tone at the half-shadow zone. The
        character&rsquo;s face gets the SSS read at zero runtime
        cost. Arc System Works uses this aggressively on Guilty Gear
        Xrd; the warm half-shadow tone is one of the things that
        makes those characters feel like illustration rather than
        plastic.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The Arc System Works pattern, fully diagrammed
      </h2>

      <p>
        The pipeline Junya Motomura described in his GDC 2015 talk
        and that Arc System Works has refined across Guilty Gear Xrd,
        Guilty Gear Strive, Dragon Ball FighterZ and Granblue Fantasy
        Versus is the canonical AAA cel-shading pipeline. The
        diagram, in words:
      </p>

      <pre className={codeBlock}>
{`            vertex position + custom normals (hand-authored)
                                |
                                v
                +-------------------------------+
                | per-character ramp lookup     |
                | (one ramp per material slot)  |
                +-------------------------------+
                                |
                                v
           +---------------------------------------+
           | key light × ramp band A               |
           | fill light × ramp band B   (additive) |
           | rim light × ramp band C    (additive) |
           +---------------------------------------+
                                |
                                v
                +-------------------------------+
                | per-shot lighting overrides   |
                | (cinematic camera dictates    |
                | which ramp set is active)     |
                +-------------------------------+
                                |
                                v
                +-------------------------------+
                | hard-cut specular + rim       |
                | + anisotropic hair specular   |
                +-------------------------------+
                                |
                                v
                +-------------------------------+
                | inverted-hull outline overlay |
                | (per-character outline tint)  |
                +-------------------------------+
                                |
                                v
                          final pixel`}
      </pre>

      <p>
        Six things to notice. First, the <em>custom authored
        normals</em>. Each character&rsquo;s mesh has its normals
        hand-edited so the shading flows in the direction the artist
        wants, not the direction the mesh topology dictates. A
        triangle on the bridge of the nose may have a normal pointing
        slightly toward the camera even if geometrically it should
        not, because the artist wants the nose to catch light cleanly
        rather than fragment into facets. This is the single most
        labour-intensive part of the pipeline and the single biggest
        differentiator between professional and amateur cel
        rendering.
      </p>

      <p>
        Second, the <em>per-character ramp texture</em>. Not a global
        ramp; a per-character one, sometimes a per-material-slot one
        within the character. Sol Badguy&rsquo;s skin ramp is not the
        same as Ramlethal&rsquo;s skin ramp.
      </p>

      <p>
        Third, <em>multiple light groups with distinct ramp bands</em>.
        Key, fill and rim each get their own ramp band &mdash; not
        the same ramp sampled at different intensities. The fill
        light&rsquo;s ramp lives in a different colour space from the
        key light&rsquo;s.
      </p>

      <p>
        Fourth, <em>per-shot lighting overrides</em>. In a fighting
        game cutscene or a story sequence, the cinematic camera
        dictates which ramp set is active. Arc System Works ships
        named ramp sets per shot; the lighting artist picks the set
        in the same way a film cinematographer picks a colour
        grade.
      </p>

      <p>
        Fifth, the <em>specular and rim stack</em> sits between the
        lighting composite and the outline overlay, which means rims
        and speculars can be cut by the outline and never bleed past
        the silhouette.
      </p>

      <p>
        Sixth, the <em>per-character outline tint</em>. The outline
        is not pure black; it is a darker version of each
        character&rsquo;s base palette, which keeps the silhouette
        chromatic rather than graphic-novel-flat.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        OSS implementations worth studying
      </h2>

      <p>
        The reading list for anyone trying to build this stack
        themselves. Every entry is open-source and currently
        maintained as of writing.
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
          </a>{" "}
          (MIT) &mdash; particularly{" "}
          <code>packages/three-vrm-materials-mtoon</code>, which is
          the closest thing to a production cel-shader reference in
          the JavaScript ecosystem. Ramp lookup, rim, outline,
          shadow-aware sampling, all readable.
        </li>
        <li>
          <a
            href="https://github.com/unity3d-jp/UnityChanToonShaderVer2_Project"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            UnityChan Toon Shader 2 (UTS2){arrow}
          </a>{" "}
          (Unity-Chan licence) &mdash; the long-running reference
          implementation for production-quality cel shading in Unity.
          Multiple ramps, per-character ramp authoring, anisotropic
          hair, custom normal workflow. The reference for anyone
          serious about the pipeline.
        </li>
        <li>
          <a
            href="https://github.com/lordstefan/godot-cel-shader"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            lordstefan/godot-cel-shader{arrow}
          </a>{" "}
          (MIT) &mdash; the cleanest small GLSL implementation.
          Ports cleanly into Three.js TSL.
        </li>
        <li>
          <a
            href="https://github.com/IronWarrior/UnityToonShader"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            IronWarrior/UnityToonShader{arrow}
          </a>{" "}
          (MIT) &mdash; the well-commented HLSL reference for ramp,
          rim, specular and inverted-hull outline laid out in
          ~400 lines.
        </li>
        <li>
          <a
            href="https://github.com/mrdoob/three.js/blob/dev/src/materials/MeshToonMaterial.js"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Three.js MeshToonMaterial source{arrow}
          </a>{" "}
          (MIT) &mdash; the stock cel material; useful for the
          gradient-map sampling pattern and as the cheap-path baseline.
        </li>
        <li>
          <a
            href="https://github.com/GarrettGunnell/Post-Processing"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            GarrettGunnell/Post-Processing{arrow}
          </a>{" "}
          (MIT) &mdash; the Unity post-process pack with Kuwahara,
          anisotropic Kuwahara, oil paint, watercolour. Ports of
          most of these are mechanical into TSL.
        </li>
        <li>
          <a
            href="https://github.com/yamatoryouji/kuwahara_filter_for_image_inputs"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            yamatoryouji/kuwahara_filter_for_image_inputs{arrow}
          </a>{" "}
          (MIT) &mdash; the classic Python reference for the basic
          Kuwahara, useful for understanding the algorithm before
          porting to shader.
        </li>
        <li>
          <a
            href="https://github.com/pmndrs/postprocessing"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            pmndrs/postprocessing{arrow}
          </a>{" "}
          (Zlib) &mdash; the Three.js effect composer with
          OutlineEffect; the post-process outline path that pairs
          with everything above.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        VR caveats
      </h2>

      <p>
        The full treatment of cel-shading-in-VR sits in the adjacent
        article{" "}
        <Link href="/articles/cell-shaded-graphics-in-vr" className={ext}>
          cell-shaded graphics in VR
        </Link>
        ; the short version, technique-by-technique, is below.
      </p>

      <p>
        <strong>Ramp lookups</strong> are basically free in VR. One
        texture fetch per fragment; stereo-safe by construction
        (each eye samples the same ramp at slightly different angles
        and the result is consistent). Use freely.
      </p>

      <p>
        <strong>Rim and hard-cut specular</strong> are also fine. A
        Fresnel term plus a step is cheap and the per-eye computation
        produces consistent results. The only caveat is that the
        Fresnel power should be tuned for the IPD of the headset
        rather than for a flat monitor; a Fresnel that looks great on
        a 27&Prime; screen can read as a halo in stereo.
      </p>

      <p>
        <strong>Inverted-hull outlines</strong> are the canonical VR
        outline. Cheap, stereo-safe, work on dynamic meshes. The one
        adjustment is to scale outline width by camera distance
        rather than by world units, which keeps angular thickness
        constant across the two eyes and stops the line reading as a
        floating ghost.
      </p>

      <p>
        <strong>Kuwahara</strong> is essentially unusable in VR at
        90Hz. The per-eye full-screen variance computation cannot
        clear the budget. Bake the painterly effect into textures
        offline rather than running the filter at runtime.
      </p>

      <p>
        <strong>Post-process Sobel outlines</strong> are difficult.
        The per-eye depth buffers can have slightly different values
        at the silhouette (because the two eyes see the silhouette at
        slightly different sub-pixel positions), and the Sobel filter
        amplifies the difference into a shimmering line. The fix is
        either to render the outline pass at half resolution and
        upsample, or to use inverted hulls instead.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Where to look in the studio
      </h2>

      <p>
        The studio&rsquo;s own working bench:{" "}
        <Link href="/atelier/material-library" className={ext}>
          the material library
        </Link>{" "}
        carries the TSL cel-shaded presets the studio ships with
        every scene, and{" "}
        <Link href="/atelier/postprocess-lab" className={ext}>
          the post-process lab
        </Link>{" "}
        is where the Kuwahara and Sobel experiments live. Anyone who
        wants to reproduce the techniques above without re-deriving
        them from scratch should start in the atelier and read
        outward.
      </p>

      <p>
        The geometry-side companion piece is{" "}
        <Link href="/articles/low-poly-high-facet-shading" className={ext}>
          low-poly high-facet shading
        </Link>
        , which addresses how to build models that are sympathetic to
        the cel techniques in this article; the two pieces are
        intended to be read in either order.
      </p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry = {
  slug: "advanced-cell-shading-techniques",
  title:
    "Advanced cell shading — ramp lookups, edge lighting, Kuwahara filters, and the shaders that make NPR sing",
  date: "2026-05-19",
  kind: "article",
  excerpt:
    "The if/else version of cel shading is the kindergarten version. Real cel-shading in production work — Arc System Works, miHoYo, Tango Gameworks, Gearbox — composes seven or eight techniques: ramp lookups (often per-material), edge-light layered NPR, hard-cut and anisotropic specular, the Kuwahara filter, three outline approaches in increasing cost, stylised shadow casters, hair-eye-face special-casing, and the full Arc System Works pipeline diagrammed end-to-end. With code, OSS reading list, and VR caveats.",
  Body: AdvancedCellShadingTechniques,
  related: [
    {
      href: "/articles/cell-shaded-graphics-in-vr",
      label: "Cell-shaded graphics in VR",
      note: "The stereo-specific version of this conversation.",
    },
    {
      href: "/articles/cohesive-low-poly-cell-shaded-vrm-worlds",
      label: "Cohesive low-poly cell-shaded VRM worlds",
      note: "How these techniques play with MToon avatars in shared scenes.",
    },
    {
      href: "/articles/low-poly-graphics-in-vr",
      label: "Low-poly graphics in VR",
      note: "The geometry-side budget that cel-shading must live inside.",
    },
    {
      href: "/articles/low-poly-high-facet-shading",
      label: "Low-poly high-facet shading",
      note: "The geometry-side companion piece on faceted shading.",
    },
    {
      href: "/atelier/material-library",
      label: "Material library",
      note: "The studio's TSL cel-shaded presets, ready to drop into a scene.",
    },
    {
      href: "/atelier/postprocess-lab",
      label: "Post-process lab",
      note: "Where the studio's Kuwahara and Sobel experiments live.",
    },
  ],
  furtherReading: [
    {
      href: "https://www.gdcvault.com/play/1022394/Guilty-Gear-Xrd-s-Art",
      label: "Guilty Gear Xrd's art style — Junya Motomura, GDC 2015",
      note: "The canonical AAA cel-shading talk; custom normals, per-character ramps, multi-light ramp bands.",
    },
    {
      href: "https://github.com/pixiv/three-vrm",
      label: "@pixiv/three-vrm",
      note: "The MToon implementation under packages/three-vrm-materials-mtoon is the JavaScript-side production reference.",
    },
    {
      href: "https://github.com/unity3d-jp/UnityChanToonShaderVer2_Project",
      label: "UnityChan Toon Shader 2 (UTS2)",
      note: "The long-running open-source production cel shader; multiple ramps, anisotropic hair, custom normal workflow.",
    },
    {
      href: "https://github.com/IronWarrior/UnityToonShader",
      label: "UnityToonShader (IronWarrior)",
      note: "Well-commented HLSL reference for ramp, rim, specular and inverted-hull outline in ~400 lines.",
    },
    {
      href: "https://github.com/lordstefan/godot-cel-shader",
      label: "godot-cel-shader (lordstefan)",
      note: "GLSL port of the same algorithm; ports cleanly into Three.js TSL.",
    },
    {
      href: "https://github.com/mrdoob/three.js/blob/dev/src/materials/MeshToonMaterial.js",
      label: "Three.js MeshToonMaterial source",
      note: "Stock cel material; the cheap-path baseline.",
    },
    {
      href: "https://threejs.org/docs/?q=MeshToon#api/en/materials/MeshToonMaterial",
      label: "Three.js MeshToonMaterial docs",
      note: "The gradientMap slot and the canonical 1D-lookup pattern documented.",
    },
    {
      href: "https://github.com/GarrettGunnell/Post-Processing",
      label: "GarrettGunnell/Post-Processing",
      note: "Unity post-process pack with Kuwahara, anisotropic Kuwahara, oil paint, watercolour.",
    },
    {
      href: "https://www.kyprianidis.com/p/eg2009/jkyprian-eg2009.pdf",
      label: "Image and Video Abstraction by Anisotropic Kuwahara Filtering — Kyprianidis et al., 2009",
      note: "The canonical paper on the structure-tensor-shaped Kuwahara; available open-access.",
    },
    {
      href: "https://www.vrm.dev/en/univrm/shaders/shader_mtoon.html",
      label: "MToon shader specification",
      note: "The VRM Consortium's reference for MToon parameters, ramps, rim and outline behaviour.",
    },
    {
      href: "https://gdcvault.com/play/1029464/-Hi-Fi-RUSH-Bringing",
      label: "Hi-Fi Rush rendering — GDC talk",
      note: "Tango Gameworks on the post-process outline plus stylised lighting stack used on Hi-Fi Rush.",
    },
  ],
};
