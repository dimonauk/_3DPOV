# Open-Source Stack

A running catalogue of the open-source projects the studio site leans on. Every entry has a licence, a one-line role, and a pointer to the code where it's wired. Update this file whenever a new OSS dependency is added or an old one swapped out — pair the entry with the commit that wires it.

The site is Next.js 15.6 canary on App Router, deployed to Vercel, branch `claude/skeleton-build` → production. Repo: [github.com/dimonauk/_3DPOV](https://github.com/dimonauk/_3DPOV).

## Site framework

| Project | Licence | Role | Where |
| --- | --- | --- | --- |
| [Next.js](https://github.com/vercel/next.js) `15.6.0-canary.60` | MIT | App Router, RSC, Turbopack production build | everywhere |
| [React](https://github.com/facebook/react) `19.0.0` | MIT | UI runtime | everywhere |
| [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss) `^4.0` | MIT | Utility CSS + chrome design tokens | `app/globals.css` + every component |
| [Zustand](https://github.com/pmndrs/zustand) `^5.0` | MIT | Tiny global state where context would be heavy | scattered client components |
| [Zod](https://github.com/colinhacks/zod) `^4.4` | MIT | Schema validation at boundaries | route handlers, env loaders |
| [clsx](https://github.com/lukeed/clsx) `^2.1` | MIT | Conditional className builder | UI components |

## Rendering & 3D

| Project | Licence | Role | Where |
| --- | --- | --- | --- |
| [Three.js](https://github.com/mrdoob/three.js) `^0.171` | MIT | WebGL/WebGPU base | ambient field, mesh text, splat viewer |
| [React Three Fiber](https://github.com/pmndrs/react-three-fiber) `^9.0` | MIT | React renderer for Three | volumetric / R3F demos |
| [@react-three/drei](https://github.com/pmndrs/drei) `^10.0` | MIT | R3F helpers | scene helpers in R3F demos |
| [@react-three/postprocessing](https://github.com/pmndrs/react-postprocessing) `^3.0` | MIT | Effect composer for R3F | post FX |
| [@react-three/xr](https://github.com/pmndrs/xr) `^6.6` | MIT | WebXR session helpers for R3F | future WebXR surfaces |
| [@pixiv/three-vrm](https://github.com/pixiv/three-vrm) `^3.5` | MIT | VRM avatar loader for Three | Aura launcher |
| [postprocessing](https://github.com/pmndrs/postprocessing) `^6.39` | Zlib | Effect framework (lower-level than R3F) | shader passes |
| [@sparkjsdev/spark](https://github.com/sparkjsdev/spark) `^0.1.10` | MIT | Three.js Gaussian-splat renderer | `components/splats/SplatViewer.tsx` (loaded via esm.sh) |
| [@mkkellogg/gaussian-splats-3d](https://github.com/mkkellogg/GaussianSplats3D) `^0.4.7` | MIT | Alt splat renderer | held in reserve |
| [@google/model-viewer](https://github.com/google/model-viewer) `^4.2` | Apache-2.0 | Glb/Gltf web component | model preview surfaces |
| [troika-three-text](https://github.com/protectwise/troika/tree/main/packages/troika-three-text) `^0.52` | MIT | SDF text in a Three scene | `components/type3d/MeshProseLayer.tsx` |
| [mediabunny](https://github.com/Vanilagy/mediabunny) `^1.44` | MIT | Browser-side video mux/demux | media pipelines |

## WebGPU + spatial chrome (in-house, OSS-leveraged)

| Project / module | Licence | Role | Where |
| --- | --- | --- | --- |
| `lib/ambient/` (uses Three.js + TSL) | in-house | TSL/WebGPU particle field with WebGL fallback | `components/ambient/AmbientField.tsx` |
| `components/type3d/` (uses Three.js + troika) | in-house | Mesh text — display + body register | `MeshText3D`, `MeshProseLayer`, `MeshSceneProvider` |
| `components/ar-chrome/` | in-house | Brackets, depth readouts, axis indicator, range bar, cursor reticle | `components/ar-chrome/*` |
| `lib/parallax/` + `hooks/useParallax.ts` + `hooks/useTiltParallax.ts` | in-house | Shared scroll store + parallax/tilt hooks | wrapped via `<ParallaxLayer>` / `<ParallaxCover>` |

## Shaders & visual style

The studio runs two in-house TSL libraries — `lib/tsl-materials/` (preset NodeMaterials) and `lib/tsl-post/` (effect composer). Both prefer dual-path: TSL on WebGPU, `postprocessing` fallback on WebGL2. Every entry below names the upstream source for its algorithm; the actual implementations are studio-authored.

| Project | Licence | Role | Where |
| --- | --- | --- | --- |
| [MToon](https://github.com/Santarh/MToon) (Santarh + VRM Consortium) | MIT | Rim-light pattern (`_RimColor` / `_RimFresnelPower` / `_RimLift`) folded into the cel ramp + the standalone glow-rim material + iridescent-soap rim falloff | `lib/tsl-materials/presets/cel-shaded.ts`, `lib/tsl-materials/presets/glow-rim.ts`, `lib/tsl-materials/presets/iridescent-soap.ts` |
| [IronWarrior/UnityToonShader](https://github.com/IronWarrior/UnityToonShader) | Unlicense | Two-band facet-shading ramp shape adapted for the paper-folded preset (origami / low-poly look) | `lib/tsl-materials/presets/paper-folded.ts` |
| Bayer 1973 ordered-threshold matrix | public-domain algorithm | Dither source — the published 8×8 matrix encoded inline for the print-zine post effect | `lib/tsl-post/effects/dither-bayer.ts` |
| Cook & Torrance 1982 thin-film optics + Inigo Quilez cosine-palette pattern | public-domain algorithm | Soap-bubble interference colour cycle for the iridescent-soap material | `lib/tsl-materials/presets/iridescent-soap.ts` |
| [Three.js examples](https://github.com/mrdoob/three.js/tree/dev/examples) | MIT | `mx_noise_float` usage pattern for static procedural texture overlays — paper-grain effect, stone preset variation | `lib/tsl-post/effects/paper-grain.ts`, `lib/tsl-materials/presets/stone.ts` |

## AI & inference

| Project | Licence | Role | Where |
| --- | --- | --- | --- |
| [ai (Vercel AI SDK)](https://github.com/vercel/ai) `^6.0` | Apache-2.0 | LLM streaming + chat plumbing | `/api/agents/[slug]/chat`, Aura agent |
| [ai-sdk-ollama](https://github.com/ai-sdk-ollama/ai-sdk-ollama) `^3.8` | MIT | Ollama provider for the AI SDK | per-person agent chat |
| [@huggingface/transformers](https://github.com/huggingface/transformers.js) `^4.2` | Apache-2.0 | Browser-side ONNX inference | small in-browser models |
| [@mlc-ai/web-llm](https://github.com/mlc-ai/web-llm) `^0.2.83` | Apache-2.0 | WebGPU LLM runtime in the browser | optional client-side chat |
| [@mediapipe/tasks-vision](https://github.com/google-ai-edge/mediapipe) `^0.10.35` | Apache-2.0 | Face + hand landmark inference | `lib/tracking/sources/mediapipe-*` |
| [@google/genai](https://github.com/googleapis/js-genai) `^2.2` | Apache-2.0 | Gemini SDK | viz generation paths |
| [meyda](https://github.com/meyda/meyda) `^5.6` | MIT | Browser audio-feature extraction | audio analysis surfaces |
| [kokoro-js](https://github.com/hexgrad/kokoro) `^1.2` | Apache-2.0 | Browser TTS | optional speech-out |
| Ollama (runtime, not npm) | MIT | Local LLM host the chat endpoint streams from | `http://localhost:11434` by default |
| ComfyUI (runtime bridge) | GPL-3.0 | Image/video/3D generation graph | `lib/capabilities/viz/*` |

## Federation, feeds, social

| Project | Licence | Role | Where |
| --- | --- | --- | --- |
| [feedsmith](https://github.com/macieklamberski/feedsmith) `^2.9` | MIT | RSS/Atom/JSONFeed parse + build | `lib/feed/atom.ts`, `lib/workers/feed-parse.worker.ts`, `lib/watchers/sources/arxiv.ts`, `lib/watchers/sources/org-atom.ts` |
| (in-house) ActivityPub skeleton | in-house | WebFinger + actor + outbox over `@fedify`-shaped routes | `lib/federation/*`, `app/.well-known/*` |
| [Mastodon public API](https://docs.joinmastodon.org/) | AGPL-3.0 (server) | Status fetcher for /feed | `lib/social-feeds/fetch-mastodon.ts` |
| [Bluesky AT Protocol](https://github.com/bluesky-social/atproto) | MIT | `api.bsky.app` author-feed fetcher | `lib/social-feeds/fetch-bluesky.ts` |
| [GitHub REST API](https://docs.github.com/en/rest) | proprietary (TOS) | Commits + releases poll for the Polymaths Feed watcher | `lib/watchers/sources/github-releases.ts`, `lib/watchers/sources/holoflow-git.ts`, `lib/watchers/sources/org-atom.ts` |
| [Hugging Face Hub API](https://huggingface.co/docs/hub/api) | proprietary (TOS) | Recent-model poll for the Polymaths Feed watcher | `lib/watchers/sources/huggingface-models.ts` |
| [arXiv API](https://info.arxiv.org/help/api/index.html) | open access (arXiv ToS) | Recent-paper poll for the Polymaths Feed watcher | `lib/watchers/sources/arxiv.ts` |

## Magazine engine

| Project | Licence | Role | Where |
| --- | --- | --- | --- |
| (in-house) `lib/writing.ts` Entry model | in-house | Shared shape for articles/journal/tutorials | imports across registries |
| (in-house) `lib/articles.tsx` / `lib/journal.tsx` / `lib/tutorials.tsx` | in-house | Per-section registries | each entry registers here |
| (in-house) Instructable system | in-house | Aura Test Chamber tutorial chrome | `components/tutorials/Instructable.tsx`, `lib/tutorials/types.ts` |
| (in-house) Luxe components | in-house | IssueBand, EditionNumeral, LuxCover, LuxFolio, SectionOpener | `components/luxe/*` |

## Diagrams & figures

| Project | Licence | Role | Where |
| --- | --- | --- | --- |
| [Mermaid](https://github.com/mermaid-js/mermaid) `^11.15` | MIT | Text-to-diagram parser + renderer | `components/diagrams/MermaidBlock.tsx` |
| [Rough.js](https://github.com/rough-stuff/rough) `^4.6` | MIT | Hand-drawn SVG primitives | `components/diagrams/RoughFigure.tsx` |
| (in-house) IKEA flat-line SVGs | in-house | Tutorial assembly figures | `public/diagrams/*` |
| [mind-ar](https://github.com/hiukim/mind-ar-js) `^1.2` | MIT | Image-target AR + `.mind` compile | `components/ar/MindARScene.tsx`, `scripts/ar-compile-mind.mjs` |
| [qr-code-styling](https://github.com/kozakdenys/qr-code-styling) `^1.9` | MIT | Branded QR generation | `scripts/ar-generate-qr.mjs` |
| [qrcode](https://github.com/soldair/node-qrcode) `^1.5` | MIT | Plain QR generation | scripts + server routes |
| [qr-scanner](https://github.com/nimiq/qr-scanner) `^1.4` | MIT | Browser QR reader | scanner surfaces |

## Tracking & input

| Project | Licence | Role | Where |
| --- | --- | --- | --- |
| [@mediapipe/tasks-vision](https://github.com/google-ai-edge/mediapipe) `^0.10.35` | Apache-2.0 | Face + hand landmark inference (webcam path) | `lib/tracking/sources/mediapipe-{face,hand}.ts` |
| Azure Kinect SDK (bench-side) | MIT | Skeletal tracking via Tailscale bridge | `lib/tracking/sources/kinect-bridge.ts` |
| Ultraleap Web SDK | EULA (proprietary, free for dev) | Hand tracking when the user has the device | `lib/tracking/sources/ultraleap.ts` |
| (in-house) pointer fallback | in-house | `pointermove` driver when nothing else is available | `lib/tracking/sources/pointer-fallback.ts` |

## Workers & client infra

| Project | Licence | Role | Where |
| --- | --- | --- | --- |
| [MiniSearch](https://github.com/lucaong/minisearch) `^7.2` | MIT | Inverted-index search in a Worker | `lib/workers/search-index.worker.ts` |
| (in-house) Worker registry | in-house | Singleton + `callWorker(kind, request)` typed helper | `lib/workers/registry.ts`, `lib/workers/client.ts` |
| [feedsmith](https://github.com/macieklamberski/feedsmith) (above) | MIT | RSS/Atom parsing in a Worker | `lib/workers/feed-parse.worker.ts` |
| (in-house) Splat decode worker | in-house | `.splat` / `.ply` binary parse off-main-thread | `lib/workers/splat-decode.worker.ts` |
| (in-house) Font-mesh worker | in-house | TextGeometry generation off-main-thread | `lib/workers/font-mesh.worker.ts` (via type3d) |
| (in-house) Particle-init worker | in-house | Seeded particle position generator for AmbientField | `lib/workers/particle-init.worker.ts` |

## Infrastructure (runtime hosts)

| Project | Licence | Role | Where |
| --- | --- | --- | --- |
| [Vercel](https://vercel.com/) | proprietary | Hosting + Turbopack builds | production deploy target |
| [Upstash Redis](https://github.com/upstash/upstash-redis) `^1.38` | MIT | KV store (rate limits, cache) | `lib/cache.ts` consumers |
| [@vercel/blob](https://github.com/vercel/storage) `^2.3` | Apache-2.0 | Object storage for splats + assets | `lib/blob.ts` |
| [@vercel/analytics](https://github.com/vercel/analytics) `^2.0` | Apache-2.0 | Page-view analytics | layout |
| [Plausible](https://github.com/plausible/analytics) (community runtime) | AGPL-3.0 (server) | Self-hostable analytics fallback | `components/analytics/plausible.tsx` |
| Tailscale (Funnel + Serve) | BSD-3-Clause (core), proprietary (control plane) | Bench-bridge HTTPS | `holoflow-bench-bridge` pattern |
| Firebase / Firebase Admin `^12 / ^13` | Apache-2.0 | Auth + Firestore | `lib/firebase.ts` |
| [Stripe SDK](https://github.com/stripe/stripe-js) `^9 / @react-stripe-js ^6` | MIT | Payments | bureau checkout surfaces |
| [Resend](https://github.com/resend/resend-node) `^6.12` | MIT | Transactional email | contact + drops |
| [Sanity / next-sanity](https://github.com/sanity-io/sanity) `^5 / ^12` | MIT | Headless CMS for shop content | `lib/sanity/*` |
| [passkit-generator](https://github.com/alexandercerutti/passkit-generator) `^3.5` | MIT | Apple Wallet pass generation | `scripts/ar-generate-pass.mjs` (drops/AR cards) |

## Imaging + canvas

| Project | Licence | Role | Where |
| --- | --- | --- | --- |
| [Sharp](https://github.com/lovell/sharp) `^0.34` | Apache-2.0 | Server-side image transforms | OG cards, thumbnails, AR target preprocessing |
| [@napi-rs/canvas](https://github.com/Brooooooklyn/canvas) `^1.0` | MIT | Server-side Canvas 2D (replaces `node-canvas` on Node 25 + Windows) | `lib/og-image.ts`, splat preview cards |
| [isomorphic-dompurify](https://github.com/kkomelin/isomorphic-dompurify) `^3.13` | MPL-2.0 / Apache-2.0 | HTML sanitisation across server + client | content cleanup |

## OSINT / operator tools

| Project | Licence | Role | Where |
| --- | --- | --- | --- |
| [Maigret](https://github.com/soxoj/maigret) | MIT | Username sweep across 3000+ sites | `lib/admin/maigret.ts` (spawned from local venv) |
| [ExifTool](https://github.com/exiftool/exiftool) | Perl Artistic | Image metadata read/strip | bench-side via shell |

## Build, dev, testing

| Project | Licence | Role | Where |
| --- | --- | --- | --- |
| [Turbopack](https://github.com/vercel/turbo) | MPL-2.0 / Apache-2.0 | The production bundler since the 45-min Webpack timeout | `next build --turbopack` |
| [TypeScript](https://github.com/microsoft/TypeScript) `5.8.2` | Apache-2.0 | Static types | everywhere |
| [Prettier](https://github.com/prettier/prettier) `3.5.3` + `prettier-plugin-tailwindcss` | MIT | Formatting | `pnpm prettier` |
| [Vitest](https://github.com/vitest-dev/vitest) `^4.1` | MIT | Unit + component test runner | `vitest.config.ts` |
| [Playwright](https://github.com/microsoft/playwright) `^1.60` | Apache-2.0 | E2E sweep | `tests/e2e/run-sweep.mjs` |
| [happy-dom](https://github.com/capricorn86/happy-dom) `^20.9` | MIT | DOM stand-in for Vitest | `vitest.config.ts` |
| [jsdom](https://github.com/jsdom/jsdom) `^29.1` | MIT | DOM stand-in (alt) | testing utilities |
| [@testing-library/react](https://github.com/testing-library/react-testing-library) `^16.3` | MIT | Component testing | `*.test.tsx` files |

## 3D assets — CC0 / permissive

Asset catalogues the studio reaches for when a scene wants a stylised low-poly prop or a faceted hero piece. None are bundled into the repo by default — pull individual models in as needed, drop them under `public/models/<category>/<slug>.glb`, and add a row to the relevant catalogue (e.g. `lib/sculpture-gallery/catalogue.ts`). Attribution stays in the file's `note` field and in `docs/ATTRIBUTIONS.md`.

| Project | Licence | Role | Where |
| --- | --- | --- | --- |
| [Kenney.nl](https://kenney.nl/assets) | CC0 | Hundreds of low-poly model packs (city, nature, sci-fi, characters, props). The bench's first stop for placeholder geometry. | Pull-as-needed into `public/models/*` |
| [Quaternius](https://quaternius.com/) | CC0 | Polished low-poly nature + character + sci-fi packs in a coherent flat-shaded register. Pairs well with the cel-shaded preset. | Pull-as-needed into `public/models/*` |
| [Poly Pizza](https://poly.pizza/) | CC0 / CC-BY | Successor to Google Poly. Search surface across thousands of low-poly models from many authors; filter by CC0 for clean attribution. | Pull-as-needed; CC-BY entries credit author in catalogue `note` |
| [Khronos glTF Sample Models](https://github.com/KhronosGroup/glTF-Sample-Models) | mixed (CC0 / CC-BY / Apache-2.0) | Reference glb/gltf assets for testing loaders + materials (Damaged Helmet, Sponza, Suzanne). | Pipeline tests + the splat-walker baseline |
| [Casual Effects data files](https://casual-effects.com/data/) | mixed (each scene listed) | Morgan McGuire's archived scene data — Crytek Sponza, San Miguel, Sibenik. The canonical lighting-test scenes. | Reference geometry for shader work; check per-scene licence |

## Texture + material libraries

CC0 / permissive texture sources used when a TSL preset needs a base map, normal, or HDRI. The TSL material library at `lib/tsl-materials/` is procedural-first; these are the fallbacks when a scene wants a real captured surface.

| Project | Licence | Role | Where |
| --- | --- | --- | --- |
| [ambientCG](https://ambientcg.com/) | CC0 | PBR texture catalogue — substrates, fabrics, painted surfaces, plus a small stylised set. The first stop for a real-world swatch. | Pull-as-needed into `public/textures/*` |
| [Poly Haven](https://polyhaven.com/) | CC0 | HDRIs + PBR textures + a small model set. The HDRI library is the default environment-map source. | Pull-as-needed into `public/hdri/*` |

## Authoring tooling — mesh + glTF

CLI tools the bench runs against glTFs before they land in the repo. None of these need to be a runtime dependency — they run in scripts.

| Project | Licence | Role | Where |
| --- | --- | --- | --- |
| [meshoptimizer + gltfpack](https://github.com/zeux/meshoptimizer) | MIT | Mesh simplification, vertex cache optimisation, gltf-side compression. The `gltfpack` CLI is the default first-pass tool for any external glb before it lands under `public/models/`. | Bench-side; not a runtime dep |
| [glTF-Transform CLI](https://github.com/donmccurdy/glTF-Transform) | MIT | Programmatic glTF transforms (simplify, flat-normals, weld, prune). Use when `gltfpack` is the wrong shape — typically when a transform needs to be scripted alongside the asset pipeline. | Bench-side; `npx @gltf-transform/cli` |

## Reference + study (OSS in this aesthetic)

OSS projects worth opening when authoring in the low-poly + cel-shaded register. Not folded into the runtime — these are reading material.

| Project | Licence | Why it matters here |
| --- | --- | --- |
| [Open Brush](https://github.com/icosa-foundation/open-brush) | Apache-2.0 | The community fork of Tilt Brush. Cel-style brush shader implementations live in `Assets/Resources/Brushes/`; the studio's `lib/assets/brushes.ts` catalogues the same brush family. |
| [Godot demo projects](https://github.com/godotengine/godot-demo-projects) | MIT | The `3d/` folder includes a toon-shaded demo + a few low-poly scenes. Useful as a structural reference for stylised forward rendering. |

## Spatial UI (R3F / WebXR)

| Project | Licence | Role | Where |
| --- | --- | --- | --- |
| [@react-three/uikit](https://github.com/pmndrs/uikit) | MIT | Flexbox-laid-out 3D UI components for R3F — panels, lists, buttons that render as Three meshes. The candidate for the WebXR-first surface chrome (the place 2D React panels can't follow). | Shortlist for `components/xr-scene/*` chrome; not yet wired |

## Fonts (OFL + permissive, complementary to the studio set)

The studio set is **Cormorant Garamond** (display) + **Inter** (body) + **JetBrains Mono** (code). These are the OFL pools to pull from when a one-off piece wants a different voice without going outside the OFL fence.

| Source | Licence | Role |
| --- | --- | --- |
| [Google Fonts (google/fonts)](https://github.com/google/fonts) | OFL (mostly) | The canonical OFL pool. Cormorant Garamond, Inter, JetBrains Mono all live here. Self-host via `next/font/google` rather than CDN. |
| [Velvetyne](https://velvetyne.fr/) | OFL | Experimental display typefaces in a magazine-art register — useful when a section opener wants weight the studio set doesn't carry. Confirm per-font OFL before shipping. |
| [The League of Movable Type](https://www.theleagueofmoveabletype.com/) | OFL | Workhorse OFL display + body fonts (League Spartan, Knewave, Goudy Bookletter). Reliable, established, easy to attribute. |

## Lined up — researched, not yet wired

| Project | Licence | Why it's on the shortlist |
| --- | --- | --- |
| [Fedify](https://github.com/fedify-dev/fedify) | MIT | The Next-friendly ActivityPub adapter. Skipped on first pass because the Next adapter wanted to own the route lifecycle and didn't fit our 15.6 canary; revisit when stable. |
| [next-fedify](https://github.com/fedify-dev/fedify/tree/main/packages/next) | MIT | Same project; pair with the above when migrating off the hand-rolled skeleton. |
| [Pixelorama](https://github.com/Orama-Interactive/Pixelorama) | MIT | Browser pixel-art studio — would slot into the magazine as `/atelier/pixel`. |
| [FreeMoCap](https://github.com/freemocap/freemocap) | AGPL-3.0 | Markerless motion capture from a webcam — pairs with the tracking inputs system. |
| [OctoPrint](https://github.com/OctoPrint/OctoPrint) | AGPL-3.0 | Print-bed dashboard for the studio's fleet. |
| [LDtk](https://github.com/deepnight/ldtk) | MIT | 2D tilemap editor — for the toytown navigation system. |
| [WLED](https://github.com/Aircoookie/WLED) | MIT | LED-strip firmware + JSON API the rigs use; future bench-controller surface. |
| [pgvector](https://github.com/pgvector/pgvector) | PostgreSQL | Embeddings + nearest-neighbour for the rolodex + writing search. |
| [Qdrant](https://github.com/qdrant/qdrant) | Apache-2.0 | Vector store, in-process or hosted. |
| [Switch dumping toolchain](https://switch.homebrew.guide/) | mixed | Documented in `holoflow-private/docs/switch-personal-dumping.md`; surfaces as a private op tool. |
| [Open Brush](https://github.com/icosa-foundation/open-brush) | Apache-2.0 | The Tilt Brush successor. The stylised brush shaders (oil paint, pencil, chrome, smoke) would each port cleanly into TSL presets. Deferred because Unity HLSL → TSL is line-by-line work and the existing 15-preset library covers the immediate need. |
| [drei](https://github.com/pmndrs/drei) MeshTransmissionMaterial / MeshDistortMaterial / MeshWobbleMaterial | MIT | drei is already a dep; these materials are not currently surfaced through the tsl-materials registry. Worth wrapping in `lib/tsl-materials/presets/` adapters so the showcase + chip strip can pick them up uniformly. |
| [pmndrs/maath](https://github.com/pmndrs/maath) | MIT | Easings, three-Color helpers, buffer-attribute utilities. Shader-adjacent — useful for the brick library's animation tracks and for procedural particle init. |
| [Kuwahara anisotropic filter](https://en.wikipedia.org/wiki/Kuwahara_filter) | public-domain algorithm | Painterly post-process. Rejected this pass — the anisotropic variant is a 4-sector eigenvector decomposition per pixel, which lands in `expensive` territory and is XR-unsafe. Worth a `kuwahara` post effect for editorial 2D-only stills. |
| [Sobel edge-detect on normal buffer](https://en.wikipedia.org/wiki/Sobel_operator) | public-domain algorithm | Outline via depth+normal Sobel rather than the inverted-hull approach in `outline.ts`. The current outline is structural; a normal-Sobel pass would catch interior creases the silhouette misses. |
| [Lygia](https://github.com/patriciogonzalezvivo/lygia) | Prosperity (NON-PERMISSIVE) | **Cannot ship from.** Dual-licensed Prosperity + Patron — commercial-use restricted unless sponsoring. We re-derive any algorithm we want from the canonical first-source paper / public-domain reference instead. Listed here so future contributors do not paste from it. |

## Honest gaps

The catalogue above misses anything the studio uses that isn't in `package.json` or in the in-house module list. The Hangar (`D:\The_Hangar\`) has many OSS deps the public site doesn't use yet — Blender, ComfyUI workflows, the OBS plugin family, the SillyTavern fork, the OpenClaw build pipeline. These get an entry here when they're wired into a public surface, not before.

## House rule

This doc is the canonical place to record OSS the public site depends on. When a `pnpm add <pkg>` happens, add a row here in the same commit. When a project moves from "lined up" to wired, move its row from the bottom section into the right area section. When a project gets ripped out, delete the row in the same commit that removes the dependency. Keep the licence and the where-it's-used columns honest — they're how future maintainers (and Vercel licence-audit tooling) understand what's running.
