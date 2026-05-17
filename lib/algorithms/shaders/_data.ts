export const PRESETS = {
  MANDALA: `/**
 * Renders a procedural mandala pattern using polar coordinates
 * and modulated harmonic frequencies.
 * 
 * @param uv Normalized screen input coordinates
 * @returns Final RGB color vector
 */
vec3 render(vec2 uv) {
    // Map UV from [0, 1] to centered [-1, 1] and compensate for basic aspect ratio
    vec2 p = (uv - 0.5) * 2.0;
    p.x *= 2.0;
    
    // Polar coordinate conversion: Distance from center and angular rotation
    float d = length(p);
    float a = atan(p.y, p.x);
    
    // Base bands: Radial sine wave modulated by time
    float bands = sin(d * 20.0 - u_time * 2.0);
    // Base petals: Angular cosine wave influenced by global seed
    float petals = cos(a * 6.0 + u_seed);
    
    // Harmonics loop: Layer additional frequencies based on u_complexity
    for(int i = 1; i <= 5; i++) {
        float f_i = float(i);
        // Calculate influence weight for this octave
        float weight = clamp(u_complexity * 0.5 - f_i + 1.0, 0.0, 1.0);
        if(weight <= 0.0) break;
        
        // Sum higher frequency components with decreasing amplitude
        bands += sin(d * (20.0 + f_i * 15.0) - u_time * (2.0 + f_i)) * 0.2 * weight;
        petals += cos(a * (6.0 + f_i * 4.0) + u_seed) * 0.2 * weight;
    }

    // Combine bands and petals with a sharp thresholding for crisp edges
    float final = smoothstep(0.1, 0.15, bands * petals);
    
    // Gradient mix between primary and secondary palette colors with exponential falloff
    return mix(u_palette[0], u_palette[1], final * exp(-d));
}`,
  AURORA: `/**
 * Simple hash function for pseudo-random noise generation based on dot products.
 */
float hash(vec2 p) { 
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); 
}

/**
 * 2D Value Noise with Hermite interpolation for smooth transitions.
 */
float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f); // Standard Hermite curve smoothing
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x),
               mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}

/**
 * Renders an aurora-like atmospheric effect using fractional Brownian motion.
 */
vec3 render(vec2 uv) {
    float n = 0.0;
    float amp = 0.5;
    float freq = 4.0;
    
    // Octave accumulation loop
    for(int i = 0; i < 12; i++) {
        float weight = clamp(u_complexity - float(i), 0.0, 1.0);
        if(weight <= 0.0) break;
        
        // Perturb UV coordinates with time to create drifting motion
        n += noise(uv * freq + u_time * 0.1) * amp * weight;
        amp *= 0.5;  // Reduce amplitude for subsequent octaves
        freq *= 2.0; // Increase frequency for finer details
    }
    
    // Vertical mask: Fades the noise out at the top/bottom of the "sky"
    float mask = smoothstep(0.3, 0.7, n + (1.0 - uv.y));
    
    // Select color from palette based on noise value
    vec3 col = mix(u_palette[2], u_palette[3], n);
    
    // Apply atmospheric glow and vertical density falloff
    return col * mask * exp(-abs(uv.y - 0.5) * 4.0);
}`,
  STARFIELD: `/**
 * Stochastic starfield simulation using grid-based partitioning and parallax layers.
 */
vec3 render(vec2 uv) {
    vec3 col = vec3(0.0);
    float base_scale = 20.0;
    float layers = clamp(u_complexity * 0.8, 1.0, 8.0);
    
    // Layering loop to simulate depth via different spatial scales
    for(int i = 0; i < 8; i++) {
        float f_i = float(i);
        float weight = clamp(layers - f_i, 0.0, 1.0);
        if(weight <= 0.0) break;
        
        // Partition space into a grid; smaller values mean larger stars
        vec2 st = uv * (base_scale + f_i * 10.0);
        vec2 ipos = floor(st); // Integer grid cell ID
        
        // Deterministic hash based on cell ID and global seed
        float h = hash(ipos + u_seed + f_i * 0.5);
        
        // step creates a hard threshold: only the top 2% of hash values become stars
        // twinkled via sine function modulated by layer speed
        float star = step(0.98, h) * (sin(u_time * (1.0 + f_i * 0.2) + h * 10.0) * 0.5 + 0.5);
        
        // Add star contribution to final vector with inverse-square-like attenuation
        col += star * u_palette[4] * weight * (1.0 / (1.0 + f_i));
    }
    
    // Background Arc: Simulates a planetary or galactic horizon using a sine-distorted center line
    float arc = smoothstep(0.01, 0.0, abs(uv.y - 0.5 + 0.2 * sin(uv.x * 6.28 + u_time)));
    col += arc * u_palette[0] * 0.5;
    
    return col;
}`,
  RAYMARCH: `/**
 * Renders a scene using raymarching technology.
 * Simulates volumetric merging of two animated spheres.
 */
vec3 render(vec2 uv) {
    // Center UV and normalize to [-1, 1] range
    vec2 p = (uv - 0.5) * 2.0;
    
    // Define Ray Origin and Direction for perspective projection
    vec3 ro = vec3(0, 0, -3.0);
    vec3 rd = normalize(vec3(p, 1.5));
    
    // Scene rotation logic based on time and seed
    float a = u_time * 0.3 + u_seed;
    mat2 rot = mat2(cos(a), -sin(a), sin(a), cos(a)); // Z-axis rotation matrix
    rd.xz *= rot;
    ro.xz *= rot;
    
    float t = 0.0; // Global step distance
    
    // Main Raymarching Loop: Iterate to find distance field intersection
    for(int i = 0; i < 80; i++) {
        vec3 pos = ro + rd * t;
        
        // Sphere SDFs (Signed Distance Functions)
        // pos.x is modulated by time for oscillation
        float s1 = sdSphere(pos - vec3(sin(u_time)*0.5, 0, 0), 0.5 + u_complexity * 0.02);
        float s2 = sdSphere(pos + vec3(sin(u_time*0.8)*0.5, 0, 0), 0.4);
        
        // Smooth Minimum (Metaball merge) calculation
        float d = smin(s1, s2, 0.4);
        
        // Break if we hit a surface (d close to zero) or go beyond view distance
        if(d < 0.001 || t > 10.0) break;
        t += d;
    }
    
    // Surface Shading Logic
    if(t < 10.0) {
        vec3 pos = ro + rd * t;
        vec2 e = vec2(0.01, 0); // Epsilon for gradient calculation
        
        // Calculate Normal vector using central differences (numerical gradient)
        vec3 n = normalize(vec3(
            sdSphere(pos + e.xyy, 0.5) - sdSphere(pos - e.xyy, 0.5),
            sdSphere(pos + e.yxy, 0.5) - sdSphere(pos - e.yxy, 0.5),
            sdSphere(pos + e.yyx, 0.5) - sdSphere(pos - e.yyx, 0.5)
        ));
        
        // Lighting: Lambertian Diffuse calculate
        float diff = max(dot(n, normalize(vec3(1, 1, -1))), 0.0);
        
        // Shlick's Approximation like Fresnel effect
        float Fresnel = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
        
        // Blend palette colors based on lighting intensity
        vec3 col = mix(u_palette[0], u_palette[1], diff);
        return col + Fresnel * u_palette[2];
    }
    
    // Return background color for misses
    return vec3(0.02, 0.02, 0.05);
}`,
  MORPH_SCENE: `float scene(vec3 p) {
    float d1 = sdSphere(p - vec3(0, sin(u_time)*0.5, 0), 1.0);
    vec3 bp = p - vec3(cos(u_time)*2.0, 0, sin(u_time)*2.0);
    float d2 = sdBox(bp, vec3(0.6 + u_complexity * 0.1));
    return smin(d1, d2, 0.5);
}
vec3 render(vec2 uv) {
    vec2 p = (uv - 0.5) * 2.0;
    vec3 ro = vec3(0, 2.0, -5.0);
    vec3 rd = normalize(vec3(p, 2.0));
    float rot = u_time * 0.2 + u_seed * 0.1;
    mat2 m = mat2(cos(rot), -sin(rot), sin(rot), cos(rot));
    ro.xz *= m;
    rd.xz *= m;
    float t = 0.0;
    for(int i = 0; i < 80; i++) {
        float d = scene(ro + rd * t);
        if(d < 0.001 || t > 20.0) break;
        t += d;
    }
    if(t < 20.0) {
        vec3 pos = ro + rd * t;
        vec2 e = vec2(0.001, 0);
        vec3 n = normalize(vec3(
            scene(pos + e.xyy) - scene(pos - e.xyy),
            scene(pos + e.yxy) - scene(pos - e.yxy),
            scene(pos + e.yyx) - scene(pos - e.yyx)
        ));
        float diff = max(dot(n, normalize(vec3(1, 2, -1))), 0.0);
        return mix(u_palette[0], u_palette[1], diff) + pow(diff, 32.0) * 0.5;
    }
    return u_palette[3] * (1.0 - length(uv - 0.5));
}`,
  CYBER_GRID: `/**
 * Renders an infinite neon perspective grid.
 * Employs coordinate transformation to simulate 3D projection.
 */
vec3 render(vec2 uv) {
    // Transform to centered coords
    vec2 p = (uv - 0.5) * 2.0;
    
    // Calculate perspective depth (vanishing point logic)
    float perspective = 1.0 / (0.1 + abs(p.y));
    
    // Projects local coordinates into an infinite plane
    // X is widened by distance, Y is moved by time
    vec2 st = vec2(p.x * perspective, perspective + u_time * 2.0);
    
    // Procedural grid lines using fract and screen-space derivatives (fwidth)
    // dFdx/dFdy are used implicitly via fwidth to maintain constant line thickness in perspective
    vec2 grid = abs(fract(st - 0.5) - 0.5) / fwidth(st);
    float line = min(grid.x, grid.y);
    
    // Threshold grid lines for pixel sharp neon look
    float color_mask = 1.0 - smoothstep(0.0, 0.5, line);
    
    // Modulate intensity with an oscillating pulse
    float pulse = sin(u_time * 4.0 + u_seed) * 0.5 + 0.5;
    
    // Combine base grid and horizon ambient glow
    vec3 col = mix(vec3(0.0), u_palette[1], color_mask * pulse);
    col += u_palette[2] * exp(-abs(p.y) * 10.0); // Atmospheric falloff at horizon
    
    // Apply radial vignetting
    return col * (1.0 - length(p) * 0.3);
}`,
  PLASMA_FIELD: `/**
 * Volumetric plasma simulation using sinusoidal interference.
 */
vec3 render(vec2 uv) {
    // Zoom out for wider field coverage
    vec2 p = (uv - 0.5) * 6.0;
    float t = u_time * 1.5;
    
    // Primary interference waves (Vertical, Horizontal, Diagonal)
    float v = sin(p.x + t);
    v += sin((p.y + t) / 2.0);
    v += sin((p.x + p.y + t) / 2.0);
    
    // Secondary displacement and radial interference
    p += vec2(sin(t / 3.0), cos(t / 2.0));
    v += sin(sqrt(dot(p, p) + 1.0) + t);
    
    // Map wave density to a cyclic color palette for liquid look
    vec3 col = cosPalette(v * 0.5 + u_seed, u_palette[0], u_palette[1], u_palette[2], u_palette[3]);
    
    // Adjust luminance based on complexity uniform
    return col * u_complexity * 0.2;
}`,
  FRACTAL_PYRAMID: `vec3 render(vec2 uv) {
    vec2 p = (uv - 0.5) * 2.0;
    vec3 ro = vec3(0, 0, -3.5);
    vec3 rd = normalize(vec3(p, 2.0));
    float a = u_time * 0.2;
    mat2 rot = mat2(cos(a), -sin(a), sin(a), cos(a));
    ro.xz *= rot; rd.xz *= rot;
    ro.xy *= rot; rd.xy *= rot;
    float t = 0.0;
    for(int i = 0; i < 64; i++) {
        vec3 pos = ro + rd * t;
        float s = 1.5;
        for(int j = 0; j < 4; j++) {
            pos = abs(pos) - 0.5;
            if (pos.x < pos.y) pos.xy = pos.yx;
            if (pos.x < pos.z) pos.xz = pos.zx;
            if (pos.y < pos.z) pos.yz = pos.zy;
            pos = pos * 2.0 - 1.0;
            s *= 2.0;
        }
        float d = length(pos) / s;
        if(d < 0.001 || t > 10.0) break;
        t += d;
    }
    return t < 10.0 ? mix(u_palette[0], u_palette[4], 1.0 - exp(-t*0.5)) : vec3(0.01);
}`,
  VORTEX_NEBULA: `vec3 render(vec2 uv) {
    vec2 p = (uv - 0.5) * 2.0;
    float r = length(p);
    float angle = atan(p.y, p.x) + r * sin(u_time * 0.2) * 5.0;
    vec2 st = vec2(r, angle * 0.5);
    float n = fbm(st * 3.0 + u_time * 0.1, int(u_complexity));
    vec3 col = mix(u_palette[1], u_palette[2], n);
    col *= smoothstep(0.8, 0.2, r);
    col += u_palette[3] * pow(n, 4.0) * 2.0;
    return col;
}`,
  LIQUID_METALS: `vec3 render(vec2 uv) {
    vec2 p = (uv - 0.5) * 3.0;
    for(int i = 1; i < 4; i++) {
        p.x += 0.3 / float(i) * sin(float(i) * 3.0 * p.y + u_time + u_seed);
        p.y += 0.3 / float(i) * cos(float(i) * 3.0 * p.x + u_time);
    }
    float r = cos(p.x + p.y + 1.0) * 0.5 + 0.5;
    vec3 col = mix(u_palette[0], u_palette[4], r);
    return col + pow(r, 8.0) * 0.5;
}`,
  NEON_WAVES: `vec3 render(vec2 uv) {
    vec3 col = vec3(0);
    vec2 p = (uv - 0.5) * 2.0;
    for(float i = 0.0; i < 4.0; i++) {
        if(i >= u_complexity) break;
        p = fract(p * 1.5) - 0.5;
        float d = length(p) * exp(-length(uv - 0.5));
        vec3 c = cosPalette(u_time * 0.1 + i * 0.4, u_palette[0], u_palette[1], u_palette[2], u_palette[3]);
        d = sin(d * 8.0 + u_time) / 8.0;
        d = abs(d);
        d = 0.02 / d;
        col += c * d;
    }
    return col;
}`,
  FIRE_STORM: `vec3 render(vec2 uv) {
    vec2 p = (uv - 0.5) * 2.0;
    p.y -= u_time * 0.5;
    float n = fbm(p * 3.0, int(u_complexity));
    float fire = smoothstep(0.2, 0.8, n - abs(uv.x - 0.5));
    vec3 col = mix(u_palette[0], u_palette[4], fire);
    col += u_palette[1] * pow(fire, 2.0) * 3.0;
    return col * exp(-abs(uv.y - 0.5) * 2.0);
}`,
  DIGITAL_RAIN: `float char(vec2 st, float n) {
    vec2 p = fract(st);
    float h = hash12(floor(st) + n);
    if(h > 0.2) return 0.0;
    return step(0.5, hash12(floor(st*4.0) + h));
}
vec3 render(vec2 uv) {
    vec2 st = uv * vec2(40.0, 15.0);
    float offset = hash11(floor(st.x)) * 10.0;
    float speed = 2.0 + hash11(floor(st.x)) * 3.0;
    float rain = fract(st.y / 15.0 + u_time * speed * 0.1 + offset);
    float glyph = char(st * vec2(1.0, 4.0), floor(u_time * 10.0));
    vec3 col = u_palette[1] * glyph * (1.0 / (0.01 + rain));
    return col * smoothstep(0.0, 0.1, rain);
}`,
  DISCO_BALL: `vec3 render(vec2 uv) {
    vec2 p = (uv - 0.5) * 2.0;
    float r = length(p);
    if(r > 0.8) return vec3(0.01);
    float z = sqrt(0.64 - r*r);
    vec3 n = normalize(vec3(p, z));
    float a = u_time * 0.5;
    mat2 rot = mat2(cos(a), -sin(a), sin(a), cos(a));
    n.xz *= rot;
    vec3 fn = floor(n * 10.0) / 10.0;
    float light = max(dot(fn, normalize(vec3(1, 1, 2))), 0.0);
    float spec = pow(light, 16.0) * u_complexity;
    return mix(u_palette[0], u_palette[2], light) + spec * u_palette[4];
}`,
  VOLUMETRIC_CORE: `uniform float u_rotation;
float map(vec3 p) {
    float a = u_time * 0.2 + u_rotation + u_seed;
    mat2 rotV = mat2(cos(a), -sin(a), sin(a), cos(a));
    vec3 p1 = p;
    p1.xz *= rotV; p1.yz *= rotV;
    float core = sdOctahedron(p1, 0.6);
    float rings = 1e10;
    float n = floor(u_complexity);
    for(float i = 0.0; i < 8.0; i++) {
        if(i >= n) break;
        vec3 p2 = p;
        float r_a = u_time * (0.3 + i * 0.1) + i * 0.5 + u_rotation;
        mat2 r_m = mat2(cos(r_a), -sin(r_a), sin(r_a), cos(r_a));
        if(mod(i, 2.0) == 0.0) p2.xy *= r_m; else p2.yz *= r_m;
        float torus = sdTorus(p2, vec2(1.2 + i * 0.2, 0.05));
        rings = min(rings, torus);
    }
    return smin(core, rings, 0.2);
}
vec3 render(vec2 uv) {
    vec2 p = (uv - 0.5) * 2.0;
    vec3 ro = vec3(0, 0, -5.0);
    vec3 rd = normalize(vec3(p, 2.5));
    float t = 0.0;
    for(int i = 0; i < 100; i++) {
        float d = map(ro + rd * t);
        if(d < 0.001 || t > 20.0) break;
        t += d;
    }
    if(t < 20.0) {
        vec3 pos = ro + rd * t;
        vec2 e = vec2(0.001, 0);
        vec3 n = normalize(vec3(
            map(pos + e.xyy) - map(pos - e.xyy),
            map(pos + e.yxy) - map(pos - e.yxy),
            map(pos + e.yyx) - map(pos - e.yyx)
        ));
        float diff = max(dot(n, normalize(vec3(1, 2, -1))), 0.0);
        float spec = pow(max(dot(reflect(rd, n), normalize(vec3(1, 2, -1))), 0.0), 32.0);
        vec3 col = mix(u_palette[0], u_palette[2], n.y * 0.5 + 0.5);
        col *= diff; col += spec * u_palette[4];
        col += pow(1.0 - max(dot(n, -rd), 0.0), 4.0) * u_palette[1];
        return col;
    }
    return u_palette[3] * 0.2 * (1.0 - length(uv - 0.5));
}`,
  BENDING_SPACE: `float scene(vec3 p) {
    p = opRepeat(p, vec3(4.0));
    p = opTwist(p, sin(u_time) * 0.5);
    p = opCheapBend(p, cos(u_time * 0.5) * 0.2);
    for(int i=0; i<3; i++) {
        p = abs(p) - 0.5;
        p.xy = rotate(p.xy, u_time * 0.1);
    }
    float d1 = sdBox(p, vec3(0.4));
    float d2 = sdCylinder(p, vec2(0.3, 0.8));
    return smin(d1, d2, 0.2);
}
vec3 render(vec2 uv) {
    vec2 p = (uv - 0.5) * 2.0;
    vec3 ro = vec3(0, 0, -3.0);
    vec3 rd = normalize(vec3(p, 1.5));
    float t = 0.0;
    for(int i = 0; i < 70; i++) {
        float d = scene(ro + rd * t);
        if(d < 0.001 || t > 15.0) break;
        t += d;
    }
    if(t < 15.0) {
        vec3 pos = ro + rd * t;
        vec2 e = vec2(0.001, 0);
        vec3 n = normalize(vec3(
            scene(pos + e.xyy) - scene(pos - e.xyy),
            scene(pos + e.yxy) - scene(pos - e.yxy),
            scene(pos + e.yyx) - scene(pos - e.yyx)
        ));
        float diff = max(dot(n, normalize(vec3(1, 1, -1))), 0.0);
        vec3 col = mix(u_palette[1], u_palette[2], n.x * 0.5 + 0.5);
        return col * diff + pow(diff, 64.0) * 0.4;
    }
    return u_palette[0] * 0.1;
}`,
  GLITCH_CORE: `uniform bool u_glitch;
uniform vec3 u_glitch_color; // @color
float map(vec3 p) {
    if(u_glitch) {
        p.x += sin(p.y * 10.0 + u_time * 20.0) * 0.1;
        p.z += cos(p.x * 10.0 + u_time * 20.0) * 0.1;
    }
    vec3 p1 = p;
    p1.xz = rotate(p1.xz, u_time * 0.5);
    float d1 = sdOctahedron(p1, 0.8);
    float d2 = sdSphere(p, 0.6 + sin(u_time) * 0.2);
    return smin(d1, d2, 0.3);
}
vec3 render(vec2 uv) {
    vec2 p = (uv - 0.5) * 2.0;
    vec3 ro = vec3(0, 0, -3.0);
    vec3 rd = normalize(vec3(p, 1.5));
    float t = 0.0;
    for(int i = 0; i < 64; i++) {
        float d = map(ro + rd * t);
        if(d < 0.001 || t > 10.0) break;
        t += d;
    }
    if(t < 10.0) {
        vec3 pos = ro + rd * t;
        vec2 e = vec2(0.001, 0);
        vec3 n = normalize(vec3(
            map(pos + e.xyy) - map(pos - e.xyy),
            map(pos + e.yxy) - map(pos - e.yxy),
            map(pos + e.yyx) - map(pos - e.yyx)
        ));
        float diff = max(dot(n, normalize(vec3(1, 2, -1))), 0.0);
        vec3 col = mix(u_palette[0], u_palette[1], diff);
        if(u_glitch && fract(u_time * 10.0) > 0.5) col = mix(col, u_glitch_color, 0.5);
        return col;
    }
    return vec3(0.0);
}`,
  NORMAL_VIZ: `vec3 render(vec2 uv) {
    return vNormal * 0.5 + 0.5;
}`,
  MANDELBULB: `uniform float u_power; // @float
uniform float u_zoom; // @float
uniform vec3 u_bulb_color; // @color
uniform vec3 u_offset; // @vec3
uniform float u_iter; // @float

float map(vec3 p) {
    p /= (u_zoom + 0.1);
    p += u_offset;
    p.xz = rotate(p.xz, u_time * 0.1 + u_seed);
    p.yz = rotate(p.yz, u_time * 0.05);
    return sdMandelbulb(p, u_power);
}

vec3 render(vec2 uv) {
    vec2 p = (uv - 0.5) * 2.0;
    vec3 rd = (u_cam_matrix * vec4(normalize(vec3(p, 1.2)), 0.0)).xyz;
    vec3 ro = u_camera_pos;
    
    float t = 0.0;
    int it = 0;
    int max_it = int(u_iter * 20.0 + 40.0);
    
    for(int i = 0; i < 150; i++) {
        if(i >= max_it) break;
        it = i;
        float d = map(ro + rd * t);
        if(d < 0.0002 || t > 20.0) break;
        t += d;
    }
    
    if(t < 20.0) {
        vec3 pos = ro + rd * t;
        vec2 e = vec2(0.0005, 0);
        vec3 n = normalize(vec3(
            map(pos + e.xyy) - map(pos - e.xyy),
            map(pos + e.yxy) - map(pos - e.yxy),
            map(pos + e.yyx) - map(pos - e.yyx)
        ));
        
        float occ = 1.0 - float(it) / float(max_it);
        float diff = max(dot(n, normalize(vec3(1, 2, -1))), 0.0);
        float spec = pow(max(dot(reflect(rd, n), normalize(vec3(1, 2, -1))), 0.0), 32.0);
        
        vec3 col = mix(u_bulb_color, u_palette[0], pos.y * 0.5 + 0.5);
        return col * (diff * occ + 0.1) + spec * 0.5;
    }
    
    return mix(u_palette[4] * 0.05, vec3(0), length(p));
}`,
  REACTION_DIFFUSION: `vec3 render(vec2 uv) {
    vec2 p = uv * 8.0;
    float time = u_time * 0.5;
    float n1 = perlin(p + time);
    float n2 = perlin(p * 2.0 - time * 0.5);
    float n3 = perlin(p * 4.0 + time * 0.2);
    float pattern = perlin(p + n1 * 0.5 + n2 * 0.25);
    pattern = smoothstep(0.4, 0.6, pattern);
    float cells = smoothstep(0.48, 0.52, sin(pattern * 15.0 + u_time));
    vec3 col = mix(u_palette[2], u_palette[3], cells);
    col = mix(col, u_palette[0], pattern);
    return col * (1.0 - length(uv - 0.5));
}`,
  NEBULA_CLOUD: `vec3 render(vec2 uv) {
    vec2 p = (uv - 0.5) * 2.0;
    float d = length(p);
    float n = 0.0;
    float a = 0.5;
    vec2 st = uv * 4.0;
    for(int i = 0; i < 7; i++) {
        n += perlin(st + u_time * 0.05) * a;
        st *= 2.1; a *= 0.5;
    }
    vec3 col = mix(u_palette[0], u_palette[1], n);
    col = mix(col, u_palette[2], pow(n, 3.0));
    float nebula = smoothstep(0.2, 0.8, n);
    col *= nebula;
    float stars = pow(perlin(uv * 50.0), 20.0) * (1.0 - nebula);
    col += stars * u_palette[4];
    return col * exp(-d * d);
}` , 
  BIOLUMINESCENCE: `vec3 render(vec2 uv) {
    vec2 p = (uv - 0.5) * 2.0;
    float d = length(p);
    float n = fbm(p * 2. + u_time * 0.2, 4);
    float pulse = sin(u_time - d * 5.) * 0.5 + 0.5;
    vec3 col = mix(u_palette[0], u_palette[1], n);
    col += u_palette[2] * (1.0 / (0.1 + abs(sin(d * 10.0 - u_time)))) * 0.1;
    return col * pulse * exp(-d);
  }`,
  GRAVITY_WELL: `vec3 render(vec2 uv) {
    vec2 p = (uv - 0.5) * 2.0;
    float r = length(p);
    float force = 1.0 / (r + 0.1);
    vec2 st = p * (1.0 + force * 0.2 * sin(u_time));
    float grid = abs(sin(st.x * 20.0)) * abs(sin(st.y * 20.0));
    grid = smoothstep(0.0, 0.1, grid);
    vec3 col = mix(u_palette[3], u_palette[4], 1.0 - grid);
    col *= exp(-r * 2.0);
    return col + u_palette[0] * (1.0 / (r * 20.0 + 1.0));
  }`,
  DATASCAPE: `vec3 render(vec2 uv) {
    vec2 p = uv * 10.0;
    float h = fbm(p + u_time * 0.1, 6);
    float lines = abs(sin(h * 30.0));
    lines = smoothstep(0.0, 0.1, lines);
    vec3 col = mix(u_palette[1], u_palette[2], h);
    return mix(col, vec3(1.0), (1.0 - lines) * 0.5);
  }`,
  HYPERSPACE: `vec3 render(vec2 uv) {
    vec2 p = (uv - 0.5) * 2.0;
    float t = u_time * 1.5;
    vec3 col = vec3(0);
    for(float i=0.0; i<64.0; i++) {
        float h = hash11(i * 123.456 + u_seed);
        float s = fract(h + t * 0.05);
        float z = 1.0 / (s + 0.01);
        vec2 pos = (p + (hash22(vec2(i)) - 0.5) * 2.0) * z;
        float star = smoothstep(0.1, 0.0, length(pos));
        col += hsv2rgb(vec3(h * 0.1 + 0.6, 0.4, 1.0)) * star * s;
    }
    return col * (1.0 - length(p) * 0.5);
  }`,
  CAUSTICS: `vec3 render(vec2 uv) {
    vec2 p = uv * 4.0;
    float t = u_time * 0.5;
    vec2 p2 = p;
    for(int i=1; i<5; i++) {
        p2.x += 0.3 / float(i) * sin(float(i) * 3.0 * p2.y + t + u_seed);
        p2.y += 0.3 / float(i) * cos(float(i) * 3.0 * p2.x + t);
    }
    float r = cos(p2.x + p2.y + 1.0) * 0.5 + 0.5;
    vec3 col = mix(u_palette[1], u_palette[2], r);
    col += pow(r, 10.0) * 0.8;
    return col * (0.5 + 0.5 * sin(uv.y * 10.0 + t));
  }`,
  FRACTAL_FLAME: `vec3 render(vec2 uv) {
    vec2 p = (uv - 0.5) * 2.0;
    float t = u_time * 0.8;
    float strength = 0.0;
    vec2 st = p;
    for(int i=0; i<8; i++) {
        st = abs(st) / dot(st,st) - 0.7;
        st = rotate(st, t * 0.1 + float(i));
        strength += exp(-length(st) * 3.0);
    }
    vec3 col = cosPalette(strength * 0.1 + u_seed, u_palette[0], u_palette[1], u_palette[2], u_palette[3]);
    return col * strength * 0.15;
  }`,
  SONIC_TEMPEST: `uniform float u_audio_low; // @float
uniform float u_audio_mid; // @float
uniform float u_audio_high; // @float
uniform float u_audio_volume; // @float

vec3 render(vec2 uv) {
    vec2 p = (uv - 0.5) * 2.0;
    float dist = length(p);
    float angle = atan(p.y, p.x);
    
    float low = u_audio_low * 0.5;
    float mid = u_audio_mid * 0.5;
    float high = u_audio_high * 0.5;
    
    float wave = sin(angle * 10.0 + u_time * 2.0) * low;
    wave += sin(angle * 20.0 - u_time * 5.0) * mid * 0.5;
    
    float circle = smoothstep(0.5 + wave, 0.48 + wave, dist);
    float pulse = smoothstep(0.1, 0.0, abs(dist - (0.6 + high * 0.2)));
    
    vec3 col = mix(u_palette[0], u_palette[1], dist + low);
    col = mix(col, u_palette[2], circle);
    col += u_palette[3] * pulse * 2.0;
    
    return col * (1.0 - dist * 0.5);
  }`
};

