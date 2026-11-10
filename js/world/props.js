// Heritage props: pearl-diving gear and oyster, palm-frond weaving (safeefah), majlis furniture, vintage TV.
import * as THREE from 'three';
import { PALETTE } from '../config.js';
import { mat, box, cyl, sphere, shadowed, matTexture, carpetTexture, cushionTexture } from './materials.js';

const TAU = Math.PI * 2;
let _matTex = null, _carpet = null, _cushion = null;
const matTex = () => _matTex || (_matTex = matTexture());

export function makeWovenMat(w, d) {
  const t = matTex().clone(); t.needsUpdate = true; t.repeat.set(w / 1.6, d / 1.6);
  const m = shadowed(new THREE.Mesh(new THREE.BoxGeometry(w, 0.03, d), mat(0xffffff, { map: t })), false, true);
  m.position.y = 0.035;
  return m;
}

// ---------------------------------------------------------------------------
// Pearl diving
// ---------------------------------------------------------------------------
export function makeOyster() {
  const g = new THREE.Group(); g.name = 'oyster';
  const shellMat = mat(0x8C8172, { side: THREE.DoubleSide, rough: 0.85 });
  const nacre = mat(PALETTE.ivory, { metal: 0.35, rough: 0.25, emissive: 0x2a2620 });
  const bottom = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 6, 0, TAU, Math.PI / 2, Math.PI / 2), shellMat));
  bottom.scale.set(1, 0.38, 0.92); g.add(bottom);
  const inner = new THREE.Mesh(new THREE.CircleGeometry(0.27, 20), nacre); inner.rotation.x = -Math.PI / 2; inner.position.y = 0.004; inner.scale.y = 0.9; g.add(inner);
  const hinge = new THREE.Group(); hinge.position.set(0, 0.01, -0.27); g.add(hinge);
  const top = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 6, 0, TAU, 0, Math.PI / 2), shellMat));
  top.scale.set(1, 0.32, 0.92); top.position.z = 0.27; hinge.add(top);
  // Pearl
  const pearl = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 14),
    mat(0xFFFBF2, { metal: 0.3, rough: 0.12, emissive: 0x3a3226, flat: false })));
  pearl.position.set(0, 0.06, 0.02); pearl.name = 'pearl';
  g.add(pearl);
  const sparkles = new THREE.Group(); sparkles.visible = false; g.add(sparkles);
  const sm = mat(PALETTE.cream, { emissive: PALETTE.cream, emissiveIntensity: 0.9 });
  for (let i = 0; i < 7; i++) { const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.018), sm); s.userData.a = (i / 7) * TAU; sparkles.add(s); }
  g.userData = { hinge, pearl, sparkles };
  return g;
}

export function makeDivingGear() {
  const g = new THREE.Group(); g.name = 'diving-gear';
  // Deyin — the net basket worn around the neck to collect oysters
  const deyin = new THREE.Group();
  const net = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.16, 0.42, 12, 1, true), mat(0xB49A6A, { side: THREE.DoubleSide })));
  net.position.y = 0.21; deyin.add(net);
  const rim = shadowed(new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.02, 5, 16), mat(PALETTE.woodDark))); rim.rotation.x = Math.PI / 2; rim.position.y = 0.42; deyin.add(rim);
  for (let i = 0; i < 4; i++) { const o = sphere(0.07, 0x8C8172, 6, 4); o.scale.y = 0.45; o.position.set(Math.cos(i * 1.6) * 0.1, 0.38, Math.sin(i * 1.6) * 0.1); deyin.add(o); }
  deyin.position.set(1.15, 0.03, 0.55); g.add(deyin);
  // Hajar — the stone weight, with its rope coil (used by the seeb to pull the diver up)
  const stone = shadowed(new THREE.Mesh(new THREE.DodecahedronGeometry(0.17), mat(PALETTE.stone, { grain: true })));
  stone.position.set(-0.95, 0.15, 0.6); stone.scale.y = 0.8; g.add(stone);
  for (let i = 0; i < 3; i++) {
    const coil = shadowed(new THREE.Mesh(new THREE.TorusGeometry(0.26 - i * 0.02, 0.035, 5, 18), mat(PALETTE.frondDry)));
    coil.rotation.x = Math.PI / 2; coil.position.set(-1.05, 0.06 + i * 0.06, -0.15); g.add(coil);
  }
  // Fattam — the turtle-shell nose clip
  const clip = new THREE.Group();
  for (const s of [-1, 1]) { const b = box(0.02, 0.11, 0.02, PALETTE.linen); b.rotation.z = s * 0.35; b.position.x = s * 0.02; clip.add(b); }
  clip.position.set(-0.45, 0.08, 0.75); clip.rotation.x = Math.PI / 2; g.add(clip);
  // Mandoos — the wooden chest
  const chest = new THREE.Group();
  const chestBody = box(0.95, 0.5, 0.55, PALETTE.clay, { grain: true }); chestBody.position.y = 0.25; chest.add(chestBody);
  const lid = box(0.97, 0.1, 0.57, PALETTE.wood); lid.position.y = 0.55; chest.add(lid);
  for (const x of [-0.35, 0, 0.35]) { const b = box(0.05, 0.62, 0.58, PALETTE.brass, { metal: 0.5, rough: 0.4 }); b.position.set(x, 0.31, 0); chest.add(b); }
  chest.position.set(1.4, 0.03, -0.6); chest.rotation.y = -0.2; g.add(chest);
  return g;
}

