"use strict";
/* ═══════════════ CURSOR ════════════════════════════════════ */
const C = document.getElementById("C"),
  CR = document.getElementById("CR");
let mx = 0,
  my = 0,
  rx = 0,
  ry = 0;
document.addEventListener("mousemove", (e) => {
  mx = e.clientX;
  my = e.clientY;
  C.style.left = mx + "px";
  C.style.top = my + "px";
});
(function lag() {
  rx += (mx - rx) * 0.1;
  ry += (my - ry) * 0.1;
  CR.style.left = Math.round(rx * 10) / 10 + "px";
  CR.style.top = Math.round(ry * 10) / 10 + "px";
  requestAnimationFrame(lag);
})();
document.querySelectorAll("a,button,.pi-head,.stat").forEach((el) => {
  el.addEventListener("mouseenter", () => {
    C.style.width = "5px";
    C.style.height = "5px";
    CR.style.width = "40px";
    CR.style.height = "40px";
    CR.style.borderColor = "rgba(127,255,196,.6)";
  });
  el.addEventListener("mouseleave", () => {
    C.style.width = "8px";
    C.style.height = "8px";
    CR.style.width = "30px";
    CR.style.height = "30px";
    CR.style.borderColor = "rgba(127,255,196,.35)";
  });
});

/* ═══════════════ TICKER ════════════════════════════════════ */
const items = [
  "Three.js / WebGPU",
  "Poi Flow Art",
  "GLSL Trail Shaders",
  "Blender 5.1",
  "VRM Avatars",
  "Resin 3D Printing",
  "AI Agent Systems",
  "Epitrochoid Maths",
  "TSL Node Materials",
  "Light Painting",
  "Generative Sculpture",
  "Laban Effort System",
  "Qdrant · Ollama · MQTT",
];
const t = document.getElementById("ticker");
[...items, ...items].forEach((s) => {
  const d = document.createElement("span");
  d.className = "tick-item";
  d.innerHTML = `<b>✦</b>${s}`;
  t.appendChild(d);
});

/* ═══════════════ SCROLL REVEAL ════════════════════════════ */
const ro = new IntersectionObserver(
  (es) =>
    es.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("on");
        ro.unobserve(e.target);
      }
    }),
  { threshold: 0.12 },
);
document.querySelectorAll(".reveal").forEach((el) => ro.observe(el));

/* ═══════════════ PROJECTS ACCORDION ══════════════════════ */
document.querySelectorAll(".pi").forEach((pi) => {
  pi.querySelector(".pi-head").addEventListener("click", () => {
    const open = pi.dataset.open === "true";
    document.querySelectorAll(".pi").forEach((p) => {
      p.dataset.open = "false";
      p.querySelector(".pi-body").classList.remove("open");
      p.querySelector(".pi-arr").style.transform = "";
    });
    if (!open) {
      pi.dataset.open = "true";
      pi.querySelector(".pi-body").classList.add("open");
      pi.querySelector(".pi-arr").style.transform = "rotate(45deg)";
    }
  });
});

