// The old neighbourhood (فريج): board, alleys, square, sea, heritage houses, palms, ghaf, dhow.
// Architecture follows the Houses category of the official illustrations (p.26) and real
// Emirati heritage features: barjeel wind towers, danchal (mangrove roof poles), pyramid crenellations.
import * as THREE from 'three';
import { PALETTE, BOARD } from '../config.js';
import { mat, box, boxSpan, cyl, sphere, shadowed, flagTexture, doorTexture } from './materials.js';
import { makePerson, makeCat, animatePerson, setMode } from './characters.js';

const TAU = Math.PI * 2;
export const animated = []; // { update(t, dt) }

// ---------------------------------------------------------------------------
export function makeBoard() {
  const g = new THREE.Group(); g.name = 'board';
  const S = BOARD.size;
  const base = box(S, 1.1, S, PALETTE.clay, { grain: true }); base.position.y = -0.6; base.castShadow = false; g.add(base);
  const lip = box(S + 0.3, 0.12, S + 0.3, PALETTE.woodDark); lip.position.y = -1.12; lip.castShadow = false; g.add(lip);
  const top = box(S, 0.06, S, PALETTE.linen, { grain: true }); top.position.y = -0.03; top.castShadow = false; g.add(top);

  // Terracotta public square in front of the family house (brand primary ground colour)
  const square = boxSpan(-9.4, 4.4, 4.5, 13.7, 0.04, PALETTE.coral, 0, { grain: true }); square.castShadow = false; g.add(square);
  // paving joints
  for (let x = -9; x < 4.4; x += 1.4) { const j = boxSpan(x, x + 0.04, 4.5, 13.7, 0.045, PALETTE.rust, 0); j.castShadow = false; g.add(j); }
  // Alleys (sikka) — lighter sand
  for (const [x0, x1, z0, z1] of [[-10.6, -9.4, -14, 4.5], [4.4, 5.4, -8.6, 13.7], [-14, 8, -8.8, -8.2]]) {
    const a = boxSpan(x0, x1, z0, z1, 0.025, PALETTE.ivory, 0, { grain: true }); a.castShadow = false; g.add(a);
  }
  // Shore + sea
  const shore = boxSpan(7.4, 8.8, -14, 14, 0.03, PALETTE.cream, 0, { grain: true }); shore.castShadow = false; g.add(shore);
  g.add(makeSea());

  // soft contact shadow catcher for AR (sits under the board on the real table)
  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(S * 1.6, S * 1.6), new THREE.ShadowMaterial({ opacity: 0.28 }));
  catcher.rotation.x = -Math.PI / 2; catcher.position.y = -1.17; catcher.receiveShadow = true; catcher.name = 'shadowCatcher';
  g.add(catcher);
  return g;
}

function makeSea() {
  const w = 5.2, d = BOARD.size;
  const geo = new THREE.PlaneGeometry(w, d, 10, 48);
  geo.rotateX(-Math.PI / 2);
  const colors = [];
  const shallow = new THREE.Color(PALETTE.teal), deep = new THREE.Color(PALETTE.petrol);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const k = (pos.getX(i) + w / 2) / w;
    const c = shallow.clone().lerp(deep, THREE.MathUtils.smoothstep(k, 0.25, 0.9));
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.35, metalness: 0.05, flatShading: true });
  const sea = new THREE.Mesh(geo, m); sea.name = 'sea';
  sea.position.set(8.8 + w / 2, 0.06, 0); sea.receiveShadow = true;
  const base = pos.array.slice();
  animated.push({
    update(t) {
      for (let i = 0; i < pos.count; i++) {
        const x = base[i * 3], z = base[i * 3 + 2];
        pos.array[i * 3 + 1] = Math.sin(z * 0.9 + t * 1.1) * 0.035 + Math.sin(x * 2.1 - t * 1.6) * 0.02;
      }
      pos.needsUpdate = true;
    }
  });
  return sea;
}

// ---------------------------------------------------------------------------
// Heritage house
// ---------------------------------------------------------------------------
const FACES = {
  '+z': { n: [0, 0, 1], along: [1, 0, 0] }, '-z': { n: [0, 0, -1], along: [-1, 0, 0] },
  '+x': { n: [1, 0, 0], along: [0, 0, -1] }, '-x': { n: [-1, 0, 0], along: [0, 0, 1] }
};

