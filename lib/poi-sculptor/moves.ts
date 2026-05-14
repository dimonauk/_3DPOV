/**
 * lib/poi-sculptor/moves.ts
 *
 * Registry of 21 poi flow moves and their parametric trail generators.
 * Each move computes both hand spines (h0, h1) over n samples of t ∈ [0, 8π).
 * Content registry — exempt from the 300-line cap.
 */

export const PI = Math.PI;
export const TAU = PI * 2;

export type MoveFamily =
  | "butterfly"
  | "weave"
  | "flower"
  | "isolation"
  | "advanced";

export type Move = {
  id: string;
  label: string;
  diff: 1 | 2 | 3 | 4 | 5;
  family: MoveFamily;
};

export const MOVES: Move[] = [
  { id: "butterfly", label: "Butterfly", diff: 1, family: "butterfly" },
  { id: "weave3", label: "3-Beat Weave", diff: 1, family: "weave" },
  { id: "weave5", label: "5-Beat Weave", diff: 3, family: "weave" },
  { id: "fountain", label: "Fountain", diff: 1, family: "weave" },
  { id: "antispin4", label: "Antispin 4-Petal", diff: 3, family: "flower" },
  { id: "antispin2", label: "Antispin 2-Petal", diff: 2, family: "flower" },
  { id: "inspin3", label: "Inspin 3-Petal", diff: 3, family: "flower" },
  { id: "cateye", label: "Cat's Eye", diff: 3, family: "flower" },
  { id: "triquetra", label: "Triquetra", diff: 4, family: "flower" },
  { id: "pendulum", label: "Pendulum", diff: 1, family: "weave" },
  { id: "isolation", label: "Isolation", diff: 4, family: "isolation" },
  { id: "linear_iso", label: "Linear Isolation", diff: 4, family: "isolation" },
  { id: "toroid", label: "Toroid", diff: 5, family: "advanced" },
  { id: "hyperloop", label: "Hyperloop", diff: 5, family: "weave" },
  { id: "split_bf", label: "Split Butterfly", diff: 4, family: "butterfly" },
  { id: "contact", label: "Contact Roll", diff: 5, family: "advanced" },
  { id: "bhb", label: "Behind-Head BF", diff: 3, family: "butterfly" },
  { id: "lissajous", label: "Lissajous 3:2", diff: 4, family: "advanced" },
  { id: "pentagon", label: "Pentagon Flower", diff: 4, family: "flower" },
  { id: "trefoil", label: "Torus Knot", diff: 5, family: "advanced" },
  { id: "windmill", label: "Windmill", diff: 2, family: "weave" },
];

export type TrailPoint = [number, number, number];
export type Trail = { h0: TrailPoint[]; h1: TrailPoint[] };

