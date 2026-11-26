import { fluidShader } from "./shaders/fluid.js";
import { grain, surfaceHash } from "./shaders/grain.js";

const vertexShader = `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;

const heightFunction = `
mat2 rotate(float a) {
  return mat2(cos(a), sin(a), -sin(a), cos(a));
}

float height(vec2 pixel) {
  vec2 U = 1.5 * (pixel - 0.5 * uResolution) / uResolution.y;
#ifdef FLUID
  U -= fluidAt(pixel / uResolution) * uDistortion;
#endif
  vec2 U0 = U;
  float t = uTime;

  U *= rotate(1.0 - 0.5 * t);
  U.x += 0.6 * cos(3.0 * U.x + 0.2) * exp(-2.0 * dot(U, U));
  U *= rotate(1.0 + t);
  for (int i = 0; i < 3; i++) {
    U.y += 0.2 * U.x * cos(3.0 * U.x + 0.2) * exp(-2.0 * dot(U, U));
  }
  U *= rotate(1.0 - t);
  for (int i = 0; i < 4; i++) {
    U.x += 0.2 * cos(3.0 * U.y + 0.2) * exp(-2.0 * dot(U, U));
  }
  U *= rotate(1.0 + t);
  U += 0.6 * cos(3.0 * U.x + 0.2) * exp(-2.0 * dot(U, U));

  return exp(-0.5 * dot(U0, U0))
    * (exp(-3.0 * U.x * U.x) * exp(6.0 * U.x) - exp(-3.0 * U.y * U.y) * exp(4.0 * U.y));
}
`;

const heightShader = (defines) => `#version 300 es
precision highp float;
${defines}

uniform vec2 uResolution;
uniform float uTime;
uniform sampler2D uFluid;
uniform float uDistortion;

out vec4 outColor;

vec2 fluidAt(vec2 uv) {
  vec2 size = vec2(textureSize(uFluid, 0));
  vec2 p = uv * size - 0.5;
  vec2 i = floor(p);
  vec2 f = p - i;
  vec2 f2 = f * f;
  vec2 f3 = f2 * f;
  vec2 w0 = (-f3 + 3.0 * f2 - 3.0 * f + 1.0) / 6.0;
  vec2 w1 = (3.0 * f3 - 6.0 * f2 + 4.0) / 6.0;
  vec2 w2 = (-3.0 * f3 + 3.0 * f2 + 3.0 * f + 1.0) / 6.0;
  vec2 w3 = f3 / 6.0;
  vec2 g0 = w0 + w1;
  vec2 g1 = w2 + w3;
  vec2 h0 = (i - 0.5 + w1 / g0) / size;
  vec2 h1 = (i + 1.5 + w3 / g1) / size;
  return g0.y * (g0.x * texture(uFluid, h0).xy + g1.x * texture(uFluid, vec2(h1.x, h0.y)).xy)
       + g1.y * (g0.x * texture(uFluid, vec2(h0.x, h1.y)).xy + g1.x * texture(uFluid, h1).xy);
}

${heightFunction}

void main() {
  outColor = vec4(height(gl_FragCoord.xy), 0.0, 0.0, 1.0);
}
`;

const lightingShader = (defines) => `#version 300 es
precision highp float;
${defines}

#define MAX_SAMPLES 16

uniform vec2 uResolution;
uniform float uTime;
uniform float uFrame;
uniform float uBlend;
uniform float uRoughness;
uniform int uSamples;
uniform sampler2D uPrevious;
uniform vec3 uAmbient;
uniform vec3 uKey;
uniform vec3 uRim;

out vec4 outColor;

${surfaceHash}

#ifdef HEIGHT_TEXTURE
uniform sampler2D uHeight;

float heightAt(vec2 pixel) {
  ivec2 p = clamp(ivec2(pixel), ivec2(0), ivec2(uResolution) - 1);
  return texelFetch(uHeight, p, 0).r;
}
#else
${heightFunction}

float heightAt(vec2 pixel) {
  return height(pixel);
}
#endif

vec3 light(vec3 normal) {
  vec3 col = uAmbient * exp(-max(dot(normal, normalize(vec3(1.0))), 0.0));
  col += uKey * exp(-15.0 * max(1.0 - dot(normal, normalize(vec3(-1.0, 1.0, 1.0))), 0.0));
  col += uRim * exp(-15.0 * max(1.0 - dot(normal, normalize(vec3(1.0, -1.0, 1.0))), 0.0));
  return col;
}

