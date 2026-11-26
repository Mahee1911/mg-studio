// import * as THREE from "three";
// import gsap from "gsap";
// import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
// import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
// import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
// import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
// import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
// import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
// import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
// import { SMAAPass } from "three/addons/postprocessing/SMAAPass.js";
// import * as reveal from "./shaders/reveal.js";
// import { AsyncEngine } from "./AsyncEngine.js";
// import { untilHandoff } from "../preloader.js";

// const createUniforms = (config) => ({
//   uTime: { value: 0 },
//   uRevealProgress: { value: 0 },
//   uGlowPass: { value: 0 },
//   uBboxMin: { value: new THREE.Vector3() },
//   uBboxMax: { value: new THREE.Vector3() },
//   ...Object.fromEntries(
//     Object.entries(config.edge).map(([key, value]) => [
//       `u${key[0].toUpperCase()}${key.slice(1)}`,
//       { value: typeof value === "string" ? new THREE.Color(value) : value },
//     ]),
//   ),
// });

// function patchMaterial(mesh, uniforms) {
//   const localMatrix = mesh.matrixWorld.clone();

//   mesh.material.onBeforeCompile = (shader) => {
//     Object.assign(shader.uniforms, uniforms, {
//       uLocalMatrix: { value: localMatrix },
//     });

//     shader.vertexShader = shader.vertexShader
//       .replace("#include <common>", `#include <common>\n${reveal.vertexHead}`)
//       .replace("#include <project_vertex>", `#include <project_vertex>\n${reveal.vertexMain}`);

//     shader.fragmentShader = shader.fragmentShader
//       .replace("#include <common>", `#include <common>\n${reveal.fragmentHead}`)
//       .replace(
//         "#include <clipping_planes_fragment>",
//         `#include <clipping_planes_fragment>\n${reveal.fragmentClip}`,
//       )
//       .replace("#include <opaque_fragment>", `${reveal.fragmentGlow}\n#include <opaque_fragment>`);
//   };
// }

// function disposeScene(scene) {
//   scene.traverse((child) => {
//     if (!child.isMesh) return;
//     child.geometry.dispose();
//     for (const material of [child.material].flat()) {
//       for (const value of Object.values(material)) if (value?.isTexture) value.dispose();
//       material.dispose();
//     }
//   });
// }

// function disposeComposer(composer) {
//   for (const pass of composer.passes) pass.dispose?.();
//   composer.dispose();
// }

// export class ModelEngine extends AsyncEngine {
//   constructor(container, config) {
//     super(start, container, config);
//   }
// }

// async function start(container, config, { signal, track }) {
//   const uniforms = createUniforms(config);

//   const renderer = new THREE.WebGLRenderer({
//     alpha: true,
//     powerPreference: "high-performance",
//   });
//   track(() => {
//     renderer.setAnimationLoop(null);
//     renderer.dispose();
//     renderer.forceContextLoss();
//     renderer.domElement.remove();
//   });

//   const gltf = new GLTFLoader().loadAsync(config.model);

//   renderer.setPixelRatio(Math.min(window.devicePixelRatio, config.maxPixelRatio));
//   renderer.toneMapping = THREE.ACESFilmicToneMapping;
//   renderer.toneMappingExposure = config.exposure;

//   const scene = new THREE.Scene();

//   const pmrem = new THREE.PMREMGenerator(renderer);
//   scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
//   scene.environmentIntensity = config.environmentIntensity;
//   pmrem.dispose();
//   track(() => scene.environment.dispose());

//   const light = new THREE.DirectionalLight(config.light.color, config.light.intensity);
//   light.position.fromArray(config.light.position);
//   scene.add(light);

//   const camera = new THREE.PerspectiveCamera(config.fov, 1, 0.1, 100);
//   camera.position.set(0, 0, 5);

//   const { scene: logo } = await gltf;
//   // Face the logo toward this viewer while keeping the original cursor-parallax animation.
//   logo.rotation.x = Math.PI / 2;
//   track(() => disposeScene(logo));
//   if (signal.aborted) return;
//   const box = new THREE.Box3().setFromObject(logo);
//   const size = box.getSize(new THREE.Vector3());
//   const scale = 1 / Math.max(size.x, size.y);
//   const logoSize = new THREE.Vector2(size.x * scale, size.y * scale);

//   logo.scale.setScalar(scale);
//   logo.position.copy(box.getCenter(new THREE.Vector3())).multiplyScalar(-scale);
//   logo.updateMatrixWorld(true);
//   logo.traverse((child) => child.isMesh && patchMaterial(child, uniforms));

