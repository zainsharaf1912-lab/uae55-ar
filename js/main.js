// UAE 55 — A Family's Story · حكاية وطن.. تجمعنا أسرة
// Entry point: renderer, scene graph, loop, input, AR / 3D mode switching.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SCENES, HOTSPOTS, AR_BASE_SCALE } from './config.js';
import { tween, Ease, updateTweens } from './utils/tween.js';
import { hydrateImages, loadJSON } from './utils/assets.js';
import { mergeStatic } from './utils/merge.js';
import { makeBoard, makeNeighbourhood, makeLife, animated } from './world/environment.js';
import { buildFamilyHouse } from './world/familyHouse.js';
import { animatePerson } from './world/characters.js';
import { makeNumber55, makeConfetti, makeHotspot } from './world/effects.js';
import { createTVProgram } from './tv/tvProgram.js';
import { AudioEngine } from './audio/audioEngine.js';
import { Narrator } from './audio/narration.js';
import { ARController, isARSupported } from './xr/arSession.js';
import { ARDebug, AR_DEBUG } from './xr/arDebug.js';
import { Director } from './scenes/director.js';
import { UI } from './ui/ui.js';

const nextFrame = () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));

class App {
  constructor() {
    this.ui = new UI();
    this.audio = new AudioEngine();
    this.narrator = new Narrator(this.audio);
    this.narrator.onState = on => this.ui.speaking(on);
    this.isAR = false; this.ready = false; this.started = false; this.elapsed = 0;
    this.hotspots = {};
  }

  async boot() {
    hydrateImages();
    if (!this.webglOK()) { this.ui.fatal('متصفحك لا يدعم الرسوميات ثلاثية الأبعاد (WebGL). جرّب أحدث إصدار من Chrome أو Safari.'); return; }
    this.bindUI();
    const preview = !!window.__PREVIEW__;
    const [arOK] = await Promise.all([preview ? false : isARSupported(), this.narrator.init()]);
    this.arSupported = arOK;
    // iPhone/iPad Safari has no WebXR: hand the same page to the Needle Go App Clip (WebXR on ARKit).
    this.iosLink = (!preview && !arOK && isIOS() && window.isSecureContext) ? appClipURL() : null;
    const launchedForAR = new URLSearchParams(location.search).has('ar');
    if (preview) this.ui.setDevice('warn', 'هذه معاينة مستضافة تعرض الحكاية كاملة في الوضع ثلاثي الأبعاد. الواقع المعزز بالكاميرا يعمل من النسخة المنشورة على رابط HTTPS.');
    else if (arOK) this.ui.setDevice('ok', launchedForAR ? 'الواقع المعزز جاهز. اضغط «ابدأ بالواقع المعزز» ثم اسمح باستخدام الكاميرا.' : 'جهازك يدعم الواقع المعزز (WebXR). جارٍ تجهيز الفريج…');
    else if (this.iosLink) this.ui.setDevice('warn', 'Safari على iPhone لا يدعم الواقع المعزز عبر الويب مباشرة. اضغط «ابدأ بالواقع المعزز على iPhone» لتُفتح التجربة نفسها داخل Needle Go بتتبع ARKit، أو تابع في الوضع ثلاثي الأبعاد.');
    else if (!window.isSecureContext) this.ui.setDevice('warn', 'الواقع المعزز يتطلب رابطاً آمناً (HTTPS). سيعمل الوضع ثلاثي الأبعاد.');
    else this.ui.setDevice('warn', 'هذا الجهاز أو المتصفح لا يدعم الواقع المعزز عبر الويب. ستعمل الحكاية كاملة في الوضع ثلاثي الأبعاد.');
    this.ui.showStartButtons({ ar: false, quicklook: false });
    try {
      await this.build(k => this.ui.progress(k));
      this.ready = true;
      this.ui.showStartButtons({ ar: arOK, iosLink: this.iosLink });
      if (arOK) this.ui.setDevice('ok', 'جهازك يدعم الواقع المعزز. جهّز طاولة أو أرضية جيدة الإضاءة.');
    } catch (e) {
      console.error(e);
      this.ui.fatal('حدث خطأ أثناء تحميل التجربة: ' + (e && e.message ? e.message : e));
    }
  }

