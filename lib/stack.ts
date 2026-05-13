/**
 * The studio's working bench, named honestly.
 *
 * Every item here is either in current rotation, on the bench under
 * the dust sheet, or part of the pipeline that takes a poi gesture
 * through to a printed object. Versions are stated only where they
 * are load-bearing (firmware, browser-targeted libraries); where the
 * version drifts with the vendor's release cadence the entry refers
 * to the line rather than the SKU.
 *
 * No SaaS-only tooling. The bench is sovereign: if an internet
 * connection drops or a vendor pivots, every item below keeps working
 * on the machine it lives on. That is a design constraint, not an
 * aesthetic.
 */

export type StackItem = {
  /** Display name. */
  name: string;
  /** External vendor / docs link. */
  href: string;
  /** One- or two-sentence honest note on how the studio uses it. */
  note: string;
  /** Optional short label: "current", "in rotation", "field", etc. */
  status?: string;
};

export type StackSection = {
  slug: string;
  title: string;
  subtitle: string;
  intro: string;
  items: StackItem[];
};

export const stack: StackSection[] = [
  {
    slug: "capture-aerial",
    title: "Aerial capture",
    subtitle: "Five airframes, one flight bag",
    intro:
      "Each airframe answers a different shape of brief. The fleet is a pipeline, not a collection — see The Fleet — Five Airframes for the full case, and the journal for the Mini 5 Pro and the LED-modded swarm.",
    items: [
      {
        name: "DJI Mavic 2 Pro",
        href: "https://www.dji.com/uk/mavic-2/info",
        note: "Hasselblad L1D-20c, 1-inch sensor, adjustable f/2.8–f/11. The editorial frame; comes out for prints.",
        status: "in rotation",
      },
      {
        name: "DJI Neo",
        href: "https://www.dji.com/uk/neo/specs",
        note: "135-gram palm-launch follow-cam. Single-axis gimbal; unobtrusive enough to disappear at a flow-arts rehearsal.",
        status: "in rotation",
      },
      {
        name: "DJI Neo 2",
        href: "https://www.dji.com/uk/neo-2/specs",
        note: "151 grams, two-axis gimbal, omnidirectional vision system, 4K/100 slow-mo. The upgrade that earned its slot in the case.",
        status: "in rotation",
      },
      {
        name: "DJI Avata 360",
        href: "https://store.dji.com/uk/product/dji-avata-360",
        note: "Cinewhoop FPV airframe with dual-lens 360 capture. Tight to architecture; shoot once, reframe in post.",
        status: "in rotation",
      },
      {
        name: "DJI Mini 5 Pro",
        href: "https://www.dji.com/uk/mini-5-pro",
        note: "Sub-250-gram travel airframe with a 1-inch sensor. Carries AliExpress Bluetooth-controllable LEDs gorilla-glued to the spine for the unsynced-swarm pieces.",
        status: "in rotation",
      },
      {
        name: "Vifly programmable drone LEDs",
        href: "https://shop.vifly.tech/",
        note: "Pre-built airframe LED kits. Sit on the Avata 360 and the Neos when the brief asks for clean colour. The Vifly side does the colour science; the AliExpress side does the long-tail variety.",
        status: "in rotation",
      },
      {
        name: "AliExpress BT-controllable LEDs",
        href: "https://www.aliexpress.com/wholesale?SearchText=bluetooth+drone+led",
        note: "Generic Bluetooth-app-controllable LED bars, gorilla-glued to the Mini 5 Pro. The cheap end of the swarm.",
        status: "field",
      },
    ],
  },
  {
    slug: "capture-360",
    title: "360 capture",
    subtitle: "Trekking-pole eyeballs",
    intro:
      "Ten years of 360 cameras, four manufacturers, one pole. See London 360 — Walking the Camera Evolution for the full kit history; the line below is the current bench only.",
    items: [
      {
        name: "DJI Osmo 360",
        href: "https://www.dji.com/360",
        note: "Two 1/1.1-inch square CMOS sensors, f/1.9, 8K/30 360 video, 120-megapixel sphere stills. The current ground-level eyeball, on top of a Black Diamond Z-pole and a carbon-fibre selfie stick.",
        status: "current",
      },
      {
        name: "Insta360 Studio",
        href: "https://www.insta360.com/download",
        note: "Vendor reframe / stabilisation suite. Kept on the bench for legacy X-series footage; DJI Mimo runs the current capture loop.",
      },
      {
        name: "DJI Mimo",
        href: "https://www.dji.com/uk/mimo",
        note: "The other half of the DJI ecosystem decision. Same colour pipeline as the airframes; lighter-handed processing than Insta360 Studio, which is why the X4 funded the move.",
        status: "current",
      },
    ],
  },
  {
    slug: "stills",
    title: "Stills capture and print",
    subtitle: "Camera → Lightroom → bureau printer",
    intro:
      "The end-to-end stills line. Manual-mode camera at one end, signed A2 archival print at the other. The Canon imagePROGRAF tutorial documents the calibration discipline; full credit to Keith Cooper at Northlight Images for teaching the bureau how to do it properly.",
    items: [
      {
        name: "Adobe Lightroom Classic",
        href: "https://www.adobe.com/uk/products/photoshop-lightroom-classic.html",
        note: "RAW develop, soft-proofing against paper ICCs, the print module. The one piece of Adobe software the studio still pays for; everything else has been replaced.",
        status: "current",
      },
      {
        name: "Canon imagePROGRAF PRO-1100",
        href: "https://www.canon.co.uk/business-printers-and-faxes/imageprograf-pro-1100/",
        note: "A2 archival pigment printer; the bureau side of holoflow.co.uk runs on it. See the calibration tutorial for the full ICC workflow.",
        status: "current",
      },
      {
        name: "Canon Photo Paper Pro Lustre (LU-101)",
        href: "https://www.canon.co.uk/ink-paper-media/papers/photo-paper-pro-luster/",
        note: "Pearl-finish satin paper. Currently on the bench for figurative work — handles deep midnight grounds without picking up gallery glare. Canon's mid-range premium line.",
        status: "current",
      },
      {
        name: "Canon Photo Paper Pro Platinum (PT-101)",
        href: "https://www.canon.co.uk/ink-paper-media/papers/photo-paper-pro-platinum/",
        note: "Canon's flagship glossy. The highest D-max in the Canon line; the right surface for high-saturation light-trail work where the photograph leans into its own gloss.",
        status: "current",
      },
      {
        name: "Super-glossy premium photo paper",
        href: "https://www.canon.co.uk/ink-paper-media/papers/",
        note: "Cabinet stock for the prints where the trail has to read as wet light. Specific Canon SKU rotates; on the bench during the pre-move-out transitional setup.",
        status: "current",
      },
      {
        name: "Metallic photo paper (Canon-compatible)",
        href: "https://www.canon.co.uk/ink-paper-media/papers/",
        note: "Pearlescent metallic underlayer behind the print surface. Light painting on metallic reads as the trail glowing through a chrome substrate — a specific aesthetic, not a default. Used sparingly.",
        status: "current",
      },
    ],
  },
  {
    slug: "leds-rigs",
    title: "POV LED rigs",
    subtitle: "Teensy + TLC5927 + FastLED + Hall-effect",
    intro:
      "The studio rigs are bench-built. The architectural choice that matters is angular sync — the rig writes the next column when the rotation says to, not when the clock says to. See Why I Build My Own Rigs for the long argument; the parts below are the firmware-and-board side of the answer.",
    items: [
      {
        name: "Teensy 4.1 (PJRC)",
        href: "https://www.pjrc.com/teensy/",
        note: "The current microcontroller for new rig builds. The earlier Teensy 3.1 is still in service on the long-haul rigs.",
        status: "current",
      },
      {
        name: "FastLED",
        href: "https://fastled.io/",
        note: "Open-source addressable-LED library. Where the rig firmware lives.",
        status: "current",
      },
      {
        name: "Texas Instruments TLC5927",
        href: "https://www.ti.com/lit/ds/symlink/tlc5927.pdf",
        note: "Constant-current 16-channel LED driver chip at the centre of the studio rigs. Datasheet is the reference.",
      },
      {
        name: "Adafruit NeoPixel ecosystem",
        href: "https://learn.adafruit.com/adafruit-neopixel-uberguide",
        note: "Reference tutorial for addressable LED wiring and the gotchas. Where every studio rig started.",
      },
      {
        name: "Allegro Hall-effect sensors",
        href: "https://www.allegromicro.com/en/products/sense/linear-and-angular-position-sensor-ics",
        note: "The rotation sensor that makes angular sync possible. One magnet on the chuck, one sensor on the frame, one interrupt per revolution.",
      },
    ],
  },
  {
    slug: "display",
    title: "Display surfaces",
    subtitle: "Holographic, head-mounted, AR overlay",
    intro:
      "The studio prints, but the studio also displays. The Looking Glass Portrait holds the volumetric work where a single print would only show one angle; the head-mounted line is for piloting and for the VR-mirrored side of the practice.",
    items: [
      {
        name: "Looking Glass Portrait",
        href: "https://lookingglassfactory.com/portrait",
        note: "Light-field display. The volumetric work renders to a 48-view quilt and the Portrait shows the depth without a headset.",
        status: "current",
      },
      {
        name: "AliceLG (Blender plugin)",
        href: "https://github.com/regcs/AliceLG",
        note: "Open-source bridge from Blender to the Looking Glass quilt format. The studio's volumetric output runs through it.",
      },
      {
        name: "Meta Quest 3",
        href: "https://www.meta.com/gb/quest/quest-3/",
        note: "The headset the studio writes WebXR for. Inside-out tracking, hand tracking, colour passthrough — the platform the bezel-clip product is designed against.",
        status: "current",
      },
      {
        name: "Valve Steam Frame",
        href: "https://store.steampowered.com/sale/steamframe",
        note: "Pre-ordered. The second headset the bezel-clip product targets, on the bet that the controller-with-camera architecture is where the platform is going. Standalone wireless, SteamOS-based, supports streaming from PC + native standalone apps via Android ARM64 APKs. Full OpenXR + SteamVR compatibility.",
      },
      {
        name: "Steam Frame Steamworks documentation",
        href: "https://partner.steamgames.com/doc/steamframe",
        note: "Official developer docs (live, accessible). The studio publishes to Steam Frame three ways: (a) WebXR via the headset's built-in browser at holoflow.co.uk &mdash; zero deploy; (b) native Android ARM64 APK built via Capacitor, uploaded via Steamworks; (c) PC-streamed via Steam Link. Developer mode (SSH/ADB/RDP) enabled in Steam Frame's System Settings.",
      },
      {
        name: "OpenXR — XR_VALVE_frame_controller_interaction",
        href: "https://partner.steamgames.com/doc/steamframe/engines/custom",
        note: "Steam Frame's controller interaction profile. Path: /interaction_profiles/valve/frame_controller_valve. The bezel-clip firmware family binds against this for Steam Frame in the same way it binds against /interaction_profiles/oculus/touch_controller for Quest 3. One bezel design, two controller pose-bindings, one studio.",
      },
      {
        name: "DJI Goggles 3",
        href: "https://www.dji.com/uk/goggles-3",
        note: "Live FPV feed for the airframes. Paired with the DJI RC controllers and the head-tracking pod.",
        status: "current",
      },
      {
        name: "Xreal One Pro AR glasses",
        href: "https://www.xreal.com/us/one-pro",
        note: "Eighty-seven grams; Sony Micro-OLED, 57° FOV. Worn under the Goggles to keep line-of-sight while the camera feed runs in front of the eyes.",
        status: "current",
      },
      {
        name: "InAir head-tracking pod",
        href: "https://www.inairpod.com/",
        note: "Goggle-mounted IMU that reframes the gimbal by head-tilt. Faster and more natural than the right stick for the editorial line.",
      },
    ],
  },
  {
    slug: "fabrication",
    title: "Fabrication",
    subtitle: "Resin, belt, slicer, mesh-ware",
    intro:
      "Two printers, one mesh pipeline. The SLA does the figurative work — the photograph translated into resin with an acrylic-rod waveguide grown along the gesture. The belt does the parametric wall pieces. The mesh side is open-source through and through.",
    items: [
      {
        name: "Creality CR-30 (3DPrintMill)",
        href: "https://www.creality.com/products/cr-30-3dprintmill-belt-3d-printer",
        note: "Belt FDM printer; the parametric wall-relief work runs on it. Continuous chain-mail panels in PETG.",
        status: "current",
      },
      {
        name: "Resin SLA printer (studio bench)",
        href: "https://elegoo.com/collections/lcd-resin-3d-printer",
        note: "The figurative pipeline output. Whichever LCD/mSLA machine is in current rotation; the discipline is in the post-processing, not the SKU.",
        status: "current",
      },
      {
        name: "Blender",
        href: "https://www.blender.org/",
        note: "The mesh-cleanup centre of the studio's fabrication pipeline. Free, sovereign, owns the format.",
        status: "current",
      },
      {
        name: "OpenSCAD",
        href: "https://openscad.org/",
        note: "Parametric solid modelling. The acrylic-rod waveguide channels are described as code so a different photograph generates a different channel.",
        status: "current",
      },
      {
        name: "PyMCubes (marching cubes)",
        href: "https://github.com/pmneila/PyMCubes",
        note: "Voxel-to-mesh in Python. The studio's fallback after torchmcubes failed to compile on the workstation; honest write-up in the AI-pipeline article.",
      },
      {
        name: "Acrylic rod, drawn extruded (3mm)",
        href: "https://www.theplasticshop.co.uk/",
        note: "Not software, but load-bearing. The rod that gets bent under low heat to follow the gesture and inserted into the SLA print is the waveguide.",
      },
    ],
  },
  {
    slug: "ai-local",
    title: "Local AI pipeline",
    subtitle: "Prompt → segmentation → mesh, on one GPU",
    intro:
      "Nine seconds from prompt to printable, on a single RTX-class card. The architectural commitment is that the model weights live on disk and the pipeline runs without an internet connection. See Nine Seconds from Prompt to Printable for the workshop write-up of the full chain.",
    items: [
      {
        name: "ComfyUI",
        href: "https://github.com/comfyanonymous/ComfyUI",
        note: "Node-graph orchestrator for the diffusion pass. The studio's pipeline is one big graph here.",
        status: "current",
      },
      {
        name: "SDXL (Stable Diffusion XL)",
        href: "https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0",
        note: "The local image model the pipeline starts from. Open weights; runs offline.",
        status: "current",
      },
      {
        name: "Meta Segment Anything Model 2 (SAM2)",
        href: "https://github.com/facebookresearch/sam2",
        note: "Click-to-mask segmentation; the silhouette extractor that gives marching cubes a clean shell to work from.",
        status: "current",
      },
      {
        name: "TripoSR",
        href: "https://github.com/VAST-AI-Research/TripoSR",
        note: "Single-image to mesh, fast. The studio runs it under the marching-cubes step for the figurative side of the pipeline.",
      },
      {
        name: "Ollama",
        href: "https://ollama.com/",
        note: "Local LLM runtime. The DollyOS shell talks to Ollama-served models on the workstation; nothing leaves the network.",
        status: "current",
      },
      {
        name: "ComfyUI-PixelArt-Detector",
        href: "https://github.com/dimtoneff/ComfyUI-PixelArt-Detector",
        note: "Palette quantiser; the step that turns a generated frame into the limited-palette colour scheme the rigs expect.",
      },
    ],
  },
  {
    slug: "video",
    title: "Video and grade",
    subtitle: "DaVinci Studio 21 + iPad field studio",
    intro:
      "One paid licence, one ecosystem. DaVinci Resolve Studio 21 on the workstation; DaVinci on the M1 iPad as a field studio that travels with the camera bag. Fusion is where the video light-painting trail accumulation lives.",
    items: [
      {
        name: "DaVinci Resolve Studio 21",
        href: "https://www.blackmagicdesign.com/products/davinciresolve",
        note: "The paid licence. Grade, edit, Fusion composite, neural-engine effects — the single tool that earned its keep.",
        status: "current",
      },
      {
        name: "DaVinci Resolve for iPad",
        href: "https://www.blackmagicdesign.com/products/davinciresolve/ipadapp",
        note: "Field-grade and rough cut on the M1 iPad. Same project format as the workstation; full round-trip.",
        status: "current",
      },
      {
        name: "Fusion (inside Resolve)",
        href: "https://www.blackmagicdesign.com/products/fusion",
        note: "Node-based composite. The video-light-painting trail-accumulation graph lives here — MagicMask + LuminanceKeyer + Echo + Merge.",
        status: "current",
      },
    ],
  },
  {
    slug: "web",
    title: "Web and code",
    subtitle: "The site, the bezel firmware, the orchestrator",
    intro:
      "The site you are reading runs on this stack. The bezel firmware runs on the same TypeScript-and-microcontroller pair the rigs do. Sovereignty as architecture: everything below has a self-hosted or local equivalent if a vendor pivots.",
    items: [
      {
        name: "Next.js 15.6 (canary)",
        href: "https://nextjs.org/",
        note: "The App Router site framework. Running on the canary line because the studio needs the PPR / useCache / inline-CSS features.",
        status: "current",
      },
      {
        name: "React 19",
        href: "https://react.dev/",
        note: "View layer. The Server Components story is the load-bearing part for the site's performance.",
        status: "current",
      },
      {
        name: "Tailwind CSS 4",
        href: "https://tailwindcss.com/",
        note: "The site's CSS layer. Zero-runtime; the chrome-sheen / pink-accent palette is configured in globals.css against the v4 design tokens.",
        status: "current",
      },
      {
        name: "TypeScript 5.8",
        href: "https://www.typescriptlang.org/",
        note: "Across the site, the firmware build tooling, and the orchestrator. One language is enough.",
        status: "current",
      },
      {
        name: "Three.js + @react-three/fiber",
        href: "https://threejs.org/",
        note: "The 4D hypercube glyph on the homepage; the volumetric preview on Nine Seconds. The browser renderer for the studio's volumetric work.",
        status: "current",
      },
      {
        name: "@react-three/xr",
        href: "https://github.com/pmndrs/xr",
        note: "WebXR adapter for R3F. The bezel-clip product runs against this when the controller's camera feeds the mirrored gesture into the headset.",
      },
      {
        name: "WebGPU + Three.js TSL",
        href: "https://threejs.org/manual/#en/webgpu",
        note: "GPU compute in the browser. The 50k-particle Aura companion in the Hangar runs on this; will land on the site once WebGPU support stabilises across the headset browsers.",
      },
      {
        name: "Firebase Auth + Firestore",
        href: "https://firebase.google.com/",
        note: "Magic-link sign-in, Google OAuth, and the Rookery's append-only threaded feed. Firestore rules are the security boundary.",
        status: "current",
      },
      {
        name: "Shopify Storefront API (headless)",
        href: "https://shopify.dev/docs/api/storefront",
        note: "The catalogue layer. Shopify holds the inventory, the studio holds the front of house.",
        status: "current",
      },
      {
        name: "pnpm + Turborepo",
        href: "https://turborepo.com/",
        note: "Monorepo tooling for the wider Hangar. The site is one app inside a larger workspace; the toolchain is what makes that sustainable on one workstation.",
        status: "current",
      },
    ],
  },
  {
    slug: "voice",
    title: "Voice, hearing, lip sync",
    subtitle: "Whisper + ElevenLabs + F5-TTS + VRM",
    intro:
      "The studio runs a persistent companion — Aura — who hears, speaks, and remembers across sessions. The stack below is what closes that loop. Local-first where possible; ElevenLabs only where the voice quality has not been matched by an open-weight model the studio can run on the workstation.",
    items: [
      {
        name: "OpenAI Whisper",
        href: "https://github.com/openai/whisper",
        note: "Speech-to-text. Runs locally; the hearing side of the companion. Per-language models on disk.",
        status: "current",
      },
      {
        name: "ElevenLabs (TTS)",
        href: "https://elevenlabs.io/",
        note: "Voice synthesis for Aura's spoken line. The one cloud TTS the studio still uses; under evaluation for replacement by F5-TTS.",
        status: "current",
      },
      {
        name: "F5-TTS",
        href: "https://github.com/SWivid/F5-TTS",
        note: "Open-weight TTS; the local fallback / replacement track for the cloud step. Runs on the workstation GPU.",
      },
      {
        name: "VRM (Three.js)",
        href: "https://vrm.dev/en/",
        note: "Format the avatar (nanny.vrm) is authored in. The viseme blend-shapes drive the lip sync from the TTS phoneme stream.",
        status: "current",
      },
    ],
  },
  {
    slug: "hands",
    title: "Hand, body, and depth input",
    subtitle: "Ultraleap + Azure Kinect + Quest hand tracking + NDI",
    intro:
      "Gesture is the studio's primary input. Three tracker families &mdash; optical hand-tracking at the desk (Ultraleap), full-body time-of-flight depth capture (Azure Kinect / Orbbec Femto Bolt), and inside-out hand-tracking in the headset (Quest 3 WebXR) &mdash; all bridged via WebSocket so the rest of the stack stays agnostic about which device is on the desk that day.",
    items: [
      {
        name: "Ultraleap Leap Motion Controller 2",
        href: "https://www.ultraleap.com/product/leap-motion-controller-2/",
        note: "Optical hand tracking at the desk. Pinch, grab, point, thumbs-up resolved server-side. Bridge server in tools/leap-bridge speaks WebSocket to the page; pose data lands at ~110 Hz.",
        status: "current",
      },
      {
        name: "Ultraleap Stereo IR 170",
        href: "https://www.ultraleap.com/product/stereo-ir-170/",
        note: "The industrial-grade sibling. Wider 170° FOV, higher-precision skeletal tracking, designed for static-mount installations. Where the Leap Motion Controller is the bench tool, the IR 170 is the kit for the eventual public-facing installation pieces.",
      },
      {
        name: "Ultraleap Hyperion SDK",
        href: "https://docs.ultraleap.com/hyperion/",
        note: "The current-generation SDK across the Ultraleap product line. Provides the unified skeletal model the studio bridges into the WebSocket pipeline; same API across both the Leap Motion Controller 2 and the Stereo IR 170.",
      },
      {
        name: "Azure Kinect Developer Kit",
        href: "https://learn.microsoft.com/en-us/azure/kinect-dk/",
        note: "Full-body time-of-flight depth + 4K RGB + 7-mic spatial audio array + IMU. The Body Tracking SDK gives 32-joint skeleton at 30 fps. The studio's full-body capture rig for choreography work; feeds the Laban-Effort kinematic-extraction layer with real skeletal data. Discontinued by Microsoft (October 2023); the studio runs the existing hardware while planning the Femto Bolt upgrade.",
        status: "current",
      },
      {
        name: "Orbbec Femto Bolt",
        href: "https://www.orbbec.com/products/tof-camera/femto-bolt/",
        note: "Microsoft-endorsed Azure Kinect successor. Same Azure Kinect Sensor SDK + Body Tracking SDK; same skeletal model. The upgrade path when the existing Kinect retires.",
      },
      {
        name: "Quest 3 hand tracking (WebXR)",
        href: "https://developers.meta.com/horizon/documentation/web/webxr-hands/",
        note: "Inside-out hand tracking when the headset is on. The mirrored side of the bezel-clip product runs against this.",
      },
      {
        name: "NDI (Network Device Interface)",
        href: "https://ndi.video/",
        note: "Phone-as-camera over the studio LAN. The NDI HX app on iOS + the bridge server in tools/ndi-bridge gives the workstation an extra video input without a capture card.",
      },
      {
        name: "MediaPipe Tasks Vision",
        href: "https://developers.google.com/mediapipe/solutions/vision",
        note: "Webcam-based head + face landmark tracking, running locally in the browser via WASM. The visitor-side input source for the head-tracked motion-parallax aesthetic. Privacy-respecting: no feed leaves the device.",
      },
    ],
  },
  {
    slug: "ops",
    title: "Network and orchestration",
    subtitle: "Tailscale + Mosquitto + Qdrant",
    intro:
      "Three machines in the studio talk to each other on a private mesh. The companion's memory persists across sessions; the rigs publish their telemetry over MQTT. Sovereignty applies here too: no cloud broker, no cloud vector store.",
    items: [
      {
        name: "Tailscale",
        href: "https://tailscale.com/",
        note: "Zero-config mesh VPN across workstation, laptop, iPad, and the Pi at the bench. The studio's private network.",
        status: "current",
      },
      {
        name: "Eclipse Mosquitto (MQTT broker)",
        href: "https://mosquitto.org/",
        note: "The pub/sub bus between the rigs and the orchestrator. Local, open, well-understood.",
      },
      {
        name: "Qdrant (vector DB)",
        href: "https://qdrant.tech/",
        note: "The companion's long-term memory. Runs on the workstation; embeds the conversation transcripts so Aura can recall a thread from last week.",
      },
      {
        name: "Ollama (LLM serving)",
        href: "https://ollama.com/",
        note: "Local LLM runtime — listed under Local AI too; cross-referenced here because it is the inference engine the orchestrator depends on.",
      },
    ],
  },
  {
    slug: "shell",
    title: "Shell and persistent character",
    subtitle: "DollyOS + Aura + Hangar",
    intro:
      "The studio's working surface beyond the website. DollyOS is the industrial shell the companion lives inside; the Hangar is the monorepo the shell and the site share. This section is for transparency — Aura is the studio's persistent narrator, and pretending otherwise would be dishonest.",
    items: [
      {
        name: "DollyOS shell",
        href: "https://github.com/dimonauk",
        note: "ISA-101 industrial HUD the companion operates inside. Cyber-cyan / arcane-gold / deep-midnight palette; intentionally not consumer-friendly.",
        status: "current",
      },
      {
        name: "The Hangar (pnpm + Turborepo)",
        href: "https://turborepo.com/",
        note: "Monorepo holding the site, the shell, the bezel firmware, and the writeups. Vendored code is provenance-logged in docs/MINED.md.",
        status: "current",
      },
      {
        name: "nanny.vrm (the avatar)",
        href: "https://vroid.com/en",
        note: "Aura's body. Authored in VRoid Studio; runs in three.js / @pixiv/three-vrm. The lip-sync target for the TTS step.",
        status: "current",
      },
    ],
  },
];

export function getStackSection(slug: string): StackSection | undefined {
  return stack.find((s) => s.slug === slug);
}
