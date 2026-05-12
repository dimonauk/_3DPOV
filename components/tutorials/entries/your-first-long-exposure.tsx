import Link from "next/link";

export default function YourFirstLongExposure() {
  return (
    <>
      <p>
        Long-exposure{" "}
        <a
          href="https://en.wikipedia.org/wiki/Light_painting"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          light painting<span className="ml-0.5 text-chrome-500">&nearr;</span>
        </a>{" "}
        is the simplest photographic discipline that consistently
        surprises people. You need a camera that supports manual
        exposure, a tripod, a dark place, and a source of moving light.
        The rest is patience and a little practice. The image quality
        of your phone screen has improved over the last decade; the
        technique has not changed since the{" "}
        <a
          href="https://en.wikipedia.org/wiki/%C3%89tienne-Jules_Marey"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          first wire-and-bulb experiments<span className="ml-0.5 text-chrome-500">&nearr;</span>
        </a>{" "}
        more than a century ago.
      </p>
      <p>This is how you take your first one.</p>

      <p>
        <strong>Pick the camera.</strong> Anything with a manual
        shutter mode will work. A DSLR, a mirrorless body, even a
        recent phone with a long-exposure mode. The shutter needs to
        stay open for between five and thirty seconds. ISO low &mdash;
        100 to 400. Aperture around f/8 &mdash; small enough that
        depth of field is generous, large enough that the light
        source still records. Focus on the spot where the light will
        be, then switch to manual focus so the camera does not hunt
        during the exposure.
      </p>

      <p>
        <strong>Pick the place.</strong> As dark as you can manage.
        Rural sites are best, but a quiet back garden after midnight
        works. Streetlights and house windows will appear in the
        photograph as bright dots if they are in the frame; either
        compose them out or live with them as a record of the
        location. Cloudy nights are forgiving for first attempts;
        clear nights with stars are harder, because the stars will
        streak during a thirty-second exposure.
      </p>

      <p>
        <strong>Pick the tool.</strong> For your first photograph, use
        the brightest small light source you can hold safely. A small
        torch, an LED bike light, a cheap RGB wand. Avoid open flame
        unless you know what you are doing &mdash;{" "}
        <Link
          href="/practice"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          fire poi
        </Link>{" "}
        look spectacular, but they require{" "}
        <a
          href="https://en.wikipedia.org/wiki/Fire_performance"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          training, fuel handling, and a clear area<span className="ml-0.5 text-chrome-500">&nearr;</span>
        </a>
        . Save them for later.
      </p>

      <p>
        <strong>Set the camera up.</strong> Tripod first. Frame the
        scene with a test shot at high ISO so you can see what you
        are pointing at. Once the frame is right, switch the camera
        to its manual mode, set the shutter to 15 seconds, ISO 200,
        aperture f/8. Set the focus by torchlight on the spot where
        you will be standing, then lock it to manual.
      </p>

      <p>
        <strong>Take the picture.</strong> Hit the shutter. Walk into
        the frame. Draw the light through the air &mdash; slow,
        curved, deliberate. Try to keep the light source pointing
        roughly at the camera; the photograph will only record what
        the camera can see. After fifteen seconds the shutter closes.
        Walk out of the frame and look at the back of the camera.
      </p>

      <p>
        The first photograph will be too bright, too dim, or both.
        Adjust: brighter light or longer shutter, dimmer light or
        shorter shutter. Try again. After a few exposures the
        relationship between your speed, the shutter time, and the
        brightness of the trace will start to make sense.
      </p>

      <p>
        <strong>Move on.</strong> Once you can draw a steady line,
        try drawing something with shape &mdash; a circle, a
        figure-eight, a letter. The trace is your gesture made
        visible. Whatever the body does in fifteen seconds, the
        camera holds.
      </p>

      <p>
        After that, the{" "}
        <Link
          href="/practice"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          practice opens out
        </Link>
        . Multiple lights, multiple performers, programmed rigs,{" "}
        <Link
          href="/aerial"
          className="underline underline-offset-4 hover:text-pink-200"
        >
          drone-mounted sources
        </Link>
        , fire poi after proper training. But the first photograph is
        always the same: shutter open, light moves, light stops,
        shutter closes, picture appears.
      </p>

      <p>
        That is the discipline. Everything else is a refinement of it.
      </p>
    </>
  );
}
