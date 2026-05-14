# mind-ar 1.2.5 Three.js r152+ patch

`node_modules/mind-ar/dist/mindar-image-three.prod.js` was built against pre-r152 Three.js which exposed `sRGBEncoding`, `LinearEncoding`, and `WebGLRenderer.outputEncoding`. These were removed in r152 in favor of the new color-management API:

| Legacy (≤ r151) | Modern (r152+) |
|---|---|
| `THREE.sRGBEncoding` (constant `3001`) | `THREE.SRGBColorSpace` (`'srgb'`) |
| `THREE.LinearEncoding` (constant `3000`) | `THREE.LinearSRGBColorSpace` (`'srgb-linear'`) |
| `renderer.outputEncoding = …` | `renderer.outputColorSpace = …` |

With Three.js 0.172 (installed in this project), the un-patched mind-ar bundle throws on import:
```
Attempted import error: 'sRGBEncoding' is not exported from 'three' (imported as 'Si').
```

## The patch

Three string replacements in `node_modules/mind-ar/dist/mindar-image-three.prod.js`:

```
sRGBEncoding   →  SRGBColorSpace
LinearEncoding →  LinearSRGBColorSpace
outputEncoding →  outputColorSpace
```

Backup written alongside: `mindar-image-three.prod.js.bak` (the original, pre-patch).

## Re-applying after reinstall

pnpm preserves nothing from the previous install. After `pnpm install`, the patch is lost.

To re-apply manually:

```powershell
$bundle = "node_modules/mind-ar/dist/mindar-image-three.prod.js"
$content = Get-Content -LiteralPath $bundle -Raw -Encoding UTF8
$patched = $content `
  -replace 'sRGBEncoding', 'SRGBColorSpace' `
  -replace 'LinearEncoding', 'LinearSRGBColorSpace' `
  -replace 'outputEncoding', 'outputColorSpace'
[System.IO.File]::WriteAllText($bundle, $patched, [System.Text.UTF8Encoding]::new($false))
```

## Long-term fix options

1. **Use a maintained fork:** `@hiukim/mind-ar-js` upstream has unmerged PRs for this. Check if there's a newer release on npm; bump the version in `package.json`.

2. **Pin Three.js to ≤ r151:** not possible — the rest of the studio depends on Three 0.170+ for WebGPU/TSL features used in the kata cinematic and waveguide preview.

3. **Write a patch-package shim:** install `patch-package`, snapshot the patched bundle, replay via `postinstall`. Worth it once we hit a third dependency that needs patching.

## Semantics

`sRGBEncoding` was a numeric constant (`3001`); `SRGBColorSpace` is a string (`'srgb'`). The patch substitutes one for the other in all usage contexts, which works because mind-ar only uses these for property assignment (`material.encoding = THREE.sRGBEncoding`). Any code path that does `=== THREE.sRGBEncoding` numerical comparison would break — none exists in the mind-ar bundle.
