"use client";

import { useEffect, useRef } from "react";

/**
 * Holofoil Dice — WebGL raymarching shader by Jaenam (2025-12-07,
 * CC BY-NC-SA 4.0). Original Twigl source:
 * https://x.com/Jaenam97/status/1997653539078693351
 *
 * Ported to WebGL 1.0 / GLSL ES 1.0 to match Twigl's runtime exactly
 * (Twigl targets WebGL 1.0). tanh polyfilled. Aggressive diagnostic
 * logging — open DevTools console to see [HolofoilDice] lines.
 */

const VERTEX_SHADER = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform vec3 iResolution;
uniform float iTime;
uniform vec4 iMouse;

vec4 tanh4(vec4 x) {
  vec4 e2 = exp(2.0 * x);
  return (e2 - 1.0) / (e2 + 1.0);
}

#define A(C, Z) \\
for (float d = 0., i = 0., c, e, sc, h, a, s, sf; i++ < 80.;) { \\
    vec3 p = vec3((I + I - r.xy) / r.y * d, d - 8.), g, f, k; \\
    if (abs(p.x) > 5.) break; \\
    p.xz *= Rx; \\
    iMouse.z > 0. ? p.yz *= Ry : p.xy *= Ry; \\
    g = floor(p * 6.); \\
    f = fract(p * 6.) - .5; \\
    h = step(length(f), fract(sin(dot(g, vec3(127.1, 311.7, 74.7))) * 43758.5) * .3 + .1); \\
    a = fract(sin(dot(g, vec3(43.7, 78.2, 123.4))) * 127.1) * 6.28; \\
    e = 1.; sc = 2.; \\
    for (int j = 0; j < 3; j++) { \\
        g = abs(mod(p * sc, 2.) - 1.); \\
        e = min(e, min(max(g.x, g.y), min(max(g.y, g.z), max(g.x, g.z))) / sc); \\
        sc *= .6; \\
    } \\
    c = max(max(max(abs(p.x), abs(p.y)), abs(p.z)), dot(abs(p), vec3(.577)) * .9) - 3.; \\
    s = .01 + .15 * abs(max(max(c, e - .1), length(sin(c)) - .3) + Z * .02 - i / 130.); \\
    d += s; \\
    sf = smoothstep(.02, .01, s); \\
    O.C += 1.6 / s * (.5 + .5 * sin(i * .3 + Z * 5.) + sf * 4. * h * sin(a + i * .4 + Z * 5.)); \\
}

void main() {
    vec2 I = gl_FragCoord.xy;
    vec3 r = iResolution;
    vec2 m = iMouse.z > 0. ? (iMouse.xy / r.xy - .5) * 6.28 : vec2(iTime / 2.);
    mat2 Rx = mat2(cos(m.x + vec4(0, 33, 11, 0)));
    mat2 Ry = mat2(cos(m.y + vec4(0, 33, 11, 0)));
    vec4 O = vec4(0.);

    A(r, -1.)
    A(g, 0.)
    A(b, 1.)

    gl_FragColor = tanh4(O * O / 1e7);
}
`;

function compile(
  gl: WebGLRenderingContext,
  type: number,
  src: string,
  label: string,
) {
  const sh = gl.createShader(type);
  if (!sh) {
    console.error(`[HolofoilDice] failed to create ${label} shader`);
    return null;
  }
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    console.error(`[HolofoilDice] ${label} compile error:\n${log}`);
    gl.deleteShader(sh);
    return null;
  }
  console.log(`[HolofoilDice] ${label} compiled ✓`);
  return sh;
}

export function HolofoilDice() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("[HolofoilDice] no canvas ref");
      return;
    }
    console.log("[HolofoilDice] mounting", {
      clientW: canvas.clientWidth,
      clientH: canvas.clientHeight,
    });

    const gl = (canvas.getContext("webgl", {
      antialias: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    }) ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;

    if (!gl) {
      console.error("[HolofoilDice] WebGL not supported on this browser");
      return;
    }
    console.log(
      "[HolofoilDice] WebGL ctx ✓",
      gl.getParameter(gl.VERSION),
      gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
    );

    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER, "vertex");
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER, "fragment");
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    if (!prog) {
      console.error("[HolofoilDice] failed to create program");
      return;
    }
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(
        "[HolofoilDice] program link error:\n",
        gl.getProgramInfoLog(prog),
      );
      return;
    }
    gl.useProgram(prog);
    console.log("[HolofoilDice] program linked ✓");

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const aPos = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "iResolution");
    const uTime = gl.getUniformLocation(prog, "iTime");
    const uMouse = gl.getUniformLocation(prog, "iMouse");

    let mouseX = 0;
    let mouseY = 0;
    let mouseDown = 0;

    const setPointer = (
      clientX: number,
      clientY: number,
      down?: boolean,
    ) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio, 2);
      mouseX = (clientX - rect.left) * dpr;
      mouseY = (rect.height - (clientY - rect.top)) * dpr;
      if (down !== undefined) mouseDown = down ? 1 : 0;
    };

    const onMove = (e: PointerEvent) =>
      setPointer(e.clientX, e.clientY, e.buttons > 0);
    const onDown = (e: PointerEvent) => setPointer(e.clientX, e.clientY, true);
    const onUp = (e: PointerEvent) => setPointer(e.clientX, e.clientY, false);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    let raf = 0;
    let paused = document.hidden;
    let frameCount = 0;
    const t0 = performance.now();

    // visible-tinted clear so we can confirm the canvas is painting at all
    // even if the shader itself produces black
    gl.clearColor(0.05, 0.02, 0.08, 1.0);

    const tick = () => {
      if (paused) {
        raf = 0;
        return;
      }
      resize();
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform3f(uRes, canvas.width, canvas.height, 1);
      gl.uniform1f(uTime, (performance.now() - t0) / 1000);
      gl.uniform4f(uMouse, mouseX, mouseY, mouseDown, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (frameCount === 0) {
        console.log(
          "[HolofoilDice] first frame drawn at",
          canvas.width,
          "×",
          canvas.height,
        );
      }
      frameCount++;
      raf = requestAnimationFrame(tick);
    };

    const onVisibility = () => {
      paused = document.hidden;
      if (!paused && !raf) raf = requestAnimationFrame(tick);
    };
    document.addEventListener("visibilitychange", onVisibility);

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="block h-full w-full"
      style={{ touchAction: "none", backgroundColor: "#0c0a12" }}
    />
  );
}
