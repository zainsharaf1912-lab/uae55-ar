// WebXR immersive-ar: surface detection (hit-test), tap-to-place, tap-to-interact, two-finger rotate/scale.
//
// Runs on:
//  • Android Chrome with Google Play Services for AR (native WebXR)
//  • iPhone / iPad through the Needle Go App Clip, which exposes the same WebXR API on top of ARKit
//    (iOS Safari itself has no WebXR — see docs/IPHONE_AR.md)
//
// Input model (v2): when the DOM overlay is active, a tap is turned into a ray through the touched screen
// point using the XR camera. This is the most portable path across WebXR implementations. `select`
// events are still handled (rays from the input source), and the two paths are de-duplicated so a tap
// never fires twice.
import * as THREE from 'three';

export async function isARSupported() {
  if (!('xr' in navigator) || !window.isSecureContext) return false;
  try { return await navigator.xr.isSessionSupported('immersive-ar'); } catch { return false; }
}

const UI_SELECTOR = 'button, a, summary, input, .sheet, .caption-card, .scene-menu, .hud-title, .hud-tools, .finale-card, .ar-controls, .nav-row';

export class ARController {
  constructor({ renderer, scene, anchor, userXf, overlayRoot, onPlaced, onTapRay, onEnd, onStatus }) {
    Object.assign(this, { renderer, scene, anchor, userXf, overlayRoot, onPlaced, onTapRay, onEnd, onStatus });
    this.session = null; this.hitSource = null; this.placed = false; this.lastGesture = 0;
    this.lastTapAt = -1e9; this.overlay = false; this._tap = null;
    this.reticle = this._makeReticle(); this.reticle.visible = false; scene.add(this.reticle);
    this._touch = this._touch.bind(this);
    this._beforeSelect = e => {
      if (e.target && e.target.closest && e.target.closest(UI_SELECTOR)) e.preventDefault();
    };
  }

