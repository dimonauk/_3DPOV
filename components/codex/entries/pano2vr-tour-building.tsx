export default function PanoTwoVrTourBuilding() {
  return (
    <>
      <p>
        Pano2VR is the long-survivor of the desktop virtual-tour
        tools. Garden Gnome Software has maintained it continuously
        since 2007 &mdash; remarkable longevity in a field where tools
        generally last three to five years before either being
        acquired into oblivion or pivoting into something nobody asked
        for.<sup>1</sup>
      </p>
      <p>
        The 2017 tutorial walked through a two-node tour: two
        equirectangular 360° images, joined by clickable hotspots that
        move the viewer between them. The same workflow works today,
        with the following adjustments:
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          The interface has been redesigned twice. The panel system
          the 2017 article described (Properties, Viewing Parameters,
          etc.) is still there but rearranged.
        </li>
        <li>
          HTML5 output now includes WebVR / WebXR support, so the tour
          can be viewed in a Quest or Vision Pro browser as well as
          desktop.
        </li>
        <li>
          Skin templates have been expanded; the default skin is now
          competently designed (it was, in 2017, accurate-to-call
          ugly).
        </li>
      </ul>

      <h3 className="mt-10 mb-3 text-xl text-chrome-100">Updated workflow</h3>
      <ol className="ml-6 list-decimal space-y-3">
        <li>
          <strong>New Project</strong>, open a panoramic image (your
          &ldquo;node&rdquo;).
        </li>
        <li>
          Drag additional 360° images onto the Tour Browser panel to
          add more nodes.
        </li>
        <li>
          <strong>Add hotspots</strong> by double-clicking on the
          desired position in the central window. Set the hotspot type
          to <strong>Tour Node</strong>, link to the destination
          image. Repeat in reverse for the return path.
        </li>
        <li>
          <strong>Patching</strong> (removing the tripod from the
          nadir): double-click and drag the patch frame to the
          offending area, export to Photoshop or similar, edit, save.
          Pano2VR re-imports automatically.
        </li>
        <li>
          <strong>Export</strong> &rarr; HTML5 &rarr; choose folder
          &rarr; select skin &rarr; check{" "}
          <strong>WebVR / WebXR</strong> if you want headset support
          &rarr; click the gear button to render.
        </li>
      </ol>
      <p>
        The tour opens in a browser; on supported headsets, the user
        can enter immersive mode with a button click.
      </p>

      <h3 className="mt-10 mb-3 text-xl text-chrome-100">
        Alternatives worth knowing
      </h3>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>Marzipano</strong> (free, open-source) &mdash;
          Google-engineered, runs in any modern browser, no desktop
          installer. Edit JSON files by hand. Steeper learning curve,
          ceiling-less customisation.
        </li>
        <li>
          <strong>Kuula</strong> (browser-based SaaS) &mdash; hosting
          included, simple drag-and-drop tour creation, fee for
          commercial use.
        </li>
        <li>
          <strong>Matterport</strong> &mdash; at the commercial end.
          Their proprietary camera, their hosting, their pricing.
          Standard for property and architectural walkthroughs.
        </li>
      </ul>
      <p>
        Pano2VR remains the studio&rsquo;s pick when the deliverable
        needs to be self-hosted, fully styled, and survive its maker
        outliving its cloud subscription.
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The two-decade record is rare enough that Garden Gnome
          Software deserves a small monument. They have, against the
          run of play, simply kept developing the tool they said they
          would develop.
        </li>
      </ol>
    </>
  );
}