export function makeHouse(o) {
  const { x0, x1, z0, z1, h = 3.4, color = PALETTE.linen, door = '+z', barjeel = false, flag = false, name = 'house', windowsOn = ['+z', '+x', '-x'] } = o;
  const g = new THREE.Group(); g.name = name;
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, W = x1 - x0, D = z1 - z0;
  g.add(boxSpan(x0, x1, z0, z1, h, color, 0, { grain: true }));
  const roofCol = new THREE.Color(color).multiplyScalar(0.93).getHex();
  g.add(boxSpan(x0 + 0.2, x1 - 0.2, z0 + 0.2, z1 - 0.2, 0.02, roofCol, h));
  addParapet(g, x0, x1, z0, z1, h, color);

  const faceInfo = f => {
    const F = FACES[f];
    const len = (f === '+z' || f === '-z') ? W : D;
    const c = new THREE.Vector3(cx + F.n[0] * W / 2, 0, cz + F.n[2] * D / 2);
    return { F, len, c };
  };
  // door
  if (door) {
    const { F, c } = faceInfo(door);
    const d = shadowed(new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.0, 0.1), mat(0xffffff, { map: doorTexture() })));
    d.position.set(c.x + F.n[0] * 0.04, 1.0, c.z + F.n[2] * 0.04);
    d.rotation.y = Math.atan2(F.n[0], F.n[2]);
    g.add(d);
    const lintel = box(1.4, 0.16, 0.22, PALETTE.woodDark); lintel.position.set(c.x + F.n[0] * 0.06, 2.1, c.z + F.n[2] * 0.06); lintel.rotation.y = d.rotation.y; g.add(lintel);
  }
  // windows + danchal poles
  for (const f of windowsOn) {
    const { F, len, c } = faceInfo(f);
    const n = Math.max(1, Math.floor(len / 2.4));
    for (let i = 0; i < n; i++) {
      const off = (i - (n - 1) / 2) * (len / n);
      if (f === door && Math.abs(off) < 1.2) continue;
      const px = c.x + F.along[0] * off + F.n[0] * 0.03, pz = c.z + F.along[2] * off + F.n[2] * 0.03;
      const win = box(0.55, 0.7, 0.08, 0x2A2420); win.position.set(px, h * 0.55, pz); win.rotation.y = Math.atan2(F.n[0], F.n[2]); g.add(win);
      const shutter = box(0.66, 0.1, 0.12, PALETTE.clay); shutter.position.set(px, h * 0.55 + 0.4, pz); shutter.rotation.y = win.rotation.y; g.add(shutter);
    }
    const poles = Math.floor(len / 0.8);
    for (let i = 0; i < poles; i++) {
      const off = (i - (poles - 1) / 2) * 0.8;
      const p = cyl(0.045, 0.045, 0.4, PALETTE.woodDark, 6);
      p.rotation.order = 'YXZ'; p.rotation.x = Math.PI / 2; p.rotation.y = Math.atan2(F.n[0], F.n[2]);
      p.position.set(c.x + F.along[0] * off + F.n[0] * 0.18, h - 0.32, c.z + F.along[2] * off + F.n[2] * 0.18);
      p.castShadow = false; g.add(p);
    }
  }
  if (barjeel) g.add(makeBarjeel(barjeel.x ?? (x1 - 1.0), h, barjeel.z ?? (z0 + 1.0), color));
  if (flag) g.add(makeFlagPole(flag.x ?? (x0 + 0.4), h, flag.z ?? (z1 - 0.4), flag.size ?? 1));
  return g;
}

export function addParapet(g, x0, x1, z0, z1, h, color, t = 0.22, ph = 0.42) {
  for (const [a0, a1, b0, b1] of [[x0, x1, z0, z0 + t], [x0, x1, z1 - t, z1], [x0, x0 + t, z0, z1], [x1 - t, x1, z0, z1]]) {
    g.add(boxSpan(a0, a1, b0, b1, ph, color, h));
  }
  // pyramid crenellations (shurfat)
  const crenel = new THREE.ConeGeometry(0.17, 0.32, 4);
  const cm = mat(color, { grain: true });
  const put = (x, z) => { const c = shadowed(new THREE.Mesh(crenel, cm)); c.position.set(x, h + ph + 0.15, z); c.rotation.y = Math.PI / 4; g.add(c); };
  for (let x = x0 + 0.3; x < x1 - 0.1; x += 0.75) { put(x, z1 - t / 2); put(x, z0 + t / 2); }
  for (let z = z0 + 1.05; z < z1 - 0.4; z += 0.75) { put(x0 + t / 2, z); put(x1 - t / 2, z); }
}

