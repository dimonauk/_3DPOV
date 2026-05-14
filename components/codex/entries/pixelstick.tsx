export default function Pixelstick() {
  return (
    <>
      <p>
        The Pixelstick is a 200-LED persistence-of-vision wand
        designed and sold by Bitbanger Labs, a small New York
        electronics outfit, introduced via Kickstarter in 2014. It is
        the most widely-recognised commercial implementation of a
        light-painting POV array and the device that introduced the
        technique to a non-electronics-engineering audience.<sup>1</sup>
      </p>
      <p>
        The technical specifics:
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>LED count:</strong> 200, in a single line along a
          1.83m (6ft) aluminium-and-acrylic bar
        </li>
        <li>
          <strong>Brightness:</strong> rated 2400 lumens; saturated
          enough to read against most ambient-light conditions short
          of bright sunlight
        </li>
        <li>
          <strong>Image source:</strong> SD card containing BMP files;
          the LEDs render one vertical line of the image at a time as
          the wand is walked through frame
        </li>
        <li>
          <strong>Synchronisation:</strong> time-based; the user
          selects an exposure time and the device draws the image at
          a fixed rate within it
        </li>
        <li>
          <strong>Battery:</strong> internal lithium pack, ~2 hour
          working life per charge
        </li>
        <li>
          <strong>Image limit:</strong> 200 pixels of vertical
          resolution (matching the LED count); horizontal resolution
          is whatever the timing budget allows
        </li>
      </ul>
      <p>
        What the Pixelstick does well:
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>Out-of-the-box usability.</strong> The hardware
          works; the software is BMP-on-SD-card simple; the device
          ships with a charger and a strap. Anyone who can hold a
          camera open for 30 seconds can produce a light-painting
          result the same evening they unbox it.
        </li>
        <li>
          <strong>Community.</strong> A decade of working artists
          (notably Reuben Wu in the landscape genre) have published
          technique notes, BMP libraries, and behind-the-scenes
          footage. The learning curve is well-documented.<sup>2</sup>
        </li>
        <li>
          <strong>The form factor.</strong> 6ft / 200 LEDs is a
          deliberate size: long enough that walking it gives a usable
          horizontal resolution, light enough to be held one-handed
          for a steady walk, bright enough to register against most
          conditions.
        </li>
      </ul>
      <p>
        What the Pixelstick doesn&rsquo;t do, and where bespoke rigs
        take over:
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>Rotational synchronisation.</strong> The Pixelstick
          is designed to be walked, not spun. For rotational rigs the
          studio uses for circular geometries, a Hall-effect-synced
          custom rig produces a registered image; the time-based
          Pixelstick produces a smear.
        </li>
        <li>
          <strong>Programmable colour over the exposure.</strong> The
          Pixelstick reads a static image; the rig draws it once. For
          gestures whose meaning is in the colour change over time
          (an LED that warms as the kata progresses), the device has
          no native idiom.
        </li>
        <li>
          <strong>Custom firmware.</strong> The Pixelstick&rsquo;s
          firmware is closed-source and not user-modifiable. The
          studio&rsquo;s firmware-level synchronisation work
          (sub-frame-accurate timing for very fast captures) requires
          custom-hardware rigs.
        </li>
      </ul>
      <p>
        Holo-Flow Studio owns a Pixelstick; it is used as a reference
        instrument for technique pieces and for the rare commission
        where the client specifically wants a Pixelstick aesthetic. The
        studio&rsquo;s primary instruments are bespoke Teensy + TLC5927
        rigs. See{" "}
        <strong>
          <a
            href="/codex/pov-led-array"
            className="text-pink-200 underline underline-offset-4"
          >
            POV LED array
          </a>
        </strong>{" "}
        for the studio rigs and{" "}
        <strong>
          <a
            href="/articles/why-i-build-my-own-rigs"
            className="text-pink-200 underline underline-offset-4"
          >
            Why I Build My Own Rigs
          </a>
        </strong>{" "}
        for the full argument with the commercial route.
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The 2014 Kickstarter raised $625,000 against a $110,000 goal
          and ran on a timeline only slightly behind the typical
          successful electronics Kickstarter, which is to say it
          shipped only a year late. Bitbanger Labs has continued
          producing and supporting it since.
        </li>
        <li>
          Reuben Wu&rsquo;s Lux Noctis series &mdash; the
          mountain-and-desert landscapes lit by a hovering Pixelstick
          held by drone overhead &mdash; is the most influential
          single body of Pixelstick work. The visual idiom of those
          images is now widely referenced beyond its original site.
        </li>
      </ol>
    </>
  );
}
