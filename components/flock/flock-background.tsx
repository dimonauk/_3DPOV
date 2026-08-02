"use client";

import { useEffect, useRef } from "react";

/**
 * Global wireframe-widget swarm background. Mounted once in the root
 * layout (not per-page) so navigation never unmounts/reinitializes the
 * WebGL context or the boid simulation - route changes only swap the
 * `children` slot, this stays alive underneath it the whole session.
 *
 * z-index 0 (canvas) / 1 (vignette) - sits above the page background,
 * below all real content. Both layers are pointer-events: none; the
 * swarm listens on `window` for pointer movement instead, so page
 * content stays fully clickable/scrollable above it.
 */
export function FlockBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let cleanupFns: Array<() => void> = [];

    (async () => {
      const THREE = await import("three");
      const { EffectComposer } = await import(
        "three/examples/jsm/postprocessing/EffectComposer.js"
      );
      const { RenderPass } = await import(
        "three/examples/jsm/postprocessing/RenderPass.js"
      );
      const { AfterimagePass } = await import(
        "three/examples/jsm/postprocessing/AfterimagePass.js"
      );
      const { OutputPass } = await import(
        "three/examples/jsm/postprocessing/OutputPass.js"
      );

      if (disposed) return;

      // ── Renderer / scene / camera ──────────────────────────────────────
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x05060a, 0.05);
      const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
      camera.position.set(0, 0, 16);

      // ── POV trail buffer: current frame max-blended with the decaying
      // previous frame - a digital long exposure. damp = "sensor" retention.
      const composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      const afterimage = new AfterimagePass();
      afterimage.uniforms["damp"].value = 0.92;
      composer.addPass(afterimage);
      composer.addPass(new OutputPass());

      function resize() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      }
      window.addEventListener("resize", resize);
      resize();

      // ── The widgets: wireframe shapes in a cheerful palette ─────────────
      const SHAPES = [
        { geo: new THREE.IcosahedronGeometry(0.16, 0), color: 0x7ff0d4 }, // mint
        { geo: new THREE.OctahedronGeometry(0.18, 0), color: 0xff8ac2 }, // pink
        { geo: new THREE.TetrahedronGeometry(0.2, 0), color: 0xffd166 }, // amber
        { geo: new THREE.TorusGeometry(0.14, 0.055, 6, 10), color: 0x8ab4ff }, // blue
        { geo: new THREE.BoxGeometry(0.2, 0.2, 0.2), color: 0xc58aff }, // violet
      ];
      const PER_SHAPE = 48;
      const N = SHAPES.length * PER_SHAPE;

      const pos = new Float32Array(N * 3);
      const vel = new Float32Array(N * 3);
      const spinAxis = new Float32Array(N * 3);
      const spinSpeed = new Float32Array(N);
      const spinPhase = new Float32Array(N);
      const BOUNDS = { x: 11, y: 6.5, z: 4 };

      for (let i = 0; i < N; i++) {
        pos[i * 3] = (Math.random() * 2 - 1) * BOUNDS.x;
        pos[i * 3 + 1] = (Math.random() * 2 - 1) * BOUNDS.y;
        pos[i * 3 + 2] = (Math.random() * 2 - 1) * BOUNDS.z;
        const a = Math.random() * Math.PI * 2;
        vel[i * 3] = Math.cos(a) * 2;
        vel[i * 3 + 1] = Math.sin(a) * 2;
        vel[i * 3 + 2] = (Math.random() - 0.5);
        const ax = new THREE.Vector3().randomDirection();
        spinAxis[i * 3] = ax.x;
        spinAxis[i * 3 + 1] = ax.y;
        spinAxis[i * 3 + 2] = ax.z;
        spinSpeed[i] = 0.5 + Math.random() * 2.0;
        spinPhase[i] = Math.random() * Math.PI * 2;
      }

      const meshes = SHAPES.map(({ geo, color }) => {
        const mat = new THREE.MeshBasicMaterial({
          wireframe: true,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          color,
        });
        const m = new THREE.InstancedMesh(geo, mat, PER_SHAPE);
        m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        scene.add(m);
        return m;
      });

      const CELL = 1.4;
      const grid = new Map<string, number[]>();
      const gkey = (x: number, y: number, z: number) =>
        `${Math.floor(x / CELL)},${Math.floor(y / CELL)},${Math.floor(z / CELL)}`;

      // ── Attractor (the pointer, projected onto the z=0 plane) ───────────
      const attractor = new THREE.Vector3();
      const target = new THREE.Vector3();
      let lastPointerAt = 0;
      let burst = 0;

      function onPointerMove(e: PointerEvent) {
        const v = new THREE.Vector3(
          (e.clientX / window.innerWidth) * 2 - 1,
          -(e.clientY / window.innerHeight) * 2 + 1,
          0.5,
        ).unproject(camera);
        const dir = v.sub(camera.position).normalize();
        target
          .copy(camera.position)
          .addScaledVector(dir, -camera.position.z / dir.z);
        lastPointerAt = performance.now();
      }
      function onPointerDown() {
        burst = 1;
      }
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerdown", onPointerDown);

      // ── Boids ─────────────────────────────────────────────────────────
      function step(dt: number, time: number) {
        if (performance.now() - lastPointerAt > 3000) {
          target.set(
            Math.sin(time * 0.31) * BOUNDS.x * 0.55,
            Math.sin(time * 0.47 + 1.3) * BOUNDS.y * 0.55,
            Math.sin(time * 0.23) * 1.5,
          );
        }
        attractor.lerp(target, 1 - Math.exp(-dt * 3.5));

        grid.clear();
        for (let i = 0; i < N; i++) {
          const k = gkey(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
          let cell = grid.get(k);
          if (!cell) grid.set(k, (cell = []));
          cell.push(i);
        }

        const SEP_R2 = 0.55 * 0.55,
          ALI_R2 = 1.3 * 1.3;
        for (let i = 0; i < N; i++) {
          const ix = i * 3;
          const px = pos[ix],
            py = pos[ix + 1],
            pz = pos[ix + 2];
          let sepX = 0,
            sepY = 0,
            sepZ = 0;
          let aliX = 0,
            aliY = 0,
            aliZ = 0,
            aliN = 0;
          let cohX = 0,
            cohY = 0,
            cohZ = 0,
            cohN = 0;
          const cx = Math.floor(px / CELL),
            cy = Math.floor(py / CELL),
            cz = Math.floor(pz / CELL);
          for (let gx = cx - 1; gx <= cx + 1; gx++)
            for (let gy = cy - 1; gy <= cy + 1; gy++)
              for (let gz = cz - 1; gz <= cz + 1; gz++) {
                const cell = grid.get(`${gx},${gy},${gz}`);
                if (!cell) continue;
                for (const j of cell) {
                  if (j === i) continue;
                  const jx = j * 3;
                  const dx = px - pos[jx],
                    dy = py - pos[jx + 1],
                    dz = pz - pos[jx + 2];
                  const d2 = dx * dx + dy * dy + dz * dz;
                  if (d2 < SEP_R2 && d2 > 1e-6) {
                    const w = 1 / d2;
                    sepX += dx * w;
                    sepY += dy * w;
                    sepZ += dz * w;
                  }
                  if (d2 < ALI_R2) {
                    aliX += vel[jx];
                    aliY += vel[jx + 1];
                    aliZ += vel[jx + 2];
                    aliN++;
                    cohX += pos[jx];
                    cohY += pos[jx + 1];
                    cohZ += pos[jx + 2];
                    cohN++;
                  }
                }
              }

          let ax = sepX * 3.2,
            ay = sepY * 3.2,
            az = sepZ * 3.2;
          if (aliN) {
            const inv = 1 / aliN;
            ax += (aliX * inv - vel[ix]) * 0.9;
            ay += (aliY * inv - vel[ix + 1]) * 0.9;
            az += (aliZ * inv - vel[ix + 2]) * 0.9;
          }
          if (cohN) {
            const inv = 1 / cohN;
            ax += (cohX * inv - px) * 0.55;
            ay += (cohY * inv - py) * 0.55;
            az += (cohZ * inv - pz) * 0.55;
          }

          const dx = attractor.x - px,
            dy = attractor.y - py,
            dz = attractor.z - pz;
          const d = Math.sqrt(dx * dx + dy * dy + dz * dz) + 1e-4;
          const inv = 1 / d;
          const pull = Math.min(d * 0.55, 3.2);
          ax += dx * inv * pull;
          ay += dy * inv * pull;
          az += dz * inv * pull;
          const swirl = 5.2 / (0.6 + d * 0.35);
          ax += -dy * inv * swirl;
          ay += dx * inv * swirl;
          az += (dx * 0.3 - dz) * inv * swirl * 0.35;
          if (d < 1.6) {
            const push = (1.6 - d) * 9;
            ax -= dx * inv * push;
            ay -= dy * inv * push;
            az -= dz * inv * push;
          }
          if (burst > 0) {
            const bs = (burst * 26) / (0.4 + d);
            ax -= dx * inv * bs;
            ay -= dy * inv * bs;
            az -= dz * inv * bs;
          }

          if (px > BOUNDS.x) ax -= (px - BOUNDS.x) * 2.2;
          else if (px < -BOUNDS.x) ax -= (px + BOUNDS.x) * 2.2;
          if (py > BOUNDS.y) ay -= (py - BOUNDS.y) * 2.2;
          else if (py < -BOUNDS.y) ay -= (py + BOUNDS.y) * 2.2;
          if (pz > BOUNDS.z) az -= (pz - BOUNDS.z) * 2.2;
          else if (pz < -BOUNDS.z) az -= (pz + BOUNDS.z) * 2.2;

          vel[ix] += ax * dt;
          vel[ix + 1] += ay * dt;
          vel[ix + 2] += az * dt;
          const sp =
            Math.sqrt(vel[ix] ** 2 + vel[ix + 1] ** 2 + vel[ix + 2] ** 2) +
            1e-5;
          const cl = sp > 6.5 ? 6.5 / sp : sp < 1.6 ? 1.6 / sp : 1;
          vel[ix] *= cl;
          vel[ix + 1] *= cl;
          vel[ix + 2] *= cl;
        }

        burst = Math.max(0, burst - dt * 1.6);
        for (let i = 0; i < N; i++) {
          const ix = i * 3;
          pos[ix] += vel[ix] * dt;
          pos[ix + 1] += vel[ix + 1] * dt;
          pos[ix + 2] += vel[ix + 2] * dt;
        }
      }

      const dummy = new THREE.Object3D();
      const axis = new THREE.Vector3();
      function draw(time: number) {
        for (let s = 0; s < SHAPES.length; s++) {
          const mesh = meshes[s];
          for (let k = 0; k < PER_SHAPE; k++) {
            const i = s * PER_SHAPE + k;
            const ix = i * 3;
            dummy.position.set(pos[ix], pos[ix + 1], pos[ix + 2]);
            axis.set(spinAxis[ix], spinAxis[ix + 1], spinAxis[ix + 2]);
            dummy.quaternion.setFromAxisAngle(
              axis,
              time * spinSpeed[i] + spinPhase[i],
            );
            dummy.updateMatrix();
            mesh.setMatrixAt(k, dummy.matrix);
          }
          mesh.instanceMatrix.needsUpdate = true;
        }
      }

      let prev = performance.now();
      let rafId = 0;
      function loop() {
        rafId = requestAnimationFrame(loop);
        const now = performance.now();
        const dt = Math.min((now - prev) / 1000, 0.05);
        prev = now;
        step(dt, now / 1000);
        draw(now / 1000);
        composer.render();
      }
      loop();

      cleanupFns = [
        () => cancelAnimationFrame(rafId),
        () => window.removeEventListener("resize", resize),
        () => window.removeEventListener("pointermove", onPointerMove),
        () => window.removeEventListener("pointerdown", onPointerDown),
        () => {
          meshes.forEach((m) => {
            m.geometry.dispose();
            (m.material as THREE.Material).dispose();
          });
          composer.dispose();
          renderer.dispose();
        },
      ];
    })();

    return () => {
      disposed = true;
      cleanupFns.forEach((fn) => fn());
    };
    // Mounted once at the root layout - deliberately no deps, this should
    // never re-run for the lifetime of the app shell.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          display: "block",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at center, transparent 45%, rgba(3, 4, 8, 0.8) 100%)",
        }}
      />
    </>
  );
}