void main() {
  vec2 U = gl_FragCoord.xy;

  vec2 slope = vec2(
    heightAt(U + vec2(1.0, 0.0)) - heightAt(U - vec2(1.0, 0.0)),
    heightAt(U + vec2(0.0, 1.0)) - heightAt(U - vec2(0.0, 1.0))
  );
  slope *= uResolution.y / 720.0;
  vec3 normal = normalize(vec3(slope, 0.1));

  vec3 col = vec3(0.0);
  for (int i = 0; i < MAX_SAMPLES; i++) {
    if (i >= uSamples) break;
    vec3 jitter = hash(vec4(U, uTime, uFrame * float(uSamples) + float(i))).xyz * 2.0 - 1.0;
    col += light(normal + uRoughness * jitter);
  }
  col /= float(uSamples);

  vec3 previous = texelFetch(uPrevious, ivec2(U), 0).rgb;
  outColor = vec4(mix(previous, col, uBlend), 1.0);
}
`;

const displayShader = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform float uExposure;
uniform float uGrainAmount;
uniform float uGrainSize;
uniform float uGrainFps;
uniform float uGrainShadows;
uniform float uGrainChroma;
uniform sampler2D uImage;

out vec4 outColor;

${grain}

void main() {
  vec3 color = uExposure * texture(uImage, gl_FragCoord.xy / uResolution).rgb;
  color = filmGrain(color, uTime, uGrainAmount, uGrainSize, uGrainFps, uGrainShadows, uGrainChroma);
  outColor = vec4(color, 1.0);
}
`;

function hexToRgb(hex) {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((channel) => channel / 255);
}