export function makeBarjeel(x, y, z, color = PALETTE.ivory) {
  const g = new THREE.Group(); g.name = 'barjeel';
  const s = 1.45, h = 2.7;
  g.add(boxSpan(x - s / 2, x + s / 2, z - s / 2, z + s / 2, h, color, y, { grain: true }));
  const slot = mat(0x2A2420);
  for (const f of Object.values(FACES)) {
    for (let i = -1; i <= 1; i++) {
      const b = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.2, h * 0.62, 0.06), slot));
      b.position.set(x + f.n[0] * (s / 2 + 0.01) + f.along[0] * i * 0.4, y + h * 0.55, z + f.n[2] * (s / 2 + 0.01) + f.along[2] * i * 0.4);
      b.rotation.y = Math.atan2(f.n[0], f.n[2]); g.add(b);
    }
  }
  // X-shaped vanes are inside; cap + poles
  g.add(boxSpan(x - s / 2 - 0.08, x + s / 2 + 0.08, z - s / 2 - 0.08, z + s / 2 + 0.08, 0.14, color, y + h));
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const p = cyl(0.035, 0.035, 0.5, PALETTE.woodDark, 5); p.rotation.z = Math.PI / 2;
    p.position.set(x + dx * (s / 2 + 0.05), y + h * 0.94, z + dz * 0.3); g.add(p);
  }
  return g;
}

// ---------------------------------------------------------------------------
// Flags (waving)
// ---------------------------------------------------------------------------
const flagTex = { t: null };
export function makeFlag(w = 1.3, h = 0.65) {
  if (!flagTex.t) flagTex.t = flagTexture();
  const geo = new THREE.PlaneGeometry(w, h, 12, 4); geo.translate(w / 2, 0, 0);
  const m = new THREE.MeshStandardMaterial({ map: flagTex.t, side: THREE.DoubleSide, roughness: 0.8, flatShading: false });
  const f = shadowed(new THREE.Mesh(geo, m)); f.name = 'flag'; f.userData.dynamic = true;
  const pos = geo.attributes.position; const base = pos.array.slice();
  const ph = Math.random() * 10;
  animated.push({
    update(t) {
      for (let i = 0; i < pos.count; i++) {
        const x = base[i * 3];
        pos.array[i * 3 + 2] = Math.sin(x * 5 - t * 4 + ph) * 0.07 * (x / w);
      }
      pos.needsUpdate = true; geo.computeVertexNormals();
    }
  });
  return f;
}

export function makeFlagPole(x, y, z, size = 1, poleH = 3.2) {
  const g = new THREE.Group(); g.name = 'flagpole';
  const pole = cyl(0.04, 0.05, poleH * size, PALETTE.ash, 8); pole.position.set(x, y + poleH * size / 2, z); g.add(pole);
  const knob = sphere(0.07 * size, PALETTE.brass, 8, 6, { metal: 0.5, rough: 0.4 }); knob.position.set(x, y + poleH * size + 0.03, z); g.add(knob);
  const flag = makeFlag(1.3 * size, 0.65 * size); flag.position.set(x + 0.04, y + poleH * size - 0.38 * size, z); g.add(flag);
  g.userData.flag = flag; g.userData.top = y + poleH * size - 0.38 * size; g.userData.bottom = y + 0.5;
  return g;
}

// ---------------------------------------------------------------------------
// Nature: date palm (p.24 Flora), ghaf tree (national tree)
// ---------------------------------------------------------------------------
function frondGeometry(len = 2.4, width = 0.55, lift = 0.55, droop = 1.1) {
  const geo = new THREE.PlaneGeometry(width, len, 2, 8);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i) + len / 2; const k = y / len;
    const taper = 1 - k * 0.8;
    p.setXYZ(i, x * taper, y * Math.sin(lift) - droop * k * k, y * Math.cos(lift));
  }
  geo.computeVertexNormals();
  return geo;
}
const frondGeos = [frondGeometry(2.5, 0.6, 0.6, 1.2), frondGeometry(2.1, 0.5, 0.9, 0.9)];