  webglOK() {
    try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch { return false; }
  }

  // ----------------------------------------------------------------------------
  async build(progress) {
    const canvas = document.getElementById('scene-canvas');
    const renderer = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.xr.enabled = true;

    const scene = this.scene = new THREE.Scene();
    const camera = this.camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.05, 400);
    camera.position.set(...SCENES[0].cam.pos);
    const controls = this.controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true; controls.dampingFactor = 0.08; controls.minDistance = 2.2; controls.maxDistance = 70;
    controls.maxPolarAngle = 1.42; controls.maxDistance = 120; controls.target.set(...SCENES[0].cam.target); controls.update();

    // Scene graph:  anchor (AR placement) → userXf (pinch/rotate) → focusXf (chapter focus) → world
    this.anchor = new THREE.Group(); this.userXf = new THREE.Group(); this.focusXf = new THREE.Group(); this.world = new THREE.Group();
    this.world.name = 'world';
    scene.add(this.anchor); this.anchor.add(this.userXf); this.userXf.add(this.focusXf); this.focusXf.add(this.world);

    // Lights: warm sun + sky/terracotta bounce, tuned so the flat brand colours read true
    this.hemi = new THREE.HemisphereLight(0xFFF4E0, 0xC86757, 1.05); scene.add(this.hemi);
    const sun = this.sun = new THREE.DirectionalLight(0xFFF1DA, 2.3);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004;
    scene.add(sun); scene.add(sun.target);
    progress(0.1); await nextFrame();

    // Fonts must be ready before Arabic text is drawn into canvases (hotspots, TV)
    try { await Promise.all([document.fonts.load('600 40px SansAr'), document.fonts.load('700 26px Naskh'), document.fonts.load('400 26px Naskh')]); } catch { /* fallback fonts */ }

    this.tvProgram = createTVProgram('Naskh');
    const board = makeBoard(); this.world.add(board);
    progress(0.25); await nextFrame();
    const hood = makeNeighbourhood(); this.world.add(hood.group);
    progress(0.45); await nextFrame();
    this.world.add(makeLife());
    this.house = buildFamilyHouse(this.tvProgram.texture); this.world.add(this.house.group);
    progress(0.65); await nextFrame();

    const n55 = await loadJSON('assets/brand/number55.json');
    this.year55 = makeNumber55(n55, 9.2, 0.32); this.year55.position.set(-2.5, -0.4, 9.2); this.year55.visible = false;
    this.year55.userData.dynamic = true; this.world.add(this.year55);
    this.confetti = makeConfetti(); this.confetti.mesh.userData.dynamic = true; this.world.add(this.confetti.mesh);

    for (const [key, h] of Object.entries(HOTSPOTS)) {
      const pin = makeHotspot(h.label); pin.position.set(...h.pos); pin.visible = false; pin.userData.dynamic = true;
      pin.userData.pin.userData.tap = 'hs:' + key; this.world.add(pin); this.hotspots[key] = pin;
    }
    progress(0.8); await nextFrame();

    // Merge static geometry (mobile draw-call budget)
    const m1 = mergeStatic(hood.group), m2 = mergeStatic(this.house.group), m3 = mergeStatic(board);
    console.info('[perf] draw calls merged:', m1, m2, m3);
    this.tapTargets = [...this.house.refs.interactive, ...Object.values(this.hotspots).map(h => h.userData.pin)];
    progress(0.95); await nextFrame();

    this.director = new Director(this);
    this.ar = new ARController({
      renderer, scene, anchor: this.anchor, userXf: this.userXf, overlayRoot: document.getElementById('app'),
      onPlaced: () => { this.ui.arStatus('placed'); this.audio.sfx_('tap'); this.director.goTo(this.director.index < 0 ? 0 : this.director.index, { instant: true }); },
      onTapRay: rc => this.resolveTap(rc),
      onEnd: () => this.exitAR(),
      onStatus: s => this.ui.arStatus(s)
    });