//   const pivot = new THREE.Group().add(logo);
//   const intro = new THREE.Group().add(pivot);
//   scene.add(intro);

//   const bbox = new THREE.Box3().setFromObject(pivot);
//   uniforms.uBboxMin.value.copy(bbox.min);
//   uniforms.uBboxMax.value.copy(bbox.max);

//   const { scale: introScale, rotate: introRotate, delay, ...timing } = config.reveal;
//   intro.scale.setScalar(introScale);
//   intro.rotation.y = introRotate;

//   const glowComposer = new EffectComposer(renderer);
//   glowComposer.renderToScreen = false;
//   glowComposer.addPass(new RenderPass(scene, camera));
//   glowComposer.addPass(
//     new UnrealBloomPass(
//       new THREE.Vector2(),
//       config.bloom.strength,
//       config.bloom.radius,
//       config.bloom.threshold,
//     ),
//   );

//   const composer = new EffectComposer(renderer);
//   composer.addPass(new RenderPass(scene, camera));
//   composer.addPass(
//     new ShaderPass(
//       new THREE.ShaderMaterial({
//         ...reveal.composite,
//         uniforms: {
//           tDiffuse: { value: null },
//           tGlow: { value: glowComposer.readBuffer.texture },
//         },
//       }),
//     ),
//   );
//   composer.addPass(new OutputPass());
//   composer.addPass(new SMAAPass());
//   track(() => {
//     disposeComposer(glowComposer);
//     disposeComposer(composer);
//   });

//   let dirty = true;
//   const rendered = { x: NaN, y: NaN, progress: NaN };

//   function resize() {
//     dirty = true;
//     const { clientWidth: width, clientHeight: height } = container;
//     const fill = width <= config.breakpoint ? config.fill.mobile : config.fill.desktop;
//     const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));

//     camera.aspect = width / height;
//     camera.position.setLength(
//       Math.max(logoSize.y, logoSize.x / camera.aspect) / (2 * tanHalfFov * fill),
//     );
//     camera.updateProjectionMatrix();
//     renderer.setSize(width, height);
//     glowComposer.setSize(width, height);
//     composer.setSize(width, height);
//   }

//   container.appendChild(renderer.domElement);
//   resize();
//   window.addEventListener("resize", resize, { signal });

//   renderer.setRenderTarget(composer.readBuffer);
//   await renderer.compileAsync(scene, camera);
//   if (signal.aborted) return;
//   renderer.setRenderTarget(null);

//   const pointer = { x: 0, y: 0 };
//   window.addEventListener(
//     "pointermove",
//     (event) => {
//       if (event.pointerType === "touch") return;
//       pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
//       pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
//     },
//     { passive: true, signal },
//   );
//   document.addEventListener(
//     "pointerout",
//     (event) => {
//       if (!event.relatedTarget) pointer.x = pointer.y = 0;
//     },
//     { signal },
//   );

//   function follow(axis, target, ease) {
//     const current = pivot.rotation[axis];
//     pivot.rotation[axis] =
//       Math.abs(target - current) < 1e-5 ? target : current + (target - current) * ease;
//   }

//   const timer = new THREE.Timer();
//   timer.connect(document);
//   track(() => timer.dispose());

//   renderer.setAnimationLoop((time) => {
//     timer.update(time);
//     uniforms.uTime.value = timer.getElapsed();

//     const { rotateX, rotateY, smoothing } = config.parallax;
//     const ease = 1 - Math.exp(-timer.getDelta() / smoothing);
//     follow("y", pointer.x * rotateY, ease);
//     follow("x", pointer.y * rotateX, ease);

//     const progress = uniforms.uRevealProgress.value;
//     const revealing = progress < 1;
//     const unchanged =
//       pivot.rotation.x === rendered.x &&
//       pivot.rotation.y === rendered.y &&
//       progress === rendered.progress;
//     if (!revealing && !dirty && unchanged) return;
//     dirty = false;
//     rendered.x = pivot.rotation.x;
//     rendered.y = pivot.rotation.y;
//     rendered.progress = progress;

//     if (revealing) {
//       uniforms.uGlowPass.value = 1;
//       glowComposer.render();
//       uniforms.uGlowPass.value = 0;
//     }

//     composer.render();
//   });

//   const tween = gsap
//     .timeline({
//       delay: delay + (untilHandoff() ?? 0),
//       defaults: timing,
//       onUpdate: () => (dirty = true),
//     })
//     .to(uniforms.uRevealProgress, { value: 1 }, 0)
//     .to(intro.scale, { x: 1, y: 1, z: 1 }, 0)
//     .to(intro.rotation, { y: 0 }, 0);
//   track(() => tween.kill());
// }

