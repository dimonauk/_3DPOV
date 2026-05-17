# shader-editor.PURPOSE.md

## Role

Headless GLSL editing primitives: detect custom uniforms in authored
source, assemble a complete fragment shader (preamble + lib injection
+ entry point), try-compile against a throw-away WebGL context.

## Public surface

- `detectCustomUniforms(code)` → `CustomUniform[]`.
- `assembleFragment(code, options?)` → full fragment source string.
- `compileFragment(source)` → `{ ok, error }`.
- `BUILT_IN_UNIFORMS` — names the assemble preamble declares.
- Types: `Precision`, `CustomUniform`, `CustomUniformType`,
  `AssembleOptions`, `CompileResult`.

## Internal

- `UNIFORM_REGEX` — pre-compiled scanner.
- `PREAMBLE` — precision + built-in uniform declarations.
- `ENTRY` — `gl_FragColor` `void main()` wrapper.

## Depends on

- `lib/math/glsl/index.ts` — `injectLibs(code)` for HASH/NOISE/SDF/etc.

## Does not

- **Does not render.** Returns sources + compile status; the chamber
  feeds the assembled source to a Three.js ShaderMaterial.
- **Does not own state.** Pure functions over input strings.
- **Does not own uniform values.** `detectCustomUniforms` returns
  `{ name, type }` only; the chamber decides default values and the
  slider/colour-picker UI.
- **Does not handle code folding.** Authored `/* #FOLD:id */` markers
  are expanded by the chamber before passing to `assembleFragment`.

## Bordering files

- `lib/math/glsl/` — helper-fragment registry.
- `lib/capabilities/viz/shader-export.ts` — sibling capability that
  renders the assembled fragment to a PNG.
- `app/atelier/shader-station/` — primary consumer (currently inlines
  the assembly + compile logic; will migrate to these functions in a
  follow-up cleanup).
