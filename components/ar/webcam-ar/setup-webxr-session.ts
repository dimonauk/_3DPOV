"use client";

/**
 * components/ar/webcam-ar/setup-webxr-session.ts — Builds an
 * immersive-ar WebXR scene with hit-test + plane detection for
 * planting the card model on a real-world surface.
 *
 * Extracted from WebcamARScene.tsx per ARCHITECTURE.md Rule 1.
 * Builder-style: the host requests the XRSession itself (so it can
 * surface "session refused" errors distinctly from "session crashed
 * mid-setup"), then passes the live session in. The helper attaches
 * a hit-test source, a reticle ring on the latest pose, translucent
 * polygons on detected planes, and returns a disposer. The session's
 * "end" event also triggers cleanup so external session terminations
 * (headset off, navigate away) reach the host via `onSessionEnd`.
 */

import type * as THREE_TYPES from "three";

import type { Card } from "lib/ar/types";

export type WebXRSetupOptions = {
  container: HTMLDivElement;
  session: XRSession;
  card: Card;
  onSessionEnd: () => void;
};

export async function setupWebXRSession(
  opts: WebXRSetupOptions,
): Promise<() => void> {
  const { container, session, card, onSessionEnd } = opts;

  const [THREE, { GLTFLoader }] = await Promise.all([
    import("three"),
    import("three/examples/jsm/loaders/GLTFLoader.js"),
  ]);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    70,
    container.clientWidth / container.clientHeight,
    0.01,
    100,
  );

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 1.0));
  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(2, 3, 2);
  scene.add(key);

  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(card.ar.model);
  const model = gltf.scene;
  const box = new THREE.Box3().setFromObject(model);
  const sphere = new THREE.Sphere();
  box.getBoundingSphere(sphere);
  if (sphere.radius > 0) {
    model.scale.multiplyScalar(0.2 / sphere.radius);
  }
  model.visible = false; // hidden until first plant
  scene.add(model);

  // Reticle — small ring shown on the latest hit-test pose.
  const reticleGeom = new THREE.RingGeometry(0.08, 0.1, 32).rotateX(-Math.PI / 2);
  const reticleMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.85,
  });
  const reticle = new THREE.Mesh(reticleGeom, reticleMat);
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  await renderer.xr.setSession(session);

  const referenceSpace = await session.requestReferenceSpace("local");
  const viewerSpace = await session.requestReferenceSpace("viewer");
  const hitTestSource = await (
    session as unknown as {
      requestHitTestSource: (opts: {
        space: XRReferenceSpace;
      }) => Promise<XRHitTestSource>;
    }
  ).requestHitTestSource({ space: viewerSpace });

  const onSelect = () => {
    if (reticle.visible) {
      model.position.setFromMatrixPosition(reticle.matrix);
      model.quaternion.setFromRotationMatrix(reticle.matrix);
      model.visible = true;
    }
  };
  session.addEventListener("select", onSelect);

  // Plane visualisation — translucent quads on detected real-world
  // surfaces. Helps the user see what the device has mapped before
  // they tap to plant. Hidden once the model is placed.
  type AnyXRPlane = {
    planeSpace: XRReferenceSpace;
    polygon: ReadonlyArray<{ x: number; y: number; z: number }>;
    lastChangedTime: number;
  };
  const planeMaterial = new THREE.MeshBasicMaterial({
    color: (() => {
      try {
        return new THREE.Color(card.brand.primary);
      } catch {
        return new THREE.Color(0xffffff);
      }
    })(),
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const planeEdgeMaterial = new THREE.LineBasicMaterial({
    color: planeMaterial.color,
    transparent: true,
    opacity: 0.65,
  });
  type PlaneEntry = {
    mesh: THREE_TYPES.Mesh;
    edges: THREE_TYPES.LineSegments;
    lastChangedTime: number;
  };
  const planeEntries = new Map<AnyXRPlane, PlaneEntry>();

  const updatePlanes = (frame: XRFrame) => {
    // Hide entirely once model is planted — reduces visual noise.
    if (model.visible) {
      planeEntries.forEach(({ mesh, edges }) => {
        mesh.visible = false;
        edges.visible = false;
      });
      return;
    }
    const detected = (frame as unknown as {
      detectedPlanes?: ReadonlySet<AnyXRPlane>;
    }).detectedPlanes;
    if (!detected) return;

    // Drop entries for planes the system has forgotten.
    for (const [plane, entry] of planeEntries) {
      if (!detected.has(plane)) {
        scene.remove(entry.mesh);
        scene.remove(entry.edges);
        entry.mesh.geometry.dispose();
        entry.edges.geometry.dispose();
        planeEntries.delete(plane);
      }
    }

    for (const plane of detected) {
      let entry = planeEntries.get(plane);
      if (!entry) {
        const mesh = new THREE.Mesh(new THREE.BufferGeometry(), planeMaterial);
        const edges = new THREE.LineSegments(
          new THREE.BufferGeometry(),
          planeEdgeMaterial,
        );
        mesh.matrixAutoUpdate = false;
        edges.matrixAutoUpdate = false;
        scene.add(mesh);
        scene.add(edges);
        entry = { mesh, edges, lastChangedTime: -1 };
        planeEntries.set(plane, entry);
      }

      // Rebuild geometry only when the polygon actually changed.
      if (entry.lastChangedTime !== plane.lastChangedTime) {
        const points = plane.polygon;
        if (points && points.length >= 3) {
          // Triangle fan from first point for the filled quad.
          const tri: number[] = [];
          for (let i = 1; i < points.length - 1; i++) {
            const p0 = points[0];
            const pi = points[i];
            const pi1 = points[i + 1];
            if (!p0 || !pi || !pi1) continue;
            tri.push(p0.x, p0.y, p0.z, pi.x, pi.y, pi.z, pi1.x, pi1.y, pi1.z);
          }
          entry.mesh.geometry.dispose();
          entry.mesh.geometry = new THREE.BufferGeometry();
          entry.mesh.geometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(tri, 3),
          );
          entry.mesh.geometry.computeVertexNormals();

          // Boundary line loop.
          const seg: number[] = [];
          for (let i = 0; i < points.length; i++) {
            const a = points[i];
            const b = points[(i + 1) % points.length];
            if (!a || !b) continue;
            seg.push(a.x, a.y, a.z, b.x, b.y, b.z);
          }
          entry.edges.geometry.dispose();
          entry.edges.geometry = new THREE.BufferGeometry();
          entry.edges.geometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(seg, 3),
          );
        }
        entry.lastChangedTime = plane.lastChangedTime;
      }

      const pose = (frame as unknown as {
        getPose: (sp: XRSpace, ref: XRReferenceSpace) => XRPose | null;
      }).getPose(plane.planeSpace, referenceSpace);
      if (pose) {
        entry.mesh.matrix.fromArray(pose.transform.matrix);
        entry.edges.matrix.fromArray(pose.transform.matrix);
        entry.mesh.visible = true;
        entry.edges.visible = true;
      }
    }
  };

  const clock = new THREE.Clock();
  const xrAnimate = (_t: DOMHighResTimeStamp, frame?: XRFrame) => {
    if (frame) {
      updatePlanes(frame);
      const hits = (
        frame as unknown as {
          getHitTestResults: (s: XRHitTestSource) => XRHitTestResult[];
        }
      ).getHitTestResults(hitTestSource);
      if (hits.length > 0) {
        const hit = hits[0];
        if (hit) {
          const pose = hit.getPose(referenceSpace);
          if (pose) {
            reticle.visible = true;
            reticle.matrix.fromArray(pose.transform.matrix);
          }
        }
      } else {
        reticle.visible = false;
      }
    }
    if (model.visible && card.ar.autoRotate !== false) {
      model.rotation.y += clock.getDelta() * 0.3;
    }
    renderer.render(scene, camera);
  };
  renderer.setAnimationLoop(xrAnimate);

  const cleanup = () => {
    renderer.setAnimationLoop(null);
    try {
      session.removeEventListener("select", onSelect);
      (hitTestSource as unknown as { cancel?: () => void }).cancel?.();
    } catch {
      // ignore
    }
    renderer.xr.enabled = false;
    renderer.dispose();
    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement);
    }
    model.traverse((obj) => {
      const m = obj as unknown as {
        isMesh?: boolean;
        geometry?: { dispose?: () => void };
        material?: { dispose?: () => void } | Array<{ dispose?: () => void }>;
      };
      if (m.isMesh) {
        m.geometry?.dispose?.();
        const mat = m.material;
        if (Array.isArray(mat)) mat.forEach((mm) => mm.dispose?.());
        else mat?.dispose?.();
      }
    });
    reticleGeom.dispose();
    reticleMat.dispose();
    planeEntries.forEach(({ mesh, edges }) => {
      mesh.geometry.dispose();
      edges.geometry.dispose();
      scene.remove(mesh);
      scene.remove(edges);
    });
    planeEntries.clear();
    planeMaterial.dispose();
    planeEdgeMaterial.dispose();
    onSessionEnd();
  };
  session.addEventListener("end", cleanup);

  // Host-facing disposer ends the session (which fires "end" → cleanup).
  return () => {
    session.end().catch(() => undefined);
  };
}