function createProgram(gl, fragmentSource) {
  const program = gl.createProgram();
  for (const [type, source] of [
    [gl.VERTEX_SHADER, vertexShader],
    [gl.FRAGMENT_SHADER, fragmentSource],
  ]) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn(gl.getShaderInfoLog(shader));
      return null;
    }
    gl.attachShader(program, shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn(gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}

export class BackgroundEngine {
  #engine;

  constructor(canvas, config) {
    this.#engine = mount(canvas, config);
  }

  dispose() {
    this.#engine.dispose();
  }
}

const idle = { dispose() {} };

function mount(canvas, config) {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "high-performance",
  });
  if (!gl) return idle;

  const floatTargets = gl.getExtension("EXT_color_buffer_float");
  const halfFloatTargets = floatTargets || gl.getExtension("EXT_color_buffer_half_float");
  const defines = floatTargets ? "#define HEIGHT_TEXTURE" : "";

  const heightProgram = floatTargets
    ? createProgram(gl, heightShader(`${defines}\n#define FLUID`))
    : null;
  const fluidProgram = floatTargets ? createProgram(gl, fluidShader) : null;
  const lighting = createProgram(gl, lightingShader(defines));
  const display = createProgram(gl, displayShader);
  if (!lighting || !display || (floatTargets && (!heightProgram || !fluidProgram))) {
    for (const program of [heightProgram, fluidProgram, lighting, display])
      gl.deleteProgram(program);
    return idle;
  }

  const controller = new AbortController();
  const { signal } = controller;
  const observers = [];

  const locate = (program, names) =>
    Object.fromEntries(names.map((name) => [name, gl.getUniformLocation(program, name)]));
  const lightingUniforms = locate(lighting, [
    "uResolution",
    "uTime",
    "uFrame",
    "uBlend",
    "uRoughness",
    "uSamples",
    "uPrevious",
    "uHeight",
    "uAmbient",
    "uKey",
    "uRim",
  ]);
  const heightUniforms =
    heightProgram && locate(heightProgram, ["uResolution", "uTime", "uFluid", "uDistortion"]);
  const fluidUniforms =
    fluidProgram &&
    locate(fluidProgram, [
      "uResolution",
      "uPrevious",
      "uMouse",
      "uMouseActive",
      "uScale",
      "uBrushSize",
      "uBrushStrength",
      "uDecay",
      "uPressureDecay",
      "uStopDecay",
    ]);
  const displayUniforms = locate(display, [
    "uResolution",
    "uTime",
    "uExposure",
    "uImage",
    "uGrainAmount",
    "uGrainSize",
    "uGrainFps",
    "uGrainShadows",
    "uGrainChroma",
  ]);

  gl.useProgram(lighting);
  gl.uniform1i(lightingUniforms.uPrevious, 0);
  gl.uniform1i(lightingUniforms.uHeight, 1);
  gl.uniform3fv(lightingUniforms.uAmbient, hexToRgb(config.ambient));
  gl.uniform3fv(lightingUniforms.uKey, hexToRgb(config.keyLight));
  gl.uniform3fv(lightingUniforms.uRim, hexToRgb(config.rim));
  gl.useProgram(display);
  gl.uniform1i(displayUniforms.uImage, 0);
  gl.uniform1f(displayUniforms.uExposure, config.exposure);

  function applySurface() {
    const { roughness, samples, blend } = config.surface;
    gl.useProgram(lighting);
    gl.uniform1f(lightingUniforms.uRoughness, roughness);
    gl.uniform1i(lightingUniforms.uSamples, Math.min(Math.max(Math.round(samples), 1), 16));
    gl.uniform1f(lightingUniforms.uBlend, blend);
  }
  applySurface();

  function applyGrain() {
    const { amount, size, fps, shadows, chroma } = config.grain;
    gl.useProgram(display);
    gl.uniform1f(displayUniforms.uGrainAmount, amount);
    gl.uniform1f(displayUniforms.uGrainSize, size);
    gl.uniform1f(displayUniforms.uGrainFps, fps);
    gl.uniform1f(displayUniforms.uGrainShadows, shadows);
    gl.uniform1f(displayUniforms.uGrainChroma, chroma);
  }
  applyGrain();

  if (fluidProgram) {
    gl.useProgram(heightProgram);
    gl.uniform1i(heightUniforms.uFluid, 2);
    gl.useProgram(fluidProgram);
    gl.uniform1i(fluidUniforms.uPrevious, 3);
  }

  let fluidScale = 1;

  function applyFluid() {
    if (!fluidProgram) return;
    const { brushSize, brushStrength, distortion, decay, trail, stopDecay } = config.fluid;
    gl.useProgram(fluidProgram);
    gl.uniform1f(fluidUniforms.uScale, fluidScale);
    gl.uniform1f(fluidUniforms.uBrushSize, Math.max(brushSize, 0.01));
    gl.uniform1f(fluidUniforms.uBrushStrength, brushStrength);
    gl.uniform1f(fluidUniforms.uDecay, decay);
    gl.uniform1f(fluidUniforms.uPressureDecay, trail);
    gl.uniform1f(fluidUniforms.uStopDecay, stopDecay);
    gl.useProgram(heightProgram);
    gl.uniform1f(heightUniforms.uDistortion, (0.375 * distortion) / fluidScale);
  }

  let targets = [];
  let heightTarget = null;
  const lightingSize = { width: 1, height: 1 };

  let fluidTargets = [];
  const fluidSize = { width: 0, height: 0 };

  const formats = {
    rgba16f: [gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, gl.LINEAR],
    rgba8: [gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.LINEAR],
    r32f: [gl.R32F, gl.RED, gl.FLOAT, gl.NEAREST],
  };

  function createTarget(width, height, format, wrap = gl.CLAMP_TO_EDGE) {
    const [internalFormat, layout, type, filter] = formats[format];
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, layout, type, null);
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { texture, framebuffer, complete };
  }

  function createTargets(width, height, format = halfFloatTargets ? "rgba16f" : "rgba8") {
    for (const { texture, framebuffer } of [...targets, heightTarget].filter(Boolean)) {
      gl.deleteTexture(texture);
      gl.deleteFramebuffer(framebuffer);
    }
    heightTarget = heightProgram ? createTarget(width, height, "r32f") : null;
    targets = [createTarget(width, height, format), createTarget(width, height, format)];
    if (format !== "rgba8" && !targets.every((target) => target.complete)) {
      createTargets(width, height, "rgba8");
    }
  }

  function createFluidTargets(width, height) {
    for (const { texture, framebuffer } of fluidTargets) {
      gl.deleteTexture(texture);
      gl.deleteFramebuffer(framebuffer);
    }
    fluidTargets = [
      createTarget(width, height, "rgba16f", gl.REPEAT),
      createTarget(width, height, "rgba16f", gl.REPEAT),
    ];
    gl.useProgram(fluidProgram);
    gl.uniform2f(fluidUniforms.uResolution, width, height);
  }

  const pointer = { x: 0, y: 0, previousX: 0, previousY: 0, lastMove: 0, seen: false };
  window.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType === "touch") return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      if (!pointer.seen) {
        pointer.previousX = pointer.x;
        pointer.previousY = pointer.y;
        pointer.seen = true;
      }
      pointer.lastMove = performance.now();
    },
    { passive: true, signal },
  );
  document.documentElement.addEventListener(
    "pointerleave",
    () => {
      pointer.lastMove = 0;
      pointer.seen = false;
    },
    { signal },
  );

  let cssHeight = 1;

  function simulate(now) {
    const [read, write] = fluidTargets;
    const active = pointer.seen && now - pointer.lastMove < 100;
    const toFluid = (x, y) => [x * fluidScale, (cssHeight - y) * fluidScale];

    gl.viewport(0, 0, fluidSize.width, fluidSize.height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, write.framebuffer);
    gl.useProgram(fluidProgram);
    gl.uniform4f(
      fluidUniforms.uMouse,
      ...toFluid(pointer.x, pointer.y),
      ...toFluid(pointer.previousX, pointer.previousY),
    );
    gl.uniform1f(fluidUniforms.uMouseActive, active ? 1 : 0);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, read.texture);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    fluidTargets = [write, read];

    pointer.previousX = pointer.x;
    pointer.previousY = pointer.y;
  }

  let devicePixelRatio = 0;
  let sizeDirty = true;
  const markSize = () => (sizeDirty = true);
  observers.push(new ResizeObserver(markSize));
  observers.at(-1).observe(canvas);
  window.addEventListener("resize", markSize, { signal });

  function resize() {
    if (window.devicePixelRatio !== devicePixelRatio) sizeDirty = true;
    if (!sizeDirty) return;
    sizeDirty = false;

    devicePixelRatio = window.devicePixelRatio;
    const pixelRatio = Math.min(devicePixelRatio || 1, config.maxPixelRatio);
    const cssWidth = canvas.clientWidth;
    cssHeight = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(cssWidth * pixelRatio));
    canvas.height = Math.max(1, Math.round(cssHeight * pixelRatio));
    gl.useProgram(display);
    gl.uniform2f(displayUniforms.uResolution, canvas.width, canvas.height);

    if (fluidProgram) {
      const fluidWidth = Math.max(1, Math.round(cssWidth * config.fluid.resolution));
      const fluidHeight = Math.max(1, Math.round(cssHeight * config.fluid.resolution));
      if (fluidWidth !== fluidSize.width || fluidHeight !== fluidSize.height) {
        fluidSize.width = fluidWidth;
        fluidSize.height = fluidHeight;
        createFluidTargets(fluidWidth, fluidHeight);
      }
      fluidScale = fluidHeight / Math.max(cssHeight, 1);
      applyFluid();
    }

    const width = Math.max(1, Math.round(canvas.width * config.surface.resolution));
    const height = Math.max(1, Math.round(canvas.height * config.surface.resolution));
    if (width === lightingSize.width && height === lightingSize.height && targets.length) return;
    lightingSize.width = width;
    lightingSize.height = height;
    createTargets(width, height);
    gl.useProgram(lighting);
    gl.uniform2f(lightingUniforms.uResolution, width, height);
    if (heightProgram) {
      gl.useProgram(heightProgram);
      gl.uniform2f(heightUniforms.uResolution, width, height);
    }
  }

  let frameCount = 0;

  function step(time) {
    const [read, write] = targets;
    gl.viewport(0, 0, lightingSize.width, lightingSize.height);

    if (heightProgram) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, heightTarget.framebuffer);
      gl.useProgram(heightProgram);
      gl.uniform1f(heightUniforms.uTime, time);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, fluidTargets[0].texture);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, heightTarget.texture);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, write.framebuffer);
    gl.useProgram(lighting);
    gl.uniform1f(lightingUniforms.uTime, time);
    gl.uniform1f(lightingUniforms.uFrame, frameCount++ % 100000);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, read.texture);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    targets = [write, read];
  }

  function present(time) {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(display);
    gl.uniform1f(displayUniforms.uTime, time);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, targets[0].texture);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  const start = performance.now();

  let frame = 0;
  function loop(now) {
    frame = requestAnimationFrame(loop);
    const seconds = (now - start) / 1000;
    resize();
    if (fluidProgram) simulate(performance.now());
    step(seconds * config.speed);
    present(seconds);
  }

  frame = requestAnimationFrame(loop);

  return {
    dispose() {
      controller.abort();
      observers.forEach((observer) => observer.disconnect());
      cancelAnimationFrame(frame);
      for (const { texture, framebuffer } of [...targets, ...fluidTargets, heightTarget].filter(
        Boolean,
      )) {
        gl.deleteTexture(texture);
        gl.deleteFramebuffer(framebuffer);
      }
      for (const program of [heightProgram, fluidProgram, lighting, display])
        gl.deleteProgram(program);
    },
  };
}
