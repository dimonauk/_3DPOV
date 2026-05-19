/**
 * lib/ambient/renderer-webgl.ts — WebGL fallback for AmbientField.
 *
 * Plain WebGL2 (no Three.js dependency) — keeps the fallback bundle
 * lean for browsers that don't have WebGPU. Renders ~5-15k points as
 * GL_POINTS with an additive fragment shader. The point geometry
 * never re-uploads after init; we update positions in a tight
 * Float32Array on the JS side and `bufferSubData` once per frame.
 *
 * Identical AmbientRenderer interface as the WebGPU implementation
 * so the component can swap blindly.
 */

import type {
  AmbientRenderer,
  AmbientRendererOptions,
} from "./config";
import {
  BACKGROUND_RGB,
  PALETTES,
  intensityToAlpha,
} from "./config";

const VERTEX_SRC = `#version 300 es
  precision highp float;
  in vec2 a_position;
  uniform float u_dpr;
  uniform float u_pointSize;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    gl_PointSize = u_pointSize * u_dpr;
  }
`;

const FRAGMENT_SRC = `#version 300 es
  precision highp float;
  uniform vec3 u_hi;
  uniform vec3 u_lo;
  uniform float u_alpha;
  out vec4 o_color;
  void main() {
    // Distance from the GL_POINT centre, falling off radially.
    vec2 d = gl_PointCoord - vec2(0.5);
    float r = length(d) * 2.0;
    if (r > 1.0) discard;
    float fall = pow(1.0 - r, 2.0);
    vec3 col = mix(u_lo, u_hi, fall);
    o_color = vec4(col * fall, fall * u_alpha);
  }
`;

export class WebGLAmbientRenderer implements AmbientRenderer {
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private positions: Float32Array = new Float32Array(0);
  private velocities: Float32Array = new Float32Array(0);
  private vbo: WebGLBuffer | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private count = 0;
  private running = false;
  private rafHandle = 0;
  private lastFrame = 0;
  private frameInterval = 1000 / 60;
  private opts: AmbientRendererOptions | null = null;
  private mouse: { x: number; y: number; active: boolean } = {
    x: 0,
    y: 0,
    active: false,
  };
  private dpr = 1;

