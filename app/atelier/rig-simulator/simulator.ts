/**
 * Three.js TSL + WebGPU simulator core for the POV rig.
 *
 * One-line role: own the WebGPURenderer, two scenes (live perspective rig
 * view + orthographic accumulator), instanced LED meshes with TSL emission,
 * and the per-frame loop that advances the simulated rotation and
 * accumulates the long exposure into an HDR render target.
 *
 * The React surface mounts this class once in a useEffect and pushes
 * inputs (rpm, source image, exposure length) through setter methods.
 */

import * as THREE from "three/webgpu";
import { Fn, instancedBufferAttribute, smoothstep, uv, vec4 } from "three/tsl";

import { createLogger, errToObject } from "lib/log";

import { FALLBACK_LED_COUNT } from "./hardware";

const log = createLogger("atelier:rig-simulator:core");

export type ProgressCallback = (progress: number, events: number) => void;

export class Simulator {
  private renderer: THREE.WebGPURenderer;
  private accumScene: THREE.Scene;
  private liveScene: THREE.Scene;
  private accumCamera: THREE.OrthographicCamera;
  private liveCamera: THREE.PerspectiveCamera;
  private accumTarget: THREE.RenderTarget;
  private accumDisplayCanvas: HTMLCanvasElement;
  private accumDisplayCtx: CanvasRenderingContext2D | null;
  private ledMesh: THREE.InstancedMesh | null = null;
  private liveLedMesh: THREE.InstancedMesh | null = null;
  private ledPositions: Float32Array | null = null;
  private ledColors: Float32Array | null = null;
  private ledColorsAttr: THREE.InstancedBufferAttribute | null = null;
  private livePositionsAttr: THREE.InstancedBufferAttribute | null = null;
  private liveColorsAttr: THREE.InstancedBufferAttribute | null = null;
  private sourceData: Uint8ClampedArray | null = null;
  private sourceWidth = 0;
  private sourceHeight = 0;
  private rpm = 180;
  private ledCount = FALLBACK_LED_COUNT;
  private rigRadius = 1.0;
  private angle = 0;
  private startedAt = 0;
  private exposureSeconds = 0;
  private rafId: number | null = null;
  private onProgress: ProgressCallback | null = null;
  private eventsRecorded = 0;
  private accumulated = false;

  private constructor(
    renderer: THREE.WebGPURenderer,
    canvas: HTMLCanvasElement,
    accumDisplay: HTMLCanvasElement,
  ) {
    this.renderer = renderer;
    this.accumDisplayCanvas = accumDisplay;
    this.accumDisplayCtx = accumDisplay.getContext("2d");

    this.liveScene = new THREE.Scene();
    this.liveScene.background = new THREE.Color(0x05050a);
    this.liveCamera = new THREE.PerspectiveCamera(
      35,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      30,
    );
    this.liveCamera.position.set(2.5, 1.2, 3.2);
    this.liveCamera.lookAt(0, 0, 0);

    this.accumScene = new THREE.Scene();
    this.accumCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    this.accumCamera.position.set(0, 0, 5);
    this.accumCamera.lookAt(0, 0, 0);
    this.accumTarget = new THREE.RenderTarget(512, 512, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      colorSpace: THREE.NoColorSpace,
    });