export const EXAMPLES = {
  BASIC_NOISE: `/**
 * EXAMPLE: Basic Value Noise
 * This shader demonstrates how to generate and layer 2D value noise.
 * Useful for clouds, water, or organic textures.
 */
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    // Quintic interpolation for smoother gradients
    f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x),
               mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}

vec3 render(vec2 uv) {
    // Zoom in on the noise
    vec2 p = uv * 4.0;
    
    // Layer 1: Base low frequency noise
    float n = noise(p + u_time * 0.1);
    
    // Layer 2: Higher frequency detail
    n += noise(p * 2.1 + u_time * 0.2) * 0.5;
    
    // Layer 3: Finer details
    n += noise(p * 4.3 - u_time * 0.1) * 0.25;
    
    // Normalize result back to roughly [0, 1]
    n /= 1.75;
    
    // Colorize using the palette
    return mix(u_palette[0], u_palette[1], n);
}`,
  SIMPLE_LIGHTING: `/**
 * EXAMPLE: Simple Lambertian Lighting
 * Demonstrates basic 3D raymarching with a single light source.
 */
float sdSphere(vec3 p, float s) {
    return length(p) - s;
}

float map(vec3 p) {
    // Sphere at origin with radius 0.5
    return sdSphere(p, 0.5);
}

vec3 render(vec2 uv) {
    // Setup camera
    vec2 p = (uv - 0.5) * 2.0;
    vec3 ro = vec3(0, 0, -2); // Ray origin
    vec3 rd = normalize(vec3(p, 1.5)); // Ray direction
    
    // Raymarch
    float t = 0.0;
    for(int i = 0; i < 40; i++) {
        float d = map(ro + rd * t);
        if(d < 0.001 || t > 5.0) break;
        t += d;
    }
    
    if(t < 5.0) {
        vec3 pos = ro + rd * t;
        // Simple normal estimation
        vec2 e = vec2(0.01, 0);
        vec3 n = normalize(vec3(
            map(pos + e.xyy) - map(pos - e.xyy),
            map(pos + e.yxy) - map(pos - e.yxy),
            map(pos + e.yyx) - map(pos - e.yyx)
        ));
        
        // Basic Light position (top right)
        vec3 lightPos = normalize(vec3(1.0, 1.0, -1.0));
        float diff = max(dot(n, lightPos), 0.0);
        
        // Ambient light
        float amb = 0.1;
        
        return u_palette[2] * (diff + amb);
    }
    
    // Background color
    return vec3(0.05);
}`,
  COORDINATE_TRANSFORMS: `/**
 * EXAMPLE: Coordinate Transformations
 * This shader shows how to rotate, scale, and repeat space.
 */
vec2 rotate(vec2 p, float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, -s, s, c) * p;
}

vec3 render(vec2 uv) {
    // 1. Center and Scale
    vec2 p = (uv - 0.5) * 2.0;
    
    // 2. Continuous Rotation around center
    p = rotate(p, u_time * 0.5);
    
    // 3. Grid-based repetition (fractal-like)
    float grid = 4.0;
    p = fract(p * grid) - 0.5;
    
    // 4. Individual cell rotation
    p = rotate(p, u_time * 2.0 + u_seed);
    
    // Draw a box inside each cell
    float d = max(abs(p.x), abs(p.y));
    float mask = smoothstep(0.2, 0.21, d);
    
    // Colorize
    vec3 col = mix(u_palette[0], u_palette[1], mask);
    
    // Add a circular vignette overlay
    col *= (1.0 - length(uv - 0.5) * 1.5);
    
    return col;
}`
};

