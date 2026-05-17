# shader-export.PURPOSE.md

## Role

Render a compiled fragment shader to a PNG snapshot at equirect /
square / arbitrary size. The export-button substrate for the
shader-station chamber; any pipeline that wants a still image from a
GLSL fragment can call directly.

## Public surface

- `exportShaderToDataUrl(options)` → `data:image/png;base64,...` string.
- `downloadShaderPng(options, filename)` → triggers download, returns
  the filename used.
- Types: `ExportSize` (`equirect` / `square` / `custom`),
  `ExportShaderOptions`.

## Internal

- `dimensionsFor(size)` — switch from ExportSize → `{width, height}`.
- `VERTEX_SHADER` — full-screen quad vertex shader.
- `DEFAULT_PALETTE` — fallback palette colours.

## Depends on

- `three` (^0.171) — WebGLRenderer + ShaderMaterial.
- `lib/capabilities/viz/shader-editor.ts` — `assembleFragment()` for
  the preamble + lib injection.

## Does not

- **Does not animate.** Renders one frame at `u_time = 0`. Animated
  export (MP4/GIF) is a future sibling capability.
- **Does not own the chamber UI.** Caller decides when to fire the
  export and what filename to use.
- **Does not server-side render.** Three.js's WebGLRenderer needs a
  DOM canvas. Headless server bakes (Vercel route handlers, build-time
  snapshot generation) would land as `shader-export-headless` using
  `@napi-rs/canvas` + a software WebGL implementation.

## Bordering files

- `lib/capabilities/viz/shader-editor.ts` — pre-flight compile +
  source assembly.
- `lib/capabilities/viz/usdz-export.ts` — sibling export capability
  for the AR Quick Look path.
- `lib/capabilities/media/capture.ts` — sibling for camera+composite
  PNG captures.
