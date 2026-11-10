// Stylised low-poly Emirati family, derived from the official Eid Al Etihad 55 illustrations
// (Families / Arts & Crafts categories, Guidelines pp.21–23): white kandura with ghutra & agal,
// black abaya & shayla, the grandmother's burqa, children in kandura / coloured dresses.
import * as THREE from 'three';
import { PALETTE } from '../config.js';
import { mat, shadowed } from './materials.js';

const V2 = (x, y) => new THREE.Vector2(x, y);
const TAU = Math.PI * 2;

function lathe(points, H, color, seg = 14, opts) {
  const g = new THREE.LatheGeometry(points.map(([r, y]) => V2(r * H, y * H)), seg);
  return shadowed(new THREE.Mesh(g, mat(color, opts)));
}

/**
 * spec: { name, kind: 'man'|'woman'|'grandma'|'boy'|'girl', height, robe, under, skin, hair, beard,
 *         seated, accent }
 */
export function makePerson(spec) {
  const { name, kind, height: H = 1.75, robe = PALETTE.kandura, under = robe, skin = PALETTE.skin1,
    hair = 0x2B1D16, beard = null, seated = false, accent = PALETTE.teal } = spec;
  const root = new THREE.Group(); root.name = name;
  const isRobedWoman = kind === 'woman' || kind === 'grandma';

  // ----- lower body (skirt of kandura / abaya / dress) -----
  const skirtProfile = seated
    ? [[0, 0], [0.21, 0], [0.215, 0.035], [0.18, 0.11], [0.13, 0.19], [0.108, 0.26], [0, 0.262]]
    : (isRobedWoman
      ? [[0, 0], [0.15, 0], [0.152, 0.02], [0.128, 0.25], [0.108, 0.5], [0, 0.502]]
      : [[0, 0], [0.125, 0], [0.13, 0.02], [0.118, 0.25], [0.108, 0.5], [0, 0.502]]);
  const waistY = seated ? 0.26 * H : 0.5 * H;
  const skirt = lathe(skirtProfile, H, robe, 16);
  skirt.scale.z = seated ? 1.0 : 0.74;
  if (seated) skirt.position.z = 0.04 * H;
  root.add(skirt);

  // feet (standing only) — sandals
  if (!seated) {
    for (const s of [-1, 1]) {
      const f = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.055 * H, 0.025 * H, 0.1 * H), mat(0x4A3426)));
      f.position.set(s * 0.045 * H, 0.0125 * H, 0.055 * H);
      root.add(f);
    }
  }

  // ----- upper body: pivots at the waist so characters can bend, nod and gesture -----
  const upper = new THREE.Group(); upper.position.y = waistY; root.add(upper);
  const torso = lathe([[0.108, 0], [0.113, 0.12], [0.126, 0.27], [0.118, 0.31], [0.06, 0.345], [0, 0.35]], H, robe, 16);
  torso.scale.z = 0.72;
  upper.add(torso);

  // neck + head
  const neck = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.03 * H, 0.034 * H, 0.06 * H, 8), mat(skin)));
  neck.position.y = 0.36 * H; upper.add(neck);
  const head = new THREE.Group(); head.position.y = 0.415 * H; upper.add(head);
  const r = 0.068 * H;
  const skull = shadowed(new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mat(skin)));
  skull.scale.set(0.92, 1.05, 0.98); head.add(skull);

  if (beard) {
    const b = shadowed(new THREE.Mesh(new THREE.SphereGeometry(r * 1.02, 12, 8, 0, Math.PI, Math.PI * 0.55, Math.PI * 0.36), mat(beard)));
    b.scale.copy(skull.scale); head.add(b);
  }

  if (kind === 'man') addGhutra(head, r, H);
  else if (kind === 'boy') addKumma(head, r, H, spec.cap ?? PALETTE.kandura);
  else if (isRobedWoman) addShayla(head, r, H, kind === 'grandma');
  else if (kind === 'girl') addGirlHair(head, r, H, hair, accent);

  // ----- arms -----
  const sleeve = isRobedWoman ? robe : (kind === 'girl' ? robe : robe);
  const arms = [];
  for (const s of [1, -1]) {
    const pivot = new THREE.Group(); pivot.position.set(s * 0.122 * H, 0.29 * H, 0); upper.add(pivot);
    const arm = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.03 * H, 0.038 * H, 0.33 * H, 8), mat(sleeve)));
    arm.position.y = -0.165 * H; pivot.add(arm);
    const hand = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.03 * H, 8, 6), mat(skin)));
    hand.position.y = -0.345 * H; pivot.add(hand);
    pivot.rotation.z = s * 0.1;
    arms.push(pivot);
  }
  // under-dress hint at hem for women (pink / teal dress under abaya, as in the illustrations)
  if (isRobedWoman && !seated && under !== robe) {
    const hem = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.14 * H, 0.15 * H, 0.02 * H, 14, 1, true), mat(under, { side: THREE.DoubleSide })));
    hem.position.y = 0.012 * H; hem.scale.z = 0.76; root.add(hem);
  }

  // Finale ring in the member's emirate colour (hidden until scene 7)
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.2 * H * (seated ? 1.3 : 1), 0.26 * H * (seated ? 1.3 : 1), 28), mat(accent, { side: THREE.DoubleSide, rough: 0.6 }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; ring.visible = false; ring.receiveShadow = true;
  root.add(ring);

  root.userData.rig = {
    H, upper, head, armL: arms[0], armR: arms[1], ring, seated,
    phase: Math.random() * TAU, mode: 'idle', lookYaw: 0, baseY: 0
  };
  return root;
}