export function makePalm(h = 5.2, seed = 1) {
  const g = new THREE.Group(); g.name = 'palm';
  const segs = 9; let y = 0; let x = 0;
  const lean = (seed % 3 - 1) * 0.03;
  for (let i = 0; i < segs; i++) {
    const sh = h / segs;
    const s = cyl(0.17 - i * 0.008, 0.2 - i * 0.008, sh * 1.02, i % 2 ? 0x9A7350 : 0x8A6545, 7);
    x += lean; s.position.set(x, y + sh / 2, 0); g.add(s); y += sh;
  }
  const crown = new THREE.Group(); crown.position.set(x, y, 0); crown.userData.dynamic = true; g.add(crown);
  const fm = [mat(PALETTE.frond, { side: THREE.DoubleSide }), mat(PALETTE.olive, { side: THREE.DoubleSide })];
  const n = 12;
  for (let i = 0; i < n; i++) {
    const f = shadowed(new THREE.Mesh(frondGeos[i % 2], fm[i % 2]));
    f.rotation.y = (i / n) * TAU + seed; crown.add(f);
  }
  for (let i = 0; i < 3; i++) { // date clusters
    const d = sphere(0.18, PALETTE.orange, 6, 5); d.scale.set(1, 1.4, 1);
    const a = i * 2.1 + seed; d.position.set(Math.cos(a) * 0.25, -0.25, Math.sin(a) * 0.25); crown.add(d);
  }
  const ph = seed * 1.7;
  animated.push({ update(t) { crown.rotation.z = Math.sin(t * 0.8 + ph) * 0.05; crown.rotation.x = Math.cos(t * 0.6 + ph) * 0.03; } });
  return g;
}

export function makeGhaf(seed = 2) {
  const g = new THREE.Group(); g.name = 'ghaf';
  const bark = 0x6E5440;
  const t1 = cyl(0.2, 0.32, 1.8, bark, 7); t1.position.set(0, 0.9, 0); t1.rotation.z = 0.12; g.add(t1);
  const t2 = cyl(0.12, 0.18, 1.6, bark, 6); t2.position.set(0.35, 2.3, 0.1); t2.rotation.z = -0.5; g.add(t2);
  const t3 = cyl(0.1, 0.16, 1.5, bark, 6); t3.position.set(-0.4, 2.2, -0.1); t3.rotation.z = 0.6; g.add(t3);
  const leaves = [mat(0x8A9A6B, { rough: 1 }), mat(PALETTE.olive, { rough: 1 }), mat(0xA3B18A, { rough: 1 })];
  const blobs = [[0, 3.4, 0, 1.7], [1.3, 3.0, 0.4, 1.2], [-1.3, 3.0, -0.2, 1.25], [0.4, 3.0, -1.1, 1.1], [-0.5, 3.1, 1.1, 1.15], [0.2, 4.1, 0.2, 1.0]];
  const crown = new THREE.Group(); crown.userData.dynamic = true; g.add(crown);
  blobs.forEach(([x, y, z, r], i) => {
    const b = shadowed(new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), leaves[i % 3]));
    b.position.set(x, y, z); b.scale.y = 0.62; crown.add(b);
  });
  animated.push({ update(t) { crown.rotation.y = Math.sin(t * 0.3 + seed) * 0.03; } });
  return g;
}

