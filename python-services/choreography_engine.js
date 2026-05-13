/**
 * POI SCULPTOR — CHOREOGRAPHY ENGINE v1.0
 * Based on Laban Movement Analysis (LMA) & Cinematic Tracking
 */

import * as THREE from "three";

export const EFFORT = {
  PRESS: {
    space: "direct",
    weight: "strong",
    time: "sustained",
    flow: "bound",
    color: 0x4060ff,
    trailWidth: 0.035,
  },
  GLIDE: {
    space: "direct",
    weight: "light",
    time: "sustained",
    flow: "free",
    color: 0x80ffcc,
    trailWidth: 0.018,
  },
  PUNCH: {
    space: "direct",
    weight: "strong",
    time: "sudden",
    flow: "bound",
    color: 0xff4020,
    trailWidth: 0.05,
  },
  SLASH: {
    space: "indirect",
    weight: "strong",
    time: "sudden",
    flow: "free",
    color: 0xff8800,
    trailWidth: 0.045,
  },
  FLOAT: {
    space: "indirect",
    weight: "light",
    time: "sustained",
    flow: "free",
    color: 0xccbbff,
    trailWidth: 0.012,
  },
  WRING: {
    space: "indirect",
    weight: "strong",
    time: "sustained",
    flow: "bound",
    color: 0x9944cc,
    trailWidth: 0.04,
  },
  FLICK: {
    space: "indirect",
    weight: "light",
    time: "sudden",
    flow: "free",
    color: 0xffff44,
    trailWidth: 0.014,
  },
  DAB: {
    space: "direct",
    weight: "light",
    time: "sudden",
    flow: "bound",
    color: 0xff88cc,
    trailWidth: 0.016,
  },
};

export const STAGE = {
  W: 8.0,
  D: 6.0,
  DSZ: -2.8,
  USZ: 2.8,
  SLX: -3.8,
  SRX: 3.8,
  ZONES: {
    DSL: new THREE.Vector3(-2.5, 0, -2.0),
    DSC: new THREE.Vector3(0.0, 0, -2.2),
    DSR: new THREE.Vector3(2.5, 0, -2.0),
    CSL: new THREE.Vector3(-2.5, 0, 0.0),
    CSC: new THREE.Vector3(0.0, 0, 0.0),
    CSR: new THREE.Vector3(2.5, 0, 0.0),
    USL: new THREE.Vector3(-2.5, 0, 2.2),
    USC: new THREE.Vector3(0.0, 0, 2.0),
    USR: new THREE.Vector3(2.5, 0, 2.2),
  },
};

export class ChoreographyEngine {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.score = [];
    this.currentTime = 0;
    this.phaseIndex = 0;
    this.poiFollower = null;
  }

  setPath(path, options = {}) {
    this.currentPath = path;
    const { PoiLineFollower } = await import('../../packages/core-engine/poi_line_follower.js');
    this.poiFollower = new PoiLineFollower(path, options);
  }

  setScore(score) {
    this.score = score;
    this.totalTime = score.reduce((sum, ph) => sum + ph.duration, 0);
  }

  update(delta) {
    this.currentTime = (this.currentTime + delta) % this.totalTime;
    
    if (this.poiFollower) {
      const { center, poiPositions } = this.poiFollower.getPositions(this.currentTime);
      this.dancerPos = center; // The 'Invisible Thread' position
      this.poiPositions = poiPositions;
      
      // MAPPING LOGIC: 
      // 1. The 'center' (this.dancerPos) MUST NOT render a trail. It is the thread.
      // 2. Only 'poiPositions' generate the visible Silkbrush/Silicon fossils.
    }
  }

  getCameraTarget(mode, dancerPos, audienceMem) {
    // Ported from provided script
    switch (mode) {
      case "WIDE_SIDE":
        return {
          pos: new THREE.Vector3(-5.5, 2.2, dancerPos.z + 1.0),
          look: dancerPos,
        };
      case "ABOVE_ORBIT":
        return {
          pos: new THREE.Vector3(0, 4.5, 4.5 + dancerPos.z),
          look: dancerPos,
        };
      case "FOSSIL_FOLLOW":
        // Cinematic tracking along the spline trail
        if (this.currentPath) {
          const t = (this.currentTime / this.totalTime) % 1.0;
          const lookT = Math.min(t + 0.05, 1.0); // Look slightly ahead
          const camPos = this.currentPath.getPointAt(t).add(new THREE.Vector3(0.5, 0.2, 0.5));
          const lookPos = this.currentPath.getPointAt(lookT);
          return { pos: camPos, look: lookPos };
        }
        return {
          pos: new THREE.Vector3(0, 2.5, dancerPos.z + 5),
          look: dancerPos,
        };
      default:
        return {
          pos: new THREE.Vector3(0, 2.5, dancerPos.z + 5),
          look: dancerPos,
        };
    }
  }
}