// ---------------------------------------------------------------------------
// Safeefah — palm-frond weaving. Stage-driven: 0 fronds, 1 dye, 2 braid, 3 stitch/finished
// ---------------------------------------------------------------------------
export function makeWeavingSet() {
  const g = new THREE.Group(); g.name = 'weaving';
  // fronds bundle (khoos)
  const fronds = new THREE.Group(); fronds.position.set(-1.25, 0.05, 0.55); g.add(fronds);
  for (let i = 0; i < 12; i++) {
    const f = box(0.05, 0.012, 1.4, i % 3 ? PALETTE.frondDry : PALETTE.frond);
    f.rotation.y = -0.5 + i * 0.08; f.position.set(i * 0.02, i * 0.008, 0); fronds.add(f);
  }
  // dyed bundles
  const dyes = new THREE.Group(); dyes.position.set(1.15, 0.05, 0.55); g.add(dyes);
  [PALETTE.rust, PALETTE.olive, PALETTE.lavender, PALETTE.mustard].forEach((c, i) => {
    const d = shadowed(new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.04, 6, 14), mat(c)));
    d.rotation.x = Math.PI / 2; d.position.set((i % 2) * 0.28, 0.04 + Math.floor(i / 2) * 0.07, Math.floor(i / 2) * -0.05); dyes.add(d);
  });
  // braided strip (safeefa) coiled on the mat
  const pts = []; for (let a = 0; a < TAU * 3.2; a += 0.2) { const r = 0.06 + a * 0.028; pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)); }
  const stripGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.032, 5, false);
  const strip = shadowed(new THREE.Mesh(stripGeo, mat(PALETTE.mustard))); strip.scale.y = 0.45; strip.position.set(0.0, 0.07, 0.95);
  g.add(strip);
  // the basket, built ring by ring
  const basket = new THREE.Group(); basket.name = 'basket'; g.add(basket);
  const baseDisc = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 18), mat(PALETTE.frondDry))); baseDisc.position.y = 0.06; basket.add(baseDisc);
  const rings = [];
  const ringCols = [PALETTE.frondDry, PALETTE.frondDry, PALETTE.rust, PALETTE.frondDry, PALETTE.mustard, PALETTE.olive, PALETTE.frondDry, PALETTE.lavender, PALETTE.frondDry];
  for (let i = 0; i < 9; i++) {
    const r = 0.2 + Math.min(i, 5) * 0.03;
    const ring = shadowed(new THREE.Mesh(new THREE.TorusGeometry(r, 0.036, 6, 22), mat(ringCols[i])));
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.1 + i * 0.062; basket.add(ring); rings.push(ring);
  }
  const lid = shadowed(new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.34, 18), mat(PALETTE.mustard)));
  lid.position.y = 0.1 + 9 * 0.062 + 0.17; basket.add(lid);
  const knob = sphere(0.05, PALETTE.rust, 8, 6); knob.position.y = lid.position.y + 0.18; basket.add(knob);
  // A hit-box so the whole basket is easy to tap
  const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.9, 10), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = 0.45; basket.add(hit);

  const state = { progress: 0.35, stage: -1, live: true };
  function apply() {
    const n = Math.round(state.progress * rings.length);
    rings.forEach((r, i) => { r.visible = i < n; });
    baseDisc.visible = state.progress > 0.02;
    lid.visible = knob.visible = state.progress >= 0.999;
  }
  apply();
  g.userData = {
    basket, fronds, dyes, strip, state,
    setProgress(p) { state.progress = Math.max(0, Math.min(1, p)); apply(); },
    setStage(s) { // visual emphasis per stage
      state.stage = s; state.live = s < 0;
      fronds.visible = true; dyes.visible = s !== 0; strip.visible = s >= 2 || s < 0;
      if (s === 0) state.progress = 0; else if (s === 1) state.progress = 0; else if (s === 2) state.progress = 0.12; else if (s === 3) state.progress = 1;
      apply();
    },
    highlight: s => ({ 0: fronds, 1: dyes, 2: strip, 3: basket })[s] || basket
  };
  return g;
}

