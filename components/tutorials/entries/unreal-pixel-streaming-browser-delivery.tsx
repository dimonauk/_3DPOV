import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

function PixelStreamingBody() {
  return (
    <>
      <p>
        The studio runs on browser delivery. The WebXR Game Framework
        builds for the web; the Holoflow site delivers everything
        through the URL bar. Most of the studio&rsquo;s 3D work
        therefore needs to be reachable from a browser, no install,
        whatever the visitor&rsquo;s device. Unreal Engine builds for
        the desktop and for the headset, but not for the browser
        &mdash; with one exception. <strong>Pixel Streaming</strong>{" "}
        is the built-in UE plugin that runs an Unreal application on a
        bench-side machine, captures its render output, and streams
        the video + input loop to a browser tab over WebRTC. The
        browser tab plays back as if the user were sat at the bench.
      </p>

      <p>
        Pixel Streaming is the bridge between the studio&rsquo;s
        Unreal-rendered work (photogrammetry inspection, Nanite-grade
        archive scenes, anything that needs ray-tracing the browser
        can&rsquo;t do) and the WebXR-first delivery surface. The goal
        of this tutorial: take an Unreal 5.8 project, enable Pixel
        Streaming, run the signalling server, open the project in a
        browser tab on the same machine. An afternoon to first
        success; production deployment is a separate engineering
        problem covered in the Unreal docs.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "unreal-pixel-streaming-browser-delivery",
  title: "Unreal Pixel Streaming — deliver an Unreal scene to a browser tab",
  date: "2026-05-19",
  kind: "tutorial",
  excerpt:
    "An afternoon. Enable Pixel Streaming in an Unreal 5.8 project, launch the bundled signalling server, open the scene in a browser tab on the same machine over WebRTC. The bridge between Unreal-rendered work and the studio's browser-first delivery surface.",
  Body: PixelStreamingBody,
  related: [
    {
      href: "/articles/the-bench",
      label: "The Bench",
      note: "The wider studio stack Pixel Streaming sits in.",
    },
    {
      href: "/tutorials/blender-addon-modular-tree",
      label: "Tutorial — Modular Tree (Blender)",
      note: "Authoring the assets that end up inside the Unreal scene being streamed.",
    },
  ],
  furtherReading: [
    {
      href: "https://dev.epicgames.com/documentation/en-us/unreal-engine/pixel-streaming-in-unreal-engine",
      label: "Unreal — Pixel Streaming documentation",
      note: "Official authoritative reference for the plugin + signalling server.",
    },
    {
      href: "https://github.com/EpicGamesExt/PixelStreamingInfrastructure",
      label: "Pixel Streaming Infrastructure on GitHub",
      note: "The signalling + matchmaking server source, separate from the engine.",
    },
    {
      href: "https://dev.epicgames.com/documentation/en-us/unreal-engine/getting-started-with-pixel-streaming",
      label: "Unreal — Getting Started with Pixel Streaming",
      note: "Epic's first-run walkthrough; pair with this tutorial for the studio framing.",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    time: "an afternoon — 3-4 hours including first-run setup",
    difficulty: "intermediate",
    cost: "free — Pixel Streaming is bundled with Unreal Engine",
    prerequisites: [
      "Unreal Engine 5.7 or 5.8 installed (this bench has 5.8 at C:\\UE_5.8).",
      "A working Unreal project — the standard FirstPerson template is enough for first success.",
      "Node.js 18+ for the signalling server (PixelStreamingInfrastructure is a Node application).",
      "Comfortable opening a Windows terminal and editing a project's DefaultEngine.ini.",
    ],
    supplies: {
      tools: [
        {
          name: "An NVIDIA GPU with NVENC support",
          note: "Pixel Streaming encodes video on the GPU for low-latency delivery. Any RTX-class card has NVENC; the studio bench's 3080 Ti is comfortable. AMD support exists but is less battle-tested.",
        },
      ],
    },
    software: [
      {
        name: "Unreal Engine",
        version: "5.7 or 5.8",
        url: "https://www.unrealengine.com/en-US/download",
        cost: "free for non-game commercial use",
        platforms: ["windows", "macos"],
      },
      {
        name: "Node.js",
        version: "18+",
        url: "https://nodejs.org/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "Required by the bundled signalling server.",
      },
      {
        name: "PixelStreamingInfrastructure",
        version: "matches engine version (e.g. UE5.8 branch)",
        url: "https://github.com/EpicGamesExt/PixelStreamingInfrastructure",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "The signalling + frontend lives outside the engine repo. Clone the branch that matches your engine version.",
      },
    ],
    steps: [
      {
        title: "Enable the Pixel Streaming plugin",
        body: "Open your Unreal project. Edit > Plugins. Search 'Pixel Streaming'. Tick Enabled. UE prompts to restart — confirm.\n\nThe plugin ships built-in with UE 5.8; no marketplace install needed.",
      },
      {
        title: "Configure project settings for streaming",
        body: "Project Settings > Plugins > Pixel Streaming. Note the defaults but leave them for now.\n\nMore importantly: Project Settings > Engine > Rendering > Frame Rate. Set Smooth Frame Rate = on, Min FPS = 30, Max FPS = 60. Pixel Streaming wants a steady frame budget; uncapped frame rate causes encoder jitter.\n\nProject Settings > Engine > Input. Disable 'Use Mouse for Touch' if you want explicit mouse-vs-touch handling in the browser; leave on for casual demos.",
      },
      {
        title: "Clone the signalling infrastructure",
        body: "Outside the engine, clone the Pixel Streaming Infrastructure repo:\n\n  git clone -b UE5.8 https://github.com/EpicGamesExt/PixelStreamingInfrastructure\n\nThe branch name must match the engine version. Navigate into the Frontend/library and SignallingWebServer subdirectories.\n\nIn SignallingWebServer/platform_scripts/cmd/ on Windows: run setup.bat first. This installs the Node dependencies and downloads the matching coTURN binary for NAT traversal.",
      },
      {
        title: "Launch Unreal with Pixel Streaming command-line args",
        body: "Either build a standalone game with the project, or launch the editor's Play-In-Editor with the streaming flags. From a terminal:\n\n  UnrealEditor.exe path-to-your.uproject -PixelStreamingURL=ws://localhost:8888 -RenderOffScreen -ForceRes -ResX=1920 -ResY=1080\n\nThe -RenderOffScreen flag suppresses the editor's own viewport so the GPU dedicates frames to streaming. -PixelStreamingURL tells the engine where to find the signalling server.",
      },
      {
        title: "Launch the signalling server",
        body: "In a second terminal: navigate to SignallingWebServer/platform_scripts/cmd/, run start.bat. The server boots, prints 'WebSocket signalling listening on :8888' and 'HTTP frontend listening on :80'.\n\nOpen a browser tab to http://localhost. The Pixel Streaming frontend page loads. After a moment, the Unreal scene appears as a video stream, fully interactive — mouse + keyboard route from the browser tab back through WebRTC to the running Unreal process.",
      },
      {
        title: "Verify input + latency",
        body: "Click the browser viewport, move with WASD, look with the mouse. The latency on a local-machine setup is typically under 60 ms — feels native.\n\nOpen the browser dev tools > Network > WS. The WebRTC data channel carries input events as small JSON packets. The video stream shows up as a WebRTC peer connection with H.264 video frames.\n\nFor remote delivery (the production case), the signalling server needs to be on a publicly-reachable host, with TURN credentials configured for NAT-traversal. The studio runs this through Tailscale Funnel for staging and through a coTURN cluster for public deployments.",
      },
    ],
    finalResult:
      "An Unreal scene rendered on the bench-side GPU, streamed to a browser tab over WebRTC, fully interactive with sub-60 ms local latency. The pattern the studio uses for browser-delivered Unreal work — photogrammetry inspection, Nanite-grade archive scenes, anything that needs the full Unreal renderer but the visitor needs no install.",
    variations: [
      "Build the project as a packaged Win64 executable instead of running the editor — production deployments always ship as packaged builds for predictable frame budgets.",
      "Deploy the signalling server to a small VM and point the bench-side Unreal at it — visitors anywhere with internet connect via that VM as a relay.",
      "Use the Pixel Streaming Player React component (in PixelStreamingInfrastructure/Frontend/library) to embed the stream inside an existing web app instead of using the default frontend page.",
      "For multi-user demos, run the matchmaker server alongside signalling — assigns visitors round-robin to multiple Unreal instances.",
    ],
    troubleshooting: [
      {
        symptom: "Browser tab loads but the video is black",
        cause: "Unreal launched without -RenderOffScreen on a machine with no monitor attached, or the WebRTC handshake silently failed.",
        fix: "Confirm -RenderOffScreen flag, confirm signalling server log shows 'streamer connected' before the browser connects. If still black, open Chrome's chrome://webrtc-internals and look for the failed peer connection.",
      },
      {
        symptom: "Latency over a second, video stutters",
        cause: "GPU isn't using NVENC for hardware encoding — falling back to software h264 which is far slower.",
        fix: "Confirm NVIDIA driver version is recent (570+), confirm GPU is NVENC-capable (any RTX card is fine). Check Unreal's Output Log for 'NVENC encoder initialised'; if missing, the engine is using libvpx software encode.",
      },
      {
        symptom: "Input lag — clicks and key presses arrive seconds late",
        cause: "WebRTC data channel was renegotiated; some browsers throttle background tabs.",
        fix: "Keep the browser tab focused. For production, integrate a WebRTC stats listener in the frontend and reconnect on detected freeze.",
      },
      {
        symptom: "Cannot connect from a second machine on the same network",
        cause: "Signalling server is bound to 127.0.0.1 only.",
        fix: "Edit SignallingWebServer/config.json (or pass --PublicIp on launch) to bind to the machine's LAN address, and open ports 80 + 8888 in Windows Firewall.",
      },
    ],
  },
  base,
);
