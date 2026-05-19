import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function SpatialAudioInWebXr() {
  return (
    <>
      <p>
        The princess wants to start with an apology to the ears. Most
        of the conversation about virtual reality is a conversation
        about the eyes &mdash; the panels, the optics, the framerate,
        the foveated rendering, the per-eye disparity. The ear gets
        the back of the discussion. It should get the front. In a
        headset the eyes are the unreliable sense; the ear is the
        sense the wearer&rsquo;s nervous system trusts. Get the audio
        right and the scene feels solid even when the geometry is
        sparse. Get the audio wrong and the most photographically
        ambitious scene the GPU can render still feels flat.
      </p>

      <p>
        This piece walks the perceptual argument first &mdash; why the
        ear is the load-bearing sense in VR &mdash; then names the
        aesthetic canon the studio listens to when it is reaching for
        a register, then sets out the four flavours of WebXR audio and
        the technical knob (HRTF panning, free in the browser) that
        does most of the work. A sibling tutorial,{" "}
        <Link href="/tutorials/wiring-spatial-audio-in-the-framework" className={ext}>
          Wiring spatial audio in the Holoflow framework
        </Link>
        , takes the reader through the bench-level recipe in code; the
        present article is the why and the listening.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Why spatial audio matters more in VR than on a flat screen
      </h2>

      <p>
        On a desktop monitor, vision is the trusted sense and audio is
        accompaniment. In a headset the trust order inverts, and it
        inverts for two physiological reasons.
      </p>

      <p>
        <strong>Vision becomes unreliable inside the headset.</strong>{" "}
        Three things break that do not break on a flat screen. The
        eyes converge on the screens at a fixed distance but focus on
        whatever the scene tells them to focus on, which is the
        vergence-accommodation conflict the literature on cybersickness
        keeps returning to &mdash; the inner ear and the visual cortex
        receive inputs the wearer&rsquo;s nervous system cannot
        reconcile, and a sub-population of wearers will read the
        mismatch as nausea after fifteen or twenty minutes. Stereo
        depth at the periphery breaks down because both eyes see
        different pixels under foveation, so the brain has to work
        harder for fusion in the area it is least equipped to attend to.
        And lag &mdash; the very small motion-to-photon delay every
        headset has, even the very best of them &mdash; registers as a
        wrongness the visual system cannot place. Eyes in VR are doing
        their best in a context that fights them.
      </p>

      <p>
        <strong>The ear, by contrast, is much harder to fool and much
        less easily fatigued.</strong> The auditory system evolved to
        localise sound in three dimensions in the dark and to do so
        within a fraction of a second of the wave hitting the pinna.
        Interaural time difference, interaural level difference, and the
        head-related transfer function (the way the wearer&rsquo;s own
        pinna and head reshape an incoming wavefront before it reaches
        the ear canal) all work whether or not the wearer can see the
        source. A footstep behind the listener is read as behind even
        in pitch darkness. A door creaking off to the left turns the
        head before the eyes can confirm anything. The ear is not
        more accurate than the eye in absolute terms; the ear is more
        accurate than the eye{" "}
        <em>about the things the eye is bad at</em> &mdash; sources
        behind and above the head, occluded sources, sources whose
        position changes faster than the eyes can track. In a VR
        headset the wearer&rsquo;s peripheral vision is already
        compromised by the field-of-view of the optics; the ear is
        doing more of the spatial work than the wearer realises.
      </p>

      <p>
        Mike Morasky at Valve has put this in a sentence that still
        teaches well, in his GDC talks on the audio of{" "}
        <em>Half-Life: Alyx</em>: in VR the audio is not the
        decoration on top of the scene, it is part of the scene.
        Treating it as decoration is the most common mistake a flat-
        screen-trained designer brings into the medium.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The aesthetic canon &mdash; what the studio listens to
      </h2>

      <p>
        Six reference points the studio reaches for when the
        conversation turns to what spatial audio actually sounds like
        when it is doing its job. Real records, real games, real
        studios.
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-chrome-700 text-left text-chrome-300">
              <th className="py-2 pr-4">Work</th>
              <th className="py-2 pr-4">Author / studio</th>
              <th className="py-2 pr-4">Year</th>
              <th className="py-2">Why it sits here</th>
            </tr>
          </thead>
          <tbody className="text-chrome-200">
            <tr className="border-b border-chrome-800">
              <td className="py-2 pr-4">
                <em>
                  <a
                    href="https://en.wikipedia.org/wiki/Ambient_1:_Music_for_Airports"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={ext}
                  >
                    Ambient 1: Music for Airports{arrow}
                  </a>
                </em>
              </td>
              <td className="py-2 pr-4">Brian Eno</td>
              <td className="py-2 pr-4">1978</td>
              <td className="py-2">
                The originating &ldquo;ambient as space&rdquo; record;
                Eno&rsquo;s sleeve essay is where the term
                &ldquo;ambient music&rdquo; is first written down with
                the architectural definition the studio uses.
              </td>
            </tr>
            <tr className="border-b border-chrome-800">
              <td className="py-2 pr-4">
                <em>
                  <a
                    href="https://www.half-life.com/en/alyx"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={ext}
                  >
                    Half-Life: Alyx{arrow}
                  </a>
                </em>
              </td>
              <td className="py-2 pr-4">Valve (Mike Morasky)</td>
              <td className="py-2 pr-4">2020</td>
              <td className="py-2">
                The high-water mark for spatial audio in VR. Every
                source is positionally placed; the headcrab clicks come
                from a believable point in the room every time.
              </td>
            </tr>
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
              <td className="py-2 pr-4">Polyarc</td>
              <td className="py-2 pr-4">2018</td>
              <td className="py-2">
                Narration treated as spatial intimacy. The narrator
                sits a fixed distance off the wearer&rsquo;s shoulder
                and is binaurally placed so it reads as a companion
                rather than as voiceover.
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
              <td className="py-2 pr-4">Beat Games</td>
              <td className="py-2 pr-4">2019 (1.0)</td>
              <td className="py-2">
                Music in stereo; cues (block hits, sabre swooshes)
                spatially placed at the contact point. The contrast
                between the 2D music bed and the 3D cue layer is the
                blueprint a great many WebXR rhythm titles still copy.
              </td>
            </tr>
            <tr className="border-b border-chrome-800">
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
              <td className="py-2 pr-4">Cloudhead Games</td>
              <td className="py-2 pr-4">2019</td>
              <td className="py-2">
                Music-driven scene-design. The level pulses to the
                track and the enemies appear on the beat; the audio
                does the choreography the visuals only suggest.
              </td>
            </tr>
            <tr>
              <td className="py-2 pr-4">
                <em>
                  <a
                    href="https://www.housemarque.com/games/returnal"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={ext}
                  >
                    Returnal{arrow}
                  </a>
                </em>
              </td>
              <td className="py-2 pr-4">Housemarque</td>
              <td className="py-2 pr-4">2021</td>
              <td className="py-2">
                Not VR but the binaural design under the Tempest 3D
                Audio engine teaches the technique on a flat screen
                with headphones. The studio listens to{" "}
                <em>Returnal</em> as a reference for what HRTF panning
                can do when an entire game is mixed to assume it.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="mt-12 text-2xl text-chrome-100">
        The four flavours of WebXR audio
      </h2>

      <p>
        The vocabulary an author needs to read the canon above and to
        author work that lives in the same lineage. Web Audio gives the
        author all four for free; the discipline is choosing the right
        one for the right cue.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Mono, unpositioned.</strong> The cue plays at the
          master bus with no pan information. Use for: UI clicks,
          confirmation tones, the narrator voice when it is not meant
          to be in the room. The wearer reads this as &ldquo;the
          system speaking&rdquo; rather than &ldquo;a thing happening
          in space&rdquo;.
        </li>
        <li>
          <strong>Stereo with 2D pan.</strong> A pre-recorded stereo
          file plays through the master bus, with at most a hard L/R
          balance. Use for: music beds, broad ambience, the wash of a
          room tone that should not have a discrete source. The
          wearer reads this as &ldquo;the scene&rsquo;s atmosphere&rdquo;
          rather than &ldquo;a place to look&rdquo;.
        </li>
        <li>
          <strong>HRTF-panned 3D sound.</strong> A mono source routed
          through a <code>PannerNode</code> with{" "}
          <code>panningModel = &ldquo;HRTF&rdquo;</code> and a
          position in world space. The browser does the binaural work.
          Use for: any cue with a believable point of origin &mdash;
          footsteps, doors, voices, a teapot whistling on the cooker.
          This is the workhorse and the one most authors under-use.
        </li>
        <li>
          <strong>Ambisonic / scene-based.</strong> A B-format
          recording (W, X, Y, Z channels) of a full 360&deg; sound
          field, decoded to the listener&rsquo;s head orientation
          every frame. Use for: room ambiences captured on location, a
          forest, a chapel, a tube platform. Heavier to ship and more
          fiddly to author than HRTF panning but irreplaceable when the
          authenticity of a real room is the brief. The Resonance
          Audio (Google) and Steam Audio (Valve) SDKs ship reference
          ambisonic decoders; the Web Audio spec itself does not (yet)
          ship a decoder primitive, so authors do it by hand or with a
          library.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        HRTF in the browser &mdash; what you get for free
      </h2>

      <p>
        The Web Audio API has shipped a <code>PannerNode</code> with
        HRTF panning since the spec stabilised. The author writes:
      </p>

      <pre className="mt-4 overflow-x-auto rounded bg-chrome-900/40 p-4 text-sm text-chrome-200">
        <code>{`const panner = ctx.createPanner();
panner.panningModel = "HRTF";
panner.positionX.value = 2;
panner.positionY.value = 0;
panner.positionZ.value = -3;
source.connect(panner).connect(ctx.destination);`}</code>
      </pre>

      <p>
        That is the whole technique. The browser convolves the mono
        source against a per-ear impulse response derived from a
        generic head model and produces a stereo output that, played
        through headphones, the wearer&rsquo;s nervous system reads as
        a sound at the given point in space. Chromium, Firefox and
        recent Safari ship this; older Safari and a few Android
        browsers fall back silently to <code>equalpower</code>, which
        is a simple L/R balance that does not have the
        in-front-versus-behind discrimination HRTF has. The fallback
        is acceptable for cues that only need a stereo position; it is
        not acceptable for cues whose dramatic point is that the
        wearer should look behind.
      </p>

      <p>
        The trade-off the author trades when they pick HRTF over
        equalpower is CPU. HRTF panning is convolution; convolution is
        more expensive than a stereo gain pair. On a desktop browser
        the cost is invisible. On a standalone headset the cost is
        small but real &mdash; Meta Browser on Quest does the HRTF work
        on the audio thread and most scenes will not notice it, but a
        scene with a hundred concurrent HRTF sources will notice it.
        The studio&rsquo;s rule: HRTF the cues that deserve a position,
        equalpower the rest, stereo-bed the music.
      </p>

      <p>
        The other thing HRTF gives the author for free is{" "}
        <em>listener orientation</em>. The Web Audio
        <code>AudioListener</code> takes a position and a forward
        vector; updating both every frame from the headset pose means
        the wearer&rsquo;s head rotation is reflected in the audio
        immediately. The sibling tutorial,{" "}
        <Link href="/tutorials/wiring-spatial-audio-in-the-framework" className={ext}>
          Wiring spatial audio in the Holoflow framework
        </Link>
        , has the code for this in a useFrame loop.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Authoring tips for the studio register
      </h2>

      <p>
        The aesthetic the studio reaches for sits in the Eno /{" "}
        <em>On Land</em> lineage rather than the AAA blockbuster
        lineage. The vocabulary below is closer to a Tycho or a Cooper
        record than to a film score: suggestion rather than
        prescription, sparseness rather than density, low frequencies
        rather than loud high ones.
      </p>

      <ul className="mt-6 list-none space-y-3 pl-0">
        <li>
          <strong>Leave room for silence.</strong> A scene whose audio
          plays continuously trains the ear to ignore it; a scene
          whose audio pauses for ten seconds and then places a single
          low note off to the right teaches the ear to pay attention.
          The wearer&rsquo;s attention is the budget; spend it on the
          cues that matter.
        </li>
        <li>
          <strong>Favour low-frequency-heavy material.</strong> Low
          frequencies are non-directional in the wearer&rsquo;s
          perception &mdash; the sub-bass of a synth pad sits inside
          the wearer&rsquo;s body rather than in the room. Mid and
          high frequencies are where the HRTF panning does its
          dramatic work. A bed of warm low-frequency content with a
          sparse mid-high spatial layer reads as a room with weather.
        </li>
        <li>
          <strong>Use room reverb to suggest space.</strong> A short
          reverb tail of even 200&nbsp;ms changes a cue from
          &ldquo;sample played&rdquo; to &ldquo;sound in a room&rdquo;.
          Web Audio&rsquo;s <code>ConvolverNode</code> with a short
          impulse response (or the synthesised tail from a feedback
          delay) does this cheaply. Match the tail to the visible room
          size or risk reading as a film rather than a place.
        </li>
        <li>
          <strong>Avoid voiceover-style narration unless it serves
            the piece.</strong>{" "}
          A flat, directionless voiceover places the wearer in the
          posture of an audience member rather than a person in a
          room. <em>Moss</em>&rsquo;s narrator works because she is
          spatially placed &mdash; the wearer hears her at a definite
          distance and direction. A piece that wants the audience-
          member posture can use unpositioned narration deliberately;
          a piece that wants the in-the-room posture must place its
          voice in space.
        </li>
        <li>
          <strong>Listen on the headphones the wearer will wear.</strong>{" "}
          HRTF is calibrated to a generic head. Open-back studio
          monitors will exaggerate the spatial effect; the cheap
          earbuds bundled with a Quest 3 will compress it. Mix on the
          target.
        </li>
      </ul>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Cross-references
      </h2>

      <p>
        The visual companion pieces are the sibling articles on{" "}
        <Link href="/articles/low-poly-graphics-in-vr" className={ext}>
          Low-poly graphics in VR
        </Link>{" "}
        and{" "}
        <Link href="/articles/cell-shaded-graphics-in-vr" className={ext}>
          Cell-shaded graphics in VR
        </Link>{" "}
        &mdash; both lean on the principle this piece sets out, that
        the audio does the work the visuals cannot. The hands-on
        recipe is in{" "}
        <Link href="/tutorials/wiring-spatial-audio-in-the-framework" className={ext}>
          Wiring spatial audio in the Holoflow framework
        </Link>
        . The studio&rsquo;s atelier that most rewards spatial audio
        is the{" "}
        <Link href="/atelier/sculpture-gallery" className={ext}>
          sculpture gallery
        </Link>
        , where each sculpture could grow a localised audio signature
        the wearer hears as they approach.
      </p>

      <h2 className="mt-12 text-2xl text-chrome-100">
        Sources / further reading
      </h2>

      <ul className="mt-6 list-none space-y-2 pl-0">
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Ambient_1:_Music_for_Airports"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Wikipedia &mdash; Ambient 1: Music for Airports{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://music.hyperreal.org/artists/brian_eno/MFA-txt.html"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Eno &mdash; the original Music for Airports sleeve essay{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Ambient_4:_On_Land"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Wikipedia &mdash; Ambient 4: On Land{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.gdcvault.com/play/1026565/-Half-Life-Alyx-Designing"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            GDC Vault &mdash; the Half-Life: Alyx audio design talk{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.half-life.com/en/alyx"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            half-life.com &mdash; Half-Life: Alyx{arrow}
          </a>
        </li>
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
            href="https://www.housemarque.com/games/returnal"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            housemarque.com &mdash; Returnal{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://www.w3.org/TR/webaudio/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            W3C &mdash; Web Audio API specification{arrow}
          </a>
        </li>
        <li>
          <a
            href="https://developer.mozilla.org/en-US/docs/Web/API/PannerNode"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            MDN &mdash; PannerNode (HRTF panning){arrow}
          </a>
        </li>
        <li>
          <a
            href="https://resonance-audio.github.io/resonance-audio/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Google &mdash; Resonance Audio docs (ambisonics in the
            browser){arrow}
          </a>
        </li>
        <li>
          <a
            href="https://valvesoftware.github.io/steam-audio/"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            Valve &mdash; Steam Audio documentation{arrow}
          </a>
        </li>
      </ul>
    </>
  );
}

/**
 * Visual-style article on spatial audio for WebXR. Pairs the
 * perceptual argument (vision is unreliable in VR, audio is the
 * trusted spatial sense) with the aesthetic canon (Eno's Music for
 * Airports, Half-Life: Alyx, Moss, Beat Saber, Pistol Whip,
 * Returnal), the four flavours of WebXR audio (mono / 2D-stereo /
 * HRTF / ambisonic), and the practical authoring vocabulary the
 * studio reaches for. Sibling tutorial wires the same vocabulary
 * into the Holoflow framework via the audio-bus primitive at
 * lib/game/audio-bus.ts. All named works verified by public URL
 * during research (2026-05-19).
 */
export const entry: Entry = {
  slug: "spatial-audio-in-webxr",
  title:
    "Spatial audio in WebXR — HRTF panning, the aesthetic, and why your eyes lie when your ears don't",
  date: "2026-05-19",
  kind: "article",
  excerpt:
    "Vision in a headset is unreliable; the ear is the body's trusted spatial sense. The aesthetic canon (Eno's Music for Airports, Half-Life: Alyx, Moss, Beat Saber, Pistol Whip, Returnal), the four flavours of WebXR audio (mono, 2D stereo, HRTF, ambisonic), and the authoring vocabulary for the Eno-lineage studio register.",
  Body: SpatialAudioInWebXr,
  related: [
    {
      href: "/tutorials/wiring-spatial-audio-in-the-framework",
      label: "Tutorial — Wiring spatial audio in the Holoflow framework",
      note: "The hands-on companion. Web Audio, HRTF panning, and the audio-bus primitive in code.",
    },
    {
      href: "/articles/low-poly-graphics-in-vr",
      label: "Low-poly graphics in VR",
      note: "The visual sibling. Audio carries the room when the geometry is sparse.",
    },
    {
      href: "/articles/cell-shaded-graphics-in-vr",
      label: "Cell-shaded graphics in VR",
      note: "The visual sibling on the NPR side. Same principle, different surface.",
    },
    {
      href: "/articles/vr-as-psychological-system",
      label: "VR as a psychological system",
      note: "Why presence forgives so much when the audio carries the room.",
    },
    {
      href: "/atelier/sculpture-gallery",
      label: "Sculpture gallery atelier",
      note: "The studio space most likely to grow a localised audio signature per object.",
    },
  ],
  furtherReading: [
    {
      href: "https://music.hyperreal.org/artists/brian_eno/MFA-txt.html",
      label: "Brian Eno — Music for Airports sleeve essay",
      note: "The originating definition of ambient music as architectural space.",
    },
    {
      href: "https://www.gdcvault.com/play/1026565/-Half-Life-Alyx-Designing",
      label: "GDC Vault — Half-Life: Alyx audio design talk",
      note: "Mike Morasky / Valve on spatial audio as part of the scene rather than as decoration.",
    },
    {
      href: "https://www.w3.org/TR/webaudio/",
      label: "W3C — Web Audio API specification",
      note: "PannerNode, AudioListener and the HRTF model are all here.",
    },
    {
      href: "https://resonance-audio.github.io/resonance-audio/",
      label: "Google — Resonance Audio",
      note: "Ambisonic decoder for the browser when scene-based audio is the brief.",
    },
    {
      href: "https://valvesoftware.github.io/steam-audio/",
      label: "Valve — Steam Audio",
      note: "Native-side reference for the spatial audio architecture WebXR borrows from.",
    },
  ],
};
