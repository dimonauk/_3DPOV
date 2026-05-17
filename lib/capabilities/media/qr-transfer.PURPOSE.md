# qr-transfer.PURPOSE.md

## Role

Round-trip a text payload through a QR-friendly compressed URL. Encode
on a desktop chamber, display via qr-code-styling, scan with a phone
camera, decompress, drop into the same chamber on the receiving device.

## Public surface

- `encodeForTransfer(text, options?)` — text → URL with `?shader=...`.
- `parsePayload(scanned, options?)` — URL or raw text → `{ payload, fromUrl }`.
- `readPayloadFromCurrentUrl(options?)` — pull from `window.location`.
- `clearPayloadFromUrl(options?)` — strip param from address bar.
- `QR_TRANSFER_PARAM` — the canonical query-param name (`"shader"`).
- Types: `EncodeOptions`, `DecodeResult`.

## Internal

- `looksLikeGlsl(text)` — heuristic for accepting raw GLSL as a
  payload (last-resort scan path).

## Depends on

- `lz-string` (^1.5) — URL-safe compression so large payloads fit in
  one QR code.
- `URL` + `URLSearchParams` — standard browser APIs.

## Does not

- **Does not render QR codes.** Use `qr-code-styling` (already in
  package.json) — the chamber wraps the URL string in its own QR.
- **Does not scan with the camera.** Use `qr-scanner` (already in
  package.json) — the chamber wires the camera + decoder, then hands
  the decoded string to `parsePayload`.
- **Does not chunk large payloads across multiple QR codes.** Future
  work; until then, oversized shaders won't fit a single QR.

## Bordering files

- `lib/qr.ts` — branded QR rendering helpers for cards. Sister
  module; this capability is the *payload* side, qr.ts is the
  *render* side.
- `app/atelier/shader-station/` (planned) — primary consumer.
- `components/cards/*` — the cards system uses URLs that could
  share this capability if cards ever need code-style transfer.
