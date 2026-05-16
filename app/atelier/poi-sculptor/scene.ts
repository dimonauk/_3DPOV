/**
 * app/atelier/poi-sculptor/scene.ts
 *
 * WebGPU TSL scene for the Poi Sculptor demo. Owns:
 *   - the WebGPURenderer + WebGPU init
 *   - the THREE.Scene, perspective camera, OrbitControls
 *   - the trail group (rebuilt on move/material change)
 *   - the 300k GPU compute particle field orbiting the trail
 *   - the post-processing pipeline (bloom + film grain)
 *   - the anchor-path runner that drives the trail group through space
 *   - the animate loop and the dispose path
 *
 * React side mounts this via PoiSculptorScene.create() in a useEffect
 * and calls setMove / setMaterial / setFx / setAnchorPath through the
 * lifetime of the demo. Disposal is symmetric and the only path that
 * releases GPU buffers — the React unmount calls dispose().
 */

import * as THREE from "three/webgpu";

import type { TrailMaterial } from "lib/poi-sculptor/materials";
import { TRAIL_MATERIALS } from "lib/poi-sculptor/materials";
import { genTrail, type Trail } from "lib/poi-sculptor/moves";

import { AnchorPlayer } from "./anchor-player";
import {
  buildParticleSystem,
  PARTICLE_COUNT,
  type ParticleSystem,
} from "./particles";
import { buildPostPipeline, type FxState, type PostPipeline } from "./post";
import {
  buildTrailGroup,
  makeTrailUniforms,
  type TrailUniforms,
  type TrailMeshes,
} from "./trail-mesh";

export type SceneStats = {
  vertexCount: number;
  particleCount: number;
  fps: number;
};

export type StatsCallback = (stats: SceneStats) => void;

type ControlsLike = { update(): void; dispose?(): void };

export class PoiSculptorScene {
  private renderer: THREE.WebGPURenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: ControlsLike | null = null;
  private trailUniforms: TrailUniforms;
  private trailMeshes: TrailMeshes | null = null;
  private trailGroup: THREE.Group | null = null;
  private particles: ParticleSystem;
  private post: PostPipeline | null = null;
  private anchor: AnchorPlayer;
  private fx: FxState = { bloom: true, film: true };
  private currentMove = "butterfly";
  private currentMatIdx = 0;
  private rafId: number | null = null;
  private statsCb: StatsCallback | null = null;
  private fpsFrames = 0;
  private fpsLastTime = performance.now();
  private anchorTarget = new THREE.Vector3();
  private trailCache = new Map<string, Trail>();

  private constructor(
    renderer: THREE.WebGPURenderer,
    canvas: HTMLCanvasElement,
  ) {
    this.renderer = renderer;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060402);
    this.scene.fog = new THREE.FogExp2(0x060402, 0.14);

    this.camera = new THREE.PerspectiveCamera(
      52,
      canvas.clientWidth / canvas.clientHeight,
      0.01,
      80,
    );
    this.camera.position.set(0, 0.4, 4.2);

    this.scene.add(new THREE.AmbientLight(0x1a1006, 0.5));
    const key = new THREE.PointLight(0xd4920e, 3.5, 10);
    key.position.set(2, 2.5, 2);
    this.scene.add(key);
    const fill = new THREE.PointLight(0x3a1a04, 1.5, 7);
    fill.position.set(-2.5, -1, 1);
    this.scene.add(fill);
    const back = new THREE.DirectionalLight(0xff6e1a, 0.6);
    back.position.set(0, 3, -4);
    this.scene.add(back);
    const rim = new THREE.PointLight(0x4080a0, 1.2, 8);
    rim.position.set(-1, 0, -3);
    this.scene.add(rim);

