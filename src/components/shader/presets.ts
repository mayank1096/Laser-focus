/**
 * GPU shader looks, each a GLSL body defining
 * `vec4 effect(vec2 uv, float aspect, float t)` that returns a
 * premultiplied colour. `uv` runs 0–1 with y pointing up, `t` is seconds.
 * Up to four colours arrive as uniforms c0–c3. The same body is wrapped for
 * Skia on the phone and WebGL in the browser preview.
 */

/** Value noise and fractal noise shared by every preset. */
export const COMMON = `
float hash3(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float vnoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  float a = mix(mix(hash3(i), hash3(i + vec3(1.0, 0.0, 0.0)), f.x),
                mix(hash3(i + vec3(0.0, 1.0, 0.0)), hash3(i + vec3(1.0, 1.0, 0.0)), f.x), f.y);
  float b = mix(mix(hash3(i + vec3(0.0, 0.0, 1.0)), hash3(i + vec3(1.0, 0.0, 1.0)), f.x),
                mix(hash3(i + vec3(0.0, 1.0, 1.0)), hash3(i + vec3(1.0, 1.0, 1.0)), f.x), f.y);
  return mix(a, b, f.z) * 2.0 - 1.0;
}

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += vnoise(p) * a;
    p = p * 2.03 + vec3(1.7, 9.2, 3.1);
    a *= 0.5;
  }
  return v * 0.5 + 0.5;
}
`;

export const PRESETS = {
  /**
   * Today's sky: saffron silk. A sheet of cloth whose folds drift slowly,
   * bent by noise, lit from the upper left so each ridge catches a soft
   * sheen. Darker at the top so white type reads; melts into the page at
   * the bottom. c0 deep, c1 body, c2 light, c3 the page.
   */
  silk: `
float folds(vec2 p, float t) {
  // Smooth sine warps only: noise would mottle the cloth.
  vec2 q = p;
  for (int i = 1; i < 5; i++) {
    float k = float(i);
    q += vec2(sin(k * 0.9 * q.y + t * 0.11 + k * 1.3),
              cos(k * 0.7 * q.x + t * 0.08 + k * 2.1)) * (0.55 / k);
  }
  return sin(q.x * 1.1 + q.y * 0.8);
}

vec4 effect(vec2 uv, float aspect, float t) {
  vec2 p = vec2(uv.x * aspect, uv.y) * 3.2;
  float e = 0.01;
  float h = folds(p, t);
  float hx = folds(p + vec2(e, 0.0), t);
  float hy = folds(p + vec2(0.0, e), t);
  vec3 n = normalize(vec3((h - hx) / e * 0.45, (h - hy) / e * 0.45, 1.0));
  vec3 l = normalize(vec3(-0.5, 0.55, 0.65));
  float diff = clamp(dot(n, l), 0.0, 1.0);
  float sheen = pow(clamp(dot(reflect(-l, n), vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 10.0);
  vec3 col = mix(c0, c1, smoothstep(0.2, 0.9, diff));
  col = mix(col, c2, sheen * 0.4);
  // Deeper towards the top, where the type sits on it.
  col *= mix(1.0, 0.85, smoothstep(0.5, 1.0, uv.y));
  // Fine grain so the gradients never band.
  col += (hash3(vec3(uv * 900.0, 1.0)) - 0.5) * 0.012;
  float page = 1.0 - smoothstep(0.04, 0.3, uv.y);
  // Through warm light into the page, never through grey.
  col = mix(col, c2, smoothstep(0.0, 0.6, page) * 0.4);
  return vec4(mix(col, c3, smoothstep(0.35, 1.0, page)), 1.0);
}
`,

  /**
   * A deep saffron field that churns slowly while its light rises and sinks
   * from the bottom like a tide. c0 deep, c1 warm, c2 glow, c3 pale.
   */
  ember: `
vec4 effect(vec2 uv, float aspect, float t) {
  vec2 p = vec2(uv.x * aspect, uv.y);
  float flow = fbm(vec3(p * 1.3, t * 0.05));
  float grain = fbm(vec3(p * 2.4 + 5.0, t * 0.08));
  // The tide line rises and sinks once every ten seconds or so.
  float tide = 0.4 + 0.09 * sin(t * 0.6);
  float h = uv.y + (flow - 0.5) * 0.42;
  float light = 1.0 - smoothstep(tide - 0.38, tide + 0.28, h);
  vec3 col = mix(c0, c1, smoothstep(0.25, 0.85, grain) * 0.8);
  col = mix(col, c2, light * 0.85);
  col = mix(col, c3, pow(light, 2.2) * 0.92);
  return vec4(col, 1.0);
}
`,

  /**
   * A soft round glow whose edge breathes and ripples with noise, like light
   * through warm air. Fades fully to clear at the rim. c0 rim, c1 body,
   * c2 core.
   */
  glow: `
vec4 effect(vec2 uv, float aspect, float t) {
  vec2 d = (uv - 0.5) * 2.0;
  d.x *= aspect;
  float r = length(d);
  float ang = atan(d.y, d.x);
  float n = fbm(vec3(cos(ang) * 1.4, sin(ang) * 1.4, t * 0.18));
  float rr = r * (1.0 + (n - 0.5) * 0.35);
  float body = exp(-rr * rr * 3.2);
  float core = exp(-rr * rr * 11.0);
  vec3 col = mix(c0, c1, smoothstep(0.0, 0.6, body));
  col = mix(col, c2, core);
  float a = clamp(body * 0.95, 0.0, 1.0) * (1.0 - smoothstep(0.82, 1.0, r));
  return vec4(col * a, a);
}
`,

  /**
   * Four colours flowing sideways through each other, bent by noise so the
   * bands never line up. c0–c3 are the four hues, cycled.
   */
  hues: `
vec4 effect(vec2 uv, float aspect, float t) {
  float n = fbm(vec3(uv.x * aspect * 0.35, uv.y * 0.6, t * 0.12));
  float k = fract(uv.x * 0.55 + n * 0.7 - t * 0.07) * 4.0;
  vec3 col = mix(c0, c1, smoothstep(0.0, 1.0, k));
  col = mix(col, c2, smoothstep(1.0, 2.0, k));
  col = mix(col, c3, smoothstep(2.0, 3.0, k));
  col = mix(col, c0, smoothstep(3.0, 4.0, k));
  return vec4(col, 1.0);
}
`,
} as const;