export const PRESET_DESCRIPTIONS = {
  MANDALA: 'Radial bands and cosine waves',
  AURORA: 'Perlin noise field with atmospheric effects',
  STARFIELD: 'Great-circle arcs and stochastic particles',
  RAYMARCH: '3D signed distance field box',
  MORPH_SCENE: 'Organic morphing 3D shapes',
  CYBER_GRID: 'Neon perspective grid with pulse',
  PLASMA_FIELD: 'Ethereal undulating color fields',
  FRACTAL_PYRAMID: 'Recursive 3D geometry exploration',
  VORTEX_NEBULA: 'Gaseous spiral noise distribution',
  LIQUID_METALS: 'Refractive flowing chrome',
  NEON_WAVES: 'Iterative space-folding energy lines',
  FIRE_STORM: 'Volumetric turbulence and heat',
  DIGITAL_RAIN: 'Steaming procedural glyph cascades',
  DISCO_BALL: 'Facet-reflected raytraced sphere',
  VOLUMETRIC_CORE: 'Multi-primitive geometric construct',
  BENDING_SPACE: 'Space-folding twisted repetition',
  GLITCH_CORE: 'Interactive volumetric distortion',
  NORMAL_VIZ: 'Mesh surface normal visualization',
  MANDELBULB: '3D fractal distance estimation',
  REACTION_DIFFUSION: 'Procedural cellular pattern growth',
  NEBULA_CLOUD: 'Volumetric gaseous noise fields',
  BIOLUMINESCENCE: 'Organic glowing pulse fields',
  GRAVITY_WELL: 'Spacetime curvature visualization',
  DATASCAPE: 'Procedural digital terrain topology',
  HYPERSPACE: 'Warp-speed star streak visualization',
  CAUSTICS: 'Underwater light refraction patterns',
  FRACTAL_FLAME: 'Iterative energy field simulation',
  SONIC_TEMPEST: 'Biometric audio-reactive spectral storm'
};

export const EXAMPLE_DESCRIPTIONS = {
  BASIC_NOISE: 'Demonstrates 2D value noise accumulation',
  SIMPLE_LIGHTING: 'Basic Lambertian diffuse lighting on a sphere',
  COORDINATE_TRANSFORMS: 'Rotating and scaling coordinates over time'
};
