# Screen Recording Notes — NLA Action Clips for VRM

OBS target: `public/library/videos/rigging/nla-action-clips-vrm/screen.mp4`

## OBS settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Audio | Disabled (no commentary track) |
| Format | mp4 (H.264 baseline, CRF 18) |

---

## Shot list

### Shot 1 — Scripting workspace, blueprint.py (0:00 – 0:40)

1. Open Blender 5.1. Close the splash screen.
2. Switch to the **Scripting** workspace (top tab bar).
3. Open `blueprint.py` (Text Editor → Open → navigate to the file).
4. Press **Run Script** (▶). The face proxy appears in the 3D viewport on the left.
5. Hover the 3D viewport; press **Numpad 1** for front view.
6. Pause ~2 s so the viewer can see the face mesh.

### Shot 2 — Properties editor: Shape Keys panel (0:40 – 1:10)

1. Click the face object to select it.
2. Open the **Properties** editor (right side panel).
3. Click the **Data Properties** tab (green triangle icon).
4. Scroll to **Shape Keys**. Show the six entries: Basis, Fcl_EYE_Close_L, Fcl_EYE_Close_R, Fcl_ALL_Joy, Fcl_ALL_Angry, Fcl_MTH_A.
5. Click each shape key in turn and drag the **Value** slider to 1.0. Show the face deforming. Return each to 0.0 before moving to the next.

### Shot 3 — NLA Editor: strip layout (1:10 – 1:50)

1. Change one of the editor areas to **Nonlinear Animation** (icon: filmstrip with arrow).
2. Expand the **face_nla_vrm** object in the NLA panel left column.
3. Show the five NLA tracks: blink_L, blink_R, happy, angry, aa — each containing one strip that spans frames 1-20.
4. Press **Space** (or **Shift+Space**) to play from frame 1. The five expressions cycle simultaneously in the viewport (they're all parallel). Pause after ~2 s.
5. Explain (title card or voiceover): "Each strip becomes a separate glTF animation clip."

### Shot 4 — glTF viewer verification (1:50 – 2:20)

1. Open a browser. Navigate to **gltf-viewer.donmccurdy.com**.
2. Drag `face_nla_vrm.glb` onto the viewer.
3. In the right panel, expand **Animations**. Five clip names appear: blink_L, blink_R, happy, angry, aa.
4. Click **blink_L** → **Play**. The face blinks left. Stop. Click **happy** → **Play**.  Show two clips simultaneously if the viewer supports it.
5. Pause on the animation list to let the viewer read the clip names.

### Shot 5 — Three.js AnimationMixer code snippet (2:20 – 2:45)

Show a code editor (VS Code, or the browser DevTools) with the following snippet:

```js
const mixer = new THREE.AnimationMixer( gltf.scene );
const clips = gltf.animations;          // five named clips

const blink = THREE.AnimationClip.findByName( clips, 'blink_L' );
const happy = THREE.AnimationClip.findByName( clips, 'happy' );

mixer.clipAction( blink ).play();
mixer.clipAction( happy ).play();       // both run simultaneously
```

Scroll through the snippet slowly. End on the `mixer.update( delta )` call.

---

## Tips

- Keep the screen.mp4 under **3 minutes** total — the NLA panel and browser demo are the key beats.
- If the face appears black in the viewport, switch the viewport shading to **Rendered** (Shift+Z) — EEVEE Next is required for the ShaderToRGB cel material.
- Blender 5.1 NLA editor: if strips appear greyed out, click the **shield icon** on the track to enable it.