// ---------------------------------------------------------------------------
// Sea craft: pearling dhow + small abra; wooden jetty
// ---------------------------------------------------------------------------
export function makeDhow(len = 4.8, sail = true) {
  const g = new THREE.Group(); g.name = 'dhow'; g.userData.dynamic = true;
  const hull = shadowed(new THREE.Mesh(new THREE.SphereGeometry(1, 18, 8, 0, TAU, Math.PI / 2, Math.PI / 2), mat(PALETTE.clay, { side: THREE.DoubleSide })));
  hull.scale.set(0.95, 0.85, len / 2); hull.position.y = 0.55; g.add(hull);
  const rim = shadowed(new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 5, 24), mat(PALETTE.woodDark)));
  rim.rotation.x = Math.PI / 2; rim.scale.set(0.95, len / 2, 1); rim.position.y = 0.55; g.add(rim);
  const deck = box(1.5, 0.05, len * 0.8, PALETTE.wood); deck.position.y = 0.42; g.add(deck);
  const stem = box(0.12, 0.9, 0.5, PALETTE.woodDark); stem.position.set(0, 0.85, len / 2 - 0.05); stem.rotation.x = 0.5; g.add(stem);
  const stern = box(1.1, 0.5, 0.25, PALETTE.woodDark); stern.position.set(0, 0.8, -len / 2 + 0.25); g.add(stern);
  if (sail) {
    const mast = cyl(0.05, 0.07, 3.6, PALETTE.woodDark, 6); mast.position.set(0, 2.2, len * 0.12); mast.rotation.x = 0.12; g.add(mast);
    const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(3.4, 0.3); shape.lineTo(-0.6, 3.6); shape.lineTo(0, 0);
    const sailM = shadowed(new THREE.Mesh(new THREE.ShapeGeometry(shape), mat(PALETTE.ivory, { side: THREE.DoubleSide })));
    sailM.rotation.y = -Math.PI / 2; sailM.position.set(0.05, 0.9, len * 0.12 - 1.5); g.add(sailM);
    const yard = cyl(0.03, 0.03, 4.4, PALETTE.woodDark, 5); yard.position.set(0.05, 2.5, len * 0.12 + 0.05); yard.rotation.x = Math.PI / 2 - 0.85; g.add(yard);
  }
  const ph = Math.random() * 6;
  animated.push({ update(t) { g.rotation.z = Math.sin(t * 0.9 + ph) * 0.035; g.position.y = Math.sin(t * 1.2 + ph) * 0.04; } });
  return g;
}

export function makeJetty() {
  const g = new THREE.Group(); g.name = 'jetty';
  for (let x = 7.3; x < 10.8; x += 0.32) { const p = boxSpan(x, x + 0.28, 1.5, 2.7, 0.08, PALETTE.wood, 0.32); g.add(p); }
  for (const x of [7.6, 8.8, 10.0, 10.6]) for (const z of [1.55, 2.65]) { const post = cyl(0.07, 0.07, 0.75, PALETTE.woodDark, 6); post.position.set(x, 0.3, z); g.add(post); }
  return g;
}

// ---------------------------------------------------------------------------
// Neighbourhood life: two neighbours walking and the black cat
// ---------------------------------------------------------------------------
function walkAlong(obj, pts, speed) {
  const segs = []; let total = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]); segs.push({ a, b, l }); total += l;
  }
  let s = Math.random() * total;
  return dt => {
    s = (s + dt * speed) % total;
    let acc = 0;
    for (const sg of segs) {
      if (s <= acc + sg.l) {
        const k = (s - acc) / sg.l;
        obj.position.x = sg.a[0] + (sg.b[0] - sg.a[0]) * k;
        obj.position.z = sg.a[1] + (sg.b[1] - sg.a[1]) * k;
        const target = Math.atan2(sg.b[0] - sg.a[0], sg.b[1] - sg.a[1]);
        let d = target - obj.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d));
        obj.rotation.y += d * Math.min(1, dt * 5);
        return;
      }
      acc += sg.l;
    }
  };
}

export function makeLife() {
  const g = new THREE.Group(); g.name = 'life'; g.userData.dynamic = true;
  const neighbour = makePerson({ name: 'neighbour-man', kind: 'man', height: 1.74, skin: PALETTE.skin2, beard: 0x3B2A20 });
  const neighbour2 = makePerson({ name: 'neighbour-woman', kind: 'woman', height: 1.62, robe: PALETTE.abaya, under: PALETTE.olive, skin: PALETTE.skin3 });
  setMode(neighbour, 'walk'); setMode(neighbour2, 'walk');
  g.add(neighbour, neighbour2);
  const w1 = walkAlong(neighbour, [[-8.4, 12.6], [3.4, 12.6], [3.4, 6.2], [-8.4, 6.2]], 0.7);
  const w2 = walkAlong(neighbour2, [[-10, -8.5], [-10, 3.8], [-6, 12.9], [6.2, 12.9], [4.9, 8], [4.9, -8.5]], 0.55);
  const cat = makeCat(); g.add(cat);
  const wc = walkAlong(cat, [[4.9, -7.6], [4.9, 11.5]], 0.6);
  animated.push({
    update(t, dt) {
      w1(dt); w2(dt); wc(dt);
      animatePerson(neighbour, t, dt); animatePerson(neighbour2, t, dt);
      const { legs, tail } = cat.userData;
      legs.forEach((l, i) => { l.rotation.x = Math.sin(t * 9 + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI : 0)) * 0.45; });
      tail.rotation.z = Math.sin(t * 2.2) * 0.35;
    }
  });
  return g;
}