function addGhutra(head, r, H) {
  const white = mat(PALETTE.kandura, { side: THREE.DoubleSide });
  const cap = shadowed(new THREE.Mesh(new THREE.SphereGeometry(r * 1.1, 14, 8, 0, TAU, 0, Math.PI * 0.55), white));
  cap.position.y = r * 0.08; head.add(cap);
  const drape = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(r * 1.08, r * 1.65, 0.17 * H, 16, 1, true, Math.PI * 0.28, Math.PI * 1.44), white));
  drape.position.y = -0.055 * H; head.add(drape);
  const agal = shadowed(new THREE.Mesh(new THREE.TorusGeometry(r * 1.02, 0.009 * H, 6, 20), mat(PALETTE.flagBlack)));
  agal.rotation.x = Math.PI / 2 - 0.12; agal.position.y = r * 0.55; head.add(agal);
  const agal2 = agal.clone(); agal2.position.y = r * 0.42; agal2.scale.setScalar(1.03); head.add(agal2);
}

function addKumma(head, r, H, color) {
  const cap = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.98, r * 1.02, r * 0.55, 14), mat(color)));
  cap.position.y = r * 0.62; head.add(cap);
  const band = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(r * 1.03, r * 1.04, r * 0.14, 14, 1, true), mat(PALETTE.mustard, { side: THREE.DoubleSide })));
  band.position.y = r * 0.42; head.add(band);
}

function addShayla(head, r, H, burqa) {
  const black = mat(PALETTE.abaya, { side: THREE.DoubleSide, rough: 0.8 });
  const gap = Math.PI * 0.7;
  const hood = shadowed(new THREE.Mesh(new THREE.SphereGeometry(r * 1.13, 16, 10, Math.PI / 2 + gap / 2, TAU - gap, 0, Math.PI * 0.8), black));
  hood.position.y = r * 0.04; head.add(hood);
  const top = shadowed(new THREE.Mesh(new THREE.SphereGeometry(r * 1.13, 16, 6, 0, TAU, 0, Math.PI * 0.32), black));
  top.position.y = r * 0.04; head.add(top);
  const drape = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(r * 1.1, r * 1.85, 0.2 * H, 16, 1, true, Math.PI * 0.2, Math.PI * 1.6), black));
  drape.position.y = -0.075 * H; head.add(drape);
  if (burqa) {
    // Traditional burqa: indigo-gold sheen mask with the vertical spine, as in the illustrations
    const mask = shadowed(new THREE.Mesh(new THREE.BoxGeometry(r * 1.05, r * 0.72, r * 0.12), mat(0x8C6D2F, { metal: 0.45, rough: 0.45 })));
    mask.position.set(0, -r * 0.05, r * 0.9); head.add(mask);
    const spine = shadowed(new THREE.Mesh(new THREE.BoxGeometry(r * 0.1, r * 0.8, r * 0.16), mat(PALETTE.woodDark)));
    spine.position.set(0, -r * 0.05, r * 0.94); head.add(spine);
  }
}

