"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * BezelScene — stub for the Bezel level (Solo 8).
 *
 * The level holds the clip-on POV bezel in software simulation: the
 * Quest 3 / Steam Frame controller, the same angular-sync firmware
 * the bench will ship on the physical product, all running in
 * JavaScript inside the headset browser.
 *
 * TODO: install @react-three/xr, mount <XRButton /> here, and wire
 * the controller's pose into the trail-line render the same way
 * MouseDrawSurface does for desktop. The clip-on bezel firmware port
 * (angular-sync indexing into a polar frame buffer) lives in
 * components/play/scenes/bezel-firmware.ts when that lands.
 */

export function BezelScene() {
  const [xrSupported, setXrSupported] = useState<null | boolean>(null);

  useEffect(() => {
    if (typeof navigator === "undefined") {
      setXrSupported(false);
      return;
    }
    setXrSupported("xr" in navigator);
  }, []);

  return (
    <div className="rounded-sm border border-warm-black-800 bg-warm-black-900/40 p-6">
      <div className="chrome-label mb-3 text-pink-200">
        Bezel level &middot; coming soon
      </div>
      <p className="mb-6 max-w-prose text-sm text-chrome-300">
        The clip-on bezel before the clip-on bezel ships. The
        controller in your hand pretends to be the rig the bench will
        post you next year; the angular-sync firmware runs in
        JavaScript and writes the same trail it will write on the
        physical product.
      </p>

      <div className="rounded-sm border border-warm-black-700 bg-[#0c0a12] p-5">
        <div className="chrome-label mb-2 text-chrome-500">
          Enter WebXR
        </div>
        <p className="text-sm text-chrome-200">
          {xrSupported === null
            ? "Checking your browser…"
            : xrSupported
              ? "WebXR detected. The session entry button lands once @react-three/xr is wired."
              : "WebXR not detected in this browser. The level needs a Quest 3 headset browser or Steam Frame."}
        </p>

        <button
          type="button"
          disabled
          className="mt-4 rounded-sm border border-warm-black-700 bg-warm-black-900/80 px-5 py-3 chrome-label text-chrome-500 opacity-60"
          aria-disabled
        >
          Enter WebXR &middot; install pending
        </button>

        <p className="mt-3 text-xs italic text-chrome-500">
          The XR install (@react-three/xr) is queued; this button is a
          contract for what lands, not a working entry.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Link
          href="/bezel"
          className="chrome-label rounded-sm border border-warm-black-700 bg-warm-black-900/60 px-4 py-3 text-chrome-300 underline-offset-4 hover:border-pink-200/40 hover:text-pink-200"
        >
          The bezel &mdash; interest list &rarr;
        </Link>
        <Link
          href="/articles/vr-pov-controllers-the-product"
          className="chrome-label rounded-sm border border-warm-black-700 bg-warm-black-900/60 px-4 py-3 text-chrome-300 underline-offset-4 hover:border-pink-200/40 hover:text-pink-200"
        >
          VR POV controllers &rarr;
        </Link>
      </div>
    </div>
  );
}
