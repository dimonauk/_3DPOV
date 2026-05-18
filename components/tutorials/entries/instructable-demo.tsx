import type { Entry } from "lib/writing";
import { buildInstructable } from "lib/tutorials/build";

/**
 * Demo entry exercising the full `InstructableMeta` surface — used to
 * verify the renderer end-to-end. The narrative covers the studio's
 * actual first-frame poi-painting workflow: rig on the wrist, camera
 * on the tripod, dark patch of garden, one usable frame.
 */
function InstructableDemoBody() {
  return (
    <>
      <p>
        The first time you draw a frame in the air with a programmed
        rig, the photograph that comes back will not look like the
        animation you loaded onto it. It will look like a smear with a
        suggestion of shape. The Princess assures you this is normal.
        Everyone who has ever done this has stood in the dark, peered
        at the back of a camera, and felt mildly betrayed by the laws
        of optics.
      </p>
      <p>
        What follows is the end-to-end sequence for getting your first
        usable frame. Build below covers the supplies, the steps, the
        bit where the picture goes wrong, and a couple of obvious
        places to take the practice once the first frame is in the bag.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "first-poi-painting-frame-end-to-end",
  title: "Your first POI-painting frame, end to end",
  date: "2026-05-18",
  kind: "tutorial",
  excerpt:
    "Rig on the wrist, camera on the tripod, dark patch of garden, one usable frame. The whole loop from box-open to keeper.",
  Body: InstructableDemoBody,
  related: [
    {
      href: "/tutorials/your-first-long-exposure",
      label: "Tutorial — Your first long-exposure light painting",
      note: "The grandparent of this technique. Read first if you've never held a shutter open.",
    },
    {
      href: "/tutorials/building-a-pov-led-rig",
      label: "Tutorial — Building a POV LED rig",
      note: "The hardware side. Where this rig comes from.",
    },
    {
      href: "/tutorials/programming-pov-frames",
      label: "Tutorial — Programming POV frames",
      note: "How the bitmap on the rig becomes the frame in the air.",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    time: "an evening, plus an afternoon to charge batteries",
    difficulty: "intermediate",
    cost: "£0 if you already own the rig; otherwise £80-£200 of LEDs and microcontrollers",
    supplies: {
      materials: [
        {
          name: "A programmed POV rig",
          note: "Wrist-mounted, four-strip minimum. Built or bought.",
        },
        {
          name: "A charged battery for the rig",
          note: "Two if you can spare it; cold nights eat capacity.",
        },
        {
          name: "A single test frame loaded onto the rig",
          note: "Keep it simple — a coloured stripe, a circle, your initials.",
        },
      ],
      tools: [
        {
          name: "A camera with manual shutter",
          note: "DSLR, mirrorless, or a phone with a 15-second long-exposure mode.",
        },
        {
          name: "A sturdy tripod",
          note: "Anything that holds the camera still for thirty seconds.",
        },
        {
          name: "A small torch",
          isOptional: true,
          note: "For setting focus on the spot where you will be standing.",
        },
      ],
    },
    steps: [
      {
        title: "Charge everything the day before",
        body: "Rig battery, camera battery, torch. Cold weather will halve the runtime of anything lithium-ion, and you do not want to find this out in the dark.\n\nIf the rig charges over USB, check the charge LED before you leave the house. Half-charged is enough for one frame; it is not enough for the inevitable re-shoots.",
      },
      {
        title: "Find a dark spot",
        body: "Back garden after midnight is fine for a first frame. The darker the better — streetlights and house windows will appear in the photograph as bright dots and pull the eye away from your trace.\n\nMatte ground is kinder than reflective ground. Grass, gravel, or dry concrete all work. Wet tarmac will mirror the rig back at the camera and double the trace.",
      },
      {
        title: "Set up the camera",
        body: "Tripod first, then frame the scene with a test shot at high ISO so you can see the area you are pointing at. Lock the composition before you switch modes.\n\nSwitch to manual. Shutter 15 seconds. ISO 200. Aperture f/8. Focus by torchlight on the spot where you will be standing, then flip the lens to manual focus so the camera does not hunt during the exposure.",
      },
      {
        title: "Mark your line",
        body: "Stand on the spot. Decide where the rig will start, where it will sweep through, and where it will stop. The camera records the trace in the air, not your feet — but if your feet drift, the trace drifts with them.\n\nWalk the path once with the rig off. The body remembers gestures more accurately than the brain does.",
      },
      {
        title: "Hit the shutter and walk the frame",
        body: "Press the shutter, count to two, switch the rig on, walk through your path at a steady pace, switch the rig off, walk out of frame. The shutter closes on its own at fifteen seconds.\n\nSpeed matters more than you expect. Too fast and the frame compresses into a smear; too slow and it stretches into a streak. Aim for a walking pace at first.",
      },
      {
        title: "Look at the back of the camera and adjust",
        body: "The first frame will be too bright, too dim, or geometrically nothing like what you loaded. This is fine. Look at what came back and reason backwards.\n\nToo bright: walk faster, drop the rig brightness, or close the aperture. Too dim: walk slower, raise the brightness, open the aperture. Shape wrong: it is almost always walking speed, not the bitmap. Try again.",
      },
    ],
    finalResult:
      "One photograph with a recognisable frame floating in the dark — the bitmap you loaded onto the rig, redrawn at full size in air, held by a fifteen-second shutter. It will not be your best frame. It will be the one that proves the loop works end to end, and every subsequent frame is a refinement of this one.",
    variations: [
      "Swap the wrist rig for a longer staff and walk a wider arc — the same bitmap will read at twice the scale and twice the drama.",
      "Programme a short animation (eight frames, one per second) and walk the same path eight times with the shutter open for two minutes — the camera will composite the sequence into one image with eight ghosted versions of the frame.",
    ],
    troubleshooting: [
      {
        symptom: "The trace is a smudge with no readable shape",
        cause:
          "Walking speed is uneven, or the rig is being twisted as you walk so the bitmap is not pointing at the camera the whole time.",
        fix: "Slow down. Keep the rig perpendicular to the camera line. Practise the gesture once with the rig off so the body knows the path.",
      },
      {
        symptom: "The colours look washed-out compared to the bitmap",
        cause:
          "Aperture too open, or the rig is too close to the camera and overexposing on the sensor.",
        fix: "Close the aperture by a stop (f/8 → f/11) and step further from the lens. Re-shoot. If still washed-out, drop the rig's brightness setting.",
      },
    ],
  },
  base,
);