export type ShaderPreset = keyof typeof PRESETS;

export const skslFor = (preset: ShaderPreset) => `
uniform float2 res;
uniform float time;
uniform vec3 c0;
uniform vec3 c1;
uniform vec3 c2;
uniform vec3 c3;
${COMMON}
${PRESETS[preset]}
half4 main(float2 fc) {
  vec2 uv = vec2(fc.x / res.x, 1.0 - fc.y / res.y);
  return half4(effect(uv, res.x / max(res.y, 1.0), time));
}
`;

export const glslFor = (preset: ShaderPreset) => `
precision highp float;
uniform vec2 res;
uniform float time;
uniform vec3 c0;
uniform vec3 c1;
uniform vec3 c2;
uniform vec3 c3;
${COMMON}
${PRESETS[preset]}
void main() {
  vec2 uv = gl_FragCoord.xy / res;
  gl_FragColor = effect(uv, res.x / max(res.y, 1.0), time);
}
`;

/** '#RRGGBB' → [r, g, b] in 0–1. */
export const rgb = (h: string): [number, number, number] => [
  parseInt(h.slice(1, 3), 16) / 255,
  parseInt(h.slice(3, 5), 16) / 255,
  parseInt(h.slice(5, 7), 16) / 255,
];

/** Pads a colour list to the four uniforms every preset declares. */
export const colourUniforms = (colours: readonly string[] = []) => {
  const list = colours.length ? colours : ['#000000'];
  return [0, 1, 2, 3].map(i => rgb(list[Math.min(i, list.length - 1)]));
};
