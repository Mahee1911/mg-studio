export const vertexHead = `
uniform mat4 uLocalMatrix;

varying vec3 vLocalPos;
`;

export const vertexMain = `
vLocalPos = (uLocalMatrix * vec4(transformed, 1.0)).xyz;
`;

export const fragmentHead = `
uniform float uTime;
uniform float uRevealProgress;
uniform float uGlowPass;
uniform vec3 uBboxMin;
uniform vec3 uBboxMax;
uniform float uNoiseScale;
uniform float uNoiseSpeed;
uniform float uSpread;
uniform float uWarp;
uniform vec3 uColor;
uniform float uCoreWidth;
uniform float uCoreIntensity;
uniform float uMidWidth;
uniform float uMidIntensity;
uniform float uOuterWidth;
uniform float uOuterIntensity;

varying vec3 vLocalPos;

const float NOISE_FLOOR = 0.2;

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

float glowBand(float width, float dist) {
  return 1.0 - smoothstep(0.0, width, dist);
}
`;

export const fragmentClip = `
float burnDepth = 1e4;

if (uRevealProgress < 1.0) {
  float travel = uSpread + uOuterWidth;
  float sweepY = mix(
    uBboxMin.y + uSpread * NOISE_FLOOR,
    uBboxMax.y + travel,
    uRevealProgress
  );

  if (vLocalPos.y > sweepY) discard;

  if (vLocalPos.y > sweepY - travel) {
    float noiseValue = inkNoise(vLocalPos.xy * uNoiseScale, uTime * uNoiseSpeed);
    burnDepth = sweepY - vLocalPos.y - noiseValue * uSpread;
    if (burnDepth < 0.0) discard;
  }
}
`;

export const fragmentGlow = `
vec3 burnGlow = vec3(0.0);

if (burnDepth < uOuterWidth) {
  burnGlow = uColor * (
    glowBand(uCoreWidth, burnDepth) * uCoreIntensity +
    glowBand(uMidWidth, burnDepth) * uMidIntensity +
    glowBand(uOuterWidth, burnDepth) * uOuterIntensity
  );
}

outgoingLight = mix(outgoingLight, burnGlow, uGlowPass);
`;

export const composite = {
  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tGlow;

    varying vec2 vUv;

    void main() {
      vec4 base = texture2D(tDiffuse, vUv);
      vec3 glow = texture2D(tGlow, vUv).rgb;
      float glowAlpha = max(glow.r, max(glow.g, glow.b));
      gl_FragColor = vec4(base.rgb + glow, max(base.a, glowAlpha));
    }
  `,
};
