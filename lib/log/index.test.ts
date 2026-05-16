/**
 * lib/log/index.test.ts — Unit tests for the universal logger.
 *
 * Exercises level filtering, namespace propagation, child loggers,
 * and the side-effect contract on console.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createLogger, setLogLevel } from "./index";

describe("createLogger", () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let debugSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    setLogLevel("debug");
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
  });

  afterEach(() => {
    infoSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
    debugSpy.mockRestore();
    setLogLevel("error"); // restore the test-suite default
  });

  it("prefixes the namespace into the console output", () => {
    const log = createLogger("capability:vrm.load");
    log.info("loading", { url: "/dimona.vrm" });
    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy.mock.calls[0]![0]).toBe("[info] capability:vrm.load");
    expect(infoSpy.mock.calls[0]![1]).toBe("loading");
    expect(infoSpy.mock.calls[0]![2]).toEqual({ url: "/dimona.vrm" });
  });

  it("routes each level to its matching console method", () => {
    const log = createLogger("test");
    log.debug("d");
    log.info("i");
    log.warn("w");
    log.error("e");
    expect(debugSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it("filters out calls below the configured threshold", () => {
    setLogLevel("warn");
    const log = createLogger("test");
    log.debug("d");
    log.info("i");
    log.warn("w");
    log.error("e");
    expect(debugSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it("omits the fields argument when none was supplied", () => {
    const log = createLogger("test");
    log.info("hello");
    expect(infoSpy.mock.calls[0]!.length).toBe(2);
  });

  it("child loggers extend the parent namespace with a colon", () => {
    const parent = createLogger("capability:viz");
    const child = parent.child("splat-render");
    child.info("rendering");
    expect(infoSpy.mock.calls[0]![0]).toBe("[info] capability:viz:splat-render");
  });

  it("does not throw when given fields with cyclic references", () => {
    // The logger must NEVER blow up a request just because the
    // payload it was handed wasn't serialisable.
    const log = createLogger("test");
    const cyclic: Record<string, unknown> = { name: "x" };
    cyclic.self = cyclic;
    expect(() => log.warn("got cyclic", cyclic)).not.toThrow();
  });
});