function addGirlHair(head, r, H, hair, accent) {
  const h = shadowed(new THREE.Mesh(new THREE.SphereGeometry(r * 1.07, 14, 8, 0, TAU, 0, Math.PI * 0.62), mat(hair)));
  h.rotation.x = -0.35; h.position.y = r * 0.05; head.add(h);
  const braid = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.22, r * 0.14, r * 2.2, 8), mat(hair)));
  braid.position.set(0, -r * 0.9, -r * 0.92); braid.rotation.x = 0.2; head.add(braid);
  const band = shadowed(new THREE.Mesh(new THREE.TorusGeometry(r * 1.0, r * 0.08, 6, 18, Math.PI * 1.1), mat(accent)));
  band.rotation.set(Math.PI / 2 - 0.5, 0, Math.PI * 0.95); band.position.y = r * 0.45; head.add(band);
}

// ---------------------------------------------------------------------------------
// Procedural animation: calm, natural, purposeful movement (Animation Style, p.46)
// ---------------------------------------------------------------------------------
export function setMode(person, mode, extra = {}) {
  const rig = person.userData.rig; rig.mode = mode; Object.assign(rig, extra);
}

const damp = (cur, target, k) => cur + (target - cur) * k;

export function animatePerson(person, t, dt) {
  const rig = person.userData.rig; if (!rig) return;
  const p = t + rig.phase;
  const k = Math.min(1, dt * 6);
  let ux = 0, uz = 0, hx = 0, hy = rig.lookYaw || 0, hz = 0;
  let lx = 0, lz = 0.1, rx = 0, rz = -0.1, bob = 0;
  const breathe = 1 + Math.sin(p * 1.6) * 0.008;

  switch (rig.mode) {
    case 'idle':
      hy += Math.sin(p * 0.35) * 0.25; hx = Math.sin(p * 0.5) * 0.04;
      if (rig.seated) { lx = rx = -0.85; lz = 0.35; rz = -0.35; }
      break;
    case 'talk': // storytelling: hand gestures and gentle nods
      hx = Math.sin(p * 3.1) * 0.06; hy += Math.sin(p * 0.7) * 0.35;
      rx = -0.9 + Math.sin(p * 2.2) * 0.35; rz = -0.35 + Math.sin(p * 1.3) * 0.2;
      lx = rig.seated ? -0.85 : -0.2; lz = rig.seated ? 0.35 : 0.12;
      ux = -0.04 + Math.sin(p * 0.9) * 0.03;
      break;
    case 'listen': {
      const nod = Math.max(0, Math.sin(p * 0.9)) > 0.96 ? 0.18 : 0;
      hx = 0.08 + nod + Math.sin(p * 0.6) * 0.03; hz = Math.sin(p * 0.4) * 0.08;
      lx = rx = -0.85; lz = 0.35; rz = -0.35;
      if (rig.react && Math.sin(p * 0.37) > 0.92) { rx = -2.4; rz = -0.3; } // raises a hand to ask
      if (rig.laugh) bob = Math.max(0, Math.sin(p * 9)) * 0.012 * (Math.sin(p * 0.5) > 0.7 ? 1 : 0);
      break;
    }
    case 'weave':
      hx = 0.42; hy += Math.sin(p * 0.3) * 0.08;
      lx = -1.0 + Math.sin(p * 5.2) * 0.12; rx = -1.0 + Math.cos(p * 5.2) * 0.12;
      lz = 0.55; rz = -0.55; ux = 0.18;
      break;
    case 'watch': // daughter learning: looks at the basket, sometimes tries it
      hx = 0.35; ux = 0.12;
      lx = -0.9; lz = 0.4; rx = -1.1 + (Math.sin(p * 0.8) > 0.3 ? Math.sin(p * 6) * 0.15 : 0); rz = -0.5;
      break;
    case 'dive': { // father demonstrates: reaches into the diving basket, lifts the oyster
      const c = (Math.sin(p * 1.2) + 1) / 2;
      ux = 0.1 + c * 0.42; hx = 0.15 + c * 0.25;
      rx = -0.6 - c * 0.9; lx = -0.3 - c * 0.5; rz = -0.15; lz = 0.15;
      break;
    }
    case 'present':
      ux = 0.06; hx = 0.2; rx = -1.25 + Math.sin(p * 1.5) * 0.05; rz = -0.2; lx = -0.2;
      break;
    case 'tv':
      hy = rig.lookYaw; hx = 0.05; lx = rx = -0.85; lz = 0.35; rz = -0.35;
      break;
    case 'cheer':
      lz = 2.5 + Math.sin(p * 4) * 0.25; rz = -2.5 - Math.sin(p * 4 + 1) * 0.25; lx = rx = -0.2;
      bob = Math.abs(Math.sin(p * 4)) * 0.03 * rig.H; hy += Math.sin(p * 0.8) * 0.2;
      if (rig.seated) { lz = 1.9 + Math.sin(p * 4) * 0.2; rz = -1.9; bob = 0; }
      break;
    case 'walk':
      bob = Math.abs(Math.sin(p * 7)) * 0.025 * rig.H;
      lx = Math.sin(p * 7) * 0.4; rx = -Math.sin(p * 7) * 0.4; uz = Math.sin(p * 7) * 0.03;
      break;
  }

  rig.upper.rotation.x = damp(rig.upper.rotation.x, ux, k);
  rig.upper.rotation.z = damp(rig.upper.rotation.z, uz, k);
  rig.upper.scale.y = breathe;
  rig.head.rotation.x = damp(rig.head.rotation.x, hx, k);
  rig.head.rotation.y = damp(rig.head.rotation.y, hy, k);
  rig.head.rotation.z = damp(rig.head.rotation.z, hz, k);
  rig.armL.rotation.x = damp(rig.armL.rotation.x, lx, k); rig.armL.rotation.z = damp(rig.armL.rotation.z, lz, k);
  rig.armR.rotation.x = damp(rig.armR.rotation.x, rx, k); rig.armR.rotation.z = damp(rig.armR.rotation.z, rz, k);
  person.position.y = rig.baseY + bob;
}

