#!/usr/bin/env node
/**
 * scripts/ar-compile-mind-from-bytes.mjs
 *
 * Stdin-PNG → stdout-.mind variant of `ar-compile-mind.mjs`. The
 * slug-based script remains the operator-facing CLI; THIS one is for
 * the server-side capability to spawn as a subprocess when the
 * in-process compile fails (TF.js module-state corruption, sharp
 * binding glitches, memory pressure, etc).
 *
 * Why a separate script:
 *
 *   1. **Fresh node process.** Spawning isolates TF.js / mind-ar state
 *      from the long-lived Next.js server process. If the in-process
 *      compile poisoned some shared module table, the subprocess starts
 *      clean.
 *
 *   2. **Stdin/stdout streaming.** Avoids writing the source image to
 *      disk on read-only filesystems (Vercel functions, container
 *      sandboxes). Bytes flow in/out directly.
 *
 *   3. **Identical compile path.** Uses the same lower-level mind-ar
 *      imports as `ar-compile-mind.mjs` and the in-process compiler —
 *      so a subprocess that succeeds proves the in-process failure was
 *      environmental, not algorithmic.
 *
 * Usage:
 *
 *   cat card-front.png | node scripts/ar-compile-mind-from-bytes.mjs > target.mind
 *
 * Exit codes:
 *   0  — success, .mind buffer on stdout
 *   1  — usage / runtime error, message on stderr
 */

import { CompilerBase } from "mind-ar/src/image-target/compiler-base.js";
import { buildTrackingImageList } from "mind-ar/src/image-target/image-list.js";
import { extractTrackingFeatures } from "mind-ar/src/image-target/tracker/extract-utils.js";
import "mind-ar/src/image-target/detector/kernels/cpu/index.js";
import sharp from "sharp";

// ---- Read all of stdin as a single Buffer ----

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// ---- Sharp-backed fake canvas (matches ar-compile-mind.mjs exactly) ----

class FakeContext {
  drawImage(img) {
    this._img = img;
  }
  getImageData(_x, _y, w, h) {
    return { data: this._img._rgba, width: w, height: h };
  }
}

class FakeCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this._ctx = new FakeContext();
  }
  getContext() {
    return this._ctx;
  }
}

class SharpImage {
  constructor(rgba, width, height) {
    this._rgba = rgba;
    this.width = width;
    this.height = height;
  }
}

async function loadImageSharpFromBytes(bytes) {
  const { data, info } = await sharp(bytes)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return new SharpImage(
    new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength),
    info.width,
    info.height,
  );
}

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

try {
  const bytes = await readStdin();
  if (bytes.length === 0) {
    process.stderr.write("ar-compile-mind-from-bytes: empty stdin\n");
    process.exit(1);
  }
  const image = await loadImageSharpFromBytes(bytes);
  process.stderr.write(
    `ar-compile-mind-from-bytes: image ${image.width}x${image.height}\n`,
  );

  const compiler = new SharpOfflineCompiler();
  let lastPct = -10;
  await compiler.compileImageTargets([image], (pct) => {
    const rounded = Math.floor(pct / 10) * 10;
    if (rounded > lastPct) {
      process.stderr.write(`ar-compile-mind-from-bytes: ${rounded}%\n`);
      lastPct = rounded;
    }
  });

  const buffer = await compiler.exportData();
  const out = new Uint8Array(buffer);
  process.stderr.write(
    `ar-compile-mind-from-bytes: done, ${out.byteLength} bytes\n`,
  );
  // Write the .mind bytes to stdout. The parent process reads them.
  process.stdout.write(Buffer.from(out));
} catch (err) {
  process.stderr.write(
    `ar-compile-mind-from-bytes: ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exit(1);
}
