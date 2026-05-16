/**
 * app/atelier/shape-of-it/scene.ts
 *
 * WebGPU TSL scene orchestrator for The Shape of It. Owns the renderer,
 * scene tree, perspective camera, OrbitControls, orbiting lights, and
 * the per-frame loop. The geometry systems live in sibling scene-*
 * modules and the animation logic lives in scene-animate.ts; this
 * orchestrator only wires them together.
 *
 * React mounts this via ShapeOfItScene.create() in a useEffect and
 * never touches three directly. Disposal is symmetric — the React
 * unmount calls dispose() and it releases all GPU buffers.
 */

import * as THREE from "three/webgpu";
import { uniform } from "three/tsl";

import { CHAMBERS } from "lib/shape-of-it/chambers";
import { THREADS } from "lib/shape-of-it/threads";

import {
  animateLabyrinth,
  animateLights,
  animateThreads,
} from "./scene-animate";
import {
  buildLabyrinthSystem,
  type LabyrinthBuildResult,
} from "./scene-labyrinth";
import { buildChambers, buildGyroidShell, buildSpine } from "./scene-spine";
import { buildThreads } from "./scene-threads";

type ControlsLike = {
  update(): void;
  dispose?(): void;
};

export type SceneStats = {
  fps: number;
  threads: number;
  chambers: number;
};

export type StatsCallback = (stats: SceneStats) => void;

export class ShapeOfItScene {
  private renderer: THREE.WebGPURenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: ControlsLike | null = null;
  private uTime: ReturnType<typeof uniform>;
  private mainGroup: THREE.Group;
  private threadGroups: THREE.Group[] = [];
  private chamberLights: THREE.PointLight[] = [];
  private threadLights: THREE.PointLight[] = [];
  private lightA: THREE.PointLight;
  private lightB: THREE.PointLight;
  private lightC: THREE.PointLight;
  private lab: LabyrinthBuildResult | null = null;
  private rafId: number | null = null;
  private last = 0;
  private globalT = 0;
  private statsCb: StatsCallback | null = null;
  private fpsFrames = 0;
  private fpsLastTime = 0;

  private constructor(
    renderer: THREE.WebGPURenderer,
    canvas: HTMLCanvasElement,
  ) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x010108);
    this.scene.fog = new THREE.FogExp2(0x010108, 0.017);

    this.camera = new THREE.PerspectiveCamera(
      38,
      canvas.clientWidth / Math.max(1, canvas.clientHeight),
      0.01,
      200,
    );
    this.camera.position.set(0, -2.685, 24);

    this.uTime = uniform(0.0);

    this.scene.add(new THREE.AmbientLight(0x040210, 1.8));
    const keyL = new THREE.DirectionalLight(0xfff0e0, 0.35);
    keyL.position.set(5, 10, 6);
    this.scene.add(keyL);
    const fillL = new THREE.DirectionalLight(0x102040, 0.18);
    fillL.position.set(-4, 2, -5);
    this.scene.add(fillL);

    this.lightA = new THREE.PointLight(0x7040cc, 3.0, 18);
    this.lightB = new THREE.PointLight(0x00ccaa, 2.4, 18);
    this.lightC = new THREE.PointLight(0xffffff, 0, 9);
    this.scene.add(this.lightA, this.lightB, this.lightC);

    this.mainGroup = new THREE.Group();
    this.mainGroup.position.y = -2.8;
    this.scene.add(this.mainGroup);
  }

  static async create(canvas: HTMLCanvasElement): Promise<ShapeOfItScene> {
    const renderer = new THREE.WebGPURenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.55;
    await renderer.init();

    const inst = new ShapeOfItScene(renderer, canvas);
    await inst.attachControls();
    inst.buildSceneGraph();
    return inst;
  }

  private async attachControls(): Promise<void> {
    const { OrbitControls } = await import(
      "three/examples/jsm/controls/OrbitControls.js"
    );
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.minDistance = 1.5;
    controls.maxDistance = 60;
    controls.target.set(0, -2.685, 0);
    controls.update();
    this.controls = controls as unknown as ControlsLike;
  }

  private buildSceneGraph(): void {
    const spine = buildSpine(this.uTime);
    this.mainGroup.add(spine);

    const { group: chamGroup, meshes: chamberMeshes } = buildChambers(
      CHAMBERS,
      this.uTime,
    );
    this.mainGroup.add(chamGroup);

    this.threadLights = THREADS.map((th) => {
      const hex = new THREE.Color(th.col[0], th.col[1], th.col[2]).getHex();
      const pl = new THREE.PointLight(hex, 0.9, 6);
      this.scene.add(pl);
      return pl;
    });
    this.chamberLights = CHAMBERS.map((ch) => {
      const pl = new THREE.PointLight(ch.hex, ch.dark ? 0.1 : 0.5, 5);
      pl.position.set(0, ch.y, 0);
      this.scene.add(pl);
      return pl;
    });

    const { group: threadGroup, threadGroups } = buildThreads(
      THREADS,
      chamberMeshes,
      this.uTime,
    );
    this.threadGroups = threadGroups;
    this.mainGroup.add(threadGroup);

    this.mainGroup.add(buildGyroidShell(this.uTime));

    this.lab = buildLabyrinthSystem(this.uTime);
    this.mainGroup.add(this.lab.group);

    const top = CHAMBERS[CHAMBERS.length - 1];
    if (top) {
      const arrival = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 16, 16),
        new THREE.MeshStandardMaterial({
          color: 0xc8a0ff,
          roughness: 0.0,
          metalness: 0.5,
          emissive: 0xc8a0ff,
          emissiveIntensity: 0.5,
        }),
      );
      arrival.position.set(0, top.y + 0.66, 0);
      this.scene.add(arrival);
    }
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
    this.controls?.dispose?.();
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
        obj.geometry.dispose();
        const mat = obj.material as THREE.Material | THREE.Material[];
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
    });
    this.renderer.dispose();
  }

  private tick = (now: number): void => {
    this.rafId = requestAnimationFrame(this.tick);
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    this.globalT += dt;
    this.uTime.value = this.globalT;

    animateLights(
      this.globalT,
      { lightA: this.lightA, lightB: this.lightB, lightC: this.lightC },
      this.chamberLights,
      CHAMBERS,
    );
    animateThreads(
      this.globalT,
      dt,
      this.threadGroups,
      this.threadLights,
      THREADS,
    );
    if (this.lab) animateLabyrinth(this.globalT, this.lab);

    this.mainGroup.scale.setScalar(1 + Math.sin(this.globalT * 0.33) * 0.006);
    this.controls?.update();
    void this.renderer.render(this.scene, this.camera);

    this.fpsFrames++;
    if (now - this.fpsLastTime > 600 && this.statsCb) {
      const fps = Math.round(
        (this.fpsFrames * 1000) / (now - this.fpsLastTime),
      );
      this.statsCb({
        fps,
        threads: this.threadGroups.length,
        chambers: CHAMBERS.length,
      });
      this.fpsFrames = 0;
      this.fpsLastTime = now;
    }
  };
}