import * as THREE from "three";
import gsap from "gsap";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { SMAAPass } from "three/addons/postprocessing/SMAAPass.js";
import * as reveal from "./shaders/reveal.js";
import { AsyncEngine } from "./AsyncEngine.js";
import { untilHandoff } from "../preloader.js";

const createUniforms = (config) => ({
  uTime: { value: 0 },
  uRevealProgress: { value: 0 },
  uGlowPass: { value: 0 },
  uBboxMin: { value: new THREE.Vector3() },
  uBboxMax: { value: new THREE.Vector3() },
  ...Object.fromEntries(
    Object.entries(config.edge).map(([key, value]) => [
      `u${key[0].toUpperCase()}${key.slice(1)}`,
      { value: typeof value === "string" ? new THREE.Color(value) : value },
    ]),
  ),
});

function patchMaterial(mesh, uniforms) {
  const localMatrix = mesh.matrixWorld.clone();

  mesh.material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms, {
      uLocalMatrix: { value: localMatrix },
    });

    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${reveal.vertexHead}`)
      .replace("#include <project_vertex>", `#include <project_vertex>\n${reveal.vertexMain}`);

    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${reveal.fragmentHead}`)
      .replace(
        "#include <clipping_planes_fragment>",
        `#include <clipping_planes_fragment>\n${reveal.fragmentClip}`,
      )
      .replace("#include <opaque_fragment>", `${reveal.fragmentGlow}\n#include <opaque_fragment>`);
  };
}

function disposeScene(scene) {
  scene.traverse((child) => {
    if (!child.isMesh) return;
    child.geometry.dispose();
    for (const material of [child.material].flat()) {
      for (const value of Object.values(material)) if (value?.isTexture) value.dispose();
      material.dispose();
    }
  });
}

function disposeComposer(composer) {
  for (const pass of composer.passes) pass.dispose?.();
  composer.dispose();
}

export class ModelEngine extends AsyncEngine {
  constructor(container, config) {
    super(start, container, config);
  }
}

