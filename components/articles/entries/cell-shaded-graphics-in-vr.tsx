import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function CellShadedGraphicsInVr() {
  return (
    <>
      <p>
        The princess will sit the reader down before saying anything
        clever, because the subject is technically awkward and the
        register matters. Cell-shaded graphics &mdash; properly
        cel-shaded, with the e, after &ldquo;celluloid&rdquo; &mdash;
        are everywhere on monitors and almost nowhere in virtual
        reality. There is a reason for that, and it is not that the
        artists who would have wanted to make them have stopped
        existing. It is that cel shading and stereoscopy quarrel in
        ways nothing in the technique&rsquo;s flat-monitor history
        prepares you for. The artists who work in this register in VR
        are doing something genuinely difficult; the studios that ship
        cel-shaded VR titles are a smaller bench than the practice
        deserves.
      </p>

      <p>
        This piece names what the technique actually is, lays out the
        canon that built it on monitors, walks through why so little
        of it has crossed into VR cleanly, and catalogues the
        attempts that have. Where the studio cannot verify a UK-side
        figure for a given approach, it says so rather than padding
        the list.
      </p>

      <p>
        Adjacent studio pieces:{" "}
        <Link href="/articles/vr-as-psychological-system" className={ext}>
          VR as a psychological system
        </Link>{" "}
        on what presence does to the perception of stylisation,{" "}
        <Link href="/articles/colour-without-pigment" className={ext}>
          Colour Without Pigment
        </Link>{" "}
        on flat-colour discipline, and{" "}
        <Link href="/atelier/isosurface" className={ext}>
          the isosurface atelier
        </Link>{" "}
        on geometric form when the surface is doing the work.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        What cel shading actually is
      </h2>

      <p>
        Cel shading is non-photorealistic rendering (NPR) of 3D
        geometry to look like 2D animation. The technique has three
        load-bearing parts. A <strong>ramp shader</strong> quantises
        the lighting into a small number of bands &mdash; usually two
        or three &mdash; rather than the continuous gradient a Phong
        or PBR shader produces, which is what gives cel-shaded
        characters their flat-colour-with-discrete-shadow look. An{" "}
        <strong>outline pass</strong> draws ink lines around the
        geometry by one of half a dozen methods; the cheap one is to
        re-render the model inverted along its normals at a slightly
        larger scale, which produces the silhouette line for free. A{" "}
        <strong>flat or hand-painted texture set</strong> handles the
        surface colour without trying to imply photographic detail
        through normal maps or roughness maps.
      </p>

      <p>
        The technique on a monitor has nearly thirty years of
        practice behind it. Smilebit&rsquo;s <em>Jet Set Radio</em>{" "}
        (Dreamcast, 2000) is the canonical first &mdash; a Guinness
        World Record holder for the first cel-shaded video game and a
        study in the technique that still teaches well. The studio
        called the approach &ldquo;manga dimension&rdquo;
        internally. The line was thicker on stand-out objects than on
        background geometry, which is a discipline that came back into
        fashion two decades later. Borderlands (Gearbox, 2009) sits in
        a different lineage entirely: the studio explicitly does not
        call it cel-shaded but &ldquo;concept-art style&rdquo; or
        &ldquo;hand-drawn comic style&rdquo;, with hand-painted
        textures scanned in and ink lines added in shader. The
        distinction matters because it explains why the technique
        looks the way it does &mdash; the textures are doing more work
        than the lighting model is.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The canon outside VR
      </h2>

      <p>
        The reference points the wearer of a VR headset has in their
        head when they first see anything cel-shaded in a headset.
        The artists making cel-shaded VR work are arguing with this
        list whether they want to or not.
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-chrome-700 text-left text-chrome-300">
              <th className="py-2 pr-4">Title</th>
              <th className="py-2 pr-4">Studio</th>
              <th className="py-2 pr-4">Year</th>
              <th className="py-2">Technique note</th>
            </tr>
          </thead>
          <tbody className="text-chrome-200">
            <tr className="border-b border-chrome-800">
              <td className="py-2 pr-4">
                <em>
                  <a
                    href="https://en.wikipedia.org/wiki/Jet_Set_Radio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={ext}
                  >
                    Jet Set Radio{arrow}
                  </a>
                </em>
              </td>
              <td className="py-2 pr-4">Smilebit (Sega)</td>
              <td className="py-2 pr-4">2000</td>
              <td className="py-2">
                The original. &ldquo;Manga dimension&rdquo;: ramp
                lighting plus a thicker line for foreground objects.
                Guinness-recorded first.
              </td>
            </tr>
            <tr className="border-b border-chrome-800">
              <td className="py-2 pr-4">
                <em>
                  <a
                    href="https://www.gamespot.com/articles/behind-borderlands-11th-hour-style-change/1100-6253257/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={ext}
                  >
                    Borderlands{arrow}
                  </a>
                </em>
              </td>
              <td className="py-2 pr-4">Gearbox Software (Texas)</td>
              <td className="py-2 pr-4">2009</td>
              <td className="py-2">
                Hand-painted textures plus shader-added ink lines.
                Famously a late-stage art-direction pivot. Not strictly
                cel-shaded by the studio&rsquo;s own definition but
                shelved here by everyone else.
              </td>
            </tr>
            <tr className="border-b border-chrome-800">
              <td className="py-2 pr-4">
                <em>
                  <a
                    href="https://en.wikipedia.org/wiki/Tales_of_Vesperia"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={ext}
                  >
                    Tales of Vesperia{arrow}
                  </a>
                </em>
              </td>
              <td className="py-2 pr-4">Namco Tales Studio</td>
              <td className="py-2 pr-4">2008</td>
              <td className="py-2">
                Anime-engine cel shading with shader-driven character
                lighting. The reference for &ldquo;animation that
                stays anime when it rotates&rdquo;.
              </td>
            </tr>
            <tr>
              <td className="py-2 pr-4">
                <em>
                  <a
                    href="https://www.unrealengine.com/en-US/developer-interviews/hi-fi-rush-was-inspired-by-shaun-of-the-dead-and-futurama"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={ext}
                  >
                    Hi-Fi Rush{arrow}
                  </a>
                </em>
              </td>
              <td className="py-2 pr-4">Tango Gameworks (Tokyo)</td>
              <td className="py-2 pr-4">2023</td>
              <td className="py-2">
                The modern high-water mark. &ldquo;Colourful, sharp,
                clean&rdquo; as the three keywords; ramp shading
                pushed to look indistinguishable from a 2D image of
                the level.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Why NPR in VR is still a rare bird
      </h2>

      <p>
        Three engineering problems collide. They are not unsolvable;
        they are unsolved at the price point most VR teams ship at.
      </p>

      <p>
        <strong>The outline problem.</strong> Most cel-shading
        outlines are screen-space effects &mdash; they are drawn into
        the framebuffer based on depth and normal discontinuities, or
        by an inverted-mesh trick that renders the model twice. Both
        approaches break in stereoscopy in the same way: the two eyes
        get slightly different framebuffers, the outline jitters
        between them, and the wearer&rsquo;s visual system reads the
        jitter as a depth conflict that it then tries to fuse. The
        outline that looks crisp on one eye looks misaligned on the
        other, and the fusion failure registers as eye strain. The
        inverted-mesh trick handles this better than the
        screen-space normal-detection trick, because the inverted
        mesh exists in world space and gets re-rendered consistently
        for each eye; but it doubles the geometry budget at the same
        time, which collides with the framerate-per-eye demand.
      </p>

      <p>
        <strong>The foveation conflict.</strong> Foveated rendering,
        the GPU savings technique most VR engines now rely on, runs
        the peripheral region at lower resolution. A cel-shaded
        outline that is one or two pixels wide at full resolution is
        invisible at the peripheral resolution. The outline pops in
        and out of existence as the wearer&rsquo;s eye moves across
        the scene, which is a much louder artefact than the same
        outline simply not being there. Cel shading and foveation
        currently want different things from the rendering pipeline.
      </p>

      <p>
        <strong>The ramp-band depth conflict.</strong> A ramp shader
        produces hard transitions between light and shadow bands. In
        a stereoscopic context, those hard bands sit at different
        screen positions for each eye because the lighting is
        view-dependent in a way the ramp does not know about. The
        wearer&rsquo;s brain sees the band jump between eyes and
        reads it as motion or as a stereoscopic depth conflict. The
        cheats &mdash; softening the band, dithering across it,
        running it as a screen-space effect rather than a
        per-fragment shader &mdash; all chip at the &ldquo;flat
        animation cel&rdquo; look the technique was hired to provide.
      </p>

      <p>
        These problems are tractable in isolation. They are
        compounding when stacked. A modern VR engine that wants
        cel-shaded output has to solve all three at once, on a
        framerate budget already under pressure, for a market that
        cannot reliably distinguish the difference from one
        non-cel-shaded stylised technique to another. The economic
        case for solving it is thinner than the artistic case.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The VR-side attempts
      </h2>

      <p>
        What the bench actually looks like. Smaller than the canon
        above and largely tool-based or single-experience rather than
        full-game.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>
            <a
              href="https://docs.openbrush.app/user-guide/tilt-brush-release-notes"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Tilt Brush brushes{arrow}
            </a>{" "}
            (Google, 2016 onward).
          </strong>{" "}
          The Toon, Wire, Spikes, Unlit Hull and Diamond brushes are
          essentially cel-shaded primitives the painter can lay down
          in space. The Toon brush in particular ships with a flat
          lighting model and a hard outline; a Tilt Brush painting
          done entirely in these brushes is the closest a VR painter
          can come to drawing a cel-shaded scene from scratch. The
          tool now continues as the open-source Open Brush.
        </li>
        <li>
          <strong>
            <a
              href="https://quill.fb.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Quill brushwork{arrow}
            </a>{" "}
            in the Goro Fujita lineage.
          </strong>{" "}
          Goro Fujita, formerly art director at Oculus Story Studio
          and then artist-in-residence at Meta on Quill, has built a
          decade of VR paintings in a flat-shaded cel-adjacent
          register &mdash; the Quill brushes are flat colour by
          default and a Quill painting reads as cel-shaded almost by
          omission, since the tool does not implement a continuous
          shading model in the first place. Quill is now run by{" "}
          <a
            href="https://quill.art/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Smoothstep{arrow}
          </a>{" "}
          under Inigo Quilez, the original developer. The Fujita
          archive is a public-facing argument for &ldquo;painted
          animation in VR is already cel-shaded; it just needs the
          right tool to admit it&rdquo;.
        </li>
        <li>
          <strong>
            <a
              href="https://www.cloudheadgames.com/pistol-whip"
              target="_blank"
              rel="noopener noreferrer"
              className={ext}
            >
              Pistol Whip{arrow}
            </a>{" "}
            stylised modes (Cloudhead Games, 2019).
          </strong>{" "}
          Not a strict cel-shaded game; sits in the
          neon-stylised-NPR family with hard silhouettes, flat
          enemies and posterised lighting. The stylisation is the
          point and the rendering choices are aware of the
          stereoscopic strain. As close as a pure-VR rhythm shooter
          has come to the look.
        </li>
        <li>
          <strong>Studio Syro and the wider Quill animation cluster.</strong>{" "}
          A loose cohort of independent artists publishing short VR
          films built almost entirely from Quill brushwork. The
          cohort overlaps with the Goro Fujita teaching and
          mentorship orbit. Treated here as a real but pseudonymous
          working scene rather than a list of names; the studio
          flags this as an active research gap and will name
          practitioners once the URLs resolve.
        </li>
      </ul>

      <p className="mt-6">
        The honest absence: there is, at the time of writing, no
        widely-shipped UK-developed cel-shaded VR game in the way
        Coatsink and nDreams ship stylised low-poly VR games. The
        studio could not verify a counterexample to that claim during
        research. If a reader knows of one, the rolodex is open at
        the studio.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Techniques worth knowing
      </h2>

      <p>
        The shader-and-rendering vocabulary an artist needs to read
        the canon above and to attempt anything in this register
        themselves.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Ramp shading (toon shading).</strong> A
          one-dimensional texture sampled by the lighting model. The
          texture has two or three discrete bands; the lighting model
          looks up its computed value and snaps to the nearest band.
          Cheap, robust on monitors, awkward in stereoscopy because
          the band positions differ between eyes by a few pixels in
          ways the wearer can sometimes see.
        </li>
        <li>
          <strong>Inverted-hull outlines.</strong> Render the mesh
          twice: once normally, once inverted along its vertex
          normals at a slightly larger scale and in solid black. The
          inverted hull shows only where it is not occluded by the
          normal mesh, which produces a silhouette line. The most
          stereoscopy-stable outline technique because both hulls
          live in world space and the eye-difference is handled
          correctly by the headset projection.
        </li>
        <li>
          <strong>Fresnel-based outlines.</strong> The line is drawn
          where the dot product between the surface normal and the
          view direction crosses a threshold &mdash; that is, at the
          silhouette as seen from a given eye. The cheap version of
          this lives in the fragment shader and produces an outline
          on every face. Beware: because the dot-product threshold is
          view-dependent, the line shifts between eyes in
          stereoscopy. Mitigation: bias the threshold so the line is
          wide enough that the per-eye difference is invisible, or
          run the technique as a screen-space pass that draws into
          both eye buffers consistently.
        </li>
        <li>
          <strong>Posterised lighting.</strong> The cousin of ramp
          shading: take the continuous lighting result and quantise
          it to N discrete values in a post-process step. Visually
          cel-adjacent without requiring a per-material ramp setup.
          The Quill brushwork register is essentially this with the
          continuous step removed entirely.
        </li>
        <li>
          <strong>Edge detection from depth and normals.</strong> A
          screen-space pass that compares neighbouring pixels in the
          depth and normal buffers; where the difference is sharp,
          draw a line. Looks beautiful on monitors. Breaks visibly in
          stereoscopy because the depth buffers differ between eyes
          and the edge-detection result is therefore not the same.
          Avoidable in VR with sufficient effort; not commonly worth
          it.
        </li>
        <li>
          <strong>Hand-painted texture sets.</strong> The Borderlands
          and <em>Hi-Fi Rush</em> approach. Texture-side art does the
          lighting work the shader would otherwise do; the shader
          itself can stay near-unlit. This is the
          most-stereoscopy-stable cel-shaded technique because there
          are no view-dependent computations at all. The cost is the
          artist&rsquo;s hand: every surface has to be painted, and
          the texture budget rises sharply.
        </li>
        <li>
          <strong>Geometry-baked ink.</strong> The painter draws the
          line into the geometry itself by modelling thin black
          ribbons along the silhouette edges of the mesh. The most
          robust approach in VR; the most laborious to author. Quill
          painters do this naturally; mesh modellers rarely.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Honest about the trade-offs
      </h2>

      <p>
        Cel-shaded VR is hard in a way the canon does not advertise.
        A painter who has spent years on monitor-side cel shading
        will discover that nearly every reflex they have is wrong in
        a headset. Outlines need to be thicker. Ramp bands need to
        be wider and softer. Highlights need to be larger and less
        defined, because the wearer&rsquo;s parallax will catch a
        specular highlight that flickers between the eyes and read
        it as a discomfort. Animation has to be tuned for headset
        comfort &mdash; sudden cuts and quick rotations that read as
        snappy on a monitor read as nauseating in a headset.
      </p>

      <p>
        And the perceptual problem is real: many wearers find
        cel-shading in VR less &ldquo;present&rdquo; than either
        photoreal or low-poly registers, because the strong stylisation
        and the strong embodiment cue argue with each other. The
        wearer&rsquo;s body is in the scene; the scene looks like an
        animation it cannot be in. Some artists treat this as a
        feature &mdash; the deliberate dissonance becomes the
        aesthetic statement &mdash; and some treat it as a bug to be
        engineered around. The studio&rsquo;s position is that there
        is room for both readings and that the medium is still finding
        its register.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        UK ground &mdash; the honest gaps
      </h2>

      <p>
        The UK has cel-shading practitioners on the monitor side and
        VR practitioners on the painting side; the intersection
        &mdash; UK artists shipping cel-shaded VR &mdash; is thin
        enough that the studio is calling it out as a gap rather than
        filling it with names that do not resolve. The closest
        verified UK practice sits inside the VR sculpting tool
        ecosystem documented in the sibling{" "}
        <Link href="/articles/whos-who-uk-vr-sculpting-people" className={ext}>
          Who&rsquo;s Who &mdash; UK VR sculpting people
        </Link>{" "}
        index, particularly the Gravity Sketch (London) and the Quill
        / Open Brush user cohort. The wider VR industry the studio
        sits adjacent to is mapped in{" "}
        <Link href="/articles/whos-who-uk-vr-people" className={ext}>
          Who&rsquo;s Who &mdash; UK VR people
        </Link>
        , and the AR-side neighbours in{" "}
        <Link href="/articles/whos-who-uk-ar-people" className={ext}>
          Who&rsquo;s Who &mdash; UK AR people
        </Link>
        . If a UK studio has a cel-shaded VR shipping title the
        studio missed, the editorial position is to credit it on the
        next revision; the brief was strictness of verification, not
        breadth.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Where the studio sits
      </h2>

      <p>
        The studio does not currently ship cel-shaded VR. The
        atelier&rsquo;s VR work runs in the faceted low-poly register
        documented in{" "}
        <Link href="/articles/low-poly-graphics-in-vr" className={ext}>
          Low-poly graphics in VR
        </Link>{" "}
        and in the volumetric brushwork register documented in{" "}
        <Link href="/articles/sellotape-and-tilt-brush" className={ext}>
          Sellotape and Tilt Brush
        </Link>
        . The cel-shaded register is the one the studio reads more
        than it writes. The closest the studio&rsquo;s own output
        comes is the flat-colour discipline catalogued in{" "}
        <Link href="/articles/colour-without-pigment" className={ext}>
          Colour Without Pigment
        </Link>{" "}
        and the geometric outline work on isosurface forms in{" "}
        <Link href="/atelier/isosurface" className={ext}>
          the isosurface atelier
        </Link>{" "}
        &mdash; both of which share the &ldquo;line and flat
        colour&rdquo; sensibility cel shading has without paying its
        rendering bill.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Sources / further reading
      </h2>

      <ul className="mt-6 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Jet_Set_Radio"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Wikipedia &mdash; Jet Set Radio (Smilebit){arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.bfi.org.uk/jet-set-radio-grinding-cutting-edge-cool-25-years"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            BFI &mdash; Jet Set Radio at 25{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.gamespot.com/articles/behind-borderlands-11th-hour-style-change/1100-6253257/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            GameSpot &mdash; Behind Borderlands&rsquo; 11th-hour
            style change{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://kotaku.com/gearbox-explain-cel-shaded-borderlands-5210855"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Kotaku &mdash; Gearbox explain cel-shaded Borderlands{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Tales_of_Vesperia"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Wikipedia &mdash; Tales of Vesperia{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.unrealengine.com/en-US/developer-interviews/hi-fi-rush-was-inspired-by-shaun-of-the-dead-and-futurama"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Unreal Engine &mdash; Hi-Fi Rush developer interview{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://docs.openbrush.app/user-guide/tilt-brush-release-notes"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Open Brush &mdash; Tilt Brush release notes and brush
            catalogue{arrow}
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
            href="https://voicesofvr.com/790-vr-artist-goro-fujita-transformative-moments-in-quill-with-3d-drawing-animation/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Voices of VR &mdash; Goro Fujita on Quill{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.meta.com/blog/theater-elsewhere-vr-animation-quill-smoothstep-goro-fujita/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Meta &mdash; Theater Elsewhere interview with Goro
            Fujita{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.engadget.com/facebook-quill-vr-illustration-tool-inigo-quilez-181549077.html"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Engadget &mdash; Facebook hands Quill to Inigo
            Quilez{arrow}
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
            href="https://vrarwiki.com/wiki/Stereoscopic_rendering"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            VR &amp; AR Wiki &mdash; Stereoscopic rendering
            primer{arrow}
          </a>
        </li>
      </ul>
    </>
  );
}

/**
 * Visual-style article on cel-shaded / NPR graphics as they pertain
 * to virtual reality. Pairs the monitor-side canon (Jet Set Radio,
 * Borderlands, Tales of Vesperia, Hi-Fi Rush) with the structural
 * reasons NPR is rare in VR (outline-in-stereoscopy, foveation,
 * ramp-band depth conflicts), and the small bench of VR-side
 * attempts. UK gap is flagged honestly rather than padded.
 *
 * All named studios and titles verified by public URL during
 * research (2026-05-19). Goro Fujita / Inigo Quilez / Smoothstep
 * succession verified via Meta's own blog and Engadget.
 */
export const entry: Entry = {
  slug: "cell-shaded-graphics-in-vr",
  title: "Cell-shaded graphics in VR",
  date: "2026-05-19",
  kind: "article",
  excerpt:
    "Cel shading and stereoscopy quarrel. The monitor-side canon (Jet Set Radio, Borderlands, Tales of Vesperia, Hi-Fi Rush), why the technique is rare in VR (outlines, foveation, ramp-band depth conflicts), the small bench of VR-side attempts (Tilt Brush brushes, Goro Fujita's Quill work, Pistol Whip), and the shader vocabulary worth knowing.",
  Body: CellShadedGraphicsInVr,
  related: [
    {
      href: "/articles/low-poly-graphics-in-vr",
      label: "Low-poly graphics in VR",
      note: "The sibling visual-style article. The register the studio actually ships in.",
    },
    {
      href: "/articles/whos-who-uk-vr-people",
      label: "Who's Who — UK VR people",
      note: "The verified UK VR practitioner index. Sibling list.",
    },
    {
      href: "/articles/whos-who-uk-vr-sculpting-people",
      label: "Who's Who — UK VR sculpting people",
      note: "Gravity Sketch, Quill, Tilt Brush — the tool side.",
    },
    {
      href: "/articles/whos-who-uk-ar-people",
      label: "Who's Who — UK AR people",
      note: "Sibling index on the adjacent AR side.",
    },
    {
      href: "/articles/vr-as-psychological-system",
      label: "VR as a psychological system",
      note: "Why presence and stylisation argue in NPR contexts.",
    },
    {
      href: "/articles/colour-without-pigment",
      label: "Colour Without Pigment",
      note: "The studio's flat-colour discipline, adjacent to ramp shading.",
    },
    {
      href: "/articles/sellotape-and-tilt-brush",
      label: "Sellotape and Tilt Brush",
      note: "The studio's own VR painting practice in adjacent registers.",
    },
    {
      href: "/atelier/isosurface",
      label: "Isosurface atelier",
      note: "Geometric form when the surface is the work.",
    },
  ],
  furtherReading: [
    {
      href: "https://www.unrealengine.com/en-US/developer-interviews/hi-fi-rush-was-inspired-by-shaun-of-the-dead-and-futurama",
      label: "Unreal — Hi-Fi Rush developer interview",
      note: "Modern cel-shading at its high-water mark; the three keywords.",
    },
    {
      href: "https://quill.art/",
      label: "Quill — Smoothstep",
      note: "The VR painting tool whose default is cel-adjacent.",
    },
    {
      href: "https://docs.openbrush.app/user-guide/tilt-brush-release-notes",
      label: "Open Brush — Tilt Brush brushes catalogue",
      note: "Toon, Wire, Unlit Hull and the cel-shaded brush family.",
    },
    {
      href: "https://en.wikipedia.org/wiki/Jet_Set_Radio",
      label: "Jet Set Radio (Wikipedia)",
      note: "The Guinness-recorded first cel-shaded game. Smilebit's manga dimension.",
    },
    {
      href: "https://vrarwiki.com/wiki/Stereoscopic_rendering",
      label: "VR & AR Wiki — Stereoscopic rendering",
      note: "Primer on per-eye rendering and disparity, the foundation for the engineering trade-offs.",
    },
  ],
};