export function genTrail(id: string, n = 700): Trail {
  const h0: TrailPoint[] = [];
  const h1: TrailPoint[] = [];
  const S = Math.sin;
  const C = Math.cos;
  const A = Math.abs;
  for (let i = 0; i < n; i++) {
    const t = (i / n) * PI * 8;
    let x0 = 0, y0 = 0, z0 = 0, x1 = 0, y1 = 0, z1 = 0;
    switch (id) {
      case "butterfly": {
        const r = 1.1;
        x0 = r * C(t) - r * 0.5; y0 = r * S(2 * t) * 0.5; z0 = r * S(t) * 0.4;
        x1 = r * C(t + PI) + r * 0.5; y1 = r * S(2 * t + PI) * 0.5; z1 = r * S(t + PI) * 0.4;
        break;
      }
      case "weave3": {
        const w = S(t * 0.5) * 0.8;
        x0 = w - 0.3 + 0.3 * C(t); y0 = 0.5 * C(t * 1.5); z0 = 0.4 * S(t);
        x1 = -w + 0.3 - 0.3 * C(t + PI); y1 = 0.5 * C(t * 1.5 + PI); z1 = 0.4 * S(t + PI);
        break;
      }
      case "weave5": {
        const w = S(t * 0.33);
        x0 = w + 0.4 * C(t * 1.5); y0 = 0.6 * C(t); z0 = 0.5 * S(t * 0.7);
        x1 = -w - 0.4 * C(t * 1.5 + PI); y1 = 0.6 * C(t + PI); z1 = 0.5 * S(t * 0.7 + 2);
        break;
      }
      case "fountain": {
        x0 = 0.8 * C(t); y0 = A(S(t)) * 1.2 - 0.2; z0 = 0.3 * S(2 * t);
        x1 = -0.8 * C(t); y1 = A(S(t + 0.3)) * 1.2 - 0.2; z1 = 0.3 * S(2 * t + PI);
        break;
      }
      case "antispin4": {
        const r = 0.85 + 0.42 * C(4 * t);
        x0 = r * C(t); y0 = r * S(t); z0 = 0.3 * S(t * 3);
        x1 = r * C(t + 1.9); y1 = r * S(t + 1.9); z1 = 0.3 * S((t + 1.9) * 3);
        break;
      }
      case "antispin2": {
        const r = 0.9 + 0.35 * C(2 * t);
        x0 = r * C(t); y0 = r * S(t); z0 = 0.25 * S(t * 2);
        x1 = r * C(t + PI); y1 = r * S(t + PI); z1 = 0.25 * S((t + PI) * 2);
        break;
      }
      case "inspin3": {
        const r = 0.9 - 0.4 * C(4 * t);
        x0 = r * C(t); y0 = r * S(t); z0 = 0.28 * S(t * 5);
        x1 = r * C(t + 2.1); y1 = r * S(t + 2.1); z1 = 0.28 * S((t + 2.1) * 5);
        break;
      }
      case "cateye": {
        x0 = 0.9 * C(t); y0 = 0.45 * S(2 * t); z0 = 0.25 * S(3 * t);
        x1 = 0.9 * C(t + PI); y1 = 0.45 * S(2 * t + PI); z1 = 0.25 * S(3 * t + 1.5);
        break;
      }
      case "triquetra": {
        const r = C(3 * t / 2);
        x0 = r * C(t); y0 = r * S(t); z0 = 0.35 * S(2 * t);
        x1 = r * C(t + 2.09); y1 = r * S(t + 2.09); z1 = 0.35 * S(2 * (t + 1));
        break;
      }
      case "pendulum": {
        const w = S(t * 0.5);
        x0 = w; y0 = -A(w) * 0.8; z0 = 0.15 * S(t);
        x1 = -w; y1 = -A(w) * 0.8; z1 = 0.15 * S(t + PI);
        break;
      }
      case "isolation": {
        const hR = 0.5;
        x0 = hR * C(-t) + hR + 0.05 * S(t * 9); y0 = hR * S(-t); z0 = 0.2 * S(t);
        x1 = -x0; y1 = -y0; z1 = 0.2 * C(t);
        break;
      }
      case "linear_iso": {
        const sc = 0.7;
        x0 = sc * C(t); y0 = 0.05 * S(t); z0 = sc * 0.3 * S(2 * t);
        x1 = sc * C(t + PI) * 0.6; y1 = 0.13 + 0.05 * S(t + PI); z1 = sc * 0.3 * S(2 * (t + PI));
        break;
      }
      case "toroid": {
        const R = 0.85, r = 0.32;
        x0 = (R + r * C(t * 3)) * C(t); y0 = (R + r * C(t * 3)) * S(t); z0 = r * S(t * 3);
        x1 = (R + r * C(t * 3 + PI)) * C(t + PI); y1 = (R + r * C(t * 3 + PI)) * S(t + PI); z1 = r * S(t * 3 + PI);
        break;
      }
      case "hyperloop": {
        const k = 5;
        x0 = C(t) * (1 + 0.42 * C(k * t)); y0 = S(t) * (1 + 0.42 * C(k * t)); z0 = 0.52 * S(k * t);
        x1 = -x0 * 0.75; y1 = -y0 * 0.75; z1 = -z0;
        break;
      }
      case "split_bf": {
        const sep = 0.12;
        x0 = -sep + 0.47 * C(t); y0 = 0.55 * S(t); z0 = 0.19 * C(t + PI / 3);
        x1 = sep + 0.47 * C(t + PI); y1 = 0.55 * S(t + PI); z1 = 0.19 * C(t + PI + PI / 3);
        break;
      }
      case "contact": {
        const p = (t % TAU) / TAU;
        const ay = -0.35 + 0.6 * p - 0.25 * p * p;
        const ax = -0.18 + 0.07 * S(TAU * p);
        x0 = ax * 0.65 + 0.22 * C(t * 2) * 0.3; y0 = ay * 0.65 + 0.28 * S(t); z0 = 0.17 * S(t * 3);
        x1 = -ax * 0.65 + 0.22 * C(t * 2 + PI) * 0.3; y1 = ay * 0.65 + 0.28 * S(t + PI); z1 = 0.17 * S(t * 3 + PI);
        break;
      }
      case "bhb": {
        x0 = -0.1 + 0.55 * C(t + PI / 4); y0 = 0.45 + 0.39 * S(t + PI / 4); z0 = -0.15 + 0.33 * C(t);
        x1 = 0.1 + 0.55 * C(-t + PI / 4); y1 = 0.45 + 0.39 * S(-t + PI / 4); z1 = -0.15 + 0.33 * C(-t);
        break;
      }
      case "lissajous": {
        x0 = C(3 * t); y0 = S(2 * t); z0 = 0.42 * S(t);
        x1 = C(3 * t + PI); y1 = S(2 * t + 1.2); z1 = 0.42 * S(t + PI);
        break;
      }
      case "pentagon": {
        const r = 0.8 + 0.45 * C(5 * t);
        x0 = r * C(t); y0 = r * S(t); z0 = 0.3 * S(2 * t);
        x1 = r * C(t + PI * 0.7); y1 = r * S(t + PI * 0.7); z1 = 0.3 * S(2 * (t + 1.2));
        break;
      }
      case "trefoil": {
        const R2 = 0.6, r2 = 0.25, P = 2, Q = 3;
        x0 = (R2 + r2 * C(Q * t)) * C(P * t); y0 = (R2 + r2 * C(Q * t)) * S(P * t); z0 = r2 * S(Q * t);
        const p2 = t + PI;
        x1 = (R2 + r2 * C(Q * p2)) * C(P * p2); y1 = (R2 + r2 * C(Q * p2)) * S(P * p2); z1 = r2 * S(Q * p2);
        break;
      }
      case "windmill": {
        x0 = 0.7 * C(t); y0 = 0.7 * S(t); z0 = 0.2 * S(2 * t);
        x1 = 0.7 * C(t + PI); y1 = 0.7 * S(t + PI); z1 = 0.2 * S(2 * t + PI);
        break;
      }
    }
    h0.push([x0, y0, z0]);
    h1.push([x1, y1, z1]);
  }
  return { h0, h1 };
}
