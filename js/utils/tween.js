// Tiny time-based tween + per-frame updater registry (works in both the 3D loop and the WebXR loop).

export const Ease = {
  linear: t => t,
  inOut: t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  out: t => 1 - Math.pow(1 - t, 3),
  in: t => t * t * t,
  back: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  smooth: t => t * t * (3 - 2 * t)
};

const active = new Set();
const updaters = new Set();

export function tween({ duration = 1, delay = 0, ease = Ease.inOut, onUpdate, onComplete } = {}) {
  let cancelled = false;
  let resolveFn;
  const promise = new Promise(r => { resolveFn = r; });
  const tw = {
    t: -delay, duration: Math.max(0.0001, duration), ease, onUpdate, onComplete,
    cancel() { cancelled = true; active.delete(tw); resolveFn(false); },
    get cancelled() { return cancelled; },
    promise,
    _resolve: resolveFn
  };
  active.add(tw);
  return tw;
}

export const wait = s => tween({ duration: s }).promise;

/** Register a per-frame callback (dt, elapsed). Returns an unregister function. */
export function onFrame(fn) { updaters.add(fn); return () => updaters.delete(fn); }

export function updateTweens(dt, elapsed) {
  for (const tw of [...active]) {
    tw.t += dt;
    if (tw.t < 0) continue;
    const k = Math.min(1, tw.t / tw.duration);
    tw.onUpdate && tw.onUpdate(tw.ease(k), k);
    if (k >= 1) {
      active.delete(tw);
      tw.onComplete && tw.onComplete();
      tw._resolve(true);
    }
  }
  for (const fn of [...updaters]) fn(dt, elapsed);
}

export const lerp = (a, b, k) => a + (b - a) * k;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