async function start(container, config, { signal, track }) {
  const uniforms = createUniforms(config);

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    powerPreference: "high-performance",
  });
  track(() => {
    renderer.setAnimationLoop(null);
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  });

  const gltf = new GLTFLoader().loadAsync(config.model);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, config.maxPixelRatio));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = config.exposure;

  const scene = new THREE.Scene();

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = config.environmentIntensity;
  pmrem.dispose();
  track(() => scene.environment.dispose());

  const light = new THREE.DirectionalLight(config.light.color, config.light.intensity);
  light.position.fromArray(config.light.position);
  scene.add(light);

  // A cool point light follows the pointer and gives the metal a moving highlight.
  const pointerLight = new THREE.PointLight("#58748c", 0, 2.8, 2);
  pointerLight.position.z = 0.38;
  scene.add(pointerLight);

  const camera = new THREE.PerspectiveCamera(config.fov, 1, 0.1, 100);
  camera.position.set(0, 0, 5);
  const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));

  const { scene: logo } = await gltf;
  // Face the logo toward this viewer while keeping its original cursor-parallax animation.
  logo.rotation.x = Math.PI / 2;
  track(() => disposeScene(logo));
  if (signal.aborted) return;

  logo.traverse((child) => {
    if (!child.isMesh) return;
    for (const material of [child.material].flat()) {
      if (!material.isMeshStandardMaterial) continue;
      material.metalness = 0.94;
      material.roughness = 0.2;
      material.needsUpdate = true;
    }
  });

  const box = new THREE.Box3().setFromObject(logo);
  const size = box.getSize(new THREE.Vector3());
  const scale = 1 / Math.max(size.x, size.y);
  const logoSize = new THREE.Vector2(size.x * scale, size.y * scale);

  logo.scale.setScalar(scale);
  logo.position.copy(box.getCenter(new THREE.Vector3())).multiplyScalar(-scale);
  logo.updateMatrixWorld(true);
  logo.traverse((child) => child.isMesh && patchMaterial(child, uniforms));

  const pivot = new THREE.Group().add(logo);
  const intro = new THREE.Group().add(pivot);
  scene.add(intro);

  const bbox = new THREE.Box3().setFromObject(pivot);
  uniforms.uBboxMin.value.copy(bbox.min);
  uniforms.uBboxMax.value.copy(bbox.max);

  const { scale: introScale, rotate: introRotate, delay, ...timing } = config.reveal;
  intro.scale.setScalar(introScale);
  intro.rotation.y = introRotate;

  const glowComposer = new EffectComposer(renderer);
  glowComposer.renderToScreen = false;
  glowComposer.addPass(new RenderPass(scene, camera));
  glowComposer.addPass(
    new UnrealBloomPass(
      new THREE.Vector2(),
      config.bloom.strength,
      config.bloom.radius,
      config.bloom.threshold,
    ),
  );

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(
    new ShaderPass(
      new THREE.ShaderMaterial({
        ...reveal.composite,
        uniforms: {
          tDiffuse: { value: null },
          tGlow: { value: glowComposer.readBuffer.texture },
        },
      }),
    ),
  );
  composer.addPass(new OutputPass());
  composer.addPass(new SMAAPass());
  track(() => {
    disposeComposer(glowComposer);
    disposeComposer(composer);
  });

  let dirty = true;
  const rendered = { x: NaN, y: NaN, progress: NaN };

  function resize() {
    dirty = true;
    const { clientWidth: width, clientHeight: height } = container;
    const fill = width <= config.breakpoint ? config.fill.mobile : config.fill.desktop;

    camera.aspect = width / height;
    camera.position.setLength(
      Math.max(logoSize.y, logoSize.x / camera.aspect) / (2 * tanHalfFov * fill),
    );
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    glowComposer.setSize(width, height);
    composer.setSize(width, height);
  }

  container.appendChild(renderer.domElement);
  resize();
  window.addEventListener("resize", resize, { signal });

  renderer.setRenderTarget(composer.readBuffer);
  await renderer.compileAsync(scene, camera);
  if (signal.aborted) return;
  renderer.setRenderTarget(null);

  const pointer = { x: 0, y: 0, active: false };

  window.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType === "touch") return;
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
      pointer.active = true;
      dirty = true;
    },
    { passive: true, signal },
  );

  document.addEventListener(
    "pointerout",
    (event) => {
      if (!event.relatedTarget) {
        pointer.x = pointer.y = 0;
        pointer.active = false;
        dirty = true;
      }
    },
    { signal },
  );

  function follow(axis, target, ease) {
    const current = pivot.rotation[axis];
    pivot.rotation[axis] =
      Math.abs(target - current) < 1e-5 ? target : current + (target - current) * ease;
  }

  const timer = new THREE.Timer();
  timer.connect(document);
  track(() => timer.dispose());

  renderer.setAnimationLoop((time) => {
    timer.update(time);
    uniforms.uTime.value = timer.getElapsed();

    const { rotateX, rotateY, smoothing } = config.parallax;
    const ease = 1 - Math.exp(-timer.getDelta() / smoothing);
    follow("y", pointer.x * rotateY, ease);
    follow("x", pointer.y * rotateX, ease);

    const lightEase = 1 - Math.exp(-timer.getDelta() / 0.12);
    const lightZ = pointerLight.position.z;
    const viewDepth = Math.max(camera.position.z - lightZ, 0.1);
    const lightTargetX = pointer.x * viewDepth * tanHalfFov * camera.aspect;
    const lightTargetY = -pointer.y * viewDepth * tanHalfFov;

    pointerLight.position.x += (lightTargetX - pointerLight.position.x) * lightEase;
    pointerLight.position.y += (lightTargetY - pointerLight.position.y) * lightEase;
    pointerLight.intensity += ((pointer.active ? 3.5 : 0) - pointerLight.intensity) * lightEase;

    const lightMoving =
      Math.abs(lightTargetX - pointerLight.position.x) > 1e-4 ||
      Math.abs(lightTargetY - pointerLight.position.y) > 1e-4 ||
      Math.abs((pointer.active ? 8 : 0) - pointerLight.intensity) > 1e-3;

    const progress = uniforms.uRevealProgress.value;
    const revealing = progress < 1;
    const unchanged =
      pivot.rotation.x === rendered.x &&
      pivot.rotation.y === rendered.y &&
      progress === rendered.progress &&
      !lightMoving;

    if (!revealing && !dirty && unchanged) return;

    dirty = false;
    rendered.x = pivot.rotation.x;
    rendered.y = pivot.rotation.y;
    rendered.progress = progress;

    if (revealing) {
      uniforms.uGlowPass.value = 1;
      glowComposer.render();
      uniforms.uGlowPass.value = 0;
    }

    composer.render();
  });

  const tween = gsap
    .timeline({
      delay: delay + (untilHandoff() ?? 0),
      defaults: timing,
      onUpdate: () => (dirty = true),
    })
    .to(uniforms.uRevealProgress, { value: 1 }, 0)
    .to(intro.scale, { x: 1, y: 1, z: 1 }, 0)
    .to(intro.rotation, { y: 0 }, 0);

  track(() => tween.kill());
}