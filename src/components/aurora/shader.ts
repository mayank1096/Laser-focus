/**
 * The aurora, ported from the Aurora effect in shader-effects-inc/shaders
 * (MIT, © 2026 Shader Effects Inc.): a wavy line across the sky, a soft
 * curtain hung from it whose height flickers with vertical rays, stacked
 * four times with fading weights and coloured by height. Rewritten as plain
 * GLSL so the same body runs in Skia (SkSL) on the phone and WebGL in the
 * browser preview. Tuned warm: deep saffron at the base, amber in the core,
 * pale apricot at the ray tips, glowing in an ember sky that melts into
 * the page below.
 */

const hex = (h: string) => {
  const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  return `vec3(${c.join(', ')})`;
};

export const AURORA = {
  base: '#FF4E12',
  core: '#FF9A3C',
  tip: '#FFD6A8',
};

/** The sky it hangs in: ember night at the top, a saffron horizon, then the page. */
export const SKY = {
  top: '#260B04',
  mid: '#842B08',
  horizon: '#E0661C',
  page: '#F7F5F4',
};

/**
 * Shared body (needs `vnoise` from the shader presets' common block).
 * Expects `uv` with y pointing up; returns an opaque colour.
 */
export const AURORA_BODY = `
const float CX = 0.5;
const float CY = 0.34;
const float WAV = 0.85;
const float RAYS = 0.6;
const float HEIGHT = 1.05;
const float INTENSITY = 1.2;
const float BALANCE = 1.45;
const float SEED = 7.0;

float hp(float s, float k, float big) {
  return fract(sin(s * k) * big) * 6.2831853;
}

vec2 curtain(vec2 uv, float aspect, float t, float idx, float off) {
  float tS = t * 0.06 + off;
  float ls = SEED + idx * 31.7;
  float wx = (uv.x - CX) * aspect * 2.0;
  float arc = sin(wx * 0.7 + tS * 0.4 + hp(ls, 12.9, 4758.5)) * 0.15
            + sin(wx * 1.6 + tS * 0.65 + hp(ls, 78.2, 2847.1)) * 0.08
            + sin(wx * 2.9 + tS * 0.3 + hp(ls, 41.6, 1593.7)) * 0.04;
  float nw = vnoise(vec3(wx * 0.5, tS * 0.25, ls * 0.1));
  float pathY = CY + arc * WAV + nw * 0.14 * WAV;
  float rays = pow(sin((wx + nw * 2.5) * mix(6.0, 20.0, RAYS) * 0.15
                       + tS * 0.1 + hp(ls, 53.7, 3847.2)) * 0.5 + 0.5, 1.5);
  float top = HEIGHT * mix(0.4, 1.0, rays) * (rays * 0.4 + 0.6);
  float d = uv.y - pathY;
  float env = smoothstep(-0.04, 0.015, d) * (1.0 - smoothstep(0.0, top, d));
  float ct = clamp(d / (top + 0.001), 0.0, 1.0);
  float sb = mix(0.4, 1.0, nw * 0.5 + 0.5);
  float cd = ct - 0.2;
  float cb = exp(cd * cd * -6.0) * 0.3 + 1.0;
  return vec2(ct, env * rays * sb * cb);
}

vec4 aurora(vec2 uv, float aspect, float t) {
  vec2 c0 = curtain(uv, aspect, t, 0.0, 0.0);
  vec2 c1 = curtain(uv, aspect, t, 1.0, 3.1);
  vec2 c2 = curtain(uv, aspect, t, 2.0, 6.7);
  vec2 c3 = curtain(uv, aspect, t, 3.0, 9.4);
  float w1 = c1.y * 0.65;
  float w2 = c2.y * 0.45;
  float w3 = c3.y * 0.3;
  float total = c0.y + w1 + w2 + w3;
  float sum = c0.x * c0.y + c1.x * w1 + c2.x * w2 + c3.x * w3;
  float avg = pow(sum / (total + 0.001), BALANCE);
  vec3 col = mix(mix(${hex(AURORA.base)}, ${hex(
  AURORA.core,
)}, smoothstep(0.0, 0.2, avg)),
                 ${hex(AURORA.tip)}, smoothstep(0.4, 0.85, avg));
  float glow = total * INTENSITY;
  float y = uv.y;
  vec3 sky = mix(${hex(SKY.page)}, ${hex(
  SKY.horizon,
)}, smoothstep(0.0, 0.24, y));
  sky = mix(sky, ${hex(SKY.mid)}, smoothstep(0.24, 0.6, y));
  sky = mix(sky, ${hex(SKY.top)}, smoothstep(0.6, 1.0, y));
  // The curtains give off light, so they add to the sky rather than cover it;
  // they fade out before the page below.
  float fade = smoothstep(0.12, 0.3, y);
  return vec4(clamp(sky + col * glow * 0.7 * fade, 0.0, 1.0), 1.0);
}
`;