/* ═══════════════ HERO WEBGL SHADER ════════════════════════ */
(() => {
  const cv = document.getElementById("hc");
  const gl = cv.getContext("webgl", { antialias: false, alpha: false });
  if (!gl) return;
  const vs = `attribute vec2 a;void main(){gl_Position=vec4(a,0,1);}`;
  const fs = `
precision mediump float;
uniform vec2 R;uniform float T;uniform vec2 M;
#define PI 3.14159265
float flower(vec2 p,float k,float r,float d){
float a=atan(p.y,p.x);
float len=length(p);
float target=(r+r/k)*0.5-d*0.5;
float x=(r+r/k)*cos(a)-d*cos((r+r/k)/(r/k)*a);
float y=(r+r/k)*sin(a)-d*sin((r+r/k)/(r/k)*a);
return length(p-vec2(x,y)*0.18);
}
void main(){
vec2 uv=(gl_FragCoord.xy-R*.5)/min(R.x,R.y);
float t=T*.18;
vec3 col=vec3(0);
for(int i=0;i<4;i++){
  float fi=float(i);
  float k=3.0+fi*1.4;
  float off=fi*PI*.5+T*.07;
  vec2 hand=vec2(cos(T*.3+off),sin(T*.37+off))*.22;
  float R2=.28,r=R2/k,d=.6*(R2+r);
  vec2 p=uv-hand;
  float angle=atan(p.y,p.x)-t*(k+1.0)-off;
  float len=length(p);
  float x=(R2+r)*cos(angle)-d*cos((R2+r)/r*angle);
  float y=(R2+r)*sin(angle)-d*sin((R2+r)/r*angle);
  float dist=length(p-vec2(x,y));
  float glow=0.004/(dist+.002);
  vec3 hue=.5+.5*cos(vec3(0,2.1,-2.1)+fi*1.4+T*.1);
  col+=hue*glow*(0.5+0.5*sin(T*2.0+fi*1.3));
}
col=col/(1.0+col);
col*=1.4;
gl_FragColor=vec4(col,1);
}`;
  function sh(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  const al = gl.getAttribLocation(prog, "a");
  gl.enableVertexAttribArray(al);
  gl.vertexAttribPointer(al, 2, gl.FLOAT, false, 0, 0);
  const uR = gl.getUniformLocation(prog, "R"),
    uT = gl.getUniformLocation(prog, "T"),
    uM = gl.getUniformLocation(prog, "M");
  let t = 0,
    mx2 = 0.5,
    my2 = 0.5;
  document.addEventListener("mousemove", (e) => {
    mx2 = e.clientX / innerWidth;
    my2 = 1 - e.clientY / innerHeight;
  });
  function resize() {
    cv.width = innerWidth;
    cv.height = innerHeight;
    gl.viewport(0, 0, cv.width, cv.height);
  }
  resize();
  window.addEventListener("resize", resize);
  function frame() {
    t += 0.016;
    gl.uniform2f(uR, cv.width, cv.height);
    gl.uniform1f(uT, t);
    gl.uniform2f(uM, mx2, my2);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    requestAnimationFrame(frame);
  }
  frame();
})();

/* ═══════════════ UNIFIED TOY SYSTEM ══════════════════════ */
const TOY_CV = document.getElementById("toy-cv");
const TOY_PANEL = document.getElementById("toy-panel");
let toyCtx = null,
  toyRaf = null,
  toyState = {};

function initToyCtx() {
  const dpr = window.devicePixelRatio || 1;
  const w = TOY_CV.parentElement.offsetWidth,
    h = TOY_CV.parentElement.offsetHeight;
  TOY_CV.width = w * dpr;
  TOY_CV.height = h * dpr;
  TOY_CV.style.width = w + "px";
  TOY_CV.style.height = h + "px";
  toyCtx = TOY_CV.getContext("2d");
  toyCtx.scale(dpr, dpr);
  return { w, h };
}

const TOYS = {
  poi: {
    title: "Poi Flower Generator",
    desc: "The epitrochoid mathematics inside every poi move I spin, live. Change the petals and watch the geometry evolve — this is what happens in my head when I’m learning a new move.",
    hint: "// x = (R+r)cos(t) - d·cos((R+r)/r · t)",
    controls: [
      {
        id: "poi-k",
        label: "Petals",
        min: 2,
        max: 11,
        step: 1,
        val: 5,
        fmt: (v) => v,
      },
      {
        id: "poi-d",
        label: "Extension",
        min: 15,
        max: 95,
        step: 1,
        val: 65,
        fmt: (v) => v + "%",
      },
      {
        id: "poi-sp",
        label: "Speed",
        min: 1,
        max: 10,
        step: 1,
        val: 4,
        fmt: (v) => v,
      },
      {
        id: "poi-tr",
        label: "Trail",
        min: 30,
        max: 250,
        step: 5,
        val: 120,
        fmt: (v) => v,
      },
    ],
    init(s) {
      s.hist = [];
      s.t = 0;
    },
    frame(s, w, h, ctx) {
      const k = +s["poi-k"],
        d = +s["poi-d"] / 100,
        sp = +s["poi-sp"],
        tr = +s["poi-tr"];
      ctx.fillStyle = "rgba(4,6,11,.22)";
      ctx.fillRect(0, 0, w, h);
      s.t += sp * 0.004;
      const sc = Math.min(w, h) * 0.4;
      const R = 0.32,
        r = R / k,
        ext = d * (R + r);
      const x =
        w / 2 +
        ((R + r) * Math.cos(s.t) - ext * Math.cos(((R + r) / r) * s.t)) * sc;
      const y =
        h / 2 +
        ((R + r) * Math.sin(s.t) - ext * Math.sin(((R + r) / r) * s.t)) * sc;
      s.hist.push({ x, y });
      if (s.hist.length > tr) s.hist.shift();
      for (let i = 1; i < s.hist.length; i++) {
        const a = i / s.hist.length,
          hue = 130 + a * 80;
        ctx.beginPath();
        ctx.moveTo(s.hist[i - 1].x, s.hist[i - 1].y);
        ctx.lineTo(s.hist[i].x, s.hist[i].y);
        ctx.strokeStyle = `hsla(${hue},85%,65%,${a * 0.85})`;
        ctx.lineWidth = a * 2.8;
        ctx.lineCap = "round";
        ctx.stroke();
      }
      if (s.hist.length) {
        const tip = s.hist.at(-1);
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = "#7fffc4";
        ctx.fill();
      }
    },
  },
  attractor: {
    title: "Strange Attractor Sculptor",
    desc: "I printed the Lorenz attractor in resin. You can see exactly why — it’s already sculpture. Switch between four systems and watch chaos invent its own geometry.",
    hint: "// σ(y-x), x(ρ-z)-y, xy-βz  ←  Lorenz 1963",
    controls: [
      {
        id: "att-t",
        label: "System",
        min: 0,
        max: 3,
        step: 1,
        val: 0,
        fmt: (v) => ["Lorenz", "Halvorsen", "Thomas", "Aizawa"][v],
      },
      {
        id: "att-sp",
        label: "Speed",
        min: 1,
        max: 8,
        step: 1,
        val: 3,
        fmt: (v) => v,
      },
      {
        id: "att-tr",
        label: "Trail",
        min: 100,
        max: 3000,
        step: 50,
        val: 1200,
        fmt: (v) => v,
      },
    ],
    init(s) {
      s.x = 0.1;
      s.y = 0;
      s.z = 0;
      s.hist = [];
    },
    frame(s, w, h, ctx) {
      const type = +s["att-t"],
        sp = +s["att-sp"],
        tr = +s["att-tr"];
      ctx.fillStyle = "rgba(4,6,11,.18)";
      ctx.fillRect(0, 0, w, h);
      const dt = 0.002;
      for (let i = 0; i < sp * 2; i++) {
        let { x, y, z } = s;
        if (type === 0) {
          const σ = 10,
            ρ = 28,
            β = 8 / 3;
          s.x += σ * (y - x) * dt;
          s.y += (x * (ρ - z) - y) * dt;
          s.z += (x * y - β * z) * dt;
        } else if (type === 1) {
          const a = 1.89;
          s.x += (-a * x - 4 * y - 4 * z - y * y) * dt * 0.3;
          s.y += (-a * y - 4 * z - 4 * x - z * z) * dt * 0.3;
          s.z += (-a * z - 4 * x - 4 * y - x * x) * dt * 0.3;
        } else if (type === 2) {
          const b = 0.208;
          s.x += (Math.sin(y) - b * x) * dt * 5;
          s.y += (Math.sin(z) - b * y) * dt * 5;
          s.z += (Math.sin(x) - b * z) * dt * 5;
        } else {
          const a = 0.95,
            b = 0.7,
            c = 0.6,
            d2 = 3.5,
            e = 0.25,
            f = 0.1;
          s.x += ((z - b) * x - d2 * y) * dt;
          s.y += (d2 * x + (z - b) * y) * dt;
          s.z +=
            (c +
              a * z -
              (z * z * z) / 3 -
              (x * x + y * y) * (1 + e * z) +
              f * z * x * x * x) *
            dt;
        }
        const sc = [9, 38, 28, 14][type],
          ox = [0, 0, 0, 0],
          oz = [26, 0, 0, 0];
        s.hist.push({
          px: w / 2 + (s.x - ox[type]) * sc,
          py: h / 2 - (s.z - oz[type]) * sc,
        });
        if (s.hist.length > tr) s.hist.shift();
      }
      const hues = [200, 150, 45, 300];
      for (let i = 1; i < s.hist.length; i++) {
        const a = i / s.hist.length;
        ctx.beginPath();
        ctx.moveTo(s.hist[i - 1].px, s.hist[i - 1].py);
        ctx.lineTo(s.hist[i].px, s.hist[i].py);
        ctx.strokeStyle = `hsla(${hues[type]},75%,65%,${a * 0.55})`;
        ctx.lineWidth = a * 1.8;
        ctx.stroke();
      }
    },
  },
  jewel: {
    title: "Jewel 3D Engine",
    desc: "A 2D window into the 3D gem geometry of the Jewel Array. The real engine has 30 algorithms and lives in 897 lines of pure maths. This is the tourist version — still pretty though.",
    hint: "// vertex projection: isometric 3D → 2D canvas",
    controls: [
      {
        id: "jw-n",
        label: "Facets",
        min: 3,
        max: 14,
        step: 1,
        val: 6,
        fmt: (v) => v,
      },
      {
        id: "jw-d",
        label: "Depth",
        min: 10,
        max: 90,
        step: 5,
        val: 55,
        fmt: (v) => v + "%",
      },
      {
        id: "jw-sp",
        label: "Spin",
        min: 0,
        max: 10,
        step: 1,
        val: 3,
        fmt: (v) => v,
      },
      {
        id: "jw-lay",
        label: "Layers",
        min: 1,
        max: 4,
        step: 1,
        val: 2,
        fmt: (v) => v,
      },
    ],
    init(s) {
      s.a = 0;
    },
    frame(s, w, h, ctx) {
      const n = +s["jw-n"],
        dep = +s["jw-d"] / 100,
        sp = +s["jw-sp"],
        lay = +s["jw-lay"];
      ctx.fillStyle = "rgba(4,6,11,.25)";
      ctx.fillRect(0, 0, w, h);
      s.a += sp * 0.007;
      const draw = (cx, cy, R, rot, alpha) => {
        const pts = [],
          inn = [];
        for (let i = 0; i < n; i++) {
          const a = rot + (i * Math.PI * 2) / n;
          pts.push({ x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R });
        }
        const rI = R * dep;
        for (let i = 0; i < n; i++) {
          const a = rot + Math.PI / n + (i * Math.PI * 2) / n;
          inn.push({
            x: cx + Math.cos(a) * rI,
            y: cy + Math.sin(a) * rI,
          });
        }
        for (let i = 0; i < n; i++) {
          const ni = (i + 1) % n,
            hue = 140 + i * (220 / n);
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[ni].x, pts[ni].y);
          ctx.closePath();
          ctx.fillStyle = `hsla(${hue},65%,40%,${0.35 * alpha})`;
          ctx.fill();
          ctx.strokeStyle = `hsla(${hue},80%,65%,${0.6 * alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        for (let i = 0; i < n; i++) {
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(inn[i].x, inn[i].y);
          ctx.strokeStyle = `rgba(127,255,196,${0.3 * alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(inn[(i + n - 1) % n].x, inn[(i + n - 1) % n].y);
          ctx.strokeStyle = `rgba(109,207,255,${0.25 * alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
        ctx.beginPath();
        inn.forEach((p, i) =>
          i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y),
        );
        ctx.closePath();
        ctx.fillStyle = `rgba(127,255,196,${0.12 * alpha})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(127,255,196,${0.55 * alpha})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      };
      const R = Math.min(w, h) * 0.38;
      for (let l = 0; l < lay; l++) {
        const lr = R * (1 - (0.55 * l) / Math.max(lay - 1, 1)),
          la = 1 - (0.3 * (lay - 1 - l)) / Math.max(lay - 1, 1);
        draw(w / 2, h / 2, lr, s.a * (1 + l * 0.6), la);
      }
    },
  },
  paint: {
    title: "Light Trail Painter",
    desc: "Draw with your mouse or finger. Six brush modes, each a different way photons could misbehave. This is what the ob48 brush system feels like from the inside.",
    hint: "// 48 brushes in the real engine — this is a preview",
    controls: [
      {
        id: "pt-b",
        label: "Brush",
        min: 0,
        max: 5,
        step: 1,
        val: 0,
        fmt: (v) => ["Comet", "Neon", "Ember", "Frost", "Ghost", "Spark"][v],
      },
      {
        id: "pt-s",
        label: "Size",
        min: 2,
        max: 24,
        step: 1,
        val: 7,
        fmt: (v) => v,
      },
      {
        id: "pt-f",
        label: "Fade",
        min: 1,
        max: 20,
        step: 1,
        val: 8,
        fmt: (v) => v,
      },
    ],
    clear: true,
    init(s) {
      s.painting = false;
      s.lx = 0;
      s.ly = 0;
      s.bg = true;
    },
    frame(s, w, h, ctx) {
      if (s.bg) {
        ctx.fillStyle = "#04060b";
        ctx.fillRect(0, 0, w, h);
        s.bg = false;
      }
      const fade = +s["pt-f"];
      ctx.fillStyle = `rgba(4,6,11,${fade * 0.003})`;
      ctx.fillRect(0, 0, w, h);
    },
    setupEvents(s, w, h, ctx, cv) {
      const brushDefs = [
        { h: 150, sat: 85, lit: 65 },
        { h: 200, sat: 90, lit: 70 },
        { h: 28, sat: 90, lit: 60 },
        { h: 185, sat: 70, lit: 80 },
        { h: 275, sat: 60, lit: 75 },
        { h: 60, sat: 95, lit: 70 },
      ];
      const pos = (e) => {
        const r = cv.getBoundingClientRect(),
          c = e.touches ? e.touches[0] : e;
        return {
          x: ((c.clientX - r.left) / r.width) * w,
          y: ((c.clientY - r.top) / r.height) * h,
        };
      };
      const draw = (x1, y1, x2, y2) => {
        const b = brushDefs[+s["pt-b"]],
          sz = +s["pt-s"];
        const steps = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 2));
        for (let i = 0; i < steps; i++) {
          const f = i / steps,
            x = x1 + (x2 - x1) * f,
            y = y1 + (y2 - y1) * f;
          for (let j = 0; j < 3; j++) {
            const off = (j - 1) * sz * 0.3,
              ox = Math.sin(off) * 2,
              oy = Math.cos(off) * 2;
            ctx.beginPath();
            ctx.arc(x + ox, y + oy, sz * (1 - j * 0.2), 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${b.h + j * 10},${b.sat}%,${b.lit}%,${0.38 - j * 0.08})`;
            ctx.fill();
          }
          if (+s["pt-b"] === 5) {
            for (let k = 0; k < 6; k++) {
              const a = Math.random() * Math.PI * 2,
                r = Math.random() * sz * 2.2;
              ctx.beginPath();
              ctx.arc(
                x + Math.cos(a) * r,
                y + Math.sin(a) * r,
                Math.random() * 2.5,
                0,
                Math.PI * 2,
              );
              ctx.fillStyle = `hsla(${b.h},95%,80%,.6)`;
              ctx.fill();
            }
          }
        }
      };
      cv.addEventListener("mousedown", (e) => {
        s.painting = true;
        const p = pos(e);
        s.lx = p.x;
        s.ly = p.y;
      });
      cv.addEventListener(
        "touchstart",
        (e) => {
          e.preventDefault();
          s.painting = true;
          const p = pos(e);
          s.lx = p.x;
          s.ly = p.y;
        },
        { passive: false },
      );
      cv.addEventListener("mousemove", (e) => {
        if (!s.painting) return;
        const p = pos(e);
        draw(s.lx, s.ly, p.x, p.y);
        s.lx = p.x;
        s.ly = p.y;
      });
      cv.addEventListener(
        "touchmove",
        (e) => {
          e.preventDefault();
          if (!s.painting) return;
          const p = pos(e);
          draw(s.lx, s.ly, p.x, p.y);
          s.lx = p.x;
          s.ly = p.y;
        },
        { passive: false },
      );
      ["mouseup", "mouseleave", "touchend"].forEach((ev) =>
        cv.addEventListener(ev, () => (s.painting = false)),
      );
    },
  },
  agent: {
    title: "Agent Thought Visualiser",
    desc: "What the AURA dual-brain system looks like from inside. The green node is Architect (deep reasoning), blue is Typist (fast output). Watch them talk. Adjust activity to see it hum.",
    hint: "// A = Architect (Dolphin)  T = Typist (Qwen)",
    controls: [
      {
        id: "ag-n",
        label: "Agents",
        min: 5,
        max: 28,
        step: 1,
        val: 14,
        fmt: (v) => v,
      },
      {
        id: "ag-a",
        label: "Activity",
        min: 1,
        max: 10,
        step: 1,
        val: 5,
        fmt: (v) => v,
      },
    ],
    init(s, w, h) {
      s.nodes = [];
      s.sigs = [];
      s.t = 0;
      s.built = false;
    },
    buildNodes(s, w, h) {
      const n = +s["ag-n"];
      s.nodes = [];
      for (let i = 0; i < n; i++) {
        const arch = i === 0,
          typ = i === 1;
        s.nodes.push({
          x: arch ? w * 0.3 : typ ? w * 0.7 : w * 0.1 + Math.random() * w * 0.8,
          y: arch ? h * 0.5 : typ ? h * 0.5 : h * 0.1 + Math.random() * h * 0.8,
          r: arch ? 13 : typ ? 13 : 4 + Math.random() * 5,
          type: arch ? "A" : typ ? "T" : "ag",
          hue: arch ? 145 : typ ? 200 : 50 + Math.random() * 270,
          ph: Math.random() * Math.PI * 2,
        });
      }
      s.built = true;
    },
    frame(s, w, h, ctx) {
      const act = +s["ag-a"];
      if (!s.built || s.nodes.length !== +s["ag-n"]) this.buildNodes(s, w, h);
      ctx.fillStyle = "rgba(4,6,11,.2)";
      ctx.fillRect(0, 0, w, h);
      s.t += 0.018;
      if (Math.random() < act * 0.018 && s.sigs.length < 25) {
        const a = Math.floor(Math.random() * s.nodes.length),
          b = Math.floor(Math.random() * s.nodes.length);
        if (a !== b) s.sigs.push({ f: a, t2: b, p: 0, hue: s.nodes[a].hue });
      }
      for (let i = s.sigs.length - 1; i >= 0; i--) {
        const sg = s.sigs[i];
        sg.p += 0.015 * act * 0.6;
        const fn = s.nodes[sg.f],
          tn = s.nodes[sg.t2];
        ctx.beginPath();
        ctx.moveTo(fn.x, fn.y);
        ctx.lineTo(tn.x, tn.y);
        ctx.strokeStyle = `hsla(${sg.hue},60%,55%,.07)`;
        ctx.lineWidth = 1;
        ctx.stroke();
        const px = fn.x + (tn.x - fn.x) * sg.p,
          py = fn.y + (tn.y - fn.y) * sg.p;
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${sg.hue},90%,70%,.9)`;
        ctx.fill();
        if (sg.p >= 1) s.sigs.splice(i, 1);
      }
      for (const nd of s.nodes) {
        nd.ph += 0.04;
        const gl2 = (Math.sin(nd.ph) + 1) * 0.5;
        if (nd.type !== "ag") {
          ctx.beginPath();
          ctx.arc(nd.x, nd.y, nd.r + 7 + gl2 * 5, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${nd.hue},65%,55%,.07)`;
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(nd.x, nd.y, nd.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${nd.hue},50%,${nd.type === "ag" ? 22 : 28}%,.95)`;
        ctx.fill();
        ctx.strokeStyle = `hsla(${nd.hue},75%,60%,${0.55 + gl2 * 0.45})`;
        ctx.lineWidth = nd.type === "ag" ? 1 : 1.8;
        ctx.stroke();
        if (nd.type !== "ag") {
          ctx.fillStyle = nd.type === "A" ? "#7fffc4" : "#6dcfff";
          ctx.font = `bold 8px 'JetBrains Mono',monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(nd.type, nd.x, nd.y);
        }
      }
    },
  },
  liss: {
    title: "Lissajous / Laban Wave",
    desc: "Lissajous figures mapped to Laban effort qualities. Frequency ratio = effort complexity. Phase shift = the moment between intention and action. Adjust and watch the mood change.",
    hint: "// x=sin(fx·t+φ)  y=sin(fy·t)  — Lissajous 1857",
    controls: [
      {
        id: "ls-fx",
        label: "Freq X",
        min: 1,
        max: 8,
        step: 1,
        val: 3,
        fmt: (v) => v,
      },
      {
        id: "ls-fy",
        label: "Freq Y",
        min: 1,
        max: 8,
        step: 1,
        val: 2,
        fmt: (v) => v,
      },
      {
        id: "ls-ph",
        label: "Phase",
        min: 0,
        max: 314,
        step: 2,
        val: 100,
        fmt: (v) => (v / 100).toFixed(2) + "π",
      },
    ],
    init(s) {
      s.hist = [];
      s.t = 0;
    },
    frame(s, w, h, ctx) {
      const fx = +s["ls-fx"],
        fy = +s["ls-fy"],
        ph = +s["ls-ph"] / 100;
      ctx.fillStyle = "rgba(4,6,11,.14)";
      ctx.fillRect(0, 0, w, h);
      s.t += 0.02;
      const x = w / 2 + Math.sin(fx * s.t + ph) * w * 0.42;
      const y = h / 2 + Math.sin(fy * s.t) * h * 0.42;
      s.hist.push({ x, y });
      if (s.hist.length > 800) s.hist.shift();
      for (let i = 1; i < s.hist.length; i++) {
        const a = i / s.hist.length,
          hue = 195 + a * 140;
        ctx.beginPath();
        ctx.moveTo(s.hist[i - 1].x, s.hist[i - 1].y);
        ctx.lineTo(s.hist[i].x, s.hist[i].y);
        ctx.strokeStyle = `hsla(${hue},80%,65%,${a * 0.75})`;
        ctx.lineWidth = a * 2.2;
        ctx.stroke();
      }
      if (s.hist.length) {
        const tip = s.hist.at(-1);
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#6dcfff";
        ctx.fill();
      }
    },
  },
};

let activeToy = "poi",
  toyEventsSetup = false;

function buildPanel(key) {
  const toy = TOYS[key];
  let html = `<div class="toy-title">${toy.title}</div><div class="toy-desc">${toy.desc}</div>`;
  toy.controls.forEach((c) => {
    html += `<div class="ctrl-grp"><div class="ctrl-lbl">${c.label} <span id="${c.id}-v">${c.fmt(c.val)}</span></div><input type="range" id="${c.id}" min="${c.min}" max="${c.max}" step="${c.step}" value="${c.val}"></div>`;
  });
  html += `<div class="toy-hint">${toy.hint}</div>`;
  if (toy.clear)
    html += `<button class="tclear" id="toy-clear">Clear canvas</button>`;
  TOY_PANEL.innerHTML = html;
  toy.controls.forEach((c) => {
    const el = document.getElementById(c.id),
      vl = document.getElementById(c.id + "-v");
    el.addEventListener("input", () => {
      toyState[c.id] = el.value;
      vl.textContent = c.fmt(el.value);
      if (key === "poi" && c.id === "poi-k") toyState.hist = [];
      if (key === "attractor") toyState.hist = [];
      if (key === "liss") toyState.hist = [];
      if (key === "agent") toyState.built = false;
    });
    toyState[c.id] = c.val;
  });
  if (toy.clear) {
    document.getElementById("toy-clear").addEventListener("click", () => {
      toyState.bg = true;
    });
  }
}

function switchToy(key) {
  if (toyRaf) {
    cancelAnimationFrame(toyRaf);
    toyRaf = null;
  }
  activeToy = key;
  toyState = {};
  toyEventsSetup = false;
  const { w, h } = initToyCtx();
  const toy = TOYS[key];
  buildPanel(key);
  if (toy.init) toy.init(toyState, w, h);
  if (toy.setupEvents && !toyEventsSetup) {
    toy.setupEvents(toyState, w, h, toyCtx, TOY_CV);
    toyEventsSetup = true;
  }
  function loop() {
    if (activeToy !== key) return;
    toy.frame(
      toyState,
      TOY_CV.width / (window.devicePixelRatio || 1),
      TOY_CV.height / (window.devicePixelRatio || 1),
      toyCtx,
    );
    toyRaf = requestAnimationFrame(loop);
  }
  loop();
}

document.querySelectorAll(".ptab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".ptab").forEach((b) => b.classList.remove("on"));
    btn.classList.add("on");
    switchToy(btn.dataset.toy);
  });
});
switchToy("poi");
window.addEventListener("resize", () => {
  if (activeToy) switchToy(activeToy);
});
