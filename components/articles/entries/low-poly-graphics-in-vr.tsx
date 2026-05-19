import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function LowPolyGraphicsInVr() {
  return (
    <>
      <p>
        The princess will set out the argument plainly. Low-poly
        graphics in virtual reality are not a nostalgia move. They are
        a budget. A headset is, in engineering terms, two monitors
        bolted to a face and a demand that both of them refresh at
        ninety frames a second or the wearer&rsquo;s lunch comes up.
        Every polygon the GPU draws, it draws twice. Every texture it
        samples, it samples for two viewpoints whose disparity the
        brain is using as a depth cue. Low-poly geometry is one of the
        very few aesthetic decisions that buys back budget honestly
        rather than asking the optic nerve to forgive a cheat.
      </p>

      <p>
        That is the practical half. The aesthetic half is the half
        artists care about, and the aesthetic half is more
        interesting. A faceted mesh in VR has a quality the same mesh
        on a monitor does not have. The wearer can walk around it.
        The flat shading does not collapse the way a flat shading on
        a monitor collapses, because the wearer&rsquo;s own parallax
        is doing the work the photographic detail would have done.
        Low-poly in VR is the opposite of impoverished. It is the
        wearer-as-camera lighting the geometry themselves.
      </p>

      <p>
        Adjacent studio pieces:{" "}
        <Link href="/articles/vr-as-psychological-system" className={ext}>
          VR as a psychological system
        </Link>{" "}
        on why presence is doing the heavy lifting,{" "}
        <Link href="/articles/from-picasso-forward" className={ext}>
          From Picasso Forward
        </Link>{" "}
        on the constraint argument, and{" "}
        <Link href="/atelier/isosurface" className={ext}>
          the isosurface atelier
        </Link>{" "}
        on the geometry-as-form thread the studio keeps walking back
        to.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Why low-poly works in VR specifically
      </h2>

      <p>
        Three things break in stereoscopy that do not break on a
        single screen. First, high-frequency texture detail
        decorrelates between the eyes at distance &mdash; the
        wearer&rsquo;s brain is solving a stereo correspondence problem
        and a noisy texture is a correspondence problem with too many
        candidates. The headset shows the wearer two slightly different
        images and asks them to fuse; a textured surface that looks
        crisp on a desktop monitor can shimmer or sparkle in a headset
        because the two eyes do not see exactly the same pixels and
        the visual system cannot resolve the ambiguity. Flat colour
        does not have this problem. A faceted surface, where the
        colour shifts only at clear geometric boundaries, gives the
        stereo system unambiguous correspondences to lock onto.
      </p>

      <p>
        Second, perspective drift. The wearer&rsquo;s head moves a
        couple of centimetres in any direction continuously, even when
        they think they are standing still. The geometry rotates
        against the eyes in a way no monitor scene ever does. A model
        built for monitor framing &mdash; lit from one angle, textured
        for one read &mdash; will show the seams of those decisions
        from the angles the desktop renderer never had to handle. A
        low-poly model has fewer of those decisions to begin with.
        There is less to give away.
      </p>

      <p>
        Third, the framerate budget. Ninety hertz per eye is the
        comfort floor on every consumer headset since 2016, and many
        modern panels are pushing to 120 or 144. Foveated rendering,
        where the high-resolution work is concentrated on the small
        patch the eye is actually fixated on, can claw back as much as
        seventy-two percent of the GPU&rsquo;s pixel work on a
        well-instrumented eye-tracked headset, per the published
        research on the technique. Foveation makes the low-poly choice
        even more generous: the peripheral budget is so cheap that a
        well-built low-poly scene can stretch its budget into more
        objects, more characters, more interactive complexity. The
        aesthetic does not just survive the framerate ceiling. It
        thrives on it.
      </p>

      <p>
        The fourth thing &mdash; honesty &mdash; is not a technical
        argument but a craft one. A low-poly model declares the choice
        the artist made. It does not pretend to be a photograph. In a
        medium that already strains the wearer&rsquo;s
        suspension-of-disbelief with every imperfection, the
        declarative aesthetic earns trust the photoreal aesthetic has
        to keep buying back.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The canon &mdash; games that built the low-poly VR look
      </h2>

      <p>
        The list below is what the studio reaches for when the
        conversation turns to &ldquo;what does this register actually
        look like in practice&rdquo;. Real games, real studios, real
        URLs.
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-chrome-700 text-left text-chrome-300">
              <th className="py-2 pr-4">Title</th>
              <th className="py-2 pr-4">Studio</th>
              <th className="py-2 pr-4">Year</th>
              <th className="py-2">Why it sits here</th>
            </tr>
          </thead>
          <tbody className="text-chrome-200">
            <tr className="border-b border-chrome-800">
              <td className="py-2 pr-4">
                <em>
                  <a
                    href="https://www.polyarcgames.com/games/moss"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={ext}
                  >
                    Moss{arrow}
                  </a>
                </em>
              </td>
              <td className="py-2 pr-4">Polyarc (Seattle)</td>
              <td className="py-2 pr-4">2018</td>
              <td className="py-2">
                Diorama-scale storybook geometry; the mouse Quill is
                low-poly enough to read at any distance the wearer leans
                in to. Painterly light over faceted forms.
              </td>
            </tr>
            <tr className="border-b border-chrome-800">
              <td className="py-2 pr-4">
                <em>
                  <a
                    href="https://www.populationonevr.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={ext}
                  >
                    Population: One{arrow}
                  </a>
                </em>
              </td>
              <td className="py-2 pr-4">BigBox VR (acquired by Meta)</td>
              <td className="py-2 pr-4">2020</td>
              <td className="py-2">
                Battle-royale at standalone-Quest budget. Low-poly
                characters and architecture let the game ship
                eighteen-player squads on mobile silicon.
              </td>
            </tr>
            <tr className="border-b border-chrome-800">
              <td className="py-2 pr-4">
                <em>
                  <a
                    href="https://beatsaber.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={ext}
                  >
                    Beat Saber{arrow}
                  </a>
                </em>
              </td>
              <td className="py-2 pr-4">Beat Games (Prague)</td>
              <td className="py-2 pr-4">2019 (1.0)</td>
              <td className="py-2">
                Not low-poly so much as no-poly: blocks, sabres,
                arrows. The reductio ad absurdum of the argument and
                still one of the most-played VR titles ever shipped.
              </td>
            </tr>
            <tr className="border-b border-chrome-800">
              <td className="py-2 pr-4">
                <em>
                  <a
                    href="https://townshiptale.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={ext}
                  >
                    A Township Tale{arrow}
                  </a>
                </em>
              </td>
              <td className="py-2 pr-4">Alta (Sydney)</td>
              <td className="py-2 pr-4">2018 (early access)</td>
              <td className="py-2">
                Stylised low-poly Quest build with the shadows pulled
                out and the poly count cut deliberately for mobile.
                The developers describe the look as a way of adding
                character rather than a compromise.
              </td>
            </tr>
            <tr className="border-b border-chrome-800">
              <td className="py-2 pr-4">
                <em>
                  <a
                    href="https://quill.fb.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={ext}
                  >
                    Quill{arrow}
                  </a>{" "}
                  flat-shaded paintings
                </em>
              </td>
              <td className="py-2 pr-4">Smoothstep (formerly Oculus / Meta)</td>
              <td className="py-2 pr-4">2016 onward</td>
              <td className="py-2">
                Not a game; a tool. The Quill brushwork has a
                naturally faceted, flat-shaded register because the
                strokes themselves are the geometry. The medium where
                most low-poly VR illustration actually lives.
              </td>
            </tr>
            <tr>
              <td className="py-2 pr-4">
                <em>
                  <a
                    href="https://www.cloudheadgames.com/pistol-whip"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={ext}
                  >
                    Pistol Whip{arrow}
                  </a>
                </em>
              </td>
              <td className="py-2 pr-4">Cloudhead Games (British Columbia)</td>
              <td className="py-2 pr-4">2019</td>
              <td className="py-2">
                Block-stylised enemies, neon dreamscape architecture.
                The visual debt to <em>Superhot</em> is open. Adjacent
                rather than strictly low-poly but in the same family.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Techniques worth knowing
      </h2>

      <p>
        The vocabulary an artist needs to read the canon above and
        write their own. None of these are exotic; the discipline is
        in the combination.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Flat shading.</strong> Per-face normals rather than
          per-vertex normals. Each polygon receives one lighting value
          and holds it across the whole face. The lighting model is
          honest about the geometry rather than smoothing over it. In
          a stereoscopic context the flat face also gives the visual
          system an unambiguous correspondence to match between eyes,
          which is half the reason low-poly reads so cleanly in a
          headset.
        </li>
        <li>
          <strong>Vertex colours.</strong> Colour stored on the vertex
          rather than on a texture map. A six-hundred-vertex character
          can hold all of its colour information in a kilobyte of
          vertex attributes and need no texture sampler at all. The
          GPU loves this. The aesthetic that emerges has a watercolour-
          gradient quality where colours bleed across the triangles by
          interpolation, which can look fluid even at a very low poly
          budget.
        </li>
        <li>
          <strong>Baked lightmaps.</strong> Pre-computed light values
          stored as a separate set of UVs on the geometry. The
          runtime cost is one extra texture sample per pixel; the
          quality is whatever the offline renderer felt like
          producing. For a static low-poly VR scene this is the
          single largest aesthetic gain available, because the bake
          can ship soft shadows, indirect light and ambient occlusion
          at no runtime cost.
        </li>
        <li>
          <strong>Geometry as the texture.</strong> The studio&rsquo;s
          shorthand for the technique of using more faceted geometry
          rather than a higher-resolution texture map. A pillar with
          forty-eight sides reads more clearly under headset parallax
          than a twelve-sided pillar with a higher-resolution map.
          Polygons are cheap in modern engines; texture bandwidth is
          not.
        </li>
        <li>
          <strong>Fog and depth fade.</strong> The unsung hero of the
          low-poly VR look. A volumetric fog dialled in at twenty
          metres turns the lack of distant geometry into a deliberate
          aesthetic decision rather than a budget admission. It also
          masks the LOD pop the wearer would otherwise notice.
        </li>
        <li>
          <strong>Hard silhouettes.</strong> Low-poly characters read
          by silhouette more than by surface. A character who can be
          identified in profile against the skybox at twenty metres
          has done the design work the AAA pipeline does with five
          thousand more polygons.
        </li>
        <li>
          <strong>Stereo-comfort culling.</strong> A small craft
          discipline: anything closer than the headset&rsquo;s
          comfortable vergence range (roughly forty centimetres for
          most consumer panels) wants to be flat-shaded and untextured
          regardless of the rest of the scene&rsquo;s budget, because
          near-field detail is where stereoscopy strains hardest.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Honest about the trade-offs
      </h2>

      <p>
        Low-poly is not free. The faceted surfaces that read cleanly
        at character scale can look brittle at architectural scale
        unless the artist is paying attention. The faceted normal does
        not catch specular highlights the way a smoothed normal does,
        so anything intended to look wet, polished or metallic has to
        be cheated some other way &mdash; usually by a matcap or by
        leaning into a stylised non-physical highlight.
      </p>

      <p>
        Animation is the trickier honesty. Low-poly characters with
        skinned meshes need careful weight painting because every
        triangle in the deformation is visible &mdash; there is no
        subdermal fat layer of micro-detail to absorb the deformation
        artefacts. The classic mistake is to build a low-poly
        character at the same vertex count as a high-poly one but
        without the topology a deformable rig needs; the elbow
        collapses on bend and the wearer sees it because in VR the
        wearer always sees it.
      </p>

      <p>
        And the medium has its own register problem. A wearer who has
        used a photoreal VR experience will sometimes read low-poly as
        cheap on first encounter, until the parallax does its work and
        the model settles into its actual aesthetic. The first ninety
        seconds of a low-poly VR experience are the persuasion
        seconds. Studios that ship low-poly know to put a piece of
        clearly-deliberate aesthetic showmanship in those opening
        seconds &mdash; a colour palette move, a lighting move &mdash;
        so the wearer understands the geometry is a choice and not a
        constraint.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        UK ground &mdash; who is working in this register
      </h2>

      <p>
        The UK low-poly VR scene is real but does not always brand
        itself as such. nDreams in Farnborough has shipped several
        stylised-low-poly titles inside its catalogue without making
        the look a marketing position; the same is true of Coatsink in
        Sunderland and Maze Theory in London. The most explicit UK
        practitioners of the look are inside the indie cluster that
        attends Develop:Brighton, which the studio cannot itemise
        honestly here without verification beyond what a website
        screenshot can do &mdash; flagged as a research gap rather
        than padded with names. For the verified UK names see the
        sibling{" "}
        <Link href="/articles/whos-who-uk-vr-people" className={ext}>
          Who&rsquo;s Who &mdash; UK VR people
        </Link>{" "}
        index.
      </p>

      <p>
        On the tool side, Gravity Sketch (London) and Quill (now run
        by Smoothstep under Inigo Quilez, with Goro Fujita previously
        at Meta as the artist-in-residence) are the two tools the
        studio uses when it wants a low-poly object made in VR rather
        than imported into VR. The Gravity Sketch surface modeller
        produces clean low-poly meshes by default; Quill produces
        faceted volumetric brushwork that is low-poly in spirit even
        when the vertex count is not strictly low. Both tools sit in
        the sibling{" "}
        <Link href="/articles/whos-who-uk-vr-sculpting-people" className={ext}>
          Who&rsquo;s Who &mdash; UK VR sculpting people
        </Link>{" "}
        index.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Where the studio sits
      </h2>

      <p>
        The studio&rsquo;s own VR work runs in two registers, and one
        of them is squarely in this article. The{" "}
        <Link href="/articles/sellotape-and-tilt-brush" className={ext}>
          Sellotape and Tilt Brush
        </Link>{" "}
        practice produces faceted volumetric paintings that print
        cleanly because the geometry is already discrete. The studio
        atelier on{" "}
        <Link href="/atelier/isosurface" className={ext}>
          isosurface forms
        </Link>{" "}
        treats the low-poly waveguide as a structural language rather
        than a visual one &mdash; the same constraint argument seen
        from the fabrication end. Both threads inherit from the
        position laid out in{" "}
        <Link href="/articles/from-picasso-forward" className={ext}>
          From Picasso Forward
        </Link>
        : a constraint is a generator, not a poverty.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Sources / further reading
      </h2>

      <ul className="mt-6 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://www.polyarcgames.com/games/moss"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            polyarcgames.com &mdash; Moss{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.populationonevr.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            populationonevr.com &mdash; Population: One{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://tech.facebook.com/reality-labs/2021/8/last-man-standing-big-box-population-one-battle-royale-vr/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Reality Labs &mdash; how Population: One dropped battle
            royale into VR{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://beatsaber.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            beatsaber.com &mdash; Beat Games{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://townshiptale.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            townshiptale.com &mdash; Alta (Sydney){arrow}
          </a>
        </li>
        <li>
          <a
            href="https://stevivor.com/features/interviews/alta-vrs-boramy-unn-township-tale-developing-vr/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Stevivor &mdash; Alta on the stylised look as a deliberate
            choice{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://quill.fb.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            quill.fb.com &mdash; Quill historic site{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://quill.art/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            quill.art &mdash; Smoothstep&rsquo;s current Quill{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.cloudheadgames.com/pistol-whip"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            cloudheadgames.com &mdash; Pistol Whip{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://gravitysketch.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            gravitysketch.com{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://arxiv.org/pdf/2412.10456"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            arXiv &mdash; FovealNet on foveated rendering throughput
            gains{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12000250/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            NIH PMC &mdash; visual behaviour and ego-movement on
            foveated rendering performance{arrow}
          </a>
        </li>
      </ul>
    </>
  );
}

/**
 * Visual-style article on the low-poly aesthetic as it pertains to
 * virtual reality. Pairs the performance argument (90fps per eye,
 * foveated rendering) with the perceptual argument (stereoscopy
 * prefers unambiguous correspondences) and a small canon of working
 * games. All named studios and titles verified by public URL during
 * research (2026-05-19).
 */
export const entry: Entry = {
  slug: "low-poly-graphics-in-vr",
  title: "Low-poly graphics in VR",
  date: "2026-05-19",
  kind: "article",
  excerpt:
    "Low-poly geometry in VR is a budget the engineering forces and an aesthetic the perception rewards. Why faceted forms read cleanly under stereoscopy and head-parallax, the canon (Moss, Population: One, Beat Saber, A Township Tale, Quill, Pistol Whip), and the techniques worth knowing.",
  Body: LowPolyGraphicsInVr,
  related: [
    {
      href: "/articles/whos-who-uk-vr-people",
      label: "Who's Who — UK VR people",
      note: "The verified UK VR practitioner index. Sibling list.",
    },
    {
      href: "/articles/whos-who-uk-vr-sculpting-people",
      label: "Who's Who — UK VR sculpting people",
      note: "Where Gravity Sketch, Quill and Tilt Brush practice gets catalogued.",
    },
    {
      href: "/articles/whos-who-uk-ar-people",
      label: "Who's Who — UK AR people",
      note: "Sibling index on the adjacent AR side.",
    },
    {
      href: "/articles/vr-as-psychological-system",
      label: "VR as a psychological system",
      note: "Why presence forgives low-poly in the headset context.",
    },
    {
      href: "/articles/from-picasso-forward",
      label: "From Picasso Forward",
      note: "The studio's constraint-as-generator argument, applied here.",
    },
    {
      href: "/articles/sellotape-and-tilt-brush",
      label: "Sellotape and Tilt Brush",
      note: "The studio's own faceted VR-painting practice.",
    },
    {
      href: "/atelier/isosurface",
      label: "Isosurface atelier",
      note: "Geometry-as-form on the fabrication side.",
    },
  ],
  furtherReading: [
    {
      href: "https://www.polyarcgames.com/games/moss",
      label: "Polyarc — Moss",
      note: "The diorama-scale low-poly storybook reference.",
    },
    {
      href: "https://tech.facebook.com/reality-labs/2021/8/last-man-standing-big-box-population-one-battle-royale-vr/",
      label: "Reality Labs — Population: One technical writeup",
      note: "How a low-poly aesthetic budgeted the eighteen-player battle royale.",
    },
    {
      href: "https://townshiptale.com/",
      label: "A Township Tale — Alta",
      note: "Stylised low-poly Quest build with the design rationale openly stated.",
    },
    {
      href: "https://quill.art/",
      label: "Quill — Smoothstep",
      note: "Inigo Quilez's continuation of the VR illustration tool.",
    },
    {
      href: "https://arxiv.org/pdf/2412.10456",
      label: "FovealNet — foveated rendering for VR",
      note: "Up-to-72% GPU savings, the engineering tailwind behind the low-poly choice.",
    },
  ],
};
