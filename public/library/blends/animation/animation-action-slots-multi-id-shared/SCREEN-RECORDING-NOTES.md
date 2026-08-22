# Screen Recording Notes — Action Slots Multi-ID Shared Action

**Output target:** `public/library/videos/animation/animation-action-slots-multi-id-shared/screen.mp4`

## OBS Settings

| Setting | Value |
|---------|-------|
| Window source | Blender 5.1 (full application window) |
| Base resolution | 1920 × 1080 |
| Output resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic or desktop audio) |
| Output format | MP4 — H.264, CRF 18 |

## Shot List

**Segment 1 — Dope Sheet overview (20 s)**
- Open `perf_01` action in the Dope Sheet (Action Editor mode)
- Expand the view to show all three slot headers: `body_rig`, `sword_prop`, `face_mesh_keys`
- Scrub the timeline slowly from frame 1 to 60 so the viewer sees the three independent channel sets moving together

**Segment 2 — Slot assignment in the Properties panel (15 s)**
- Click `body_rig` armature → Properties → Object Properties → Animation section
- Hover over the **Action Slot** dropdown to show it reads `body_rig` (slot name)
- Switch to `sword_prop` object, same path — show its slot reads `sword_prop`
- Switch to `face_mesh`, navigate to Mesh → Shape Keys section — note same action listed but different slot

**Segment 3 — NLA Editor: one strip (15 s)**
- Open the NLA Editor
- Push all three objects' animation to NLA with `NLA → Push Down Action`
- Show all three objects with NLA strips labelled `perf_01` — same action name, three strips, one strip per object
- Mute/unmute the `sword_prop` strip to demonstrate independent control while other slots continue playing

**Segment 4 — Playback (10 s)**
- Switch back to the 3D Viewport with Workbench shading, colour-by-object
- Play the animation (Space) — viewer sees the forearm rotating while the blue prop cube rises independently

## Editing Notes

- Target duration: 60 seconds total
- No music
- No voiceover — the footage is tutorial B-roll for screen.mp4; spoken commentary is added during post-production editing in the VSE tutorial
- Crop to 1920 × 1080 exactly before export; do not letterbox
