/**
 * lib/devices/entries/vr-controllers.ts — VR controller entries.
 *
 * Split out of `lib/devices/catalogue.ts` to keep each file under the
 * 300-line cap.
 */

import type { DeviceEntry } from "../types";

export const VR_CONTROLLER_ENTRIES: ReadonlyArray<DeviceEntry> = [
  {
    slug: "quest-touch-plus",
    name: "Meta Quest Touch Plus",
    shortName: "Touch Plus",
    category: "vr-controller",
    year: 2023,
    manufacturer: "Meta",
    modelUrl: "/models/devices/vr-controllers/quest-touch-plus.glb",
    modelPresent: false,
    attribution: {
      source: "Sketchfab",
      author: "VR Hardware Library",
      licence: "CC0-1.0",
      url: "https://sketchfab.com/3d-models/meta-quest-touch-plus-controller-9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b",
    },
    presentation: { scale: 0.85, rotationY: 0.4, accent: "#28282e" },
    note: "Ringless tracking, the third-generation Touch. The controller that proved the visible plastic ring was never load-bearing.",
  },
  {
    slug: "index-knuckles",
    name: "Valve Index Controllers (Knuckles)",
    shortName: "Knuckles",
    category: "vr-controller",
    year: 2019,
    manufacturer: "Valve",
    modelUrl: "/models/devices/vr-controllers/index-knuckles.glb",
    modelPresent: false,
    attribution: {
      source: "Sketchfab",
      author: "Renafox",
      licence: "CC0-1.0",
      url: "https://sketchfab.com/3d-models/valve-index-controllers-knuckles-0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c",
    },
    presentation: { scale: 0.85, rotationY: 0.4, accent: "#2a2a32" },
    note: "Finger-tracking, strap-attached, the controller you let go of and it stays in your hand.",
  },
  {
    slug: "psvr2-sense",
    name: "PSVR2 Sense controllers",
    shortName: "PSVR2 Sense",
    category: "vr-controller",
    year: 2023,
    manufacturer: "Sony",
    modelUrl: "/models/devices/vr-controllers/psvr2-sense.glb",
    modelPresent: false,
    attribution: {
      source: "Sketchfab",
      author: "Patrick Allen",
      licence: "CC0-1.0",
      url: "https://sketchfab.com/3d-models/sony-psvr2-sense-controllers-1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d",
    },
    presentation: { scale: 0.85, rotationY: 0.4, accent: "#e2e2e8" },
    note: "Spherical tracking rings, adaptive triggers carried over from the DualSense. Cabled, the only thing keeping PSVR2 honest about where the GPU lives.",
  },
  {
    slug: "pico-motion-controller",
    name: "Pico Motion Controllers",
    shortName: "Pico Motion",
    category: "vr-controller",
    year: 2022,
    manufacturer: "Pico (ByteDance)",
    modelUrl: "/models/devices/vr-controllers/pico-motion-controller.glb",
    modelPresent: false,
    attribution: {
      source: "Sketchfab",
      author: "VR Hardware Library",
      licence: "CC0-1.0",
      url: "https://sketchfab.com/3d-models/pico-4-motion-controllers-2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e",
    },
    presentation: { scale: 0.85, rotationY: 0.4, accent: "#dcdce4" },
    note: "Touch-class layout, ring on top, the controller Pico ships with Pico 4 and 4 Ultra.",
  },
];
