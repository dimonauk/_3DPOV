/**
 * lib/stage/rooms.test.ts — Room registry sanity tests.
 *
 * The room registry is mostly static data, but a few invariants
 * matter: getRoom always returns a valid room (default fall-back),
 * every room has the keys the Stage component reads, and every
 * registered slug resolves.
 */

import { describe, expect, it } from "vitest";

import { ROOMS, ROOM_SLUGS, getRoom, DEFAULT_AVATAR_URL } from "./rooms";

describe("rooms registry", () => {
  it("exposes a non-empty list of slugs", () => {
    expect(ROOM_SLUGS.length).toBeGreaterThan(0);
  });

  it("includes the studio reference room", () => {
    expect(ROOM_SLUGS).toContain("studio");
  });

  it("every slug in ROOM_SLUGS resolves to a room in ROOMS", () => {
    for (const slug of ROOM_SLUGS) {
      expect(ROOMS[slug]).toBeDefined();
      expect(ROOMS[slug]!.slug).toBe(slug);
    }
  });

  it("every room declares the keys the Stage component reads", () => {
    for (const slug of ROOM_SLUGS) {
      const room = ROOMS[slug]!;
      expect(room.environment).toBeDefined();
      expect(room.environment.kind).toMatch(/^preset|url$/);
      expect(room.ground).toBeDefined();
      expect(["contact", "plane", "none"]).toContain(room.ground.kind);
      expect(room.camera).toBeDefined();
      expect(room.camera.position).toHaveLength(3);
      expect(room.camera.target).toHaveLength(3);
    }
  });

  it("DEFAULT_AVATAR_URL points at the deployed Dimona VRM", () => {
    expect(DEFAULT_AVATAR_URL).toBe("/dimona.vrm");
  });

  describe("getRoom", () => {
    it("returns the requested room when the slug is known", () => {
      const room = getRoom("warehouse");
      expect(room.slug).toBe("warehouse");
    });

    it("falls back to the studio room for an unknown slug", () => {
      const room = getRoom("does-not-exist");
      expect(room.slug).toBe("studio");
    });

    it("falls back to the studio room for null and undefined", () => {
      expect(getRoom(null).slug).toBe("studio");
      expect(getRoom(undefined).slug).toBe("studio");
    });
  });
});
