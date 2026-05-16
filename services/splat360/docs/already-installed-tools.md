# Already-installed stack tools — Sovereign-PC

Discovered 2026-05-15 by scanning `C:\Program Files` and `C:\Program
Files (x86)`. These are tools already present on this machine that
plug into the splat360 / HoloWalk stack. Not installed by the
`splat360-install-*` scripts — they were here before. Documented so
the operator knows what's available without re-installing.

| Tool | Path | What it adds to the stack |
|---|---|---|
| **DJI Studio** | `C:\Program Files\DJI Studio\` | Proprietary OSV / DJI MP4 stitcher. Better seam blending than `ffmpeg v360 dfisheye`. The preferred stitcher for hero deliverables. Replaces splat360's stitch-osv-to-equirect for high-quality output. |
| **Insta360 Studio** | `C:\Program Files\Insta360 Studio\` | Proprietary `.insv` / `.insp` stitcher. Same role for Insta360 X-series footage. |
| **Insta360 Link Controller** | `C:\Program Files\Insta360 Link Controller\` | Webcam config for the Insta360 Link (PTZ webcam). Not directly relevant to splat work. |
| **Jawset Postshot** | `C:\Program Files\Jawset Postshot\bin\` | Already wired as the `postshot` trainer in splat360. Top-tier perceptual quality, proprietary licence required. |
| **RealityCapture 1.5** | `C:\Program Files\Capturing Reality\RealityCapture\` | Wired 2026-05-15 as the `realityscan` SfM backend. Predecessor to Epic's RealityScan rebrand. Quality benchmark for SfM. |
| **DaVinci Resolve** | `C:\Program Files\Blackmagic Design\DaVinci Resolve\` | Video editor with Gaussian Splat support since v19.x. Can ingest splat360's `.spz` / `.ply` for cinematic camera moves through a captured space. |
| **Looking Glass** + **Looking Glass Factory** | `C:\Program Files\Looking Glass\` + `(x86)\Looking Glass Factory\` | Holographic display hardware drivers + the holoplay studio. Splats render as quilts for the LG portrait display — see [[finishing-school-protocol]] for the Swift display-routing pattern. |
| **Affinity** | `C:\Program Files\Affinity\` | Designer / Photo / Publisher — for any print-side art (the HoloWalk QR signage, splat thumbnails, etc.). Replaces Adobe. |
| **Topaz Labs** | `C:\Program Files\Topaz Labs LLC\` | Photo / Video AI upscalers + denoise. Useful for cleaning up Avata 360 footage before SfM. |
| **Skylum (Luminar / Noiseless)** | `C:\Program Files\Skylum\` | Photo enhancement. Similar role to Topaz on the stills side. |
| **Epic Games Launcher** | `C:\Program Files (x86)\Epic Games\Launcher\` | Path to installing RealityScan 2.x once the operator decides to upgrade past v1.5. |
| **Visual Studio Community 2026** | (winget-installed, latest) | C++ build environment — useful for the OpenSplat-from-source path and any UE plugin compilation. |
| **Unreal Engine 5.4 / 5.5 / 5.6** | `D:\UE_5.4`, `D:\UE_5.5`, `D:\UE_5.6` | All three UE versions present. Splat plugins land here: UnrealSplat, SplatRenderer, NanoGS, XScene-UEPlugin (none cloned yet). |
| **Obsidian** | `C:\Program Files\Obsidian\` | Local Markdown vault. Could mirror the splat360 docs offline. |

## Notable absences

- **Blender** — not at the canonical `C:\Program Files\Blender Foundation\` path. The [[blender-pipelines]] skill says Blender 5.1 is in use; check `D:\` or a portable install.
- **Unity Hub** — not installed. Add if you decide to wire UnityGaussianSplatting (aras-p).
- **Adobe Creative Cloud** — not installed. Affinity covers the same surface.
- **Pix4D / Agisoft Metashape / 3DF Zephyr** — commercial photogrammetry competitors. Not installed; RealityCapture covers the role.

## Implications for splat360 ops

1. **High-quality OSV stitch** — when running a hero capture, prefer
   DJI Studio over the v360 ffmpeg fallback. The seam disappears.
2. **Hero display path** — Looking Glass + the splat → quilt render
   pipeline is the in-studio reveal mechanism for HoloWalk-class
   captures. Document the splat→quilt flow as a downstream wave.
3. **DaVinci Splat support** — for video deliverables (a HoloWalk
   trail trailer, social cuts), splat ingest in Resolve replaces the
   external splat-renderer route.
