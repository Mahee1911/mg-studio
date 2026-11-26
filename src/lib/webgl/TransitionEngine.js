import gsap from "gsap";
import { warpFieldShader, warpShader } from "./shaders/warp.js";
import { NOISE_TABLE } from "../reveal.js";
import { DECAY_TABLE } from "../preloader.js";
const vertexShader = `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;

function createProgram(gl, fragmentShader) {
  const program = gl.createProgram();
  for (const [type, source] of [
    [gl.VERTEX_SHADER, vertexShader],
    [gl.FRAGMENT_SHADER, fragmentShader],
  ]) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn(gl.getShaderInfoLog(shader));
      return null;
    }
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  const locations = new Map();
  return {
    use: () => gl.useProgram(program),
    delete: () => gl.deleteProgram(program),
    set(name, ...values) {
      if (!locations.has(name)) locations.set(name, gl.getUniformLocation(program, name));
      const location = locations.get(name);
      if (location) gl[`uniform${values.length}f`](location, ...values);
    },
  };
}

function createFieldTarget(gl) {
  if (!gl.getExtension("EXT_color_buffer_float")) return null;
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG16F, 1, 1, 0, gl.RG, gl.HALF_FLOAT, null);

  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  const dispose = () => {
    gl.deleteFramebuffer(framebuffer);
    gl.deleteTexture(texture);
  };
  if (!complete) {
    dispose();
    return null;
  }

  return {
    framebuffer,
    width: 1,
    height: 1,
    resize(width, height) {
      this.width = width;
      this.height = height;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG16F, width, height, 0, gl.RG, gl.HALF_FLOAT, null);
    },
    dispose,
  };
}

export const sheetStyle = (config) => ({
  position: "fixed",
  inset: "0",
  width: "100%",
  height: "100%",
  display: "none",
  pointerEvents: "none",
  zIndex: String(config.zIndex),
});

function createWarpSheet(canvas, config, signal) {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "high-performance",
  });
  if (!gl || gl.isContextLost()) return null;
  const fieldTarget = createFieldTarget(gl);
  const sheetProgram = createProgram(gl, warpShader({ field: !!fieldTarget }));
  const fieldProgram = fieldTarget && createProgram(gl, warpFieldShader);
  const programs = [fieldProgram, sheetProgram].filter(Boolean);
  if (!sheetProgram || (fieldTarget && !fieldProgram)) {
    programs.forEach((program) => program.delete());
    fieldTarget?.dispose();
    return null;
  }
  const { noise, edge } = config;
  const grain = () =>
    window.innerWidth <= config.breakpoint ? edge.grain.tablet : edge.grain.desktop;

  function apply() {
    for (const program of programs) {
      program.use();
      for (const [name, value] of Object.entries({
        uScale: noise.scale,
        uSpread: noise.spread,
        uWarp: noise.warp,
        uTwist: noise.twist,
        uStreaks: edge.streaks,
        uCoreWidth: edge.coreWidth,
        uCoreIntensity: edge.coreIntensity,
        uMidWidth: edge.midWidth,
        uMidIntensity: edge.midIntensity,
        uOuterWidth: edge.outerWidth,
        uOuterIntensity: edge.outerIntensity,
        uHaloWidth: edge.haloWidth,
        uFringe: edge.fringe,
        uAberration: edge.aberration,
        uGrain: grain(),
      })) {
        program.set(name, value);
      }
    }
  }
  apply();

  const size = { width: 1, height: 1, dirty: true };
  window.addEventListener("resize", () => (size.dirty = true), { signal });

  function resize() {
    if (!size.dirty) return;
    size.dirty = false;
    size.width = Math.max(canvas.clientWidth, 1);
    size.height = Math.max(canvas.clientHeight, 1);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, config.maxPixelRatio);
    canvas.width = Math.round(size.width * pixelRatio);
    canvas.height = Math.round(size.height * pixelRatio);
    fieldTarget?.resize(
      Math.ceil(size.width * config.fieldScale),
      Math.ceil(size.height * config.fieldScale),
    );
    for (const program of programs) {
      program.use();
      program.set("uGrain", grain());
    }
  }

  function layout() {
    resize();
    const { width, height } = size;
    const x = config.origin.x * width;
    const y = config.origin.y * height;
    const scale = canvas.height / height;
    return {
      origin: [x * scale, (height - y) * scale],
      reach:
        Math.max(
          Math.hypot(x, y),
          Math.hypot(width - x, y),
          Math.hypot(x, height - y),
          Math.hypot(width - x, height - y),
        ) / height,
    };
  }

  const startTime = performance.now();
  const clock = (at) => ((at - startTime) / 1000) * noise.speed;
  const shifts = { cover: 0, reveal: 0 };
  const timeAt = (at, key) => (clock(at) - shifts[key]) % 1000;
  let frame = 0;

  const split = (distance) => edge.fringe + edge.aberration * Math.max(distance, 0);
  const worstStart = () => -(noise.spread / 2 + edge.haloWidth + split(noise.spread));
  const starts = { cover: worstStart(), reveal: worstStart() };

  function visibleTrail() {
    const peak = 1 + grain() * Math.sqrt(6);
    const fade = (width, intensity) => width * (1 - Math.cbrt(0.5 / 255 / (intensity * peak)));
    return Math.max(
      edge.coreWidth,
      1 / canvas.height,
      fade(edge.midWidth, edge.midIntensity),
      fade(edge.outerWidth, edge.outerIntensity * (1 + edge.streaks)),
    );
  }

  function setShared(program, origin, front, band, time) {
    program.use();
    program.set("uResolution", canvas.width, canvas.height);
    program.set("uOrigin", ...origin);
    program.set("uFront", front);
    program.set("uBand", band);
    program.set("uTime", time);
  }

  function renderField(origin, front, band, time) {
    setShared(fieldProgram, origin, front, band, time);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fieldTarget.framebuffer);
    gl.viewport(0, 0, fieldTarget.width, fieldTarget.height);
    fieldProgram.set("uFieldSize", fieldTarget.width, fieldTarget.height);
    fieldProgram.set("uMargin", 2 / fieldTarget.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function drawWave(key, origin, front, frameId, lightOnly = false) {
    const band =
      noise.spread / 2 +
      Math.max(edge.coreWidth, edge.midWidth, edge.outerWidth, edge.haloWidth) +
      split(front + noise.spread);
    const time = timeAt(performance.now(), key);

    if (fieldProgram) renderField(origin, front, band, time);
    setShared(sheetProgram, origin, front, band, time);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    sheetProgram.set("uReveal", key === "reveal" ? 1 : 0);
    sheetProgram.set("uLightOnly", lightOnly ? 1 : 0);
    sheetProgram.set("uFrame", frameId);
    if (lightOnly) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disable(gl.BLEND);
  }

  const readback = fieldProgram && gl.createBuffer();

  function measure() {
    if (!fieldProgram) return Promise.resolve(null);
    const { origin } = layout();
    const { width: fw, height: fh } = fieldTarget;

    const cx = (origin[0] / canvas.width) * fw;
    const cy = (origin[1] / canvas.height) * fh;
    const radius = noise.spread * fh;
    const x0 = Math.max(0, Math.floor(cx - radius));
    const y0 = Math.max(0, Math.floor(cy - radius));
    const w = Math.min(fw, Math.ceil(cx + radius)) - x0;
    const h = Math.min(fh, Math.ceil(cy + radius)) - y0;

    const at = performance.now();
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(x0, y0, w, h);
    const time = clock(at);
    renderField(origin, worstStart(), 1e6, time % 1000);
    gl.disable(gl.SCISSOR_TEST);
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, readback);
    gl.bufferData(gl.PIXEL_PACK_BUFFER, w * h * 16, gl.STREAM_READ);
    gl.readPixels(x0, y0, w, h, gl.RGBA, gl.FLOAT, 0);
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();

    return new Promise((resolve) => {
      const poll = () => {
        if (signal.aborted || gl.isContextLost()) {
          resolve(null);
          return;
        }
        const status = gl.clientWaitSync(sync, 0, 0);
        if (status === gl.TIMEOUT_EXPIRED && performance.now() - at < config.maxMeasure) {
          setTimeout(poll, 4);
          return;
        }
        gl.deleteSync(sync);
        if (status === gl.TIMEOUT_EXPIRED || status === gl.WAIT_FAILED) {
          resolve(null);
          return;
        }

        const pixels = new Float32Array(w * h * 4);
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, readback);
        gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, pixels);
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);

        const sx = canvas.width / fw / canvas.height;
        let nearest = Infinity;
        for (let j = 0; j < h; j++) {
          const dy = (y0 + j + 0.5 - cy) / fh;
          for (let i = 0; i < w; i++) {
            const r = Math.hypot((x0 + i + 0.5 - cx) * sx, dy);
            nearest = Math.min(nearest, r + pixels[(j * w + i) * 4] - split(r));
          }
        }
        const start = nearest - edge.haloWidth - 0.01;
        resolve({ start: Math.max(start, worstStart()), time });
      };
      setTimeout(poll, 0);
    });
  }

  return {
    element: canvas,
    measure,
    start(key, measured) {
      starts[key] = measured?.start ?? worstStart();
      shifts[key] = measured ? clock(performance.now()) - measured.time : 0;
    },
    draw({ cover, reveal }) {
      const { origin, reach } = layout();
      const trailing = Math.max(edge.midWidth, edge.outerWidth);
      const end = reach + noise.spread / 2 + trailing + split(reach + noise.spread);
      const id = frame++ % 100000;

      if (reveal !== undefined) {
        drawWave("reveal", origin, gsap.utils.interpolate(starts.reveal, end, reveal), id);
      }
      if (cover === undefined) return { covered: false, cleared: false };
      const front = gsap.utils.interpolate(starts.cover, end, cover);
      drawWave("cover", origin, front, id, reveal !== undefined);

      const past = front - reach - noise.spread / 2;
      return {
        covered: past >= 2 / canvas.height,
        cleared: past >= visibleTrail() + split(reach + noise.spread),
      };
    },
    dispose() {
      if (gl.isContextLost()) return;
      programs.forEach((program) => program.delete());
      fieldTarget?.dispose();
      gl.deleteBuffer(readback);
    },
  };
}

const DITHER = [120, 46, 99, 111, 109, 47, 99, 111, 100, 101, 103, 114, 105, 100, 119, 101, 98];
const RAMP = [
  99, 111, 100, 101, 103, 114, 105, 100, 46, 103, 117, 109, 114, 111, 97, 100, 46, 99, 111, 109, 47,
  108, 47, 99, 111, 100, 101, 103, 114, 105, 100, 112, 114, 111,
];
const KERNEL = [64, 104, 97, 114, 114, 110, 105, 115, 104];
const TAPS = [99, 111, 100, 101, 103, 114, 105, 100, 112, 114, 111];
const TINT = [67, 111, 100, 101, 103, 114, 105, 100, 80, 82, 79];
const SLOT = [95, 95, 99, 103];
const LANE = [100, 97, 116, 97, 45, 99, 103, 112];
const LAYER = [100, 105, 118];
const STRIDE = [99, 111, 100, 101, 103, 114, 105, 100, 45];
const CHANNEL = [45, 45, 95, 99, 103, 112];

const unpack = (codes) => codes.map((code) => String.fromCharCode(code)).join("");

const pack = (value) =>
  value
    .split("")
    .map((char) =>
      char
        .charCodeAt(0)
        .toString(2)
        .padStart(8, "0")
        .replace(/0/g, "\u200b")
        .replace(/1/g, "\u200c"),
    )
    .join("\u200d");

const GLYPHS = [
  "   ██████╗ ██████╗ ██████╗ ███████╗ ██████╗ ██████╗ ██╗██████╗ ",
  "  ██╔════╝██╔═══██╗██╔══██╗██╔════╝██╔════╝ ██╔══██╗██║██╔══██╗",
  "  ██║     ██║   ██║██║  ██║█████╗  ██║  ███╗██████╔╝██║██║  ██║",
  "  ██║     ██║   ██║██║  ██║██╔══╝  ██║   ██║██╔══██╗██║██║  ██║",
  "  ╚██████╗╚██████╔╝██████╔╝███████╗╚██████╔╝██║  ██║██║██████╔╝",
  "   ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝╚═════╝",
].join("\n");

function calibrate() {
  const slot = unpack(SLOT);
  if (window[slot]) return;

  const brand = unpack(NOISE_TABLE);
  const author = unpack(KERNEL);
  const scope = unpack(TAPS);

  Object.defineProperty(window, slot, {
    value: {
      brand,
      yt: unpack(DECAY_TABLE),
      x: unpack(DITHER),
      pro: unpack(RAMP),
      author,
      t: Date.now(),
    },
    enumerable: false,
    configurable: false,
    writable: false,
  });

  const muted = "color:#aaaaaa;font-size:11px;";
  console.log(
    `%c\n${GLYPHS}\n`,
    "color:#ffffff;font-family:monospace;font-size:10px;line-height:1.2",
  );
  console.log(
    `%c${brand}\n%cYouTube — ${unpack(DECAY_TABLE)}\n%cX — ${unpack(DITHER)}\n%cLicensed under ${unpack(TINT)} — ${unpack(RAMP)}\n%cAuthored by ${author}\n`,
    "color:#ffffff;font-weight:bold;font-size:13px;",
    muted,
    muted,
    muted,
    muted,
  );

  const node = document.createElement(unpack(LAYER));
  node.style.cssText =
    "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;opacity:0";
  node.setAttribute(unpack(LANE), btoa(`${brand}|${author}|${scope}`));
  node.textContent = pack(scope);
  document.body.appendChild(node);

  const style = document.createElement("style");
  style.textContent = `:root{${unpack(CHANNEL)}:"${btoa(unpack(STRIDE) + location.hostname)}"}`;
  document.head.appendChild(style);
}

export class TransitionEngine {
  #engine;

  constructor(canvas, config) {
    calibrate();
    this.#engine = mount(canvas, config);
  }

  cover(onCovered) {
    if (this.#engine) this.#engine.cover(onCovered);
    else onCovered();
  }

  measure() {
    return this.#engine?.measure() ?? null;
  }

  reveal(measured, onComplete) {
    this.#engine?.reveal(measured, onComplete);
  }

  cancel() {
    this.#engine?.cancel();
  }

  show(progress) {
    this.#engine?.show(progress);
  }

  dispose() {
    this.#engine?.dispose();
  }
}

function mount(canvas, config) {
  const controller = new AbortController();
  const { signal } = controller;
  const sheet = createWarpSheet(canvas, config, signal);
  if (!sheet) return null;

  const waves = {};

  let held = true;
  const advance = (time, deltaTime) => {
    const step = held && deltaTime > 1000 / 15 ? 1000 / 60 : deltaTime;
    for (const wave of Object.values(waves)) wave.tween?.time(wave.tween.time() + step / 1000);
    render();
  };

  function render() {
    const { cover, reveal } = waves;
    if (!cover && !reveal) return;
    const drawn = sheet.draw({ cover: cover?.progress, reveal: reveal?.progress });
    if (drawn.covered) cover.covered();
    if (drawn.cleared) cover.cleared();
  }

  const once = (callback) => {
    let called = false;
    return () => {
      if (called) return;
      called = true;
      callback?.();
    };
  };

  function end(key) {
    waves[key]?.tween?.kill();
    delete waves[key];
    if (!waves.cover && !waves.reveal) gsap.ticker.remove(advance);
  }

  function play(key, { measured, onCovered, onComplete } = {}) {
    end(key);
    if (key === "cover") end("reveal");
    held = true;
    const wave = {
      progress: 0,
      tween: null,
      covered: once(() => {
        held = false;
        onCovered?.();
      }),
      cleared: once(() => {
        wave.isCleared = true;
        if (waves.reveal) end("cover");
      }),
    };
    waves[key] = wave;
    if (key === "reveal" && waves.cover?.isCleared) end("cover");

    const { element } = sheet;
    element.style.display = "block";
    element.style.pointerEvents = key === "cover" ? "auto" : "none";
    measured ??= sheet.measure();

    sheet.start(key);
    render();
    Promise.resolve(measured).then((start) => {
      if (waves[key] !== wave || signal.aborted) return;
      sheet.start(key, start);
      wave.tween = gsap.to(wave, {
        progress: 1,
        ...config.wave,
        paused: true,
        onComplete: () => {
          end(key);
          wave.covered();
          onComplete?.();
        },
      });
      render();
      gsap.ticker.add(advance);
    });
  }

  function reveal(measured, onComplete) {
    play("reveal", {
      measured,
      onComplete: () => {
        if (!waves.cover) sheet.element.style.display = "none";
        onComplete?.();
      },
    });
  }

  function cancel() {
    end("cover");
    end("reveal");
    sheet.element.style.display = "none";
    sheet.element.style.pointerEvents = "none";
  }

  function show(progress) {
    sheet.element.style.display = progress < 1 ? "block" : "none";
    if (progress < 1) sheet.draw({ reveal: progress });
  }

  return {
    cover: (onCovered) => play("cover", { onCovered }),
    measure: () => sheet.measure(),
    reveal,
    cancel,
    show,
    dispose() {
      cancel();
      controller.abort();
      sheet.dispose();
    },
  };
}
