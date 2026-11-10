// TEMPORARY AR diagnostics — only active when the page URL contains ?debug=1.
// Shows session / surface / placement / world / render status and two unlit diagnostic cubes:
//   magenta cube: always 35 cm in front of the AR camera  → proves the 3D layer is drawn at all
//   cyan cube:    at the placement point (anchor origin)   → proves placement + transforms
// Nothing here touches the experience's own models. Remove the ?debug flag to hide everything.
import * as THREE from 'three';

export const AR_DEBUG = typeof location !== 'undefined' && new URLSearchParams(location.search).has('debug');

export class ARDebug {
  constructor(app) {
    this.app = app; this.errors = []; this.frames = 0; this.fps = 0; this._fc = 0; this._t0 = performance.now();
    const panel = this.panel = document.createElement('pre');
    panel.id = 'ar-debug';
    panel.setAttribute('dir', 'ltr');
    panel.style.cssText = 'position:fixed;left:6px;right:6px;top:auto;bottom:calc(env(safe-area-inset-bottom,0px) + 210px);max-height:30vh;overflow:hidden;z-index:50;margin:0;padding:5px 7px;' +
      'background:rgba(0,0,0,.55);color:#9f9;font:9.5px/1.3 ui-monospace,Menlo,monospace;white-space:pre-wrap;pointer-events:none;border:1px solid #f0f';
    document.getElementById('app').appendChild(panel);
    const push = m => { this.errors.push(String(m).slice(0, 160)); if (this.errors.length > 5) this.errors.shift(); };
    window.addEventListener('error', e => push('error: ' + (e.message || e)));
    window.addEventListener('unhandledrejection', e => push('promise: ' + (e.reason && e.reason.message || e.reason)));
    const ce = console.error.bind(console); console.error = (...a) => { push('console: ' + a.join(' ')); ce(...a); };

    const cube = (size, color) => { const m = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), new THREE.MeshBasicMaterial({ color })); m.frustumCulled = false; return m; };
    this.camCube = cube(0.04, 0xff00ff); this.camCube.name = 'debug-camera-cube'; this.camCube.visible = false; app.scene.add(this.camCube);
    this.anchorCube = cube(0.05, 0x00ffff); this.anchorCube.name = 'debug-anchor-cube'; this.anchorCube.position.y = 0.025; app.anchor.add(this.anchorCube);
    this._p = new THREE.Vector3(); this._d = new THREE.Vector3(); this._s = new THREE.Vector3();
    setInterval(() => this.render(), 500);
    this.render();
  }

  /** Called every frame from the render loop. */
  frame() {
    const a = this.app; this.frames++; this._fc++;
    const now = performance.now(); if (now - this._t0 > 1000) { this.fps = Math.round(this._fc * 1000 / (now - this._t0)); this._fc = 0; this._t0 = now; }
    const presenting = a.renderer.xr.isPresenting;
    this.camCube.visible = presenting;
    if (presenting) {
      const cam = a.renderer.xr.getCamera();
      // 35 cm ahead, offset to the upper-left of the view so it never hides the world
      this.camCube.position.set(-0.07, 0.1, -0.35);
      cam.localToWorld(this.camCube.position);
      this.camCube.rotation.y += 0.03; this.camCube.rotation.x += 0.02;
    }
  }

  render() {
    const a = this.app, r = a.renderer, ar = a.ar, s = ar && ar.session;
    const f = n => (Math.round(n * 1000) / 1000).toFixed(3);
    const v = o => `${f(o.x)}, ${f(o.y)}, ${f(o.z)}`;
    const canvas = document.getElementById('scene-canvas'); const cs = getComputedStyle(canvas);
    const bl = r.xr.getBaseLayer && r.xr.getBaseLayer();
    let meshes = 0, total = 0;
    if (a.world) a.world.traverse(o => { if (o.isMesh) { total++; let p = o, vis = true; while (p) { if (!p.visible) { vis = false; break; } p = p.parent; } if (vis) meshes++; } });
    const ws = a.world ? a.world.getWorldScale(this._s).x : 0;
    const anchorP = a.anchor ? a.anchor.getWorldPosition(this._p.clone()) : null;
    let camP = '—'; if (r.xr.isPresenting) { const c = r.xr.getCamera(); camP = v(c.getWorldPosition(new THREE.Vector3())); }
    const gl = r.getContext(); const glErr = gl.getError();
    const lines = [
      'AR DEBUG (temporary — remove ?debug=1 from the URL to hide)',
      `navigator.xr: ${'xr' in navigator ? 'yes' : 'NO'}   secure: ${window.isSecureContext}   mode: ${a.isAR ? 'AR' : '3D'}`,
      `session: ${s ? 'ACTIVE' : 'none'}   presenting: ${r.xr.isPresenting}   blend: ${s ? s.environmentBlendMode : '—'}   overlay: ${s && s.domOverlayState ? s.domOverlayState.type : '—'}`,
      `base layer: ${bl ? (bl.constructor && bl.constructor.name) : '—'}   framebuffer: ${bl ? (bl.framebuffer === null ? 'null (draws into page canvas)' : (bl.framebuffer === undefined ? 'n/a' : 'native')) : '—'}`,
      `canvas: visibility=${cs.visibility} display=${cs.display} ${canvas.width}x${canvas.height}   body: ${document.body.className || '—'}`,
      `surface: hits=${ar ? ar.lastHits : '—'}   reticle=${ar && ar.reticle.visible}   placed=${ar ? ar.placed : '—'}   touchTaps=${ar ? !!ar.touchWorks : '—'}`,
      `anchor pos (m): ${anchorP ? v(anchorP) : '—'}   anchor visible: ${a.anchor ? a.anchor.visible : '—'}`,
      `world scale: ${ws.toFixed(5)} m/unit  → board ${(ws * 28).toFixed(2)} m   user scale: ${a.userXf ? a.userXf.scale.x.toFixed(2) : '—'}`,
      `xr camera pos (m): ${camP}   near/far: ${a.camera ? a.camera.near + '/' + a.camera.far : '—'}`,
      `meshes visible: ${meshes}/${total}   draw calls: ${r.info.render.calls}   triangles: ${r.info.render.triangles}`,
      `frames: ${this.frames}   fps: ${this.fps}   scene: ${a.director ? a.director.index + 1 : '—'}/7   gl error: ${glErr}`,
      `errors: ${this.errors.length ? '\n  ' + this.errors.join('\n  ') : 'none'}`,
      `ua: ${navigator.userAgent.slice(0, 110)}`
    ];
    this.panel.textContent = lines.join('\n');
  }
}
