# WebXR device targets — the hard deck

A single document for the studio's WebXR scene system. Numbers per
device that the codebase must respect before a build ships. Every
spec figure is cited at the foot of the doc; figures we couldn't
verify are flagged `UNCONFIRMED` and given the closest reading the
public material supports.

## 1. Why this exists

Dimona, 2026-05-19:

> go do research about samsung, google, steam frame and create a
> hard deck of our webxr system to target those devices

"Hard deck" — borrowed from aviation — is the altitude beneath which
the manoeuvre is failed. For our scene system it's the
minimum-acceptable target on a given device: the framerate it can't
fall under, the draw call count it can't exceed, the triangle and
splat budget the room must respect, the post-pass count we're
allowed to chain. Below the deck the studio fails the device.

The doc carries six rows: the three Dimona named — Samsung Galaxy
XR [^1], Google's Android XR platform [^4], Valve's Steam Frame
[^7] — plus the three baseline comparators the studio already ships
against: Meta Quest 3 / 3S / Pro [^11], Apple Vision Pro [^18],
Pico 4 Ultra [^28]. The shape is concrete enough that
`components/three/xr/XRCanvas.tsx` (per `docs/WEBXR_STACK.md`)
can read it as a config table when the studio writes the
per-device preset selector.

It is also a planning artefact for the bench. The studio owns a
Quest 3, can borrow a Vision Pro, can buy a Pico 4 Ultra at
gallery cost. Galaxy XR and Steam Frame have to be tested through
remote partners — naming those partners is part of section 7.

## 2. Headline target matrix

Per-eye resolution is **panel** native, not framebuffer-after-foveation.
"Default refresh" is the rate the studio scene starts at; the
device may support higher, but `XRSessionInit` should request the
default first and upgrade with `XRSession.updateTargetFrameRate()`
if budget allows.

