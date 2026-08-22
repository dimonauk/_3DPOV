# Python bpy.types.Speaker — Positional Audio Scene Composition for WebXR

**Blender 5.1 | CC0 | Holoflow Studio**

Author Speaker data blocks via the direct data API, configure attenuation
and directional cone parameters, animate speaker objects along Bézier orbit
paths, and export a `speakers_manifest.json` for `THREE.PositionalAudio`.

## Artefacts

| File | Description |
|---|---|
| `blueprint.py` | Full scene + export script, runs headless |
| `record.py` | Viewport-render recorder → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS screen-capture instructions |
| `.expected-artefacts.json` | CI artefact manifest |
| `speakers_manifest.json` | *(generated)* speaker params + animated positions |
| `speaker_scene.glb` | *(generated)* scene geometry for WebXR placement |

## Quick start

1. Open Blender 5.1. New General file.
2. Scripting workspace → open `blueprint.py` → Run Script.
3. Inspect the three speaker objects (cone gizmos visible in viewport).
4. Open `speakers_manifest.json` in a text editor to see the baked positions.
5. Run `record.py` to render `viewport.mp4`.

## Audio file placeholders

`blueprint.py` references `//audio/ambient_loop.wav` and `//audio/kiosk_prompt.wav`.
Replace these paths with your actual audio files. The Speaker data block will
show a red-X missing-file indicator until the paths resolve — this does not
prevent the script from exporting the manifest.

## Three.js consumption pattern

```js
import * as THREE from 'three';
import manifest from './speakers_manifest.json';

const listener = new THREE.AudioListener();
camera.add(listener);

for (const sp of manifest.speakers) {
  const audio = new THREE.PositionalAudio(listener);
  audio.setDistanceModel('inverse');
  audio.setRolloffFactor(sp.rolloff_factor);
  audio.setRefDistance(sp.ref_distance_m);
  audio.setMaxDistance(sp.max_distance_m);
  audio.panner.coneInnerAngle = sp.cone_inner_deg;
  audio.panner.coneOuterAngle = sp.cone_outer_deg;
  audio.panner.coneOuterGain  = sp.cone_outer_gain;
  // Position from manifest (frame "1" = rest pose)
  const p = sp.frames['1'].position;
  audio.position.set(p[0], p[1], p[2]);
  scene.add(audio);
  // Animate using sp.frames[String(currentFrame)].position each RAF
}
```

## Outside sources

- Blender Foundation `bpy.types.Speaker` API (CC-BY-4.0):
  <https://docs.blender.org/api/5.1/bpy.types.Speaker.html>
- mrdoob/three.js `PositionalAudio` (MIT):
  <https://github.com/mrdoob/three.js/blob/dev/src/audio/PositionalAudio.js>
