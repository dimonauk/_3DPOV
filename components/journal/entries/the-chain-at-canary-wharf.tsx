import Link from "next/link";

import type { Entry } from "lib/writing";

export default function TheChainAtCanaryWharf() {
  return (
    <>
      <p>
        The first holographic 360s came out of a long chain and a
        single LED poi on a Canary Wharf plaza last week.
      </p>

      {/* IMAGE: the kit laid out before the shoot — LED poi + the chain coiled on pavement, or held up. portrait-eligible. */}

      <p>
        Holographic in the long-exposure-photographer&rsquo;s sense, not
        the optical-physicist&rsquo;s. The body stands still, the chain
        swings horizontally on a single axis, and the rotation is
        steady enough that the LEDs paint a continuous disc in the
        air. Frame timing has to line up with rotation rate. If the
        timing drifts, the disc warps. If the body sways, the disc
        tilts and the next frame lands somewhere the previous one
        didn&rsquo;t, and what was a hovering image becomes a smudge.
      </p>

      <p>
        The trick is the stuck loop. You drop into a horizontal spin,
        you hold it for thirty seconds at a time, the body learns to
        keep the rotation constant by feedback from the chain weight,
        and the LED frame pattern runs at a rate that fits a whole
        number of frames into the rotation period. That&rsquo;s it. The
        image resolves because nothing else moves.
      </p>

      {/* IMAGE: long-exposure of a successful disc — text or simple geometry hovering at hip height, dark plaza behind. landscape. */}

      <p>
        The location matters more than I expected. Canary Wharf at
        night is a piece of geometry pretending to be a place. The
        glass towers above the basin reflect a copy of every light at
        ground level, so a single LED on a swung chain reads as two
        LEDs in the photograph &mdash; one airborne, one mirrored in
        glass two hundred metres above. I had not planned for this.
        The first frame I framed against the side of one of the
        towers came back with a phantom version of itself in the
        reflective surface behind. I kept both versions in the
        archive; they read different.
      </p>

      {/* IMAGE: a wider Canary Wharf night shot — towers, plaza light, the poi mid-arc in foreground. atmospheric, hero-eligible. */}

      <p>
        The images that worked were the simplest ones. A pink ring at
        hip height. A second ring above it. The word PRACTICE in
        five-character monospaced glyphs that took three attempts to
        get the timing right on. Text is harder than image because
        text demands strict frame ordering &mdash; a single dropped
        frame in the middle of a letter and the letter reads as a
        different letter. PRACTICE became PRACTOICE on the second
        take. I kept that one too.
      </p>

      {/* IMAGE: the resolved frames — pink rings stacked, the word PRACTICE in the air, the misfire PRACTOICE alongside it as a pair. */}

      <p>
        It works because of the same thing{" "}
        <Link
          href="/journal/why-night"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          everything else on the bench works
        </Link>{" "}
        because of: long exposure, low ambient, body that has drilled
        the kata for years. The new element is the rate-lock. A POV
        rig on the body uses a Hall sensor against the rotation; the
        chain doesn&rsquo;t have one yet. I held the rate by feel.
        That&rsquo;s good enough for ten frames into a session and
        unreliable for the eleventh.
      </p>

      <p>
        The chain is the variable I will keep changing. The session I
        ran was on a one-metre chain; I want to try one-point-three
        next time. Longer chain means slower rotation for the same
        loop diameter, which means more frames fit into a single
        revolution, which means more pixels on the holographic
        surface. The body fights it &mdash; longer chain is harder to
        keep stuck &mdash; but the practice can absorb that. The
        drilling is the part that already exists.
      </p>

      <p>
        Now I&rsquo;m going to write the firmware for a chain that
        knows it&rsquo;s a chain.
      </p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry = {
  slug: "the-chain-at-canary-wharf",
  title: "The Chain at Canary Wharf",
  date: "2026-05-15",
  kind: "journal",
  excerpt:
    "First holographic 360s on a Canary Wharf plaza. An LED poi on a one-metre chain, stuck spins, the disc resolving when nothing else moves.",
  Body: TheChainAtCanaryWharf,
  related: [
    {
      href: "/journal/why-night",
      label: "Why Night",
      note: "Why this session, like all the others, ran between midnight and four.",
    },
    {
      href: "/journal/the-night-the-camera-was-right",
      label: "The Night the Camera Was Right",
      note: "The first time the practice became visible in a photograph.",
    },
    {
      href: "/journal/the-bus-at-four",
      label: "The Bus at Four",
      note: "The version of London the chain was swung in.",
    },
    {
      href: "/practice",
      label: "Practice",
      note: "The poi work the holographic disc is made of.",
    },
    {
      href: "/aerial",
      label: "Aerial",
      note: "Cousin project — LED rigs on a platform that flies instead of swings.",
    },
  ],
  furtherReading: [
    {
      href: "https://en.wikipedia.org/wiki/Persistence_of_vision",
      label: "Persistence of vision — Wikipedia",
      note: "The optical effect every POV display, including this one, depends on.",
    },
    {
      href: "https://en.wikipedia.org/wiki/Volumetric_display",
      label: "Volumetric display — Wikipedia",
      note: "The category of display this technique sits adjacent to. Long-exposure photography makes the volumetric image visible after the fact.",
    },
    {
      href: "https://en.wikipedia.org/wiki/Canary_Wharf",
      label: "Canary Wharf — Wikipedia",
      note: "Background on the plaza + the glass towers that turned out to be reflectors.",
    },
  ],
};
