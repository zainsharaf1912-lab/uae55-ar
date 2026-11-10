// AR integration test with the REAL three.js r160 + a simulated handheld WebXR device (tests/mock-webxr.js).
// Taps are real touch events at the projected screen positions of the objects.
// Usage: node tests/run-ar-sim.js <pageURL> <outDir> [overlay=1|0] [rejectOptional=0|1]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const fs = require('fs'); const path = require('path');
const [url, out, overlayArg = '1', rejectArg = '0'] = process.argv.slice(2);
const overlay = overlayArg === '1';
const mock = fs.readFileSync(path.join(__dirname, 'mock-webxr.js'), 'utf8');

(async () => {
  const errors = [], log = [];
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await ctx.addInitScript(`window.__MOCKXR = ${JSON.stringify({ overlay, rejectOptional: rejectArg === '1' })};\n${mock}`);
  const p = await ctx.newPage();
  p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  p.on('pageerror', e => errors.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  const check = (label, cond) => { log.push(`${cond ? 'PASS' : 'FAIL'}  ${label}`); };
  const shot = async name => { if (overlay) await p.screenshot({ path: path.join(out, name) }); };
  const ev = js => p.evaluate(js);

  try {
  await p.goto(url);
  await p.waitForFunction(() => window.__uae55 && window.__uae55.ready, null, { timeout: 120000 });
  check('AR start button visible when WebXR immersive-ar is available', await ev(`!document.getElementById('btn-start-ar').hidden`));
  // make the simulated "camera feed" visible for screenshots (a real device composites the camera here)
  await p.addStyleTag({ content: `body.xr-active{background:linear-gradient(#d9cbb4 0 34%,#9b6b4a 34% 100%) !important}
    body.xr-active #scene-canvas{visibility:visible !important}
    #simlabel{position:fixed;left:8px;bottom:4px;z-index:99;font:600 10px monospace;background:#000a;color:#fff;padding:2px 6px}` });
  await ev(`(() => { const d = document.createElement('div'); d.id = 'simlabel'; d.textContent = 'SIMULATED AR DEVICE (headless test) — not a real camera'; document.body.appendChild(d); })()`);
  await ev(`(() => { const d = window.__uae55.director; const o = d.handleTap.bind(d); window.__taps = []; d.handleTap = k => { window.__taps.push(k); return o(k); }; })()`);
  await ev(`window.__proj = (o, dy = 0) => { const app = window.__uae55; const xc = app.renderer.xr.getCamera(); const c = xc.cameras && xc.cameras.length ? xc.cameras[0] : xc; const v = o.position.clone().set(0, dy, 0); o.localToWorld(v); v.project(c); return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight, z: v.z }; }`);
  const tapObj = async (expr, dy = 0) => { const s = await ev(`window.__proj(${expr}, ${dy})`); log.push(`  tap ${expr.replace('window.__uae55.','')} at (${s.x.toFixed(0)}, ${s.y.toFixed(0)})`); await p.touchscreen.tap(s.x, s.y); await p.waitForTimeout(450); return s; };
  const taps = () => ev('window.__taps.slice()');
  const settle = async (min = 600, max = 60000) => {
    await p.waitForTimeout(min); const t0 = Date.now(); let last = '';
    while (Date.now() - t0 < max) {
      const sig = await ev(`(() => { const a = window.__uae55, f = a.focusXf, r = a.house.refs; return [f.scale.x, f.position.x, f.position.z, r.front.scale.y, r.roof.position.y, r.doors[0].rotation.y, r.oyster.userData.pearl.position.y].map(v => v.toFixed(4)).join(','); })()`);
      if (sig === last) return; last = sig; await p.waitForTimeout(700);
    }
  };

  await ev(`(() => { const a = window.__uae55; a.sun.shadow.mapSize.set(512, 512); if (a.sun.shadow.map) { a.sun.shadow.map.dispose(); a.sun.shadow.map = null; } })()`);
  await p.click('#btn-start-ar');
  await p.waitForTimeout(1500);
  const fps = await ev(`new Promise(r => { let n = 0; const s = window.__MOCKXR_SESSION; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) s.requestAnimationFrame(f); else r(n / 2); }; s.requestAnimationFrame(f); })`);
  log.push('  simulator frame rate: ' + fps + ' fps (software GPU)');
  check('XR session started and renderer is presenting', await ev(`window.__uae55.renderer.xr.isPresenting === true`));
  check('dom-overlay state ' + (overlay ? 'active' : 'absent (select-only path)'), await ev(`!!window.__uae55.ar.overlay === ${overlay}`));
  check('scan guide shown, reticle visible on the table', await ev(`!document.getElementById('ar-guide').hidden && window.__uae55.ar.reticle.visible`));
  await shot('ar-01-scanning.png');

  await p.touchscreen.tap(195, 420); await settle();
  check('tap places the world (anchor visible, placed)', await ev(`window.__uae55.ar.placed && window.__uae55.anchor.visible`));
  check('placement did not also count as a scene tap', (await taps()).length === 0);
  check('scene 1 active after placement, hotspots visible', await ev(`window.__uae55.director.index === 0 && window.__uae55.hotspots.door.visible`));
  const scale = await ev(`window.__uae55.world.getWorldScale(window.__uae55.world.position.clone()).x`);
  check(`world scaled to table size (board ≈ ${(scale * 28).toFixed(2)} m wide)`, Math.abs(scale * 28 - 0.5) < 0.02);
  await shot('ar-02-placed.png');

  // Scene 1 → 2: tap the door pin
  await tapObj('window.__uae55.hotspots.door'); await settle();
  let t = await taps();
  check('door tap opens the house (scene 2) — taps: ' + JSON.stringify(t), await ev(`window.__uae55.director.index === 1`) && t.length === 1);
  check('door swung open, front wall folded, roof lifted', await ev(`(() => { const r = window.__uae55.house.refs; return Math.abs(r.doors[0].rotation.y) > 1.5 && r.front.scale.y < 0.1 && !r.roof.visible; })()`));
  await shot('ar-03-house-open.png');

  // Scene 2 → 3 via the father pin, then the oyster and the pearl
  await tapObj('window.__uae55.hotspots.father'); await settle();
  check('father pin → scene 3', await ev(`window.__uae55.director.index === 2`));
  await tapObj('window.__uae55.house.refs.oyster', 0.03); await settle();
  check('tap on the oyster opens it', await ev(`window.__uae55.director.oysterOpen === true`));
  await shot('ar-04-oyster.png');
  await tapObj('window.__uae55.house.refs.oyster.userData.pearl'); await p.waitForTimeout(700);
  check('tap on the pearl opens its info card', await ev(`!document.getElementById('sheet').hidden && document.getElementById('sheet-title').textContent.includes('اللؤلؤ')`));
  const before = (await taps()).length;
  if (await ev(`!document.getElementById('sheet').hidden`)) await p.tap('#sheet-close'); await p.waitForTimeout(500);
  check('tapping an interface button does not leak into the 3D scene', (await taps()).length === before && await ev(`document.getElementById('sheet').hidden`));

  // Scene 4: weaving
  await p.tap('#btn-next'); await settle();
  check('next → scene 4', await ev(`window.__uae55.director.index === 3`));
  await tapObj('window.__uae55.house.refs.weaving.userData.basket', 0.2); await p.waitForTimeout(600);
  check('tap on the basket opens the 4-stage panel', await ev(`!document.getElementById('sheet').hidden && document.querySelectorAll('.steps-tabs button').length === 4`));
  for (let k = 0; k < 4; k++) { await p.tap(`.steps-tabs button:nth-child(${k + 1})`); await p.waitForTimeout(350); }
  check('stage 4 completes the basket', await ev(`window.__uae55.house.refs.weaving.userData.state.progress === 1`));
  await shot('ar-05-weaving.png');
  await p.tap('#sheet-close'); await p.waitForTimeout(400);

  // Scene 5: grandmother
  await p.tap('#btn-next'); await settle();
  await tapObj('window.__uae55.house.refs.people.grandma', 0.6); await p.waitForTimeout(700);
  check('tap on the grandmother tells her story', await ev(`document.getElementById('caption-text').textContent.includes('زرعوا فأكلنا')`));
  await p.tap('#sheet-close'); await p.waitForTimeout(400);

  // Scene 6: television
  await p.tap('#btn-next'); await settle();
  await tapObj('window.__uae55.house.refs.tv', 0.65); await p.waitForTimeout(2500);
  check('tap on the TV switches it on', await ev(`window.__uae55.tvProgram.playing === true`));
  await shot('ar-06-tv.png');

  // Scene 7: finale
  await p.tap('#btn-next'); await settle(); await p.waitForFunction(() => window.__uae55.house.refs.standing.grandma.userData.rig.mode === 'cheer', null, { timeout: 90000 }).catch(() => {});
  check('finale: family gathered, flag raised, 55 visible', await ev(`(() => { const a = window.__uae55; return a.director.index === 6 && a.year55.visible && a.house.refs.standing.grandma.visible; })()`));
  await shot('ar-07-finale.png');
  await p.waitForFunction(() => document.getElementById('finale').classList.contains('is-active'), null, { timeout: 120000 }).catch(() => {});
  check('finale card appears over the camera view', await ev(`document.getElementById('finale').classList.contains('is-active')`));
  await shot('ar-08-finale-card.png');
  await p.tap('#btn-finale-close'); await p.waitForTimeout(400);

  // Two-finger pinch + twist (CDP touch events)
  const cdp = await ctx.newCDPSession(p);
  const tp = (x1, y1, x2, y2) => [{ x: x1, y: y1, id: 1 }, { x: x2, y: y2, id: 2 }];
  const n0 = (await taps()).length; const s0 = await ev(`window.__uae55.userXf.scale.x`), r0 = await ev(`window.__uae55.userXf.rotation.y`);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(150, 400, 240, 400) });
  for (let i = 1; i <= 6; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp(150 - i * 10, 400 - i * 6, 240 + i * 10, 400 + i * 6) }); await p.waitForTimeout(30); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(600);
  const s1 = await ev(`window.__uae55.userXf.scale.x`), r1 = await ev(`window.__uae55.userXf.rotation.y`);
  check(`pinch scales (${s0.toFixed(2)} → ${s1.toFixed(2)}) and twist rotates (${r0.toFixed(2)} → ${r1.toFixed(2)})`, s1 > s0 * 1.2 && Math.abs(r1 - r0) > 0.05);
  check('pinch did not trigger a scene tap', (await taps()).length === n0);

  // Re-place, then exit
  await p.tap('#ar-replace'); await p.waitForTimeout(800);
  check('“re-place” returns to scanning', await ev(`!window.__uae55.ar.placed && !document.getElementById('ar-guide').hidden`));
  await p.touchscreen.tap(195, 420); await p.waitForTimeout(900);
  check('world placed again', await ev(`window.__uae55.ar.placed`));
  await p.tap('#btn-exit'); await p.waitForTimeout(1200);
  check('exit ends the XR session and returns to the splash', await ev(`!window.__uae55.renderer.xr.isPresenting && document.getElementById('splash').classList.contains('is-active') && !document.body.classList.contains('xr-active')`));
  // 3D mode still works afterwards
  await p.click('#btn-start-3d'); await p.waitForTimeout(2500);
  check('3D mode still works after an AR session', await ev(`!window.__uae55.isAR && document.getElementById('hud').classList.contains('is-active')`));
  const all = await taps();
  log.push('handled taps (in order): ' + JSON.stringify(all));
  log.push('mock select events dispatched: ' + (await ev('window.__MOCKXR_STATE.selects')));
  } catch (e) { log.push('ABORTED: ' + e.message.split('\n')[0]); try { log.push('handled taps: ' + JSON.stringify(await ev('window.__taps'))); await p.screenshot({ path: path.join(out, 'ar-abort.png') }); } catch {} }
  console.log(log.join('\n'));
  console.log(`--- ERRORS (${errors.length}) ---\n` + errors.join('\n'));
  await b.close();
})();
