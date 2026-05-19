import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const ext = "underline underline-offset-4 hover:text-pink-200";

function WebXRLocomotionBody() {
  return (
    <>
      <p>
        Motion sickness is the load-bearing constraint of every WebXR
        scene the studio has shipped. It is the constraint everything
        else negotiates around. If a visitor puts the headset on, takes
        three steps with the wrong locomotion pattern, and feels their
        inner ear betraying them, the rest of the gallery does not
        matter. They will set the headset down on the bench. They will
        not pick it up again that day. They will tell a friend.
        Locomotion is the threshold the scene either survives or
        doesn&rsquo;t, and a tutorial that pretends otherwise is doing
        the reader a disservice.
      </p>

      <p>
        This tutorial is the studio&rsquo;s working position on the
        five canonical WebXR locomotion patterns, the small set of
        research papers behind those patterns, and the specific
        implementation the framework defaults to in{" "}
        <Link href="/atelier/splat-walk" className={ext}>
          /atelier/splat-walk
        </Link>{" "}
        and{" "}
        <Link href="/atelier/sculpture-gallery" className={ext}>
          /atelier/sculpture-gallery
        </Link>
        . The editorial sections set out the trade-off and the
        literature. The Test Chamber sheet below is the
        workshop-Dimona register: walk into the framework with a scene
        you want to make walkable, follow the steps, get teleport
        working on Quest, Vision Pro and Pico in an afternoon.
      </p>

      <h3>The five canonical patterns</h3>

      <p>
        Every WebXR locomotion pattern on the market is a different
        trade between two things the visitor wants and cannot have at
        the same time: <em>agency</em>, the feeling that the body is
        the one doing the walking, and <em>comfort</em>, the
        inner-ear&rsquo;s permission to keep wearing the headset.
        Patterns optimised for one tend to cost the other. The five
        below are the canon the studio works from.
      </p>

      <p>
        <strong>Teleport</strong> is the discrete-jump pattern.
        Visitor points the controller, the ray draws a parabola, a
        target indicator settles on a walkable surface, the trigger
        commits and the visitor is now standing there. No translation
        animation between the two positions. Lowest motion-sickness
        risk in the canon, because the visual system never sees the
        contradictory motion the inner ear is not feeling. Used as the
        primary locomotion in Valve&rsquo;s Half-Life: Alyx (2020),
        Polyarc&rsquo;s Moss (2018), Vanishing Realms (2016), and the
        BTS modes of Beat Saber. The studio defaults to teleport for
        every WebXR scene that doesn&rsquo;t have a specific reason to
        use something else.
      </p>

      <p>
        <strong>Smooth walk</strong>, sometimes called forward
        locomotion or thumbstick walking, is the analog-stick or
        controller-direction continuous translation. The visitor
        pushes the stick forward and the scene drifts past them at
        constant velocity. Highest agency cost in the canon: it is the
        closest WebXR pattern to first-person desktop gaming, which is
        exactly why it is also the highest-comfort cost. The
        vection&mdash;the visual sensation of self-motion in the
        absence of vestibular confirmation&mdash;is the specific
        mechanism that makes a fraction of users feel ill within
        seconds. Studios that ship smooth walk almost always pair it
        with a vignette during motion (see Fernandes &amp; Feiner,
        below).
      </p>

      <p>
        <strong>Dash</strong> is the fixed-distance short hop, a
        compromise between teleport and smooth walk. Press a button,
        the camera translates a metre or two in the controller&rsquo;s
        forward direction over ~150&nbsp;ms, then stops. Used in
        Sairento and a number of WebXR action titles. Less
        nauseating than smooth walk because the translation event is
        bounded and predictable; more embodied than teleport because
        the visitor sees the world slide past once per hop. The
        framework does not currently ship a dash binding by default
        but the wiring is the same as teleport with a different
        commit handler.
      </p>

      <p>
        <strong>Snap-turn</strong> is the rotational equivalent of
        teleport: instead of smoothly rotating the view when the
        thumbstick is pushed sideways, the view jumps in fixed
        angular increments (~30&deg; is the studio&rsquo;s default;
        20-45&deg; is the comfortable range across the literature).
        Pairs with any translation pattern; in practice it is what
        every shipping WebXR title with teleport also ships. Smooth
        rotation is one of the more reliable nausea triggers for the
        susceptible-third of the population, so the framework treats
        snap-turn as the default rotational binding.
      </p>

      <p>
        <strong>Grab-and-pull</strong> is the climbing /
        world-grab pattern: the visitor reaches out, closes the grip
        on a controller, and the world moves with the hand. Climbey
        (2017) and the climbing sections of Sairento are the
        load-bearing examples. Counter-intuitively low motion-sickness
        risk, because the visitor&rsquo;s hand position grounds them
        in the same way a ladder rung does in real life&mdash;the
        proprioceptive feedback from the arm matches the visual
        translation of the world, and the inner-ear has nothing to
        complain about. Niche, but worth knowing about for scenes that
        have a natural climbing affordance.
      </p>

      <h3>The research</h3>

      <p>
        The studio&rsquo;s defaults are not arbitrary. They are read
        off four decades of VR comfort research, four papers of which
        are load-bearing enough to cite directly.
      </p>

      <p>
        Hoffman et&nbsp;al, &ldquo;Vergence&ndash;accommodation
        conflicts hinder visual performance and cause visual
        fatigue&rdquo; (Journal of Vision, 2008), is the canonical
        paper on the conflict between where the eyes converge (the
        virtual object&rsquo;s apparent depth) and where they
        accommodate (the headset&rsquo;s fixed focal plane). This is
        the substrate problem under everything else: even with
        perfect locomotion, sustained VR work produces visual fatigue
        in proportion to how much the visitor&rsquo;s eyes are forced
        to disagree with themselves. Light-field displays partially
        solve it; current consumer headsets do not. Plan scene
        durations accordingly.
      </p>

      <p>
        Stanney et&nbsp;al, &ldquo;Cybersickness is not simulator
        sickness&rdquo; (Proceedings of the Human Factors and
        Ergonomics Society, 1997), and the follow-up framework work
        in 1998, established that the nausea produced by head-mounted
        displays is a distinct syndrome from the simulator sickness
        of fixed-base flight trainers. The mechanism is vection: the
        visual system reporting self-motion the vestibular system is
        not confirming. Smooth-walk locomotion is a vection generator
        by design. Teleport bypasses the mechanism entirely.
      </p>

      <p>
        Fernandes &amp; Feiner, &ldquo;Combating VR Sickness through
        Subtle Dynamic Field-Of-View Modification&rdquo; (IEEE 3DUI,
        2016), is the paper behind the vignette-during-motion
        mitigation. The headline finding: dynamically reducing the
        field of view when the visitor is in motion, then restoring
        it when they are still, measurably reduces self-reported
        sickness without the subjects consciously noticing the
        vignette. Almost every smooth-walk WebXR title that ships
        today uses some version of this mitigation.
      </p>

      <p>
        Stanford&rsquo;s Virtual Human Interaction Lab (Bailenson et
        al) has published a long line of work on VR comfort and
        social presence; their public-facing materials are the
        clearest plain-language summary of where the field actually
        stands, and any tutorial that points readers at one starting
        point should point them at the VHIL publications page. The
        2019 framework material is particularly useful for scene
        designers because it tabulates the comfort cost of specific
        scene-design choices rather than only locomotion patterns.
      </p>

      <p>
        Foveated rendering deserves a mention as the platform-side
        mitigation. The Meta Quest 3 and Vision Pro both ship
        eye-tracked or fixed foveation; the framework gets it for free
        because it&rsquo;s a renderer-level optimisation invisible to
        scene code. It doesn&rsquo;t directly reduce motion sickness,
        but the framerate headroom it buys lets the scene hold the
        72/90&nbsp;Hz floor that is itself the most important comfort
        variable. See{" "}
        <Link href="/docs/WEBXR-DEVICE-TARGETS" className={ext}>
          docs/WEBXR-DEVICE-TARGETS
        </Link>{" "}
        for the per-device numbers.
      </p>

      <h3>The framework&rsquo;s stance</h3>

      <p>
        The studio defaults to <strong>teleport plus snap-turn</strong>
        for every WebXR scene, with smooth walk available as an opt-in
        toggle and dash + grab-and-pull treated as per-scene
        decisions. Four reasons.
      </p>

      <p>
        First, teleport works on every WebXR headset the framework
        targets without per-device tuning: Quest 3 / 3S / Pro,
        Vision Pro, Pico 4 Ultra, Samsung Galaxy XR. The same
        controller-trigger binding is the natural primary input on
        every one of them. Vision Pro&rsquo;s transient-pointer
        input maps onto a pinch+release; the React Three XR runtime
        normalises the two into the same ray-and-commit event.
      </p>

      <p>
        Second, the motion-sickness floor is zero. The studio cannot
        promise a visitor that smooth-walk won&rsquo;t make them ill;
        the studio can promise that teleport won&rsquo;t. That
        promise is the difference between a gallery visitor who comes
        back tomorrow and a gallery visitor who hands the headset to
        a friend and leaves.
      </p>

      <p>
        Third, the binding is honest. The trigger is the primary
        action on every shipping WebXR controller, and pointing-and-
        committing is the gesture the visitor will already make for
        UI selection. Reusing the gesture for locomotion costs no
        additional learning.
      </p>

      <p>
        Fourth, the smooth-walk option exists for the visitors who
        tolerate it, because some do, and that population overlaps
        with the population most likely to want extended sessions.
        Hide it behind the toolbar&rsquo;s opt-in toggle, gate the
        vignette on motion, and document it clearly. Don&rsquo;t
        default it on.
      </p>

      <p>
        The Test Chamber sheet below is the practical version of all
        of the above: the materials, the imports, the seven steps the
        framework asks of a scene that wants WebXR locomotion, and
        the four troubleshooting symptoms the studio has actually hit
        in production.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "webxr-locomotion-patterns",
  title:
    "WebXR locomotion patterns — teleport, smooth-walk, dash, snap-turn, and the motion-sickness research",
  date: "2026-05-19",
  kind: "tutorial",
  excerpt:
    "The studio's working position on the five canonical WebXR locomotion patterns, the motion-sickness research behind them, and the framework's reasons for defaulting to teleport plus snap-turn. Plus the seven-step procedure for adding WebXR locomotion to any scene built on SceneStage, tested against the splat walker and the sculpture gallery on Quest, Vision Pro and Pico.",
  Body: WebXRLocomotionBody,
  related: [
    {
      href: "/articles/cell-shaded-graphics-in-vr",
      label: "Article — Cell-shaded graphics in VR",
      note: "Sibling VR article on the visual register the framework prefers for stereo display.",
    },
    {
      href: "/articles/low-poly-graphics-in-vr",
      label: "Article — Low-poly graphics in VR",
      note: "The companion article on geometry budgets for WebXR scenes.",
    },
    {
      href: "/atelier/splat-walk",
      label: "Atelier — Splat walk",
      note: "Live example. The teleport pattern in production on a Gaussian-splat scene.",
    },
    {
      href: "/atelier/sculpture-gallery",
      label: "Atelier — Sculpture gallery",
      note: "Live example. Teleport plus pick-up-and-rotate on a walkable gallery.",
    },
    {
      href: "https://github.com/dimonauk/_3DPOV/blob/claude/skeleton-build/docs/WEBXR-DEVICE-TARGETS.md",
      label: "docs/WEBXR-DEVICE-TARGETS",
      note: "Per-device caveats — Quest, Vision Pro, Pico, Galaxy XR, Steam Frame.",
    },
  ],
  furtherReading: [
    {
      href: "https://www.gdcvault.com/play/1026329/-Half-Life-Alyx-Locomotion",
      label: "Valve — Half-Life: Alyx locomotion talk (GDC Vault)",
      note: "Valve's own writeup of the locomotion modes that shipped in Alyx.",
    },
    {
      href: "https://www.roadtovr.com/vr-locomotion-methods-explained/",
      label: "Road to VR — VR locomotion methods roundup",
      note: "Community survey of the canon. Reasonable starting point.",
    },
    {
      href: "https://ieeexplore.ieee.org/document/7460053",
      label: "Fernandes & Feiner 2016 — Subtle Dynamic FOV Modification (IEEE)",
      note: "The vignette-during-motion paper. The single most-cited mitigation in the literature.",
    },
    {
      href: "https://stanfordvr.com/publications/",
      label: "Stanford VHIL — publications",
      note: "Bailenson lab. The plain-language summary of where VR comfort research actually stands.",
    },
    {
      href: "https://github.com/dimonauk/_3DPOV/blob/claude/skeleton-build/docs/WEBXR-GAME-FRAMEWORK.md",
      label: "docs/WEBXR-GAME-FRAMEWORK",
      note: "The framework's own landing page — input router, locomotion, post-pass policy.",
    },
    {
      href: "https://docs.pmnd.rs/xr/getting-started/introduction",
      label: "@react-three/xr documentation",
      note: "The runtime the framework wraps. TeleportTarget, useXRControllerLocomotion, XROrigin.",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    time: "an afternoon — ~2 h of wiring per scene, plus 30 min of headset testing per device",
    difficulty: "intermediate",
    cost: "free — every dependency is already in the monorepo",
    prerequisites: [
      "A scene already running inside SceneStage in 2D mode — see /atelier/splat-walk for the minimum viable wrapper.",
      "Comfortable with React Three Fiber's JSX scene graph — you should know how to add a <mesh> and a <planeGeometry> without looking it up.",
      "Access to at least one WebXR headset to test on. Quest 3 is the cheapest baseline; Vision Pro is the headline edge case; Pico 4 Ultra is the third comparator the framework targets.",
    ],
    supplies: {
      materials: [
        {
          name: "An existing R3F scene wrapped in <SceneStage webxr>",
          note: "If you don't have one yet, copy components/splat-walker/SplatWalkScene.tsx as the starting point — it's the minimum viable WebXR scene the framework ships.",
        },
        {
          name: "A walkable floor mesh",
          note: "Splats and other geometry-less scene content don't raycast. Even if your scene visually has a floor, you need a real mesh under it for the teleport ray to hit.",
        },
      ],
      tools: [
        {
          name: "A WebXR-capable headset",
          note: "Quest 3 / 3S / Pro, Vision Pro, Pico 4 Ultra are the framework's three test devices. See docs/WEBXR-DEVICE-TARGETS.md for the hard deck.",
          suppliers: [
            {
              name: "Meta Quest 3",
              url: "https://www.meta.com/gb/quest/quest-3/",
              price: "~£479",
            },
            {
              name: "Apple Vision Pro",
              url: "https://www.apple.com/uk/apple-vision-pro/",
              price: "~£3,499",
            },
            {
              name: "Pico 4 Ultra",
              url: "https://www.picoxr.com/global/products/pico4-ultra",
              price: "~£529",
            },
          ],
        },
        {
          name: "A Chromium-based browser on the headset",
          note: "Meta Browser (Quest), Pico Browser, and Wolvic-Chromium on either. Vision Pro uses Safari and exposes WebXR through a different input model — the framework normalises both.",
        },
      ],
      provisions: [
        {
          name: "ngrok or Tailscale Funnel for HTTPS to localhost",
          isOptional: true,
          note: "WebXR requires HTTPS. The headset browser will not enter a session on http://. The studio uses Tailscale Funnel to expose the Next.js dev server with a real TLS cert.",
        },
      ],
    },
    software: [
      {
        name: "Next.js (the studio's app framework)",
        version: "≥ 15",
        url: "https://nextjs.org/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "The framework runs on Next 15. WebXR runs inside a client component — don't forget the \"use client\" directive at the top of the scene file.",
      },
      {
        name: "@react-three/xr",
        version: "≥ 6.6",
        url: "https://github.com/pmndrs/xr",
        cost: "open-source",
        platforms: ["web"],
        note: "Already a dependency of the monorepo. Provides <XR>, <XROrigin>, <TeleportTarget>, useXRControllerLocomotion.",
      },
      {
        name: "@react-three/fiber",
        version: "≥ 8",
        url: "https://github.com/pmndrs/react-three-fiber",
        cost: "open-source",
        platforms: ["web"],
        note: "The R3F runtime SceneStage wraps. Already a dependency.",
      },
    ],
    dependencies: [
      {
        name: "@react-three/xr",
        version: "^6.6.29",
        registry: "pnpm",
        url: "https://www.npmjs.com/package/@react-three/xr",
        purpose: "WebXR session, controllers, teleport, locomotion hooks.",
      },
      {
        name: "three",
        version: "^0.171",
        registry: "pnpm",
        url: "https://www.npmjs.com/package/three",
        purpose: "Three.js runtime — the renderer everything else builds on.",
      },
    ],
    steps: [
      {
        title: "Wrap the scene in <SceneStage webxr>",
        body:
          "The framework's dual-mode wrapper is the only entry point. Pass `webxr` to enable the XR session, and any children render identically in 2D on a desktop and in stereo inside a session.\n\n```tsx\nimport SceneStage from \"components/xr-scene/SceneStage\";\n\nexport function MyScene() {\n  return (\n    <SceneStage\n      label=\"My scene\"\n      webxr\n      camera={{ position: [0, 1.6, 3], fov: 50 }}\n      height=\"80vh\"\n    >\n      {/* scene children go here */}\n    </SceneStage>\n  );\n}\n```\n\nThe `label` is announced to screen readers and shown on the toolbar's left pill. The default camera position uses 1.6 m height because that is the eye-level the WebXR runtime initialises the headset rig at — starting the 2D camera there keeps the desktop view and the headset view roughly aligned.",
      },
      {
        title: "Add a walkable floor mesh with TeleportTarget",
        body:
          "The teleport ray needs a mesh to land on. Splats and other geometry-less content do not raycast, and even scenes that visually have a floor often have it baked into a single hero mesh that the ray can't read at the resolution teleport needs. Wrap an explicit floor plane in `<TeleportTarget>`.\n\n```tsx\nimport { TeleportTarget } from \"@react-three/xr\";\nimport type { Vector3 } from \"three\";\n\nfunction TeleportGround({ side = 16 }: { side?: number }) {\n  const onTeleport = (point: Vector3) => {\n    // Clamp to the playable area. TeleportTarget mutates the\n    // Vector3 in place after this callback returns.\n    const half = side / 2 - 0.4;\n    point.set(\n      Math.max(-half, Math.min(half, point.x)),\n      0,\n      Math.max(-half, Math.min(half, point.z)),\n    );\n  };\n  return (\n    <TeleportTarget onTeleport={onTeleport}>\n      <mesh rotation-x={-Math.PI / 2}>\n        <planeGeometry args={[side, side]} />\n        <meshBasicMaterial transparent opacity={0} depthWrite={false} />\n      </mesh>\n    </TeleportTarget>\n  );\n}\n```\n\nNote the material: `transparent opacity={0} depthWrite={false}`. The studio learned the hard way that `visible={false}` removes the mesh from the raycaster entirely. Transparent + no depth write keeps the mesh in the ray's path while keeping it invisible to the visitor.",
      },
      {
        title: "Let the standard controllers carry the teleport ray",
        body:
          "The good news: you do not have to wire the teleport ray manually. The `<XR>` provider inside SceneStage configures the default controller models, and `@react-three/xr` automatically routes the controller ray onto any `TeleportTarget` in the scene. The visitor points the right controller, the parabola draws itself, the trigger commits.\n\nWhat you do need to be aware of is the per-device input difference. Quest and Pico expose physical controllers with triggers and thumbsticks. Vision Pro exposes `transient-pointer` input — the pinch-release that fires only at the moment the visitor pinches, with no persistent ray. The React Three XR runtime normalises the two: the teleport target receives the same event shape. You should not branch on device for the teleport path.\n\nFor scenes that need explicit ray styling — a brand colour on the parabola, a custom landing indicator — see the @react-three/xr `<XRControllerRayHand>` and `<TeleportPointer>` components in the package docs.",
      },
      {
        title: "Configure snap-turn on the locomotion hook",
        body:
          "Snap-turn is the rotational pattern the studio ships with every translation pattern. The framework wires it through `useXRControllerLocomotion` inside `components/xr-scene/XRCameraRig.tsx`; for most scenes you do not need to touch it.\n\nWhen you do need to override the snap angle — a tight scene where 30° feels coarse, or an open scene where 45° reads better — the hook accepts a configuration object on the rotation axis:\n\n```tsx\nimport { useXRControllerLocomotion } from \"@react-three/xr\";\nimport type { Group } from \"three\";\nimport { useRef } from \"react\";\n\nfunction MyRig() {\n  const originRef = useRef<Group>(null);\n  useXRControllerLocomotion(\n    originRef,\n    { speed: 1.2 },             // translation (smooth-walk; opt-in)\n    { type: \"snap\", degrees: 30 }, // rotation — snap-turn, 30° default\n  );\n  return null;\n}\n```\n\nValid `degrees` values across the comfort literature are 20–45. The framework default is 30; the studio has never had a comfort report at that setting. Smooth rotation — `{ type: \"smooth\" }` — is available but the studio does not recommend it. Smooth rotation is the single most reliable nausea trigger in the canon.",
      },
      {
        title: "Expose smooth-walk as an opt-in toggle",
        body:
          "Smooth walk is the high-agency / high-cost pattern. Don't default it on. The framework's pattern is to add an opt-in toggle to the SceneToolbar that the visitor can flip after they've entered the session and felt the room.\n\nThe SceneToolbar exposes the ambient toggle by default; for a per-scene smooth-walk toggle, lift the state in your scene wrapper and pass it down to the XRCameraRig via SceneStage's `camera` prop or via a custom rig you mount yourself.\n\n```tsx\nconst [smoothWalk, setSmoothWalk] = useState(false);\n\n// pass smoothWalk into your custom rig:\n<XRCameraRig\n  position={[0, 0, 1.6]}\n  locomotion={smoothWalk}\n  speed={smoothWalk ? 1.0 : 0}\n/>\n```\n\nThe studio's preferred surface for the toggle itself is a small pill on the toolbar with the label `Smooth walk · off`; clicking it flips to `Smooth walk · on`. Visitors who tolerate it find it; visitors who don't never see it triggered.",
      },
      {
        title: "Gate a comfort vignette on motion",
        body:
          "If you ship smooth walk, ship the Fernandes &amp; Feiner mitigation with it: a vignette that engages only while the visitor is translating, then releases when they stop. The framework's vignette effect lives in `lib/tsl-post/effects/vignette.ts`.\n\nImportant gotcha: the framework's vignette is flagged `xrSafe: false` and the composer skips it inside an active XR session by default. This is correct behaviour for the static-vignette case (which would mask the FOV of each eye and induce vertigo). For motion-gated vignettes the studio's pattern is to author a per-scene custom shader that only kicks in during smooth-walk events, not to flip the global xrSafe flag.\n\n```tsx\n// Pseudocode — the gate, not the shader\nconst velocity = useXRTranslationVelocity(); // your own hook\nconst vignetteStrength = Math.min(velocity.length() / 1.5, 1) * 0.45;\n// feed vignetteStrength into a per-scene postprocessing pass\n```\n\nThe key invariant: vignette strength tracks translation velocity, releases to zero when the visitor is still, and never exceeds ~0.45 darkness. Higher than that and visitors notice the vignette consciously, which defeats the point of the subtle dynamic FOV modification.",
      },
      {
        title: "Test on every target device before shipping",
        body:
          "The hard deck of devices is in `docs/WEBXR-DEVICE-TARGETS.md`. The locomotion-specific checks the studio runs on each one:\n\n- **Quest 3**: trigger on the right controller commits teleport; thumbstick on the right controller snap-turns. Verify the ray lands on the floor mesh without falling through.\n- **Vision Pro**: pinch-and-release commits teleport. There is no persistent ray and no thumbstick. Verify the transient-pointer event fires through the same TeleportTarget callback.\n- **Pico 4 Ultra**: same as Quest 3 in practice. Verify the controller bindings haven't drifted on the Pico Browser version you're testing on.\n\nFor scenes that branch behaviour on device, `useWebXRSupport()` is the shorthand: `{ vr, ar, ready }`. Use it to render a different toolbar pill on Vision Pro (where smooth-walk is not addressable at all because there is no thumbstick) than on Quest.",
      },
    ],
    finalResult:
      "A WebXR scene that lets the visitor point, click, and stand somewhere new without ever rotating their gut. Teleport on every supported headset, snap-turn at 30°, smooth-walk available as an opt-in for the visitors who tolerate it, motion-gated vignette when smooth-walk is engaged. The framework's defaults are the studio's promise to the visitor that they can wear the headset for the full half-hour the gallery wants them to.",
    variations: [
      "Dash instead of teleport — same TeleportTarget wiring with a fixed-distance commit handler. Useful for action scenes that want more embodiment than teleport without the smooth-walk cost.",
      "Grab-and-pull traversal for scenes with natural climbing affordances — needs custom hand-attach logic and a grabbable scene graph.",
      "Per-eye foveation hints — not strictly locomotion, but the framerate headroom foveation buys is the most important comfort variable after the locomotion pattern itself.",
      "Seated-mode scenes — disable locomotion entirely (`locomotion={false}` on the rig), use snap-turn only. The cockpit-and-diorama register.",
    ],
    troubleshooting: [
      {
        symptom: "Teleport ray draws but never lands on the floor.",
        cause:
          "The floor mesh is hidden with `visible={false}`, which removes it from the raycaster entirely.",
        fix: "Keep the mesh visible and hide it with a transparent material instead — `transparent opacity={0} depthWrite={false}` on a `meshBasicMaterial`. The mesh stays in the ray's path; the visitor never sees it.",
      },
      {
        symptom:
          "Visitors report nausea within a minute of entering smooth-walk mode.",
        cause:
          "Smooth walk is a vection generator. Some fraction of the population will always feel ill, no matter what you do.",
        fix: "The studio's not surprised. Default to teleport, document smooth-walk as an opt-in, ship the motion-gated vignette, accept that the susceptible third of visitors should be on teleport. Don't try to engineer around vection.",
      },
      {
        symptom: "Snap-turn rotates the view around the wrong pivot.",
        cause:
          "Snap-turn rotating around the world origin instead of the visitor's headset position. Common when a rig is wired by hand instead of through the framework's XRCameraRig.",
        fix: "Use the framework's XRCameraRig, or if you must wire your own, rotate the XROrigin group around the HMD's current world position, not (0,0,0). The XR session exposes the headset pose through the standard WebXR reference space — read from it before applying the rotation.",
      },
      {
        symptom:
          "Teleport works on Quest but not on Vision Pro — the ray never appears.",
        cause:
          "Vision Pro doesn't expose a persistent controller ray. Input arrives only on pinch-release through the transient-pointer source.",
        fix: "The TeleportTarget event still fires through the same callback on pinch-release. If the visitor expects to see a ray and there isn't one, render a small per-pinch indicator at the gaze point. Use `useWebXRSupport()` and the `XRInputSource.targetRayMode` value to branch the UI affordance, not the underlying logic.",
      },
    ],
  },
  base,
);
