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
   * Today's sky: liquid dawn. Warm light folded through itself (noise warped
   * by noise), so ribbons of cream, coral and saffron slide over one another
   * like ink in water. A touch deeper at the top so white type reads; melts
   * into the page at the bottom. c0 deep, c1 body, c2 light, c3 the page.
   */
  silk: `
vec4 effect(vec2 uv, float aspect, float t) {
  vec2 p = vec2(uv.x * aspect, uv.y) * 1.15;
  float s = t * 0.08;
  vec2 q = vec2(fbm(vec3(p, s)), fbm(vec3(p + vec2(5.2, 1.3), s)));
  vec2 r = vec2(fbm(vec3(p + 3.2 * q + vec2(1.7, 9.2), s * 1.3)),
                fbm(vec3(p + 3.2 * q + vec2(8.3, 2.8), s * 1.3)));
  // fbm sits near its middle; stretch it so every ribbon gets its turn.
  float f = smoothstep(0.28, 0.72, fbm(vec3(p + 2.6 * r, s * 0.7)));
  // Ribbons: the ramp runs deep, saffron, coral, cream.
  vec3 coral = mix(c1, vec3(1.0, 0.62, 0.55), 0.55);
  vec3 cream = mix(c2, vec3(1.0, 0.97, 0.92), 0.5);
  vec3 ramp = mix(c0, c1, smoothstep(0.0, 0.3, f));
  ramp = mix(ramp, coral, smoothstep(0.3, 0.5, f) * 0.8);
  ramp = mix(ramp, c2, smoothstep(0.45, 0.72, f));
  ramp = mix(ramp, cream, smoothstep(0.7, 0.95, f) * 0.85);
  // A steady warm sky underneath, saffron above and peach below, so the
  // ribbons never wash the type out or sink it into shadow.
  vec3 base = mix(c2, mix(c0, c1, 0.75), smoothstep(0.15, 0.95, uv.y));
  vec3 col = mix(base, ramp, 0.6);
  // The folds catch light where the warp bends hardest.
  col += vec3(1.0, 0.85, 0.7) * smoothstep(0.55, 0.9, length(r - q)) * 0.06;
  // Fine grain so the gradients never band.
  col += (hash3(vec3(uv * 900.0, 1.0)) - 0.5) * 0.02;
  float page = 1.0 - smoothstep(0.04, 0.32, uv.y);
  // Through warm light into the page, never through grey.
  col = mix(col, c2, smoothstep(0.0, 0.6, page) * 0.45);
  return vec4(mix(col, c3, smoothstep(0.35, 1.0, page)), 1.0);
}
`,

  /**
   * A full-screen haze: three soft pools of colour drifting through each
   * other, their edges bent by slow noise, fading to dark at the foot of
   * the screen. Grain keeps it from banding. c0 dark, c1 ember, c2 body,
   * c3 the brightest light.
   */
  mist: `
vec4 effect(vec2 uv, float aspect, float t) {
  vec2 p = vec2(uv.x * aspect, uv.y);
  vec2 w = vec2(fbm(vec3(p * 1.1, t * 0.03)), fbm(vec3(p * 1.1 + 7.3, t * 0.03)));
  vec2 q = p + (w - 0.5) * 0.5;
  vec2 a = vec2(aspect * (0.55 + 0.18 * sin(t * 0.07)), 0.62 + 0.08 * cos(t * 0.05));
  vec2 b = vec2(aspect * (0.22 + 0.1 * cos(t * 0.06)), 0.86 + 0.05 * sin(t * 0.08));
  vec2 c = vec2(aspect * (0.85 + 0.08 * sin(t * 0.04)), 0.38 + 0.1 * sin(t * 0.06));
  float pa = exp(-dot(q - a, q - a) * 5.0);
  float pb = exp(-dot(q - b, q - b) * 7.0);
  float pc = exp(-dot(q - c, q - c) * 6.0);
  vec3 col = c0;
  col = mix(col, c1, clamp(pa * 0.9 + pc * 0.7, 0.0, 1.0));
  col = mix(col, c2, clamp(pa * pa * 0.85 + pb * 0.55, 0.0, 1.0));
  col = mix(col, c3, clamp(pb * pb * 0.35, 0.0, 1.0));
  // Dark at the foot, where the list runs on.
  col *= mix(0.45, 1.0, smoothstep(0.0, 0.65, uv.y));
  col += (hash3(vec3(uv * 900.0, 3.0)) - 0.5) * 0.02;
  return vec4(col, 1.0);
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
