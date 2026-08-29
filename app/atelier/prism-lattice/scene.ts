/**
 * app/atelier/prism-lattice/scene.ts
 *
 * WebGPU TSL scene orchestrator for Prism Lattice. Owns the renderer,
 * scene tree, camera, OrbitControls (auto-rotating), the strut/joint
 * InstancedMeshes, the shared TSL uniforms, and the bloom composer
 * from `lib/tsl-post`. The geometry math lives in `scene-geometry.ts`
 * and the materials live in `scene-mat.ts`; this file only wires them
 * together and drives the per-frame loop.
 *
 * React mounts this via PrismLatticeScene.create() in a useEffect and
 * never touches three directly. Disposal is symmetric.
 */

import * as THREE from "three/webgpu";

import { attachStack, type ComposerHandle } from "lib/tsl-post/composer";
import { createLogger, errToObject } from "lib/log";

import {
  buildLatticeInstanceData,
  type LatticeInstanceData,
} from "./scene-geometry";
import {
  buildJoints,
  buildStruts,
  makeLatticeUniforms,
  type LatticeUniforms,
} from "./scene-mat";

const log = createLogger("atelier:prism-lattice:scene");

const SPHERE_RADIUS = 1;
const BAR_RADIUS = 0.026;
const JOINT_RADIUS = 0.05;

export type LatticeDensity = 1 | 2;

export type LatticeControls = {
  hueSpeed: number;
  pulseSpeed: number;
  pulseDepth: number;
  brightness: number;
  spinSpeed: number;
  density: LatticeDensity;
};

export const DEFAULT_CONTROLS: LatticeControls = {
  hueSpeed: 0.06,
  pulseSpeed: 0.6,
  pulseDepth: 0.75,
  brightness: 1.0,
  spinSpeed: 0.09,
  density: 1,
};

export type SceneStats = { fps: number; struts: number; joints: number };
export type StatsCallback = (stats: SceneStats) => void;

type ControlsLike = {
  update(): void;
  autoRotate: boolean;
  autoRotateSpeed: number;
  dispose?(): void;
};

export class PrismLatticeScene {
  private renderer: THREE.WebGPURenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private orbit: ControlsLike | null = null;
  private post: ComposerHandle | null = null;
  private latticeGroup: THREE.Group;
  private struts: THREE.InstancedMesh | null = null;
  private joints: THREE.InstancedMesh | null = null;
  private uniforms: LatticeUniforms;
  private controls: LatticeControls = { ...DEFAULT_CONTROLS };
  private rafId: number | null = null;
  private last = 0;
  private globalT = 0;
  private statsCb: StatsCallback | null = null;
  private fpsFrames = 0;
  private fpsLastTime = 0;
  private edgeCount = 0;
  private jointCount = 0;

  private constructor(
    renderer: THREE.WebGPURenderer,
    canvas: HTMLCanvasElement,
  ) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x040308);

    this.camera = new THREE.PerspectiveCamera(
      42,
      canvas.clientWidth / Math.max(1, canvas.clientHeight),
      0.05,
      50,
    );
    this.camera.position.set(0, 0.2, 3.1);

    this.uniforms = makeLatticeUniforms();
    this.latticeGroup = new THREE.Group();
    this.scene.add(this.latticeGroup);

    this.resize(canvas);
  }

  static async create(canvas: HTMLCanvasElement): Promise<PrismLatticeScene> {
    const renderer = new THREE.WebGPURenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    await renderer.init();

    const inst = new PrismLatticeScene(renderer, canvas);
    inst.rebuildLattice();
    await inst.attachOrbit();
    inst.attachBloom();
    return inst;
  }

  private async attachOrbit(): Promise<void> {
    const { OrbitControls } = await import(
      "three/examples/jsm/controls/OrbitControls.js"
    );
    const orbit = new OrbitControls(this.camera, this.renderer.domElement);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.06;
    orbit.minDistance = 1.6;
    orbit.maxDistance = 9;
    orbit.autoRotate = true;
    orbit.autoRotateSpeed = this.controls.spinSpeed * 20;
    orbit.update();
    this.orbit = orbit as unknown as ControlsLike;
  }

  private attachBloom(): void {
    try {
      this.post = attachStack({
        stack: [
          {
            id: "bloom",
            opts: { intensity: 1.15, threshold: 0.55, radius: 0.62 },
          },
        ],
        renderer: this.renderer,
        scene: this.scene,
        camera: this.camera,
      });
    } catch (err) {
      log.warn("bloom attach failed — falling back to a plain render", {
        err: errToObject(err),
      });
      this.post = null;
    }
  }

  /** Rebuild the strut/joint meshes for the current density. Cheap enough to call on a control change. */
  private rebuildLattice(): void {
    if (this.struts) this.disposeMesh(this.struts);
    if (this.joints) this.disposeMesh(this.joints);

    const data: LatticeInstanceData = buildLatticeInstanceData({
      radius: SPHERE_RADIUS,
      detail: this.controls.density,
      barRadius: BAR_RADIUS,
      seed: 1337,
    });

    this.struts = buildStruts(data, this.uniforms);
    this.joints = buildJoints(data, this.uniforms, JOINT_RADIUS);
    this.latticeGroup.add(this.struts, this.joints);
    this.edgeCount = data.edgeCount;
    this.jointCount = data.jointCount;
  }

  private disposeMesh(mesh: THREE.InstancedMesh): void {
    this.latticeGroup.remove(mesh);
    mesh.geometry.dispose();
    (mesh.material as THREE.Material).dispose();
  }

  setControls(next: Partial<LatticeControls>): void {
    const densityChanged =
      next.density !== undefined && next.density !== this.controls.density;
    this.controls = { ...this.controls, ...next };

    this.uniforms.uHueSpeed.value = this.controls.hueSpeed;
    this.uniforms.uPulseSpeed.value = this.controls.pulseSpeed;
    this.uniforms.uPulseDepth.value = this.controls.pulseDepth;
    this.uniforms.uBrightness.value = this.controls.brightness;
    if (this.orbit) this.orbit.autoRotateSpeed = this.controls.spinSpeed * 20;

    if (densityChanged) this.rebuildLattice();
  }

  setStatsCallback(cb: StatsCallback | null): void {
    this.statsCb = cb;
  }

  resize(canvas: HTMLCanvasElement): void {
    const w = canvas.clientWidth;
    const h = Math.max(1, canvas.clientHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  start(): void {
    if (this.rafId !== null) return;
    this.last = performance.now();
    this.fpsLastTime = this.last;
    this.fpsFrames = 0;
    this.rafId = requestAnimationFrame(this.tick);
  }

  dispose(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.statsCb = null;
    this.orbit?.dispose?.();
    this.post?.dispose();
    if (this.struts) this.disposeMesh(this.struts);
    if (this.joints) this.disposeMesh(this.joints);
    this.renderer.dispose();
  }

  private tick = (now: number): void => {
    this.rafId = requestAnimationFrame(this.tick);
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    this.globalT += dt;
    this.uniforms.uTime.value = this.globalT;

    this.orbit?.update();
    if (this.post?.hasEffects) {
      this.post.render(dt);
    } else {
      void this.renderer.render(this.scene, this.camera);
    }

    this.fpsFrames++;
    if (now - this.fpsLastTime > 600 && this.statsCb) {
      const fps = Math.round(
        (this.fpsFrames * 1000) / (now - this.fpsLastTime),
      );
      this.statsCb({ fps, struts: this.edgeCount, joints: this.jointCount });
      this.fpsFrames = 0;
      this.fpsLastTime = now;
    }
  };
}
