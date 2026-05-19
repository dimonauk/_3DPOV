/**
 * app/atelier/webxr-retroarch/page.tsx — Server entry for the WebXR
 * RetroArch room.
 *
 * Direction (Dimona, 2026-05-19): "wire them up to the emulation system
 * and start building out the webxr retroarch.... github the source
 * code and build". The room is the OSS-device-GLBs' first home — the
 * console on the table, the controller in the player's hand, the CRT
 * TV opposite, the libretro core running through EmulatorJS, a ROM
 * the visitor brought from their own disk.
 */

import Link from "next/link";

import Footer from "components/layout/footer";
import { IssueBand } from "components/luxe/IssueBand";

import RetroArchClient from "./retroarch-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "WebXR RetroArch — the virtual game room",
  description:
    "A virtual living room with a CRT TV, a console on a side table, and a controller in your hand. Bring your own ROM; the libretro core runs in your browser; the picture lands on the TV in stereo.",
};

export default function WebXRRetroArchPage() {
  return (
    <>
      <IssueBand
        label="ATELIER"
        issue="ISSUE 06"
        date="MAY 2026"
        publisher="WEBXR RETROARCH"
      />

      <article className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <div className="chrome-label">Atelier &middot; WebXR RetroArch</div>
        <h1 className="mt-4 text-5xl leading-[0.95] md:text-6xl">
          A room with a CRT
          <br />
          and a controller.
        </h1>
        <p className="mt-6 max-w-2xl text-chrome-200">
          Stand in front of a virtual television. The console you grew
          up with is on the side table. Bring the ROM from your own
          shelf; the WASM core runs in this tab; the picture lands on
          the TV in stereo. The studio doesn&rsquo;t host ROMs, and the
          bytes never leave your device.
        </p>
        <p className="mt-4 max-w-2xl text-chrome-300">
          The room composes around{" "}
          <a
            href="https://emulatorjs.org/"
            className="text-pink-200 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            EmulatorJS
          </a>
          {" "}— the same browser-side libretro front-end the studio
          already uses on /emulator. The new piece is the bridge: the
          EmulatorJS canvas is wrapped in a Three.js{" "}
          <code className="font-mono text-chrome-100">CanvasTexture</code>
          {" "}and painted onto the TV&rsquo;s screen plane. Inside a
          WebXR session the XR controllers drive the libretro input
          surface; outside a session the keyboard does.
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-xs text-chrome-300">
          <Link
            href="/atelier"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            &larr; atelier
          </Link>
          <Link
            href="/emulator"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            /emulator (2D index)
          </Link>
          <Link
            href="/tutorials/wiring-the-webxr-retroarch-room"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
          >
            tutorial &mdash; wiring the room
          </Link>
          <a
            href="https://github.com/dimonauk/_3DPOV/blob/claude/skeleton-build/docs/WEBXR-RETROARCH.md"
            className="rounded-sm border border-warm-black-800 px-3 py-1 hover:border-pink-200/60 hover:text-pink-200"
            target="_blank"
            rel="noopener noreferrer"
          >
            doc &mdash; WEBXR-RETROARCH.md
          </a>
        </div>

        <div className="mt-12">
          <RetroArchClient />
        </div>

        <section className="mt-12 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8 text-sm text-chrome-300">
          <div className="chrome-label">What you are looking at</div>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <span className="text-chrome-100">CRT TV</span> &mdash; a
              stylised primitive chassis with two dial knobs on the
              right and a screen plane on the front face. The picture
              is the EmulatorJS canvas, uploaded to the GPU each frame.
            </li>
            <li>
              <span className="text-chrome-100">Side table</span>
              {" "}&mdash; thin chrome slab on four thin legs. The
              chosen console sits on top.
            </li>
            <li>
              <span className="text-chrome-100">Console body</span>
              {" "}&mdash; rendered from{" "}
              <code className="font-mono text-chrome-100">
                lib/devices/catalogue.ts
              </code>
              . If the GLB hasn&rsquo;t landed on disk yet, a category-
              tinted primitive stands in.
            </li>
            <li>
              <span className="text-chrome-100">Controller</span>
              {" "}&mdash; on the table for now. In a future pass it
              attaches to the XR{" "}
              <code className="font-mono text-chrome-100">gripSpace</code>
              {" "}so it appears in the visitor&rsquo;s actual hand.
            </li>
            <li>
              <span className="text-chrome-100">Lights</span> &mdash;
              three-light setup with a warm tungsten key, a cool fill,
              and a pink-200 rim. The TV adds a soft point light to fake
              the CRT glow into the room.
            </li>
          </ul>
        </section>

        <section className="mt-8 rounded-sm border border-warm-black-800 bg-warm-black-900/30 p-8 text-sm text-chrome-300">
          <div className="chrome-label">Privacy</div>
          <p className="mt-3">
            The studio doesn&rsquo;t host ROMs or BIOS files. The
            file-picker uses an{" "}
            <code className="font-mono text-chrome-100">
              URL.createObjectURL
            </code>
            {" "}so the bytes stay client-side; nothing uploads. Same
            pattern as the existing{" "}
            <Link href="/emulator" className="underline">
              /emulator
            </Link>{" "}
            surface.
          </p>
        </section>
      </article>
      <Footer />
    </>
  );
}
