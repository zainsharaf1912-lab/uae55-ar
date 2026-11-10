// Simulated handheld WebXR AR device for headless testing (injected before the page loads).
// It is NOT a real AR runtime: the "camera" is a fixed pose ~42 cm above a virtual table and the
// hit-test always reports the table plane (y = 0). It exercises the real three.js WebXRManager and the
// app's AR code: session start, reticle, placement, DOM-overlay taps, `select` events, gestures, exit.
(() => {
  const cfg = Object.assign({ overlay: true, eye: [0, 0.42, 0.55], target: [0, 0, 0], fov: 62 }, window.__MOCKXR || {});
  window.__MOCKXR_STATE = { selects: 0, sessions: 0, cfg };
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = a => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const lookAt = (eye, target) => {
    const z = norm(sub(eye, target)); const x = norm(cross([0, 1, 0], z)); const y = cross(z, x);
    return new Float32Array([x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, eye[0], eye[1], eye[2], 1]);
  };
  const persp = (fovy, aspect, n, f) => {
    const t = 1 / Math.tan(fovy / 2), nf = 1 / (n - f);
    return new Float32Array([t / aspect, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) * nf, -1, 0, 0, 2 * f * n * nf, 0]);
  };
  const camMatrix = () => lookAt(cfg.eye, cfg.target);
  const rayThrough = (cx, cy) => { // world-space ray through a screen point
    const m = camMatrix(); const aspect = innerWidth / innerHeight; const th = Math.tan(cfg.fov * Math.PI / 360);
    const nx = (cx / innerWidth) * 2 - 1, ny = -(cy / innerHeight) * 2 + 1;
    const d = [nx * th * aspect, ny * th, -1];
    const w = norm([m[0] * d[0] + m[4] * d[1] + m[8] * d[2], m[1] * d[0] + m[5] * d[1] + m[9] * d[2], m[2] * d[0] + m[6] * d[1] + m[10] * d[2]]);
    return lookAt(cfg.eye, [cfg.eye[0] + w[0], cfg.eye[1] + w[1], cfg.eye[2] + w[2]]);
  };

  window.XRWebGLLayer = class {
    constructor(session, gl) { this.framebuffer = null; this.framebufferWidth = gl.drawingBufferWidth; this.framebufferHeight = gl.drawingBufferHeight; this.antialias = true; this.ignoreDepthValues = false; }
    getViewport() { return { x: 0, y: 0, width: this.framebufferWidth, height: this.framebufferHeight }; }
    static getNativeFramebufferScaleFactor() { return 1; }
  };
  for (const C of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) if (C) C.prototype.makeXRCompatible = function () { return Promise.resolve(); };

  class MockSession extends EventTarget {
    constructor(opts) {
      super(); window.__MOCKXR_STATE.sessions++;
      this.renderState = { baseLayer: null, depthNear: 0.01, depthFar: 100, inlineVerticalFieldOfView: null };
      this.environmentBlendMode = 'alpha-blend'; this.inputSources = []; this.visibilityState = 'visible';
      const wantsOverlay = (opts.optionalFeatures || []).includes('dom-overlay') || (opts.requiredFeatures || []).includes('dom-overlay');
      this.domOverlayState = cfg.overlay && wantsOverlay ? { type: 'screen' } : null;
      if (this.domOverlayState && opts.domOverlay && opts.domOverlay.root) opts.domOverlay.root.dataset.xrOverlay = '1';
      this._cbs = new Map(); this._id = 0; this._ended = false; this._lastFrame = null;
      this._onTouch = e => this._screenSelect(e);
      document.addEventListener('touchend', this._onTouch, true);
      const tick = t => { if (this._ended) return; const cbs = [...this._cbs]; this._cbs.clear(); const fr = this._frame(); this._lastFrame = fr; for (const [, cb] of cbs) cb(t, fr); requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }
    updateRenderState(s) { Object.assign(this.renderState, s); }
    async requestReferenceSpace(type) { return { type, addEventListener() {}, removeEventListener() {} }; }
    async requestHitTestSource() { return { cancel() {} }; }
    requestAnimationFrame(cb) { const id = ++this._id; this._cbs.set(id, cb); return id; }
    cancelAnimationFrame(id) { this._cbs.delete(id); }
    async end() { if (this._ended) return; this._ended = true; document.removeEventListener('touchend', this._onTouch, true); this.dispatchEvent(new Event('end')); }
    _frame() {
      const view = { eye: 'none', transform: { matrix: camMatrix() }, projectionMatrix: persp(cfg.fov * Math.PI / 180, innerWidth / innerHeight, 0.01, 100), recommendedViewportScale: null };
      return {
        session: this,
        getViewerPose: () => ({ transform: view.transform, views: [view], emulatedPosition: false }),
        getPose: space => (space && space._m ? { transform: { matrix: space._m } } : null),
        getHitTestResults: () => {
          // viewer forward ray against the table plane y = 0
          const m = camMatrix(); const dir = [-m[8], -m[9], -m[10]];
          if (dir[1] >= -1e-3) return [];
          const k = -cfg.eye[1] / dir[1];
          const p = [cfg.eye[0] + dir[0] * k, 0, cfg.eye[2] + dir[2] * k];
          return [{ getPose: () => ({ transform: { matrix: new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, p[0], p[1], p[2], 1]) } }) }];
        }
      };
    }
    // Chrome-style: a screen tap on the overlay produces beforexrselect (cancellable) then `select`.
    _screenSelect(e) {
      const t = e.changedTouches && e.changedTouches[0]; if (!t || e.touches.length) return;
      const target = document.elementFromPoint(t.clientX, t.clientY) || document.body;
      const before = new Event('beforexrselect', { bubbles: true, cancelable: true });
      if (this.domOverlayState) { target.dispatchEvent(before); if (before.defaultPrevented) return; }
      const src = { targetRayMode: 'screen', handedness: 'none', targetRaySpace: { _m: rayThrough(t.clientX, t.clientY) }, profiles: [] };
      setTimeout(() => {
        const ev = new Event('select'); ev.inputSource = src; ev.frame = this._lastFrame;
        window.__MOCKXR_STATE.selects++; this.dispatchEvent(ev);
      }, cfg.selectDelay ?? 0);
    }
  }
  const xr = new EventTarget();
  xr.isSessionSupported = async mode => mode === 'immersive-ar';
  xr.requestSession = async (mode, opts = {}) => {
    if (mode !== 'immersive-ar') throw new DOMException('unsupported', 'NotSupportedError');
    if (cfg.rejectOptional && (opts.optionalFeatures || []).includes('light-estimation')) throw new DOMException('unknown feature', 'NotSupportedError');
    return (window.__MOCKXR_SESSION = new MockSession(opts));
  };
  Object.defineProperty(navigator, 'xr', { value: xr, configurable: true });
})();