  _makeReticle() {
    const g = new THREE.Group(); g.matrixAutoUpdate = false;
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.035, 0.045, 36).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xF1ECD6 }));
    g.add(ring);
    // footprint of the 0.5 m board so the visitor sees how much space is needed
    const pts = [[-0.25, -0.25], [0.25, -0.25], [0.25, 0.25], [-0.25, 0.25], [-0.25, -0.25]].map(([x, z]) => new THREE.Vector3(x, 0, z));
    const outline = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xD1E8CC }));
    g.add(outline);
    return g;
  }

  async start() {
    const full = {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay', 'light-estimation'],
      domOverlay: { root: this.overlayRoot }
    };
    let session;
    try {
      session = await navigator.xr.requestSession('immersive-ar', full);
    } catch (e) {
      // Some runtimes reject unknown optional features: retry with the essentials only.
      if (e && (e.name === 'NotAllowedError' || e.name === 'SecurityError')) throw e;
      session = await navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['hit-test'], optionalFeatures: ['dom-overlay'], domOverlay: { root: this.overlayRoot } });
    }
    this.session = session; this.placed = false; this._found = false; this.touchWorks = false;
    this.overlay = !!session.domOverlayState;
    this.renderer.xr.setReferenceSpaceType('local');
    await this.renderer.xr.setSession(session);
    const viewer = await session.requestReferenceSpace('viewer');
    this.hitSource = await session.requestHitTestSource({ space: viewer });
    session.addEventListener('select', e => this._onSelect(e));
    session.addEventListener('end', () => this._cleanup());
    this.overlayRoot.addEventListener('beforexrselect', this._beforeSelect);
    this.overlayRoot.addEventListener('touchstart', this._touch, { passive: false });
    this.overlayRoot.addEventListener('touchmove', this._touch, { passive: false });
    this.overlayRoot.addEventListener('touchend', this._touch);
    this.anchor.visible = false;
    this.onStatus && this.onStatus('scanning', this.overlay);
    return session;
  }

  end() { if (this.session) this.session.end(); }

  replace() { this.placed = false; this.anchor.visible = false; this._found = false; this.onStatus && this.onStatus('scanning'); }

  /** Call every XR frame. */
  update(frame) {
    if (!frame || !this.hitSource || this.placed) { this.reticle.visible = false; return; }
    const ref = this.renderer.xr.getReferenceSpace();
    const hits = frame.getHitTestResults(this.hitSource);
    if (hits.length) {
      const pose = hits[0].getPose(ref);
      if (pose) {
        this.reticle.visible = true; this.reticle.matrix.fromArray(pose.transform.matrix);
        if (!this._found) { this._found = true; this.onStatus && this.onStatus('found'); }
        return;
      }
    }
    this.reticle.visible = false;
  }

  // ---------------------------------------------------------------- placement + taps
  _place() {
    if (!this.reticle.visible) return false;
    const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
    this.reticle.matrix.decompose(p, q, s);
    this.anchor.position.copy(p);
    // face the visitor: the scene's front (+z, the street) turns toward the camera
    const cam = this.renderer.xr.getCamera(); const cp = new THREE.Vector3(); cam.getWorldPosition(cp);
    this.anchor.rotation.set(0, Math.atan2(cp.x - p.x, cp.z - p.z), 0);
    this.anchor.visible = true; this.placed = true; this.reticle.visible = false;
    this.onPlaced && this.onPlaced();
    return true;
  }

  /** One tap, from either input path. `ray` is a Raycaster or null (placement only needs the reticle). */
  _act(ray, source) {
    const now = performance.now();
    if (now - this.lastTapAt < 350) return;          // the other path already handled this tap
    if (now - this.lastGesture < 450) return;        // end of a pinch/twist, not a tap
    this.lastTapAt = now;
    this.lastSource = source;
    if (!this.placed) { this._place(); return; }
    if (ray && this.onTapRay) this.onTapRay(ray);
  }

  /** Ray through a screen point, using the XR camera that rendered the last frame. */
  rayFromScreen(clientX, clientY) {
    const xrCam = this.renderer.xr.getCamera();
    const cam = (xrCam.cameras && xrCam.cameras.length) ? xrCam.cameras[0] : xrCam;
    const ndc = new THREE.Vector2((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
    const rc = new THREE.Raycaster(); rc.near = 0.01; rc.far = 20;
    rc.setFromCamera(ndc, cam);
    return rc;
  }

  _onSelect(e) {
    // Compute the ray now: the XR frame is only valid during the event.
    let ray = null;
    try {
      const ref = this.renderer.xr.getReferenceSpace();
      const pose = e.frame && e.inputSource && e.frame.getPose(e.inputSource.targetRaySpace, ref);
      if (pose) {
        const m = new THREE.Matrix4().fromArray(pose.transform.matrix);
        const origin = new THREE.Vector3().setFromMatrixPosition(m);
        const dir = new THREE.Vector3(0, 0, -1).applyMatrix4(new THREE.Matrix4().extractRotation(m)).normalize();
        ray = new THREE.Raycaster(origin, dir, 0.01, 20);
      }
    } catch { /* runtime without input-source poses: the screen-tap path covers it */ }
    if (!this.overlay) { this._act(ray, 'select'); return; }
    // With a DOM overlay the touch handler is preferred (exact screen point). Once a touch tap has been
    // seen in this session, `select` is ignored for good; before that, it waits briefly so touch can win.
    if (this.touchWorks) return;
    const t = performance.now();
    setTimeout(() => { if (!this.touchWorks && this.lastTapAt < t - 300) this._act(ray, 'select'); }, 220);
  }

  _touch(e) {
    if (e.touches && e.touches.length === 2) {
      this._tap = null;
      if (!this.placed) return;
      const [a, b] = e.touches;
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const ang = Math.atan2(b.clientY - a.clientY, b.clientX - a.clientX);
      if (e.type === 'touchstart' || !this._g) {
        this._g = { dist, ang, scale: this.userXf.scale.x, rot: this.userXf.rotation.y };
      } else {
        const k = THREE.MathUtils.clamp(this._g.scale * dist / this._g.dist, 0.4, 4);
        this.userXf.scale.setScalar(k);
        this.userXf.rotation.y = this._g.rot - (ang - this._g.ang);
      }
      this.lastGesture = performance.now();
      if (e.cancelable) e.preventDefault();
      return;
    }
    if (e.type === 'touchstart' && e.touches.length === 1) {
      const onUI = e.target && e.target.closest && e.target.closest(UI_SELECTOR);
      this._tap = onUI ? null : { x: e.touches[0].clientX, y: e.touches[0].clientY, t: performance.now() };
    } else if (e.type === 'touchmove' && this._tap && e.touches.length === 1) {
      if (Math.hypot(e.touches[0].clientX - this._tap.x, e.touches[0].clientY - this._tap.y) > 14) this._tap = null;
    } else if (e.type === 'touchend') {
      if (this._g) { this.lastGesture = performance.now(); this._g = null; }
      const tap = this._tap; this._tap = null;
      if (tap && e.touches.length === 0 && performance.now() - tap.t < 450) {
        this.touchWorks = true;
        this._act(this.placed ? this.rayFromScreen(tap.x, tap.y) : null, 'touch');
      }
    }
  }

  _cleanup() {
    this.overlayRoot.removeEventListener('beforexrselect', this._beforeSelect);
    this.overlayRoot.removeEventListener('touchstart', this._touch);
    this.overlayRoot.removeEventListener('touchmove', this._touch);
    this.overlayRoot.removeEventListener('touchend', this._touch);
    if (this.hitSource) { try { this.hitSource.cancel(); } catch { /* noop */ } }
    this.hitSource = null; this.session = null; this.reticle.visible = false; this._found = false;
    this.anchor.position.set(0, 0, 0); this.anchor.rotation.set(0, 0, 0); this.anchor.visible = true;
    this.userXf.scale.setScalar(1); this.userXf.rotation.set(0, 0, 0);
    this.onEnd && this.onEnd();
  }
}