  async init(
    canvas: HTMLCanvasElement,
    opts: AmbientRendererOptions,
  ): Promise<void> {
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
      powerPreference: "low-power",
    });
    if (!gl) throw new Error("WebGL2 not available");
    this.gl = gl;
    this.opts = opts;
    this.positions = opts.positions;
    this.velocities = opts.velocities;
    this.count = (opts.positions.length / 3) | 0;
    this.frameInterval = 1000 / Math.max(15, opts.targetFps);

    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SRC);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC);
    const program = gl.createProgram();
    if (!program) throw new Error("WebGL: createProgram failed");
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(program) ?? "(no log)";
      throw new Error(`WebGL program link failed: ${log}`);
    }
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    this.program = program;

    // VAO + VBO for the xy stream (we only push positions to the GPU
    // — z is unused in the WebGL path; saves a third of the upload).
    const vao = gl.createVertexArray();
    const vbo = gl.createBuffer();
    if (!vao || !vbo) throw new Error("WebGL: VAO/VBO alloc failed");
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    const xy = packXY(this.positions, this.count);
    gl.bufferData(gl.ARRAY_BUFFER, xy, gl.DYNAMIC_DRAW);
    const aPos = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    this.vao = vao;
    this.vbo = vbo;

    // One-time blending + clear setup.
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE); // additive
    gl.clearColor(BACKGROUND_RGB[0], BACKGROUND_RGB[1], BACKGROUND_RGB[2], 0);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastFrame = performance.now();
    this.loop();
  }

  stop(): void {
    this.running = false;
    if (this.rafHandle) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = 0;
    }
  }

  setMouse(x: number, y: number, active: boolean): void {
    this.mouse.x = x;
    this.mouse.y = y;
    this.mouse.active = active;
  }

  resize(width: number, height: number, dpr: number): void {
    if (!this.gl) return;
    this.dpr = dpr;
    this.gl.canvas.width = Math.max(1, Math.round(width * dpr));
    this.gl.canvas.height = Math.max(1, Math.round(height * dpr));
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
  }

  dispose(): void {
    this.stop();
    const gl = this.gl;
    if (!gl) return;
    if (this.vao) gl.deleteVertexArray(this.vao);
    if (this.vbo) gl.deleteBuffer(this.vbo);
    if (this.program) gl.deleteProgram(this.program);
    this.vao = null;
    this.vbo = null;
    this.program = null;
    this.gl = null;
  }

  private loop = (): void => {
    if (!this.running) return;
    this.rafHandle = requestAnimationFrame(this.loop);
    const now = performance.now();
    const dt = now - this.lastFrame;
    if (dt < this.frameInterval) return;
    this.lastFrame = now - (dt % this.frameInterval);
    this.step(Math.min(dt / 1000, 1 / 15));
    this.draw();
  };

  private step(dt: number): void {
    const pos = this.positions;
    const vel = this.velocities;
    const n = this.count;
    const mouse = this.mouse;
    const interactive = this.opts?.interactive ?? true;
    for (let i = 0; i < n; i++) {
      const idx = i * 3;
      // Tiny Brownian jitter — adds life without compounding.
      vel[idx + 0]! += (Math.random() - 0.5) * 0.002;
      vel[idx + 1]! += (Math.random() - 0.5) * 0.002;
      // Mild mouse attractor.
      if (interactive && mouse.active) {
        const dx = mouse.x - pos[idx + 0]!;
        const dy = mouse.y - pos[idx + 1]!;
        const d2 = dx * dx + dy * dy + 0.04;
        const force = 0.012 / d2;
        vel[idx + 0]! += dx * force * dt;
        vel[idx + 1]! += dy * force * dt;
      }
      // Mild damping so the field doesn't accelerate forever.
      vel[idx + 0]! *= 0.992;
      vel[idx + 1]! *= 0.992;
      // Integrate.
      pos[idx + 0]! += vel[idx + 0]! * dt;
      pos[idx + 1]! += vel[idx + 1]! * dt;
      // Toroidal wrap at [-1, 1].
      if (pos[idx + 0]! > 1) pos[idx + 0]! -= 2;
      else if (pos[idx + 0]! < -1) pos[idx + 0]! += 2;
      if (pos[idx + 1]! > 1) pos[idx + 1]! -= 2;
      else if (pos[idx + 1]! < -1) pos[idx + 1]! += 2;
    }
  }

  private draw(): void {
    const gl = this.gl;
    if (!gl || !this.program || !this.vao || !this.vbo || !this.opts) return;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    const xy = packXY(this.positions, this.count);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, xy);

    const palette = PALETTES[this.opts.palette];
    setVec3(gl, this.program, "u_hi", palette.hi);
    setVec3(gl, this.program, "u_lo", palette.lo);
    setFloat(
      gl,
      this.program,
      "u_alpha",
      intensityToAlpha(this.opts.intensity),
    );
    setFloat(gl, this.program, "u_pointSize", 2.5);
    setFloat(gl, this.program, "u_dpr", this.dpr);

    gl.drawArrays(gl.POINTS, 0, this.count);
    gl.bindVertexArray(null);
  }
}

function compile(
  gl: WebGL2RenderingContext,
  type: number,
  src: string,
): WebGLShader {
  const sh = gl.createShader(type);
  if (!sh) throw new Error("WebGL: createShader failed");
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh) ?? "(no log)";
    gl.deleteShader(sh);
    throw new Error(`WebGL shader compile failed: ${log}`);
  }
  return sh;
}

// Pack the [x, y, z, x, y, z, ...] particle layout into a tight
// [x, y, x, y, ...] buffer for the GL upload. Allocates once per
// frame; ~120 KB at 15k particles — well inside the budget.
function packXY(src: Float32Array, count: number): Float32Array {
  const out = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    out[i * 2 + 0] = src[i * 3 + 0]!;
    out[i * 2 + 1] = src[i * 3 + 1]!;
  }
  return out;
}

function setVec3(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  name: string,
  v: [number, number, number],
): void {
  const loc = gl.getUniformLocation(program, name);
  if (loc) gl.uniform3f(loc, v[0], v[1], v[2]);
}

function setFloat(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  name: string,
  v: number,
): void {
  const loc = gl.getUniformLocation(program, name);
  if (loc) gl.uniform1f(loc, v);
}
