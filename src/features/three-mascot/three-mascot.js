/**
 * effects/three-mascot
 * ------------------------------------------------------------------------
 * Een levende 3D-mascotte (standaard: een gestileerde bij, volledig
 * procedureel — geen assets van derden) die idle beweegt, licht met de muis
 * meedraait en met de scroll meedraait. three.js wordt lokaal gevendord
 * (`vendor/`, three.module.min.js + GLTFLoader/BufferGeometryUtils, MIT) en
 * pas met een dynamic import geladen zodra de mascotte (bijna) in beeld
 * komt. Vanilla ES-module, SSR-veilig: raakt window/document pas aan binnen
 * init(). 0 dependencies in de kern; three.js is de gedocumenteerde
 * uitzondering (R7) en wordt lazy geladen.
 *
 * Eigen implementatie.
 *
 * @typedef {Object} ThreeMascotOptions
 * @property {string} [modelUrl] URL naar een eigen GLB-model (overschrijft `data-model` op de root).
 * @property {'bij'|'hond'} [vorm] Procedureel model (overschrijft `data-vorm`); standaard 'bij'.
 * @property {Object} [kleuren] Alleen bij vorm 'hond': vacht/aftekening/halsband/... als hex-getal.
 * @property {number} [maxDpr] Bovengrens pixelratio (standaard 2).
 *
 * @param {Element} root Container met `aspect-ratio` (CSS) en een `<img data-mascot-poster>` als fallback/poster.
 * @param {ThreeMascotOptions} [options]
 * @returns {() => void} destroy — stopt de renderloop, disposet alle GPU-resources en toont de poster weer. Idempotent.
 */
import { minderBeweging, isTouch, inBeeld, vereisRoot } from '../../_kwaliteit/basis.js';
import { bouwHond, animeerHond } from './hond.js';

// christianbleeker: vaste paden in public/vendor/three. Turbopack hasht new URL(...)-assets, waarna
// GLTFLoader zijn relatieve import niet meer vindt. Alleen three.module.min.js staat er: de Werkplaats
// gebruikt het procedurele model (geen data-model), dus GLTFLoader wordt nooit geladen.
const VENDOR_THREE_URL = '/vendor/three/three.module.min.js';
const VENDOR_GLTF_URL = '/vendor/three/GLTFLoader.js';