// ---------------------------------------------------------------------------------
// The neighbourhood cat (black cat — Fauna category, p.25)
// ---------------------------------------------------------------------------------
export function makeCat() {
  const g = new THREE.Group(); g.name = 'cat';
  const c = mat(0x1E1E22, { rough: 0.7 });
  const body = shadowed(new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.28, 4, 8), c)); body.rotation.x = Math.PI / 2; body.position.y = 0.2; g.add(body);
  const head = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), c)); head.position.set(0, 0.3, 0.22); g.add(head);
  for (const s of [-1, 1]) {
    const ear = shadowed(new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.07, 4), c)); ear.position.set(s * 0.045, 0.39, 0.22); g.add(ear);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), mat(PALETTE.sun, { emissive: PALETTE.sun, emissiveIntensity: 0.4 }));
    eye.position.set(s * 0.032, 0.31, 0.295); g.add(eye);
  }
  const legs = [];
  for (const [x, z] of [[-0.05, 0.14], [0.05, 0.14], [-0.05, -0.14], [0.05, -0.14]]) {
    const l = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.018, 0.16, 6), c)); l.position.set(x, 0.08, z); g.add(l); legs.push(l);
  }
  const tail = new THREE.Group(); tail.position.set(0, 0.24, -0.2); g.add(tail);
  const tm = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.3, 6), c)); tm.position.y = 0.15; tail.add(tm);
  tail.rotation.x = -0.5;
  g.userData = { legs, tail };
  return g;
}
