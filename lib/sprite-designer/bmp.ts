/**
 * lib/sprite-designer/bmp.ts — 24-bpp uncompressed BMP encoder.
 *
 * BITMAPFILEHEADER (14 bytes) + BITMAPINFOHEADER (40 bytes) + pixel data.
 * Rows are bottom-up, BGR order, padded to 4 bytes. Output matches what the
 * drone POV firmware (jbreizh/ImagePainting) reads off the SD card / flash.
 */

export function encodeBmp24(img: ImageData): Uint8Array {
  const { width, height, data } = img;
  const rowBytes = width * 3;
  const padPerRow = (4 - (rowBytes % 4)) % 4;
  const paddedRow = rowBytes + padPerRow;
  const pixelArraySize = paddedRow * height;
  const fileSize = 14 + 40 + pixelArraySize;

  const out = new Uint8Array(fileSize);
  const view = new DataView(out.buffer);

  // BITMAPFILEHEADER
  out[0] = 0x42;
  out[1] = 0x4d; // 'BM'
  view.setUint32(2, fileSize, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, 0, true);
  view.setUint32(10, 14 + 40, true);

  // BITMAPINFOHEADER
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true); // planes
  view.setUint16(28, 24, true); // bpp
  view.setUint32(30, 0, true); // compression = BI_RGB
  view.setUint32(34, pixelArraySize, true);
  view.setInt32(38, 2835, true); // ~72 DPI
  view.setInt32(42, 2835, true);
  view.setUint32(46, 0, true); // colors used
  view.setUint32(50, 0, true); // important colors

  // Pixel data (bottom-up).
  let p = 54;
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      // data is RGBA Uint8ClampedArray; (y, x) inside width × height bounds.
      out[p++] = data[i + 2]!; // B
      out[p++] = data[i + 1]!; // G
      out[p++] = data[i + 0]!; // R
    }
    for (let pad = 0; pad < padPerRow; pad++) out[p++] = 0;
  }

  return out;
}
