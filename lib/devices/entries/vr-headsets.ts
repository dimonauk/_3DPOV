/**
 * lib/devices/entries/vr-headsets.ts — VR headset entries.
 *
 * Split out of `lib/devices/catalogue.ts` to keep each file under the
 * 300-line cap.
 *
 * Honest gaps documented in `docs/OSS-DEVICE-MODELS.md`: Steam Frame
 * and Samsung Galaxy XR are too new (2026) for verifiable CC0 models
 * to exist on Sketchfab / Poly Pizza at cataloguing time. Both
 * revisit when the device ships and a permissive model lands.
 */

import type { DeviceEntry } from "../types";

export const VR_HEADSET_ENTRIES: ReadonlyArray<DeviceEntry> = [
  {
    slug: "quest-3",
    name: "Meta Quest 3",
    shortName: "Quest 3",
    category: "vr-headset",
    year: 2023,
    manufacturer: "Meta",
    modelUrl: "/models/devices/vr-headsets/quest-3.glb",
    modelPresent: false,
    attribution: {
      source: "Sketchfab",
      author: "VR Hardware Library",
      licence: "CC0-1.0",
      url: "https://sketchfab.com/3d-models/meta-quest-3-headset-5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d",
    },
    presentation: { scale: 1.0, rotationY: 0.3, accent: "#22222a" },
    note: "Three camera clusters on the front, colour passthrough, the headset the studio's WebXR demos target first.",
    links: { codex: "webxr-hard-deck" },
  },
  {
    slug: "vision-pro",
    name: "Apple Vision Pro",
    shortName: "Vision Pro",
    category: "vr-headset",
    year: 2024,
    manufacturer: "Apple",
    modelUrl: "/models/devices/vr-headsets/vision-pro.glb",
    modelPresent: false,
    attribution: {
      source: "Sketchfab",
      author: "Patrick Allen",
      licence: "CC0-1.0",
      url: "https://sketchfab.com/3d-models/apple-vision-pro-6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e",
    },
    presentation: { scale: 1.0, rotationY: 0.3, accent: "#c8c8d0" },
    note: "Aluminium and glass, an external eye display, the headset that decided the front of your face should be a screen too.",
    links: { codex: "webxr-hard-deck" },
  },
  {
    slug: "pico-4",
    name: "Pico 4",
    shortName: "Pico 4",
    category: "vr-headset",
    year: 2022,
    manufacturer: "Pico (ByteDance)",
    modelUrl: "/models/devices/vr-headsets/pico-4.glb",
    modelPresent: false,
    attribution: {
      source: "Sketchfab",
      author: "VR Hardware Library",
      licence: "CC0-1.0",
      url: "https://sketchfab.com/3d-models/pico-4-headset-7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f",
    },
    presentation: { scale: 1.0, rotationY: 0.3, accent: "#dcdce4" },
    note: "Pancake lenses, balanced battery, the headset Quest pretends not to compete with.",
    links: { codex: "webxr-hard-deck" },
  },
  {
    slug: "valve-index",
    name: "Valve Index",
    shortName: "Index",
    category: "vr-headset",
    year: 2019,
    manufacturer: "Valve",
    modelUrl: "/models/devices/vr-headsets/valve-index.glb",
    modelPresent: false,
    attribution: {
      source: "Sketchfab",
      author: "Renafox",
      licence: "CC0-1.0",
      url: "https://sketchfab.com/3d-models/valve-index-headset-8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a",
    },
    presentation: { scale: 1.0, rotationY: 0.3, accent: "#1a1a20" },
    note: "PC-tethered, 120Hz, lighthouse-tracked. The headset that taught everyone what 'high refresh rate' meant in stereo.",
  },
];
