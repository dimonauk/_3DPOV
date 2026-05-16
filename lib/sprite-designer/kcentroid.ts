/**
 * lib/sprite-designer/kcentroid.ts — K-Centroid downsampling in TypeScript.
 *
 * Same algorithm as the Pixelorama extension at
 * `D:/The_Hangar/tools/pixelorama-kcentroid/`. Splits the source ImageData
 * into dst_w × dst_h tiles, runs k-means in RGB space, returns recoloured
 * tiles + the dst-sized centroid image. Pure browser JS; no deps.
 */

type ImgOut = { tiles: ImageData; centroid: ImageData };

export function kCentroid(
  src: ImageData,
  dstW: number,
  dstH: number,
  k = 4,
  iters = 3,
): ImgOut {
  const srcW = src.width;
  const srcH = src.height;
  const tilesData = new Uint8ClampedArray(srcW * srcH * 4);
  const centroidData = new Uint8ClampedArray(dstW * dstH * 4);

  for (let ty = 0; ty < dstH; ty++) {
    for (let tx = 0; tx < dstW; tx++) {
      const x0 = Math.floor((tx * srcW) / dstW);
      const y0 = Math.floor((ty * srcH) / dstH);
      const x1 = Math.min(srcW, Math.floor(((tx + 1) * srcW) / dstW));
      const y1 = Math.min(srcH, Math.floor(((ty + 1) * srcH) / dstH));

      const n = (x1 - x0) * (y1 - y0);
      const px = new Float32Array(n * 3);
      let i = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const idx = (y * srcW + x) * 4;
          px[i * 3 + 0] = src.data[idx + 0];
          px[i * 3 + 1] = src.data[idx + 1];
          px[i * 3 + 2] = src.data[idx + 2];
          i++;
        }
      }

      const cents = new Float32Array(k * 3);
      for (let j = 0; j < k; j++) {
        const r = Math.floor(Math.random() * n);
        cents[j * 3 + 0] = px[r * 3 + 0];
        cents[j * 3 + 1] = px[r * 3 + 1];
        cents[j * 3 + 2] = px[r * 3 + 2];
      }

      const assign = new Int32Array(n);
      const counts = new Int32Array(k);

      for (let it = 0; it < iters; it++) {
        for (let p = 0; p < n; p++) {
          const pr = px[p * 3 + 0];
          const pg = px[p * 3 + 1];
          const pb = px[p * 3 + 2];
          let best = 0;
          let bestD = Infinity;
          for (let c = 0; c < k; c++) {
            const dr = pr - cents[c * 3 + 0];
            const dg = pg - cents[c * 3 + 1];
            const db = pb - cents[c * 3 + 2];
            const d = dr * dr + dg * dg + db * db;
            if (d < bestD) {
              bestD = d;
              best = c;
            }
          }
          assign[p] = best;
        }
        const sums = new Float32Array(k * 3);
        counts.fill(0);
        for (let p = 0; p < n; p++) {
          const c = assign[p];
          sums[c * 3 + 0] += px[p * 3 + 0];
          sums[c * 3 + 1] += px[p * 3 + 1];
          sums[c * 3 + 2] += px[p * 3 + 2];
          counts[c]++;
        }
        for (let c = 0; c < k; c++) {
          if (counts[c] > 0) {
            cents[c * 3 + 0] = sums[c * 3 + 0] / counts[c];
            cents[c * 3 + 1] = sums[c * 3 + 1] / counts[c];
            cents[c * 3 + 2] = sums[c * 3 + 2] / counts[c];
          }
        }
      }

      let biggest = 0;
      for (let c = 1; c < k; c++) if (counts[c] > counts[biggest]) biggest = c;

      let p2 = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const idx = (y * srcW + x) * 4;
          const c = assign[p2];
          tilesData[idx + 0] = cents[c * 3 + 0];
          tilesData[idx + 1] = cents[c * 3 + 1];
          tilesData[idx + 2] = cents[c * 3 + 2];
          tilesData[idx + 3] = 255;
          p2++;
        }
      }

      const cidx = (ty * dstW + tx) * 4;
      centroidData[cidx + 0] = cents[biggest * 3 + 0];
      centroidData[cidx + 1] = cents[biggest * 3 + 1];
      centroidData[cidx + 2] = cents[biggest * 3 + 2];
      centroidData[cidx + 3] = 255;
    }
  }

  return {
    tiles: new ImageData(tilesData, srcW, srcH),
    centroid: new ImageData(centroidData, dstW, dstH),
  };
}