export function init(root, options = {}) {
  if (!vereisRoot(root, 'three-mascot')) return () => {};

  const doc = root.ownerDocument || document;
  const win = doc.defaultView || window;

  const modelUrl = options.modelUrl || root.getAttribute('data-model') || null;
  const forcePosterMobile = root.getAttribute('data-mobiel') === 'poster';
  const posterEl = root.querySelector('[data-mascot-poster]');
  const touch = isTouch(doc);
  const vorm = options.vorm || root.getAttribute('data-vorm') || 'bij';
  const maxDpr = options.maxDpr || Number(root.getAttribute('data-max-dpr')) || 2;
  let hond = null;
  let lastMove = -10;

  let destroyed = false;
  let reduced = false;
  const motion = minderBeweging((v) => {
    reduced = v;
    if (v) { stopRenderLoop(); showPoster(); }
  }, doc);
  reduced = motion.reduced;

  function supportsWebGL() {
    try {
      const test = doc.createElement('canvas');
      return !!(test.getContext('webgl2') || test.getContext('webgl'));
    } catch {
      return false;
    }
  }

  function showPoster() {
    if (canvas) canvas.hidden = true;
    if (posterEl) posterEl.hidden = false;
  }
  function showCanvas() {
    if (posterEl) posterEl.hidden = true;
    if (canvas) canvas.hidden = false;
  }

  // --- state, gevuld zodra geladen ---------------------------------------
  let THREE = null;
  let canvas = null;
  let renderer = null;
  let scene = null;
  let camera = null;
  let group = null;
  let wingMeshes = [];
  let visIO = null;
  let isVisible = false;
  let running = false;
  let rafId = 0;
  let frameCount = 0;
  let disposedCount = 0;
  let time = 0;
  let targetRotX = 0;
  let targetRotY = 0;
  let curRotX = 0;
  let curRotY = 0;
  let scrollProgress = 0;

  const debug = {
    getFrameCount: () => frameCount,
    isRunning: () => running,
    getDisposedCount: () => disposedCount,
    hasCanvas: () => !!canvas,
    isEligible: () => eligible,
    getVorm: () => vorm,
    getKopRotY: () => (hond ? hond.delen.kop.rotation.y : null),
  };
  root.__mascotDebug = debug;

  const eligible = !reduced && !(touch && forcePosterMobile) && supportsWebGL();

  if (!eligible) {
    return function destroy() {
      if (destroyed) return;
      destroyed = true;
      motion.stop();
      delete root.__mascotDebug;
    };
  }

  const stopInBeeld = inBeeld(root, () => { load(); }, { rootMargin: '600px', once: true });

  async function load() {
    if (destroyed) return;
    let mod;
    try {
      mod = await import(/* webpackIgnore: true */ VENDOR_THREE_URL);
    } catch (err) {
      if (typeof console !== 'undefined') console.warn('three-mascot: kon three.js niet laden', err);
      showPoster();
      return;
    }
    if (destroyed) return;
    THREE = mod;
    buildGL();
    if (modelUrl) loadCustomModel(modelUrl);
    startObservingVisibility();
  }

  function buildGL() {
    canvas = doc.createElement('canvas');
    canvas.className = 'tm-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    root.appendChild(canvas);

    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    } catch (err) {
      if (typeof console !== 'undefined') console.warn('three-mascot: WebGLRenderer kon niet starten', err);
      canvas.remove();
      canvas = null;
      showPoster();
      return;
    }
    renderer.setPixelRatio(Math.min(win.devicePixelRatio || 1, maxDpr));

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 6);
    if (vorm === 'hond') camera.position.set(0, -0.1, 7.4);

    scene.add(new THREE.HemisphereLight(0xfff3d6, 0x2c2410, 0.95));
    const dir = new THREE.DirectionalLight(0xffffff, 1.15);
    dir.position.set(3, 4, 5);
    scene.add(dir);

    group = buildProceduralMascot();
    scene.add(group);

    onResize();

    canvas.addEventListener('webglcontextlost', onContextLost, false);
    canvas.addEventListener('webglcontextrestored', onContextRestored, false);
    win.addEventListener('resize', onResize);
    // de hond kijkt de hele pagina rond; de bij reageert alleen op zijn eigen vlak
    if (!touch) (vorm === 'hond' ? win : root).addEventListener('pointermove', onPointerMove, { passive: true });
    win.addEventListener('scroll', onScroll, { passive: true });

    showCanvas();
  }

  /** Eigen, procedureel bij-achtig standaardmodel — geen assets van derden. */
  function buildProceduralMascot() {
    if (vorm === 'hond') {
      hond = bouwHond(THREE, options.kleuren);
      wingMeshes = [];
      return hond.group;
    }
    const g = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffc83d, roughness: 0.45, metalness: 0.05 });
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.55 });
    const wingMat = new THREE.MeshPhysicalMaterial({
      color: 0xeaf6ff, roughness: 0.2, transmission: 0.75, thickness: 0.2, transparent: true, opacity: 0.75,
    });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x0f0f0f, roughness: 0.3 });

    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), bodyMat);
    body.scale.set(1, 0.82, 0.82);
    g.add(body);

    for (let i = 0; i < 3; i += 1) {
      const stripe = new THREE.Mesh(new THREE.TorusGeometry(1.001, 0.12, 10, 24), stripeMat);
      stripe.rotation.y = Math.PI / 2;
      stripe.scale.set(0.82, 0.82, 1);
      stripe.position.x = -0.15 + i * 0.32;
      g.add(stripe);
    }

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 20, 16), bodyMat);
    head.position.x = -1.15;
    g.add(head);

    const eyeGeo = new THREE.SphereGeometry(0.11, 10, 10);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(-1.45, 0.18, 0.4); g.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(-1.45, 0.18, -0.4); g.add(eyeR);

    const stinger = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.55, 12), stripeMat);
    stinger.rotation.z = -Math.PI / 2;
    stinger.position.x = 1.25;
    g.add(stinger);

    const wingGeo = new THREE.PlaneGeometry(0.9, 0.55, 1, 1);
    const wingL = new THREE.Mesh(wingGeo, wingMat);
    wingL.position.set(-0.1, 0.55, 0.25);
    wingL.rotation.x = -0.3;
    g.add(wingL);
    const wingR = new THREE.Mesh(wingGeo, wingMat);
    wingR.position.set(-0.1, 0.55, -0.25);
    wingR.rotation.x = 0.3;
    g.add(wingR);

    wingMeshes = [wingL, wingR];
    return g;
  }

  async function loadCustomModel(url) {
    let mod;
    try {
      mod = await import(/* webpackIgnore: true */ VENDOR_GLTF_URL);
    } catch (err) {
      if (typeof console !== 'undefined') console.warn('three-mascot: GLTFLoader kon niet laden, procedureel model blijft staan', err);
      return;
    }
    if (destroyed || !scene) return;
    const loader = new mod.GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        if (destroyed || !scene) return;
        disposeObject(group);
        scene.remove(group);
        const next = new THREE.Group();
        next.add(gltf.scene);
        // Grof auto-fit zodat een aangeleverd GLB ongeveer dezelfde
        // beeldvullende grootte krijgt als het procedurele model.
        const box = new THREE.Box3().setFromObject(gltf.scene);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const scale = 2.1 / maxDim;
        gltf.scene.scale.setScalar(scale);
        gltf.scene.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
        group = next;
        scene.add(group);
        wingMeshes = [];
        hond = null;
      },
      undefined,
      (err) => {
        if (typeof console !== 'undefined') console.warn('three-mascot: kon GLB niet laden, procedureel model blijft staan', err);
      },
    );
  }

  // --- interactie: muis-parallax + scroll-rotatie -------------------------
  function onPointerMove(e) {
    const rect = root.getBoundingClientRect();
    if (vorm === 'hond') {
      const nx = (e.clientX - (rect.left + rect.width / 2)) / Math.max(win.innerWidth * 0.5, 1);
      const ny = (e.clientY - (rect.top + rect.height * 0.32)) / Math.max(win.innerHeight * 0.5, 1);
      targetRotY = Math.max(-0.75, Math.min(0.75, nx * 0.9));
      targetRotX = Math.max(-0.3, Math.min(0.45, ny * 0.55));
      lastMove = time;
      return;
    }
    const nx = ((e.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
    const ny = ((e.clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1;
    targetRotY = nx * 0.35;
    targetRotX = ny * 0.2;
  }

  let scrollRaf = 0;
  function onScroll() {
    if (scrollRaf) return;
    scrollRaf = win.requestAnimationFrame(() => {
      scrollRaf = 0;
      const rect = root.getBoundingClientRect();
      const vh = win.innerHeight || doc.documentElement.clientHeight || 1;
      scrollProgress = Math.max(-1, Math.min(1, 1 - (rect.top + rect.height / 2) / vh));
    });
  }

  function onResize() {
    if (!renderer || !camera) return;
    const w = Math.max(root.clientWidth, 1);
    const h = Math.max(root.clientHeight, 1);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  // --- renderloop -----------------------------------------------------------
  function frame() {
    if (destroyed || !running) return;
    time += 1 / 60;
    if (hond) {
      const k = root.dataset.kijk;
      animeerHond(hond, {
        time, lastMove, targetX: targetRotX, targetY: targetRotY, scroll: scrollProgress,
        kijk: k === 'rechts' ? 0.38 : k === 'midden' ? 0 : -0.38,
      });
    } else if (group) {
      curRotX += (targetRotX - curRotX) * 0.06;
      curRotY += (targetRotY - curRotY) * 0.06;
      group.rotation.x = curRotX + Math.sin(time * 1.6) * 0.03;
      group.rotation.y = curRotY + scrollProgress * 0.6;
      group.position.y = Math.sin(time * 1.8) * 0.12;
      wingMeshes.forEach((w, i) => {
        w.rotation.z = (i === 0 ? 1 : -1) * Math.sin(time * 22) * 0.5;
      });
    }
    if (renderer && scene && camera) renderer.render(scene, camera);
    frameCount += 1;
    rafId = win.requestAnimationFrame(frame);
  }

  function startRenderLoop() {
    if (running || destroyed || !renderer) return;
    running = true;
    rafId = win.requestAnimationFrame(frame);
  }
  function stopRenderLoop() {
    running = false;
    if (rafId) win.cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function startObservingVisibility() {
    if ('IntersectionObserver' in win) {
      visIO = new win.IntersectionObserver((entries) => {
        for (const e of entries) {
          isVisible = e.isIntersecting;
          if (isVisible && !doc.hidden) startRenderLoop(); else stopRenderLoop();
        }
      }, { threshold: 0.01 });
      visIO.observe(root);
    } else {
      isVisible = true;
      startRenderLoop();
    }
  }

  function onVisibilityChange() {
    if (doc.hidden) stopRenderLoop();
    else if (isVisible) startRenderLoop();
  }
  doc.addEventListener('visibilitychange', onVisibilityChange);

  // --- contextverlies ---------------------------------------------------
  function onContextLost(e) {
    e.preventDefault();
    stopRenderLoop();
  }
  function onContextRestored() {
    if (destroyed) return;
    disposeObject(group);
    group = buildProceduralMascot();
    scene.add(group);
    if (isVisible && !doc.hidden) startRenderLoop();
  }

  // --- opruimen -----------------------------------------------------------
  function disposeObject(obj) {
    if (!obj || !obj.traverse) return;
    obj.traverse((node) => {
      if (node.geometry) { node.geometry.dispose(); disposedCount += 1; }
      if (node.material) {
        const mats = Array.isArray(node.material) ? node.material : [node.material];
        mats.forEach((m) => {
          if (m.map) m.map.dispose();
          m.dispose();
          disposedCount += 1;
        });
      }
    });
  }

  return function destroy() {
    if (destroyed) return;
    destroyed = true;
    motion.stop();
    stopInBeeld();
    stopRenderLoop();
    doc.removeEventListener('visibilitychange', onVisibilityChange);
    win.removeEventListener('resize', onResize);
    win.removeEventListener('scroll', onScroll);
    if (scrollRaf) win.cancelAnimationFrame(scrollRaf);
    root.removeEventListener('pointermove', onPointerMove);
    win.removeEventListener('pointermove', onPointerMove);
    if (visIO) { visIO.disconnect(); visIO = null; }
    if (group) { disposeObject(group); group = null; }
    if (renderer) {
      renderer.dispose();
      disposedCount += 1;
      if (typeof renderer.forceContextLoss === 'function') renderer.forceContextLoss();
      renderer = null;
    }
    scene = null;
    camera = null;
    if (canvas) {
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      canvas.remove();
      canvas = null;
    }
    if (posterEl) posterEl.hidden = false;
    delete root.__mascotDebug;
  };
}
