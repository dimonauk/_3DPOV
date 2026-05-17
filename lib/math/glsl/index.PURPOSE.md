# lib/math/glsl/index.PURPOSE.md

## Role

GLSL helper-library assembly. Authored shaders call `hash11`, `perlin`,
`sdSphere`, `cosPalette`, etc. without having to copy-paste the
definitions. `injectLibs(code)` prepends the fragments a given shader
actually uses, in dependency-correct order.

## Public surface

- `injectLibs(code, libs?)` — assemble a complete shader source.
- `detectUsedLibs(code)` — regex-scan for known function names.
- `GLSL_LIBS` — the keyed map of fragments.
- Named fragment exports: `HASH`, `NOISE`, `VORONOI`, `COLOR`, `SDF`.
- `GlslLibKey` type union.

## Internal

- `SDF_KEYWORDS` + `SDF_REGEX` — keyword list and pre-compiled
  regex for the larger SDF detection pass.

## Depends on

- No runtime deps. Pure string assembly.

## Does not

- **Does not compile shaders.** The compiler lives in the chamber
  using the fragments (e.g. `viz.shader-editor`).
- **Does not validate GLSL syntax.** Detection is regex-only; a
  shader can name a function `hash12` without intending to use the
  fragment and still cause a prepend.
- **Does not deduplicate symbols.** If a shader already declares
  `hash11` and uses the helper too, the compile fails with a
  redeclaration error. Authors should rely on `injectLibs` or roll
  their own — not both.

## Bordering files

- `lib/capabilities/viz/shader-editor.ts` — the consumer; calls
  `injectLibs` before handing source to the WebGL compiler.
- `lib/algorithms/shaders/presets/*` — preset shaders that rely on
  these helpers being injected.
- `app/atelier/waveguide-forge/webgpu-photonmap.ts` — sibling that
  rolls its own helpers; both are valid, no shared surface yet.
