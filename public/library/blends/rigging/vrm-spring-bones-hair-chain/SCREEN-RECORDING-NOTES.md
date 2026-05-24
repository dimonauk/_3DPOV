# Screen Recording Notes — VRM Spring Bones

**Target file:** `public/library/videos/rigging/vrm-spring-bones-hair-chain/screen.mp4`
**OBS settings:** Window Source = Blender 5.1 · 1920×1080 · 30 fps · Audio off · CQP 20

---

## Shot list

### Shot 1 — Armature overview (0:00–0:30)
1. Open `vrm_spring_bones.blend` produced by `blueprint.py`.
2. Switch to the **Layout** workspace.  Set viewport shading to **Solid**.
3. Select `char_arm` in the Outliner.  Press **A** to see all bones highlighted.
4. In Properties → Object Data (armature icon) expand **Bone Collections**.
   Show the two collections: `Humanoid` and `SpringBone_Hair`.
5. Click the eye icon to hide `Humanoid` — only the hair chain remains visible.
   Toggle it back on.

### Shot 2 — Edit mode bone placement (0:30–1:00)
1. With `char_arm` selected, press **Tab** to enter Edit mode.
2. Orbit so the hair chain (four short bones behind the head) is clearly visible.
3. Select `Hair_1` and show the **Item** panel (N key) → note *Use Connect* is **off**.
   Explain via voice-over: this is the free-pivot attachment the spring solver needs.
4. Compare with `Head` → *Use Connect* is **on** (connected to Spine).
5. Press **Tab** to exit Edit mode.

### Shot 3 — Custom properties on spring bone (1:00–1:30)
1. Remain in Object mode, select `char_arm`, enter **Pose mode** (Ctrl-Tab).
2. Click `Hair_1` in the viewport.
3. Open **Properties → Bone** (bone icon).  Scroll to **Custom Properties**.
4. Show: `vrm_spring_stiffness = 4.0`, `vrm_spring_drag_force = 0.4`,
   `vrm_spring_hit_radius = 0.04`.
5. Click `Hair_4` — show that stiffness has tapered to a lower value (~1.7).

### Shot 4 — Weight paint inspection (1:30–2:00)
1. Exit Pose mode. Select the `hair_bead` mesh object.
2. Tab into **Weight Paint mode**.
3. From the Vertex Groups dropdown (Properties → Mesh Data → Vertex Groups) cycle
   through `Hair_1`, `Hair_2`, `Hair_3`.  Show the gradient colouring the bead.
4. Return to Object mode.

### Shot 5 — Pose the chain manually (2:00–2:30)
1. Select `char_arm`, enter Pose mode.
2. Select `Hair_1`, press **R X 20 Enter** to rotate 20° on local X.
3. Select `Hair_2`, press **R X 14 Enter** (slightly less — simulate natural sag).
4. Continue for `Hair_3` and `Hair_4`.
5. Show the chain hanging with a natural arc.
6. Press **Alt-A** (all bones selected → G clear) to reset.

### Shot 6 — VRM addon panel (optional, 2:30–3:00)
If VRM Addon for Blender (saturday06/VRM-Addon-for-Blender) is installed:
1. Select `char_arm`, open **Properties → Object Data**.
2. Show **VRM Spring Bone** panel — manually create a spring chain pointing to
   the `SpringBone_Hair` collection.
3. Set one joint's Stiffness to match the custom property value.
4. Re-export as **.vrm** via File → Export → VRM.

If not installed, record the Blender manual spring-bone diagram at
`https://docs.blender.org/manual/` as a reference cut.

---

## Post-processing
Trim to ≤ 3 min.  Add captions at each shot transition.
Place final file at `public/library/videos/rigging/vrm-spring-bones-hair-chain/screen.mp4`.