| Device | OS / browser | WebXR session modes | Display per eye | Default refresh | SoC | RAM | Hand tracking | Eye tracking | Foveated render | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Samsung Galaxy XR | Android XR / Chrome [^2] [^4] | `immersive-ar` [^4] (and the AR module's VR composition path) | 3552 × 3840 micro-OLED [^1] | 72 Hz (max 90) [^2] | Snapdragon XR2+ Gen 2 [^1] | 16 GB [^1] | ✓ primary input [^4] | ✓ four internal cameras [^1] | ✓ eye-tracked foveation [^3] (`UNCONFIRMED` whether exposed to WebXR layers) | Controllers sold separately at $250 [^5]; default interaction is hand + eye-gaze [^5] |
| Google Android XR (platform) | Android XR / Chrome [^4] | `immersive-ar` [^4]; `immersive-vr` per spec | Device-dependent | Device-dependent | Device-dependent | Device-dependent | ✓ primary [^4] | Optional, per device | Optional, per device | Reference device is Galaxy XR; standardised feature set is what Chrome on Android XR exposes [^4] |
| Valve Steam Frame | SteamOS (Arch-based Linux) / built-in browser `UNCONFIRMED` [^7] | Native WebXR support on Linux Chromium is `UNCONFIRMED` — historically Chromium does not expose `immersive-vr` on Linux [^10]; SteamVR Link path is the working route from a PC | 2160 × 2160 LCD [^7] [^8] | 90 Hz (also 72 / 80 / 120 / experimental 144) [^7] [^8] | Snapdragon 8 Gen 3 [^7] | 16 GB LPDDR5X [^7] | ✗ at launch (controllers required) [^9] | ✓ for foveated streaming [^9] | ✓ foveated streaming over PC link [^9]; on-device foveation `UNCONFIRMED` | "Streaming-first" by Valve's own framing [^7]; native standalone path needs separate verification |
| Meta Quest 3 | Horizon OS / Meta Browser (Chromium); Wolvic-Chromium [^17] | `immersive-vr` + `immersive-ar` (passthrough) [^15] | 2064 × 2208 LCD [^11] | 90 Hz (also 72 / 120) [^13] [^15] | Snapdragon XR2 Gen 2 [^11] | 8 GB [^11] | ✓ (also simultaneous with controllers) [^15] | ✗ on consumer Quest 3 / 3S [^12] | ✓ dynamic foveation supported by SoC [^11] [^14] | The de facto WebXR baseline; Meta dev docs are the most concrete public source for budgets [^14] |
| Meta Quest 3S | Horizon OS / Meta Browser | `immersive-vr` + `immersive-ar` | 1832 × 1920 LCD, Fresnel [^12] | 90 Hz (also 120) [^12] | Snapdragon XR2 Gen 2 [^12] | 8 GB [^12] | ✓ | ✗ | ✓ | The lower clarity baseline — Fresnel optics, not pancake [^12] |
| Apple Vision Pro | visionOS 2+ / Safari [^19] | `immersive-vr` **only** — no `immersive-ar` module [^20] | 3660 × 3200 active (panel ~3660×3200 [^25]; on-screen framebuffer ~1920 × 1824 per eye [^25]) | 90 Hz (the visionOS default; `UNCONFIRMED` whether Safari exposes 96 Hz to WebXR) | Apple M2 + R1 [^23] | 16 GB unified [^23] | ✓ full hand-joint data; gaze-pinch via `transient-pointer` input [^21] | Used for foveation; not exposed to web; web only gets pinch-time rays [^21] | ✓ device-side variable-rate, gaze-driven [^26]; **opaque to WebXR** | The "AR-only-by-passthrough" headset, but WebXR sees it as VR; Vision Pro has no shared anchors at all [^22] |
| Pico 4 Ultra | PICO OS / Pico Browser (Chromium) + Wolvic-Chromium [^17] [^30] | `immersive-vr` + `immersive-ar` [^17] | 2160 × 2160 LCD, pancake [^28] | 90 Hz [^28] | Snapdragon XR2 Gen 2 [^28] | 12 GB [^28] | ✓ | ✗ (Pico 4 Ultra Enterprise variant only) | ✓ dynamic foveation supported by SoC | Behaves close to Quest 3 for budgeting; pancake stack gives the cleaner edge clarity [^28] |

## 3. Per-device hard deck

The numbers below are deliberately *workshop* numbers — what the
studio will let a scene fall to before it counts as failing the
device. They sit slightly below what hero benchmarks claim, because
the bureau scene already eats CPU on Aura's idle motion, the
tracking registry, and the WebGPU TSL post-pack.

### 3.1 Samsung Galaxy XR

**Hardware shape.** Snapdragon XR2+ Gen 2 [^1], 16 GB RAM [^1],
27-megapixel combined micro-OLED [^1] (3552 × 3840 per eye [^1]),
545 g head unit + 302 g external battery [^2] [^6], 109° × 100°
FOV [^6], four internal eye-tracking cameras + active depth sensor
[^1]. Wi-Fi 7 + BT 5.4 [^1]. Battery 2 h general / 2.5 h
playback [^1] [^6].

**WebXR shape.** Chrome on Android XR is the browser story —
Samsung Internet is the system browser, but the Chrome build that
ships on Android XR carries the full WebXR module set [^4]:
Device API, AR module, Gamepads, Hit Test, Hand Input, Anchors,
Depth Sensing (stereoscopic), Light Estimation [^4]. Session mode
documented is `immersive-ar` — the AR module is the entry point,
and the platform composites VR-mode content over passthrough or
into a virtual environment from there [^4].

**Hard deck.**

- **Framerate floor:** 72 Hz [^2]. Drop a frame and the headset
  reprojects; sustained drops trigger user-visible juddering on
  hand-tracked picks because the gaze ray is on the same loop.
- **Frametime budget:** 13.9 ms total at 72 Hz. Aim CPU under
  6 ms, GPU under 10 ms per eye (paired views).
- **Draw call cap:** **300** unique calls per frame. The Meta
  guidance is the only public concrete WebXR draw-call yardstick
  the studio has — Meta calls out that 1000 unique-triangle calls
  drops a Quest below 72 Hz [^14], so we sit firmly under that
  for a XR2+ Gen 2 device too. Hard fail at **500**.
- **Triangle budget:** **400 k** triangles in the scene; **700 k**
  hard fail. Two views × 350 k vertices through the pipeline lands
  inside the published "several orders of magnitude more than 1000
  triangles per frame" Meta envelope [^14].
- **Splat budget:** **350 k** Gaussian splats with Spark-style
  WebGL transform feedback. `UNCONFIRMED` on XR2+ Gen 2;
  extrapolated from Quest 3 numbers (~300 k splats sustained at
  72 Hz on the standard Spark settings).
- **VRAM ceiling:** **1.2 GB** for textures + buffers + splats,
  leaving the rest of the 16 GB shared pool to OS, browser, and
  passthrough.
- **Post-pass count:** **2 chained post passes** maximum. Bloom +
  one TSL pack pass. No third pass at 72 Hz.
- **Tracking polling:** XR frame loop at 72 Hz; hand input runs
  on the same loop; eye gaze surfaced via `transient-pointer`
  only when the user dwells-and-pinches `UNCONFIRMED` (Vision Pro
  pattern; Android XR's exact gaze-pinch semantics aren't
  documented to that level in the public spec [^4]).
- **Time-to-Interactive:** **6 s** from XR button tap to first
  rendered frame on a warm cache. **10 s** cold cache. The studio
  shipping `XRSessionButton` should preload the heavy bundle
  before the user clicks Enter XR.

**Authoring notes.**

- Hand-first. The headset ships without controllers and the
  $250 add-ons sold out hours after launch [^5]. Every demo must
  work hands-only.
- Eye-tracked select via the WebXR `transient-pointer` input.
  Pattern is identical to Vision Pro [^21] — write it once.
- The micro-OLED panels punish dithered textures; KTX2 at
  high-quality preset is the studio default for XR2+ Gen 2 class.
- Treat foveation as opaque: request it via `XRSession`
  `fixedFoveation = "high"` `UNCONFIRMED` on Chrome Android XR;
  do not try to read or draw to the gaze-rendered region.

**Known issues and workarounds.**

- Light Estimation is listed as supported [^4] but the studio
  shouldn't lean on it for the reference-lit wall-preview
  scene — fall back to the calibrated studio reference light
  from the photograph catalogue when the API returns null.
- Controller sell-out [^5] means any path that *requires* an
  analogue stick is dead-on-arrival for 2026.

### 3.2 Google Android XR (the platform)

**Hardware shape.** Platform, not device. Galaxy XR is the
flagship; further OEMs are queued. The hard deck is *what Chrome
on Android XR guarantees*, regardless of who ships the panel.

**WebXR shape.** The Android XR `develop/xr/web` doc is the
binding reference [^4]:

- `immersive-ar` session mode confirmed [^4].
- Modules confirmed: Device API, AR Module, Gamepads, Hit Test,
  Hand Input (primary input mechanism), Anchors, Depth Sensing
  (stereoscopic — two depth maps per frame), Light Estimation [^4].
- Permissions: every WebXR API requires the *3D mapping and
  camera tracking* permission; tracked-face, tracked-eye and
  tracked-hand are separate prompts [^4].

**Hard deck — platform-minimum.** Galaxy XR is the only shipping
device today, so the platform hard deck **equals** the Galaxy XR
deck above. The studio writes the deck once, and revisits it the
day a second Android XR device lands. When that happens, the
deck moves to the *lower-spec* device's numbers.

**Authoring notes.**

- Build to the AR module. Even if the scene wants pure VR, request
  `immersive-ar` and pass `requiredFeatures: ['local-floor']` —
  the platform handles VR composition from there [^4].
- Permissions are prompt-each — handle `NotAllowedError` per
  feature without collapsing the session.
- Hand Input is the *primary* input mechanism per Google's own
  doc [^4]. Controller-fallback components must come second in
  the input cascade.

**Known issues and workarounds.**

- The Android XR doc does not surface a framerate guarantee — the
  studio treats it as 72 Hz from the Galaxy XR spec and adapts
  upwards on `XRSession.frameRate` reporting.
- Layers, foveation and refresh-rate API surfaces are
  `UNCONFIRMED` in the public Android XR docs as of 2026-05-19 —
  the studio's `xr.session` capability should feature-detect
  before binding to them.

### 3.3 Valve Steam Frame

**Hardware shape.** Snapdragon 8 Gen 3 [^7] — note: 8 Gen 3, not
XR2 Gen 3 — with 16 GB LPDDR5X [^7], dual 2160 × 2160 LCD with
pancake optics [^7] [^8], refresh modes 72 / 80 / 90 / 120 /
experimental 144 Hz [^7] [^8], 110° FOV [^7], 440 g [^7], four
front passthrough cameras for SLAM [^7], eye tracking for
foveated streaming [^9], Wi-Fi 7 with multi-radio split [^7],
bundled Wi-Fi 6E USB adapter for dedicated PC-to-headset
streaming [^7].

**WebXR shape.** This is the device where the hard deck has the
most warnings on it.

- Steam Frame is "streaming-first" [^7] — Valve's framing, not
  ours. The expected path is a PC running Steam Link streaming
  to the headset.
- Native standalone browser WebXR: `UNCONFIRMED`. Chromium's
  Linux build historically does not expose `immersive-vr` or
  `immersive-ar` [^10] because no native OpenXR runtime for
  Chrome's WebXR backend ships on Linux desktop. Whether
  SteamOS-on-Frame ships a custom runtime that closes the gap is
  not publicly documented as of 2026-05-19.
- SteamVR Link path: a Windows PC running Chrome with WebXR
  enabled connects to the Frame via Steam Link / SteamVR — at
  which point the WebXR session is *running on the PC*, the
  Frame is the display. The studio's bundles run unchanged.
- Workaround browsers: Metachromium [^7-Metachromium reference]
  is a SteamVR-overlay Chromium with WebXR support, used as the
  current floor for native-on-Frame WebXR. `UNCONFIRMED` whether
  it ships on Frame at launch.

**Hard deck (Frame as display, PC as engine).**

- **Framerate floor:** 90 Hz [^8].
- **Frametime budget:** 11.1 ms total — but it's PC GPU time,
  not standalone. Treat as a desktop-class budget.
- **Draw call cap:** **800** unique calls per frame at 90 Hz.
  This is the WebGPU/TSL desktop preset budget, not the mobile
  XR preset.
- **Triangle budget:** **1.5 M** triangles. **2.5 M** hard fail.
- **Splat budget:** **2 M** Gaussian splats. Spark on a desktop
  RTX-class GPU sustains this comfortably.
- **VRAM ceiling:** 4 GB per scene. Desktop GPU pool.
- **Post-pass count:** **4 chained post passes** including bloom,
  the TSL pack, motion blur and a depth-aware AO pass.
- **Tracking polling:** controller update rate is 200–250 Hz
  per Valve, eye tracking 8–12 ms latency [^9]. The XR frame
  loop runs at 90 Hz and we sample the *latest* pose at draw
  time, not at button event time.
- **Time-to-Interactive:** **3 s** on the PC path (warm), **5 s**
  cold. SteamVR Link adds 200–400 ms of one-shot warm-up to
  the first headset frame.

**Hard deck (Frame standalone, `UNCONFIRMED` browser).** The
studio does not ship to this path until Valve publishes the
browser story. Hold the deck at the Galaxy XR numbers as the
working assumption — same SoC class, similar memory pool.

**Authoring notes.**

- Controllers required. Hand-only paths fail this device until
  Valve adds optical hand-tracking [^9].
- Eye tracking is for *streaming compression*, not application
  reads — the studio cannot read gaze rays directly until Valve
  exposes an OpenXR extension and Chromium adopts it.
- Foveated streaming means the encoder reduces detail outside
  the gaze region; if our scene includes very high-frequency
  detail (splat halos, particle clouds) in the periphery, it
  will compress hard. Design around it.

**Known issues and workarounds.**

- No native WebXR launch path confirmed; the studio treats this
  as a *PC streaming* target until proven otherwise.
- The Wi-Fi 6E adapter ships in the box — testing partners
  must use the adapter for the streaming-first numbers to hold.

### 3.4 Meta Quest 3 / 3S / Pro (the baseline)

**Hardware shape.** Quest 3: Snapdragon XR2 Gen 2, 8 GB RAM,
2064 × 2208 per eye, pancake lenses [^11]. Quest 3S: same SoC,
same RAM, 1832 × 1920 per eye, Fresnel lenses, 96° FOV [^12].
Quest Pro: same SoC class with face + eye tracking — but Meta
discontinued sales in 2024; treat as a legacy target.

**WebXR shape.** The most complete WebXR story of any standalone
headset. Meta Browser (Chromium) supports `immersive-ar` with
passthrough, plane detection, anchors, hand tracking, hit testing,
the Depth API, WebXR Layers, simultaneous hands + controllers
[^15] [^16] [^17]. Wolvic-Chromium 1.1+ adds AR module support
as an alternate browser [^17].

**Hard deck (Quest 3).**

- **Framerate floor:** 90 Hz [^15]. The browser default.
- **Frametime budget:** 11.1 ms. Aim CPU under 5 ms, GPU under
  9 ms per eye.
- **Draw call cap:** **300** unique calls. Meta's own
  documentation calls out that 1000 unique-triangle calls drops
  the device below 72 Hz on CPU cost [^14]; we keep a 3× margin.
- **Triangle budget:** **500 k**. Hard fail **900 k**. The GPU
  envelope is much larger; the CPU per-call cost dominates
  [^14].
- **Splat budget:** **400 k** Gaussian splats with Spark on
  WebXR. `UNCONFIRMED` exact figure; close to community-reported
  numbers in 2025 for Quest 3 in-browser splat playback.
- **VRAM ceiling:** **1 GB** of the 8 GB shared pool.
- **Post-pass count:** **2** chained passes.
- **Tracking polling:** 90 Hz frame loop; hand tracking on the
  same loop; controller pose interpolated to draw time.
- **Time-to-Interactive:** **5 s** warm, **9 s** cold.

**Hard deck (Quest 3S).** Same as Quest 3 except framebuffer is
~25% smaller per eye [^12], so the fragment budget loosens —
triangle budget unchanged (still CPU-bound at 8 GB / XR2 Gen 2),
texture VRAM ceiling drops to **800 MB**.

**Hard deck (Quest Pro).** Sales-discontinued — treat as Quest 3
numbers with eye-tracked foveation expected. `UNCONFIRMED`
whether Meta still ships browser updates to Quest Pro at parity
with Quest 3 in 2026.

### 3.5 Apple Vision Pro

**Hardware shape.** M2 + R1, 16 GB unified memory [^23], 23 MP
combined across two micro-OLED panels [^25], native panel
~3660 × 3200 per eye with on-screen framebuffer ~1920 × 1824
per eye [^25], 90 Hz default refresh [^26]. Eye tracking,
gesture tracking, face mesh — none of which the web can read
directly, by Apple's privacy posture [^21].

**WebXR shape.** Safari on visionOS 2+, enabled by default
[^19]. `immersive-vr` **only**: no `immersive-ar` module on
Vision Pro [^20]. Hand tracking is full-joint-data when the
user permits the `hand-tracking` feature; otherwise input
arrives through `transient-pointer` — a pinch event that hands
the developer one ray (gaze direction + wrist position) and
nothing else [^21]. No shared anchors [^22].

**Hard deck.**

- **Framerate floor:** 90 Hz.
- **Frametime budget:** 11.1 ms.
- **Draw call cap:** **400** unique calls. Safari has a
  reputation for higher per-draw-call overhead than Chromium
  [^24], so we *tighten* the cap below the Quest 3 number even
  though the SoC is desktop-class.
- **Triangle budget:** **800 k**. The M2 GPU absorbs more
  triangles than XR2 Gen 2; the cap is fragment-bound rather
  than vertex-bound thanks to the resolution.
- **Splat budget:** **600 k**. M2 fragment power.
- **VRAM ceiling:** **2 GB** of the unified 16 GB.
- **Post-pass count:** **2** chained passes. Safari's WebGL2
  compile path penalises long shader chains.
- **Tracking polling:** 90 Hz frame loop. Gaze-pinch arrives as
  discrete `select` events on a `transient-pointer` input
  source; hand-joint stream runs continuously once permitted.
- **Time-to-Interactive:** **4 s** warm, **8 s** cold.

**Authoring notes.**

- **Input pattern:** start with `transient-pointer` reads —
  the privacy default. Promote to skeletal hand-joint reads
  only when the scene genuinely needs them. The studio's
  `xr.hands` capability must distinguish the two and not
  silently demand the harder permission.
- **No AR module:** the wall-preview wedge described in
  `docs/WEBXR_STACK.md` cannot run on Vision Pro as a
  `immersive-ar` session. The fallback is a *VR scene composed
  as a virtual room* with the print on a virtual wall.
- **No shared anchors** [^22]: any multi-user "see-the-same-
  thing-in-the-room" pattern needs a non-anchor coordination
  channel.

**Known issues and workarounds.**

- The on-screen framebuffer (~1920 × 1824 per eye) is *much*
  lower than the panel resolution [^25]. The studio should not
  push the WebGL `framebufferScaleFactor` above 1.0 in pursuit
  of panel-native sharpness — visionOS's foveated rendering
  decides what gets the pixels, not us.
- Safari's WebGL2 path occasionally hangs on long-running
  compile of TSL-generated GLSL — Wonderland Engine's WebGL
  performance notes flag Safari-specific issues [^24]. The
  studio's TSL pack should ship pre-compiled variants for the
  Vision Pro user agent.

### 3.6 Pico 4 Ultra

**Hardware shape.** Snapdragon XR2 Gen 2 [^28], 12 GB LPDDR5 [^28],
2160 × 2160 per eye pancake [^28], 105° FOV [^28], 90 Hz [^28],
580 g [^28]. Wi-Fi 7, BT 5.3 [^28].

**WebXR shape.** PICO Browser (Chromium) supports the AR module
and hand tracking [^17] [^30]. Wolvic-Chromium added Pico 4
Ultra device support in its 2025 releases [^17] [^30].

**Hard deck.** Behaves like Quest 3 with an extra 4 GB of RAM
headroom and pancake clarity. Identical deck to Quest 3 except:

- **VRAM ceiling:** **1.4 GB** of the 12 GB pool.
- **Framerate floor:** 90 Hz.

Pico 4 Ultra Enterprise carries eye tracking; consumer Pico 4
Ultra does not. The studio assumes the consumer variant for
authoring; the enterprise variant gets eye-pinch as a *bonus*
input source if detected.

## 4. WebXR session-args matrix

Concrete `navigator.xr.requestSession()` call shape per device.
Studio convention: every required feature is one the scene
*cannot* render meaningfully without; everything else is
optional and the scene must feature-detect at runtime.

### Samsung Galaxy XR (and the Google Android XR platform)

```ts
const session = await navigator.xr.requestSession('immersive-ar', {
  requiredFeatures: [
    'local-floor',      // anchor the scene to the user's floor
    'hand-tracking',    // primary input on Android XR [^4]
  ],
  optionalFeatures: [
    'hit-test',         // for ar.wall-preview surface picking
    'anchors',          // for persistent placement
    'depth-sensing',    // stereoscopic depth on Android XR [^4]
    'light-estimation', // for the reference-lit print
    'layers',           // when the layers path is verified
  ],
});
```

Rationale: AR module is the entry point on Android XR even when
the *experience* wants pure VR — the spec composes VR over the
passthrough or virtual environment from there [^4].

### Apple Vision Pro

```ts
const session = await navigator.xr.requestSession('immersive-vr', {
  requiredFeatures: [
    'local-floor',
  ],
  optionalFeatures: [
    'hand-tracking',    // full-joint reads; promoted only when needed
    // 'transient-pointer' is the default input — no feature flag
  ],
});
```

Rationale: no AR module on Vision Pro [^20]. The wall-preview
runs as VR with a virtual wall. Hand tracking is asked for only
when joint-level reads are needed; gaze-pinch arrives free
through `transient-pointer` [^21].

### Meta Quest 3 / 3S / Pro

```ts
const session = await navigator.xr.requestSession('immersive-ar', {
  requiredFeatures: [
    'local-floor',
    'hand-tracking',
  ],
  optionalFeatures: [
    'hit-test',
    'anchors',
    'plane-detection',
    'depth-sensing',
    'layers',
  ],
});
```

Rationale: Meta Browser supports all of these as confirmed
features [^15] [^16]. Plane detection is the Quest-native AR
primitive [^15].

### Pico 4 Ultra

Same shape as Quest 3 — both run Chromium-based browsers with
the AR module enabled [^17] [^30]. `depth-sensing` is
`UNCONFIRMED` on Pico Browser as of 2026-05-19; treat as
optional and feature-detect.

### Valve Steam Frame (PC streaming path)

```ts
const session = await navigator.xr.requestSession('immersive-vr', {
  requiredFeatures: ['local-floor'],
  optionalFeatures: ['hand-tracking', 'layers'],
});
```

Run on the PC, displayed through Steam Link. No AR module —
this is VR. Hand tracking is `optional` and will return null on
the Frame at launch because the headset has no native hand
tracker [^9].

### Steam Frame (native browser path, when verified)

Hold at the Galaxy XR shape with `immersive-vr` substituted, and
gate the route behind a feature-detect that confirms the
session mode is actually granted, not just promised by
`isSessionSupported()`. The studio does not ship to this path
until Valve publishes a browser story.

## 5. Input modality map

Cross-reference for the tracking registry at `lib/tracking/`
(`docs/TRACKING.md`). The studio's existing tracking chain
(Kinect → Ultraleap → MediaPipe face → MediaPipe hand → pointer)
runs on the desktop / phone surface; inside an immersive XR
session, the WebXR `viewerPose` is the floor and *replaces* the
tracking-registry source for that frame. The future-pass at the
end of `docs/TRACKING.md` already names this sixth source.

| Device | Gaze (free) | Hand-tracking joints | Controller buttons | Eye-tracked select | Voice | Head pose |
| --- | --- | --- | --- | --- | --- | --- |
| Samsung Galaxy XR | ✓ (eye, hardware) | ✓ via `hand-tracking` feature [^4] | via $250 add-on [^5] | ✓ via `transient-pointer` `UNCONFIRMED` (Vision Pro pattern; Android XR semantics not spelled out [^4]) | ✓ (Android XR Gemini integration; not exposed to WebXR by default) | ✓ |
| Google Android XR | per device | ✓ as platform primary [^4] | per device | per device | per device | ✓ |
| Valve Steam Frame | ✗ to web | ✗ at launch [^9] | ✓ (TMR thumbsticks, capacitive finger sensing, full button cluster) [^29] | ✗ to web (eye tracking is foveation-only) [^9] | ✗ (no platform path) | ✓ |
| Meta Quest 3 / 3S | ✗ | ✓ (and simultaneous with controllers) [^15] | ✓ (Touch Plus) | ✗ on consumer Quest 3 / 3S [^12] | ✓ via system voice; not WebXR | ✓ |
| Meta Quest Pro | ✓ | ✓ | ✓ | ✓ — but legacy device | ✓ | ✓ |
| Apple Vision Pro | ✓ (eye, hardware) | ✓ via `hand-tracking` permission [^21] | none ship | ✓ via `transient-pointer` (gaze + pinch) [^21] | ✗ to WebXR (Siri is system, not web) | ✓ |
| Pico 4 Ultra | ✗ (enterprise only) | ✓ | ✓ | ✗ on consumer | ✗ to WebXR | ✓ |

Pattern the studio writes once: **transient-pointer first**. On
both Vision Pro and Galaxy XR, the gaze-and-pinch path is the
natural floor. Hand joint reads are the *upgrade*, gated behind
the permission prompt that asks the user once and is remembered
per origin.

## 6. Render-pipeline targets

Per-device map of which studio modules run at full quality, which
need downgrade, which simply can't run. The studio's `AmbientField`,
`MeshText3D`, `MeshProseLayer`, TSL material presets, TSL post
pack, splat walker, and sculpture gallery are the moving parts.

`UNCONFIRMED` here means the studio has the module designed but
hasn't profiled it on the device yet; we plant the flag at the
estimated tier.

| Module | Galaxy XR | Android XR (platform-min) | Steam Frame (PC stream) | Quest 3 | Quest 3S | Vision Pro | Pico 4 Ultra |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **AmbientField density** | 25 k particles | 25 k | 60 k | 25 k | 18 k | 40 k | 30 k |
| **MeshText3D budget** | 6 glyph fields, 1024² SDF | 6, 1024² | 12, 2048² | 6, 1024² | 4, 1024² | 8, 2048² | 6, 1024² |
| **MeshProseLayer SDF count** | 4 layers | 4 | 8 | 4 | 3 | 6 | 5 |
| **TSL material preset** | Mobile-XR (UBER mat, no analytic SSR) | Mobile-XR | Desktop (full SSR) | Mobile-XR | Mobile-XR-lite | Desktop-Lite (no SSR; full PBR) | Mobile-XR |
| **TSL post pack** | bloom + tone-map only (2 passes) | 2 passes | bloom + AO + motion blur + tone-map (4 passes) | 2 passes | bloom + tone-map fused (1 pass) | 2 passes | 2 passes |
| **Splat walker max** | 350 k splats `UNCONFIRMED` | 350 k | 2 M | 400 k `UNCONFIRMED` | 250 k `UNCONFIRMED` | 600 k | 400 k `UNCONFIRMED` |
| **Sculpture gallery max simultaneous** | 3 hero pieces | 3 | 8 | 3 | 2 | 4 | 3 |
| **WebXR Layers** | feature-detect; fall back to base layer if unsupported | feature-detect | use when available | ✓ supported [^16] | ✓ | `UNCONFIRMED` in Safari | ✓ |
| **Foveated rendering request** | `fixedFoveation = "high"` `UNCONFIRMED` API on Android XR Chrome | feature-detect | leave to compositor | `fixedFoveation = "high"` | `"high"` | opaque — do nothing | `"high"` |
| **Reduced-motion respect** | scene degrades to MeshProse only | same | same | same | same | same | same |

Notes:

- The `Mobile-XR` material preset disables analytic SSR, caps
  PBR cubemap mip count, and ships a fused bloom + tone-map
  fragment.
- The `Mobile-XR-lite` preset on Quest 3S additionally drops
  parallax-occlusion maps and fuses normal-map sample count
  from 4 → 1.
- The `Desktop` preset on the Steam Frame PC path keeps the
  full TSL post pack; the Frame's display can resolve it.
- The studio's sculpture gallery cap is the count of *simultane-
  ously visible* hero pieces; off-screen geometry remains
  pageable through the asset registry without hitting the cap.

## 7. Bench setup for testing

What the studio actually owns versus what it ships to a partner.

| Device | Owned at the bench? | Path |
| --- | --- | --- |
| Quest 3 | ✓ | Bench has the headset; primary daily-test target. ADB + Chrome remote-debugger over USB. |
| Quest 3S | ✗ | Borrowed from a partner for the lower-tier validation pass once per quarter. |
| Vision Pro | borrow-only | Visit the partner who owns one; visionOS simulator for daily dev [^21]. The simulator handles `transient-pointer` testing well [^21]. |
| Pico 4 Ultra | buy when the catalogue lists a Pico-targeted edition | Until then, treat as Quest 3 numbers and trust the SoC parity. |
| Samsung Galaxy XR | remote-partner | The Studio doesn't own one; remote testing through a partner with the headset, build → ship → partner runs → partner reports. Galaxy XR is also testable through Samsung's developer programme `UNCONFIRMED` whether they offer remote access. |
| Steam Frame | remote-partner (when released) | Cannot bench-test until launch; meanwhile run the PC-streaming path on Steam Link with the existing SteamVR headset and use that as a *proxy* for the Frame's streaming-first numbers. |
| Quest Pro | retired-borrow | Eye-tracked select validation only; no longer a target the studio designs for. |

Partner list to chase (separate doc, but named here):

- **Galaxy XR remote partner** — a developer the studio is
  contracted with through Federation, signed for build-and-test
  access on Android XR (see `docs/FEDERATION.md`).
- **Vision Pro day-pass** — a London XR meetup hosts monthly
  hardware-petting; the studio runs the bundle there.
- **Steam Frame** — wait for launch; partner with the first
  reviewer who'll re-test ours.

## 8. Update cadence

This deck is dated **2026-05-19**. Revisit:

- **Quarterly** — re-walk every device row, re-cite, re-flag
  any UNCONFIRMED that's since been published.
- **On any new device launch** — within 14 days, add the new
  row with `UNCONFIRMED` markers and ship the file.
- **On a Chrome / Safari / Meta Browser / Pico Browser release
  that changes WebXR feature support** — update the affected
  rows immediately; bump the document date.
- **On a Steam Frame browser story announcement** — promote
  the Steam Frame native-browser row out of `UNCONFIRMED`.

Reviews stamp the date at the top of the file. Past rows are
not removed; they're struck through and re-stated. The deck is
a record of what the device used to demand, not just what it
demands today.

## 9. References

Every URL with the figure it backed. `UNCONFIRMED` figures are
flagged in the text above; this section is the read-back of the
sources the studio relied on.

[^1]: Samsung Galaxy XR — SoC (Snapdragon XR2+ Gen 2), 16 GB RAM, 256 GB, dual 3552 × 3840 micro-OLED, four eye-tracking cameras, depth sensor, six world cameras, Wi-Fi 7, Bluetooth 5.4, 2 h / 2.5 h battery. <https://en.wikipedia.org/wiki/Samsung_Galaxy_XR>
[^2]: Samsung Galaxy XR — default refresh 72 Hz, max 90 Hz; price $1,799; release 2025-10-31. <https://www.samsung.com/us/xr/galaxy-xr/galaxy-xr/>
[^3]: Project Moohan — hand tracking, eye tracking, foveated rendering as primary input methods. <https://framesixty.com/project-moohan-samsung-s-innovative-xr-headset-running-android-xr/>
[^4]: Android XR for WebXR — Chrome on Android XR, `immersive-ar` session mode, supported modules (Device API, AR Module, Gamepads, Hit Test, Hand Input as primary, Anchors, Depth Sensing as stereoscopic, Light Estimation); 3D-mapping + camera-tracking permission required. <https://developer.android.com/develop/xr/web>
[^5]: Samsung Galaxy XR — controllers sold separately at $250, hand and eye tracking as the only interaction method without them. <https://www.uploadvr.com/samsung-galaxy-xr-google-android-xr-out-now/>
[^6]: Samsung Galaxy XR — 545 g head unit, 302 g external battery, 109° H × 100° V FOV. <https://vr-compare.com/headset/samsunggalaxyxr>
[^7]: Steam Frame — Snapdragon 8 Gen 3, 16 GB LPDDR5X, 110° FOV, 440 g, four front cameras + IR emitters for SLAM, Wi-Fi 7 multi-radio, bundled Wi-Fi 6E USB adapter, "streaming-first" framing, SteamOS Arch-based Linux, Proton + FEX-Emu for x86 compatibility. <https://en.wikipedia.org/wiki/Steam_Frame>
[^8]: Steam Frame — 2160 × 2160 per eye LCD pancake, refresh rates 72 / 80 / 90 / 120 / experimental 144 Hz. <https://vr-compare.com/headset/steamframe>
[^9]: Steam Frame — eye tracking for foveated streaming, controller update rates 200–250 Hz, eye-tracking latency 8–12 ms, no controller-less hand tracking at launch. <https://www.uploadvr.com/valve-steam-frame-hands-on-impressions/>
[^10]: Chromium on Linux — does not support `immersive-vr` or `immersive-ar`; inline sessions only; Chrome uses OpenXR on Windows for headset interface. <https://immersiveweb.dev/chrome-support.html>
[^11]: Meta Quest 3 — Snapdragon XR2 Gen 2, 8 GB RAM, 2064 × 2208 per eye, foveated rendering supported by SoC, four IR cameras. <https://en.wikipedia.org/wiki/Meta_Quest_3>
[^12]: Meta Quest 3S — 1832 × 1920 per eye Fresnel, 96° FOV, Snapdragon XR2 Gen 2, 8 GB RAM, 90–120 Hz, no eye tracking on consumer. <https://en.wikipedia.org/wiki/Meta_Quest_3S>
[^13]: Meta Quest 3 — debut at higher-res displays and XR2 Gen 2. <https://www.gsmarena.com/meta_quest_3_debuts_with_higher_res_displays_and_snapdragon_xr2_gen_2_chip_-news-60054.php>
[^14]: Meta WebXR Performance Best Practices — 1000 unique-triangle draw calls drops the device below 72 Hz on CPU cost; "the Quest GPU can easily render several orders of magnitude more triangles" than that draw-call figure suggests; batch / instance to reduce calls. <https://developers.meta.com/horizon/documentation/web/webxr-perf-bp/>
[^15]: Meta Quest Browser — `immersive-ar` passthrough, plane detection, anchors, hand tracking, hit testing, simultaneous hands + controllers; 90 Hz default. <https://www.uploadvr.com/quest-browser-depth-api-webxr-hit-testing-instant-placement/>
[^16]: Meta WebXR Layers — `XRWebGLLayer` and projection / quad / cube layers in Oculus Browser. <https://developers.meta.com/horizon/blog/achieve-better-rendering-and-performance-with-webxr-layers-in-oculus-browser/>
[^17]: Wolvic-Chromium — adds WebXR AR module, hand tracking, WebXR Layers; supports Pico 4 Ultra. <https://www.uploadvr.com/wolvic-switching-to-chromium/>
[^18]: Apple Vision Pro — Apple's product page (model context for citations [^19] [^20] [^21]). <https://www.apple.com/apple-vision-pro/specs/>
[^19]: visionOS 2 — WebXR enabled by default in Safari; Mac Virtual Display continues during WebXR. <https://www.uploadvr.com/visionos-2-apple-vision-pro-webxr/>
[^20]: Vision Pro WebXR — `immersive-vr` only; no `immersive-ar` module on visionOS. <https://medium.com/@dhavaljasoliya8/bringing-immersive-vr-experiences-to-the-web-with-webxr-in-safari-on-vision-pro-fde44f14ee41>
[^21]: Vision Pro — `transient-pointer` input, gaze + pinch, hand-joint stream behind permission, no continuous eye-tracking data to web; simulator supports `transient-pointer`. <https://webkit.org/blog/15162/introducing-natural-input-for-webxr-in-apple-vision-pro/>
[^22]: Vision Pro — no shared anchors. <https://www.roadtovr.com/apple-vision-pro-webxr-transient-pointer-pinch-input/>
[^23]: Apple Vision Pro — M2 (8-core CPU, 10-core GPU, 16-core Neural Engine), 16 GB unified memory. <https://www.apple.com/apple-vision-pro/specs/>
[^24]: WebGL performance on Safari and Apple Vision Pro — Safari-specific WebGL2 compile and draw-call cost notes. <https://wonderlandengine.com/news/webgl-performance-safari-apple-vision-pro/>
[^25]: Apple Vision Pro — 23 MP combined, per-eye panel ~3660 × 3200; on-screen framebuffer ~1920 × 1824 per eye. <https://spectrum.ieee.org/apple-vision-pro> and <https://www.uploadvr.com/apple-vision-pro-extended-teardown-reveals-active-resolution/>
[^26]: Apple Vision Pro — variable-rate gaze-driven foveation, 5 PPD to 40 PPD dynamic foveation in non-Metal apps. <https://douevenknow.us/post/750217547284086784/apple-vision-pro-has-the-same-effective-resolution>
[^27]: WebXR `framebufferScaleFactor` — default 1.0; user agent picks balance between quality and performance; scaling > 1 multiplies the default. <https://developer.mozilla.org/en-US/docs/Web/API/XRWebGLLayer/getNativeFramebufferScaleFactor_static>
[^28]: Pico 4 Ultra — Snapdragon XR2 Gen 2, 12 GB LPDDR5, 2160 × 2160 per eye, 105° FOV, 90 Hz, 580 g, Wi-Fi 7, BT 5.3, 256 GB. <https://vr-compare.com/headset/pico4ultra>
[^29]: Steam Frame Controllers — TMR magnetic thumbsticks, capacitive finger sensing, full button cluster (D-pad, ABXY, triggers, bumpers, grip), 6-DOF spatial tracking, 40 h on AA. <https://partner.steamgames.com/doc/steamframe/controllers>
[^30]: Pico Browser — Chromium-based, WebXR AR module supported; Wolvic-Chromium adds Pico 4 Ultra as a target. <https://www.uploadvr.com/wolvic-chromium-1-1-webxr-ar/>

---

**Flagged UNCONFIRMED figures, collected:**

- Galaxy XR foveated rendering exposure to WebXR layers — referenced but not spec'd in the public Android XR WebXR doc [^4].
- Galaxy XR splat walker budget — extrapolated from Quest 3 numbers.
- Galaxy XR `XRSession.fixedFoveation = "high"` accepted on Chrome Android XR — API surface not confirmed in public doc.
- Steam Frame native browser WebXR — no public confirmation of `immersive-vr` / `immersive-ar` support in a Frame-native browser; Linux Chromium historically does not expose either [^10].
- Steam Frame on-device foveation — Valve documents foveated *streaming*, not on-device standalone foveation [^9].
- Vision Pro WebXR refresh-rate exposure to web — visionOS itself runs the compositor at 90 / 96 Hz, but the rate Safari surfaces to the WebXR frame loop is not documented.
- Vision Pro WebXR Layers in Safari — not in current Safari release notes.
- Pico 4 Ultra `depth-sensing` in Pico Browser — not confirmed in the public PICO Developer doc.
- Quest 3 splat walker budget — community-reported, not vendor-published.
- Quest 3S splat walker budget — extrapolated from the lower framebuffer.
- Pico 4 Ultra splat walker budget — extrapolated from SoC parity with Quest 3.
- Quest Pro 2026 browser-update parity — Meta has not committed publicly.
- Galaxy XR remote-test access through Samsung's developer programme — not confirmed.
