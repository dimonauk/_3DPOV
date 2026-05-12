import Link from "next/link";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = <span className="ml-0.5 text-chrome-500">&nearr;</span>;

export default function KindredPractices() {
  return (
    <>
      <p>
        This is a curated room of practitioners whose work the studio
        watches. Some come from flow-arts; some come from gallery
        installation; some come from drones; all of them have
        answered, in their own register, the question of how to make
        a gesture last longer than its body. None of them are the
        studio. All of them belong on your follow list.
      </p>

      <p>
        <strong>Reuben Wu (Chicago / UK)</strong> &mdash;{" "}
        <a
          href="https://reubenwu.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          reubenwu.com{arrow}
        </a>{" "}
        &mdash; flies LEDs on programmed waypoints over mountains and
        deserts. The <em>Lux Noctis</em> and <em>Aeroglyphs</em>{" "}
        series are the closest contemporary cousins to the
        studio&rsquo;s{" "}
        <Link href="/aerial" className={ext}>
          drone-mounted LED work
        </Link>{" "}
        &mdash; geometric halos held above remote terrain, long-
        exposed into single frames. He is the practitioner the
        studio learned the most from, by photograph.
      </p>

      <p>
        <strong>Janne Parviainen (Finland)</strong> &mdash;{" "}
        <a
          href="https://www.flickr.com/people/jannepaint/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          flickr.com/jannepaint{arrow}
        </a>{" "}
        &mdash; topographic LED long-exposures: entire rooms and
        skeletal figures traced with a single LED across multi-
        minute exposures, straight out of camera, no compositing.
        The discipline of his frames &mdash; every photograph is one
        exposure, no edits &mdash; is the standard the studio holds
        itself to.
      </p>

      <p>
        <strong>Hannu Huhtamo (Helsinki)</strong> &mdash;{" "}
        <a
          href="https://www.hannuhuhtamo.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          hannuhuhtamo.com{arrow}
        </a>{" "}
        &mdash; organic light sculpture: luminous deep-sea
        creatures and floral forms drawn into Finnish forests with
        custom tools. Member of the Valopaja collective. The
        figurative side of the practice the studio sits next to;
        proof that long-exposure work doesn&rsquo;t have to be
        abstract to be serious.
      </p>

      <p>
        <strong>Darren Pearson / Dariustwin (Southern California)</strong>{" "}
        &mdash;{" "}
        <a
          href="https://dariustwin.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          dariustwin.com{arrow}
        </a>{" "}
        &mdash; hand-drawn light skeletons and life-sized figures.
        Builds his own tools (the Night-Writer); commissioned by
        National Geographic, Apple, Disney. The studio respects
        his refusal to use commercial pixel pois &mdash; for the
        same reason the studio refused them. The right tool is
        usually the one you built.
      </p>

      <p>
        <strong>Patrick Rochon (Montreal)</strong> &mdash;{" "}
        <a
          href="https://lightpaintingphotography.com/light-painting-artist/featured-artist-2/patrick-rochon/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          feature on Light Painting Photography{arrow}
        </a>{" "}
        &mdash; kinetic light "kata" portraits, custom Liteblade
        swords, body-and-light choreography. Pioneered live light-
        painting workshops after a decade in Tokyo. If the studio
        has a closest spiritual relative in the kata-as-photograph
        register, it is Rochon&rsquo;s work.
      </p>

      <p>
        <strong>Vicki DaSilva (Cape Breton Island)</strong> &mdash;{" "}
        <a
          href="https://www.vickidasilva.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          vickidasilva.com{arrow}
        </a>{" "}
        &mdash; fluorescent-tube light graffiti. Drags 4- and 8-foot
        tubes through scenes on tracks and pulleys to write text
        and pattern light into architectural environments. Coined
        "light graffiti" in 1980; exhibits in gallery contexts. A
        reminder that this is a forty-year-old discipline, not a
        recent invention.
      </p>

      <p>
        <strong>Brian Matthew Hart (Illinois)</strong> &mdash;{" "}
        <a
          href="https://lightpaintingphotography.com/light-painting-artist/featured-artist-2/brian-hart/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          feature on Light Painting Photography{arrow}
        </a>{" "}
        &mdash; light-painting mosaics. Single grand images built
        from hundreds of individual long exposures &mdash; one piece
        is 324 frames &mdash; assembled into dreamlike domestic
        scenes drawn in red, yellow and green lines. The studio
        keeps to single-frame work, but admires the patience
        Hart&rsquo;s practice rewards.
      </p>

      <p>
        <strong>Sola / Peter Medlicott (Birmingham)</strong> &mdash;{" "}
        <a
          href="https://lightbombing.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          lightbombing.com{arrow}
        </a>{" "}
        &mdash; coined "lightbombing"; works with whatever&rsquo;s
        to hand (road lamps, phones, LEDs) painting live into urban
        scenes. Featured by CNN, Vanity Fair. A near-neighbour to
        the Salford studio in both geography and instinct: the
        right tool is what you have.
      </p>

      <p>
        These eight do not exhaust the field. There are hundreds of
        practitioners worth a follow on{" "}
        <a
          href="https://lightpaintinghub.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          Light Painting Hub{arrow}
        </a>
        ; the studio sends new readers there for the broader survey.
        The shortlist above is who the studio thinks about when
        deciding what kind of photograph to make next.
      </p>
    </>
  );
}
