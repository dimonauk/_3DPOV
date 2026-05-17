import type { Entry } from "lib/writing";

export default function TheWeekBefore() {
  return (
    <>
      <p>
        The studio has been a workshop for a week. The drones are on
        the bench, all four of them. The Mavic 2 Pro with its airframe
        cover off, exposing the gimbal arm where the LED bar's mount
        will clamp. The two Neos, slimmer, mostly there for follow-
        cam work but possibly useful as backup if the Mavic refuses to
        carry the payload at full charge. The Avata 360, an FPV
        cinewhoop with an integrated 8K 360&deg; camera that nobody
        thought consumer drones would have for another five years and
        then DJI shipped in 2026.<sup>1</sup>
      </p>
      <p>
        The LED bar itself is the same instrument that has lived in
        the studio for three years. Ninety-six addressable LEDs, a
        Teensy 3.1 at the controller end, three TLC5927 drivers, a
        Hall sensor in the original chassis that I have now had to
        unsolder because the drone does not rotate around a fixed
        pivot. On a drone, the rotation reference becomes time, or
        becomes the drone's IMU, or becomes a problem to be solved by
        the next week of work.
      </p>
      <p>
        I have decided on time. For the first flights, anyway. The
        firmware now ticks the LED frames at 1 ms intervals regardless
        of where the airframe is in space. The choreography lives in
        the flight plan, not in the rig. The drone flies a programmed
        arc, the LEDs cycle through frames timed to match the arc,
        and the camera on the ground holds the shutter open through
        the whole pass. This is not the angle-sync philosophy the
        studio's handheld rigs run on. It is the necessary compromise
        the drone forces. Whether the photograph holds together at
        the precision I want is the question tonight will answer.
      </p>
      <p>
        The mount is 3D-printed PETG, two parts, designed to clamp to
        the Mavic's gimbal arm without obstructing the camera or the
        landing gear. Cable strain-relief on the power line. The bar
        sits a hundred millimetres below the airframe, which keeps it
        out of the prop wash, just. The total payload is 178 grams,
        which the Mavic can carry but which I am told will reduce its
        flight time by about a third. That gives me twelve minutes
        per battery. I have four batteries. I have not made a habit
        of flying on full charge.<sup>2</sup>
      </p>
      <p>
        Today: the bench-test. Power the drone on, hold it down, fire
        the LED sequence, watch the bar light through its programmed
        frames. Confirm the colour cycling is what I designed.
        Confirm the power draw doesn't dip the drone's logic supply
        below threshold. Confirm I have not, somewhere in the last
        week's hurry, miswired anything that will start a small fire
        in the air.
      </p>
      <p>
        Tomorrow: the flight. Field behind the studio, 22:00 onwards,
        no moon to speak of, cloud cover marginal but useful for
        backdrop &mdash; a clean black sky is too pure, and the
        trace floats wrong. The shoot plan is one revolution at
        twenty metres altitude, a single colour bar across the
        frame, fifteen-second exposure on the ground camera. If that
        one capture is clean, I move to programmed image data on the
        second flight. If the bar wobbles, or the trace stutters, I
        come back to the bench.
      </p>
      <p>
        I have not been this excited about a photograph in some
        years. I have also not been this nervous about one.
        Photographs the body draws are limited by the body. This
        one will not be.
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          For the record, the studio bought the Avata 360 the day
          stock came in, drove ninety minutes to collect it, and
          flew it for the first time before sunset that evening.
          Some pieces of consumer kit deserve enthusiasm. This is
          one of them.
        </li>
        <li>
          The first thing any drone pilot learns about LiPo
          batteries is that the cell sag at low charge will drop a
          working aircraft out of the sky faster than enthusiasm
          can compensate. The studio does not fly low-charge.
          Especially not with custom payload bolted on.
        </li>
      </ol>
    </>
  );
}

/**
 * Colocated entry record — see docs/ARTICLES_REGISTRY_SPLIT.md.
 */
export const entry: Entry =   {
    slug: "the-week-before",
    title: "The week before",
    date: "2026-05-13",
    kind: "journal",
    excerpt:
      "Pre-flight notes. The drone fleet on the bench, the time-sync firmware for first flights, tomorrow's shoot.",
    Body: TheWeekBefore,
  };