// ---------------------------------------------------------------------------
export function makeNeighbourhood() {
  const g = new THREE.Group(); g.name = 'neighbourhood';
  const H = (o) => g.add(makeHouse(o));
  // North row
  H({ name: 'house-a', x0: -13.6, x1: -10.9, z0: -13.6, z1: -9.2, h: 3.3, color: PALETTE.peach, door: '+z' });
  H({ name: 'house-b', x0: -9.4, x1: -4.2, z0: -13.6, z1: -9.0, h: 4.0, color: PALETTE.linen, door: '+z', barjeel: { x: -5.4, z: -12.2 } });
  H({ name: 'house-c', x0: -3.6, x1: 2.0, z0: -13.6, z1: -9.2, h: 3.6, color: PALETTE.cream, door: '+z', flag: { x: 1.4, z: -12.8 } });
  H({ name: 'house-d', x0: 2.6, x1: 7.0, z0: -13.6, z1: -9.4, h: 3.1, color: PALETTE.peach, door: '+z', windowsOn: ['+z', '+x'] });
  // West
  H({ name: 'house-e', x0: -13.6, x1: -11.0, z0: -8.0, z1: -1.4, h: 3.7, color: PALETTE.ivory, door: '+x', barjeel: { x: -12.3, z: -6.6 }, windowsOn: ['+x', '+z'] });
  H({ name: 'house-f', x0: -13.6, x1: -11.0, z0: -0.6, z1: 4.4, h: 3.2, color: PALETTE.linen, door: '+x', windowsOn: ['+x', '+z'] });
  // East (between family house and shore)
  H({ name: 'house-g', x0: 5.6, x1: 7.2, z0: -7.8, z1: -3.6, h: 2.9, color: PALETTE.cream, door: '-x', windowsOn: ['-x', '+z'] });
  // South corners
  H({ name: 'house-h', x0: -13.6, x1: -10.0, z0: 9.8, z1: 13.6, h: 3.4, color: PALETTE.peach, door: '+x', flag: { x: -13.2, z: 10.2 }, windowsOn: ['+x', '-z'] });
  H({ name: 'house-i', x0: 5.6, x1: 7.2, z0: 9.8, z1: 13.6, h: 2.8, color: PALETTE.linen, door: '-x', windowsOn: ['-x', '-z'] });

  // Palms and the ghaf tree
  const palms = [[-8.6, 12.7, 5.4], [6.3, 6.4, 5.8], [6.5, -1.6, 5.0], [4.0, 12.9, 4.6], [-12.4, 5.6, 4.8], [7.6, 8.8, 5.6]];
  palms.forEach(([x, z, h], i) => { const p = makePalm(h, i + 1); p.position.set(x, 0, z); g.add(p); });
  const ghaf = makeGhaf(); ghaf.position.set(-12.2, 0, 7.4); g.add(ghaf);

  // Sea craft
  const dhow = makeDhow(4.8, true); dhow.position.set(11.3, 0, -3.5); g.add(dhow);
  const abra = makeDhow(2.6, false); abra.position.set(11.8, 0, 6.5); abra.rotation.y = 0.3; g.add(abra);
  g.add(makeJetty());

  // Water well in the square (taweeh) — small heritage detail
  const well = cyl(0.55, 0.6, 0.6, PALETTE.stone, 10, { grain: true }); well.position.set(2.4, 0.3, 11.6); g.add(well);
  const hole = cyl(0.42, 0.42, 0.02, 0x2A2420, 10); hole.position.set(2.4, 0.61, 11.6); g.add(hole);
  for (const s of [-1, 1]) { const p = cyl(0.05, 0.05, 1.3, PALETTE.woodDark, 5); p.position.set(2.4 + s * 0.5, 0.95, 11.6); g.add(p); }
  const bar = cyl(0.04, 0.04, 1.1, PALETTE.woodDark, 5); bar.rotation.z = Math.PI / 2; bar.position.set(2.4, 1.55, 11.6); g.add(bar);

  return { group: g, dhow };
}
