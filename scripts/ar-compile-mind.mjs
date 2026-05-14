#!/usr/bin/env node
/**
 * Compile a card-front PNG into a MindAR `.mind` image target.
 *
 * Uses sharp to decode the image instead of node-canvas — canvas's native
 * bindings don't ship prebuilt binaries for Node 24+, and building from
 * source on Windows requires Cairo + a full C++ toolchain. Sharp gives us
 * the raw RGBA bytes mind-ar's compiler actually needs.
 *
 * Architecture: we subclass mind-ar's CompilerBase with a tiny "fake canvas"
 * that returns the sharp-decoded RGBA buffer when getImageData is called.
 * No other code paths in mind-ar touch the canvas, so this is safe.
 *
 * Usage:
 *   node scripts/ar-compile-mind.mjs <slug>
 *
 * Reads:  public/cards/<slug>/card-front.png
 * Writes: public/cards/<slug>/target.mind
 */
import { CompilerBase } from "mind-ar/src/image-target/compiler-base.js";
import { buildTrackingImageList } from "mind-ar/src/image-target/image-list.js";
import { extractTrackingFeatures } from "mind-ar/src/image-target/tracker/extract-utils.js";
import "mind-ar/src/image-target/detector/kernels/cpu/index.js"; // registers TF.js CPU kernels
import sharp from "sharp";
import { promises as fs } from "node:fs";
import path from "node:path";

const slug = process.argv[2];
if (!slug || !/^[a-z0-9-]+$/i.test(slug)) {
  console.error("Usage: node scripts/ar-compile-mind.mjs <slug>");
  process.exit(1);
}

const dir = path.join(process.cwd(), "public", "cards", slug);
const inPath = path.join(dir, "card-front.png");
const outPath = path.join(dir, "target.mind");

// ---- sharp-backed fake canvas (just enough for mind-ar's compileImageTargets) ----

class FakeContext {
  drawImage(img) { this._img = img; }
  getImageData(_x, _y, w, h) {
    // mind-ar reads .data[offset], offset+1, offset+2 as R, G, B
    // We pre-decoded as RGBA via sharp, so this is what it expects.
    return { data: this._img._rgba, width: w, height: h };
  }
}

class FakeCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this._ctx = new FakeContext();
  }
  getContext() { return this._ctx; }
}

class SharpImage {
  constructor(rgba, width, height) {
    this._rgba = rgba;
    this.width = width;
    this.height = height;
  }
}

async function loadImageSharp(filePath) {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return new SharpImage(new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength), info.width, info.height);
}

// ---- Compiler subclass: provides Sharp-backed canvas + Node-side tracking ----

class SharpOfflineCompiler extends CompilerBase {
  createProcessCanvas(img) {
    return new FakeCanvas(img.width, img.height);
  }

  compileTrack({ progressCallback, targetImages, basePercent }) {
    return new Promise((resolve) => {
      const percentPerImage = (100 - basePercent) / targetImages.length;
      let percent = 0;
      const list = [];
      for (let i = 0; i < targetImages.length; i++) {
        const targetImage = targetImages[i];
        const imageList = buildTrackingImageList(targetImage);
        const percentPerAction = percentPerImage / imageList.length;
        const trackingData = extractTrackingFeatures(imageList, () => {
          percent += percentPerAction;
          progressCallback(basePercent + percent);
        });
        list.push(trackingData);
      }
      resolve(list);
    });
  }
}

// ---- Run ----

console.log(`Loading ${inPath}`);
const image = await loadImageSharp(inPath);
console.log(`  ${image.width}×${image.height} (${(image._rgba.length / 1024 / 1024).toFixed(1)} MB raw RGBA)`);

console.log("Compiling MindAR target...");
const compiler = new SharpOfflineCompiler();

let lastPct = -10;
await compiler.compileImageTargets([image], (pct) => {
  const rounded = Math.floor(pct / 10) * 10;
  if (rounded > lastPct) {
    console.log(`  ${rounded}%`);
    lastPct = rounded;
  }
});

const buffer = await compiler.exportData();
await fs.writeFile(outPath, new Uint8Array(buffer));

const stat = await fs.stat(outPath);
console.log(`✅ Wrote ${outPath} (${(stat.size / 1024).toFixed(1)} KB)`);