// ---------------------------------------------------------------------------
// Majlis
// ---------------------------------------------------------------------------
export function makeCarpet(w, d) {
  if (!_carpet) _carpet = carpetTexture();
  const m = shadowed(new THREE.Mesh(new THREE.BoxGeometry(w, 0.03, d), mat(0xffffff, { map: _carpet })), false, true);
  m.position.y = 0.035; return m;
}

export function makeCushionRun(len, rotY = 0) {
  if (!_cushion) _cushion = cushionTexture();
  const g = new THREE.Group();
  const t = _cushion.clone(); t.needsUpdate = true; t.repeat.set(len / 1.2, 1);
  const fabric = mat(0xffffff, { map: t, rough: 0.95 });
  const seat = shadowed(new THREE.Mesh(new THREE.BoxGeometry(len, 0.16, 0.7), fabric)); seat.position.set(0, 0.11, 0); g.add(seat);
  const back = shadowed(new THREE.Mesh(new THREE.BoxGeometry(len, 0.55, 0.2), fabric)); back.position.set(0, 0.42, -0.3); back.rotation.x = -0.12; g.add(back);
  for (const s of [-1, 1]) {
    const arm = cyl(0.12, 0.12, 0.5, PALETTE.petrol, 10); arm.rotation.x = Math.PI / 2; arm.position.set(s * (len / 2 - 0.08), 0.32, -0.05); g.add(arm);
  }
  g.rotation.y = rotY;
  return g;
}

export function makeCoffeeSet() {
  const g = new THREE.Group(); g.name = 'coffee';
  const table = box(1.0, 0.24, 0.66, PALETTE.woodDark); table.position.y = 0.15; g.add(table);
  const tray = cyl(0.32, 0.3, 0.025, PALETTE.brass, 20, { metal: 0.55, rough: 0.35 }); tray.position.y = 0.285; g.add(tray);
  // Dallah — Arabic coffee pot
  const prof = [[0, 0], [0.085, 0], [0.09, 0.02], [0.07, 0.07], [0.05, 0.11], [0.052, 0.15], [0.07, 0.17], [0.03, 0.2], [0.012, 0.24], [0, 0.245]];
  const dallah = shadowed(new THREE.Mesh(new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x * 1.5, y * 1.5)), 14), mat(PALETTE.brass, { metal: 0.6, rough: 0.3 })));
  dallah.position.set(-0.08, 0.3, 0); g.add(dallah);
  const spout = cyl(0.012, 0.025, 0.2, PALETTE.brass, 6, { metal: 0.6, rough: 0.3 }); spout.position.set(0.04, 0.48, 0); spout.rotation.z = -0.9; g.add(spout);
  for (let i = 0; i < 4; i++) { const c = cyl(0.028, 0.02, 0.04, PALETTE.ivory, 8); c.position.set(0.1 + (i % 2) * 0.08, 0.32, -0.08 + Math.floor(i / 2) * 0.12); g.add(c); }
  // Mabkhara — incense burner
  const mab = cyl(0.06, 0.09, 0.2, PALETTE.coral, 4); mab.position.set(0.7, 0.13, 0.1); mab.rotation.y = Math.PI / 4; g.add(mab);
  return g;
}

