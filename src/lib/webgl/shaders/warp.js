import { grain } from "./grain.js";

const fieldUniforms = `
uniform vec2 uResolution;
uniform vec2 uOrigin;
uniform float uFront;
uniform float uBand;
uniform float uTime;
uniform float uScale;
uniform float uSpread;
uniform float uWarp;
uniform float uTwist;
uniform float uStreaks;
`;

const fieldFunctions = `
float hash(vec2 p) {
  return fract(sin(dot(vec3(p, 1.0), vec3(37.1, 61.7, 12.4))) * 3758.5453123);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f *= f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  return valueNoise(p) * 0.5 +
    valueNoise(p * 2.0) * 0.25 +
    valueNoise(p * 4.0) * 0.125 +
    valueNoise(p * 8.0) * 0.0625;
}

float inkNoise(vec2 p, float t) {
  vec2 warp = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
  return fbm(p + (warp - 0.5) * uWarp);
}

mat2 rotate(float a) {
  return mat2(cos(a), sin(a), -sin(a), cos(a));
}

vec2 field(vec2 p, float r) {
  vec2 q = rotate(uTwist * uFront / (1.0 + 2.0 * r)) * p;
  float offset = (inkNoise(q * uScale, uTime) - 0.5) * uSpread;
  vec2 direction = p / max(r, 1e-4);
  float streak = mix(1.0, 2.0 * fbm(direction * 6.0 + vec2(r * 1.5, -uTime)), uStreaks);
  return vec2(offset, streak);
}
`;

export const warpFieldShader = `#version 300 es
precision highp float;

${fieldUniforms}
uniform vec2 uFieldSize;
uniform float uMargin;

out vec4 outColor;

${fieldFunctions}

void main() {
  vec2 frag = gl_FragCoord.xy / uFieldSize * uResolution;
  vec2 p = (frag - uOrigin) / uResolution.y;
  float r = length(p);
  if (abs(r - uFront) > uBand + uMargin) {
    outColor = vec4(0.0, 1.0, 0.0, 1.0);
    return;
  }
  outColor = vec4(field(p, r), 0.0, 1.0);
}
`;

export const warpShader = ({ field }) => `#version 300 es
precision highp float;

${fieldUniforms}
uniform float uReveal;
uniform float uLightOnly;
uniform float uFrame;
uniform float uCoreWidth;
uniform float uCoreIntensity;
uniform float uMidWidth;
uniform float uMidIntensity;
uniform float uOuterWidth;
uniform float uOuterIntensity;
uniform float uHaloWidth;
uniform float uFringe;
uniform float uAberration;
uniform float uGrain;
uniform sampler2D uField;

out vec4 outColor;

${grain}
${field ? "" : fieldFunctions}

float glow(float width, float x) {
  float t = clamp(1.0 - x / width, 0.0, 1.0);
  return t * t * t;
}

float edgeLight(float trail, float streak, float aa) {
  float behind = max(trail, 0.0);
  float ahead = max(-trail, 0.0);
  float core = (1.0 - smoothstep(0.0, max(uCoreWidth, aa), abs(trail))) * uCoreWidth / max(uCoreWidth, aa);
  float spill = trail > 0.0
    ? glow(uMidWidth, behind) * uMidIntensity + glow(uOuterWidth, behind) * uOuterIntensity * streak
    : glow(uHaloWidth, ahead) * uMidIntensity;
  return core * uCoreIntensity + spill;
}

void main() {
  vec2 p = (gl_FragCoord.xy - uOrigin) / uResolution.y;
  float r = length(p);
  float aa = 1.0 / uResolution.y;

  float clearance = mix(uFront - r, r - uFront, uReveal);
  if (abs(clearance) > uBand) {
    outColor = clearance > 0.0 && uLightOnly < 0.5 ? vec4(0.0, 0.0, 0.0, 1.0) : vec4(0.0);
    return;
  }

  ${field ? "vec2 f = texture(uField, gl_FragCoord.xy / uResolution).rg;" : "vec2 f = field(p, r);"}
  float d = r + f.x;
  float trail = uFront - d;
  float depth = mix(trail, -trail, uReveal);

  vec3 trails = trail + vec3(1.0, 0.0, -1.0) * (uFringe + uAberration * r);
  vec3 light = vec3(
    edgeLight(trails.r, f.y, aa),
    edgeLight(trails.g, f.y, aa),
    edgeLight(trails.b, f.y, aa)
  );
  light *= max(1.0 + uGrain * grainNoise(gl_FragCoord.xy, uFrame, 0.0), 0.0);
  light = 1.0 - exp(-light);

  float sheet = smoothstep(-aa, aa, depth) * (1.0 - uLightOnly);
  outColor = vec4(light, max(sheet, max(light.r, max(light.g, light.b))));
}
`;
