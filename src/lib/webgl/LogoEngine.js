// import * as THREE from "three";
// import gsap from "gsap";
// import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
// import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
// import { AsyncEngine } from "./AsyncEngine.js";

// let aspectRatio = "";

// export class LogoEngine extends AsyncEngine {
//   #container;

//   constructor(container, config) {
//     container.style.aspectRatio = aspectRatio;
//     super(start, container, config);
//     this.#container = container;
//   }

//   dispose() {
//     super.dispose();
//     this.#container.style.aspectRatio = "";
//   }
// }

// async function start(container, config, { signal, track }) {
//   const renderer = new THREE.WebGLRenderer({
//     alpha: true,
//     antialias: true,
//     powerPreference: "high-performance",
//   });
//   track(() => {
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
//   // Face the logo toward this viewer while keeping its original continuous rotation.
//   logo.rotation.x = Math.PI / 2;
//   track(() =>
//     logo.traverse((child) => {
//       if (!child.isMesh) return;
//       child.geometry.dispose();
//       for (const material of [child.material].flat()) {
//         for (const value of Object.values(material)) if (value?.isTexture) value.dispose();
//         material.dispose();
//       }
//     }),
//   );
//   if (signal.aborted) return;
//   const box = new THREE.Box3().setFromObject(logo);
//   const size = box.getSize(new THREE.Vector3());
//   const scale = 1 / Math.max(size.x, size.y);
//   const logoSize = new THREE.Vector2(size.x * scale, size.y * scale);

//   logo.scale.setScalar(scale);
//   logo.position.copy(box.getCenter(new THREE.Vector3())).multiplyScalar(-scale);

//   const pivot = new THREE.Group().add(logo);
//   scene.add(pivot);

//   const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(config.fov / 2));
//   aspectRatio = `${logoSize.x} / ${logoSize.y}`;
//   container.style.aspectRatio = aspectRatio;

//   function resize() {
//     const { clientWidth: width, clientHeight: height } = container;
//     if (!width || !height) return;

//     const margin = height * config.bleed;
//     const canvasWidth = width + 2 * margin;
//     const canvasHeight = height + 2 * margin;

//     camera.aspect = canvasWidth / canvasHeight;
//     const viewHeight = Math.max(
//       (logoSize.y * canvasHeight) / height,
//       (logoSize.x * canvasWidth) / width / camera.aspect,
//     );
//     camera.position.setLength(viewHeight / (2 * tanHalfFov));
//     camera.updateProjectionMatrix();

//     renderer.setSize(canvasWidth, canvasHeight);
//     renderer.domElement.style.left = `${-margin}px`;
//     renderer.domElement.style.top = `${-margin}px`;
//   }

//   container.appendChild(renderer.domElement);
//   resize();
//   const resizeObserver = new ResizeObserver(resize);
//   resizeObserver.observe(container);

//   const speed = (Math.PI * 2) / config.secondsPerTurn;
//   const perPixel = (Math.PI * 2 * config.scroll.intensity) / 1000;
//   let angle = 0;
//   let last, lastTop;

//   function render(time) {
//     const top = container.getBoundingClientRect().top;
//     angle += speed * (time - (last ?? time)) + ((lastTop ?? top) - top) * perPixel;
//     last = time;
//     lastTop = top;

//     pivot.rotation.y = angle;
//     renderer.render(scene, camera);
//   }

//   const intersectionObserver = new IntersectionObserver(([entry]) => {
//     last = lastTop = undefined;
//     gsap.ticker.remove(render);
//     if (entry.isIntersecting) gsap.ticker.add(render);
//   });
//   intersectionObserver.observe(container);
//   track(() => {
//     gsap.ticker.remove(render);
//     resizeObserver.disconnect();
//     intersectionObserver.disconnect();
//   });
// }

import * as THREE from "three";
import gsap from "gsap";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { AsyncEngine } from "./AsyncEngine.js";

let aspectRatio = "";

export class LogoEngine extends AsyncEngine {
  #container;

  constructor(container, config) {
    container.style.aspectRatio = aspectRatio;
    super(start, container, config);
    this.#container = container;
  }