export function makeLantern() {
  const g = new THREE.Group(); g.name = 'lantern';
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.24, 0.16), mat(0xFFD9A0, { emissive: 0xFFB347, emissiveIntensity: 1.2, rough: 0.4 }));
  glass.position.y = 0.17; g.add(glass);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const e = box(0.02, 0.28, 0.02, PALETTE.brass, { metal: 0.5 }); e.position.set(x * 0.085, 0.17, z * 0.085); g.add(e); }
  const cap = cyl(0.02, 0.12, 0.08, PALETTE.brass, 4, { metal: 0.5 }); cap.position.y = 0.34; cap.rotation.y = Math.PI / 4; g.add(cap);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.01, 4, 10), mat(PALETTE.brass)); ring.position.y = 0.41; g.add(ring);
  const light = new THREE.PointLight(0xFFB86B, 1.6, 7, 0);
  light.position.y = 0.2; g.add(light);
  g.userData = { light, glass, baseDistance: 7 };
  return g;
}

// ---------------------------------------------------------------------------
// Vintage television (1970s wooden-cabinet set)
// ---------------------------------------------------------------------------
export function makeTV(screenTexture) {
  const g = new THREE.Group(); g.name = 'tv';
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = cyl(0.025, 0.018, 0.32, PALETTE.woodDark, 5); l.position.set(x * 0.36, 0.16, z * 0.2); l.rotation.z = x * 0.12; g.add(l); }
  const body = box(0.92, 0.68, 0.56, PALETTE.wood, { grain: true }); body.position.y = 0.32 + 0.34; g.add(body);
  const front = box(0.86, 0.6, 0.02, 0x2A2420); front.position.set(0, 0.66, 0.285); g.add(front);
  const screenMat = new THREE.MeshStandardMaterial({ color: 0x2F3B36, roughness: 0.25, metalness: 0.1, emissive: 0xffffff, emissiveMap: screenTexture, emissiveIntensity: 0 });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.45), screenMat); screen.position.set(-0.08, 0.66, 0.298); g.add(screen);
  const panel = box(0.14, 0.5, 0.02, PALETTE.ivory); panel.position.set(0.33, 0.66, 0.298); g.add(panel);
  const knobs = [];
  for (let i = 0; i < 2; i++) { const k = cyl(0.035, 0.035, 0.04, PALETTE.flagBlack, 10); k.rotation.x = Math.PI / 2; k.position.set(0.33, 0.78 - i * 0.16, 0.315); g.add(k); knobs.push(k); }
  for (const s of [-1, 1]) { const a = cyl(0.006, 0.006, 0.7, PALETTE.ash, 4, { metal: 0.6 }); a.position.set(s * 0.14, 1.27, 0); a.rotation.z = s * -0.5; g.add(a); }
  const base = sphere(0.06, PALETTE.flagBlack, 8, 6); base.scale.y = 0.5; base.position.y = 1.0; g.add(base);
  const hit = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.4, 0.8), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 0.7; g.add(hit);
  g.userData = { screen, screenMat, knobs };
  return g;
}

export function makeClayPots() {
  const g = new THREE.Group(); g.name = 'jahla';
  const prof = [[0, 0], [0.1, 0], [0.18, 0.08], [0.2, 0.2], [0.16, 0.34], [0.08, 0.4], [0.09, 0.45], [0, 0.45]];
  [[0, 0, 1], [0.42, 0.1, 0.8], [0.18, 0.4, 0.9]].forEach(([x, z, s]) => {
    const p = shadowed(new THREE.Mesh(new THREE.LatheGeometry(prof.map(([a, b]) => new THREE.Vector2(a * 1.6 * s, b * 1.6 * s)), 12), mat(PALETTE.rust, { grain: true })));
    p.position.set(x, 0.03, z); g.add(p);
  });
  return g;
}
