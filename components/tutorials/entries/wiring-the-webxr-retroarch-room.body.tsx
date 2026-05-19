import Link from "next/link";

const ext = "underline underline-offset-4 hover:text-pink-200";

/**
 * Free-form body for the wiring-the-webxr-retroarch-room tutorial.
 * Split out from the main entry file so the entry stays under the
 * studio's 300-line per-file rule. Princess teaching register.
 */
export function WiringTheWebXRRetroArchRoomBody() {
  return (
    <>
      <p>
        The room exists because two systems on the site were a room
        without a roof. The first system was{" "}
        <Link href="/emulator" className={ext}>
          /emulator
        </Link>{" "}
        &mdash; the bring-your-own-ROM browser surface running EmulatorJS
        and twenty-three libretro WASM cores. The second was the device
        catalogue, the open-source console-and-controller GLBs the
        studio folded into{" "}
        <code>lib/devices/catalogue.ts</code> alongside an{" "}
        <Link href="/atelier/devices" className={ext}>
          /atelier/devices
        </Link>{" "}
        gallery. The first painted libretro pixels onto a flat web page.
        The second left the consoles standing on plinths in an empty
        gallery. Neither got to be a room. WebXR RetroArch is the room.
        The CRT holds the pixels. The table holds the console. The
        visitor&rsquo;s hands hold the controllers.
      </p>

      <p>
        This tutorial walks the bench-level wiring of the room. The
        Princess will set the framing here; the workshop-Dimona register
        carries the Instructable steps below. By the end of the
        afternoon you will have a scene where an XR controller routes
        into the libretro input layer, the EmulatorJS canvas paints onto
        the screen plane of a virtual CRT, and the visitor stands inside
        a small living room with the console they grew up with on the
        side table. The bridge that does the texture-passing is six
        lines. The bridge that does the input-passing is a per-system
        mapping registry plus a single edge-detected polling pass.
      </p>

      <h3>What the framework already gives you</h3>

      <p>
        Most of the work is in the monorepo before you begin.{" "}
        <code>SceneStage</code> is the dual-mode (WebXR + 2D) scene
        wrapper, documented at{" "}
        <Link href="/atelier/scene-stage-demo" className={ext}>
          /atelier/scene-stage-demo
        </Link>
        . The XR camera rig wires controller-thumbstick locomotion and
        the standard controller models without ceremony. EmulatorJS is
        loaded from its CDN by the existing{" "}
        <code>EmulatorJsEmbed</code> client component. The libretro
        button-index constants are facts about a public API; the
        per-system mapping registry lives at{" "}
        <code>lib/webxr-retroarch/input-mappings.ts</code> and the
        bridge that forwards the polled gamepad state into EmulatorJS
        is at <code>lib/webxr-retroarch/emulator-bridge.ts</code>.
      </p>

      <h3>The load-bearing trick &mdash; canvas to texture</h3>

      <p>The six lines of code the room is built around:</p>

      <pre className="font-mono">
{`const tex = new CanvasTexture(emulatorCanvas);
tex.minFilter = NearestFilter;
tex.magFilter = NearestFilter;
tex.generateMipmaps = false;
// each frame:
tex.needsUpdate = true;`}
      </pre>

      <p>
        EmulatorJS owns an HTMLCanvasElement that the libretro core
        paints into. Three.js&rsquo;s{" "}
        <code>CanvasTexture</code> wraps any DOM canvas and re-uploads
        it to the GPU when you flip <code>needsUpdate</code>. The
        nearest-filter pair keeps pixel art crisp instead of bilinear-
        smeared. The mipmap generation is off because it doesn&rsquo;t
        help nearest sampling and costs the upload an extra thirty
        per cent. The texture goes onto a{" "}
        <code>MeshBasicMaterial</code> &mdash; basic because lit
        materials recolour the framebuffer and emulator pixels look
        wrong under directional light.
      </p>

      <p>
        Performance cost measured on a Quest 3 against the studio&rsquo;s
        reference scene: about 1.1 ms per frame for a 256&times;240 NES
        framebuffer, 2.4 ms for a 640&times;480 PlayStation one. Both
        well inside the 11 ms / frame budget at 90 Hz. The rest of the
        scene is sparse &mdash; primitive geometry, three point lights,
        no post-processing &mdash; so the texture upload is the dominant
        per-frame cost. See{" "}
        <Link href="/docs/WEBXR-DEVICE-TARGETS" className={ext}>
          docs/WEBXR-DEVICE-TARGETS
        </Link>{" "}
        for the per-device budget.
      </p>

      <h3>The controller-mapping registry pattern</h3>

      <p>
        The other bridge is the input one. WebXR exposes controller
        gamepads through <code>navigator.getGamepads()</code> with{" "}
        <code>mapping === &quot;xr-standard&quot;</code> &mdash; same
        polling pass the studio&rsquo;s input router already uses.
        EmulatorJS exposes{" "}
        <code>
          EJS_emulator.gameManager.simulateInput(player, button, value)
        </code>{" "}
        once its loader has finished. The bridge ties the two together
        through a per-system mapping table. Edge-detected on the
        bridge side &mdash; only state transitions push, not every
        frame &mdash; so the EmulatorJS event queue stays clean.
      </p>

      <p>
        Adding a console mapping is a single entry. The pattern: per
        hand, decide which xr-standard button maps to which libretro
        button; per stick, decide D-pad or analogue. The Princess will
        not pretend the libretro convention is intuitive, but it is
        stable and public, and the mapping registry isolates the
        per-system quirks to one file.
      </p>

      <h3>Privacy &mdash; the same posture as /emulator</h3>

      <p>
        The studio does not host ROMs. The file picker uses{" "}
        <code>URL.createObjectURL</code> so the ROM bytes stay in the
        visitor&rsquo;s browser memory; the bytes are never sent to a
        server in the studio&rsquo;s stack. The same posture is in
        force at <Link href="/emulator" className={ext}>/emulator</Link>{" "}
        and is documented at{" "}
        <Link href="/articles/what-the-studio-wont-do" className={ext}>
          /articles/what-the-studio-wont-do
        </Link>
        . If your reader asks where the studio gets the ROMs from, the
        answer is: it doesn&rsquo;t. The visitor brings them from their
        own hardware dumps.
      </p>

      <h3>Honest limitations the tutorial does not paper over</h3>

      <p>
        Five disclaimers the Princess will not hide behind a marketing
        gloss. Save state across reloads is finicky inside WebXR
        sessions and is not currently exposed on the room (the 2D{" "}
        <code>/emulator</code> surface still has it). Multiplayer is
        not yet wired &mdash; one visitor, one controller, this pass.
        The controller GLB is on the table, not on the WebXR{" "}
        <code>gripSpace</code>, in this pass; the next pass attaches
        the period controller to the visitor&rsquo;s hand via a custom{" "}
        <code>controller</code> template on{" "}
        <code>createXRStore</code>. Vision Pro doesn&rsquo;t expose a
        persistent gamepad &mdash; it&rsquo;s pinch-and-release only
        through transient-pointer &mdash; so the XR-controller path is
        dark there; the room still renders in stereo, but input falls
        back to a paired Bluetooth keyboard. Haptics are not wired
        yet. The full list lives in{" "}
        <code>docs/WEBXR-RETROARCH.md</code> under{" "}
        <em>Limitations</em>; this tutorial is the how-do-I-do-it, the
        doc is the how-honest-is-it.
      </p>

      <p>
        The Test Chamber sheet below is the practical version of the
        above: the imports, the wiring, the eight steps the framework
        asks of a scene that wants to be the virtual game room.
      </p>
    </>
  );
}
