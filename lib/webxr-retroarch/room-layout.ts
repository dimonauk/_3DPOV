/**
 * lib/webxr-retroarch/room-layout.ts — Static positional math for the
 * virtual game room. Pure function. No React, no Three, no globals.
 *
 * The room is tuned for the WebXR "standing" reference space (Quest,
 * Vision Pro, Pico, Galaxy XR all default here). The visitor stands at
 * (0, 0, 0) with the floor under their feet. Eye-level lands at 1.6 m
 * because that's the WebXR runtime's seated→standing offset on every
 * shipping device.
 *
 * Distances picked from two constraints:
 *   - the average UK living-room CRT-and-armchair was about 2 m apart
 *     (an actual measurement from one of the studio's reference rooms,
 *     not a guess)
 *   - the @react-three/xr default playable area is ~2 m × 2 m before
 *     guardian boundaries start nagging
 *
 * If anyone touches these numbers, mirror them in the doc — they're
 * cited in docs/WEBXR-RETROARCH.md "spatial geometry" section.
 */

export type Vec3 = readonly [number, number, number];

export type RoomLayout = {
  playerPosition: Vec3;
  floorCenter: Vec3;
  floorRadius: number;
  tvCenter: Vec3;
  tvSize: Vec3;
  screenCenter: Vec3;
  screenSize: readonly [number, number];
  standCenter: Vec3;
  standSize: Vec3;
  tableCenter: Vec3;
  tableSize: Vec3;
  consolePosition: Vec3;
  keyLight: { position: Vec3; intensity: number; colour: string };
  fillLight: { position: Vec3; intensity: number; colour: string };
  rimLight: { position: Vec3; intensity: number; colour: string };
};

export function buildRoomLayout(): RoomLayout {
  const playerPosition: Vec3 = [0, 1.6, 0];
  const floorRadius = 2.0;
  const floorCenter: Vec3 = [0, 0, 0];

  // 26"-ish CRT chassis. Numbers measured from the studio's reference
  // 1996 Trinitron — 0.8 × 0.6 × 0.45 m.
  const tvSize: Vec3 = [0.8, 0.6, 0.45];
  const tvCenter: Vec3 = [0, 1.0, -2.0];

  // Screen plane sits flush on the chassis's front face, just shy of
  // z-fighting via a 1 mm forward offset.
  const screenSize: readonly [number, number] = [0.62, 0.46];
  const screenCenter: Vec3 = [
    tvCenter[0],
    tvCenter[1],
    tvCenter[2] + tvSize[2] / 2 + 0.001,
  ];

  const standSize: Vec3 = [0.9, 0.7, 0.5];
  const standCenter: Vec3 = [0, standSize[1] / 2, tvCenter[2]];

  // Side table — coffee-table height (0.78 m), within arm's reach.
  const tableSize: Vec3 = [0.7, 0.05, 0.5];
  const tableTopY = 0.78;
  const tableCenter: Vec3 = [0.8, tableTopY, -0.5];

  const consolePosition: Vec3 = [
    tableCenter[0] + 0.05,
    tableCenter[1] + tableSize[1] / 2,
    tableCenter[2] + 0.05,
  ];

  const keyLight = {
    position: [-1.5, 2.4, 1.5] as Vec3,
    intensity: 1.2,
    colour: "#fff1d5",
  };
  const fillLight = {
    position: [2.0, 1.8, 1.0] as Vec3,
    intensity: 0.45,
    colour: "#9bb3ff",
  };
  const rimLight = {
    position: [0, 2.4, -2.4] as Vec3,
    intensity: 0.6,
    colour: "#ffc4d9",
  };

  return {
    playerPosition,
    floorCenter,
    floorRadius,
    tvCenter,
    tvSize,
    screenCenter,
    screenSize,
    standCenter,
    standSize,
    tableCenter,
    tableSize,
    consolePosition,
    keyLight,
    fillLight,
    rimLight,
  };
}
