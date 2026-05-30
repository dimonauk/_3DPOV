import Link from "next/link";

import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";
const arrow = (
  <span className="ml-0.5 text-chrome-500">&nearr;</span>
);

export default function YourFirstFpvDroneFlight() {
  return (
    <>
      <p>
        Most people who buy an FPV drone crash it within the first
        thirty seconds. That is not a defect of pilot or
        equipment; that is the contract you sign when you put
        goggles on and pretend you have wings. The crash is fine.
        The crash, in a field, with a 30g indoor whoop, is
        precisely the thing this tutorial is designed to deliver.
      </p>
      <p>
        I came late to FPV. The studio uses five airframes now,
        but my first hover was three years ago in a back garden in
        Salford with a Tinyhawk and a heart rate of about 130. The
        tutorial below is the version I wish I had read that
        afternoon. It will take you a weekend, a £150 starter kit,
        and one paid hour with the Civil Aviation Authority's
        registration page.
      </p>

      <p>
        <strong>What you are making.</strong> A safe, legal,
        controlled first hover, a controlled first orbit, and a
        controlled first landing &mdash; all in a single
        afternoon, all with the regulatory layer in place so
        you're not flying on the wrong side of the law.
      </p>

      <p>
        <strong>The UK regulatory layer (do this first).</strong>
      </p>
      <p>
        If your drone weighs 250g or more, OR has a camera (which
        any FPV drone does), you need both an{" "}
        <strong>Operator ID</strong> and a{" "}
        <strong>Flyer ID</strong> from the{" "}
        <a
          href="https://www.caa.co.uk/drones/"
          target="_blank"
          rel="noopener noreferrer"
          className={ext}
        >
          UK CAA{arrow}
        </a>
        . The Operator ID is £10/year. The Flyer ID is free but
        requires passing a forty-question multiple-choice test
        online. Total time: about an hour. Do this BEFORE you
        buy the drone, not after &mdash; the test forces you to
        learn the rules, which is the point.
      </p>
      <p>
        For sub-250g indoor whoops (Tinyhawk, Mobula 6) flown in
        your own garden or indoors, you can technically fly
        without registration, but the CAA's recommendation is to
        register anyway. The studio recommends registering. The
        £10 is the cheapest hour of pilot education you will
        ever pay for. The studio's atelier toy at{" "}
        <Link href="/atelier/caa-flight-permission" className={ext}>
          /atelier/caa-flight-permission
        </Link>{" "}
        (in preparation) walks the decision tree for you.
      </p>

      <p>
        <strong>The kit, for under £200.</strong>
      </p>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
        <li>
          <a
            href="https://emax-usa.com/collections/tinyhawk"
            target="_blank"
            rel="noopener noreferrer"
            className={ext}
          >
            EMAX Tinyhawk 3{arrow}
          </a>{" "}
          (or comparable: Mobula 6, Beta65X). 30&ndash;40g, indoor-safe
          ducted whoop. £80&ndash;120 ready-to-fly.
        </li>
        <li>
          A pair of analogue FPV goggles &mdash; Skyzone Cobra X
          or EMAX Transporter 2 in the budget bracket
          (£100&ndash;180). Avoid digital (DJI O3, HDZero) for the
          first kit; you'll learn the latency-tolerant signal
          chain.
        </li>
        <li>
          A controller &mdash; the Tinyhawk RTF kit usually
          includes one. If buying separately, the Radiomaster
          Pocket is £60 and will last you through five drones.
        </li>
        <li>
          Three or four LiPo batteries (450&ndash;750mAh 1S for the
          whoop class). A charger that takes them. About £40 for
          a multi-bay charger and a stack of batteries.
        </li>
        <li>
          A field. The studio recommends an empty playing field,
          a back garden over 5m square, or an empty hall. Not a
          park with dogs in it. Not a beach with people in it.
          Not within 50m of a person who hasn't consented.
        </li>
      </ul>

      <p>
        <strong>Mode 1 vs Mode 2.</strong>
      </p>
      <p>
        Your controller has two sticks. There are two common
        layouts: <em>Mode 2</em> (throttle on the left, aileron on
        the right) and <em>Mode 1</em> (throttle on the right,
        aileron on the left). Mode 2 is the international
        default; pick Mode 2 unless you have a strong reason. Once
        muscle memory locks in, switching is painful. The studio's
        atelier toy at{" "}
        <Link href="/atelier/stick-modes" className={ext}>
          /atelier/stick-modes
        </Link>{" "}
        (in preparation) shows the four stick layouts side-by-side.
      </p>

      <p>
        <strong>Angle, Horizon, Acro, Manual.</strong>
      </p>
      <p>
        Four flight modes, in order of forgiveness:
      </p>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
        <li>
          <strong>Angle</strong>: release the stick and the drone
          levels itself. Limited bank angle (about 35&deg;).
          Forgiving. Where you start.
        </li>
        <li>
          <strong>Horizon</strong>: like Angle but with no bank
          limit. Self-levels, but you can flip. The intermediate
          register.
        </li>
        <li>
          <strong>Acro</strong>: no self-levelling. The drone
          stays at whatever attitude you put it in. Where FPV
          actually lives. Unforgiving on day one.
        </li>
        <li>
          <strong>Manual</strong>: like Acro, with no
          rate-limiting. Hardware-fast. Months in.
        </li>
      </ul>
      <p>
        Spend the first three sessions in Angle. Move to Horizon
        when you can fly a slow figure-eight without panic. Move
        to Acro when you can land softly and consistently. Move
        to Manual when there is a specific reason.
      </p>

      <p>
        <strong>The first hover.</strong>
      </p>
      <p>
        Outdoor, calm day, no wind above 8mph. Stand 3m from the
        drone. Battery in, drone on a flat patch of grass.
        Goggles up &mdash; you will see the goggles' on-screen
        display before the camera view; that's normal. Arm the
        drone (switch up). Slowly, slowly, slowly increase
        throttle. The drone will twitch as the props bite, then
        rise.
      </p>
      <p>
        Hover at chest height. Six seconds. Land &mdash; pull
        throttle gently down, the drone settles. Disarm. Breathe.
        That is your first flight.
      </p>
      <p>
        Repeat that hover ten times. Then a 1m forward, hover,
        1m back, land. Then a square pattern at chest height,
        each corner a deliberate stop. Then a slow yaw turn while
        hovering.
      </p>

      <p>
        <strong>The first crash.</strong>
      </p>
      <p>
        Will happen in the first afternoon. Will be your fault.
        Will not break the drone &mdash; whoops are built for
        this. Pick the drone up, check the props, fly again.
        Crashing is the curriculum.
      </p>

      <p>
        <strong>Common faults.</strong>
      </p>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-chrome-300">
        <li>
          <strong>Drone tips on take-off.</strong> Throttle was
          too gentle &mdash; the props bit unevenly. Throttle
          decisively past the threshold; don't creep.
        </li>
        <li>
          <strong>Drone drifts despite no stick input.</strong>{" "}
          Wind, or the gyro needs calibrating. Land, recalibrate
          on flat ground (controller's gyro-cal switch), retry.
        </li>
        <li>
          <strong>Video glitches.</strong> Goggle channel
          conflicts with another flier. Switch channels.
        </li>
        <li>
          <strong>Goggles make you queasy.</strong> Normal.
          Take them off, ground yourself, try again with shorter
          sessions. The brain acclimatises.
        </li>
      </ul>

      <p>
        <strong>Without scrolling:</strong> what's the difference
        between Angle mode and Acro mode, and which one are you
        flying for your first ten sessions?
      </p>

      <p>
        <strong>What next.</strong> Once Angle-mode hover and
        figure-eight are confident, the next rung is{" "}
        <Link href="/tutorials/capturing-360-with-the-avata" className={ext}>
          capturing 360 with the Avata
        </Link>{" "}
        &mdash; the studio's primary commission airframe. The
        question that rung opens with is: <em>once you can fly
        the path, how do you make sure the camera holds the
        shot?</em>
      </p>
      <p>
        Pick a weekend. Saturday afternoon for paperwork (CAA
        registration + test). Sunday afternoon for hover practice.
        Set the intention now.
      </p>
    </>
  );
}

export const entry: Entry = {
  slug: "your-first-fpv-drone-flight",
  title: "Your First FPV Drone Flight",
  date: "2026-05-26",
  kind: "tutorial",
  excerpt:
    "UK CAA registration, op-id, where to fly legally, the controller stick map, first hover, first orbit, landing intact. The honest weekend.",
  Body: YourFirstFpvDroneFlight,
  related: [
    {
      href: "/atelier/caa-flight-permission",
      label: "Atelier — CAA Flight Permission decision tree (in preparation)",
      note: "Decide if you need Operator ID + Flyer ID for the flight you're planning. Updated against current CAA rules.",
    },
    {
      href: "/atelier/stick-modes",
      label: "Atelier — Stick Modes (in preparation)",
      note: "Four stick layouts side by side, with stick input mapped to drone response.",
    },
    {
      href: "/journal/first-light",
      label: "Journal — First Light",
      note: "Field record of the studio's first LED-modified airframe flight.",
    },
    {
      href: "/tutorials/capturing-360-with-the-avata",
      label: "Tutorial — Capturing 360 with the Avata",
      note: "The next rung. From hover to a controlled fly-through.",
    },
  ],
  furtherReading: [
    {
      href: "https://www.caa.co.uk/drones/",
      label: "UK CAA — Flying remotely piloted aircraft",
      note: "The authoritative source. Read in full before purchase.",
    },
    {
      href: "https://www.dronepilotacademy.co.uk/product/fpv-introduction-course/",
      label: "Drone Pilot Academy — FPV Introduction Course",
      note: "Paid UK-specific FPV intro. Useful if you want a structured curriculum after this rung.",
    },
    {
      href: "https://www.uavhub.com/pages/drone-training-course",
      label: "UAVHub — CAA Drone Course",
      note: "The certification path (A2 CofC, GVC) for commercial work.",
    },
    {
      href: "https://betaflight.com/",
      label: "BetaFlight — official site",
      note: "Open-source FPV firmware. Once you're past the RTF stage, this is where the tuning happens.",
    },
    {
      href: "https://emax-usa.com/collections/tinyhawk",
      label: "EMAX Tinyhawk — official",
      note: "The studio's recommended starter airframe. Read the spec sheet before ordering.",
    },
  ],
};
