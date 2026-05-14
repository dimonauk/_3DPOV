/**
 * Hardware spec for the POV rig simulator.
 *
 * One-line role: declare the real 2026 components the simulator models —
 * SK9822 LEDs, Teensy 4.1 MCU, TLE5012B Hall-effect sensor, 4S LiPo power.
 *
 * Edit these to keep the simulator in sync with the real bench rig.
 */

export const HARDWARE = {
  led: {
    chipset: "SK9822 / APA102C",
    package: "5050 SMD",
    voltage: 5,
    /** Lumens per LED at full white, typical drive current 20mA/channel. */
    lumensPerLed: 0.4,
    /** Switching rise/fall time in microseconds. */
    switchTimeUs: 3,
    /** Density on the strip. */
    ledsPerMeter: 144,
    /** Bits per channel. */
    colorBitsPerChannel: 8,
  },
  mcu: {
    name: "Teensy 4.1",
    core: "ARM Cortex-M7",
    clockMHz: 600,
    ramKB: 1024,
    flashMB: 8,
    /** Frame updates per second the firmware can sustain at full LED count. */
    maxFps: 800,
  },
  hallSensor: {
    name: "TLE5012B",
    /** Angular resolution in degrees. */
    resolutionDegrees: 0.011,
    /** I²C / SPI read latency in microseconds. */
    latencyUs: 10,
    /** Practical synchronisation jitter on the rig (microseconds). */
    jitterUs: 50,
  },
  power: {
    pack: "4S LiPo 11.1V, 50C",
    /** 5V buck regulator peak current capacity (amps). */
    peakAmps: 50,
  },
} as const;

export const FALLBACK_LED_COUNT = 200;

export type Pattern = "spectrum" | "wedges" | "studio-logo" | "checker";