  dispose() {
    super.dispose();
    this.#container.style.aspectRatio = "";
  }
}

async function start(container, config, { signal, track }) {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });

  track(() => {
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

  // A cool moving light makes the silver finish respond to the pointer.
  const pointerLight = new THREE.PointLight("#58748c", 0, 2.8, 2);
  scene.add(pointerLight);

  const camera = new THREE.PerspectiveCamera(config.fov, 1, 0.1, 100);
  camera.position.set(0, 0, 5);

  const { scene: logo } = await gltf;

  // Face the logo toward this viewer while keeping its original continuous rotation.
  logo.rotation.x = Math.PI / 2;

  track(() =>
    logo.traverse((child) => {
      if (!child.isMesh) return;

      child.geometry.dispose();

      for (const material of [child.material].flat()) {
        for (const value of Object.values(material)) if (value?.isTexture) value.dispose();
        material.dispose();
      }
    }),
  );

  if (signal.aborted) return;

  const box = new THREE.Box3().setFromObject(logo);
  const size = box.getSize(new THREE.Vector3());
  const scale = 1 / Math.max(size.x, size.y);
  const logoSize = new THREE.Vector2(size.x * scale, size.y * scale);

  logo.scale.setScalar(scale);
  logo.position.copy(box.getCenter(new THREE.Vector3())).multiplyScalar(-scale);

  const pivot = new THREE.Group().add(logo);
  scene.add(pivot);

  const pointer = { x: 0, y: 0, active: false };

  window.addEventListener(
    "pointermove",
    (event) => {
      if (event.pointerType === "touch") return;

      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
      pointer.active = true;
    },
    { passive: true, signal },
  );

  document.addEventListener(
    "pointerout",
    (event) => {
      if (!event.relatedTarget) {
        pointer.x = pointer.y = 0;
        pointer.active = false;
      }
    },
    { signal },
  );

  const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(config.fov / 2));
  aspectRatio = `${logoSize.x} / ${logoSize.y}`;
  container.style.aspectRatio = aspectRatio;

  function resize() {
    const { clientWidth: width, clientHeight: height } = container;
    if (!width || !height) return;

    const margin = height * config.bleed;
    const canvasWidth = width + 2 * margin;
    const canvasHeight = height + 2 * margin;

    camera.aspect = canvasWidth / canvasHeight;

    const viewHeight = Math.max(
      (logoSize.y * canvasHeight) / height,
      (logoSize.x * canvasWidth) / width / camera.aspect,
    );

    camera.position.setLength(viewHeight / (2 * tanHalfFov));
    camera.updateProjectionMatrix();

    renderer.setSize(canvasWidth, canvasHeight);
    renderer.domElement.style.left = `${-margin}px`;
    renderer.domElement.style.top = `${-margin}px`;
  }

  container.appendChild(renderer.domElement);
  resize();

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  const speed = (Math.PI * 2) / config.secondsPerTurn;
  const perPixel = (Math.PI * 2 * config.scroll.intensity) / 1000;

  let angle = 0;
  let last;
  let lastTop;

  function render(time) {
    const top = container.getBoundingClientRect().top;

    angle += speed * (time - (last ?? time)) + ((lastTop ?? top) - top) * perPixel;
    last = time;
    lastTop = top;

    pivot.rotation.x = pointer.y * 0.14;
    pivot.rotation.y = angle + pointer.x * 0.18;

    const lightZ = 0.38;
    const viewDepth = Math.max(camera.position.z - lightZ, 0.1);

    pointerLight.position.set(
      pointer.x * viewDepth * tanHalfFov * camera.aspect,
      -pointer.y * viewDepth * tanHalfFov,
      lightZ,
    );
    pointerLight.intensity = pointer.active ? 3.5 : 0;

    renderer.render(scene, camera);
  }

  const intersectionObserver = new IntersectionObserver(([entry]) => {
    last = lastTop = undefined;
    gsap.ticker.remove(render);

    if (entry.isIntersecting) gsap.ticker.add(render);
  });

  intersectionObserver.observe(container);

  track(() => {
    gsap.ticker.remove(render);
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
  });
}