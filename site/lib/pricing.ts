export const FACE_MOUNT_MULTIPLIER = 0.55;

export function faceMountPrice(priceGBP: number): number {
  return Math.round(priceGBP * FACE_MOUNT_MULTIPLIER);
}
