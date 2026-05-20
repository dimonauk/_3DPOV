/**
 * lib/play/constants.ts — shared constants for the /play surface.
 *
 * Split out of families.ts so the per-family systems files (under
 * ./systems/) can import the bench-bridge doc anchor without a
 * circular import back through families.ts.
 */

/** Shared bench-bridge doc anchor used by every native-emulator path. */
export const EMU_NATIVE_DOC = "/docs/emulation-native";