    this.trailUniforms = makeTrailUniforms();
    this.particles = buildParticleSystem();
    this.scene.add(this.particles.mesh);
    this.anchor = new AnchorPlayer("static");
  }

  static async create(canvas: HTMLCanvasElement): Promise<PoiSculptorScene> {
    const renderer = new THREE.WebGPURenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    await renderer.init();

    const inst = new PoiSculptorScene(renderer, canvas);

    const { OrbitControls } = await import(
      "three/examples/jsm/controls/OrbitControls.js"
    );
    const controls = new OrbitControls(inst.camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.04;
    controls.minDistance = 1.2;
    controls.maxDistance = 14;
    inst.controls = controls;

    await renderer.computeAsync(inst.particles.computeInit);
    inst.rebuildTrails();
    inst.rebuildPost();

    return inst;
  }

  setMove(id: string): void {
    if (id === this.currentMove) return;
    this.currentMove = id;
    this.rebuildTrails();
  }

  setMaterialIndex(idx: number): void {
    if (idx === this.currentMatIdx) return;
    this.currentMatIdx = idx;
    this.rebuildTrails();
  }

  setAnchorPath(id: string): void {
    this.anchor.setPath(id);
  }

  setAnchorSpeed(speedNormalised: number): void {
    this.anchor.speed = 0.02 + speedNormalised * 0.6;
  }

  setUniform(key: "uHeat" | "uRim" | "uPulse" | "uThick", value: number): void {
    const u = this.trailUniforms[key];
    u.value = value;
    if (key === "uThick") this.rebuildTrails();
  }

  setParticleCurl(value: number): void {
    this.particles.uCurl.value = value;
  }

  setFx(fx: FxState): void {
    this.fx = fx;
    this.rebuildPost();
  }

  setStatsCallback(cb: StatsCallback | null): void {
    this.statsCb = cb;
  }

  resize(canvas: HTMLCanvasElement): void {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.rebuildPost();
  }

  start(): void {
    if (this.rafId !== null) return;
    this.fpsLastTime = performance.now();
    this.fpsFrames = 0;
    this.tick();
  }

  dispose(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.statsCb = null;
    this.disposeTrail();
    (this.particles.mesh.material as THREE.Material).dispose?.();
    this.particles.mesh.geometry.dispose();
    this.scene.remove(this.particles.mesh);
    this.controls?.dispose?.();
    this.renderer.dispose();
  }

  private rebuildTrails(): void {
    const trail = this.cachedTrail(this.currentMove);
    const matDef: TrailMaterial =
      TRAIL_MATERIALS[this.currentMatIdx] ?? TRAIL_MATERIALS[0]!;
    this.disposeTrail();
    const next = buildTrailGroup(trail.h0, trail.h1, matDef, this.trailUniforms);
    this.trailMeshes = next;
    this.trailGroup = next.group;
    this.scene.add(next.group);
    this.particles.uAtt0.value.set(...next.mid0);
    this.particles.uAtt1.value.set(...next.mid1);
  }

  private cachedTrail(id: string): Trail {
    const hit = this.trailCache.get(id);
    if (hit) return hit;
    const t = genTrail(id);
    this.trailCache.set(id, t);
    return t;
  }

  private disposeTrail(): void {
    if (!this.trailMeshes) return;
    for (const mesh of this.trailMeshes.meshes) {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose?.();
    }
    if (this.trailGroup) this.scene.remove(this.trailGroup);
    this.trailMeshes = null;
    this.trailGroup = null;
  }

  private rebuildPost(): void {
    this.post = buildPostPipeline(this.renderer, this.scene, this.camera, this.fx);
  }

  getTrailGroup(): THREE.Group | null {
    return this.trailGroup;
  }

  getCurrentMaterial(): TrailMaterial {
    return TRAIL_MATERIALS[this.currentMatIdx] ?? TRAIL_MATERIALS[0]!;
  }

  private tick = (): void => {
    const t = performance.now() * 0.001;

    if (this.trailGroup) {
      this.anchor.update(0.016);
      const anchor = this.anchor.getAnchor(this.anchorTarget);
      this.trailGroup.position.lerp(anchor, 0.08);
      this.trailGroup.rotation.y += 0.0025;
      this.trailGroup.rotation.x = Math.sin(t * 0.23) * 0.08;
    }

    const orb = 0.5;
    this.particles.uAtt0.value.set(
      Math.cos(t * 0.8) * orb,
      Math.sin(t * 0.4) * 0.3,
      Math.sin(t * 0.8) * orb * 0.5,
    );
    this.particles.uAtt1.value.set(
      -Math.cos(t * 0.9 + 1) * orb,
      Math.sin(t * 0.35 + 1) * 0.3,
      -Math.sin(t * 0.9) * orb * 0.5,
    );
    this.particles.uDt.value = 0.016;
    void this.renderer.computeAsync(this.particles.computeUpdate);

    this.controls?.update();
    if (this.post) {
      void this.post.postProcessing.render();
    } else {
      void this.renderer.render(this.scene, this.camera);
    }

    this.fpsFrames++;
    const now = performance.now();
    if (now - this.fpsLastTime > 600 && this.statsCb) {
      const fps = Math.round((this.fpsFrames * 1000) / (now - this.fpsLastTime));
      this.statsCb({
        vertexCount: this.trailMeshes?.vertexCount ?? 0,
        particleCount: PARTICLE_COUNT,
        fps,
      });
      this.fpsFrames = 0;
      this.fpsLastTime = now;
    }
    this.rafId = requestAnimationFrame(this.tick);
  };
}