    this.resize(canvas);
  }

  static async create(
    liveCanvas: HTMLCanvasElement,
    accumCanvas: HTMLCanvasElement,
  ): Promise<Simulator> {
    const renderer = new THREE.WebGPURenderer({
      antialias: true,
      canvas: liveCanvas,
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(liveCanvas.clientWidth, liveCanvas.clientHeight, false);
    renderer.setClearColor(new THREE.Color(0x05050a), 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    await renderer.init();
    return new Simulator(renderer, liveCanvas, accumCanvas);
  }

  setRpm(rpm: number): void {
    this.rpm = rpm;
  }

  setSource(data: Uint8ClampedArray, width: number, height: number): void {
    this.sourceData = data;
    this.sourceWidth = width;
    this.sourceHeight = height;
    this.rebuildLedRig(height);
  }

  private rebuildLedRig(ledCount: number): void {
    this.ledCount = ledCount;
    this.ledPositions = new Float32Array(ledCount * 3);
    this.ledColors = new Float32Array(ledCount * 3);
    for (let i = 0; i < ledCount; i++) {
      const yNorm = (i / (ledCount - 1)) * 2 - 1;
      this.ledPositions[i * 3] = this.rigRadius;
      this.ledPositions[i * 3 + 1] = yNorm * 0.8;
      this.ledPositions[i * 3 + 2] = 0;
    }
    this.ledColorsAttr = new THREE.InstancedBufferAttribute(this.ledColors, 3);
    this.livePositionsAttr = new THREE.InstancedBufferAttribute(this.ledPositions, 3);
    this.liveColorsAttr = new THREE.InstancedBufferAttribute(this.ledColors, 3);

    this.disposeLedMeshes();

    this.liveLedMesh = this.makeLedMesh(
      this.livePositionsAttr,
      this.liveColorsAttr,
      0.018,
      false,
    );
    this.liveScene.add(this.liveLedMesh);

    this.ledMesh = this.makeLedMesh(
      new THREE.InstancedBufferAttribute(this.ledPositions, 3),
      new THREE.InstancedBufferAttribute(this.ledColors, 3),
      0.012,
      true,
    );
    this.accumScene.add(this.ledMesh);
  }

  private disposeLedMeshes(): void {
    if (this.liveLedMesh) {
      this.liveScene.remove(this.liveLedMesh);
      (this.liveLedMesh.material as THREE.Material).dispose();
      this.liveLedMesh.geometry.dispose();
    }
    if (this.ledMesh) {
      this.accumScene.remove(this.ledMesh);
      (this.ledMesh.material as THREE.Material).dispose();
      this.ledMesh.geometry.dispose();
    }
  }

  private makeLedMesh(
    posAttr: THREE.InstancedBufferAttribute,
    colorAttr: THREE.InstancedBufferAttribute,
    sizeMetres: number,
    additive: boolean,
  ): THREE.InstancedMesh {
    const geometry = new THREE.PlaneGeometry(sizeMetres, sizeMetres);
    const material = new THREE.SpriteNodeMaterial();
    material.transparent = true;
    material.depthWrite = false;
    if (additive) material.blending = THREE.AdditiveBlending;
    material.positionNode = instancedBufferAttribute(posAttr);
    material.colorNode = Fn(() => {
      const c = instancedBufferAttribute(colorAttr);
      const d = uv().sub(0.5).length();
      const a = smoothstep(0.5, 0.35, d);
      return vec4(c.mul(2.4), a);
    })();
    const mesh = new THREE.InstancedMesh(geometry, material, this.ledCount);
    mesh.count = this.ledCount;
    mesh.frustumCulled = false;
    return mesh;
  }

  private setLedColorsForAngle(angle: number): void {
    if (
      !this.sourceData ||
      !this.ledColorsAttr ||
      !this.liveColorsAttr ||
      !this.ledColors
    )
      return;
    const sliceFloat = ((angle / (Math.PI * 2)) % 1) * this.sourceWidth;
    const col = Math.floor(
      ((sliceFloat % this.sourceWidth) + this.sourceWidth) % this.sourceWidth,
    );
    const w = this.sourceWidth;
    const h = this.sourceHeight;
    for (let i = 0; i < this.ledCount; i++) {
      const j = Math.min(
        h - 1,
        Math.max(0, Math.floor((i / (this.ledCount - 1)) * (h - 1))),
      );
      const idx = (j * w + col) * 3;
      this.ledColors[i * 3] = this.sourceData[idx]! / 255;
      this.ledColors[i * 3 + 1] = this.sourceData[idx + 1]! / 255;
      this.ledColors[i * 3 + 2] = this.sourceData[idx + 2]! / 255;
    }
    this.ledColorsAttr.needsUpdate = true;
    this.liveColorsAttr.needsUpdate = true;
  }

  clearAccumulator(): void {
    this.renderer.setRenderTarget(this.accumTarget);
    this.renderer.setClearColor(new THREE.Color(0x000000), 1);
    this.renderer.clear();
    this.renderer.setRenderTarget(null);
    this.eventsRecorded = 0;
    this.accumulated = false;
    if (this.accumDisplayCtx) {
      this.accumDisplayCtx.clearRect(
        0,
        0,
        this.accumDisplayCanvas.width,
        this.accumDisplayCanvas.height,
      );
    }
  }

  start(exposureSeconds: number, onProgress: ProgressCallback): void {
    this.exposureSeconds = exposureSeconds;
    this.onProgress = onProgress;
    this.startedAt = performance.now();
    this.eventsRecorded = 0;
    this.tick();
  }

  stop(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.onProgress = null;
  }

  private tick = (): void => {
    const elapsed = (performance.now() - this.startedAt) / 1000;
    const progress = Math.min(1, elapsed / this.exposureSeconds);

    const revsPerSecond = this.rpm / 60;
    const dtRender = 1 / 60;
    this.angle += revsPerSecond * Math.PI * 2 * dtRender;
    this.setLedColorsForAngle(this.angle);

    if (this.liveLedMesh) this.liveLedMesh.rotation.y = this.angle;
    if (this.ledMesh) this.ledMesh.rotation.y = this.angle;
    this.eventsRecorded += this.ledCount;

    this.renderer.setRenderTarget(null);
    this.renderer.setClearColor(new THREE.Color(0x05050a), 1);
    this.renderer.autoClear = true;
    this.renderer.render(this.liveScene, this.liveCamera);

    this.renderer.setRenderTarget(this.accumTarget);
    this.renderer.autoClear = false;
    if (!this.accumulated) {
      this.renderer.setClearColor(new THREE.Color(0x000000), 1);
      this.renderer.clear();
      this.accumulated = true;
    }
    this.renderer.render(this.accumScene, this.accumCamera);
    this.renderer.setRenderTarget(null);

    if (Math.floor(elapsed * 10) % 1 === 0) {
      void this.copyAccumulatorToDisplay();
    }

    this.onProgress?.(progress, this.eventsRecorded);

    if (progress < 1 && this.onProgress !== null) {
      this.rafId = requestAnimationFrame(this.tick);
    } else {
      this.rafId = null;
      void this.copyAccumulatorToDisplay();
    }
  };

  private async copyAccumulatorToDisplay(): Promise<void> {
    if (!this.accumDisplayCtx) return;
    const w = this.accumTarget.width;
    const h = this.accumTarget.height;
    try {
      const result = (await (
        this.renderer as unknown as {
          readRenderTargetPixelsAsync: (
            target: THREE.RenderTarget,
            x: number,
            y: number,
            width: number,
            height: number,
          ) => Promise<ArrayBufferView>;
        }
      ).readRenderTargetPixelsAsync(this.accumTarget, 0, 0, w, h)) as Float32Array;
      this.writeTonemappedDisplay(result, w, h);
    } catch (err) {
      log.warn("accumulator read-back failed", { err: errToObject(err) });
    }
  }

  private writeTonemappedDisplay(
    buffer: Float32Array,
    w: number,
    h: number,
  ): void {
    if (!this.accumDisplayCtx) return;
    const img = this.accumDisplayCtx.createImageData(w, h);
    for (let i = 0, j = 0; i < buffer.length; i += 4, j += 4) {
      const r = buffer[i]!;
      const g = buffer[i + 1]!;
      const b = buffer[i + 2]!;
      const rT = r / (1 + r);
      const gT = g / (1 + g);
      const bT = b / (1 + b);
      const dst =
        ((h - 1 - Math.floor(j / 4 / w)) * w + (Math.floor(j / 4) % w)) * 4;
      img.data[dst] = Math.min(255, rT * 255);
      img.data[dst + 1] = Math.min(255, gT * 255);
      img.data[dst + 2] = Math.min(255, bT * 255);
      img.data[dst + 3] = 255;
    }
    const off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    off.getContext("2d")!.putImageData(img, 0, 0);
    this.accumDisplayCtx.imageSmoothingEnabled = false;
    this.accumDisplayCtx.drawImage(
      off,
      0,
      0,
      this.accumDisplayCanvas.width,
      this.accumDisplayCanvas.height,
    );
  }

  private resize(canvas: HTMLCanvasElement): void {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    this.renderer.setSize(w, h, false);
    this.liveCamera.aspect = w / h;
    this.liveCamera.updateProjectionMatrix();
    this.accumDisplayCanvas.width = 512;
    this.accumDisplayCanvas.height = 512;
  }

  dispose(): void {
    this.stop();
    this.disposeLedMeshes();
    this.accumTarget.dispose();
    this.renderer.dispose();
  }
}