    this.clock = new THREE.Clock();
    renderer.setAnimationLoop((time, frame) => this.loop(frame));
    window.addEventListener('resize', () => this.resize());
    this.bindPointer(canvas);
    if (AR_DEBUG) this.debug = new ARDebug(this); // temporary diagnostics: ?debug=1
    progress(1);
  }

  // ----------------------------------------------------------------------------
  bindUI() {
    const ui = this.ui;
    ui.on('start-3d', () => this.start3D());
    ui.on('start-ar', () => this.startAR());
    ui.on('next', () => this.director && this.director.next());
    ui.on('prev', () => this.director && this.director.prev());
    ui.on('goto', i => this.director && this.director.goTo(i));
    ui.on('replay', () => { const s = SCENES[this.director.index]; this.narrate(s.id, s.narration, true); });
    ui.on('sound', on => this.audio.setEnabled(on));
    ui.on('voice', on => { this.narrator.setEnabled(on); if (on) ui.toast('الراوي مفعّل'); });
    ui.on('exit', () => this.exit());
    ui.on('ar-rot-l', () => tween({ duration: 0.3, onUpdate: (k, r) => { this.userXf.rotation.y += 0.035; } }));
    ui.on('ar-rot-r', () => tween({ duration: 0.3, onUpdate: (k, r) => { this.userXf.rotation.y -= 0.035; } }));
    ui.on('ar-bigger', () => this.userXf.scale.multiplyScalar(1.2));
    ui.on('ar-smaller', () => this.userXf.scale.multiplyScalar(1 / 1.2));
    ui.on('ar-replace', () => this.ar.replace());
  }

  async waitReady() {
    if (this.ready) return;
    this.ui.show('loading');
    while (!this.ready) await new Promise(r => setTimeout(r, 100));
  }

  async start3D() {
    this.audio.unlock();
    await this.waitReady();
    this.isAR = false; this.ui.setMode(false); this.ui.show('hud');
    this.resize();
    this.director.goTo(0, { instant: this.director.index < 0 });
    if (!this.narrator.hasTTS) this.ui.toast('لا يتوفر صوت عربي على هذا الجهاز؛ النص المكتوب يرافق كل مشهد.', 4500);
  }

  async startAR() {
    this.audio.unlock();
    if (!this.ready) { this.ui.toast('لحظات… ما زلنا نجهّز الفريج'); return; }
    try {
      this.ui.show('hud'); this.ui.setMode(true); this.isAR = true;
      this.director.setHotspots([]);
      this.controls.enabled = false; // 3D-mode orbit controls must not react to touches during AR
      await this.ar.start(); // requests the camera
      // Where does this runtime draw the AR frame?
      //  • native compositor (Android Chrome): an opaque XR framebuffer; the page canvas must be hidden
      //  • page canvas (Needle Go on iPhone): framebuffer === null; the canvas IS the AR layer and must stay visible
      const bl = this.renderer.xr.getBaseLayer();
      const drawsToCanvas = !!bl && ('framebuffer' in bl) && bl.framebuffer === null;
      document.body.classList.toggle('xr-canvas', drawsToCanvas);
      this.applyARFocus(SCENES[Math.max(0, this.director.index)], true);
    } catch (e) {
      console.warn(e);
      this.isAR = false; this.ui.setMode(false); this.controls.enabled = true; document.body.classList.remove('xr-canvas');
      const denied = e && (e.name === 'NotAllowedError' || e.name === 'SecurityError');
      this.ui.toast(denied ? 'لم يُمنح إذن الكاميرا. يمكنك منح الإذن من إعدادات المتصفح، أو المتابعة في الوضع ثلاثي الأبعاد.' : 'تعذّر بدء الواقع المعزز على هذا الجهاز. انتقلنا إلى الوضع ثلاثي الأبعاد.', 6000);
      this.start3D();
    }
  }

  exitAR() {
    this.isAR = false; this.ui.setMode(false);
    document.body.classList.remove('xr-canvas'); this.controls.enabled = true;
    this.director.setAreeshLifted(false);
    this.focusXf.position.set(0, 0, 0); this.focusXf.scale.setScalar(1);
    if (this.exiting) { this.exiting = false; this.ui.show('splash'); }
    else if (this.director.index >= 0) { this.ui.show('hud'); this.focus(SCENES[this.director.index], true); }
    this.resize();
  }

  exit() {
    this.narrator.stop();
    if (this.isAR && this.ar.session) { this.exiting = true; this.ar.end(); }
    this.ui.hideSheet(); this.ui.hideFinale(); this.ui.show('splash');
    this.audio.stopAmbience(); this.audio.current = null;
  }

  /** Developer tool: download the whole procedural world as a .glb (for Blender / artists). Run __uae55.exportGLB() in the console. */
  async exportGLB() {
    const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
    const hidden = Object.values(this.hotspots).filter(h => h.visible); hidden.forEach(h => { h.visible = false; });
    try {
      const data = await new Promise((res, rej) => new GLTFExporter().parse(this.world, res, rej, { binary: true, onlyVisible: true }));
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: 'model/gltf-binary' }));
      a.download = 'uae55-world.glb'; a.click();
    } finally { hidden.forEach(h => { h.visible = true; }); }
  }

  narrate(id, text, force = false) {
    this.narrator.speak(id, text);
  }

  // ----------------------------------------------------------------------------
  focus(s, instant) {
    if (this.isAR) return this.applyARFocus(s, instant);
    const c = this.camera, ctl = this.controls;
    const p0 = c.position.clone(), t0 = ctl.target.clone();
    const { pos: p1, target: t1 } = this.camPose(s);
    if (this.camTween) this.camTween.cancel();
    if (instant) { c.position.copy(p1); ctl.target.copy(t1); ctl.update(); return; }
    ctl.enabled = false;
    this.camTween = tween({
      duration: 2.0, ease: Ease.inOut,
      onUpdate: k => {
        c.position.lerpVectors(p0, p1, k); c.position.y += Math.sin(k * Math.PI) * 2.5;
        ctl.target.lerpVectors(t0, t1, k);
      },
      onComplete: () => { ctl.enabled = true; ctl.update(); }
    });
  }

  /** Camera pose for a chapter, pulled back as needed so the chapter's frame fits narrow (portrait) screens. */
  camPose(s) {
    const target = new THREE.Vector3(...s.cam.target);
    const dir = new THREE.Vector3(...s.cam.pos).sub(target);
    const base = dir.length(); dir.normalize();
    const vHalf = THREE.MathUtils.degToRad(this.camera.fov / 2);
    const hHalf = Math.atan(Math.tan(vHalf) * this.camera.aspect);
    const need = (s.frame || 5) / Math.tan(Math.min(vHalf, hHalf));
    return { pos: target.clone().addScaledVector(dir, Math.max(base, need)), target };
  }

  applyARFocus(s, instant) {
    const sc = AR_BASE_SCALE * s.ar.zoom; const [tx, , tz] = s.ar.target;
    const to = new THREE.Vector3(-tx * sc, 1.17 * AR_BASE_SCALE, -tz * sc);
    const p0 = this.focusXf.position.clone(), s0 = this.focusXf.scale.x;
    if (this.arTween) this.arTween.cancel();
    if (instant) { this.focusXf.position.copy(to); this.focusXf.scale.setScalar(sc); return; }
    this.arTween = tween({ duration: 1.6, ease: Ease.inOut, onUpdate: k => { this.focusXf.position.lerpVectors(p0, to, k); this.focusXf.scale.setScalar(s0 + (sc - s0) * k); } });
  }

  // ----------------------------------------------------------------------------
  bindPointer(canvas) {
    let down = null;
    canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
    canvas.addEventListener('pointerup', e => {
      if (!down || this.isAR) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); const dt = performance.now() - down.t; down = null;
      if (moved > 10 || dt > 500) return;
      const rect = canvas.getBoundingClientRect();
      const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      const rc = new THREE.Raycaster(); rc.setFromCamera(ndc, this.camera);
      this.resolveTap(rc);
    });
  }

  resolveTap(raycaster) {
    if (!this.director || this.director.index < 0) return;
    const hits = raycaster.intersectObjects(this.tapTargets, true);
    for (const h of hits) {
      if (!visibleChain(h.object)) continue;
      let o = h.object; while (o && !o.userData.tap) o = o.parent;
      if (o) { this.director.handleTap(o.userData.tap); return; }
    }
  }

  resize() {
    if (!this.renderer || this.renderer.xr.isPresenting) return;
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    // lift the picture above the caption panel on tall phone screens
    if (h > w) this.camera.setViewOffset(w, h, 0, Math.round(h * 0.09), w, h); else this.camera.clearViewOffset();
    this.camera.updateProjectionMatrix(); this.renderer.setSize(w, h, false);
  }

  // ----------------------------------------------------------------------------
  loop(frame) {
    const dt = Math.min(0.05, this.clock.getDelta()); this.elapsed += dt; const t = this.elapsed;
    updateTweens(dt, t);
    for (const a of animated) a.update(t, dt);
    const refs = this.house.refs;
    for (const p of Object.values(refs.people)) if (p.visible) animatePerson(p, t, dt);
    for (const p of Object.values(refs.standing)) if (p.visible) animatePerson(p, t, dt);
    this.director.update(dt, t);
    this.confetti.update(t, dt);
    if (this.isAR) this.ar.update(frame);
    if (this.debug) this.debug.frame();
    else if (this.controls.enabled) this.controls.update();

    this.updateLights();
    this.updateHotspots(t);
    this.renderer.render(this.scene, this.camera);
  }

  updateLights() {
    const w = this.world; w.updateWorldMatrix(true, false);
    const s = w.getWorldScale(_v1).x;
    w.localToWorld(this.sun.target.position.set(-1, 0, 0));
    w.localToWorld(this.sun.position.set(13, 26, 15));
    const cam = this.sun.shadow.camera; const R = 18 * s;
    if (Math.abs(cam.right - R) > 1e-6) {
      cam.left = -R; cam.right = R; cam.top = R; cam.bottom = -R; cam.near = 0.5 * s; cam.far = 70 * s;
      cam.updateProjectionMatrix(); this.sun.shadow.normalBias = 0.02 * s;
    }
    const L = this.house.refs.lantern.userData; L.light.distance = L.baseDistance * s;
  }

  updateHotspots(t) {
    const cam = this.renderer.xr.isPresenting ? this.renderer.xr.getCamera() : this.camera;
    cam.getWorldQuaternion(_q1); cam.getWorldPosition(_v2);
    this.world.getWorldQuaternion(_q2).invert();
    const s = this.world.getWorldScale(_v1).x;
    for (const h of Object.values(this.hotspots)) {
      if (!h.visible) continue;
      h.quaternion.copy(_q2).multiply(_q1);
      let k;
      if (this.isAR) k = 0.06 / (1.6 * s);
      else { h.getWorldPosition(_v3); k = THREE.MathUtils.clamp(_v3.distanceTo(_v2) / 20, 0.75, 2.4); }
      h.scale.setScalar(k * (1 + Math.sin(t * 3 + h.position.x) * 0.04));
    }
  }
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
/** Same page, opened inside Needle Go (free App Clip that provides WebXR on ARKit). */
function appClipURL() {
  const u = new URL(location.href); u.hash = ''; u.searchParams.set('ar', '1');
  return 'https://appclip.needle.tools/ar?url=' + encodeURIComponent(u.toString());
}

const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3();
const _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
function visibleChain(o) { while (o) { if (!o.visible) return false; o = o.parent; } return true; }

const app = new App();
window.__uae55 = app; // debugging hook
app.boot();
