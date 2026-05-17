import Link from "next/link";

import type { Entry } from "lib/writing";

export default function TheNightTheCameraWasRight() {
  return (
    <>
      <p>
        Somebody had brought a camera. They&rsquo;d brought it before;
        they&rsquo;d been bringing it for a year. Most of those photos
        ended up on a hard drive nobody opened. The kata was for the
        room, not the lens.
      </p>
      <p>
        That night the room was wet grass, the dark was the kind that
        smells of cut hay, and the kata was a basic four-petal flower
        I&rsquo;d been practising for six months. Twenty-five seconds
        on the shutter, ISO 200, f/8. They held still. I held the line.
      </p>
      <p>
        Back at the laptop the petals weren&rsquo;t soft. They were
        edges. The body had blurred itself out of the frame like a
        good cinematographer. The arcs that had been air five minutes
        ago were object now. You could measure them. You could count
        the strands of the cord by the fanned ridges where the weight
        had moved fastest.
      </p>
      <p>
        I sat in the kitchen at three in the morning and looked at the
        back of the camera for an hour without changing the frame. The
        practice had been a dance up to that point. It became a
        record-making discipline by sunrise. I went back to{" "}
        <Link
          href="/practice"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          the petals
        </Link>{" "}
        the next evening with a notebook.
      </p>
      <p>
        That night is the hinge. Everything since &mdash; the
        programmable rigs, the print pipeline, the objects with the
        waveguides &mdash; is a refinement of what the camera answered
        on that grass. The body wrote a sentence; the camera held the
        sentence; the studio is the room the sentences hang in now.
      </p>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry =   {
    slug: "the-night-the-camera-was-right",
    title: "The Night the Camera Was Right",
    date: "2017-09-22",
    kind: "journal",
    excerpt:
      "The hinge night. The first long exposure that came back as object rather than as snapshot. Twenty-five seconds, wet grass, no idea yet what it meant.",
    Body: TheNightTheCameraWasRight,
    related: [
      {
        href: "/journal/the-question-the-camera-answered",
        label: "The Question the Camera Answered",
        note: "The reflection piece that grew out of this night.",
      },
      {
        href: "/practice",
        label: "Practice — Stage II, long exposure",
      },
      {
        href: "/photographs",
        label: "Photographs — what the camera has been holding ever since",
      },
    ],
  };
